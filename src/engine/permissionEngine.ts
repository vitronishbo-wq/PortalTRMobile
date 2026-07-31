import { UserProfile, UserPermissions, getDefaultPermissionsForRole } from '../types/User';
import { AuthorityEngine } from './authorityEngine';

export class PermissionEngine {
  /**
   * Avalia se um perfil de utilizador tem uma determinada permissão ou claim
   */
  static can(profile: UserProfile | null, action: keyof UserPermissions | string): boolean {
    if (!profile) return false;
    if (profile.role === 'founder' || profile.authority === 'ROOT' || profile.rootLevel === 'ROOT') return true;
    if (profile.permissions?.includes('*')) return true;

    // Direct check on atomic permission fields
    if (typeof (profile as any)[action] === 'boolean') {
      return (profile as any)[action] === true;
    }

    // Delegation to Authority Engine claim check
    return AuthorityEngine.hasClaim(profile, action);
  }

  /**
   * Obtém as permissões padrão atribuídas a uma função (role)
   */
  static getRolePermissions(role: any, authority?: string): UserPermissions {
    return getDefaultPermissionsForRole(role, authority);
  }

  /**
   * Valida se um conjunto de ações pode ser executado pelo utilizador
   */
  static validateAll(profile: UserProfile | null, actions: string[]): boolean {
    if (!profile) return false;
    return actions.every(action => PermissionEngine.can(profile, action));
  }
}
