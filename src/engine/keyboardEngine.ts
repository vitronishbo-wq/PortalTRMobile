import { InputEngine, InputContext, KeyboardType } from './inputEngine';

export interface KeyboardLayoutConfig {
  type: KeyboardType;
  label: string;
  rows: string[][];
}

export class KeyboardEngineService {
  private isOpen: boolean = false;
  private currentType: KeyboardType = 'textual';
  private currentContext: InputContext = 'text';
  private shiftActive: boolean = false;
  private capsLock: boolean = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Synchronize with InputEngine changes
    InputEngine.subscribe(() => {
      this.currentContext = InputEngine.getContext();
      this.currentType = InputEngine.getKeyboardType();
      this.notify();
    });
  }

  public openKeyboard(context: InputContext = 'text', customType?: KeyboardType) {
    this.isOpen = true;
    this.currentContext = context;
    if (customType) {
      this.currentType = customType;
    } else {
      InputEngine.setContext(context);
      this.currentType = InputEngine.getKeyboardType();
    }
    this.notify();
  }

  public closeKeyboard() {
    this.isOpen = false;
    this.notify();
  }

  public toggleKeyboard() {
    this.isOpen = !this.isOpen;
    this.notify();
  }

  public isKeyboardOpen(): boolean {
    return this.isOpen;
  }

  public getCurrentType(): KeyboardType {
    return this.currentType;
  }

  public getCurrentContext(): InputContext {
    return this.currentContext;
  }

  public toggleShift() {
    this.shiftActive = !this.shiftActive;
    this.notify();
  }

  public isShiftActive(): boolean {
    return this.shiftActive || this.capsLock;
  }

  public handleKeyPress(key: string) {
    if (key === 'ENTER') {
      InputEngine.submit();
      return;
    }

    if (key === 'BACKSPACE') {
      InputEngine.backspace();
      return;
    }

    if (key === 'SPACE') {
      InputEngine.appendChar(' ');
      return;
    }

    let charToAppend = key;
    if (this.currentType === 'textual' && this.isShiftActive()) {
      charToAppend = key.toUpperCase();
      if (this.shiftActive && !this.capsLock) {
        this.shiftActive = false;
      }
    }

    InputEngine.appendChar(charToAppend);
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    callback();
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }
}

export const KeyboardEngine = new KeyboardEngineService();
