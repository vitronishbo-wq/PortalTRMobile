// Input Engine — Single Source of Truth for System Keyboard & Adaptive Inputs
import { DeviceEvent } from '../components/SwipeableEventCard';

export type InputContext =
  | 'dialer'
  | 'phone'
  | 'sms'
  | 'search'
  | 'contacts'
  | 'profile'
  | 'settings'
  | 'commands'
  | 'dtmf'
  | 'pin'
  | 'otp'
  | 'security'
  | 'login'
  | 'text'
  | 'other';

export type KeyboardType = 'numeric' | 'textual' | 'pin' | 'dtmf';

export interface AutocompleteSuggestion {
  id: string;
  label: string;
  value: string;
  category?: string;
  icon?: string;
}

// DTMF Frequency mappings (Hz)
const DTMF_FREQUENCIES: Record<string, [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477],
  'A': [697, 1633],
  'B': [770, 1633],
  'C': [852, 1633],
  'D': [941, 1633]
};

export class InputEngineService {
  private activeContext: InputContext = 'dialer';
  private keyboardType: KeyboardType = 'numeric';
  private buffer: string = '';
  private history: string[] = [];
  private audioCtx: AudioContext | null = null;
  private listeners: Set<() => void> = new Set();
  private isVisible: boolean = false;
  private onCommitCallback: ((val: string, context: InputContext) => void) | null = null;

  constructor() {
    this.loadHistory();
  }

  public getContext(): InputContext {
    return this.activeContext;
  }

  public submit() {
    this.commit();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private loadHistory() {
    try {
      const stored = localStorage.getItem('portaltr_input_history');
      if (stored) {
        this.history = JSON.parse(stored);
      }
    } catch {
      this.history = [];
    }
  }

  private saveHistory() {
    try {
      localStorage.setItem('portaltr_input_history', JSON.stringify(this.history.slice(0, 30)));
    } catch {
      // ignore
    }
  }

  public openKeyboard(
    context: InputContext,
    initialVal: string = '',
    onCommit?: (val: string, context: InputContext) => void
  ) {
    this.activeContext = context;
    this.buffer = initialVal;
    this.onCommitCallback = onCommit || null;
    this.isVisible = true;

    // Adapt keyboard type based on context
    switch (context) {
      case 'dialer':
      case 'dtmf':
        this.keyboardType = 'dtmf';
        break;
      case 'phone':
      case 'otp':
        this.keyboardType = 'numeric';
        break;
      case 'pin':
      case 'security':
      case 'login':
        this.keyboardType = 'pin';
        break;
      case 'settings':
        this.keyboardType = 'textual';
        break;
      case 'sms':
      case 'search':
      case 'contacts':
      case 'profile':
      case 'commands':
      case 'text':
      default:
        this.keyboardType = 'textual';
        break;
    }

    this.notify();
  }

  public closeKeyboard() {
    this.isVisible = false;
    this.notify();
  }

  public toggleKeyboard() {
    this.isVisible = !this.isVisible;
    this.notify();
  }

  public setKeyboardType(type: KeyboardType) {
    this.keyboardType = type;
    this.notify();
  }

  public setContext(context: InputContext) {
    this.activeContext = context;
    if (context === 'dialer' || context === 'dtmf') this.keyboardType = 'dtmf';
    else if (context === 'phone' || context === 'otp') this.keyboardType = 'numeric';
    else if (context === 'pin' || context === 'security' || context === 'login') this.keyboardType = 'pin';
    else this.keyboardType = 'textual';
    this.notify();
  }

  public appendChar(char: string) {
    this.buffer += char;
    if (this.keyboardType === 'dtmf' || this.activeContext === 'dialer') {
      this.playDTMF(char);
    }
    this.notify();
  }

  public typeDigit(digit: string) {
    this.appendChar(digit);
  }

  public backspace() {
    if (this.buffer.length > 0) {
      this.buffer = this.buffer.slice(0, -1);
      this.notify();
    }
  }

  public clearBuffer() {
    this.buffer = '';
    this.notify();
  }

  public setBuffer(val: string) {
    this.buffer = val;
    this.notify();
  }

  public commit() {
    if (this.buffer.trim().length > 0) {
      const entry = this.buffer.trim();
      if (!this.history.includes(entry)) {
        this.history.unshift(entry);
        this.saveHistory();
      }
    }

    if (this.onCommitCallback) {
      this.onCommitCallback(this.buffer, this.activeContext);
    }

    this.notify();
  }

  public copyToClipboard(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      return navigator.clipboard.writeText(this.buffer).then(
        () => true,
        () => false
      );
    }
    return Promise.resolve(false);
  }

