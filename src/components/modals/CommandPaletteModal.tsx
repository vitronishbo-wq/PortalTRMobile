// src/components/modals/CommandPaletteModal.tsx — Command Palette 2.0 Unificada (COS CLI)
// Diretrizes 23, 26, 28 & 32: Acesso rápido, execução de comandos parametrizados e equivalência total

import React, { useState, useEffect } from 'react';
import { CommandSuggestionEngine, CommandSuggestion } from '../../engine/commandSuggestionEngine';
import { CommandRouter } from '../../engine/commandRouter';
import { CommandEngine } from '../../engine/commandEngine';
import { Terminal, Shield, ArrowRight, X, Play } from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>([]);
  const [lastOutput, setLastOutput] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSuggestions(CommandSuggestionEngine.getSuggestions(query || '>', 10));
    }
  }, [query, isOpen]);

  if (!isOpen) return null;

  const handleExecuteInput = async (cmdText: string) => {
    const input = cmdText.trim();
    if (!input) return;

    const res = await CommandRouter.route(input);
    if (res.isCommand) {
      setLastOutput(res.message);
      setTimeout(() => {
        onClose();
        setLastOutput(null);
        setQuery('');
      }, 1000);
    } else {
      CommandEngine.setBuffer(input);
      await CommandEngine.executeCurrentBuffer();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/80 backdrop-blur-sm p-4 font-mono text-slate-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Input Bar */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center space-x-3">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter') {
                if (query.trim()) {
                  handleExecuteInput(query);
                } else if (suggestions.length > 0) {
                  handleExecuteInput(suggestions[0].command);
                }
              }
            }}
            placeholder="Digite comando COS (*#FOUNDER#, > create admin, > lock s22)..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none font-mono"
          />
          <button 
            onClick={() => handleExecuteInput(query)}
            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
            title="Executar comando"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Output Banner se executado */}
        {lastOutput && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-4 py-2 text-emerald-300 text-xs flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{lastOutput}</span>
          </div>
        )}

        {/* Suggestions List */}
        <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
          {suggestions.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              Pressione Enter para executar comando parametrizado customizado.
            </div>
          ) : (
            suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleExecuteInput(s.command)}
                className="w-full px-4 py-2.5 text-left hover:bg-slate-800/60 flex items-center justify-between group transition cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-amber-400 text-xs">
                    {s.text}
                  </span>
                  <span className="text-[11px] text-slate-300 font-sans">
                    {s.description}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {s.category}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    s.role === 'FOUNDER' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                    s.role === 'ADMIN' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                    s.role === 'OPERATOR' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {s.role}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
          <span>Barramento Unificado: Dialer ↔ CLI ↔ Palette</span>
          <span className="text-slate-400">ENTER para executar • ESC para fechar</span>
        </div>
      </div>
    </div>
  );
};
