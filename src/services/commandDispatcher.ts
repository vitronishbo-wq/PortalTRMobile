import { FirestoreService } from './firestore';
import { NodeCommandStatus, NodeExecutionStage, NodeOutboundCommand } from '../types/nodeContract';

export type OutboundCommandType = 'SEND_SMS' | 'MAKE_CALL' | 'RUN_USSD';
export type CommandStatus = NodeCommandStatus;
export type PhysicalExecutionStage = NodeExecutionStage;
export type OutboundCommand = NodeOutboundCommand;

export class OutboundCommandDispatcher {

  private static readonly STORAGE_KEY = 'portal_outbound_commands_cache';
  private static commandCache: OutboundCommand[] = [];
  private static unsubscribeFirestore: (() => void) | null = null;
  private static listeners: Set<(commands: OutboundCommand[]) => void> = new Set();
  private static isInitialized = false;

  /**
   * Inicializa o dispatcher conectando ao listener do Firestore e carregando cache local
   */
  public static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Carregar cache local de contingência
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        this.commandCache = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[OutboundCommandDispatcher] Falha ao ler cache local:', e);
    }

    // Subscrever coleção /outbound_commands em tempo real
    this.unsubscribeFirestore = FirestoreService.listenToOutboundCommands((firestoreList) => {
      if (firestoreList && firestoreList.length > 0) {
        this.commandCache = firestoreList as OutboundCommand[];
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.commandCache.slice(0, 100)));
        } catch {
          // Ignora overflow
        }
        this.notifyListeners();
      }
    });
  }

  /**
   * Enfileira e grava o comando real na coleção /outbound_commands do Firestore
   */
  public static enqueueCommand(
    nodeId: string,
    type: OutboundCommandType,
    recipient: string,
    message?: string,
    payload?: Record<string, any>
  ): OutboundCommand {
    this.init();

    const now = Date.now();
    const commandId = `cmd_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const evidenceId = `ev_cmd_${now}`;

    const command: OutboundCommand = {
      id: commandId,
      nodeId,
      type,
      recipient,
      message,
      payload,
      status: 'QUEUED',
      executionStage: 'STORED_FIRESTORE',
      createdAt: now,
      storedAt: now,
      attempts: 0,
      evidenceId
    };

    // Atualiza cache em memória e local imediato
    this.commandCache.unshift(command);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.commandCache.slice(0, 100)));
    } catch {
      // Fallback
    }
    this.notifyListeners();

    // Persistência direta e real no Firestore
    FirestoreService.saveOutboundCommand(command).catch((err) => {
      console.error('[OutboundCommandDispatcher] Erro ao gravar comando no Firestore:', err);
    });

    return command;
  }

  /**
   * Recupera comandos pendentes para um nó específico
   */
  public static getPendingCommandsForNode(nodeId: string): OutboundCommand[] {
    this.init();
    return this.commandCache.filter(
      (cmd) => (cmd.nodeId === nodeId || cmd.nodeId === 'ANY') && cmd.status === 'QUEUED'
    );
  }

  /**
   * Atualiza o status físico da execução após resposta do Daemon Android
   */
  public static acknowledgeCommand(
    commandId: string,
    status: CommandStatus,
    resultPayload?: any,
    error?: string
  ): OutboundCommand | undefined {
    this.init();

    const cmd = this.commandCache.find((c) => c.id === commandId);
    const now = Date.now();
    let stage: PhysicalExecutionStage = 'EXECUTING';

    if (status === 'QUEUED') stage = 'STORED_FIRESTORE';
    if (status === 'EXECUTING') stage = 'EXECUTING';
    if (status === 'RESULT_CONFIRMED') stage = 'RESULT_CONFIRMED';
    if (status === 'FAILED') stage = 'FAILED';

    const updates: Partial<OutboundCommand> = {
      status,
      executionStage: stage,
      attempts: (cmd?.attempts || 0) + 1,
      resultPayload,
      error
    };

    if (status === 'EXECUTING') updates.executingAt = now;
    if (status === 'RESULT_CONFIRMED' || status === 'FAILED') {
      updates.executedAt = now;
    }


    if (cmd) {
      Object.assign(cmd, updates);
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.commandCache.slice(0, 100)));
      } catch {
        // Fallback
      }
      this.notifyListeners();
    }

    // Persistência no Firestore
    FirestoreService.updateOutboundCommand(commandId, updates).catch((err) => {
      console.error('[OutboundCommandDispatcher] Erro ao atualizar comando no Firestore:', err);
    });

    return cmd;
  }

  /**
   * Retorna a lista completa de comandos
   */
  public static getAllCommands(): OutboundCommand[] {
    this.init();
    return [...this.commandCache];
  }

  /**
   * Subscrição reativa para consoles da PWA
   */
  public static subscribe(listener: (commands: OutboundCommand[]) => void): () => void {
    this.init();
    this.listeners.add(listener);
    listener([...this.commandCache]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notifyListeners(): void {
    const list = [...this.commandCache];
    this.listeners.forEach((fn) => fn(list));
  }
}
