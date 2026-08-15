// src/engine/commandExecutor.ts — Executor Desacoplado de Comandos
// Diretriz 05: Desacoplamento completo da UI. Dispara eventos de sistema e executa ações do ecossistema

import { CommandDefinition } from './commandRegistry';
import { SecurityAuditService } from '../services/SecurityAuditService';

export interface CommandExecutionResult {
  success: boolean;
  actionId: string;
  message: string;
  data?: any;
}

export type CommandActionHandler = (actionId: string, params: any) => Promise<CommandExecutionResult> | CommandExecutionResult;

export class CommandExecutor {
  private static handlers: Map<string, CommandActionHandler> = new Map();

  /**
   * Registra handlers de ação da aplicação
   */
  public static registerHandler(actionId: string, handler: CommandActionHandler): void {
    this.handlers.set(actionId, handler);
  }

  /**
   * Executa a ação associada ao comando
   */
  public static async execute(
    commandDef: CommandDefinition,
    args: string[] = [],
    switches: Record<string, any> = {}
  ): Promise<CommandExecutionResult> {
    const actionId = commandDef.actionId;

    // Disparar CustomEvent no window para desacoplamento total da UI
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('portal:command-executed', {
        detail: {
          commandId: commandDef.id,
          actionId,
          command: commandDef.command,
          args,
          switches,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(event);
    }

    // Se houver handler registrado no executor, invoca
    const handler = this.handlers.get(actionId);
    let result: CommandExecutionResult;

    if (handler) {
      try {
        result = await handler(actionId, { args, switches });
      } catch (e: any) {
        result = {
          success: false,
          actionId,
          message: `Falha ao executar ação ${actionId}: ${e.message}`
        };
      }
    } else {
      // Execução padrão via eventos
      result = {
        success: true,
        actionId,
        message: `Comando ${commandDef.command} executado com sucesso.`
      };
    }

    // Log de auditoria obrigatório
    SecurityAuditService.log(
      'COMMAND_EXECUTED',
      commandDef.command,
      result.success ? 'SUCCESS' : 'FAILED',
      commandDef.requiredRole === 'FOUNDER' ? 'CRITICAL' : 'INFO',
      { actionId, args, switches, message: result.message }
    );

    return result;
  }
}