  public async pasteFromClipboard(): Promise<string> {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        const text = await navigator.clipboard.readText();
        this.buffer += text;
        this.notify();
        return text;
      } catch {
        return '';
      }
    }
    return '';
  }

  public playDTMF(key: string) {
    const freqs = DTMF_FREQUENCIES[key.toUpperCase()];
    if (!freqs) return;

    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }

      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.value = freqs[0];
      osc2.frequency.value = freqs[1];

      gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start();
      osc2.start();

      osc1.stop(this.audioCtx.currentTime + 0.15);
      osc2.stop(this.audioCtx.currentTime + 0.15);
    } catch {
      // audio disabled/blocked
    }
  }

  public getAutocompleteSuggestions(): AutocompleteSuggestion[] {
    const q = this.buffer.toLowerCase().trim();

    if (this.activeContext === 'commands') {
      const cmds: AutocompleteSuggestion[] = [
        { id: 'cmd-call', label: '/call +244923000111', value: '/call +244923000111', category: 'Comando', icon: 'Phone' },
        { id: 'cmd-sms', label: '/sms +244923000111 "Olá!"', value: '/sms +244923000111 "Olá!"', category: 'Comando', icon: 'MessageSquare' },
        { id: 'cmd-sync', label: '/sync force-mesh', value: '/sync force-mesh', category: 'Sistema', icon: 'RefreshCw' },
        { id: 'cmd-pair', label: '/pair device-qr', value: '/pair device-qr', category: 'Dispositivo', icon: 'QrCode' },
        { id: 'cmd-lock', label: '/lock remote-wipe', value: '/lock remote-wipe', category: 'Segurança', icon: 'Lock' }
      ];
      return q ? cmds.filter((c) => c.value.toLowerCase().includes(q)) : cmds;
    }

    if (this.activeContext === 'dialer') {
      const presets: AutocompleteSuggestion[] = [
        { id: 'd-1', label: 'Ana Beatriz (+244 944 111 222)', value: '+244944111222', category: 'Contacto' },
        { id: 'd-2', label: 'Suporte Técnico (+244 923 888 999)', value: '+244923888999', category: 'Suporte' },
        { id: 'd-3', label: 'Maria Silva (+244 923 000 111)', value: '+244923000111', category: 'Trabalho' },
        { id: 'd-4', label: 'Carlos Eduardo (+244 912 345 678)', value: '+244912345678', category: 'Pessoal' }
      ];
      return q ? presets.filter((p) => p.label.toLowerCase().includes(q) || p.value.includes(q)) : presets;
    }

    if (this.activeContext === 'sms') {
      const msgs: AutocompleteSuggestion[] = [
        { id: 's-1', label: 'Em reunião no momento, ligo já.', value: 'Em reunião no momento, ligo já.', category: 'SMS Rápido' },
        { id: 's-2', label: 'A caminho do escritório.', value: 'A caminho do escritório.', category: 'SMS Rápido' },
        { id: 's-3', label: 'Confirmado! Obrigado.', value: 'Confirmado! Obrigado.', category: 'SMS Rápido' },
        { id: 's-4', label: 'Pode enviar os documentos por favor?', value: 'Pode enviar os documentos por favor?', category: 'SMS Rápido' }
      ];
      return q ? msgs.filter((m) => m.label.toLowerCase().includes(q)) : msgs;
    }

    if (this.activeContext === 'search') {
      const recent = this.history.map((h, i) => ({
        id: `hist-${i}`,
        label: h,
        value: h,
        category: 'Histórico'
      }));
      return q ? recent.filter((r) => r.label.toLowerCase().includes(q)) : recent;
    }

    return [];
  }

  // Getters
  public getActiveContext(): InputContext {
    return this.activeContext;
  }

  public getKeyboardType(): KeyboardType {
    return this.keyboardType;
  }

  public getBuffer(): string {
    return this.buffer;
  }

  public getHistory(): string[] {
    return [...this.history];
  }

  public getIsVisible(): boolean {
    return this.isVisible;
  }
}

export const InputEngine = new InputEngineService();
