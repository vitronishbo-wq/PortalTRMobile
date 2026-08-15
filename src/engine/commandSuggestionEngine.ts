// src/engine/commandSuggestionEngine.ts — Motor de Autocompletion e Sugestões em Tempo Real
// Diretriz 20: Sugestões inteligentes durante a digitação no Dialer e CLI

import { CommandRegistry, CommandDefinition } from './commandRegistry';
import { CommandPersistenceService, StoredCommandRecord } from '../services/CommandPersistenceService';

export interface CommandSuggestion {
  text: string;
  command: string;
  description: string;
  role: string;
  category: string;
  format: 'USSD' | 'CLI';
}

export class CommandSuggestionEngine {
  /**
   * Fornece sugestões instantâneas baseadas no buffer atual
   */
  public static getSuggestions(buffer: string, maxResults = 5): CommandSuggestion[] {
    const clean = buffer.trim();
    if (!clean) return [];

    const isCli = clean.startsWith('>') || clean.startsWith(':');
    const searchTerm = isCli ? clean.substring(1).trim().toLowerCase() : clean.toUpperCase();

    const stored = CommandPersistenceService.getStoredCommands().filter(c => c.enabled);
    const suggestions: CommandSuggestion[] = [];

    for (const cmd of stored) {
      if (isCli) {
        // Sugestões no formato CLI
        for (const alias of cmd.aliases) {
          if (alias.toLowerCase().startsWith(searchTerm) || alias.toLowerCase().includes(searchTerm)) {
            suggestions.push({
              text: `> ${alias}`,
              command: cmd.command,
              description: cmd.description,
              role: cmd.role,
              category: cmd.category,
              format: 'CLI'
            });
            break;
          }
        }
      } else {
        // Sugestões no formato USSD (*#...)
        if (cmd.command.startsWith(searchTerm) || cmd.command.includes(searchTerm)) {
          suggestions.push({
            text: cmd.command,
            command: cmd.command,
            description: cmd.description,
            role: cmd.role,
            category: cmd.category,
            format: 'USSD'
          });
        }
      }
    }

    return suggestions.slice(0, maxResults);
  }
}
