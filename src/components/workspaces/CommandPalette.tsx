import React, { useState, useEffect } from 'react';
import {
  Search,
  Crown,
  ShieldAlert,
  Terminal,
  Zap,
  RotateCcw,
  UserPlus,
  Rocket,
  Key,
  Smartphone,
  Check,
  X,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';

export interface CommandItem {
  id: string;
  category: 'Root' | 'Devices' | 'Features' | 'Deploy' | 'Security' | 'Automation';
  title: string;
  description: string;
  shortcut?: string;
  icon: React.ForwardRefExoticComponent<any>;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (title: string, output: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onExecuteCommand
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const commands: CommandItem[] = [
    {
      id: 'cmd-root-elevate',
      category: 'Root',
      title: 'Root: Elevate Root Authority Session',
      description: 'Executar desafio de autenticação de múltiplos fatores Root',
      shortcut: 'Ctrl+Shift+R',
      icon: Crown,
      action: () => {
        onExecuteCommand(
          'Root: Elevate Root Authority Session',
          'Sessão Root elevada com sucesso via desafio de segurança multifator.'
        );
      }
    },
    {
      id: 'cmd-admin-create',
      category: 'Root',
      title: 'Root: Generate Admin Invitation Token',
      description: 'Criar convite assinado de uso único para novos administradores',
      shortcut: 'Ctrl+Shift+A',
      icon: UserPlus,
      action: () => {
        onExecuteCommand(
          'Root: Generate Admin Invitation Token',
          'Token de convite de administrador de 72 horas gerado pelo Root Engine.'
        );
      }
    },
    {
      id: 'cmd-lockdown',
      category: 'Security',
      title: 'Security: Trigger Emergency Lockdown',
      description: 'Ativar bloqueio total preventivo do sistema',
      shortcut: 'Ctrl+Shift+L',
      icon: ShieldAlert,
      action: () => {
        onExecuteCommand(
          'Security: Trigger Emergency Lockdown',
          'EMERGENCY LOCKDOWN ATIVADO. Todas as APIs externas protegidas.'
        );
      }
    },
    {
      id: 'cmd-device-repair',
      category: 'Devices',
      title: 'Devices: Run Auto-Healing Repair on Fleet',
      description: 'Re-enviar intents de acessibilidade para agentes desconectados',
      icon: Smartphone,
      action: () => {
        onExecuteCommand(
          'Devices: Run Auto-Healing Repair on Fleet',
          'Comando de auto-healing disparado para 2 dispositivos Android.'
        );
      }
    },
    {
      id: 'cmd-deploy',
      category: 'Deploy',
      title: 'Deployment: Trigger Smoke Test & Cloud Deploy',
      description: 'Executar pipeline completo de build, teste e publicação',
      shortcut: 'Ctrl+Shift+D',
      icon: Rocket,
      action: () => {
        onExecuteCommand(
          'Deployment: Trigger Smoke Test & Cloud Deploy',
          'Pipeline de deployment iniciado no Render / Firebase Hosting.'
        );
      }
    },
    {
      id: 'cmd-rotate-keys',
      category: 'Security',
      title: 'Security: Rotate System Encryption Secrets',
      description: 'Rotacionar chaves simétricas de criptografia no backend',
      icon: Key,
      action: () => {
        onExecuteCommand(
          'Security: Rotate System Encryption Secrets',
          'Chaves de encriptação rotacionadas sem downtime no sistema.'
        );
      }
    },
    {
      id: 'cmd-automation-run',
      category: 'Automation',
      title: 'Automation: Run Offline Device Rule Diagnostics',
      description: 'Testar motor de automação e triggers de notificações',
      icon: Zap,
      action: () => {
        onExecuteCommand(
          'Automation: Run Offline Device Rule Diagnostics',
          'Automation Engine verificou 4 regras ativas. Nenhuma anomalia crítica.'
        );
      }
    }
  ];

  const filteredCommands = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open
          setSearchQuery('');
          setSelectedIndex(0);
        }
      } else if (isOpen) {
        if (e.key === 'Escape') {
          onClose();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onClose();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-amber-500/30 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-100">
        {/* Input Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center space-x-3">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            type="text"
            placeholder="Digite um comando do Founder IDE... (ou esc para fechar)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-slate-100 text-sm font-mono placeholder-slate-500 focus:outline-none"
            autoFocus
          />
          <span className="px-2 py-1 bg-slate-800 text-slate-400 text-[10px] font-mono rounded border border-slate-700">
            Esc
          </span>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-mono">
              Nenhum comando do sistema encontrado para "{searchQuery}"
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200'
                      : 'bg-transparent text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`p-2 rounded-lg ${
                        isSelected ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold font-mono">{cmd.title}</span>
                        <span className="px-1.5 py-0.2 bg-slate-800 text-slate-400 text-[9px] rounded font-mono uppercase">
                          {cmd.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{cmd.description}</p>
                    </div>
                  </div>

                  {cmd.shortcut && (
                    <span className="px-2 py-0.5 bg-slate-950 text-amber-400/90 text-[10px] font-mono rounded border border-slate-800">
                      {cmd.shortcut}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-slate-950/90 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex items-center justify-between px-4">
          <div className="flex items-center space-x-3">
            <span>↑↓ para navegar</span>
            <span>↵ para executar</span>
            <span>Esc para sair</span>
          </div>
          <span className="text-amber-500/80 font-bold">VS Code Founder Command Palette</span>
        </div>
      </div>
    </div>
  );
};
