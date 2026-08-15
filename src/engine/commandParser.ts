// src/engine/commandParser.ts — Interpretador e Tokenizador de Comandos COS 2.0
// Suporte a DTMF T9 (*#7668#), USSD (*100#), Hierárquico (*100*01#), Parametrizado (*100*01*email#) e CLI (> cmd)

import { CommandRegistry, CommandDefinition } from './commandRegistry';
import { DTMFT9Engine } from './dtmfT9Engine';

export interface ParsedCommandResult {
  isValid: boolean;
  format: 'USSD' | 'USSD_PARAMETRIC' | 'T9_DTMF' | 'CLI' | 'DIRECT' | 'UNKNOWN';
  rawInput: string;
  normalizedCommand: string;
  baseCommand: string;
  commandDef?: CommandDefinition;
  args: string[];
  switches: Record<string, string | boolean>;
  params: Record<string, string>;
  error?: string;
  t9TranslatedKeyword?: string;
}

export class CommandParser {
  /**
   * Normaliza a entrada removendo espaços extras
   */
  public static normalize(input: string): string {
    return input.trim();
  }

  /**
   * Identifica se a string é um padrão de comando USSD (*#...# ou *...# ou dígitos*dígitos#)
   */
  public static isUssdPattern(input: string): boolean {
    const clean = input.trim();
    if (clean.endsWith('#')) {
      if (clean.startsWith('*#') || clean.startsWith('*')) return clean.length >= 3;
      // Suporte a 100*01#
      if (/^\d+\*\d+#$/.test(clean)) return true;
    }
    return false;
  }

  /**
   * Identifica se a string é um comando CLI (> cmd arg)
   */
  public static isCliPattern(input: string): boolean {
    const clean = input.trim();
    return clean.startsWith('>') || clean.startsWith(':');
  }

  /**
   * Extrai parâmetros no formato KEY=VAL ou chave:valor ou USSD posicionais *100*01*arg1*arg2#
   */
  public static extractParameters(input: string): Record<string, string> {
    const params: Record<string, string> = {};
    
    // Suporte a *#CMD:KEY1=VAL1:KEY2=VAL2#
    if (input.includes(':')) {
      const parts = input.split(':');
      for (let i = 1; i < parts.length; i++) {
        let part = parts[i].replace(/#$/, '').trim();
        if (part.includes('=')) {
          const [k, v] = part.split('=');
          if (k && v) params[k.toUpperCase()] = v;
        } else if (part) {
          params[`ARG${i}`] = part;
        }
      }
    } else if (input.startsWith('*') && input.endsWith('#') && input.includes('*', 1)) {
      // Suporte a *100*01*arg1*arg2#
      const inner = input.substring(1, input.length - 1);
      const segments = inner.split('*');
      if (segments.length > 2) {
        segments.slice(2).forEach((arg, idx) => {
          params[`PARAM${idx + 1}`] = arg;
        });
      }
    }
    
    return params;
  }

  /**
   * Tokeniza e analisa a entrada do usuário
   */
  public static parse(input: string): ParsedCommandResult {
    const raw = this.normalize(input);
    if (!raw) {
      return {
        isValid: false,
        format: 'UNKNOWN',
        rawInput: input,
        normalizedCommand: '',
        baseCommand: '',
        args: [],
        switches: {},
        params: {},
        error: 'Entrada vazia'
      };
    }

    let format: ParsedCommandResult['format'] = 'UNKNOWN';
    let commandToken = '';
    let baseCommand = '';
    let t9TranslatedKeyword: string | undefined;
    const args: string[] = [];
    const switches: Record<string, string | boolean> = {};
    const params: Record<string, string> = this.extractParameters(raw);

    // 1. Verificação USSD / DTMF (*...# ou *#...# ou 100*01#)
    if (this.isUssdPattern(raw)) {
      const upperRaw = raw.toUpperCase();

      // Verifica se é USSD parametrizado multi-nível (ex: *100*01*admin@portal.ao#)
      const starCount = (raw.match(/\*/g) || []).length;
      if (raw.startsWith('*') && raw.endsWith('#') && starCount >= 2 && !raw.startsWith('*#')) {
        format = 'USSD_PARAMETRIC';
        const inner = raw.substring(1, raw.length - 1);
        const parts = inner.split('*');
        baseCommand = `*${parts[0]}*${parts[1]}#`;
        commandToken = upperRaw;
        
        // Coleta argumentos posicionais
        for (let i = 2; i < parts.length; i++) {
          args.push(parts[i]);
        }
      } else if (raw.includes(':')) {
        // Se tiver parâmetros inline *#LOCK:DEVICE=S22#
        format = 'USSD';
        const prefix = raw.split(':')[0];
        baseCommand = `${prefix.toUpperCase()}#`;
        commandToken = upperRaw;
      } else {
        format = 'USSD';
        baseCommand = upperRaw;
        commandToken = upperRaw;
      }

      // 2. Verificação de Conversão DTMF T9 (ex: *#7668# -> ROOT)
      const t9Resolved = DTMFT9Engine.resolveDTMFToCommand(baseCommand);
      if (t9Resolved) {
        format = 'T9_DTMF';
        t9TranslatedKeyword = t9Resolved;
      }
    } else if (this.isCliPattern(raw)) {
      format = 'CLI';
      const cleanCli = raw.substring(1).trim();
      const parts = cleanCli.split(/\s+/);
      
      const firstToken = parts[0] ? parts[0].toLowerCase() : '';
      const secondToken = parts[1] ? parts[1].toLowerCase() : '';

      // Trata comandos compostos como 'create admin' ou 'lock s22'
      if (firstToken === 'create' && secondToken === 'admin') {
        baseCommand = 'create admin';
        commandToken = 'create admin';
        for (let i = 2; i < parts.length; i++) {
          const p = parts[i];
          if (p.includes('=')) {
            const [k, v] = p.split('=');
            params[k.toUpperCase()] = v;
          } else {
            args.push(p);
          }
        }
      } else {
        baseCommand = firstToken;
        commandToken = firstToken;
        for (let i = 1; i < parts.length; i++) {
          const part = parts[i];
          if (part.startsWith('--')) {
            const [key, val] = part.substring(2).split('=');
            switches[key] = val !== undefined ? val : true;
          } else if (part.startsWith('-')) {
            switches[part.substring(1)] = true;
          } else if (part.includes('=')) {
            const [k, v] = part.split('=');
            params[k.toUpperCase()] = v;
          } else {
            args.push(part);
          }
        }
      }
    } else {
      format = 'DIRECT';
      commandToken = raw;
      baseCommand = raw;
    }

    // 3. Resolução contra o CommandRegistry
    let commandDef = CommandRegistry.findByCommandOrAlias(baseCommand) || 
                     CommandRegistry.findByCommandOrAlias(commandToken);

    // Se não encontrou diretamente mas houve tradução T9, busca pelo comando traduzido
    if (!commandDef && t9TranslatedKeyword) {
      commandDef = CommandRegistry.findByCommandOrAlias(t9TranslatedKeyword);
    }

    return {
      isValid: !!commandDef,
      format,
      rawInput: input,
      normalizedCommand: commandToken,
      baseCommand,
      commandDef,
      args,
      switches,
      params,
      t9TranslatedKeyword,
      error: commandDef ? undefined : `Comando não reconhecido: "${baseCommand || commandToken}"`
    };
  }
}
