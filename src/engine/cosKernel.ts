// src/engine/cosKernel.ts — Núcleo Central Operacional (COS Kernel)
// Diretriz 33: Estados obrigatórios: BOOTING, READY, EXECUTING, WAITING, SUSPENDED, ERROR, RECOVERY

import { CommandPipeline, PipelineExecutionReport } from './commandPipeline';
import { ExecutionContextEngine, COSExecutionContext } from './executionContextEngine';
import { SystemManifest, ManifestEngineRecord } from './systemManifest';
import { SecurityAuditService } from '../services/SecurityAuditService';

export type COSKernelState = 
  | 'BOOTING' 
  | 'READY' 
  | 'EXECUTING' 
  | 'WAITING' 
  | 'SUSPENDED' 
  | 'ERROR' 
  | 'RECOVERY';

export interface KernelTelemetry {
  state: COSKernelState;
  bootTime: number;
  uptimeSeconds: number;
  commandsExecuted: number;
  lastCommand?: string;
  lastReport?: PipelineExecutionReport;
  activeContext: COSExecutionContext;
  manifest: ManifestEngineRecord[];
  error?: string;
}

export class COSKernel {
  private static state: COSKernelState = 'BOOTING';
  private static bootTime: number = Date.now();
  private static commandsExecuted: number = 0;
  private static lastReport?: PipelineExecutionReport;
  private static kernelError?: string;
  private static listeners: Set<(telemetry: KernelTelemetry) => void> = new Set();
  private static isInitialized: boolean = false;

  /**
   * Inicializa e valida o Kernel do COS
   */
  public static async boot(): Promise<void> {
    if (this.isInitialized) return;

    this.state = 'BOOTING';
    this.bootTime = Date.now();
    this.emit();

    try {
      // 1. Inicializa Manifesto do Sistema
      const manifest = SystemManifest.getManifest();
      
      // 2. Validação de Contexto
      const ctx = ExecutionContextEngine.getContext();

      // 3. Log de Boot no Audit
      SecurityAuditService.log('SYSTEM_COMMAND', 'COS_KERNEL_BOOT', 'SUCCESS', 'LOW', {
        version: '3.0.0-KERNEL',
        manifestEngines: manifest.length,
        user: ctx.user.email
      });

      this.isInitialized = true;
      this.state = 'READY';
      this.emit();
    } catch (err: any) {
      this.state = 'ERROR';
      this.kernelError = err?.message || 'Falha crítica no boot do Kernel';
      this.emit();
    }
  }

  public static getState(): COSKernelState {
    return this.state;
  }

  public static getTelemetry(): KernelTelemetry {
    return {
      state: this.state,
      bootTime: this.bootTime,
      uptimeSeconds: Math.floor((Date.now() - this.bootTime) / 1000),
      commandsExecuted: this.commandsExecuted,
      lastCommand: this.lastReport?.rawInput,
      lastReport: this.lastReport,
      activeContext: ExecutionContextEngine.getContext(),
      manifest: SystemManifest.getManifest(),
      error: this.kernelError
    };
  }

  public static subscribe(listener: (telemetry: KernelTelemetry) => void): () => void {
    this.listeners.add(listener);
    listener(this.getTelemetry());
    return () => this.listeners.delete(listener);
  }

  private static emit(): void {
    const telemetry = this.getTelemetry();
    this.listeners.forEach(fn => {
      try {
        fn(telemetry);
      } catch (err) {
        console.error('Kernel subscriber error:', err);
      }
    });
  }

  /**
   * Ponto único de processamento de entrada de comandos no Kernel
   */
  public static async execute(rawInput: string): Promise<PipelineExecutionReport> {
    if (!this.isInitialized) {
      await this.boot();
    }

    if (this.state === 'SUSPENDED') {
      return {
        rawInput,
        isCommand: true,
        success: false,
        currentStage: 'RECEIVED',
        message: 'Kernel SUSPENSO por protocolo de segurança. Envie comando de desbloqueio.',
        context: ExecutionContextEngine.getContext(),
        stagesCompleted: ['RECEIVED'],
        executionTimeMs: 0
      };
    }

    this.state = 'EXECUTING';
    this.emit();

    try {
      const report = await CommandPipeline.process(rawInput);
      this.lastReport = report;
      this.commandsExecuted++;

      if (report.isCommand) {
        this.state = report.success ? 'READY' : 'ERROR';
      } else {
        this.state = 'READY';
      }

      this.emit();
      return report;
    } catch (err: any) {
      this.state = 'ERROR';
      this.kernelError = err?.message || 'Erro de execução no Kernel';
      this.emit();

      return {
        rawInput,
        isCommand: true,
        success: false,
        currentStage: 'EXECUTED',
        message: `Falha crítica no Kernel: ${this.kernelError}`,
        error: this.kernelError,
        context: ExecutionContextEngine.getContext(),
        stagesCompleted: ['RECEIVED', 'PARSED', 'EXECUTED'],
        executionTimeMs: 0
      };
    }
  }

  /**
   * Suspende temporariamente o Kernel (Modo Lockout de Emergência)
   */
  public static suspend(reason: string): void {
    this.state = 'SUSPENDED';
    this.kernelError = reason;
    SecurityAuditService.log('SECURITY_ALERT', 'KERNEL_SUSPENDED', 'SUCCESS', 'CRITICAL', { reason });
    this.emit();
  }

  /**
   * Recuperação do Kernel (Recovery Mode)
   */
  public static recover(): void {
    this.state = 'RECOVERY';
    this.emit();
    setTimeout(() => {
      this.kernelError = undefined;
      this.state = 'READY';
      this.emit();
    }, 800);
  }
}

// Auto-boot do Kernel na carga do script
COSKernel.boot();
