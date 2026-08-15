// src/engine/adminProvisioningEngine.ts — Motor de Criação Dinâmica de Administradores
// Diretriz 06 & 07: Gestão e provisionamento de administradores via comandos (*#CREATEADMIN#, *#PROMOTE#, etc.)

import { UserRole, PermissionEngine } from './permissionEngine';
import { SecurityAuditService } from '../services/SecurityAuditService';

export interface ProvisionedAdminAccount {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  secretCode: string;
  pin: string;
  permissions: string[];
  authorizedDevice?: string;
  trustedDevices: string[];
  expiresAt?: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  createdAt: number;
}

export type AdminAccount = ProvisionedAdminAccount;

export class AdminProvisioningEngine {
  private static readonly STORAGE_KEY = 'portal_admin_directory';

  public static getAdmins(): AdminAccount[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Fallback
    }

    // Default Seed (Root Founder)
    const defaultFounder: AdminAccount = {
      uid: 'founder_root_master',
      name: 'Root Founder',
      email: 'founder@portal.ao',
      role: 'FOUNDER',
      secretCode: '*#ROOT#',
      pin: '0000',
      permissions: ['ALL_PERMISSIONS', 'INFRA', 'TELECOM', 'BANKING', 'SECURITY'],
      authorizedDevice: 'dev_node_master',
      trustedDevices: ['dev_node_master', 'samsung_s22_ultra_founder'],
      status: 'ACTIVE',
      createdAt: Date.now()
    };

    return [defaultFounder];
  }

  public static createAdmin(adminData: Omit<AdminAccount, 'uid' | 'createdAt'>): AdminAccount {
    const admins = this.getAdmins();
    const newAdmin: AdminAccount = {
      ...adminData,
      uid: `admin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now()
    };

    admins.push(newAdmin);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(admins));

    // Persistir papel
    PermissionEngine.setRole(newAdmin.uid, newAdmin.role);

    SecurityAuditService.log(
      'ADMIN_CREATED',
      `CREATE_ADMIN_${newAdmin.name}`,
      'SUCCESS',
      'CRITICAL',
      { name: newAdmin.name, role: newAdmin.role, uid: newAdmin.uid }
    );

    return newAdmin;
  }

  public static suspendAdmin(uid: string): void {
    this.updateAdminStatus(uid, 'SUSPENDED');
  }

  public static activateAdmin(uid: string): void {
    this.updateAdminStatus(uid, 'ACTIVE');
  }

  public static updateAdminStatus(uid: string, status: AdminAccount['status']): void {
    const admins = this.getAdmins().map(a => {
      if (a.uid === uid) {
        return { ...a, status };
      }
      return a;
    });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(admins));

    SecurityAuditService.log(
      'ROLE_CHANGED',
      `STATUS_${status}_${uid}`,
      'SUCCESS',
      'WARNING',
      { uid, status }
    );
  }

  public static removeAdmin(uid: string): void {
    const admins = this.getAdmins().filter(a => a.uid !== uid);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(admins));

    SecurityAuditService.log(
      'ADMIN_REMOVED',
      `REMOVE_ADMIN_${uid}`,
      'SUCCESS',
      'CRITICAL',
      { uid }
    );
  }
}
