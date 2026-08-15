// src/engine/dtmfT9Engine.ts — Motor de Tradução e Mapeamento DTMF T9 (ITU-T E.161)
// Mapeamento numérico padrão para teclados telefónicos clássicos (0-9, *, #)

export interface T9Mapping {
  digit: string;
  letters: string[];
}

export class DTMFT9Engine {
  private static readonly KEYPAD_MAP: Record<string, string[]> = {
    '2': ['A', 'B', 'C'],
    '3': ['D', 'E', 'F'],
    '4': ['G', 'H', 'I'],
    '5': ['J', 'K', 'L'],
    '6': ['M', 'N', 'O'],
    '7': ['P', 'Q', 'R', 'S'],
    '8': ['T', 'U', 'V'],
    '9': ['W', 'X', 'Y', 'Z'],
    '0': [' '],
    '1': []
  };

  private static readonly LETTER_TO_DIGIT: Record<string, string> = {
    A: '2', B: '2', C: '2',
    D: '3', E: '3', F: '3',
    G: '4', H: '4', I: '4',
    J: '5', K: '5', L: '5',
    M: '6', N: '6', O: '6',
    P: '7', Q: '7', R: '7', S: '7',
    T: '8', U: '8', V: '8',
    W: '9', X: '9', Y: '9', Z: '9'
  };

  // Dicionário de comandos conhecidos para desambiguação rápida T9
  private static readonly KNOWN_KEYWORDS: Record<string, string> = {
    '7668': 'ROOT',
    '3686337': 'FOUNDER',
    '23646': 'ADMIN',
    '3384237': 'DEVICES',
    '8353266': 'TELECOM',
    '2265464': 'BANKING',
    '7962': 'SYNC',
    '7247': 'PAIR',
    '5625': 'LOCK',
    '28348': 'AUDIT',
    '797836': 'SYSTEM',
    '87377': 'USERS',
    '63772437': 'MESSAGES',
    '6684342284667': 'NOTIFICATIONS',
    '22558378': 'CALLTEST',
    '87267337': 'TRANSFER',
    '26682287': 'CONTACTS',
    '27328323646': 'CREATEADMIN',
    '73287489': 'SECURITY',
    '627837': 'MASTER'
  };

  /**
   * Converte texto alfabético para sequência de dígitos T9
   * Ex: "ROOT" -> "7668", "FOUNDER" -> "3686337"
   */
  public static textToT9(text: string): string {
    return text
      .toUpperCase()
      .split('')
      .map(char => this.LETTER_TO_DIGIT[char] || char)
      .join('');
  }

  /**
   * Converte comando com letras para formato DTMF numérico
   * Ex: "*#ROOT#" -> "*#7668#"
   */
  public static commandToDTMF(commandWithLetters: string): string {
    const isHashPrefix = commandWithLetters.startsWith('*#');
    const isStarPrefix = commandWithLetters.startsWith('*');
    const isHashSuffix = commandWithLetters.endsWith('#');

    let body = commandWithLetters;
    if (isHashPrefix) body = body.substring(2);
    else if (isStarPrefix) body = body.substring(1);
    if (isHashSuffix) body = body.substring(0, body.length - 1);

    // Se tiver parâmetros inline com : ou =
    const parts = body.split(':');
    const convertedHead = this.textToT9(parts[0]);
    const convertedParts = [convertedHead, ...parts.slice(1)];
    const convertedBody = convertedParts.join(':');

    const prefix = isHashPrefix ? '*#' : (isStarPrefix ? '*' : '');
    const suffix = isHashSuffix ? '#' : '';

    return `${prefix}${convertedBody}${suffix}`;
  }

  /**
   * Tenta resolver uma sequência DTMF numérica de volta para o comando em texto
   * Ex: "*#7668#" -> "*#ROOT#", "*#3686337#" -> "*#FOUNDER#"
   */
  public static resolveDTMFToCommand(dtmfInput: string): string | null {
    const clean = dtmfInput.trim().toUpperCase();
    
    // Suporte para *#DIGITS#
    if (clean.startsWith('*#') && clean.endsWith('#')) {
      const body = clean.substring(2, clean.length - 1);
      if (this.KNOWN_KEYWORDS[body]) {
        return `*#${this.KNOWN_KEYWORDS[body]}#`;
      }
    }

    // Suporte para *DIGITS#
    if (clean.startsWith('*') && clean.endsWith('#')) {
      const body = clean.substring(1, clean.length - 1);
      if (this.KNOWN_KEYWORDS[body]) {
        return `*#${this.KNOWN_KEYWORDS[body]}#`;
      }
    }

    return null;
  }

  /**
   * Obtém a correspondência de texto para uma sequência de dígitos
   */
  public static getKeywordForDigits(digits: string): string | null {
    return this.KNOWN_KEYWORDS[digits] || null;
  }

  /**
   * Registra uma nova palavra-chave no motor T9
   */
  public static registerKeyword(word: string): string {
    const upper = word.toUpperCase();
    const digits = this.textToT9(upper);
    this.KNOWN_KEYWORDS[digits] = upper;
    return digits;
  }

  /**
   * Retorna todas as combinações T9 conhecidas
   */
  public static getAllRegisteredKeywords(): Record<string, string> {
    return { ...this.KNOWN_KEYWORDS };
  }
}
