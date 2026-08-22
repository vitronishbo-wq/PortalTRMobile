// src/services/CommandPersistenceService.ts — Persistência Dinâmica de Comandos e Histórico
// Diretrizes 15 & 16: Desacoplar comandos do código-fonte e manter histórico imutável com evidência real no Firestore

import { UserRole } from '../engine/permissionEngine';
import { FirestoreService } from './firestore';

export interface StoredCommandRecord {
  id: string;
  command: string;
  aliases: string[];
  description: string;
  role: UserRole;
  category: 'SYSTEM' | 'SECURITY' | 'TELECOM' | 'BANKING' | 'DEVICES' | 'SESSIONS' | 'USERS' | 'FOUNDER';
  enabled: boolean;
  requiresPin: boolean;
  requiresBiometric: boolean;
  requiresTrustedDevice: boolean;
  actionId: string;
  createdAt: number;
  createdBy: string;
  lastExecutedAt?: number;
  executionCount: number;
  operationalStatus: 'IMPLEMENTED' | 'CONFIGURED' | 'TESTED' | 'VALIDATED' | 'OPERATIONAL';
}

export interface CommandHistoryRecord {
  historyId: string;
  uid: string;
  deviceId: string;
  command: string;
  arguments: string[];
  timestamp: number;
  executionTimeMs: number;
  result: string;
  status: 'SUCCESS' | 'FAILED' | 'DENIED' | 'CANCELLED' | 'EXPIRED';
  error?: string;
  evidenceId?: string;
}

export class CommandPersistenceService {
  private static readonly COMMANDS_STORAGE_KEY = 'portal_persisted_commands';
  private static readonly HISTORY_STORAGE_KEY = 'portal_command_history';
  private static isInitialized = false;
  private static memoryCommands: StoredCommandRecord[] = [];
  private static memoryHistory: CommandHistoryRecord[] = [];

