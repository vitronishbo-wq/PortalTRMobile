// src/engine/commandPipeline.ts — Pipeline de 7 Estágios do COS (Command Pipeline)
// Diretriz 37: RECEIVED → PARSED → AUTHORIZED → VALIDATED → SCHEDULED → EXECUTED → AUDITED
// Diretriz 39: Execução de comandos compostos (*#PAIR:DEVICE=LAPTOP:SYNC=TRUE#, *#LOCK:DEVICE=S22:WIPE=TRUE#)

import { CommandParser, ParsedCommandResult } from './commandParser';
import { PermissionEngine, PermissionValidationResult } from './permissionEngine';
import { PolicyEngine, PolicyEvaluationResult } from './policyEngine';
import { CommandScheduler, ScheduledCommandTask } from './commandScheduler';
import { CommandExecutor, CommandExecutionResult } from './commandExecutor';
import { ExecutionContextEngine, COSExecutionContext } from './executionContextEngine';
import { SecurityAuditService } from '../services/SecurityAuditService';
import { CommandPersistenceService } from '../services/CommandPersistenceService';
import { SecretCommandsService, AdminProfileRecord } from '../services/SecretCommandsService';
import { USSDMenuEngine } from './ussdMenuEngine';

export type PipelineStage = 
  | 'RECEIVED' 
  | 'PARSED' 
  | 'AUTHORIZED' 
  | 'VALIDATED' 
  | 'SCHEDULED' 
  | 'EXECUTED' 
  | 'AUDITED';

export interface PipelineExecutionReport {
  rawInput: string;
  isCommand: boolean;
  success: boolean;
  currentStage: PipelineStage;
  message: string;
  actionId?: string;
  data?: any;
  context: COSExecutionContext;
  stagesCompleted: PipelineStage[];
  error?: string;
  executionTimeMs: number;
}

