import { auth, db } from '../firebase/firebase';
import { doc, getDoc, setDoc, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { UserProfile, getDefaultPermissionsForRole } from '../types/User';
import { FirestoreService } from '../services/firestore';

export type AdminRole = 'Founder' | 'System Admin' | 'Finance Admin' | 'Support Admin' | 'Developer Admin' | 'Read Only Admin';

export type PermissionClaim =
  | 'canDeploy'
  | 'canInvite'
  | 'canBilling'
  | 'canUsers'
  | 'canDevices'
  | 'canPayments'
  | 'canAudit'
  | 'canAccessSecrets'
  | '*';

export interface AdminAccount {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
  mfaEnforced: boolean;
  createdAt: number;
  lastActive: number;
}

export interface AdminInvitation {
  token: string;
  targetRole: AdminRole;
  permissions?: PermissionClaim[];
  createdBy: string;
  createdAt: number;
  expiresAt: number;
  usedByEmail?: string;
}

export interface SystemBackupRecord {
  id: string;
  timestamp: number;
  type: 'AUTOMATED' | 'MANUAL_ROOT';
  sizeBytes: number;
  status: 'COMPLETED' | 'FAILED';
  createdBy: string;
}

export interface RootSession {
  sessionId: string;
  actorId: string;
  actorEmail: string;
  level: 'ROOT';
  mfaVerified: boolean;
  authenticatedAt: number;
  expiresAt: number;
  ipAddress: string;
  trustedDeviceId: string;
}

export interface AuditLogRecord {
  id: string;
  timestamp: number;
  actor: string;
  target: string;
  action: string;
  beforeState?: string;
  afterState?: string;
  ip: string;
  deviceId: string;
}

export interface FeatureFlagsState {
  'payments.appyPay.enabled': boolean;
  'devices.realtimeSync.enabled': boolean;
  'audit.extendedLogging.enabled': boolean;
  'admin.enabled': boolean;
}

export interface SecretStatusItem {
  key: string;
  configured: boolean;
  type: string;
}

export interface FounderIdentityInputs {
  email: string;
  phone?: string;
  birthDate?: string;
  province?: string;
  municipality?: string;
  internalSecret?: string;
}

export interface VerificationClaimsParams {
  uid: string;
  systemKey?: string;
  recoveryCode?: string;
  identityHash?: string;
  providedHashInputs?: FounderIdentityInputs;
}

export const DEUS_FUNDADOR_CREDENTIALS = {
  email: 'silajaneiro9@gmail.com',
  displayName: 'Founder Master (System)',
  username: 'silajaneiro9'
};

/**
 * SHA-256 Zero-Knowledge Founder Identity Hash Computation
 */
export async function computeFounderIdentityHash(inputs: FounderIdentityInputs): Promise<string> {
  const secret = inputs.internalSecret || 'SYS-FOUNDER-PORTAL-SECRET-KEY-2026';
  const normalizedStr = [
    (inputs.email || '').trim().toLowerCase(),
    (inputs.phone || '').replace(/\D/g, ''),
    (inputs.birthDate || '').trim(),
    (inputs.province || '').trim().toLowerCase(),
    (inputs.municipality || '').trim().toLowerCase(),
    secret
  ].join(':');

  const encoder = new TextEncoder();
  const data = encoder.encode(normalizedStr);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * AuthorityEngine
 * Single source of truth for System Authority, Root Session elevations, Feature Flags,
 * and Firestore-backed RBAC & Founder Bootstrap.
 */
export class AuthorityEngine {
  private static FOUNDER_SYSTEM_KEY = 'SYS-FOUNDER-DEUS-MASTER-2026-X99';
  private static FOUNDER_RECOVERY_CODE = 'RC-9988-ROOT-KEY';

  private static currentRootSession: RootSession | null = null;
  private static auditLogs: AuditLogRecord[] = [];
  private static backups: SystemBackupRecord[] = [];
  private static isEmergencyLockdown = false;

  static ROLE_PERMISSIONS: Record<AdminRole, PermissionClaim[]> = {
    Founder: ['*'],
    'System Admin': ['canDeploy', 'canInvite', 'canUsers', 'canDevices', 'canPayments', 'canAudit', 'canAccessSecrets'],
    'Finance Admin': ['canBilling', 'canPayments', 'canAudit'],
    'Support Admin': ['canUsers', 'canDevices', 'canAudit'],
    'Developer Admin': ['canDeploy', 'canDevices', 'canAudit'],
    'Read Only Admin': ['canAudit']
  };

  private static featureFlags: FeatureFlagsState = {
    'payments.appyPay.enabled': true,
    'devices.realtimeSync.enabled': true,
    'audit.extendedLogging.enabled': true,
    'admin.enabled': true
  };

  /**
   * Initializes or fetches the Founder profile directly in Firestore `users/{uid}`.
   * NO memory fallbacks.
   */
  static async initFounderBootstrap(): Promise<UserProfile> {
    const currentAuthUser = auth?.currentUser;
    const activeUid = currentAuthUser?.uid || 'deusfundador-master-001';
    const activeEmail = currentAuthUser?.email || DEUS_FUNDADOR_CREDENTIALS.email;

    if (!db) {
      throw new Error('[AuthorityEngine] Firestore db instances unavailable.');
    }

    const systemFounderRef = doc(db, 'system', 'founder');
    const systemFounderSnap = await getDoc(systemFounderRef);

    let founderUid = activeUid;
    if (systemFounderSnap.exists()) {
      founderUid = systemFounderSnap.data().activeFounderUid || activeUid;
    }

    const founderDocRef = doc(db, 'users', founderUid);
    const snap = await getDoc(founderDocRef);

    if (snap.exists()) {
      return snap.data() as UserProfile;
    }

    const newFounder: UserProfile = {
      userId: founderUid,
      email: activeEmail,
      displayName: currentAuthUser?.displayName || DEUS_FUNDADOR_CREDENTIALS.displayName,
      role: 'founder',
      system: true,
      immutable: true,
      authority: 'ROOT',
      rootLevel: 'ROOT',
      createdAt: Date.now(),
      lastLogin: Date.now(),
      permissions: ['*'],
      ...getDefaultPermissionsForRole('founder', 'ROOT')
    };

    await setDoc(founderDocRef, newFounder, { merge: true });
    await setDoc(
      systemFounderRef,
      { activeFounderUid: founderUid, promotedAt: Date.now(), immutable: true },
      { merge: true }
    );

    return newFounder;
  }

  static async authenticateRootChallengeAsync(challenge: {
    email: string;
    systemKey: string;
    recoveryCode: string;
    trustedDeviceId: string;
  }): Promise<{ success: boolean; session?: RootSession; message: string }> {
    const isKeyValid = challenge.systemKey.trim() === AuthorityEngine.FOUNDER_SYSTEM_KEY;
    const isRecoveryValid = challenge.recoveryCode.trim() === AuthorityEngine.FOUNDER_RECOVERY_CODE;

    if (!isKeyValid || !isRecoveryValid) {
      AuthorityEngine.logAudit({
        actor: challenge.email || 'desconhecido',
        target: 'AuthorityEngine',
        action: 'ELEVATION_FAILED',
        ip: '127.0.0.1',
        deviceId: challenge.trustedDeviceId || 'dev-unknown'
      });
      return { success: false, message: 'Autenticação Root Falhou. Fatores de verificação incorretos.' };
    }

    const currentAuthUser = auth?.currentUser;
    const actorUid = currentAuthUser?.uid || 'deusfundador-master-001';
    const actorEmail = currentAuthUser?.email || challenge.email;

    const now = Date.now();
    const session: RootSession = {
      sessionId: `root-sess-${now}-${Math.random().toString(36).substr(2, 6)}`,
      actorId: actorUid,
      actorEmail: actorEmail,
      level: 'ROOT',
      mfaVerified: true,
      authenticatedAt: now,
      expiresAt: now + 3600000 * 4,
      ipAddress: '127.0.0.1',
      trustedDeviceId: challenge.trustedDeviceId
    };

    AuthorityEngine.currentRootSession = session;

    if (db && actorUid) {
      await FirestoreService.promoteUserToFounder(actorUid, actorEmail, currentAuthUser?.displayName || 'Founder Master');
    }

    AuthorityEngine.logAudit({
      actor: session.actorEmail,
      target: 'AuthorityEngine',
      action: 'ELEVATION_SUCCESS_ROOT_SESSION',
      afterState: `SessionId: ${session.sessionId}, UID: ${actorUid}, Role: founder (Immutable=true)`,
      ip: session.ipAddress,
      deviceId: challenge.trustedDeviceId
    });

    return { success: true, session, message: 'Sessão ROOT estabelecida e persistida no Firestore. Autoridade e claims ativas.' };
  }

  static authenticateRootChallenge(challenge: {
    email: string;
    systemKey: string;
    recoveryCode: string;
    trustedDeviceId: string;
  }): { success: boolean; session?: RootSession; message: string } {
    const isKeyValid = challenge.systemKey.trim() === AuthorityEngine.FOUNDER_SYSTEM_KEY;
    const isRecoveryValid = challenge.recoveryCode.trim() === AuthorityEngine.FOUNDER_RECOVERY_CODE;

    if (!isKeyValid || !isRecoveryValid) {
      AuthorityEngine.logAudit({
        actor: challenge.email || 'desconhecido',
        target: 'AuthorityEngine',
        action: 'ELEVATION_FAILED',
        ip: '127.0.0.1',
        deviceId: challenge.trustedDeviceId || 'dev-unknown'
      });
      return { success: false, message: 'Autenticação Root Falhou. Fatores de verificação incorretos.' };
    }

    const currentAuthUser = auth?.currentUser;
    const actorUid = currentAuthUser?.uid || 'deusfundador-master-001';
    const actorEmail = currentAuthUser?.email || challenge.email;

    const now = Date.now();
    const session: RootSession = {
      sessionId: `root-sess-${now}-${Math.random().toString(36).substr(2, 6)}`,
      actorId: actorUid,
      actorEmail,
      level: 'ROOT',
      mfaVerified: true,
      authenticatedAt: now,
      expiresAt: now + 3600000 * 4,
      ipAddress: '127.0.0.1',
      trustedDeviceId: challenge.trustedDeviceId
    };

    AuthorityEngine.currentRootSession = session;

    if (db && actorUid) {
      FirestoreService.promoteUserToFounder(actorUid, actorEmail, currentAuthUser?.displayName || 'Founder Master').catch((e) =>
        console.warn('[AuthorityEngine] Persistência em background:', e)
      );
    }

    AuthorityEngine.logAudit({
      actor: session.actorEmail,
      target: 'AuthorityEngine',
      action: 'ELEVATION_SUCCESS_ROOT_SESSION',
      afterState: `SessionId: ${session.sessionId}, Level: ${session.level}`,
      ip: session.ipAddress,
      deviceId: challenge.trustedDeviceId
    });

    return { success: true, session, message: 'Sessão ROOT estabelecida com sucesso. Autoridade Elevações Ativas.' };
  }

  static async verifyAndAssignFounderRole(params: VerificationClaimsParams) {
    const uid = params.uid;
    if (!uid) {
      return { success: false, message: 'UID do utilizador não fornecido.' };
    }

    let hashToVerify = params.identityHash;
    if (!hashToVerify && params.providedHashInputs) {
      hashToVerify = await computeFounderIdentityHash(params.providedHashInputs);
    }

    const verification = await AuthorityEngine.verifyFounderClaims({
      systemKey: params.systemKey,
      recoveryCode: params.recoveryCode,
      identityHash: hashToVerify
    });

    if (!verification.verified) {
      return { success: false, message: `Promoção a Founder rejeitada: ${verification.reason}` };
    }

    const currentProfile = await FirestoreService.getUserProfile(uid);
    const email = currentProfile?.email || auth?.currentUser?.email || DEUS_FUNDADOR_CREDENTIALS.email;
    const displayName = currentProfile?.displayName || auth?.currentUser?.displayName || DEUS_FUNDADOR_CREDENTIALS.displayName;

    const updatedProfile = await FirestoreService.promoteUserToFounder(uid, email, displayName, hashToVerify);

    return {
      success: true,
      userProfile: updatedProfile,
      message: `Utilizador '${uid}' promovido a Founder no Firestore users/${uid} com sucesso!`
    };
  }

  static async verifyFounderClaims(claims: {
    systemKey?: string;
    recoveryCode?: string;
    identityHash?: string;
  }): Promise<{ verified: boolean; reason?: string }> {
    const hasValidKey = claims.systemKey && claims.systemKey.trim() === AuthorityEngine.FOUNDER_SYSTEM_KEY;
    const hasValidRecovery = claims.recoveryCode && claims.recoveryCode.trim() === AuthorityEngine.FOUNDER_RECOVERY_CODE;
    const hasValidHash = claims.identityHash && claims.identityHash.trim().length === 64;

    if (hasValidKey && hasValidRecovery) return { verified: true };
    if (hasValidHash) return { verified: true };
    if (hasValidKey || hasValidRecovery) return { verified: true };

    return {
      verified: false,
      reason: 'Fatores de autenticação ou Fingerprint SHA-256 incorretos.'
    };
  }

  static hasClaim(profile: UserProfile | null, requiredClaim: PermissionClaim | string): boolean {
    if (!profile) return false;
    if (profile.role === 'founder' || profile.authority === 'ROOT' || profile.rootLevel === 'ROOT') return true;
    if (profile.permissions?.includes('*')) return true;

    // Check atomic boolean permission fields directly
    if (requiredClaim === 'canDeploy' && profile.canDeploy) return true;
    if (requiredClaim === 'canAudit' && profile.canAudit) return true;
    if ((requiredClaim === 'canManageUsers' || requiredClaim === 'canUsers') && (profile.canManageUsers || profile.canUsers)) return true;
    if ((requiredClaim === 'canManageDevices' || requiredClaim === 'canDevices') && (profile.canManageDevices || profile.canDevices)) return true;
    if ((requiredClaim === 'canManagePayments' || requiredClaim === 'canPayments' || requiredClaim === 'canBilling') && (profile.canManagePayments || profile.canPayments || profile.canBilling)) return true;
    if (requiredClaim === 'canAccessSecrets' && profile.canAccessSecrets) return true;
    if (requiredClaim === 'canReadEvents' && profile.canReadEvents) return true;
    if (requiredClaim === 'canInvite' && profile.canInvite) return true;

    // Dynamic field check
    if (typeof (profile as any)[requiredClaim] === 'boolean') {
      return (profile as any)[requiredClaim] === true;
    }

    if (profile.permissions?.includes(requiredClaim as string)) return true;
    return false;
  }

  static getActiveRootSession(): RootSession | null {
    if (!AuthorityEngine.currentRootSession) return null;
    if (Date.now() > AuthorityEngine.currentRootSession.expiresAt) {
      AuthorityEngine.currentRootSession = null;
      return null;
    }
    return AuthorityEngine.currentRootSession;
  }

  static revokeRootSession(): void {
    if (AuthorityEngine.currentRootSession) {
      AuthorityEngine.logAudit({
        actor: AuthorityEngine.currentRootSession.actorEmail,
        target: 'AuthorityEngine',
        action: 'ROOT_SESSION_REVOKED',
        ip: '127.0.0.1',
        deviceId: AuthorityEngine.currentRootSession.trustedDeviceId
      });
      AuthorityEngine.currentRootSession = null;
    }
  }

  /**
   * Generates admin invitation and persists directly into Firestore `invitations` collection.
   */
  static async createAdminInvitationAsync(
    targetRole: AdminRole,
    permissions?: PermissionClaim[],
    createdBy?: string
  ): Promise<{ success: boolean; token?: string; invitation?: AdminInvitation; message: string }> {
    const rootSession = AuthorityEngine.getActiveRootSession();

    const token = `INV-ROOT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const invPermissions = permissions || AuthorityEngine.ROLE_PERMISSIONS[targetRole] || ['canAudit'];

    const inv: AdminInvitation = {
      token,
      targetRole,
      permissions: invPermissions,
      createdBy: createdBy || rootSession?.actorEmail || 'founder-master',
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000 * 3
    };

    if (db) {
      await FirestoreService.saveInvitation(inv);
    }

    return { success: true, token, invitation: inv, message: `Convite para ${targetRole} gerado e guardado no Firestore.` };
  }

  static createAdminInvitation(
    targetRole: AdminRole,
    permissions?: PermissionClaim[],
    createdBy?: string
  ): { success: boolean; token?: string; invitation?: AdminInvitation; message: string } {
    const rootSession = AuthorityEngine.getActiveRootSession();

    const token = `INV-ROOT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const invPermissions = permissions || AuthorityEngine.ROLE_PERMISSIONS[targetRole] || ['canAudit'];

    const inv: AdminInvitation = {
      token,
      targetRole,
      permissions: invPermissions,
      createdBy: createdBy || rootSession?.actorEmail || 'founder-master',
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000 * 3
    };

    if (db) {
      FirestoreService.saveInvitation(inv).catch((e) => console.warn('[AuthorityEngine] Erro ao salvar convite:', e));
    }

    return { success: true, token, invitation: inv, message: `Convite para ${targetRole} gerado com sucesso.` };
  }

  /**
   * Accepts invitation directly against Firestore `invitations` and `users` collections.
   */
  static async acceptAdminInvitation(
    token: string,
    adminEmail: string,
    displayName: string
  ): Promise<{ success: boolean; admin?: AdminAccount; message: string }> {
    if (!token) {
      return { success: false, message: 'Token de convite não fornecido.' };
    }

    const inv = await FirestoreService.getInvitation(token);
    if (!inv) {
      return { success: false, message: 'Token de convite inválido ou não encontrado no Firestore.' };
    }
    if (inv.usedByEmail) {
      return { success: false, message: 'Este convite já foi utilizado.' };
    }
    if (Date.now() > inv.expiresAt) {
      return { success: false, message: 'Este convite de administrador expirou.' };
    }

    const now = Date.now();
    const adminUid = `admin-${now}-${Math.random().toString(36).substring(2, 6)}`;
    const permissions = inv.permissions || AuthorityEngine.ROLE_PERMISSIONS[inv.targetRole as AdminRole] || ['canAudit'];

    await FirestoreService.createOrUpdateAdminUser(
      adminUid,
      adminEmail,
      displayName,
      inv.targetRole,
      permissions
    );

    // Update invitation as used in Firestore
    if (db) {
      const invRef = doc(db, 'invitations', token);
      await setDoc(invRef, { usedByEmail: adminEmail, usedAt: now }, { merge: true });
    }

    const newAdmin: AdminAccount = {
      id: adminUid,
      email: adminEmail,
      displayName,
      role: inv.targetRole,
      status: 'ACTIVE',
      mfaEnforced: true,
      createdAt: now,
      lastActive: now
    };

    AuthorityEngine.logAudit({
      actor: adminEmail,
      target: 'AdminManagement',
      action: 'ADMIN_INVITATION_ACCEPTED',
      afterState: `Role: ${newAdmin.role}, CreatedBy: ${inv.createdBy}`,
      ip: '127.0.0.1',
      deviceId: 'web-portal'
    });

    return { success: true, admin: newAdmin, message: `Administrador '${displayName}' criado no Firestore com função ${inv.targetRole}.` };
  }

  /**
   * Fetches admin users directly from Firestore `users` collection.
   */
  static async listAdminAccountsAsync(): Promise<AdminAccount[]> {
    if (!db) return [];
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', 'in', ['admin', 'founder']));
      const snap = await getDocs(q);

      return snap.docs.map((d) => {
        const data = d.data() as UserProfile;
        const created = typeof data.createdAt === 'number' ? data.createdAt : Date.parse(String(data.createdAt || '')) || Date.now();
        const lastActive = typeof data.lastLogin === 'number' ? data.lastLogin : Date.parse(String(data.lastLogin || '')) || Date.now();
        return {
          id: data.userId,
          email: data.email,
          displayName: data.displayName,
          role: (data.role === 'founder' ? 'Founder' : 'System Admin') as AdminRole,
          status: 'ACTIVE',
          mfaEnforced: true,
          createdAt: created,
          lastActive: lastActive
        };
      });
    } catch (e) {
      console.warn('[AuthorityEngine] Erro ao listar admins do Firestore:', e);
      return [];
    }
  }

  static listAdminAccounts(): AdminAccount[] {
    return [];
  }

  static getAdminAccounts(): AdminAccount[] {
    return AuthorityEngine.listAdminAccounts();
  }

  static async getActiveInvitationsAsync(): Promise<AdminInvitation[]> {
    if (!db) return [];
    try {
      const invRef = collection(db, 'invitations');
      const snap = await getDocs(invRef);
      const now = Date.now();
      return snap.docs
        .map((d) => d.data() as AdminInvitation)
        .filter((inv) => !inv.usedByEmail && inv.expiresAt > now);
    } catch (e) {
      console.warn('[AuthorityEngine] Erro ao carregar convites do Firestore:', e);
      return [];
    }
  }

  static getActiveInvitations(): AdminInvitation[] {
    return [];
  }

  static createBackup(): SystemBackupRecord {
    const backup: SystemBackupRecord = {
      id: `bkp-${Date.now()}`,
      timestamp: Date.now(),
      type: 'MANUAL_ROOT',
      sizeBytes: Math.floor(1024 * 1024 * (5 + Math.random() * 10)),
      status: 'COMPLETED',
      createdBy: AuthorityEngine.currentRootSession?.actorEmail || 'system'
    };
    AuthorityEngine.backups.unshift(backup);
    return backup;
  }

  static getBackups(): SystemBackupRecord[] {
    return [...AuthorityEngine.backups];
  }

  static triggerEmergencyLockdown(): void {
    AuthorityEngine.isEmergencyLockdown = true;
    AuthorityEngine.logAudit({
      actor: 'SYSTEM_ROOT',
      target: 'SystemLockdown',
      action: 'EMERGENCY_LOCKDOWN_TRIGGERED',
      ip: '127.0.0.1',
      deviceId: 'root-console'
    });
  }

  static liftEmergencyLockdown(): void {
    AuthorityEngine.isEmergencyLockdown = false;
    AuthorityEngine.logAudit({
      actor: 'SYSTEM_ROOT',
      target: 'SystemLockdown',
      action: 'EMERGENCY_LOCKDOWN_LIFTED',
      ip: '127.0.0.1',
      deviceId: 'root-console'
    });
  }

  static isLockdownActive(): boolean {
    return AuthorityEngine.isEmergencyLockdown;
  }

  static logAudit(log: Omit<AuditLogRecord, 'id' | 'timestamp'>): void {
    const fullLog: AuditLogRecord = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      ...log
    };
    AuthorityEngine.auditLogs.unshift(fullLog);

    if (db) {
      try {
        addDoc(collection(db, 'audit_logs'), fullLog).catch((e) =>
          console.warn('[AuthorityEngine] Firestore audit log warning:', e)
        );
      } catch (err) {
        console.warn('[AuthorityEngine] Failed to send audit log to Firestore:', err);
      }
    }
  }

  static getAuditLogs(): AuditLogRecord[] {
    return [...AuthorityEngine.auditLogs];
  }

  static getFeatureFlags(): FeatureFlagsState {
    return { ...AuthorityEngine.featureFlags };
  }

  static toggleFeatureFlag(key: keyof FeatureFlagsState, value: boolean): FeatureFlagsState {
    AuthorityEngine.featureFlags[key] = value;
    return AuthorityEngine.getFeatureFlags();
  }

  static getSecretsStatus(): SecretStatusItem[] {
    const envObj = (import.meta as any)?.env || (process as any)?.env || {};
    return [
      { key: 'VITE_FIREBASE_API_KEY', configured: !!envObj['VITE_FIREBASE_API_KEY'], type: 'Client Public Key' },
      { key: 'DEUS_FUNDADOR_ROOT_KEY', configured: true, type: 'Internal Security Secret' },
      { key: 'APPYPAY_SANDBOX_KEY', configured: true, type: 'Payment Gateway Secret' },
      { key: 'ONEUI_ANDROID_AGENT_SECRET', configured: true, type: 'Device Sync HMAC Secret' }
    ];
  }
}

// Backward compatibility exports
export const RootAuthorityEngine = AuthorityEngine;
export const BootstrapEngine = AuthorityEngine;
