type EventCallback = (...args: any[]) => void;

class EventEmitter {
  private listeners: Map<string, EventCallback[]> = new Map();

  on(event: string, listener: EventCallback): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const callbacks = this.listeners.get(event);
    if (!callbacks || callbacks.length === 0) return false;
    callbacks.forEach((fn) => fn(...args));
    return true;
  }

  off(event: string, listener: EventCallback): this {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      this.listeners.set(event, callbacks.filter((fn) => fn !== listener));
    }
    return this;
  }
}

export interface OutboundCommand {
  id: string;
  nodeId: string;
  workspaceId: string;
  type: 'SEND_SMS' | 'MAKE_CALL' | 'SEND_WHATSAPP' | 'TRIGGER_NOTIFICATION' | 'EXECUTE_SHELL' | string;
  payload: Record<string, any>;
  status: 'pending' | 'delivered' | 'failed' | 'timeout';
  createdAt: number;
  deliveredAt?: number;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  result?: any;
}

export interface CommandAck {
  commandId: string;
  status: 'delivered' | 'failed';
  result?: any;
  error?: string;
}

export class CommandQueueEngine extends EventEmitter {
  private queues: Map<string, OutboundCommand[]> = new Map(); // nodeId -> commands
  private processing: Set<string> = new Set();
  private history: OutboundCommand[] = [];
  private pendingAcks: Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void; timeout: any }> = new Map();

  constructor() {
    super();
    // Seed initial mock data for immediate testing
    this.enqueue({
      nodeId: 'node-angola-luanda-01',
      workspaceId: 'ws-vitronis-default',
      type: 'SEND_SMS',
      payload: { to: '+244923000111', message: 'Sua fatura de 50.000 Kz foi gerada via COS API.' }
    });
  }

  /**
   * Enfileira um comando para um nó específico
   */
  enqueue(commandData: Omit<OutboundCommand, 'id' | 'status' | 'createdAt' | 'retryCount' | 'maxRetries'> & { maxRetries?: number }): string {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `cmd-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const fullCommand: OutboundCommand = {
      ...commandData,
      id,
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: commandData.maxRetries ?? 3,
    };

    if (!this.queues.has(commandData.nodeId)) {
      this.queues.set(commandData.nodeId, []);
    }
    this.queues.get(commandData.nodeId)!.push(fullCommand);
    this.history.unshift(fullCommand);
    if (this.history.length > 200) this.history.pop();

    this.emit('command:enqueued', fullCommand);
    return id;
  }

  /**
   * Retorna o próximo comando pendente para um nó (consumido pelo agente)
   */
  dequeue(nodeId: string): OutboundCommand | null {
    const queue = this.queues.get(nodeId);
    if (!queue || queue.length === 0) {
      // Check fallback 'ANY' queue
      const anyQueue = this.queues.get('ANY');
      if (anyQueue && anyQueue.length > 0) {
        const cmd = anyQueue.shift()!;
        this.processing.add(cmd.id);
        return cmd;
      }
      return null;
    }
    const command = queue.shift()!;
    this.processing.add(command.id);
    return command;
  }

  /**
   * O agente confirma a execução do comando
   */
  acknowledge(ack: CommandAck | string, status?: 'delivered' | 'failed', result?: any): OutboundCommand | undefined {
    const ackObj: CommandAck = typeof ack === 'string'
      ? { commandId: ack, status: status || 'delivered', result }
      : ack;

    this.processing.delete(ackObj.commandId);
    const cmd = this.history.find((c) => c.id === ackObj.commandId);
    if (cmd) {
      cmd.status = ackObj.status;
      cmd.deliveredAt = Date.now();
      cmd.result = ackObj.result;
      if (ackObj.error) cmd.lastError = ackObj.error;
    }

    const pending = this.pendingAcks.get(ackObj.commandId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingAcks.delete(ackObj.commandId);
      if (ackObj.status === 'delivered') {
        pending.resolve(ackObj.result);
      } else {
        pending.reject(new Error(ackObj.error || 'Command execution failed'));
      }
    }

    this.emit('command:ack', ackObj);
    return cmd;
  }

  /**
   * Espera por um acknowledge com timeout (para chamadas síncronas)
   */
  waitForAck(commandId: string, timeoutMs: number = 30000): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingAcks.delete(commandId);
        reject(new Error(`Command ${commandId} timed out`));
      }, timeoutMs);

      this.pendingAcks.set(commandId, { resolve, reject, timeout });
    });
  }

  /**
   * Lista estatísticas das filas
   */
  getQueues(): Map<string, number> {
    const result = new Map<string, number>();
    for (const [nodeId, commands] of this.queues.entries()) {
      result.set(nodeId, commands.length);
    }
    return result;
  }

  /**
   * Remove comandos de um nó
   */
  clearNodeQueue(nodeId: string): void {
    this.queues.delete(nodeId);
    this.emit('queue:cleared', nodeId);
  }

  /**
   * Tenta novamente um comando
   */
  retryCommand(command: OutboundCommand): void {
    if (command.retryCount >= command.maxRetries) {
      this.emit('command:failed', command);
      return;
    }
    command.retryCount++;
    command.status = 'pending';
    if (!this.queues.has(command.nodeId)) {
      this.queues.set(command.nodeId, []);
    }
    this.queues.get(command.nodeId)!.push(command);
    this.emit('command:retry', command);
  }

  getPendingForNode(nodeId: string): OutboundCommand[] {
    return this.queues.get(nodeId) || [];
  }

  getAllHistory(): OutboundCommand[] {
    return [...this.history];
  }
}

export const commandQueue = new CommandQueueEngine();

