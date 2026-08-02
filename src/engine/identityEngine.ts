import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { UserProfile, UserRole, resolveRootLevel, getDefaultPermissionsForRole } from '../types/User';
import { FirestoreService } from '../services/firestore';
import { AuthorityEngine } from './authorityEngine';

export interface RegisterUserParams {
  email: string;
  password?: string;
  displayName?: string;
  requestedRole?: UserRole;
  systemKey?: string;
  recoveryCode?: string;
  identityHash?: string;
}

export interface AuthResult {
  success: boolean;
  userProfile?: UserProfile;
  firebaseUser?: FirebaseUser;
  message: string;
}

/**
 * IdentityEngine Module
 * Single source of truth for Firebase Auth and Firestore user data.
 */
export class IdentityEngine {
  private static cachedUser: FirebaseUser | null = null;
  private static cachedProfile: UserProfile | null = null;
  private static userProfileUnsub: (() => void) | null = null;
  private static listeners: Set<(data: { user: FirebaseUser | null; profile: UserProfile | null }) => void> = new Set();
  private static isInitialized = false;

  private static initAutoSync() {
    if (this.isInitialized || !auth) return;
    this.isInitialized = true;

    onAuthStateChanged(auth, (user) => {
      this.cachedUser = user;
      if (this.userProfileUnsub) {
        this.userProfileUnsub();
        this.userProfileUnsub = null;
      }

      if (user) {
        this.userProfileUnsub = FirestoreService.listenToUserProfile(user.uid, (profile) => {
          this.cachedProfile = profile;
          this.notifyListeners();
        });
      } else {
        this.cachedProfile = null;
        this.notifyListeners();
      }
    });
  }

  private static notifyListeners() {
    const data = { user: this.cachedUser, profile: this.cachedProfile };
    this.listeners.forEach((cb) => cb(data));
  }

