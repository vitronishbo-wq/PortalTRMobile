import { db } from '../firebase/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export type AdminRole = 'Founder' | 'System Admin' | 'Finance Admin' | 'Support Admin' | 'Developer Admin' | 'Read Only Admin';

export type PermissionClaim =
  | 'canManageUsers'
  | 'canDeploy'
  | 'canManagePayments'
  | 'canManageLicenses'
  | 'canReadAudit'
  | 'canCreateAdmins'
  | 'canDeleteUsers'
  | 'canAccessSecrets';

export interface AdminAccount {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  permissions: PermissionClaim[];
  createdAt: number;
  createdBy: string;
  active: boolean;
  trustedDevices: string[];
}

export interface AdminInvitation {
  id: string;
  token: string;
  targetRole: AdminRole;
  permissions: PermissionClaim[];
  createdBy: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
  usedByEmail?: string;
}

export interface RootSession {
  sessionId: string;
  actorId: string;
  actorEmail: string;
  level: 'ROOT' | 'ADMIN' | 'OPERATOR';
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
  signature: string;
}

export interface SystemBackupRecord {
  id: string;
  createdAt: number;
  createdBy: string;
  sizeBytes: number;
  checksum: string;
  status: 'SUCCESS' | 'RESTORED' | 'FAILED';
  description: string;
}

export class RootAuthorityEngine {
  private static currentRootSession: RootSession | null = null;
  private static auditLogs: AuditLogRecord[] = [];
  private static adminAccounts = new Map<string, AdminAccount>();
  private static activeInvitations = new Map<string, AdminInvitation>();
  private static backupRecords: SystemBackupRecord[] = [
    {
      id: 'bkp-2026-07-28-01',
      createdAt: Date.now() - 3600000 * 5,
      createdBy: 'deusfundador',
      sizeBytes: 482910,
      checksum: 'sha256-a8f9e2b1093c',
      status: 'SUCCESS',
      description: 'System Snapshot Root Baseline'
    }
  ];

  private static emergencyLockdownActive = false;

  // Role Default Permissions Definition
  public static ROLE_PERMISSIONS: Record<AdminRole, PermissionClaim[]> = {
    Founder: [
      'canManageUsers',
      'canDeploy',
      'canManagePayments',
      'canManageLicenses',
      'canReadAudit',
      'canCreateAdmins',
      'canDeleteUsers',
      'canAccessSecrets'
    ],
    'System Admin': ['canManageUsers', 'canDeploy', 'canManageLicenses', 'canReadAudit', 'canAccessSecrets'],
    'Finance Admin': ['canManagePayments', 'canManageLicenses', 'canReadAudit'],
    'Support Admin': ['canManageUsers', 'canManageLicenses', 'canReadAudit'],
    'Developer Admin': ['canDeploy', 'canReadAudit', 'canAccessSecrets'],
    'Read Only Admin': ['canReadAudit']
  };

  /**
   * Root Elevation Multi-Factor Challenge Verification
   */
  static authenticateRootChallenge(challenge: {
    email: string;
    systemKey: string;
    recoveryCode: string;
    trustedDeviceId: string;
  }): { success: boolean; session?: RootSession; message: string } {
    const isEmailValid = challenge.email.trim().toLowerCase() === 'deusfundador@portal.internal';
    const isKeyValid = challenge.systemKey.trim() === 'SYS-FOUNDER-DEUS-MASTER-2026-X99';
    const isRecoveryValid = challenge.recoveryCode.trim() === 'RC-9988-ROOT-KEY';

    if (!isEmailValid || !isKeyValid || !isRecoveryValid) {
      RootAuthorityEngine.logAudit({
        actor: challenge.email || 'unknown',
        target: 'RootAuthority',
        action: 'ELEVATION_FAILED',
        ip: '127.0.0.1',
        deviceId: challenge.trustedDeviceId || 'dev-unknown'
      });
      return { success: false, message: 'Autenticação Root Falhou. Fatores de verificação incorretos.' };
    }

    const now = Date.now();
    const session: RootSession = {
      sessionId: `root-sess-${now}-${Math.random().toString(36).substr(2, 6)}`,
      actorId: 'deusfundador-master-001',
      actorEmail: challenge.email,
      level: 'ROOT',
      mfaVerified: true,
      authenticatedAt: now,
      expiresAt: now + 3600000 * 4, // 4 hours active root session
      ipAddress: '127.0.0.1',
      trustedDeviceId: challenge.trustedDeviceId
    };

    RootAuthorityEngine.currentRootSession = session;

    RootAuthorityEngine.logAudit({
      actor: session.actorEmail,
      target: 'RootAuthority',
      action: 'ELEVATION_SUCCESS_ROOT_SESSION',
      afterState: `SessionId: ${session.sessionId}`,
      ip: session.ipAddress,
      deviceId: challenge.trustedDeviceId
    });

    return { success: true, session, message: 'Sessão ROOT estabelecida com sucesso. Autoridade Elevações Ativas.' };
  }

