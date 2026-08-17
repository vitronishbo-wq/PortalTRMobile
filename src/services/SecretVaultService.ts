// src/services/SecretVaultService.ts — Cofre de Comandos MMI & Dial Codes (COS Vault)
// Nível 2 e Nível 4: Código Mestre (*#6368#), Estados de Gaveta (HIDDEN, UNLOCKED, AUTO_LOCKED),
// Auto-expiração e Gestão Dinâmica sem hardcoding.

export type DrawerSecurityState = 'HIDDEN' | 'UNLOCKED' | 'AUTO_LOCKED';

export interface SecretCommandExecutionRecord {
  id: string;
  command: string;
  userId: string;
  deviceId: string;
  sessionId: string;
  timestamp: number;
  execution_time: number; // em ms
  result: 'SUCCESS' | 'FAILED' | 'DENIED' | 'BLOCKED';
  ip: string;
  privilege_level: 'ROOT' | 'FOUNDER' | 'ADMIN' | 'ENGINEERING' | 'USER';
  details?: string;
}

export interface SecretDialCommand {
  id: string;
  code: string;            // Ex: "*#7668#", "*100#"
  name: string;            // Ex: "ROOT", "Founder Core"
  category: 'FOUNDER' | 'ADMIN' | 'ENGINEERING' | 'TELECOM' | 'SECURITY' | 'UTILITY';
  level: 'NIVEL_3_PRIVILEGIOS' | 'NIVEL_4_OPERACIONAL' | 'NIVEL_1_PUBLICO';
  description: string;
  enabled: boolean;
  roleRequired: 'FOUNDER' | 'ADMIN' | 'ROOT' | 'USER';
  badgeColor?: string;
  lastExecutedAt?: number;
  executionCount: number;
}

export interface SecretVaultConfig {
  revealCode: string;               // Código mestre de revelação (Padrão: *#6368# -> *#MENU#)
  drawerState: DrawerSecurityState;
  unlockedAt: number | null;
  expirationMinutes: number;        // Padrão: 5 minutos
  autoLockOnSos: boolean;
  autoLockOnSessionEnd: boolean;
  trustedDevices: string[];
  commands: SecretDialCommand[];
  lastRotatedAt: number;
  recoveryPinHash: string;          // Hash/Pin de recuperação do Founder
}

export class SecretVaultService {
  private static readonly STORAGE_KEY = 'portal_cos_secret_vault_config';
  private static readonly RECOVERY_STORAGE_KEY = 'portal_cos_secret_vault_recovery';
  private static autoLockTimer: any = null;
  private static listeners: Set<(config: SecretVaultConfig) => void> = new Set();

