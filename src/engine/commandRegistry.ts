// src/engine/commandRegistry.ts — Registro Central de Comandos e Hierarquia COS
// Diretrizes 03, 27 & 32: Hierarquia Estrita (FOUNDER -> ADMIN -> OPERATOR -> USER)
// Suporte nativo a DTMF T9 (*#7668# -> ROOT), Códigos USSD (*100# - *111#) e Engenharia (*9xx#, *8xx#, *7xx#, *6xx#)

import { UserRole } from './permissionEngine';
import { SecretVaultService } from '../services/SecretVaultService';

export interface CommandDefinition {
  id: string;
  command: string; // Ex: *#FOUNDER#, *#7668#, *100#
  aliases: string[]; // Ex: ['*#ROOT#', '*#3686337#', '*100#', 'founder', '> founder']
  description: string;
  category: 'NAVIGATION' | 'ADMIN' | 'SESSION' | 'DEVICE' | 'TELECOM' | 'SECURITY';
  requiredRole: UserRole;
  requiresPin: boolean;
  requiresBiometric: boolean;
  requiresTrustedDevice: boolean;
  requiresConfirmation: boolean;
  actionId: string;
  enabled: boolean;
  t9Code?: string;
  ussdCode?: string;
}

export class CommandRegistry {
  private static readonly COMMANDS: CommandDefinition[] = [
    // ========================================================
    // 1. HIERARQUIA FOUNDER (ROOT SUPREMO) — *100#, *#7668#, *#3686337#
    // ========================================================
    {
      id: 'cmd_founder',
      command: '*#FOUNDER#',
      aliases: [
        '*#ROOT#',
        '*#MASTER#',
        '*#3686337#', // T9 FOUNDER
        '*#7668#',    // T9 ROOT
        '*#627837#',  // T9 MASTER
        '*100#',      // USSD Founder
        'founder',
        '> founder'
      ],
      description: 'Abrir Founder Console (IDE de Operações)',
      category: 'NAVIGATION',
      requiredRole: 'FOUNDER',
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: true,
      requiresConfirmation: false,
      actionId: 'OPEN_FOUNDER_CONSOLE',
      enabled: true,
      t9Code: '3686337',
      ussdCode: '*100#'
    },
    {
      id: 'cmd_create_admin',
      command: '*#CREATEADMIN#',
      aliases: [
        '*#NEWADMIN#',
        '*#27328323646#', // T9 CREATEADMIN
        '*100*01#',       // USSD Hierárquico Criar Admin
        '100*01#',
        'create admin',
        'add admin'
      ],
      description: 'Provisionar novo Administrador (*#CREATEADMIN:EMAIL=...:ROLE=...# ou *100*01*email#)',
      category: 'ADMIN',
      requiredRole: 'FOUNDER',
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: true,
      requiresConfirmation: false,
      actionId: 'OPEN_CREATE_ADMIN_MODAL',
      enabled: true,
      t9Code: '27328323646',
      ussdCode: '*100*01#'
    },
    {
      id: 'cmd_system',
      command: '*#SYSTEM#',
      aliases: [
        '*#797836#', // T9 SYSTEM
        '*110#',     // USSD System
        '*900#',     // Eng Sistema Kernel
        '*901#',     // Eng Manifest
        '*902#',     // Eng Readiness
        'system',
        'open system'
      ],
      description: 'Console Central de Sistema, Kernel e Manifesto Operacional',
      category: 'ADMIN',
      requiredRole: 'FOUNDER',
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: true,
      requiresConfirmation: false,
      actionId: 'OPEN_SYSTEM_VIEW',
      enabled: true,
      t9Code: '797836',
      ussdCode: '*110#'
    },
    {
      id: 'cmd_audit',
      command: '*#AUDIT#',
      aliases: [
        '*#LOGS#',
        '*#28348#', // T9 AUDIT
        '*#5647#',  // T9 LOGS
        '*105#',    // USSD Audit
        '*805#',    // Eng Audit Security
        'audit',
        'audit security',
        'logs'
      ],
      description: 'Auditoria de Segurança Imutável em Tempo Real',
      category: 'SECURITY',
      requiredRole: 'FOUNDER',
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: true,
      requiresConfirmation: false,
      actionId: 'OPEN_AUDIT_LOGS',
      enabled: true,
      t9Code: '28348',
      ussdCode: '*105#'
    },
    {
      id: 'cmd_security',
      command: '*#SECURITY#',
      aliases: [
        '*#73287489#', // T9 SECURITY
        '*104#',       // USSD Security
        '*800#',       // Eng Security
        '*801#',       // Eng Wipe
        'security',
        'open security',
        'wipe session'
      ],
      description: 'Protocolo de Segurança, Wipe e Isolamento de Nós',
      category: 'SECURITY',
      requiredRole: 'FOUNDER',
      requiresPin: true,
      requiresBiometric: false,
      requiresTrustedDevice: true,
      requiresConfirmation: true,
      actionId: 'EXECUTE_WIPE_SESSION',
      enabled: true,
      t9Code: '73287489',
      ussdCode: '*104#'
    },
    {
      id: 'cmd_banking_hub',
      command: '*#BANKING#',
      aliases: [
        '*#FINANCE#',
        '*#2265464#', // T9 BANKING
        '*106#',      // USSD Banking
        'banking',
        'banking status',
        'open banking'
      ],
      description: 'Abrir Banking Hub (EMIS Multicaixa / BFA / BAI)',
      category: 'SECURITY',
      requiredRole: 'FOUNDER',
      requiresPin: true,
      requiresBiometric: false,
      requiresTrustedDevice: true,
      requiresConfirmation: false,
      actionId: 'OPEN_BANKING_VIEW',
      enabled: true,
      t9Code: '2265464',
      ussdCode: '*106#'
    },
    {
      id: 'cmd_emergency',
      command: '*#EMERGENCY#',
      aliases: [
        '*111#',
        '*802#',
        'emergency',
        'lockout'
      ],
      description: 'Lockout de Emergência Global (*111#)',
      category: 'SECURITY',
      requiredRole: 'FOUNDER',
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: false,
      requiresConfirmation: true,
      actionId: 'EXECUTE_LOCK_DEVICE',
      enabled: true,
      ussdCode: '*111#'
    },

    // ========================================================
    // 2. HIERARQUIA ADMIN (OPERADOR PRIVILEGIADO) — *101#, *102#, *103#
    // ========================================================
    {
      id: 'cmd_admin_center',
      command: '*#ADMIN#',
      aliases: [
        '*#23646#', // T9 ADMIN
        '*101#',    // USSD Admin
        'admin',
        'open admin'
      ],
      description: 'Painel Central de Administração COS',
      category: 'ADMIN',
      requiredRole: 'ADMIN',
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: false,
      requiresConfirmation: false,
      actionId: 'OPEN_ADMIN_CONSOLE',
      enabled: true,
      t9Code: '23646',
      ussdCode: '*101#'
    },
    {
      id: 'cmd_devices',
      command: '*#DEVICES#',
      aliases: [
        '*#FLEET#',
        '*#3384237#', // T9 DEVICES
        '*#35338#',   // T9 FLEET
        '*102#',      // USSD Devices
        '*600#',      // Eng Devices Fleet
        'devices',
        'open devices',
        'fleet'
      ],
      description: 'Abrir Device Center & Mesh de Dispositivos (*102# ou *600#)',
      category: 'DEVICE',
      requiredRole: 'ADMIN',
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: false,
      requiresConfirmation: false,
      actionId: 'OPEN_DEVICES_VIEW',
      enabled: true,
      t9Code: '3384237',
      ussdCode: '*102#'
    },
    {
      id: 'cmd_users',
      command: '*#USERS#',
      aliases: [
        '*#87377#', // T9 USERS
        'users',
        'open users',
        'manage users'
      ],
      description: 'Administração de Perfis e Permissões de Utilizadores',
      category: 'ADMIN',
      requiredRole: 'ADMIN',
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: false,
      requiresConfirmation: false,
      actionId: 'OPEN_USERS_VIEW',
      enabled: true,
      t9Code: '87377'
    },
    {
      id: 'cmd_telecom_center',
      command: '*#TELECOM#',
      aliases: [
        '*#CARRIERS#',
        '*#8353266#', // T9 TELECOM
        '*103#',      // USSD Telecom
        '*700#',      // Eng Telecom Trunks
        '*701#',      // Eng Virtual Numbers
        '*703#',      // Eng IMS/SIP
        'telecom',
        'telecom status',
        'open telecom'
      ],
      description: 'Abrir Telecom Console (SIP/IMS/Operadoras Angola)',
      category: 'TELECOM',
      requiredRole: 'ADMIN',
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: false,
      requiresConfirmation: false,
      actionId: 'OPEN_TELECOM_VIEW',
      enabled: true,
      t9Code: '8353266',
      ussdCode: '*103#'
    },
    {
      id: 'cmd_messages',
      command: '*#MESSAGES#',
      aliases: [
        '*#63772437#', // T9 MESSAGES
        '*704#',       // Eng SMS Hub
        'messages',
        'open messages',
        'sms console'
      ],
      description: 'Console Avançada de Mensagens e Despacho de SMS',
      category: 'TELECOM',
      requiredRole: 'ADMIN',
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: false,
      requiresConfirmation: false,
      actionId: 'OPEN_MESSAGES_VIEW',
      enabled: true,
      t9Code: '63772437',
      ussdCode: '*704#'
    },
    {
      id: 'cmd_notifications',
      command: '*#NOTIFICATIONS#',
      aliases: [
        '*#6684342284667#', // T9 NOTIFICATIONS
        'notifications',
        'open notifications'
      ],
      description: 'Transmissão e Listener de Notificações de Nós Android',
      category: 'DEVICE',
      requiredRole: 'ADMIN',
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: false,
      requiresConfirmation: false,
      actionId: 'OPEN_NOTIFICATIONS_VIEW',
      enabled: true,
      t9Code: '6684342284667'
    },
    {
      id: 'cmd_lock_device',
      command: '*#LOCK#',
      aliases: [
        '*#5625#', // T9 LOCK
        '*100*02#',
        '100*02#',
        'lock',
        'lock device'
      ],
      description: 'Bloquear dispositivo (*#LOCK:DEVICE=S22# ou *100*02*923000000#)',
      category: 'DEVICE',
      requiredRole: 'ADMIN',
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: false,
      requiresConfirmation: true,
      actionId: 'EXECUTE_LOCK_DEVICE',
      enabled: true,
      t9Code: '5625'
    },
    {
      id: 'cmd_update_ota',
      command: '*#UPDATE#',
      aliases: [
        '*#873283#', // T9 UPDATE
        '*109#',     // USSD Update
        'update',
        'check update'
      ],
      description: 'Verificar e Aplicar Atualizações OTA (*109#)',
      category: 'ADMIN',
      requiredRole: 'ADMIN',
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: false,
      requiresConfirmation: false,
      actionId: 'OPEN_UPDATE_VIEW',
      enabled: true,
      t9Code: '873283',
      ussdCode: '*109#'
    },

    // ========================================================
    // 3. HIERARQUIA OPERATOR — *107#, *108#, *601#
    // ========================================================
    {
      id: 'cmd_sync_all',
      command: '*#SYNC#',
      aliases: [
        '*#7962#', // T9 SYNC
        '*601#',   // Eng Force Sync
        '*100*04#',
        '100*04#',
        'sync',
        'sync now'
      ],
      description: 'Sincronizar telemetria, logs e canais em tempo real (*601#)',
      category: 'DEVICE',
      requiredRole: 'OPERATOR',
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: false,
      requiresConfirmation: false,
      actionId: 'EXECUTE_SYNC_ALL',
      enabled: true,
      t9Code: '7962',
      ussdCode: '*601#'
    },
    {
      id: 'cmd_pair_device',
      command: '*#PAIR#',
      aliases: [
        '*#7247#', // T9 PAIR
        '*107#',   // USSD Pairing
        '*603#',   // Eng Zero Touch
        '*100*03#',
        '100*03#',
        'pair',
        'pair device',
        'pair desktop'
      ],
      description: 'Emparelhar dispositivo (*107# ou *100*03*S22#)',
      category: 'DEVICE',
      requiredRole: 'OPERATOR',
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: false,
      requiresConfirmation: false,
      actionId: 'EXECUTE_PAIR_DEVICE',
      enabled: true,
      t9Code: '7247',
      ussdCode: '*107#'
    },
    {
      id: 'cmd_transfer_session',
      command: '*#TRANSFER#',
      aliases: [
        '*#87267337#', // T9 TRANSFER
        '*108#',       // USSD Sessions
        '*602#',       // Eng Mesh Sessions
        '*100*05#',
        '100*05#',
        'transfer',
        'transfer session'
      ],
      description: 'Transferir sessão ativa (*108# ou *100*05*TABLET#)',
      category: 'SESSION',
      requiredRole: 'OPERATOR',
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: false,
      requiresConfirmation: true,
      actionId: 'EXECUTE_TRANSFER_SESSION',
      enabled: true,
      t9Code: '87267337',
      ussdCode: '*108#'
    },
    {
      id: 'cmd_call_test',
      command: '*#CALLTEST#',
      aliases: [
        '*#22558378#', // T9 CALLTEST
        '*702#',       // Eng WebRTC Call Test
        'calltest',
        'test call'
      ],
      description: 'Disparar diagnóstico de canal de voz e WebRTC (*702#)',
      category: 'TELECOM',
      requiredRole: 'OPERATOR',
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: false,
      requiresConfirmation: false,
      actionId: 'EXECUTE_CALL_TEST',
      enabled: true,
      t9Code: '22558378',
      ussdCode: '*702#'
    },

    // ========================================================
    // 4. HIERARQUIA USER
    // ========================================================
    {
      id: 'cmd_call',
      command: '*#CALL#',
      aliases: ['call', 'make call'],
      description: 'Iniciar chamada telefónica (*#CALL:NUM=+244...#)',
      category: 'TELECOM',
      requiredRole: 'USER',
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: false,
      requiresConfirmation: false,
      actionId: 'EXECUTE_CALL',
      enabled: true
    },
    {
      id: 'cmd_sms',
      command: '*#SMS#',
      aliases: ['sms', 'send sms'],
      description: 'Enviar SMS (*#SMS:TO=...:TEXT=...#)',
      category: 'TELECOM',
      requiredRole: 'USER',
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: false,
      requiresConfirmation: false,
      actionId: 'EXECUTE_SMS',
      enabled: true
    },
    {
      id: 'cmd_contacts',
      command: '*#CONTACTS#',
      aliases: [
        '*#26682287#', // T9 CONTACTS
        'contacts',
        'open contacts'
      ],
      description: 'Abrir lista de contactos telefónicos',
      category: 'NAVIGATION',
      requiredRole: 'USER',
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: false,
      requiresConfirmation: false,
      actionId: 'OPEN_CONTACTS_VIEW',
      enabled: true,
      t9Code: '26682287'
    }
  ];

  public static getAll(): CommandDefinition[] {
    return this.COMMANDS.filter(c => c.enabled);
  }

  public static findByCommandOrAlias(rawInput: string): CommandDefinition | undefined {
    const clean = rawInput.trim().toUpperCase();

    // 1. Busca dinâmica no SecretVaultService (Permite alteração de códigos em tempo de execução sem recompilar)
    try {
      const vaultConfig = SecretVaultService.getConfig();
      const vaultCmd = vaultConfig.commands.find(c => c.enabled && c.code.toUpperCase() === clean);
      if (vaultCmd) {
        // Mapeia para o comando correspondente no registro
        const matched = this.COMMANDS.find(c => c.id === vaultCmd.id || c.actionId.includes(vaultCmd.name.toUpperCase()));
        if (matched) return matched;
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Busca padrão no registro
    return this.COMMANDS.find(c => 
      c.enabled && (
        c.command === clean || 
        c.aliases.some(a => a.toUpperCase() === clean || `>${a.toUpperCase()}` === clean)
      )
    );
  }
}
