import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Clipboard, 
  Check, 
  Trash2, 
  Terminal, 
  Phone, 
  Key, 
  Globe, 
  Share2, 
  RefreshCw, 
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles
} from 'lucide-react';
import { ClipboardEngine, ClipboardItem } from '../engine/clipboardEngine';
import { InteractionEngine } from '../engine/interactionEngine';

interface ClipboardWidgetProps {
  compact?: boolean;
  className?: string;
  onSelectCommand?: (cmd: string) => void;
}

export const ClipboardWidget: React.FC<ClipboardWidgetProps> = ({
  compact = false,
  className = '',
  onSelectCommand
}) => {
  const [activeItem, setActiveItem] = useState<ClipboardItem | null>(ClipboardEngine.getActiveItem());
  const [history, setHistory] = useState<ClipboardItem[]>(ClipboardEngine.getHistory());
  const [isExpanded, setIsExpanded] = useState<boolean>(!compact);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inputText, setInputText] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'command' | 'phone' | 'otp' | 'link' | 'text'>('all');

  useEffect(() => {
    const unsubscribe = ClipboardEngine.subscribe(() => {
      setActiveItem(ClipboardEngine.getActiveItem());
      setHistory(ClipboardEngine.getHistory());
    });
    return () => unsubscribe();
  }, []);

  const handleCopyNewText = async () => {
    if (!inputText.trim()) return;
    await ClipboardEngine.copyText(inputText.trim(), 'User Input');
    setInputText('');
  };

  const handleCopyItem = async (item: ClipboardItem) => {
    await ClipboardEngine.copyText(item.text, item.sourceDevice);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1500);

    if (item.category === 'command' && onSelectCommand) {
      onSelectCommand(item.text);
    }
  };

  const handlePasteFromNative = async () => {
    const text = await ClipboardEngine.readText();
    if (text) {
      setCopiedId('native-pasted');
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const filteredHistory = history.filter((item) => {
    if (activeFilter === 'all') return true;
    return item.category === activeFilter;
  });

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'command':
        return <Terminal className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'phone':
        return <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'otp':
        return <Key className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'link':
        return <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      default:
        return <Clipboard className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
    }
  };

  return (
    <div className={`bg-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-hidden font-sans text-slate-100 transition-all ${className}`}>
      
      {/* Widget Header */}
      <div className="bg-slate-900/90 px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Clipboard className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-100 flex items-center space-x-1.5 tracking-tight">
              <span>Clipboard Engine Global</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono font-bold uppercase">
                Session Mesh Sync
              </span>
            </h4>
            <p className="text-[10px] text-slate-400 font-mono">
              Área de transferência sincronizada entre Public Portal e Founder IDE
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handlePasteFromNative}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold font-mono border border-slate-700 transition-all cursor-pointer flex items-center space-x-1"
            title="Colar da Área de Transferência Nativa"
          >
            <Copy className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">Colar do Sistema</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          
          {/* Add New Clipboard Entry */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCopyNewText();
              }}
              placeholder="Digite comando, número, token ou texto para sincronizar..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              onClick={handleCopyNewText}
              disabled={!inputText.trim()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-1 shrink-0"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Sincronizar</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none text-[10px] font-mono">
            {[
              { id: 'all', label: `Todos (${history.length})` },
              { id: 'command', label: `Comandos (${history.filter(i => i.category === 'command').length})` },
              { id: 'phone', label: `Telefones (${history.filter(i => i.category === 'phone').length})` },
              { id: 'otp', label: `OTPs/PIN (${history.filter(i => i.category === 'otp').length})` },
              { id: 'link', label: `Links (${history.filter(i => i.category === 'link').length})` },
              { id: 'text', label: `Texto (${history.filter(i => i.category === 'text').length})` }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as any)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap font-bold ${
                  activeFilter === filter.id
                    ? 'bg-indigo-600 text-white shadow font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Active Item Highlight */}
          {activeItem && (
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-2.5 rounded-xl border border-indigo-500/30 shadow-md space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-indigo-400 font-bold uppercase tracking-wider flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                  <span>Item Ativo no Mesh:</span>
                </span>
                <span className="text-slate-400">Origem: {activeItem.sourceDevice}</span>
              </div>
              <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                <div className="flex items-center space-x-2 min-w-0 font-mono text-xs text-emerald-300 font-bold">
                  {getCategoryIcon(activeItem.category)}
                  <span className="truncate">{activeItem.text}</span>
                </div>
                <button
                  onClick={() => handleCopyItem(activeItem)}
                  className="p-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 transition-colors cursor-pointer shrink-0 ml-2"
                  title="Copiar Item Ativo"
                >
                  {copiedId === activeItem.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Clipboard History List */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
            {filteredHistory.length > 0 ? (
              filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-2 bg-slate-900/80 hover:bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center space-x-2 min-w-0 pr-2">
                    <div className="p-1 rounded bg-slate-950 border border-slate-800">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="min-w-0">
                      <span className="font-mono text-xs font-semibold text-slate-200 block truncate group-hover:text-indigo-300 transition-colors">
                        {item.text}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono block">
                        {new Date(item.timestamp).toLocaleTimeString('pt-BR')} • {item.sourceDevice}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyItem(item)}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer shrink-0"
                    title="Copiar Item"
                  >
                    {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-slate-500 font-mono text-xs">
                Nenhum item na área de transferência para a categoria selecionada.
              </div>
            )}
          </div>

          {/* Footer Action */}
          {history.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>{history.length} itens no histórico unificado</span>
              <button
                onClick={() => ClipboardEngine.clearHistory()}
                className="text-rose-400 hover:text-rose-300 font-bold flex items-center space-x-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Limpar Histórico</span>
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
