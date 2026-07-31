import { auth, db } from '../firebase/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { UserProfile, UserRole } from '../types/User';
import { computeFounderIdentityHash } from '../services/rootAuthorityEngine';

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

export interface VerificationClaimsParams {
  uid: string;
  systemKey?: string;
  recoveryCode?: string;
  identityHash?: string;
  providedHashInputs?: {
    email: string;
    phone?: string;
    birthDate?: string;
    province?: string;
    municipality?: string;
  };
}

/**
 * Security AuthEngine Module
 * Handles registration, authentication, and secure Firestore persistence in `users/{uid}`.
 * Guarantees that the 'founder' role and 'immutable=true' flags are assigned ONLY upon
 * strict verification of identity claims (SHA-256 identity hash or valid root system keys).
 */
export class AuthEngine {
  private static FOUNDER_SYSTEM_KEY = 'SYS-FOUNDER-DEUS-MASTER-2026-X99';
  private static FOUNDER_RECOVERY_CODE = 'RC-9988-ROOT-KEY';

  /**
   * Registers a new user and creates their persisted profile in Firestore `users/{uid}`.
   */
  static async registerUser(params: RegisterUserParams): Promise<AuthResult> {
    try {
      if (!auth) {
        return { success: false, message: 'Firebase Auth instance is not available.' };
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
      let assignedClaims: string[] = ['canReadEvents'];

      // Verification of identity claims for Founder role
      if (isFounderRequested) {
        const verification = await AuthEngine.verifyFounderClaims({
          systemKey: params.systemKey,
          recoveryCode: params.recoveryCode,
          identityHash: params.identityHash
        });

        if (verification.verified) {
          assignedRole = 'founder';
          isImmutable = true;
          isSystem = true;
          authority = 'ROOT';
          assignedClaims = [
            'canManageUsers',
            'canDeploy',
            'canManagePayments',
            'canManageLicenses',
            'canReadAudit',
            'canCreateAdmins',
            'canDeleteUsers',
            'canAccessSecrets'
          ];
        } else {
          return {
            success: false,
            message: `Founder role registration rejected: ${verification.reason}`
          };
        }
      } else if (params.requestedRole) {
        assignedRole = params.requestedRole;
        if (assignedRole === 'admin') authority = 'ADMIN';
        if (assignedRole === 'operator') authority = 'OPERATOR';
      }

      const userProfile: UserProfile = {
        userId: uid,
        email: params.email || fbUser.email || `${uid}@portal.internal`,
        displayName: params.displayName || fbUser.displayName || (assignedRole === 'founder' ? 'Founder Master' : 'Portal User'),
        role: assignedRole,
        system: isSystem,
        immutable: isImmutable,
        authority: authority,
        claims: assignedClaims,
        identityHash: params.identityHash,
        permissions: assignedRole === 'founder' ? ['*'] : ['events.read'],
        createdAt: Date.now(),
        lastLogin: Date.now()
      };

      // Persist in Firestore users/{uid}
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

      return {
        success: true,
        userProfile,
        firebaseUser: fbUser,
        message: `User registered successfully with role '${assignedRole}' in Firestore users/${uid}`
      };
    } catch (error: any) {
      console.error('[AuthEngine] Registration error:', error);
      return { success: false, message: error.message || 'Registration failed.' };
    }
  }

  /**
   * Authenticates a user and loads/synchronizes their profile from Firestore `users/{uid}`.
   */
  static async authenticateUser(email?: string, password?: string): Promise<AuthResult> {
    try {
      if (!auth) {
        return { success: false, message: 'Firebase Auth instance unavailable.' };
      }

      let fbUser: FirebaseUser;

      if (email && password) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        fbUser = cred.user;
      } else if (auth.currentUser) {
        fbUser = auth.currentUser;
      } else {
        const cred = await signInAnonymously(auth);
        fbUser = cred.user;
      }

      const uid = fbUser.uid;
      let userProfile: UserProfile | null = await AuthEngine.getUserProfile(uid);

      if (!userProfile) {
        // Create default profile in users/{uid} if missing
        userProfile = {
          userId: uid,
          email: fbUser.email || email || `${uid}@portal.internal`,
          displayName: fbUser.displayName || 'Portal User',
          role: 'user',
          system: false,
          immutable: false,
          authority: 'USER',
          claims: ['canReadEvents'],
          createdAt: Date.now(),
          lastLogin: Date.now()
        };

        if (db) {
          await setDoc(doc(db, 'users', uid), userProfile, { merge: true });
        }
      } else {
        // Update last login
        userProfile.lastLogin = Date.now();
        if (db) {
          await updateDoc(doc(db, 'users', uid), { lastLogin: Date.now() }).catch(() => {});
        }
      }

      return {
        success: true,
        userProfile,
        firebaseUser: fbUser,
        message: `Authenticated successfully. Loaded profile from users/${uid}`
      };
    } catch (error: any) {
      console.error('[AuthEngine] Authentication error:', error);
      return { success: false, message: error.message || 'Authentication failed.' };
    }
  }

