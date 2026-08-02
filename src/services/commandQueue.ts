import { EventEmitter } from 'events';

export interface OutboundCommand {
  id: string;
  nodeId: string;
  workspaceId: string;
  type: 'SEND_SMS' | 'MAKE_CALL' | 'SEND_WHATSAPP' | 'TRIGGER_NOTIFICATION';
  payload: Record<string, any>;
  status: 'pending' | 'delivered' | 'failed' | 'timeout';
  createdAt: number;
  deliveredAt?: number;
  retryCount: number;
  maxRetries: number;
  result?: any;
}

export class CommandQueueEngine extends EventEmitter {
  private queues: Map<string, OutboundCommand[]> = new Map(); // nodeId -> commands
  private processing: Set<string> = new Set();
  private history: OutboundCommand[] = [];

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

  // Called by Android Agent polling/WebSocket to dequeue next command
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

  // Agent acknowledges execution
  acknowledge(commandId: string, status: 'delivered' | 'failed', result?: any): OutboundCommand | undefined {
    this.processing.delete(commandId);
    const cmd = this.history.find((c) => c.id === commandId);
    if (cmd) {
      cmd.status = status;
      cmd.deliveredAt = Date.now();
      cmd.result = result;
      this.emit('command:ack', { commandId, status, result });
    }
    return cmd;
  }

  getPendingForNode(nodeId: string): OutboundCommand[] {
    return this.queues.get(nodeId) || [];
  }

  getAllHistory(): OutboundCommand[] {
    return [...this.history];
  }
}

export const commandQueue = new CommandQueueEngine();