export class CommandPipeline {
  /**
   * Executa o fluxo unificado de 7 estágios
   */
  public static async process(rawInput: string): Promise<PipelineExecutionReport> {
    const startTime = performance.now();
    const stagesCompleted: PipelineStage[] = [];
    const context = ExecutionContextEngine.getContext();

    // ========================================================
    // ESTÁGIO 1: RECEIVED
    // ========================================================
    stagesCompleted.push('RECEIVED');
    const input = rawInput.trim();
    if (!input) {
      return {
        rawInput,
        isCommand: false,
        success: false,
        currentStage: 'RECEIVED',
        message: 'Buffer vazio recebido no pipeline',
        context,
        stagesCompleted,
        executionTimeMs: 0
      };
    }

    // ========================================================
    // ESTÁGIO 2: PARSED
    // ========================================================
    stagesCompleted.push('PARSED');
    const parsed = CommandParser.parse(input);
    if (!parsed.isValid || !parsed.commandDef) {
      // Verifica dinamicamente no secret_commands/
      const secretCommands = SecretCommandsService.getSecretCommands();
      const matchedSecret = secretCommands.find(sc => 
        sc.enabled && (
          sc.command.toUpperCase() === parsed.normalizedCommand.toUpperCase() ||
          sc.alias.some(a => a.toUpperCase() === parsed.normalizedCommand.toUpperCase())
        )
      );

      if (!matchedSecret) {
        return {
          rawInput,
          isCommand: false,
          success: false,
          currentStage: 'PARSED',
          message: `Sintaxe não reconhecida pelo parser: "${input}"`,
          context,
          stagesCompleted,
          executionTimeMs: Math.round(performance.now() - startTime)
        };
      }
    }

    const commandDef = parsed.commandDef!;

    // ========================================================
    // ESTÁGIO 3: AUTHORIZED (PermissionEngine - Hierarquia)
    // ========================================================
    stagesCompleted.push('AUTHORIZED');
    const permResult = PermissionEngine.validateCommandExecution(
      commandDef.command,
      commandDef.requiredRole,
      commandDef.requiresTrustedDevice,
      commandDef.requiresPin
    );

    if (!permResult.authorized) {
      const execTime = Math.round(performance.now() - startTime);
      SecurityAuditService.log('UNAUTHORIZED_ACCESS', `CMD_${commandDef.command}`, 'BLOCKED', 'CRITICAL', {
        reason: permResult.reason,
        user: context.user.email,
        role: context.role
      });
      CommandPersistenceService.recordExecution(commandDef.command, parsed.args, 'DENIED', execTime, permResult.reason);

      return {
        rawInput,
        isCommand: true,
        success: false,
        currentStage: 'AUTHORIZED',
        message: `Autorização Negada: ${permResult.reason}`,
        error: permResult.reason,
        context,
        stagesCompleted,
        executionTimeMs: execTime
      };
    }

    // ========================================================
    // ESTÁGIO 4: VALIDATED (PolicyEngine - Políticas Firestore)
    // ========================================================
    stagesCompleted.push('VALIDATED');
    const policyResult = PolicyEngine.evaluate(
      commandDef.command,
      context.role,
      context.device.isTrusted
    );

    if (!policyResult.allowed) {
      const execTime = Math.round(performance.now() - startTime);
      SecurityAuditService.log('SECURITY_POLICY_VIOLATION', `POLICY_${commandDef.command}`, 'BLOCKED', 'HIGH', {
        reason: policyResult.reason,
        policyId: policyResult.policyId
      });
      CommandPersistenceService.recordExecution(commandDef.command, parsed.args, 'DENIED', execTime, policyResult.reason);

      return {
        rawInput,
        isCommand: true,
        success: false,
        currentStage: 'VALIDATED',
        message: `Violação de Política: ${policyResult.reason}`,
        error: policyResult.reason,
        context,
        stagesCompleted,
        executionTimeMs: execTime
      };
    }

    // ========================================================
    // ESTÁGIO 5: SCHEDULED (CommandScheduler - Imediato ou Temporizado)
    // ========================================================
    stagesCompleted.push('SCHEDULED');
    const scheduleCheck = CommandScheduler.schedule(
      commandDef.command,
      parsed.args,
      parsed.params,
      async (task) => {
        const res = await this.executeCoreCommand(commandDef, parsed, context);
        return { success: res.success, message: res.message };
      }
    );

    if (!scheduleCheck.isImmediate) {
      const execTime = Math.round(performance.now() - startTime);
      stagesCompleted.push('AUDITED');
      CommandPersistenceService.recordExecution(commandDef.command, parsed.args, 'SUCCESS', execTime, scheduleCheck.message);
      
      return {
        rawInput,
        isCommand: true,
        success: true,
        currentStage: 'SCHEDULED',
        message: scheduleCheck.message,
        data: { taskId: scheduleCheck.taskId },
        context,
        stagesCompleted,
        executionTimeMs: execTime
      };
    }

    // ========================================================
    // ESTÁGIO 6: EXECUTED (Execução de Comandos Compostos & Ações)
    // ========================================================
    stagesCompleted.push('EXECUTED');
    const execResult = await this.executeCoreCommand(commandDef, parsed, context);

    // ========================================================
    // ESTÁGIO 7: AUDITED (Gravação Imutável de Evidência)
    // ========================================================
    stagesCompleted.push('AUDITED');
    const totalExecTime = Math.round(performance.now() - startTime);

    SecurityAuditService.log(
      execResult.success ? 'SYSTEM_COMMAND' : 'COMMAND_FAILURE',
      `CMD_${commandDef.command}`,
      execResult.success ? 'SUCCESS' : 'FAILED',
      execResult.success ? 'LOW' : 'MEDIUM',
      {
        command: commandDef.command,
        params: parsed.params,
        result: execResult.message,
        executionTimeMs: totalExecTime,
        user: context.user.email
      }
    );

    CommandPersistenceService.recordExecution(
      commandDef.command,
      parsed.args,
      execResult.success ? 'SUCCESS' : 'FAILED',
      totalExecTime,
      execResult.message,
      execResult.success ? undefined : execResult.message
    );

    return {
      rawInput,
      isCommand: true,
      success: execResult.success,
      currentStage: 'AUDITED',
      message: execResult.message,
      actionId: execResult.actionId,
      data: execResult.data,
      context,
      stagesCompleted,
      executionTimeMs: totalExecTime
    };
  }