  /**
   * Lista oficial dos 20 comandos gerenciados pelo COS Vault
   */
  private static readonly INITIAL_20_COMMANDS: SecretDialCommand[] = [
    // Nível 3 — Elevação de privilégios (Comandos Adicionais)
    {
      id: 'cmd_root_t9',
      code: '*#7668#',
      name: 'ROOT Access',
      category: 'FOUNDER',
      level: 'NIVEL_3_PRIVILEGIOS',
      description: 'Elevação direta para credenciais ROOT e auditoria irrestrita',
      enabled: true,
      roleRequired: 'ROOT',
      badgeColor: 'text-rose-400 border-rose-500/30',
      executionCount: 0
    },
    {
      id: 'cmd_founder_t9',
      code: '*#3686337#',
      name: 'FOUNDER Console',
      category: 'FOUNDER',
      level: 'NIVEL_3_PRIVILEGIOS',
      description: 'Abertura do Founder IDE Workspace e painel de soberania',
      enabled: true,
      roleRequired: 'FOUNDER',
      badgeColor: 'text-amber-400 border-amber-500/30',
      executionCount: 0
    },
    {
      id: 'cmd_admin_t9',
      code: '*#23646#',
      name: 'ADMIN Elevate',
      category: 'ADMIN',
      level: 'NIVEL_3_PRIVILEGIOS',
      description: 'Autenticação e elevação para perfil de Administrador',
      enabled: true,
      roleRequired: 'ADMIN',
      badgeColor: 'text-indigo-400 border-indigo-500/30',
      executionCount: 0
    },
    {
      id: 'cmd_sync_t9',
      code: '*#7962#',
      name: 'SYNC Mesh',
      category: 'ENGINEERING',
      level: 'NIVEL_3_PRIVILEGIOS',
      description: 'Sincronização forçada da malha de dispositivos e clipboard',
      enabled: true,
      roleRequired: 'ADMIN',
      badgeColor: 'text-cyan-400 border-cyan-500/30',
      executionCount: 0
    },
    {
      id: 'cmd_pair_t9',
      code: '*#7247#',
      name: 'PAIR Node',
      category: 'ENGINEERING',
      level: 'NIVEL_3_PRIVILEGIOS',
      description: 'Protocolo de emparelhamento Zero-Touch para novos nós',
      enabled: true,
      roleRequired: 'ADMIN',
      badgeColor: 'text-emerald-400 border-emerald-500/30',
      executionCount: 0
    },
    {
      id: 'cmd_lock_t9',
      code: '*#5625#',
      name: 'LOCK Screen',
      category: 'SECURITY',
      level: 'NIVEL_3_PRIVILEGIOS',
      description: 'Bloqueio instantâneo da interface do dispositivo',
      enabled: true,
      roleRequired: 'USER',
      badgeColor: 'text-rose-400 border-rose-500/30',
      executionCount: 0
    },
    {
      id: 'cmd_cos_kernel',
      code: '*900#',
      name: 'COS Kernel',
      category: 'ENGINEERING',
      level: 'NIVEL_3_PRIVILEGIOS',
      description: 'Painel de status do Kernel do Communication OS',
      enabled: true,
      roleRequired: 'ADMIN',
      badgeColor: 'text-purple-400 border-purple-500/30',
      executionCount: 0
    },
    {
      id: 'cmd_telecom_ping',
      code: '*700#',
      name: 'Telecom Ping',
      category: 'TELECOM',
      level: 'NIVEL_3_PRIVILEGIOS',
      description: 'Ping e diagnóstico de rotas SIP/IMS/SMPP das operadoras',
      enabled: true,
      roleRequired: 'USER',
      badgeColor: 'text-sky-400 border-sky-500/30',
      executionCount: 0
    },

    // Nível 4 — Execução operacional (Grade Principal USSD)
    {
      id: 'ussd_100',
      code: '*100#',
      name: 'Founder Core',
      category: 'FOUNDER',
      level: 'NIVEL_4_OPERACIONAL',
      description: 'Menu mestre de operações do Fundador e criação de administradores',
      enabled: true,
      roleRequired: 'FOUNDER',
      badgeColor: 'text-amber-400 border-amber-500/30',
      executionCount: 0
    },
    {
      id: 'ussd_101',
      code: '*101#',
      name: 'Admin Center',
      category: 'ADMIN',
      level: 'NIVEL_4_OPERACIONAL',
      description: 'Centro de gestão e permissões de nós operacionais',
      enabled: true,
      roleRequired: 'ADMIN',
      badgeColor: 'text-indigo-400 border-indigo-500/30',
      executionCount: 0
    },
    {
      id: 'ussd_102',
      code: '*102#',
      name: 'Devices Matrix',
      category: 'ENGINEERING',
      level: 'NIVEL_4_OPERACIONAL',
      description: 'Visualização e gestão da matriz de dispositivos conectados',
      enabled: true,
      roleRequired: 'ADMIN',
      badgeColor: 'text-cyan-400 border-cyan-500/30',
      executionCount: 0
    },
    {
      id: 'ussd_103',
      code: '*103#',
      name: 'Telecom Engine',
      category: 'TELECOM',
      level: 'NIVEL_4_OPERACIONAL',
      description: 'Gestão de operadoras Unitel, Movicel, Africell e troncos SIP',
      enabled: true,
      roleRequired: 'ADMIN',
      badgeColor: 'text-emerald-400 border-emerald-500/30',
      executionCount: 0
    },
    {
      id: 'ussd_104',
      code: '*104#',
      name: 'Security & Lock',
      category: 'SECURITY',
      level: 'NIVEL_4_OPERACIONAL',
      description: 'Controle de isolamento, wipe remoto e políticas de segurança',
      enabled: true,
      roleRequired: 'ADMIN',
      badgeColor: 'text-rose-400 border-rose-500/30',
      executionCount: 0
    },
    {
      id: 'ussd_105',
      code: '*105#',
      name: 'Audit Log Trail',
      category: 'SECURITY',
      level: 'NIVEL_4_OPERACIONAL',
      description: 'Trilha de auditoria criptográfica e logs imutáveis',
      enabled: true,
      roleRequired: 'ADMIN',
      badgeColor: 'text-purple-400 border-purple-500/30',
      executionCount: 0
    },
    {
      id: 'ussd_106',
      code: '*106#',
      name: 'Banking Multi',
      category: 'ENGINEERING',
      level: 'NIVEL_4_OPERACIONAL',
      description: 'Hub de pagamentos EMIS, Multicaixa Express e Unitel Money',
      enabled: true,
      roleRequired: 'ADMIN',
      badgeColor: 'text-emerald-400 border-emerald-500/30',
      executionCount: 0
    },
    {
      id: 'ussd_107',
      code: '*107#',
      name: 'Pairing Mesh',
      category: 'ENGINEERING',
      level: 'NIVEL_4_OPERACIONAL',
      description: 'Assistente de emparelhamento por QR Code ou link criptografado',
      enabled: true,
      roleRequired: 'ADMIN',
      badgeColor: 'text-indigo-400 border-indigo-500/30',
      executionCount: 0
    },
    {
      id: 'ussd_108',
      code: '*108#',
      name: 'Session Hub',
      category: 'ENGINEERING',
      level: 'NIVEL_4_OPERACIONAL',
      description: 'Controle e migração de sessões ativas entre dispositivos',
      enabled: true,
      roleRequired: 'ADMIN',
      badgeColor: 'text-sky-400 border-sky-500/30',
      executionCount: 0
    },
    {
      id: 'ussd_109',
      code: '*109#',
      name: 'Kernel Update',
      category: 'ENGINEERING',
      level: 'NIVEL_4_OPERACIONAL',
      description: 'Verificação de integridade e atualizações de binários do COS',
      enabled: true,
      roleRequired: 'FOUNDER',
      badgeColor: 'text-yellow-400 border-yellow-500/30',
      executionCount: 0
    },
    {
      id: 'ussd_110',
      code: '*110#',
      name: 'System Health',
      category: 'ENGINEERING',
      level: 'NIVEL_4_OPERACIONAL',
      description: 'Diagnóstico de hardware, circuitos de energia, volume e display',
      enabled: true,
      roleRequired: 'USER',
      badgeColor: 'text-teal-400 border-teal-500/30',
      executionCount: 0
    },
    {
      id: 'ussd_111',
      code: '*111#',
      name: 'Lockdown SOS',
      category: 'SECURITY',
      level: 'NIVEL_4_OPERACIONAL',
      description: 'Isolamento emergencial global, bloqueio e auto-lock da gaveta',
      enabled: true,
      roleRequired: 'USER',
      badgeColor: 'text-red-400 border-red-500/40',
      executionCount: 0
    }
  ];