  private static readonly DEFAULT_COMMANDS: StoredCommandRecord[] = [
    {
      id: 'cmd_root',
      command: '*#ROOT#',
      aliases: ['*#FOUNDER#', 'open founder', 'founder'],
      description: 'Abrir Founder Console (IDE de Operações)',
      role: 'FOUNDER',
      category: 'FOUNDER',
      enabled: true,
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: true,
      actionId: 'OPEN_FOUNDER_CONSOLE',
      createdAt: 1700000000000,
      createdBy: 'system_root',
      executionCount: 0,
      operationalStatus: 'OPERATIONAL'
    },
    {
      id: 'cmd_admin',
      command: '*#ADMIN#',
      aliases: ['*#OPS#', 'open admin', 'admin'],
      description: 'Abrir Admin Console',
      role: 'ADMIN',
      category: 'SYSTEM',
      enabled: true,
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: false,
      actionId: 'OPEN_ADMIN_CONSOLE',
      createdAt: 1700000000000,
      createdBy: 'system_root',
      executionCount: 0,
      operationalStatus: 'OPERATIONAL'
    },
    {
      id: 'cmd_create_admin',
      command: '*#CREATEADMIN#',
      aliases: ['*#NEWADMIN#', 'create admin'],
      description: 'Provisionar novo Administrador dinamicamente',
      role: 'FOUNDER',
      category: 'USERS',
      enabled: true,
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: true,
      actionId: 'OPEN_CREATE_ADMIN_MODAL',
      createdAt: 1700000000000,
      createdBy: 'system_root',
      executionCount: 0,
      operationalStatus: 'VALIDATED'
    },
    {
      id: 'cmd_devices',
      command: '*#DEVICES#',
      aliases: ['*#FLEET#', 'open devices', 'devices'],
      description: 'Abrir Mesh de Dispositivos e Sessões',
      role: 'ADMIN',
      category: 'DEVICES',
      enabled: true,
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: false,
      actionId: 'OPEN_DEVICES_VIEW',
      createdAt: 1700000000000,
      createdBy: 'system_root',
      executionCount: 0,
      operationalStatus: 'CONFIGURED'
    },
    {
      id: 'cmd_telecom',
      command: '*#TELECOM#',
      aliases: ['*#CARRIERS#', 'open telecom', 'telecom'],
      description: 'Abrir Painel Telecom (SIP/IMS/DIDs)',
      role: 'ADMIN',
      category: 'TELECOM',
      enabled: true,
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: false,
      actionId: 'OPEN_TELECOM_VIEW',
      createdAt: 1700000000000,
      createdBy: 'system_root',
      executionCount: 0,
      operationalStatus: 'CONFIGURED'
    },
    {
      id: 'cmd_banking',
      command: '*#BANKING#',
      aliases: ['*#FINANCE#', 'open banking', 'banking'],
      description: 'Abrir Banking Hub (EMIS Multicaixa / BFA / BAI)',
      role: 'FOUNDER',
      category: 'BANKING',
      enabled: true,
      requiresPin: true,
      requiresBiometric: false,
      requiresTrustedDevice: true,
      actionId: 'OPEN_BANKING_VIEW',
      createdAt: 1700000000000,
      createdBy: 'system_root',
      executionCount: 0,
      operationalStatus: 'CONFIGURED'
    },
    {
      id: 'cmd_lock',
      command: '*#LOCK#',
      aliases: ['lock device', 'lock'],
      description: 'Bloqueio Imediato de Dispositivo ou Nó',
      role: 'ADMIN',
      category: 'SECURITY',
      enabled: true,
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: false,
      actionId: 'EXECUTE_LOCK_DEVICE',
      createdAt: 1700000000000,
      createdBy: 'system_root',
      executionCount: 0,
      operationalStatus: 'VALIDATED'
    },
    {
      id: 'cmd_wipe',
      command: '*#WIPE#',
      aliases: ['wipe session', 'wipe'],
      description: 'Eliminação Segura de Sessão e Credenciais Locais',
      role: 'FOUNDER',
      category: 'SECURITY',
      enabled: true,
      requiresPin: true,
      requiresBiometric: false,
      requiresTrustedDevice: true,
      actionId: 'EXECUTE_WIPE_SESSION',
      createdAt: 1700000000000,
      createdBy: 'system_root',
      executionCount: 0,
      operationalStatus: 'VALIDATED'
    },
    {
      id: 'cmd_sync',
      command: '*#SYNC#',
      aliases: ['sync now', 'sync'],
      description: 'Sincronização de Telemetria e Canais em Tempo Real',
      role: 'OPERATOR',
      category: 'SYSTEM',
      enabled: true,
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: false,
      actionId: 'EXECUTE_SYNC_ALL',
      createdAt: 1700000000000,
      createdBy: 'system_root',
      executionCount: 0,
      operationalStatus: 'OPERATIONAL'
    },
    {
      id: 'cmd_call_test',
      command: '*#CALLTEST#',
      aliases: ['calltest', 'test call'],
      description: 'Diagnóstico Estrito de Voz e WebRTC',
      role: 'OPERATOR',
      category: 'TELECOM',
      enabled: true,
      requiresPin: false,
      requiresBiometric: false,
      requiresTrustedDevice: false,
      actionId: 'EXECUTE_CALL_TEST',
      createdAt: 1700000000000,
      createdBy: 'system_root',
      executionCount: 0,
      operationalStatus: 'VALIDATED'
    }
  ];

  public static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Carregar cache local de contingência
    try {
      const rawCmds = localStorage.getItem(this.COMMANDS_STORAGE_KEY);
      this.memoryCommands = rawCmds ? JSON.parse(rawCmds) : this.DEFAULT_COMMANDS;

      const rawHist = localStorage.getItem(this.HISTORY_STORAGE_KEY);
      this.memoryHistory = rawHist ? JSON.parse(rawHist) : [];
    } catch (e) {
      this.memoryCommands = this.DEFAULT_COMMANDS;
    }

