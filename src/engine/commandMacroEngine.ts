// src/engine/commandMacroEngine.ts — Motor de Macros e Automação em Lote do COS
// Diretriz 22: Execução de macros parametrizados (*#STARTWORK#, *#EMERGENCY#)

import { CommandEngine } from './commandEngine';
import { SecurityAuditService } from '../services/SecurityAuditService';

export interface CommandMacroDefinition {
  macroId: string;
  command: string;
  name: string;
  description: string;
  sequence: string[]; // Lista de comandos sequenciais
  requiredRole: 'FOUNDER' | 'ADMIN' | 'OPERATOR';
  enabled: boolean;
}

export class CommandMacroEngine {
  private static readonly MACROS: CommandMacroDefinition[] = [
    {
      macroId: 'macro_startwork',
      command: '*#STARTWORK#',
      name: 'Rotina de Entrada Operacional',
      description: 'Executa sincronização, abre Mesh de Dispositivos e prepara Telecom',
      sequence: ['*#SYNC#', '*#DEVICES#', '*#TELECOM#'],
      requiredRole: 'OPERATOR',
      enabled: true
    },
    {
      macroId: 'macro_emergency',
      command: '*#EMERGENCY#',
      name: 'Protocolo de Emergência / Bloqueio Total',
      description: 'Bloqueia dispositivos, gera log crítico e desativa canais expostos',
      sequence: ['*#LOCK#', '*#AUDIT#'],
      requiredRole: 'ADMIN',
      enabled: true
    }
  ];

  public static getMacros(): CommandMacroDefinition[] {
    return this.MACROS.filter(m => m.enabled);
  }

  public static isMacro(command: string): boolean {
    const clean = command.trim().toUpperCase();
    return this.MACROS.some(m => m.command === clean && m.enabled);
  }

  public static async executeMacro(command: string): Promise<{ success: boolean; executed: string[] }> {
    const clean = command.trim().toUpperCase();
    const macro = this.MACROS.find(m => m.command === clean);
    if (!macro) return { success: false, executed: [] };

    const executed: string[] = [];
    for (const step of macro.sequence) {
      CommandEngine.setBuffer(step);
      await CommandEngine.executeCurrentBuffer();
      executed.push(step);
    }

    SecurityAuditService.log(
      'COMMAND_EXECUTED',
      `MACRO_${macro.command}`,
      'SUCCESS',
      'CRITICAL',
      { macroId: macro.macroId, steps: executed }
    );

    return { success: true, executed };
  }
}
