import { InputEngine, InputEngineService, InputContext, KeyboardType } from './inputEngine';
import { KeyboardEngine, KeyboardEngineService } from './keyboardEngine';
import { ClipboardEngine, ClipboardEngineService, ClipboardItem } from './clipboardEngine';
import { CommandEngine, CommandEngineService, CommandDefinition } from './commandEngine';
import { NavigationEngine, NavigationEngineService, PublicTabDomain } from './navigationEngine';

export class InteractionEngineService {
  public readonly input: InputEngineService = InputEngine;
  public readonly keyboard: KeyboardEngineService = KeyboardEngine;
  public readonly clipboard: ClipboardEngineService = ClipboardEngine;
  public readonly command: CommandEngineService = CommandEngine;
  public readonly navigation: NavigationEngineService = NavigationEngine;

  private listeners: Set<() => void> = new Set();

  constructor() {
    // Cascade notify when any child engine updates
    this.input.subscribe(() => this.notify());
    this.keyboard.subscribe(() => this.notify());
    this.clipboard.subscribe(() => this.notify());
    this.command.subscribe(() => this.notify());
    this.navigation.subscribe(() => this.notify());
  }

  // Convenient shortcut methods
  public openInputContext(context: InputContext) {
    this.input.openKeyboard(context);
    this.keyboard.openKeyboard(context);
  }

  public closeInteraction() {
    this.keyboard.closeKeyboard();
  }

  public async copyToClipboard(text: string, sourceDevice?: string): Promise<boolean> {
    return this.clipboard.copyText(text, sourceDevice);
  }

  public async executeQuickCommand(commandId: string, args?: Record<string, any>) {
    return this.command.executeCommand(commandId, args);
  }

  public navigateTo(domain: PublicTabDomain, subTab?: string) {
    this.navigation.navigateTo(domain, subTab);
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

export const InteractionEngine = new InteractionEngineService();
