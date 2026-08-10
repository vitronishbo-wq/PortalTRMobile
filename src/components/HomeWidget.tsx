import React, { useState, useEffect } from 'react';
import {
  CloudSun,
  MessageSquare,
  Zap,
  Battery,
  Wifi,
  Plus,
  X,
  Check,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Send,
  StickyNote,
  Sun,
  CloudRain,
  Wind
} from 'lucide-react';

export type WidgetType = 'weather' | 'messageSummary' | 'systemHealth' | 'quickNote' | 'quickActions';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  enabled: boolean;
  order: number;
}

export interface HomeWidgetProps {
  type: WidgetType;
  unreadMessagesCount?: number;
  latestMessageText?: string;
  latestMessageSender?: string;
  batteryLevel?: number;
  isOnline?: boolean;
  onNavigateTab?: (tabId: string) => void;
  onRemoveWidget?: (id: string) => void;
}

const DEFAULT_NOTE_KEY = 'portal_home_widget_quick_note';

export const HomeWidget: React.FC<HomeWidgetProps> = ({
  type,
  unreadMessagesCount = 0,
  latestMessageText = 'Sem mensagens recentes.',
  latestMessageSender = 'Sistema',
  batteryLevel = 98,
  isOnline = true,
  onNavigateTab,
  onRemoveWidget
}) => {
  // Quick Note State
  const [noteText, setNoteText] = useState<string>(() => {
    try {
      return localStorage.getItem(DEFAULT_NOTE_KEY) || 'Lembrete: Sincronizar dispositivo Android nativo antes do final do dia.';
    } catch {
      return 'Lembrete: Sincronizar dispositivo Android nativo.';
    }
  });

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNoteText(val);
    try {
      localStorage.setItem(DEFAULT_NOTE_KEY, val);
    } catch (err) {
      console.warn('Erro ao guardar nota:', err);
    }
  };

  // Weather Widget
  if (type === 'weather') {
    return (
      <div className="bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 p-3.5 rounded-2xl border border-indigo-500/30 shadow-lg text-slate-100 text-xs space-y-2 relative group backdrop-blur-sm">
        <div className="flex items-center justify-between text-[11px] border-b border-indigo-500/20 pb-1.5 font-mono">
          <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
            <CloudSun className="w-4 h-4 text-amber-400" />
            <span>CLIMA AGORA</span>
          </div>
          <span className="text-slate-400 text-[10px]">Lisboa, PT</span>
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <div>
            <div className="text-2xl font-black font-mono text-white tracking-tight">22°C</div>
            <div className="text-[10px] text-indigo-300 font-semibold">Parcialmente Ensolarado</div>
          </div>
          <div className="text-right text-[10px] space-y-0.5 font-mono text-slate-400">
            <div className="flex items-center space-x-1 justify-end">
              <Wind className="w-3 h-3 text-cyan-400" />
              <span>12 km/h</span>
            </div>
            <div className="flex items-center space-x-1 justify-end">
              <CloudRain className="w-3 h-3 text-indigo-400" />
              <span>Hum: 58%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Message Summary Widget
  if (type === 'messageSummary') {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/60 p-3.5 rounded-2xl border border-cyan-500/30 shadow-lg text-slate-100 text-xs space-y-2 relative group backdrop-blur-sm">
        <div className="flex items-center justify-between text-[11px] border-b border-cyan-500/20 pb-1.5 font-mono">
          <div className="flex items-center space-x-1.5 text-cyan-400 font-bold">
            <MessageSquare className="w-4 h-4" />
            <span>RESUMO DE MENSAGENS</span>
          </div>
          {unreadMessagesCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[9px] font-black font-mono">
              {unreadMessagesCount} novas
            </span>
          ) : (
            <span className="text-slate-400 text-[10px]">Atualizado</span>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="font-bold text-cyan-300 truncate max-w-[150px]">{latestMessageSender}</span>
            <span>Hoje</span>
          </div>
          <p className="text-[11px] text-slate-200 line-clamp-2 leading-relaxed bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 italic">
            "{latestMessageText}"
          </p>
        </div>

        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('mensagens')}
            className="w-full py-2 px-3 rounded-xl bg-cyan-900/40 hover:bg-cyan-800/60 border border-cyan-500/50 text-cyan-200 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-md active:scale-98"
          >
            <span>Abrir Caixa de Entrada</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        )}
      </div>
    );
  }

  // System Health Widget
  if (type === 'systemHealth') {
    return (
      <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 shadow-lg text-slate-100 text-xs space-y-2 backdrop-blur-sm">
        <div className="flex items-center justify-between text-[11px] border-b border-slate-800 pb-1.5 font-mono">
          <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
            <Zap className="w-4 h-4" />
            <span>SISTEMA & HARDWARE</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono border ${
            isOnline ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
          }`}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
            <div className="text-slate-400 font-mono mb-0.5">Bateria</div>
            <div className="font-extrabold text-amber-400 flex items-center justify-center space-x-1">
              <Battery className="w-3.5 h-3.5" />
              <span>{batteryLevel}%</span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
            <div className="text-slate-400 font-mono mb-0.5">Sincronia</div>
            <div className="font-extrabold text-emerald-400 flex items-center justify-center space-x-1">
              <Wifi className="w-3.5 h-3.5" />
              <span>12ms</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quick Note / Scratchpad Widget
  if (type === 'quickNote') {
    return (
      <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 p-3.5 rounded-2xl border border-amber-500/30 shadow-lg text-slate-100 text-xs space-y-2 backdrop-blur-sm">
        <div className="flex items-center justify-between text-[11px] border-b border-amber-500/20 pb-1.5 font-mono">
          <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
            <StickyNote className="w-4 h-4" />
            <span>BLOCO DE NOTAS RÁPIDO</span>
          </div>
          <span className="text-[9px] text-amber-500/80 font-mono">Auto-Save</span>
        </div>

        <textarea
          value={noteText}
          onChange={handleNoteChange}
          placeholder="Escreva uma nota ou lembrete rápido..."
          className="w-full bg-slate-950/80 border border-amber-500/20 rounded-xl p-2 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 resize-none h-16 font-sans leading-relaxed"
        />
      </div>
    );
  }

  return null;
};