  public static getDefaultConfig(): SecretVaultConfig {
    return {
      revealCode: '*#6368#', // *#MENU# no teclado numérico T9
      drawerState: 'HIDDEN',
      unlockedAt: null,
      expirationMinutes: 5,
      autoLockOnSos: true,
      autoLockOnSessionEnd: true,
      trustedDevices: ['node_master_browser', 'samsung_s22_ultra_founder'],
      commands: JSON.parse(JSON.stringify(this.INITIAL_20_COMMANDS)),
      lastRotatedAt: Date.now(),
      recoveryPinHash: 'PTL-FOUNDER-9999'
    };
  }

  public static getConfig(): SecretVaultConfig {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
          const parsed: SecretVaultConfig = JSON.parse(raw);
          // Auto-expiração se passar de expirationMinutes
          if (parsed.drawerState === 'UNLOCKED' && parsed.unlockedAt) {
            const diffMs = Date.now() - parsed.unlockedAt;
            const maxMs = (parsed.expirationMinutes || 5) * 60 * 1000;
            if (diffMs > maxMs) {
              parsed.drawerState = 'AUTO_LOCKED';
              parsed.unlockedAt = null;
              this.saveConfig(parsed);
            }
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('[SecretVaultService] Erro ao carregar config:', e);
    }

    const defaultConfig = this.getDefaultConfig();
    this.saveConfig(defaultConfig);
    return defaultConfig;
  }

