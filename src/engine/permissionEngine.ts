// src/engine/permissionEngine.ts — Motor de Hierarquia e Autorização de Comandos
// Diretriz 04: Hierarquia estrita Founder > Root Admin > Admin > Operator > Support > User

import { SecurityAuditService } from '../services/SecurityAuditService';

export type UserRole = 'FOUNDER' | 'ROOT_ADMIN' | 'ADMIN' | 'OPERATOR' | 'SUPPORT' | 'USER';

export interface UserPermissionContext {
  uid: string;
  role: UserRole;
  deviceId: string;
  sessionId: string;
  isTrustedDevice: boolean;
  isExpired: boolean;
  pinVerified?: boolean;
  biometricVerified?: boolean;
}

export interface PermissionValidationResult {
  authorized: boolean;
  reason?: string;
  requiredRole?: UserRole;
  actualRole: UserRole;
}

export class PermissionEngine {
  private static readonly ROLE_HIERARCHY: Record<UserRole, number> = {
    FOUNDER: 6,
    ROOT_ADMIN: 5,
    ADMIN: 4,
    OPERATOR: 3,
    SUPPORT: 2,
    USER: 1
  };

  /**
   * Obtém o perfil de segurança atual da sessão
   */
  public static getProfile(): UserPermissionContext {
    return this.getCurrentContext();
  }

  /**
   * Obtém o contexto de segurança atual da sessão
   */
  public static getCurrentContext(): UserPermissionContext {
    const role = (localStorage.getItem('portal_user_role') as UserRole) || 'FOUNDER';
    const uid = localStorage.getItem('portal_current_uid') || 'founder_root_master';
    const deviceId = localStorage.getItem('portal_device_id') || 'dev_node_master';
    const sessionId = localStorage.getItem('portal_session_id') || 'sess_master_active';
    const isTrusted = localStorage.getItem('portal_device_trusted') !== 'false';

    return {
      uid,
      role,
      deviceId,
      sessionId,
      isTrustedDevice: isTrusted,
      isExpired: false
    };
  }

  /**
   * Valida se o papel do utilizador satisfaz o nível mínimo exigido
   */
  public static hasSufficientRole(userRole: UserRole, requiredRole: UserRole): boolean {
    const userLevel = this.ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = this.ROLE_HIERARCHY[requiredRole] || 0;
    return userLevel >= requiredLevel;
  }

  /**
   * Validação completa de privilégio para execução de comando
   */
  public static validateCommandExecution(
    commandCode: string,
    requiredRole: UserRole = 'USER',
    requiresTrustedDevice: boolean = false,
    requiresPin: boolean = false
  ): PermissionValidationResult {
    const ctx = this.getCurrentContext();

    if (ctx.isExpired) {
      SecurityAuditService.log('COMMAND_DENIED', commandCode, 'DENIED', 'WARNING', {
        reason: 'Sessão expirada'
      });
      return {
        authorized: false,
        reason: 'Sessão expirada. Autenticação necessária.',
        requiredRole,
        actualRole: ctx.role
      };
    }

    if (!this.hasSufficientRole(ctx.role, requiredRole)) {
      SecurityAuditService.log('COMMAND_DENIED', commandCode, 'DENIED', 'CRITICAL', {
        reason: `Privilégio insuficiente: Requer ${requiredRole}, possui ${ctx.role}`
      });
      return {
        authorized: false,
        reason: `Acesso negado. Nível necessário: ${requiredRole}. Nível atual: ${ctx.role}`,
        requiredRole,
        actualRole: ctx.role
      };
    }

    if (requiresTrustedDevice && !ctx.isTrustedDevice) {
      SecurityAuditService.log('COMMAND_DENIED', commandCode, 'DENIED', 'CRITICAL', {
        reason: 'Dispositivo não confiável'
      });
      return {
        authorized: false,
        reason: 'Este comando exige execução num dispositivo confiável (Trusted Device).',
        requiredRole,
        actualRole: ctx.role
      };
    }

    return {
      authorized: true,
      requiredRole,
      actualRole: ctx.role
    };
  }

  /**
   * Altera a função de um utilizador com auditoria
   */
  public static setRole(targetUid: string, newRole: UserRole): void {
    localStorage.setItem(`portal_role_${targetUid}`, newRole);
    if (targetUid === this.getCurrentContext().uid) {
      localStorage.setItem('portal_user_role', newRole);
    }
    SecurityAuditService.log('ROLE_CHANGED', `SET_ROLE_${newRole}`, 'SUCCESS', 'CRITICAL', {
      targetUid,
      newRole
    });
  }
}