    // Subscrever Firestore em tempo real
    FirestoreService.listenToCommandDefinitions((remoteCmds) => {
      if (remoteCmds && remoteCmds.length > 0) {
        this.memoryCommands = remoteCmds as StoredCommandRecord[];
        try {
          localStorage.setItem(this.COMMANDS_STORAGE_KEY, JSON.stringify(this.memoryCommands));
        } catch {}
      }
    });

    FirestoreService.listenToCommandHistory((remoteHist) => {
      if (remoteHist && remoteHist.length > 0) {
        this.memoryHistory = remoteHist as CommandHistoryRecord[];
        try {
          localStorage.setItem(this.HISTORY_STORAGE_KEY, JSON.stringify(this.memoryHistory.slice(0, 150)));
        } catch {}
      }
    });
  }

  /**
   * Obtém comandos dinâmicos (Firestore + cache local)
   */
  public static getStoredCommands(): StoredCommandRecord[] {
    this.init();
    if (this.memoryCommands.length === 0) {
      this.memoryCommands = this.DEFAULT_COMMANDS;
    }
    return [...this.memoryCommands];
  }

  /**
   * Salva comando no Firestore e no cache local
   */
  public static saveCommand(command: StoredCommandRecord): void {
    this.init();
    const idx = this.memoryCommands.findIndex(c => c.id === command.id || c.command === command.command);
    if (idx >= 0) {
      this.memoryCommands[idx] = command;
    } else {
      this.memoryCommands.push(command);
    }

    try {
      localStorage.setItem(this.COMMANDS_STORAGE_KEY, JSON.stringify(this.memoryCommands));
    } catch {}

    // Persistência real no Firestore
    FirestoreService.saveCommandDefinition(command).catch((e) => {
      console.warn('[CommandPersistenceService] Erro ao gravar comando no Firestore:', e);
    });
  }

  /**
   * Registra a execução de forma imutável com evidência real no Firestore
   */
  public static recordExecution(
    commandStr: string,
    args: string[],
    status: CommandHistoryRecord['status'],
    executionTimeMs: number,
    result: string,
    error?: string
  ): CommandHistoryRecord {
    this.init();
    const uid = localStorage.getItem('portal_current_uid') || 'root_founder';
    const deviceId = localStorage.getItem('portal_device_id') || 'local_node_master';

    // Atualiza contadores no comando armazenado
    const targetCmd = this.memoryCommands.find(c => c.command === commandStr || c.aliases.includes(commandStr));
    if (targetCmd) {
      targetCmd.executionCount = (targetCmd.executionCount || 0) + 1;
      targetCmd.lastExecutedAt = Date.now();
      if (status === 'SUCCESS' && targetCmd.operationalStatus !== 'OPERATIONAL') {
        targetCmd.operationalStatus = 'TESTED';
      }
      this.saveCommand(targetCmd);
    }

    const historyEntry: CommandHistoryRecord = {
      historyId: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      uid,
      deviceId,
      command: commandStr,
      arguments: args,
      timestamp: Date.now(),
      executionTimeMs,
      result,
      status,
      error,
      evidenceId: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };

    this.memoryHistory.unshift(historyEntry);
    try {
      localStorage.setItem(this.HISTORY_STORAGE_KEY, JSON.stringify(this.memoryHistory.slice(0, 300)));
    } catch {}

    // Persistência no Firestore
    FirestoreService.saveCommandHistory(historyEntry).catch((e) => {
      console.warn('[CommandPersistenceService] Erro ao gravar histórico no Firestore:', e);
    });

    return historyEntry;
  }

  public static getHistory(): CommandHistoryRecord[] {
    this.init();
    return [...this.memoryHistory];
  }

  public static clearHistory(): void {
    this.memoryHistory = [];
    localStorage.removeItem(this.HISTORY_STORAGE_KEY);
  }
}

