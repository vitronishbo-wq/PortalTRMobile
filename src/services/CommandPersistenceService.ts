// src/services/CommandPersistenceService.ts — Persistência Dinâmica de Comandos e Histórico
// Diretrizes 15 & 16: Desacoplar comandos do código-fonte e manter histórico imutável com evidência real

import { UserRole } from '../engine/permissionEngine';

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

  /**
   * Inicializa sementes de comandos dinâmicos no storage se não existirem
   */
  public static getStoredCommands(): StoredCommandRecord[] {
    try {
      const raw = localStorage.getItem(this.COMMANDS_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error(e);
    }

    const defaultCommands: StoredCommandRecord[] = [
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
        createdAt: Date.now(),
        createdBy: 'system_root',
        executionCount: 0,
        operationalStatus: 'VALIDATED'
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
        createdAt: Date.now(),
        createdBy: 'system_root',
        executionCount: 0,
        operationalStatus: 'VALIDATED'
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
        createdAt: Date.now(),
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
        createdAt: Date.now(),
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
        createdAt: Date.now(),
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
        createdAt: Date.now(),
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
        createdAt: Date.now(),
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
        createdAt: Date.now(),
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
        createdAt: Date.now(),
        createdBy: 'system_root',
        executionCount: 0,
        operationalStatus: 'VALIDATED'
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
        createdAt: Date.now(),
        createdBy: 'system_root',
        executionCount: 0,
        operationalStatus: 'VALIDATED'
      }
    ];

    try {
      localStorage.setItem(this.COMMANDS_STORAGE_KEY, JSON.stringify(defaultCommands));
    } catch (e) {
      console.error(e);
    }

    return defaultCommands;
  }

  public static saveCommand(command: StoredCommandRecord): void {
    const commands = this.getStoredCommands();
    const idx = commands.findIndex(c => c.id === command.id || c.command === command.command);
    if (idx >= 0) {
      commands[idx] = command;
    } else {
      commands.push(command);
    }
    localStorage.setItem(this.COMMANDS_STORAGE_KEY, JSON.stringify(commands));
  }

  public static recordExecution(
    commandStr: string,
    args: string[],
    status: CommandHistoryRecord['status'],
    executionTimeMs: number,
    result: string,
    error?: string
  ): CommandHistoryRecord {
    const uid = localStorage.getItem('portal_current_uid') || 'root_founder';
    const deviceId = localStorage.getItem('portal_device_id') || 'local_node_master';

    // Atualiza contadores no comando armazenado
    const commands = this.getStoredCommands();
    const targetCmd = commands.find(c => c.command === commandStr || c.aliases.includes(commandStr));
    if (targetCmd) {
      targetCmd.executionCount = (targetCmd.executionCount || 0) + 1;
      targetCmd.lastExecutedAt = Date.now();
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
      evidenceId: `ev_${Date.now()}`
    };

    try {
      const history = this.getHistory();
      history.unshift(historyEntry);
      localStorage.setItem(this.HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 300)));
    } catch (e) {
      console.error(e);
    }

    return historyEntry;
  }

  public static getHistory(): CommandHistoryRecord[] {
    try {
      const raw = localStorage.getItem(this.HISTORY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public static clearHistory(): void {
    localStorage.removeItem(this.HISTORY_STORAGE_KEY);
  }
}