  public static saveConfig(config: SecretVaultConfig): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
      }
      this.emit(config);
    } catch (e) {
      console.error('[SecretVaultService] Erro ao salvar config:', e);
    }
  }

  public static subscribe(listener: (config: SecretVaultConfig) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private static emit(config: SecretVaultConfig): void {
    this.listeners.forEach(l => {
      try {
        l(config);
      } catch (err) {
        console.error(err);
      }
    });
  }

  /**
   * Tenta desbloquear a gaveta com um código de discagem
   */
  public static attemptUnlock(dialedCode: string): { success: boolean; state: DrawerSecurityState; message: string } {
    const config = this.getConfig();
    const clean = dialedCode.trim().toUpperCase();

    if (clean === config.revealCode.toUpperCase()) {
      config.drawerState = 'UNLOCKED';
      config.unlockedAt = Date.now();
      this.saveConfig(config);

      // Inicia timer de auto-lock de 5 minutos
      this.resetAutoLockTimer(config.expirationMinutes);

      return {
        success: true,
        state: 'UNLOCKED',
        message: 'COMMAND DRAWER UNLOCKED (20 COMMANDS AVAILABLE)'
      };
    }

    return {
      success: false,
      state: config.drawerState,
      message: 'Código de revelação não correspondente'
    };
  }

  /**
   * Força o bloqueio / ocultação imediata da gaveta
   */
  public static lockDrawer(reason: 'MANUAL' | 'AUTO_EXPIRE' | 'SOS_LOCKDOWN' | 'SESSION_CLOSE' = 'MANUAL'): void {
    const config = this.getConfig();
    config.drawerState = reason === 'AUTO_EXPIRE' ? 'AUTO_LOCKED' : 'HIDDEN';
    config.unlockedAt = null;
    this.saveConfig(config);

    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer);
      this.autoLockTimer = null;
    }
  }

  /**
   * Reseta o timer de auto-lock (chamado a cada interação)
   */
  public static refreshActivity(): void {
    const config = this.getConfig();
    if (config.drawerState === 'UNLOCKED') {
      config.unlockedAt = Date.now();
      this.saveConfig(config);
      this.resetAutoLockTimer(config.expirationMinutes);
    }
  }

  private static resetAutoLockTimer(minutes: number): void {
    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer);
    }
    this.autoLockTimer = setTimeout(() => {
      this.lockDrawer('AUTO_EXPIRE');
    }, (minutes || 5) * 60 * 1000);
  }

  /**
   * Atualiza ou Altera o Código de um Comando (Regra 2: sem recompilação)
   */
  public static updateCommandCode(commandId: string, newCode: string): boolean {
    const config = this.getConfig();
    const cmd = config.commands.find(c => c.id === commandId);
    if (!cmd) return false;

    cmd.code = newCode.trim();
    this.saveConfig(config);
    return true;
  }

  /**
   * Altera o Código Mestre de Revelação (Vault Rotation)
   */
  public static updateRevealCode(newRevealCode: string): boolean {
    if (!newRevealCode || newRevealCode.length < 3) return false;
    const config = this.getConfig();
    config.revealCode = newRevealCode.trim();
    config.lastRotatedAt = Date.now();
    this.saveConfig(config);
    return true;
  }

  public static setRevealCode(newRevealCode: string): boolean {
    return this.updateRevealCode(newRevealCode);
  }

  /**
   * Alterna habilitação de um comando específico
   */
  public static toggleCommandEnabled(commandId: string, enabled?: boolean): boolean {
    const config = this.getConfig();
    const cmd = config.commands.find(c => c.id === commandId);
    if (!cmd) return false;

    cmd.enabled = enabled !== undefined ? enabled : !cmd.enabled;
    this.saveConfig(config);
    return true;
  }

  public static toggleCommand(commandId: string, enabled?: boolean): boolean {
    return this.toggleCommandEnabled(commandId, enabled);
  }

  /**
   * Restaura todos os 20 comandos e configurações de fábrica
   */
  public static resetToDefaults(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
    const fresh = this.getDefaultConfig();
    this.saveConfig(fresh);
  }

  private static readonly EXECUTIONS_KEY = 'portal_cos_secret_command_executions';

  /**
   * Registra a execução estruturada de um comando na coleção secret_command_executions/
   */
  public static logExecution(record: Omit<SecretCommandExecutionRecord, 'id' | 'timestamp'>): SecretCommandExecutionRecord {
    const fullRecord: SecretCommandExecutionRecord = {
      ...record,
      id: `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now()
    };

    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(this.EXECUTIONS_KEY);
        const list: SecretCommandExecutionRecord[] = raw ? JSON.parse(raw) : [];
        list.unshift(fullRecord);
        // Mantém os 500 registros mais recentes
        if (list.length > 500) list.pop();
        localStorage.setItem(this.EXECUTIONS_KEY, JSON.stringify(list));
      }
    } catch (e) {
      console.error('[SecretVaultService] Erro ao gravar secret_command_executions:', e);
    }

    this.recordExecution(record.command);
    return fullRecord;
  }

  /**
   * Obtém a coleção secret_command_executions/
   */
  public static getExecutions(limitCount: number = 100): SecretCommandExecutionRecord[] {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(this.EXECUTIONS_KEY);
        if (raw) {
          const list: SecretCommandExecutionRecord[] = JSON.parse(raw);
          return list.slice(0, limitCount);
        }
      }
    } catch (e) {
      console.error('[SecretVaultService] Erro ao ler secret_command_executions:', e);
    }

    // Registros mockados realistas iniciais para visualização imediata
    const mockExecutions: SecretCommandExecutionRecord[] = [
      {
        id: 'exec_init_001',
        command: '*100#',
        userId: 'founder@portal.ao',
        deviceId: 'samsung_s22_ultra_founder',
        sessionId: 'sess_live_root_998',
        timestamp: Date.now() - 120000,
        execution_time: 4.2,
        result: 'SUCCESS',
        ip: '102.214.32.1',
        privilege_level: 'FOUNDER',
        details: 'Abertura do Founder Core Menu'
      },
      {
        id: 'exec_init_002',
        command: '*#6368#',
        userId: 'founder@portal.ao',
        deviceId: 'node_master_browser',
        sessionId: 'sess_live_root_998',
        timestamp: Date.now() - 240000,
        execution_time: 1.8,
        result: 'SUCCESS',
        ip: '102.214.32.1',
        privilege_level: 'ROOT',
        details: 'Desbloqueio da Gaveta de Comandos (Master Code)'
      },
      {
        id: 'exec_init_003',
        command: '*#7668#',
        userId: 'silajaneiro9@gmail.com',
        deviceId: 'node_master_browser',
        sessionId: 'sess_live_adm_441',
        timestamp: Date.now() - 480000,
        execution_time: 3.1,
        result: 'SUCCESS',
        ip: '102.214.32.1',
        privilege_level: 'ROOT',
        details: 'Elevação direta ROOT DTMF T9'
      },
      {
        id: 'exec_init_004',
        command: '*111#',
        userId: 'operador@portal.ao',
        deviceId: 'tablet_ops_02',
        sessionId: 'sess_ops_129',
        timestamp: Date.now() - 960000,
        execution_time: 2.4,
        result: 'SUCCESS',
        ip: '197.234.11.88',
        privilege_level: 'USER',
        details: 'Isolamento de emergência SOS Lockdown'
      }
    ];

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.EXECUTIONS_KEY, JSON.stringify(mockExecutions));
      }
    } catch (e) {
      console.error(e);
    }

    return mockExecutions.slice(0, limitCount);
  }

  /**
   * Limpa registros da coleção secret_command_executions/
   */
  public static clearExecutions(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.EXECUTIONS_KEY);
      }
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Registra a execução de um código
   */
  public static recordExecution(code: string): void {
    const config = this.getConfig();
    const clean = code.trim().toUpperCase();
    const cmd = config.commands.find(c => c.code.toUpperCase() === clean);
    if (cmd) {
      cmd.lastExecutedAt = Date.now();
      cmd.executionCount = (cmd.executionCount || 0) + 1;
      this.saveConfig(config);
    }
    this.refreshActivity();
  }

  /**
   * Recuperação do Código Mestre no Root/Vault
   */
  public static getMasterRevealCodeForRoot(): string {
    return this.getConfig().revealCode;
  }
}
