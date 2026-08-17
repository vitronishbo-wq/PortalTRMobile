// src/engine/unifiedInputController.ts — Controlador Unificado de Entrada (Teclado Físico, Numpad, Teclado Virtual, Clipboard)

export interface KeypadEventDetail {
  key: string;           // '0'-'9', '*', '#', '+'
  source: 'VIRTUAL_KEYPAD' | 'PHYSICAL_KEYBOARD' | 'NUMPAD' | 'CLIPBOARD' | 'SYSTEM';
  action?: 'INPUT' | 'BACKSPACE' | 'CLEAR' | 'SUBMIT' | 'CANCEL';
  numLockActive?: boolean;
}

export class UnifiedInputController {
  private static activePressedKey: string | null = null;
  private static listeners: Set<(key: string | null) => void> = new Set();

  /**
   * Registra listener para feedback visual de tecla pressionada
   */
  public static subscribeVisualFeedback(callback: (key: string | null) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Aciona animação de clique háptico/visual para tecla física
   */
  public static triggerVisualFeedback(key: string, durationMs: number = 150): void {
    this.activePressedKey = key;
    this.listeners.forEach(cb => cb(this.activePressedKey));

    setTimeout(() => {
      if (this.activePressedKey === key) {
        this.activePressedKey = null;
        this.listeners.forEach(cb => cb(null));
      }
    }, durationMs);
  }

  /**
   * Valida se o evento de teclado deve ser capturado ou ignorado
   * (Evita conflitos com campos de busca, modais de admin, etc.)
   */
  public static shouldCaptureKeyboardEvent(e: KeyboardEvent, isDialerActive: boolean, isAnyModalOpen: boolean): boolean {
    if (!isDialerActive) return false;
    if (isAnyModalOpen) return false;

    // Se estiver com foco num input ou textarea que não seja o próprio dialer display
    const activeEl = document.activeElement;
    if (activeEl) {
      const tagName = activeEl.tagName.toLowerCase();
      const isDialerInput = activeEl.getAttribute('data-dialer-input') === 'true';
      if ((tagName === 'input' || tagName === 'textarea' || tagName === 'select') && !isDialerInput) {
        return false;
      }
    }

    // Ignora atalhos de sistema com CTRL/META/ALT exceto cópia e cola
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return false;
    }

    return true;
  }

  /**
   * Mapeia eventos brutos de teclado para dígitos/ações do COS Dialer
   */
  public static mapKeyboardEvent(e: KeyboardEvent): KeypadEventDetail | null {
    const code = e.code;
    const key = e.key;

    // 1. Teclado Numérico Lateral (Numpad)
    if (code.startsWith('Numpad')) {
      if (code >= 'Numpad0' && code <= 'Numpad9') {
        const digit = code.replace('Numpad', '');
        return { key: digit, source: 'NUMPAD', action: 'INPUT' };
      }
      if (code === 'NumpadMultiply' || key === '*') {
        return { key: '*', source: 'NUMPAD', action: 'INPUT' };
      }
      if (code === 'NumpadAdd' || key === '+') {
        return { key: '+', source: 'NUMPAD', action: 'INPUT' };
      }
      if (code === 'NumpadEnter') {
        return { key: 'ENTER', source: 'NUMPAD', action: 'SUBMIT' };
      }
    }

    // 2. Teclado Numérico Superior (Digit0 - Digit9)
    if (code >= 'Digit0' && code <= 'Digit9' && !e.shiftKey) {
      const digit = code.replace('Digit', '');
      return { key: digit, source: 'PHYSICAL_KEYBOARD', action: 'INPUT' };
    }

    // 3. Símbolos (*, #, +)
    if (key === '*' || (e.shiftKey && code === 'Digit8')) {
      return { key: '*', source: 'PHYSICAL_KEYBOARD', action: 'INPUT' };
    }
    if (key === '#' || (e.shiftKey && code === 'Digit3')) {
      return { key: '#', source: 'PHYSICAL_KEYBOARD', action: 'INPUT' };
    }
    if (key === '+' || (e.shiftKey && code === 'Equal')) {
      return { key: '+', source: 'PHYSICAL_KEYBOARD', action: 'INPUT' };
    }

    // 4. Caracteres diretos 0-9
    if (/^[0-9]$/.test(key)) {
      return { key, source: 'PHYSICAL_KEYBOARD', action: 'INPUT' };
    }

    // 5. Letras A-Z / a-z (para T9 direto e Comandos COS)
    if (/^[a-zA-Z]$/.test(key) && key.length === 1) {
      return { key: key.toUpperCase(), source: 'PHYSICAL_KEYBOARD', action: 'INPUT' };
    }

    // 6. Ações de Controlo
    if (key === 'Backspace') {
      return { key: 'BACKSPACE', source: 'PHYSICAL_KEYBOARD', action: 'BACKSPACE' };
    }
    if (key === 'Delete') {
      return { key: 'DELETE', source: 'PHYSICAL_KEYBOARD', action: 'CLEAR' };
    }
    if (key === 'Enter') {
      return { key: 'ENTER', source: 'PHYSICAL_KEYBOARD', action: 'SUBMIT' };
    }
    if (key === 'Escape') {
      return { key: 'ESCAPE', source: 'PHYSICAL_KEYBOARD', action: 'CANCEL' };
    }

    return null;
  }
}
