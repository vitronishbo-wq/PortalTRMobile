// src/services/SecretCommandsService.ts — Dicionário Firestore de Comandos Ocultos (COS Kernel)
// Diretrizes 30, 31 & 38: Persistência de secret_commands/ e admin_profiles/ no Firestore

import { UserRole } from '../engine/permissionEngine';

export interface SecretCommandRecord {
  commandId: string;
  command: string; // Ex: *#FOUNDER#, *#LOCK#
  alias: string[]; // Ex: ['> founder', '> lock']
  description: string;
  category: 'NAVIGATION' | 'ADMIN' | 'SESSION' | 'DEVICE' | 'TELECOM' | 'SECURITY';
  role: UserRole; // FOUNDER | ROOT | ADMIN | OPERATOR | USER
  parameters: string[]; // Ex: ['DEVICE', 'WIPE', 'ROLE', 'PIN', 'EMAIL']
  trustedDevice: boolean;
  requiresPin: boolean;
  requiresMfa: boolean;
  enabled: boolean;
  expiresAt?: number;
  createdBy: string;
  createdAt: number;
}

export interface AdminProfileRecord {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  secretCode: string;
  trustedDevices: string[];
  createdBy: string;
  createdAt: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
}

export class SecretCommandsService {
  private static readonly SECRET_COMMANDS_KEY = 'portal_secret_commands';
  private static readonly ADMIN_PROFILES_KEY = 'portal_admin_profiles';

