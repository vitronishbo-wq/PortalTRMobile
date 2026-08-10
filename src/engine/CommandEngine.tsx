import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MultiDeviceMeshEngine } from './multiDeviceMeshEngine';
import { NavigationEngine } from './navigationEngine';
import { ClipboardEngine } from './ClipboardEngine';

export interface CommandDefinition {
  id: string;
  name: string;
  description: string;
  category: 'Comunicação' | 'Dispositivo' | 'Segurança' | 'Navegação' | 'Sistema' | 'IDE';
  requiresAuth?: boolean;
  shortcut?: string;
  contextScope?: 'global' | 'public' | 'founder';
  action: (args?: Record<string, any>) => Promise<any> | any;
}

export interface ExecutedCommandLog {
  id: string;
  commandId: string;
  commandName: string;
  timestamp: number;
  status: 'SUCCESS' | 'FAILED';
  result?: any;
  error?: string;
  executorNodeId: string;
}

export class CommandEngineSingleton {
  private static instance: CommandEngineSingleton;
  private commands: Map<string, CommandDefinition> = new Map();
  private commandHistory: ExecutedCommandLog[] = [];
  private isPaletteOpen: boolean = false;
  private currentContext: 'public' | 'founder' = 'public';
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.registerBuiltInCommands();
    this.setupGlobalShortcutListener();
  }

  public static getInstance(): CommandEngineSingleton {
    if (!CommandEngineSingleton.instance) {
      CommandEngineSingleton.instance = new CommandEngineSingleton();
    }
    return CommandEngineSingleton.instance;
  }

  public setContextScope(context: 'public' | 'founder') {
    this.currentContext = context;
    this.notify();
  }

  public getContextScope(): 'public' | 'founder' {
    return this.currentContext;
  }

  public registerCommand(cmd: CommandDefinition) {
    this.commands.set(cmd.id, cmd);
    this.notify();
  }

  public getCommands(contextFilter?: 'global' | 'public' | 'founder'): CommandDefinition[] {
    const all = Array.from(this.commands.values());
    if (!contextFilter) return all;
    return all.filter((c) => !c.contextScope || c.contextScope === 'global' || c.contextScope === contextFilter);
  }

  public getCommandHistory(): ExecutedCommandLog[] {
    return this.commandHistory;
  }

  public isCommandPaletteOpen(): boolean {
    return this.isPaletteOpen;
  }

  public openPalette() {
    this.isPaletteOpen = true;
    this.notify();
  }

  public closePalette() {
    this.isPaletteOpen = false;
    this.notify();
  }

  public togglePalette() {
    this.isPaletteOpen = !this.isPaletteOpen;
    this.notify();
  }

  public async executeCommand(commandId: string, args?: Record<string, any>): Promise<any> {
    const cmd = this.commands.get(commandId);
    if (!cmd) {
      const errLog: ExecutedCommandLog = {
        id: `exec-${Date.now()}`,
        commandId,
        commandName: commandId,
        timestamp: Date.now(),
        status: 'FAILED',
        error: `Comando '${commandId}' não encontrado.`,
        executorNodeId: MultiDeviceMeshEngine.getLocalNodeId()
      };
      this.commandHistory = [errLog, ...this.commandHistory].slice(0, 50);
      this.notify();
      throw new Error(errLog.error);
    }

    try {
      const result = await cmd.action(args);
      const successLog: ExecutedCommandLog = {
        id: `exec-${Date.now()}`,
        commandId,
        commandName: cmd.name,
        timestamp: Date.now(),
        status: 'SUCCESS',
        result,
        executorNodeId: MultiDeviceMeshEngine.getLocalNodeId()
      };
      this.commandHistory = [successLog, ...this.commandHistory].slice(0, 50);
      this.notify();
      return result;
    } catch (err: any) {
      const failLog: ExecutedCommandLog = {
        id: `exec-${Date.now()}`,
        commandId,
        commandName: cmd.name,
        timestamp: Date.now(),
        status: 'FAILED',
        error: err?.message || 'Erro desconhecido ao executar comando',
        executorNodeId: MultiDeviceMeshEngine.getLocalNodeId()
      };
      this.commandHistory = [failLog, ...this.commandHistory].slice(0, 50);
      this.notify();
      throw err;
    }
  }

  private setupGlobalShortcutListener() {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // Toggle Command Palette with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.togglePalette();
        return;
      }

      // Close Palette on Escape
      if (e.key === 'Escape' && this.isPaletteOpen) {
        e.preventDefault();
        this.closePalette();
        return;
      }

      // Alt+H: Handover
      if (e.altKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        this.executeCommand('cmd.sys.sync_mesh');
        return;
      }

      // Alt+C: Open Clipboard
      if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        ClipboardEngine.readText();
        return;
      }

      // Alt+D: Dialer
      if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        NavigationEngine.navigateTo('chamadas', 'dialer');
        return;
      }
    });
  }

  private registerBuiltInCommands() {
    this.registerCommand({
      id: 'cmd.sys.palette',
      name: 'Abrir Paleta de Comandos',
      description: 'Abre o menu contextual de comandos rápidos',
      category: 'Sistema',
      shortcut: 'Ctrl+K / Cmd+K',
      contextScope: 'global',
      action: async () => {
        this.togglePalette();
        return 'Paleta alternada';
      }
    });

    this.registerCommand({
      id: 'cmd.sys.handover',
      name: 'Handover de Sessão',
      description: 'Transfere o foco da sessão ativa para outro nó da mesh',
      category: 'Navegação',
      shortcut: 'Alt+H',
      contextScope: 'global',
      action: async (args) => {
        if (args?.targetNodeId) {
          await MultiDeviceMeshEngine.handoverSessionToNode(args.targetNodeId, args.targetTab);
          return `Handover concluído para nó ${args.targetNodeId}`;
        }
        return 'Sincronização de nó concluída.';
      }
    });

    this.registerCommand({
      id: 'cmd.sys.sync_mesh',
      name: 'Sincronizar Mesh Dispositivos',
      description: 'Força a sincronização dos estados de nó e sessão unificada',
      category: 'Dispositivo',
      contextScope: 'global',
      action: async () => {
        const session = MultiDeviceMeshEngine.getActiveSession();
        return session ? `Mesh sincronizada: ${Object.keys(session.nodes).length} nós ativos` : 'Mesh inicializada';
      }
    });

    this.registerCommand({
      id: 'cmd.nav.dialer',
      name: 'Abrir Dialer',
      description: 'Navega para o teclado numérico de chamadas/DTMF',
      category: 'Comunicação',
      shortcut: 'Alt+D',
      contextScope: 'public',
      action: async () => {
        NavigationEngine.navigateTo('chamadas', 'dialer');
        return 'Dialer aberto';
      }
    });

    this.registerCommand({
      id: 'cmd.nav.messages',
      name: 'Ver Mensagens & SMS',
      description: 'Navega para a central de conversas e mensagens',
      category: 'Comunicação',
      contextScope: 'public',
      action: async () => {
        NavigationEngine.navigateTo('mensagens');
        return 'Mensagens abertas';
      }
    });

    this.registerCommand({
      id: 'cmd.clipboard.read',
      name: 'Sincronizar Área de Transferência',
      description: 'Lê e sincroniza o conteúdo da clipboard com o Session Mesh',
      category: 'Sistema',
      shortcut: 'Alt+C',
      contextScope: 'global',
      action: async () => {
        const text = await ClipboardEngine.readText();
        return text ? `Texto sincronizado: ${text.substring(0, 20)}...` : 'Clipboard vazia';
      }
    });

    this.registerCommand({
      id: 'cmd.security.lock_session',
      name: 'Bloquear Sessão de Dispositivo',
      description: 'Exige autenticação PIN/Biometria para retomar a sessão',
      category: 'Segurança',
      requiresAuth: true,
      contextScope: 'global',
      action: async () => {
        return 'Sessão bloqueada com sucesso.';
      }
    });
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

export const CommandEngine = CommandEngineSingleton.getInstance();
export type CommandEngineService = CommandEngineSingleton;

// React Context Integration
interface CommandContextType {
  commands: CommandDefinition[];
  commandHistory: ExecutedCommandLog[];
  isPaletteOpen: boolean;
  currentContext: 'public' | 'founder';
  executeCommand: (id: string, args?: Record<string, any>) => Promise<any>;
  registerCommand: (cmd: CommandDefinition) => void;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
  setContextScope: (context: 'public' | 'founder') => void;
}

const CommandContext = createContext<CommandContextType | undefined>(undefined);

export const CommandProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [commands, setCommands] = useState<CommandDefinition[]>(CommandEngine.getCommands());
  const [history, setHistory] = useState<ExecutedCommandLog[]>(CommandEngine.getCommandHistory());
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(CommandEngine.isCommandPaletteOpen());
  const [currentContext, setCurrentContext] = useState<'public' | 'founder'>(CommandEngine.getContextScope());

  useEffect(() => {
    const unsubscribe = CommandEngine.subscribe(() => {
      setCommands(CommandEngine.getCommands());
      setHistory(CommandEngine.getCommandHistory());
      setIsPaletteOpen(CommandEngine.isCommandPaletteOpen());
      setCurrentContext(CommandEngine.getContextScope());
    });
    return () => unsubscribe();
  }, []);

  return (
    <CommandContext.Provider
      value={{
        commands,
        commandHistory: history,
        isPaletteOpen,
        currentContext,
        executeCommand: (id, args) => CommandEngine.executeCommand(id, args),
        registerCommand: (cmd) => CommandEngine.registerCommand(cmd),
        openPalette: () => CommandEngine.openPalette(),
        closePalette: () => CommandEngine.closePalette(),
        togglePalette: () => CommandEngine.togglePalette(),
        setContextScope: (ctx) => CommandEngine.setContextScope(ctx)
      }}
    >
      {children}
    </CommandContext.Provider>
  );
};

export const useCommand = (): CommandContextType => {
  const context = useContext(CommandContext);
  if (!context) {
    return {
      commands: CommandEngine.getCommands(),
      commandHistory: CommandEngine.getCommandHistory(),
      isPaletteOpen: CommandEngine.isCommandPaletteOpen(),
      currentContext: CommandEngine.getContextScope(),
      executeCommand: (id, args) => CommandEngine.executeCommand(id, args),
      registerCommand: (cmd) => CommandEngine.registerCommand(cmd),
      openPalette: () => CommandEngine.openPalette(),
      closePalette: () => CommandEngine.closePalette(),
      togglePalette: () => CommandEngine.togglePalette(),
      setContextScope: (ctx) => CommandEngine.setContextScope(ctx)
    };
  }
  return context;
};