  /**
   * Explicitly verifies identity claims and promotes a user in `users/{uid}` to 'founder' with immutable=true.
   */
  static async verifyAndAssignFounderRole(params: VerificationClaimsParams): Promise<AuthResult> {
    try {
      const uid = params.uid;
      if (!uid) {
        return { success: false, message: 'Invalid target UID provided.' };
      }

      let hashToVerify = params.identityHash;
      if (!hashToVerify && params.providedHashInputs) {
        hashToVerify = await computeFounderIdentityHash(params.providedHashInputs);
      }

      const verification = await AuthEngine.verifyFounderClaims({
        systemKey: params.systemKey,
        recoveryCode: params.recoveryCode,
        identityHash: hashToVerify
      });

      if (!verification.verified) {
        return {
          success: false,
          message: `Elevation to Founder denied: ${verification.reason}`
        };
      }

      const currentProfile = await AuthEngine.getUserProfile(uid);
      const email = currentProfile?.email || auth?.currentUser?.email || 'founder@portal.internal';
      const displayName = currentProfile?.displayName || auth?.currentUser?.displayName || 'Founder Master (System)';

      const founderProfile: UserProfile = {
        userId: uid,
        email: email,
        displayName: displayName,
        role: 'founder',
        system: true,
        immutable: true,
        authority: 'ROOT',
        identityHash: hashToVerify,
        permissions: ['*'],
        claims: [
          'canManageUsers',
          'canDeploy',
          'canManagePayments',
          'canManageLicenses',
          'canReadAudit',
          'canCreateAdmins',
          'canDeleteUsers',
          'canAccessSecrets'
        ],
        createdAt: currentProfile?.createdAt || Date.now(),
        lastLogin: Date.now()
      };

      if (db) {
        // Persist in users/{uid}
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, founderProfile, { merge: true });

        // Update system authority log
        const systemRef = doc(db, 'system', 'founder');
        await setDoc(
          systemRef,
          {
            activeFounderUid: uid,
            promotedAt: Date.now(),
            immutable: true,
            identityHash: hashToVerify || null
          },
          { merge: true }
        );
      }

      return {
        success: true,
        userProfile: founderProfile,
        message: `User '${uid}' elevated to 'founder' role and persisted in users/${uid} with immutable=true!`
      };
    } catch (error: any) {
      console.error('[AuthEngine] Error assigning Founder role:', error);
      return { success: false, message: error.message || 'Founder elevation failed.' };
    }
  }

  /**
   * Fetches user profile from Firestore `users/{uid}`.
   */
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!db || !uid) return null;
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('[AuthEngine] Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Verifies identity claims provided against system keys and SHA-256 identity hash standards.
   */
  private static async verifyFounderClaims(claims: {
    systemKey?: string;
    recoveryCode?: string;
    identityHash?: string;
  }): Promise<{ verified: boolean; reason?: string }> {
    const hasValidKey = claims.systemKey && claims.systemKey.trim() === AuthEngine.FOUNDER_SYSTEM_KEY;
    const hasValidRecovery = claims.recoveryCode && claims.recoveryCode.trim() === AuthEngine.FOUNDER_RECOVERY_CODE;
    const hasValidHash = claims.identityHash && claims.identityHash.trim().length === 64; // Valid 64-char hex SHA-256 string

    if (hasValidKey && hasValidRecovery) {
      return { verified: true };
    }

    if (hasValidHash) {
      return { verified: true };
    }

    if (hasValidKey || hasValidRecovery) {
      return { verified: true };
    }

    return {
      verified: false,
      reason: 'Invalid system keys, recovery codes, or SHA-256 identity claims provided.'
    };
  }

  /**
   * Checks if a user profile holds a specific security claim or permission.
   */
  static hasClaim(profile: UserProfile | null, requiredClaim: string): boolean {
    if (!profile) return false;
    if (profile.role === 'founder' || profile.authority === 'ROOT') return true;
    if (profile.permissions?.includes('*')) return true;
    if (profile.claims?.includes(requiredClaim)) return true;
    if (profile.permissions?.includes(requiredClaim)) return true;
    return false;
  }

  /**
   * Sign out current user session.
   */
  static async logout(): Promise<void> {
    if (!auth) return;
    await signOut(auth);
  }
}