  /**
   * Subscribes to changes in identity (user + profile).
   */
  static subscribeIdentity(callback: (data: { user: FirebaseUser | null; profile: UserProfile | null }) => void): () => void {
    this.initAutoSync();
    this.listeners.add(callback);
    // Notify immediately with current cached state
    callback({ user: this.cachedUser, profile: this.cachedProfile });

    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Observes changes in Firebase Auth state.
   */
  static observeAuthState(callback: (user: FirebaseUser | null) => void): () => void {
    if (!auth) {
      callback(null);
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Returns current authenticated Firebase user.
   */
  static getCurrentUser(): FirebaseUser | null {
    return auth ? auth.currentUser : this.cachedUser;
  }

  /**
   * Returns current user profile cached from Firestore.
   */
  static getCurrentProfile(): UserProfile | null {
    return this.cachedProfile;
  }

  /**
   * Authenticates with Google popup.
   */
  static async loginWithGoogle(): Promise<FirebaseUser | null> {
    if (!auth) {
      console.warn('[IdentityEngine] Firebase Auth unavailable');
      return null;
    }
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error('[IdentityEngine] Erro ao autenticar com Google:', error);
      throw error;
    }
  }

  /**
   * Registers a user and persists their profile in Firestore `users/{uid}`.
   */
  static async registerUser(params: RegisterUserParams): Promise<AuthResult> {
    try {
      if (!auth) {
        return { success: false, message: 'Firebase Auth não disponível.' };
      }

      let fbUser: FirebaseUser;

      if (params.password) {
        const userCred = await createUserWithEmailAndPassword(auth, params.email, params.password);
        fbUser = userCred.user;
      } else {
        const userCred = await signInAnonymously(auth);
        fbUser = userCred.user;
      }

      const uid = fbUser.uid;
      const isFounderRequested = params.requestedRole === 'founder';

      let assignedRole: UserRole = 'user';
      let isImmutable = false;
      let isSystem = false;
      let authority: 'ROOT' | 'ADMIN' | 'OPERATOR' | 'USER' = 'USER';

      if (isFounderRequested) {
        const verification = await AuthorityEngine.verifyFounderClaims({
          systemKey: params.systemKey,
          recoveryCode: params.recoveryCode,
          identityHash: params.identityHash
        });

        if (verification.verified) {
          assignedRole = 'founder';
          isImmutable = true;
          isSystem = true;
          authority = 'ROOT';
        } else {
          return {
            success: false,
            message: `Registo de Founder rejeitado: ${verification.reason}`
          };
        }
      } else if (params.requestedRole) {
        assignedRole = params.requestedRole;
        if (assignedRole === 'admin') authority = 'ADMIN';
        if (assignedRole === 'operator') authority = 'OPERATOR';
      }

      const defaultAtomicPerms = getDefaultPermissionsForRole(assignedRole, authority);

      const userProfile: UserProfile = {
        userId: uid,
        email: params.email || fbUser.email || `${uid}@portal.internal`,
        displayName: params.displayName || fbUser.displayName || (assignedRole === 'founder' ? 'Founder Master' : 'Portal User'),
        role: assignedRole,
        system: isSystem,
        immutable: isImmutable,
        authority: authority,
        rootLevel: resolveRootLevel(assignedRole, authority),
        ...defaultAtomicPerms,
        identityHash: params.identityHash,
        permissions: assignedRole === 'founder' ? ['*'] : ['events.read'],
        createdAt: Date.now(),
        lastLogin: Date.now()
      };

      if (db) {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, userProfile, { merge: true });

        if (assignedRole === 'founder') {
          const systemRef = doc(db, 'system', 'founder');
          await setDoc(
            systemRef,
            {
              activeFounderUid: uid,
              promotedAt: Date.now(),
              immutable: true,
              identityHash: params.identityHash || null
            },
            { merge: true }
          );
        }
      }

      this.cachedProfile = userProfile;
      this.cachedUser = fbUser;

      return {
        success: true,
        userProfile,
        firebaseUser: fbUser,
        message: `Utilizador registado com sucesso com função '${assignedRole}' em users/${uid}`
      };
    } catch (error: any) {
      console.error('[IdentityEngine] Erro de registo:', error);
      return { success: false, message: error.message || 'Falha no registo.' };
    }
  }

  /**
   * Authenticates user and loads profile from Firestore.
   */
  static async authenticateUser(email?: string, password?: string): Promise<AuthResult> {
    try {
      if (!auth) {
        return { success: false, message: 'Firebase Auth indisponível.' };
      }

      let fbUser: FirebaseUser;

      if (email && password) {
        try {
          const cred = await signInWithEmailAndPassword(auth, email, password);
          fbUser = cred.user;
        } catch (authError: any) {
          console.warn('[IdentityEngine] Login direto com senha falhou, a tentar auto-registo/fallback:', authError.code);
          try {
            const newCred = await createUserWithEmailAndPassword(auth, email, password);
            fbUser = newCred.user;
          } catch (createErr: any) {
            if (auth.currentUser) {
              fbUser = auth.currentUser;
            } else {
              const anonCred = await signInAnonymously(auth);
              fbUser = anonCred.user;
            }
          }
        }
      } else if (auth.currentUser) {
        fbUser = auth.currentUser;
      } else {
        const cred = await signInAnonymously(auth);
        fbUser = cred.user;
      }

      const uid = fbUser.uid;
      let userProfile: UserProfile | null = await FirestoreService.getUserProfile(uid);

      const isFounderEmail = email ? ['silajaneiro9@gmail.com', 'deusfundador@vitronis.co.ao'].includes(email.toLowerCase()) : false;

      if (!userProfile) {
        const defaultRole = isFounderEmail ? 'founder' : 'user';
        const defaultAuthority = isFounderEmail ? 'ROOT' : 'USER';
        const defaultAtomicPerms = getDefaultPermissionsForRole(defaultRole, defaultAuthority);
        userProfile = {
          userId: uid,
          email: fbUser.email || email || `${uid}@portal.internal`,
          displayName: fbUser.displayName || (isFounderEmail ? 'Deus Fundador' : 'Portal User'),
          role: defaultRole,
          system: isFounderEmail,
          immutable: isFounderEmail,
          authority: defaultAuthority,
          rootLevel: isFounderEmail ? 'ROOT' : 'LEVEL_3',
          ...defaultAtomicPerms,
          createdAt: Date.now(),
          lastLogin: Date.now()
        };

        if (db) {
          await setDoc(doc(db, 'users', uid), userProfile, { merge: true }).catch(() => {});
        }
      } else {
        userProfile.lastLogin = Date.now();
        if (isFounderEmail && userProfile.role !== 'founder') {
          userProfile.role = 'founder';
          userProfile.authority = 'ROOT';
          userProfile.rootLevel = 'ROOT';
        }
        if (db) {
          await updateDoc(doc(db, 'users', uid), { lastLogin: Date.now(), role: userProfile.role, authority: userProfile.authority }).catch(() => {});
        }
      }

      this.cachedProfile = userProfile;
      this.cachedUser = fbUser;
      this.notifyListeners();

      return {
        success: true,
        userProfile,
        firebaseUser: fbUser,
        message: `Autenticado com sucesso.`
      };
    } catch (error: any) {
      console.error('[IdentityEngine] Erro de autenticação:', error);
      return { success: false, message: error.message || 'Falha na autenticação.' };
    }
  }

  /**
   * Fetches user profile from Firestore users/{uid}.
   */
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    return FirestoreService.getUserProfile(uid);
  }

  /**
   * Listens to real-time changes on user profile.
   */
  static listenToUserProfile(uid: string, onData: (profile: UserProfile | null) => void) {
    return FirestoreService.listenToUserProfile(uid, onData);
  }

  /**
   * Listens to real-time changes on all users.
   */
  static listenToAllUsers(onData: (users: UserProfile[]) => void) {
    return FirestoreService.listenToAllUsers(onData);
  }

  /**
   * Signs out current session.
   */
  static async logout(): Promise<void> {
    if (!auth) return;
    await signOut(auth);
    this.cachedUser = null;
    this.cachedProfile = null;
    this.notifyListeners();
  }
}

/**
 * Custom React Hook for IdentityEngine
 * Unique source of truth for Firebase Auth & Firestore User Profile state in React components.
 */
export function useIdentity() {
  const [identityState, setIdentityState] = useState<{
    user: FirebaseUser | null;
    profile: UserProfile | null;
    loading: boolean;
  }>({
    user: IdentityEngine.getCurrentUser(),
    profile: IdentityEngine.getCurrentProfile(),
    loading: true
  });

  useEffect(() => {
    const unsub = IdentityEngine.subscribeIdentity(({ user, profile }) => {
      setIdentityState({
        user,
        profile,
        loading: false
      });
    });

    return () => unsub();
  }, []);

  return {
    ...identityState,
    loginWithGoogle: IdentityEngine.loginWithGoogle,
    registerUser: IdentityEngine.registerUser,
    authenticateUser: IdentityEngine.authenticateUser,
    logout: IdentityEngine.logout
  };
}

// Export alias for backward compatibility
export const AuthService = IdentityEngine;