  /**
   * Executa comandos operacionais compostos e padrão
   */
  private static async executeCoreCommand(
    commandDef: any,
    parsed: ParsedCommandResult,
    context: COSExecutionContext
  ): Promise<{ success: boolean; message: string; actionId?: string; data?: any }> {
    const cmd = parsed.normalizedCommand.toUpperCase();
    const params = parsed.params || {};

    // Composto 1: *#CREATEADMIN:EMAIL=admin@portal.ao:ROLE=ADMIN:PIN=123456#
    if (cmd.startsWith('*#CREATEADMIN') || cmd === 'CREATE ADMIN') {
      const email = params.EMAIL || params.email || parsed.args[0];
      const role = (params.ROLE || params.role || parsed.args[1] || 'ADMIN').toUpperCase();
      const pin = params.PIN || params.pin || '0000';
      const name = params.NAME || params.name || (email ? email.split('@')[0] : 'Admin Provisionado');

      if (!email) {
        return { success: true, message: 'Abrindo formulário de criação de admin', actionId: 'OPEN_CREATE_ADMIN_MODAL' };
      }

      const uid = `adm_${Date.now()}`;
      const secretCode = `PTL-${role}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newAdmin: AdminProfileRecord = {
        uid,
        name,
        email,
        role: role as any,
        permissions: ['READ_DEVICES', 'MANAGE_TELECOM', 'VIEW_SESSIONS'],
        secretCode,
        trustedDevices: ['node_master'],
        createdBy: context.user.email,
        createdAt: Date.now(),
        status: 'ACTIVE'
      };

      SecretCommandsService.saveAdminProfile(newAdmin);
      return {
        success: true,
        message: `Admin provisionado: ${email} | Cargo: ${role} | PIN: ${pin} | Código: ${secretCode}`,
        data: newAdmin
      };
    }

    // Composto 2: *#LOCK:DEVICE=S22:WIPE=TRUE#
    if (cmd.startsWith('*#LOCK') || cmd === 'LOCK') {
      const deviceTarget = params.DEVICE || params.device || parsed.args[0] || 'all_nodes';
      const isWipe = (params.WIPE || params.wipe || '').toUpperCase() === 'TRUE';

      window.dispatchEvent(new CustomEvent('portal:command-executed', {
        detail: { actionId: isWipe ? 'EXECUTE_WIPE_SESSION' : 'EXECUTE_LOCK_DEVICE', target: deviceTarget }
      }));

      return {
        success: true,
        message: isWipe 
          ? `Dispositivo "${deviceTarget}" bloqueado e isolado com WIPE total executado.`
          : `Dispositivo "${deviceTarget}" bloqueado com sucesso pelo Kernel.`
      };
    }

    // Composto 3: *#PAIR:DEVICE=LAPTOP:SYNC=TRUE#
    if (cmd.startsWith('*#PAIR') || cmd === 'PAIR') {
      const deviceTarget = params.DEVICE || params.device || parsed.args[0] || 'novo_dispositivo';
      const shouldSync = (params.SYNC || params.sync || '').toUpperCase() === 'TRUE';

      window.dispatchEvent(new CustomEvent('portal:command-executed', {
        detail: { actionId: 'EXECUTE_PAIR_DEVICE', target: deviceTarget, sync: shouldSync }
      }));

      return {
        success: true,
        message: shouldSync 
          ? `Emparelhamento zero-touch concluído para "${deviceTarget}" com sincronização imediata.`
          : `Iniciando emparelhamento zero-touch para "${deviceTarget}".`
      };
    }

    // Composto 4: *#TRANSFER:DEVICE=TABLET#
    if (cmd.startsWith('*#TRANSFER') || cmd === 'TRANSFER') {
      const deviceTarget = params.DEVICE || params.device || parsed.args[0] || 'dispositivo_secundario';
      window.dispatchEvent(new CustomEvent('portal:command-executed', {
        detail: { actionId: 'EXECUTE_TRANSFER_SESSION', target: deviceTarget }
      }));

      return {
        success: true,
        message: `Sessão ativa transferida para "${deviceTarget}".`
      };
    }

    // Interceptação USSD / MMI Engineering Mode (*100#, *100*01#, *700#, etc.)
    if (parsed.rawInput.startsWith('*') && parsed.rawInput.endsWith('#') && !parsed.rawInput.startsWith('*#')) {
      const ussdResp = await USSDMenuEngine.handleUSSDInput(parsed.rawInput);
      if (ussdResp) {
        return {
          success: true,
          message: ussdResp.body,
          actionId: 'USSD_INTERACTIVE',
          data: ussdResp
        };
      }
    }

    // Padrão: Despacho para CommandExecutor
    const execRes = await CommandExecutor.execute(commandDef, parsed.args, parsed.switches);
    return {
      success: execRes.success,
      message: execRes.message,
      actionId: execRes.actionId,
      data: execRes.data
    };
  }
}