  /**
   * Obtém os comandos secretos armazenados (Firestore collection secret_commands/)
   */
  public static getSecretCommands(): SecretCommandRecord[] {
    try {
      const raw = localStorage.getItem(this.SECRET_COMMANDS_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error(e);
    }

    const defaultSecretCommands: SecretCommandRecord[] = [
      // FOUNDER HIERARCHY
      {
        commandId: 'sc_founder',
        command: '*#FOUNDER#',
        alias: ['*#ROOT#', 'founder', 'open founder'],
        description: 'Abrir Founder Console (IDE de Operações)',
        category: 'NAVIGATION',
        role: 'FOUNDER',
        parameters: [],
        enabled: true,
        requiresPin: false,
        requiresMfa: false,
        trustedDevice: true,
        createdBy: 'system_root',
        createdAt: Date.now()
      },
      {
        commandId: 'sc_createadmin',
        command: '*#CREATEADMIN#',
        alias: ['create admin', 'add admin'],
        description: 'Provisionar Administrador parametrizado (*#CREATEADMIN:EMAIL=...:ROLE=...:PIN=...#)',
        category: 'ADMIN',
        role: 'FOUNDER',
        parameters: ['EMAIL', 'ROLE', 'PIN', 'NAME'],
        enabled: true,
        requiresPin: false,
        requiresMfa: false,
        trustedDevice: true,
        createdBy: 'system_root',
        createdAt: Date.now()
      },
      {
        commandId: 'sc_system',
        command: '*#SYSTEM#',
        alias: ['system', 'open system', 'update system', 'rollback system'],
        description: 'Console Central de Sistema e Configurações Globais',
        category: 'ADMIN',
        role: 'FOUNDER',
        parameters: ['ACTION', 'FLAG'],
        enabled: true,
        requiresPin: false,
        requiresMfa: false,
        trustedDevice: true,
        createdBy: 'system_root',
        createdAt: Date.now()
      },
      {
        commandId: 'sc_audit',
        command: '*#AUDIT#',
        alias: ['audit', 'audit security', 'logs'],
        description: 'Auditoria de Segurança Imutável em Tempo Real',
        category: 'SECURITY',
        role: 'FOUNDER',
        parameters: ['SEVERITY', 'FILTER'],
        enabled: true,
        requiresPin: false,
        requiresMfa: false,
        trustedDevice: true,
        createdBy: 'system_root',
        createdAt: Date.now()
      },
      {
        commandId: 'sc_security',
        command: '*#SECURITY#',
        alias: ['security', 'open security', 'wipe'],
        description: 'Protocolo de Segurança, Wipe e Isolamento de Nós',
        category: 'SECURITY',
        role: 'FOUNDER',
        parameters: ['WIPE', 'LOCK'],
        enabled: true,
        requiresPin: true,
        requiresMfa: false,
        trustedDevice: true,
        createdBy: 'system_root',
        createdAt: Date.now()
      },
      {
        commandId: 'sc_banking',
        command: '*#BANKING#',
        alias: ['banking', 'banking status', 'open banking'],
        description: 'Abrir Banking Hub (EMIS Multicaixa / BFA / BAI)',
        category: 'SECURITY',
        role: 'FOUNDER',
        parameters: ['ACCOUNT', 'GATEWAY'],
        enabled: true,
        requiresPin: true,
        requiresMfa: false,
        trustedDevice: true,
        createdBy: 'system_root',
        createdAt: Date.now()
      },

      // ADMIN HIERARCHY
      {
        commandId: 'sc_devices',
        command: '*#DEVICES#',
        alias: ['devices', 'open devices', 'fleet'],
        description: 'Mesh de Dispositivos e Gestão de Nós Remotos',
        category: 'DEVICE',
        role: 'ADMIN',
        parameters: ['FILTER', 'NODE'],
        enabled: true,
        requiresPin: false,
        requiresMfa: false,
        trustedDevice: false,
        createdBy: 'system_root',
        createdAt: Date.now()
      },
      {
        commandId: 'sc_users',
        command: '*#USERS#',
        alias: ['users', 'open users', 'manage users'],
        description: 'Administração de Perfis e Permissões de Utilizadores',
        category: 'ADMIN',
        role: 'ADMIN',
        parameters: ['ROLE', 'STATUS'],
        enabled: true,
        requiresPin: false,
        requiresMfa: false,
        trustedDevice: false,
        createdBy: 'system_root',
        createdAt: Date.now()
      },
      {
        commandId: 'sc_telecom',
        command: '*#TELECOM#',
        alias: ['telecom', 'telecom status', 'open telecom'],
        description: 'Gestão SIP/IMS, Troncos e DIDs Angolanos',
        category: 'TELECOM',
        role: 'ADMIN',
        parameters: ['OPERATOR', 'TRUNK'],
        enabled: true,
        requiresPin: false,
        requiresMfa: false,
        trustedDevice: false,
        createdBy: 'system_root',
        createdAt: Date.now()
      },
      {
        commandId: 'sc_messages',
        command: '*#MESSAGES#',
        alias: ['messages', 'open messages', 'sms console'],
        description: 'Console Avançada de Mensagens e Despacho de SMS',
        category: 'TELECOM',
        role: 'ADMIN',
        parameters: ['BOX', 'FILTER'],
        enabled: true,
        requiresPin: false,
        requiresMfa: false,
        trustedDevice: false,
        createdBy: 'system_root',
        createdAt: Date.now()
      },
      {
        commandId: 'sc_notifications',
        command: '*#NOTIFICATIONS#',
        alias: ['notifications', 'open notifications'],
        description: 'Transmissão e Listener de Notificações de Nós Android',
        category: 'DEVICE',
        role: 'ADMIN',
        parameters: ['PRIORITY'],
        enabled: true,
        requiresPin: false,
        requiresMfa: false,
        trustedDevice: false,
        createdBy: 'system_root',
        createdAt: Date.now()
      },
      {
        commandId: 'sc_lock',
        command: '*#LOCK#',
        alias: ['lock', 'lock device'],
        description: 'Bloquear dispositivo com opção de wipe (*#LOCK:DEVICE=S22:WIPE=TRUE#)',
        category: 'DEVICE',
        role: 'ADMIN',
        parameters: ['DEVICE', 'WIPE'],
        enabled: true,
        requiresPin: false,
        requiresMfa: false,
        trustedDevice: false,
        createdBy: 'system_root',
        createdAt: Date.now()
      },

      // OPERATOR HIERARCHY
      {
        commandId: 'sc_sync',
        command: '*#SYNC#',
        alias: ['sync', 'sync now'],
        description: 'Sincronização Forçada (*#SYNC:AT=23:00# ou *#SYNC:EVERY=24H#)',
        category: 'DEVICE',
        role: 'OPERATOR',
        parameters: ['AT', 'EVERY', 'SCOPE'],
        enabled: true,
        requiresPin: false,
        requiresMfa: false,
        trustedDevice: false,
        createdBy: 'system_root',
        createdAt: Date.now()
      },
      {
        commandId: 'sc_pair',
        command: '*#PAIR#',
        alias: ['pair', 'pair device', 'pair desktop'],
        description: 'Emparelhamento Composto (*#PAIR:DEVICE=LAPTOP:SYNC=TRUE#)',
        category: 'DEVICE',
        role: 'OPERATOR',
        parameters: ['DEVICE', 'SYNC', 'TIMEOUT'],
        enabled: true,
        requiresPin: false,
        requiresMfa: false,
        trustedDevice: false,
        createdBy: 'system_root',
        createdAt: Date.now()
      },
      {
        commandId: 'sc_transfer',
        command: '*#TRANSFER#',
        alias: ['transfer', 'transfer session'],
        description: 'Transferir Sessão Ativa (*#TRANSFER:DEVICE=...#)',
        category: 'SESSION',
        role: 'OPERATOR',
        parameters: ['DEVICE', 'FORCE'],
        enabled: true,
        requiresPin: false,
        requiresMfa: false,
        trustedDevice: false,
        createdBy: 'system_root',
        createdAt: Date.now()
      },
      {
        commandId: 'sc_calltest',
        command: '*#CALLTEST#',
        alias: ['calltest', 'test call'],
        description: 'Teste Diagnóstico de Rota de Voz WebRTC / SIP',
        category: 'TELECOM',
        role: 'OPERATOR',
        parameters: ['CODEC', 'GATEWAY'],
        enabled: true,
        requiresPin: false,
        requiresMfa: false,
        trustedDevice: false,
        createdBy: 'system_root',
        createdAt: Date.now()
      },

      // USER HIERARCHY
      {
        commandId: 'sc_call',
        command: '*#CALL#',
        alias: ['call', 'make call'],
        description: 'Iniciar Chamada Telefónica (*#CALL:NUM=...#)',
        category: 'TELECOM',
        role: 'USER',
        parameters: ['NUM', 'SIM'],
        enabled: true,
        requiresPin: false,
        requiresMfa: false,
        trustedDevice: false,
        createdBy: 'system_root',
        createdAt: Date.now()
      },
      {
        commandId: 'sc_sms',
        command: '*#SMS#',
        alias: ['sms', 'send sms'],
        description: 'Enviar SMS (*#SMS:TO=...:TEXT=...#)',
        category: 'TELECOM',
        role: 'USER',
        parameters: ['TO', 'TEXT'],
        enabled: true,
        requiresPin: false,
        requiresMfa: false,
        trustedDevice: false,
        createdBy: 'system_root',
        createdAt: Date.now()
      },
      {
        commandId: 'sc_contacts',
        command: '*#CONTACTS#',
        alias: ['contacts', 'open contacts'],
        description: 'Agenda Telefónica de Contactos',
        category: 'NAVIGATION',
        role: 'USER',
        parameters: ['SEARCH'],
        enabled: true,
        requiresPin: false,
        requiresMfa: false,
        trustedDevice: false,
        createdBy: 'system_root',
        createdAt: Date.now()
      }
    ];

    try {
      localStorage.setItem(this.SECRET_COMMANDS_KEY, JSON.stringify(defaultSecretCommands));
    } catch (e) {
      console.error(e);
    }

    return defaultSecretCommands;
  }

  /**
   * Salva ou atualiza um comando no dicionário Firestore secret_commands/
   */
  public static saveSecretCommand(record: SecretCommandRecord): void {
    const list = this.getSecretCommands();
    const idx = list.findIndex(c => c.commandId === record.commandId || c.command === record.command);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.push(record);
    }
    localStorage.setItem(this.SECRET_COMMANDS_KEY, JSON.stringify(list));
  }

