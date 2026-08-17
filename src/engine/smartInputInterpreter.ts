// src/engine/smartInputInterpreter.ts — Interpretador Inteligente de Entrada e Sanitizador Universal (COS 6-Layer Architecture)

export type InputCategory = 
  | 'TELEPHONE'        // Números de telefone E.164 ou locais (ex: +244923123456, 923123456)
  | 'USSD'             // Comandos de rede de operadora (*100#, *111#)
  | 'SECRET_COMMAND'   // Códigos de sistema MMI/COS (*#6368#, *#7668#, *900#, *#23646#)
  | 'DTMF_T9'          // Combinações alfanuméricas puras T9 (ex: 23646 = ADMIN, 7668 = ROOT)
  | 'RAW_COMMAND';     // Linhas de comando ou outros formatos

export interface InterpretedInput {
  raw: string;
  sanitized: string;
  category: InputCategory;
  categoryLabel: string;
  badgeColor: string;
  isCallable: boolean;
  isExecutable: boolean;
  metadata?: {
    countryCode?: string;
    nationalNumber?: string;
    mmiPrefix?: string;
    mmiSuffix?: string;
  };
}

export class SmartInputInterpreter {
  /**
   * Sanitiza entradas vindas de digitação, clipboard, paste ou drag-and-drop
   * - Preserva intactos: *100#, *111#, *#6368#, *900#, etc.
   * - Normaliza telefones:
   *     +244 923 123 456 -> +244923123456
   *     (923) 123-456 -> 923123456
   *     +1 (555) 019-2834 -> +15550192834
   */
  public static sanitize(input: string): string {
    if (!input) return '';
    const trimmed = input.trim();

    // 1. Se for comando MMI/USSD iniciado por * ou # (*100#, *#6368#, *900#, etc.)
    if (trimmed.startsWith('*') || trimmed.startsWith('#')) {
      // Remove apenas espaços acidentais dentro do código
      return trimmed.replace(/\s+/g, '');
    }

    // 2. Se iniciar com + (código internacional de país), remove espaços, parênteses e hífens
    if (trimmed.startsWith('+')) {
      const countryAndDigits = trimmed.replace(/[^\d+]/g, '');
      return countryAndDigits;
    }

    // 3. Se for número com parênteses/hífens ou formatações normais
    // Ex: (923) 123-456 -> 923123456
    // Ex: 923 123 456 -> 923123456
    const cleanNumbersOnly = trimmed.replace(/[^\d+*#a-zA-Z]/g, '');
    return cleanNumbersOnly;
  }

  /**
   * Analisa a entrada e classifica a categoria semântica do input
   */
  public static interpret(rawInput: string): InterpretedInput {
    const sanitized = this.sanitize(rawInput);
    if (!sanitized) {
      return {
        raw: rawInput,
        sanitized: '',
        category: 'RAW_COMMAND',
        categoryLabel: 'VAZIO',
        badgeColor: 'text-slate-500 border-slate-700 bg-slate-800/40',
        isCallable: false,
        isExecutable: false
      };
    }

    // A. Secret Commands MMI / COS (ex: *#6368#, *#7668#, *#23646#, *900#, *700#)
    if (
      sanitized.startsWith('*#') || 
      sanitized === '*900#' || 
      sanitized === '*700#' || 
      sanitized === '*#06#' ||
      sanitized === '*#6368#' ||
      sanitized.startsWith('PTL-')
    ) {
      return {
        raw: rawInput,
        sanitized,
        category: 'SECRET_COMMAND',
        categoryLabel: 'SECRET COMMAND',
        badgeColor: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
        isCallable: false,
        isExecutable: true,
        metadata: {
          mmiPrefix: sanitized.slice(0, 2),
          mmiSuffix: sanitized.slice(-1)
        }
      };
    }

    // B. USSD de Rede / Operadora (ex: *100#, *101#, *111#, *123#)
    if (sanitized.startsWith('*') && sanitized.endsWith('#')) {
      return {
        raw: rawInput,
        sanitized,
        category: 'USSD',
        categoryLabel: 'USSD NETWORK',
        badgeColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
        isCallable: true,
        isExecutable: true,
        metadata: {
          mmiPrefix: '*',
          mmiSuffix: '#'
        }
      };
    }

    // C. Telefone Internacional ou Nacional
    // Começa com + ou tem apenas dígitos entre 3 e 16 caracteres
    const isPhonePattern = /^\+?[0-9]{3,16}$/.test(sanitized);
    if (isPhonePattern) {
      return {
        raw: rawInput,
        sanitized,
        category: 'TELEPHONE',
        categoryLabel: 'TELEPHONE',
        badgeColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
        isCallable: true,
        isExecutable: false
      };
    }

    // D. DTMF / T9 Alfanumérico puro
    if (/^[0-9*#]+$/.test(sanitized)) {
      return {
        raw: rawInput,
        sanitized,
        category: 'DTMF_T9',
        categoryLabel: 'DTMF / T9',
        badgeColor: 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10',
        isCallable: true,
        isExecutable: true
      };
    }

    // E. Comando Raw / Outros
    return {
      raw: rawInput,
      sanitized,
      category: 'RAW_COMMAND',
      categoryLabel: 'RAW COMMAND',
      badgeColor: 'text-slate-300 border-slate-600 bg-slate-800/60',
      isCallable: false,
      isExecutable: true
    };
  }
}