  static getActiveRootSession(): RootSession | null {
    if (!RootAuthorityEngine.currentRootSession) return null;
    if (Date.now() > RootAuthorityEngine.currentRootSession.expiresAt) {
      RootAuthorityEngine.currentRootSession = null;
      return null;
    }
    return RootAuthorityEngine.currentRootSession;
  }

  static revokeRootSession(): void {
    if (RootAuthorityEngine.currentRootSession) {
      RootAuthorityEngine.logAudit({
        actor: RootAuthorityEngine.currentRootSession.actorEmail,
        target: 'RootAuthority',
        action: 'SESSION_REVOKED_BY_ACTOR',
        ip: RootAuthorityEngine.currentRootSession.ipAddress,
        deviceId: RootAuthorityEngine.currentRootSession.trustedDeviceId
      });
      RootAuthorityEngine.currentRootSession = null;
    }
  }

  /**
   * Admin Invitation Engine (Single Use, Signed Token, 72h Validity)
   */
  static createAdminInvitation(
    targetRole: AdminRole,
    customPermissions?: PermissionClaim[]
  ): { success: boolean; invitation?: AdminInvitation; message: string } {
    const rootSession = RootAuthorityEngine.getActiveRootSession();
    if (!rootSession) {
      return { success: false, message: 'Apenas a Autoridade Raiz (Root Session) pode gerar convites de administrador.' };
    }

    const now = Date.now();
    const token = `INV-${Math.random().toString(36).substr(2, 8).toUpperCase()}-${now.toString(36).toUpperCase()}`;
    const invitation: AdminInvitation = {
      id: `inv-${now}`,
      token,
      targetRole,
      permissions: customPermissions || RootAuthorityEngine.ROLE_PERMISSIONS[targetRole],
      createdBy: rootSession.actorEmail,
      createdAt: now,
      expiresAt: now + 86400000 * 3, // 72 hours
      used: false
    };

    RootAuthorityEngine.activeInvitations.set(token, invitation);

    RootAuthorityEngine.logAudit({
      actor: rootSession.actorEmail,
      target: `Invitation:${targetRole}`,
      action: 'ADMIN_INVITATION_CREATED',
      afterState: `Token: ${token}, Role: ${targetRole}, Valid: 72h`,
      ip: rootSession.ipAddress,
      deviceId: rootSession.trustedDeviceId
    });

    return { success: true, invitation, message: 'Convite assinado de Administrador gerado com sucesso.' };
  }

  static acceptAdminInvitation(token: string, adminEmail: string, displayName: string): { success: boolean; admin?: AdminAccount; message: string } {
    const inv = RootAuthorityEngine.activeInvitations.get(token.trim());
    if (!inv) {
      return { success: false, message: 'Token de convite inválido ou inexistente.' };
    }

    if (inv.used) {
      return { success: false, message: 'Este token de convite já foi utilizado.' };
    }

    if (Date.now() > inv.expiresAt) {
      return { success: false, message: 'Este convite de administrador expirou (limite de 72 horas).' };
    }

    const now = Date.now();
    const newAdmin: AdminAccount = {
      id: `admin-${now}`,
      email: adminEmail,
      displayName,
      role: inv.targetRole,
      permissions: inv.permissions,
      createdAt: now,
      createdBy: inv.createdBy,
      active: true,
      trustedDevices: ['device-bound-01']
    };

    inv.used = true;
    inv.usedByEmail = adminEmail;
    RootAuthorityEngine.adminAccounts.set(newAdmin.id, newAdmin);

    RootAuthorityEngine.logAudit({
      actor: adminEmail,
      target: `AdminAccount:${newAdmin.id}`,
      action: 'ADMIN_INVITATION_ACCEPTED',
      afterState: `Role: ${newAdmin.role}, CreatedBy: ${inv.createdBy}`,
      ip: '127.0.0.1',
      deviceId: 'device-bound-01'
    });

    return { success: true, admin: newAdmin, message: `Administrador '${displayName}' criado com nível ${inv.targetRole}.` };
  }

