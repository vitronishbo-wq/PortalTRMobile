// src/engine/commandRouter.ts — Barramento Unificado de Roteamento (COS Router)
// Diretrizes 26, 33, 37: Unificar Dialer (*#CMD#), CLI (> cmd) e Palette (CTRL+K) através do COSKernel & CommandPipeline

import { COSKernel } from './cosKernel';
import { PipelineExecutionReport } from './commandPipeline';

export interface CommandRoutingResult {
  isCommand: boolean;
  success: boolean;
  message: string;
  actionId?: string;
  data?: any;
  error?: string;
}

export class CommandRouter {
  /**
   * Rota central única para qualquer entrada vinda do Dialer, CLI ou Command Palette
   * Despacha diretamente para o COSKernel
   */
  public static async route(input: string): Promise<CommandRoutingResult> {
    const raw = input.trim();
    if (!raw) return { isCommand: false, success: false, message: 'Buffer vazio' };

    // Executa através do Kernel central
    const report: PipelineExecutionReport = await COSKernel.execute(raw);

    return {
      isCommand: report.isCommand,
      success: report.success,
      message: report.message,
      actionId: report.actionId,
      data: report.data,
      error: report.error
    };
  }
}
