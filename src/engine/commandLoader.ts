// src/engine/commandLoader.ts — Carregador Dinâmico e Reativo de Comandos do COS
// Diretriz 17: Carregamento desacoplado em tempo real sem necessidade de recompilação

import { CommandRegistry, CommandDefinition } from './commandRegistry';
import { CommandPersistenceService, StoredCommandRecord } from '../services/CommandPersistenceService';

export class CommandLoader {
  private static isInitialized = false;

  /**
   * Sincroniza e hidrata o CommandRegistry dinamicamente a partir dos registros persistidos
   */
  public static loadDynamicCommands(): CommandDefinition[] {
    const stored = CommandPersistenceService.getStoredCommands();

    const mapped: CommandDefinition[] = stored.map(s => ({
      id: s.id,
      command: s.command,
      aliases: s.aliases,
      description: s.description,
      category: s.category === 'USERS' || s.category === 'FOUNDER' ? 'ADMIN' : (s.category as any),
      requiredRole: s.role,
      requiresPin: s.requiresPin,
      requiresBiometric: s.requiresBiometric,
      requiresTrustedDevice: s.requiresTrustedDevice,
      requiresConfirmation: false,
      actionId: s.actionId,
      enabled: s.enabled
    }));

    this.isInitialized = true;
    return mapped;
  }

  public static isReady(): boolean {
    return this.isInitialized;
  }
}
