// src/engine/commandEngine.ts — Núcleo Operacional Unificado (COS Kernel)
// Diretrizes 01, 14, 26, 28: Interceptação de buffer, roteamento unificado e execução desacoplada

import { CommandParser, ParsedCommandResult } from './commandParser';
import { CommandRegistry, CommandDefinition } from './commandRegistry';
import { PermissionEngine, PermissionValidationResult } from './permissionEngine';
import { CommandExecutor, CommandExecutionResult } from './commandExecutor';
import { SecurityAuditService } from '../services/SecurityAuditService';
import { CommandPersistenceService } from '../services/CommandPersistenceService';
import { CommandMacroEngine } from './commandMacroEngine';
import { CommandRouter, CommandRoutingResult } from './commandRouter';

export type CommandEngineState = 
  | 'IDLE' 
  | 'BUFFERING' 
  | 'PARSING' 
  | 'VALIDATING' 
  | 'EXECUTING' 
  | 'COMPLETED' 
  | 'FAILED';

export interface CommandEngineEventPayload {
  state: CommandEngineState;
  buffer: string;
  parsedResult?: ParsedCommandResult;
  permissionResult?: PermissionValidationResult;
  executionResult?: CommandExecutionResult;
  error?: string;
}

export type CommandEngineListener = (payload: CommandEngineEventPayload) => void;

export class CommandEngine {
  private static buffer: string = '';
  private static state: CommandEngineState = 'IDLE';
  private static listeners: Set<CommandEngineListener> = new Set();
  private static autoExecuteTimeout: any = null;

  public static subscribe(listener: CommandEngineListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  private static emit(partial?: Partial<CommandEngineEventPayload>): void {
    const payload: CommandEngineEventPayload = {
      ...this.getSnapshot(),
      ...partial
    };
    this.listeners.forEach(l => {
      try {
        l(payload);
      } catch (err) {
        console.error('CommandEngine listener error:', err);
      }
    });
  }

  public static getSnapshot(): CommandEngineEventPayload {
    return {
      state: this.state,
      buffer: this.buffer
    };
  }

  public static getBuffer(): string {
    return this.buffer;
  }

  public static setBuffer(newBuffer: string): void {
    this.buffer = newBuffer;
    this.state = newBuffer.length > 0 ? 'BUFFERING' : 'IDLE';
    this.emit();
  }

  public static append(char: string): void {
    this.buffer += char;
    this.state = 'BUFFERING';
    this.emit();

    // Se o caractere for '#' e tiver formato de comando USSD (*...#), aciona execução
    if (char === '#' && (this.buffer.startsWith('*#') || this.buffer.startsWith('*')) && this.buffer.length >= 3) {
      if (this.autoExecuteTimeout) clearTimeout(this.autoExecuteTimeout);
      this.autoExecuteTimeout = setTimeout(() => {
        this.executeCurrentBuffer();
      }, 50);
    }
  }

  public static backspace(): void {
    if (this.buffer.length > 0) {
      this.buffer = this.buffer.slice(0, -1);
      this.state = this.buffer.length > 0 ? 'BUFFERING' : 'IDLE';
      this.emit();
    }
  }

  public static clearBuffer(): void {
    if (this.autoExecuteTimeout) clearTimeout(this.autoExecuteTimeout);
    this.buffer = '';
    this.state = 'IDLE';
    this.emit();
  }

  /**
   * Processa e executa o buffer atual via CommandRouter Unificado
   */
  public static async executeCurrentBuffer(): Promise<{ isCommand: boolean; result?: CommandRoutingResult }> {
    const input = this.buffer.trim();
    if (!input) return { isCommand: false };

    // 0. Macro Check (Diretriz 22)
    if (CommandMacroEngine.isMacro(input)) {
      this.state = 'EXECUTING';
      this.emit();
      const macroRes = await CommandMacroEngine.executeMacro(input);
      this.state = macroRes.success ? 'COMPLETED' : 'FAILED';
      this.emit();
      setTimeout(() => this.clearBuffer(), 1500);
      return { isCommand: true, result: { isCommand: true, success: macroRes.success, message: 'Macro executada' } };
    }

    this.state = 'PARSING';
    this.emit();

    // 1. Roteamento pelo CommandRouter Unificado (Diretriz 26)
    const routeRes = await CommandRouter.route(input);

    if (!routeRes.isCommand) {
      // Não é comando do sistema, segue fluxo normal
      this.state = 'IDLE';
      this.emit();
      return { isCommand: false };
    }

    this.state = routeRes.success ? 'COMPLETED' : 'FAILED';
    this.emit({
      error: routeRes.success ? undefined : routeRes.message
    });

    // Limpeza automática do buffer
    setTimeout(() => {
      this.clearBuffer();
    }, 1500);

    return { isCommand: true, result: routeRes };
  }
}