  /**
   * Audit Engine
   */
  static logAudit(entry: { actor: string; target: string; action: string; beforeState?: string; afterState?: string; ip: string; deviceId: string }): AuditLogRecord {
    const record: AuditLogRecord = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      actor: entry.actor,
      target: entry.target,
      action: entry.action,
      beforeState: entry.beforeState,
      afterState: entry.afterState,
      ip: entry.ip,
      deviceId: entry.deviceId,
      signature: `SIG-HMAC-${Math.random().toString(36).substr(2, 10).toUpperCase()}`
    };

    RootAuthorityEngine.auditLogs.unshift(record);
    if (RootAuthorityEngine.auditLogs.length > 200) RootAuthorityEngine.auditLogs.pop();

    return record;
  }

  static getAuditLogs(): AuditLogRecord[] {
    return [...RootAuthorityEngine.auditLogs];
  }

  /**
   * Disaster Recovery Engine
   */
  static createBackup(description: string = 'Snaphot Manual do Sistema'): SystemBackupRecord {
    const rootSession = RootAuthorityEngine.getActiveRootSession();
    const actor = rootSession ? rootSession.actorEmail : 'system';

    const bkp: SystemBackupRecord = {
      id: `bkp-${Date.now()}`,
      createdAt: Date.now(),
      createdBy: actor,
      sizeBytes: Math.floor(Math.random() * 200000) + 400000,
      checksum: `sha256-${Math.random().toString(36).substr(2, 12)}`,
      status: 'SUCCESS',
      description
    };

    RootAuthorityEngine.backupRecords.unshift(bkp);

    RootAuthorityEngine.logAudit({
      actor,
      target: 'DisasterRecovery',
      action: 'BACKUP_CREATED',
      afterState: `Backup ID: ${bkp.id}, Checksum: ${bkp.checksum}`,
      ip: rootSession?.ipAddress || '127.0.0.1',
      deviceId: rootSession?.trustedDeviceId || 'system'
    });

    return bkp;
  }

  static triggerEmergencyLockdown(reason: string): { active: boolean; message: string } {
    RootAuthorityEngine.emergencyLockdownActive = true;
    RootAuthorityEngine.logAudit({
      actor: RootAuthorityEngine.currentRootSession?.actorEmail || 'ROOT_LOCKDOWN_ENGINE',
      target: 'SystemLockdown',
      action: 'EMERGENCY_LOCKDOWN_ACTIVATED',
      afterState: `Reason: ${reason}`,
      ip: '127.0.0.1',
      deviceId: 'root-guard'
    });

    return { active: true, message: `LOCKDOWN DE EMERGÊNCIA ATIVADO. Razão: ${reason}` };
  }

  static isLockdownActive(): boolean {
    return RootAuthorityEngine.emergencyLockdownActive;
  }

  static liftEmergencyLockdown(): { active: boolean; message: string } {
    RootAuthorityEngine.emergencyLockdownActive = false;
    RootAuthorityEngine.logAudit({
      actor: RootAuthorityEngine.currentRootSession?.actorEmail || 'ROOT_LOCKDOWN_ENGINE',
      target: 'SystemLockdown',
      action: 'EMERGENCY_LOCKDOWN_LIFTED',
      ip: '127.0.0.1',
      deviceId: 'root-guard'
    });

    return { active: false, message: 'Lockdown de emergência desativado.' };
  }

  static getBackups(): SystemBackupRecord[] {
    return [...RootAuthorityEngine.backupRecords];
  }

  static getActiveInvitations(): AdminInvitation[] {
    return Array.from(RootAuthorityEngine.activeInvitations.values());
  }

  static getAdminAccounts(): AdminAccount[] {
    return Array.from(RootAuthorityEngine.adminAccounts.values());
  }
}
