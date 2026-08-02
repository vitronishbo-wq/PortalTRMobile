export type OutboundCommandType = 'SEND_SMS' | 'MAKE_CALL' | 'SEND_WHATSAPP' | 'RUN_USSD' | 'SET_PROFILES';
export type CommandStatus = 'QUEUED' | 'SENT_TO_NODE' | 'EXECUTED' | 'FAILED' | 'EXPIRED';

export interface OutboundCommand {
  id: string;
  nodeId: string;
  type: OutboundCommandType;
  recipient: string; // Phone number or contact
  message?: string;  // Message text or USSD code (*111#)
  payload?: Record<string, any>;
  status: CommandStatus;
  createdAt: number;
  sentAt?: number;
  executedAt?: number;
  attempts: number;
  error?: string;
  resultPayload?: any;
}

export class OutboundCommandDispatcher {
  private static commandQueue: OutboundCommand[] = [
    {
      id: 'cmd-901',
      nodeId: 'node-angola-luanda-01',
      type: 'SEND_SMS',
      recipient: '+244923000111',
      message: 'Sua fatura #8819 de 25.000 Kz foi emitida com sucesso. Pague via ProxyPay.',
      status: 'EXECUTED',
      createdAt: Date.now() - 3600000 * 2,
      sentAt: Date.now() - 3600000 * 2 + 150,
      executedAt: Date.now() - 3600000 * 2 + 1200,
      attempts: 1,
      resultPayload: { carrierStatus: 'DELIVERED', gsmSignal: '-78dBm' }
    },
    {
      id: 'cmd-902',
      nodeId: 'node-angola-luanda-01',
      type: 'RUN_USSD',
      recipient: '*111#',
      message: '*111#',
      status: 'EXECUTED',
      createdAt: Date.now() - 1800000,
      sentAt: Date.now() - 1800000 + 100,
      executedAt: Date.now() - 1800000 + 3500,
      attempts: 1,
      resultPayload: { ussdResponse: 'O seu saldo principal e de 14.500 Kz valido ate 30/08/2026.' }
    }
  ];

  /**
   * Enqueues a new command to be delivered to an Android Node
   */
  static enqueueCommand(
    nodeId: string,
    type: OutboundCommandType,
    recipient: string,
    message?: string,
    payload?: Record<string, any>
  ): OutboundCommand {
    const command: OutboundCommand = {
      id: `cmd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nodeId,
      type,
      recipient,
      message,
      payload,
      status: 'QUEUED',
      createdAt: Date.now(),
      attempts: 0
    };

    OutboundCommandDispatcher.commandQueue.unshift(command);
    return command;
  }

  /**
   * Retrieves pending commands for a specific Node (called by Android Node poll/SSE)
   */
  static getPendingCommandsForNode(nodeId: string): OutboundCommand[] {
    return OutboundCommandDispatcher.commandQueue.filter(
      (cmd) => (cmd.nodeId === nodeId || cmd.nodeId === 'ANY') && cmd.status === 'QUEUED'
    );
  }

  /**
   * Updates status of a command upon response from Android Node
   */
  static acknowledgeCommand(
    commandId: string,
    status: CommandStatus,
    resultPayload?: any,
    error?: string
  ): OutboundCommand | undefined {
    const cmd = OutboundCommandDispatcher.commandQueue.find((c) => c.id === commandId);
    if (cmd) {
      cmd.status = status;
      cmd.attempts += 1;
      if (status === 'SENT_TO_NODE') cmd.sentAt = Date.now();
      if (status === 'EXECUTED' || status === 'FAILED') {
        cmd.executedAt = Date.now();
        cmd.resultPayload = resultPayload;
        cmd.error = error;
      }
    }
    return cmd;
  }

  static getAllCommands(): OutboundCommand[] {
    return [...OutboundCommandDispatcher.commandQueue];
  }
}