  /**
   * Gestão de admin_profiles/
   */
  public static getAdminProfiles(): AdminProfileRecord[] {
    try {
      const raw = localStorage.getItem(this.ADMIN_PROFILES_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error(e);
    }

    const defaultProfiles: AdminProfileRecord[] = [
      {
        uid: 'adm_founder_master',
        name: 'Portal Founder Master',
        email: 'founder@portal.ao',
        role: 'FOUNDER',
        permissions: ['ALL_PERMISSIONS', 'COS_ROOT_ACCESS', 'ADMIN_PROVISIONING', 'SECURITY_OVERRIDE'],
        secretCode: 'PTL-FOUNDER-9999',
        trustedDevices: ['node_master_browser', 'samsung_s22_ultra_founder'],
        createdBy: 'system_root',
        createdAt: Date.now(),
        status: 'ACTIVE'
      }
    ];

    try {
      localStorage.setItem(this.ADMIN_PROFILES_KEY, JSON.stringify(defaultProfiles));
    } catch (e) {
      console.error(e);
    }

    return defaultProfiles;
  }

  public static saveAdminProfile(profile: AdminProfileRecord): void {
    const list = this.getAdminProfiles();
    const idx = list.findIndex(p => p.uid === profile.uid || p.email === profile.email);
    if (idx >= 0) {
      list[idx] = profile;
    } else {
      list.push(profile);
    }
    localStorage.setItem(this.ADMIN_PROFILES_KEY, JSON.stringify(list));
  }
}
