export type RootLevel = 'ROOT' | 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';

export type UserRole = 
  | 'founder' 
  | 'co_founder' 
  | 'cto' 
  | 'finance' 
  | 'support' 
  | 'admin' 
  | 'operator' 
  | 'user' 
  | 'android_agent' 
  | 'integration';

export interface UserPermissions {
  canDeploy?: boolean;
  canAudit?: boolean;
  canManageUsers?: boolean;
  canManageDevices?: boolean;
  canManagePayments?: boolean;
  canAccessSecrets?: boolean;
  canReadEvents?: boolean;
  canInvite?: boolean;
  canBilling?: boolean;
  canUsers?: boolean;
  canDevices?: boolean;
  canPayments?: boolean;
}

export interface UserProfile extends UserPermissions {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  system?: boolean;
  immutable?: boolean;
  createdAt: number | string;
  lastLogin: number | string;
  permissions?: string[];
  authority?: 'ROOT' | 'ADMIN' | 'OPERATOR' | 'USER';
  rootLevel?: RootLevel;
  identityHash?: string;
  canDeploy?: boolean;
  canAudit?: boolean;
  canManageUsers?: boolean;
  canManageDevices?: boolean;
  canManagePayments?: boolean;
  canAccessSecrets?: boolean;
  canReadEvents?: boolean;
  canInvite?: boolean;
  canBilling?: boolean;
  canUsers?: boolean;
  canDevices?: boolean;
  canPayments?: boolean;
}

export function resolveRootLevel(role?: UserRole, authority?: string): RootLevel {
  if (role === 'founder' || authority === 'ROOT') return 'ROOT';
  if (role === 'co_founder' || role === 'cto' || role === 'admin' || authority === 'ADMIN') return 'LEVEL_1';
  if (role === 'finance' || role === 'operator' || authority === 'OPERATOR') return 'LEVEL_2';
  return 'LEVEL_3';
}

export function getDefaultPermissionsForRole(role?: UserRole, authority?: string): UserPermissions {
  if (role === 'founder' || authority === 'ROOT') {
    return {
      canDeploy: true,
      canAudit: true,
      canManageUsers: true,
      canManageDevices: true,
      canManagePayments: true,
      canAccessSecrets: true,
      canReadEvents: true,
      canInvite: true,
      canBilling: true,
      canUsers: true,
      canDevices: true,
      canPayments: true
    };
  }
  if (role === 'co_founder' || role === 'cto' || role === 'admin' || authority === 'ADMIN') {
    return {
      canDeploy: true,
      canAudit: true,
      canManageUsers: true,
      canManageDevices: true,
      canManagePayments: true,
      canAccessSecrets: false,
      canReadEvents: true,
      canInvite: true,
      canBilling: true,
      canUsers: true,
      canDevices: true,
      canPayments: true
    };
  }
  if (role === 'finance') {
    return {
      canDeploy: false,
      canAudit: true,
      canManageUsers: false,
      canManageDevices: false,
      canManagePayments: true,
      canAccessSecrets: false,
      canReadEvents: true,
      canInvite: false,
      canBilling: true,
      canUsers: false,
      canDevices: false,
      canPayments: true
    };
  }
  if (role === 'operator' || authority === 'OPERATOR') {
    return {
      canDeploy: false,
      canAudit: true,
      canManageUsers: false,
      canManageDevices: true,
      canManagePayments: false,
      canAccessSecrets: false,
      canReadEvents: true,
      canInvite: false,
      canBilling: false,
      canUsers: false,
      canDevices: true,
      canPayments: false
    };
  }
  return {
    canDeploy: false,
    canAudit: false,
    canManageUsers: false,
    canManageDevices: false,
    canManagePayments: false,
    canAccessSecrets: false,
    canReadEvents: true,
    canInvite: false,
    canBilling: false,
    canUsers: false,
    canDevices: false,
    canPayments: false
  };
}



