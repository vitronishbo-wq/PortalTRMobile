import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Terminal, 
  X, 
  Zap, 
  Check, 
  AlertCircle, 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  Navigation, 
  Monitor, 
  Copy, 
  Sparkles,
  CornerDownLeft
} from 'lucide-react';
import { useCommand, CommandDefinition } from '../engine/CommandEngine';

export const CommandPaletteModal: React.FC = () => {
  const { 
    isPaletteOpen, 
    closePalette, 
    commands, 
    executeCommand, 
    commandHistory,
    currentContext
  } = useCommand();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isPaletteOpen) {
      setSearch('');
      setFeedbackMsg(null);
    }
  }, [isPaletteOpen]);

  if (!isPaletteOpen) return null;

  const filteredCommands = commands.filter((cmd) => {
    const matchesSearch = cmd.name.toLowerCase().includes(search.toLowerCase()) || 
                          cmd.description.toLowerCase().includes(search.toLowerCase()) ||
                          cmd.id.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || cmd.category === selectedCategory;
    const matchesScope = !cmd.contextScope || cmd.contextScope === 'global' || cmd.contextScope === currentContext;

    return matchesSearch && matchesCategory && matchesScope;
  });

  const handleRunCommand = async (cmd: CommandDefinition) => {
    setExecutingId(cmd.id);
    setFeedbackMsg(null);
    try {
      const res = await executeCommand(cmd.id);
      setFeedbackMsg({
        type: 'success',
        text: typeof res === 'string' ? res : `Comando '${cmd.name}' executado com sucesso.`
      });
      setTimeout(() => {
        setExecutingId(null);
        closePalette();
      }, 1000);
    } catch (err: any) {
      setExecutingId(null);
      setFeedbackMsg({
        type: 'error',
        text: err?.message || 'Erro ao executar comando'
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Comunicação':
        return <Phone className="w-4 h-4 text-emerald-400" />;
      case 'Dispositivo':
        return <Monitor className="w-4 h-4 text-cyan-400" />;
      case 'Segurança':
        return <ShieldCheck className="w-4 h-4 text-rose-400" />;
      case 'Navegação':
        return <Navigation className="w-4 h-4 text-indigo-400" />;
      case 'IDE':
        return <Terminal className="w-4 h-4 text-amber-400" />;
      default:
        return <Zap className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-md transition-all animate-fade-in font-sans">
      
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={closePalette} />

      {/* Palette Container */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 z-10 flex flex-col max-h-[80vh]">
        
        {/* Header Search Bar */}
        <div className="p-3.5 border-b border-slate-800 flex items-center space-x-3 bg-slate-950/60">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Digite um comando, atalho ou pesquise (ex: Handover, Dialer, Mesh)..."
            className="flex-1 bg-transparent border-none text-sm sm:text-base font-mono text-slate-100 placeholder-slate-500 focus:outline-none"
            autoFocus
          />
          <button
            onClick={closePalette}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-950/30 border-b border-slate-800/60 overflow-x-auto text-[11px] font-mono scrollbar-none">
          {['all', 'Comunicação', 'Dispositivo', 'Segurança', 'Navegação', 'Sistema', 'IDE'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/50'
              }`}
            >
              {cat === 'all' ? 'Todos' : cat}
            </button>
          ))}
        </div>

        {/* Feedback Message Banner */}
        {feedbackMsg && (
          <div className={`p-2.5 px-4 text-xs font-mono flex items-center space-x-2 border-b ${
            feedbackMsg.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            {feedbackMsg.type === 'success' ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span className="truncate">{feedbackMsg.text}</span>
          </div>
        )}

        {/* Command List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => handleRunCommand(cmd)}
                disabled={executingId === cmd.id}
                className="w-full text-left p-2.5 sm:p-3 rounded-xl bg-slate-950/40 hover:bg-slate-800/80 border border-slate-800/60 hover:border-indigo-500/50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center space-x-3 min-w-0 pr-2">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 group-hover:bg-indigo-600/20 group-hover:border-indigo-500/40 transition-colors">
                    {getCategoryIcon(cmd.category)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h5 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                        {cmd.name}
                      </h5>
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-[9px] font-mono text-slate-400">
                        {cmd.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5 font-sans">
                      {cmd.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {cmd.shortcut && (
                    <span className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-[10px] font-mono text-amber-300">
                      {cmd.shortcut}
                    </span>
                  )}
                  <div className="p-1.5 rounded-lg bg-slate-900 group-hover:bg-indigo-600 text-slate-400 group-hover:text-white transition-all">
                    <CornerDownLeft className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="py-12 text-center text-slate-500 font-mono text-xs">
              Nenhum comando encontrado para "{search}".
            </div>
          )}
        </div>

        {/* Footer info & shortcut hints */}
        <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <div className="flex items-center space-x-3">
            <span>Esc para fechar</span>
            <span>•</span>
            <span>Alt+H Handover</span>
            <span>•</span>
            <span>Alt+D Dialer</span>
          </div>
          <div className="flex items-center space-x-1 text-slate-400">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Escopo: <strong className="text-indigo-300 uppercase">{currentContext}</strong></span>
          </div>
        </div>

      </div>

    </div>
  );
};
