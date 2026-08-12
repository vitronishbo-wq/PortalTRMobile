import React from 'react';
import {
  Palette,
  X,
  RotateCcw,
  Check,
  Sparkles,
  MessageSquare,
  PhoneCall,
  Bell,
  Grid,
  Activity,
  Layers,
  Clock,
  LayoutGrid,
  Trash2,
  Plus,
  Sliders,
  Pin
} from 'lucide-react';
import { WidgetType } from './HomeWidget';

export interface HomeCustomizationConfig {
  wallpaper: 'default' | 'cyber_violet' | 'emerald_cyber' | 'solar_amber' | 'pure_clean' | 'custom';
  customWallpaperUrl: string;
  theme: 'dark' | 'midnight' | 'light';
  clockStyle: 'large' | 'compact' | 'minimal' | 'hidden';
  iconSize: 'small' | 'medium' | 'large';
  density: 'compact' | 'normal' | 'spacious';
  showDeviceBadge: boolean;
  showStatusBar: boolean;
  primaryShortcut: string;
  visibleShortcuts: string[];
  pinnedWidgets: WidgetType[];
}

export const DEFAULT_CLEAN_CONFIG: HomeCustomizationConfig = {
  wallpaper: 'default',
  customWallpaperUrl: '',
  theme: 'dark',
  clockStyle: 'large',
  iconSize: 'medium',
  density: 'normal',
  showDeviceBadge: true,
  showStatusBar: true,
  primaryShortcut: 'mensagens',
  visibleShortcuts: ['mensagens', 'chamadas', 'notificacoes', 'dispositivos', 'contactos', 'atividade'],
  pinnedWidgets: ['systemHealth', 'messageSummary']
};

export interface HomePersonalizationWidgetProps {
  config: HomeCustomizationConfig;
  onUpdateConfig: (newConfig: HomeCustomizationConfig) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export const SHORTCUT_CATALOG = [
  { id: 'mensagens', label: 'Mensagens', icon: MessageSquare, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  { id: 'chamadas', label: 'Chamadas', icon: PhoneCall, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { id: 'notificacoes', label: 'Notificações', icon: Bell, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { id: 'dispositivos', label: 'Dispositivos', icon: Grid, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  { id: 'atividade', label: 'Atividade', icon: Activity, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  { id: 'arquitetura', label: 'Arquitetura', icon: Layers, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' }
];

export const WIDGET_CATALOG = [
  { id: 'weather' as WidgetType, label: 'Clima & Tempo', desc: 'Previsão do tempo local em tempo real' },
  { id: 'messageSummary' as WidgetType, label: 'Resumo de Mensagens', desc: 'Atividade e contador de mensagens não lidas' },
  { id: 'systemHealth' as WidgetType, label: 'Status do Sistema', desc: 'Saúde do dispositivo e nível de bateria' },
  { id: 'quickNote' as WidgetType, label: 'Bloco de Notas', desc: 'Notas e lembretes pessoais persistentes' }
];

export const HomePersonalizationWidget: React.FC<HomePersonalizationWidgetProps> = ({
  config,
  onUpdateConfig,
  onClose,
  isOpen = true
}) => {
  if (!isOpen) return null;

  const toggleShortcut = (id: string) => {
    const current = config.visibleShortcuts || [];
    const isPinned = current.includes(id);
    const updatedShortcuts = isPinned
      ? current.filter(s => s !== id)
      : [...current, id];

    onUpdateConfig({
      ...config,
      visibleShortcuts: updatedShortcuts,
      primaryShortcut: isPinned && config.primaryShortcut === id ? (updatedShortcuts[0] || '') : (config.primaryShortcut || id)
    });
  };

  const toggleWidget = (id: WidgetType) => {
    const current = config.pinnedWidgets || [];
    const isPinned = current.includes(id);
    const updatedWidgets = isPinned
      ? current.filter(w => w !== id)
      : [...current, id];

    onUpdateConfig({
      ...config,
      pinnedWidgets: updatedWidgets
    });
  };

  const handleClearAll = () => {
    onUpdateConfig({
      ...config,
      visibleShortcuts: [],
      pinnedWidgets: [],
      primaryShortcut: ''
    });
  };

  const handleResetToClean = () => {
    onUpdateConfig(DEFAULT_CLEAN_CONFIG);
  };

  const hasPinnedItems = (config.visibleShortcuts?.length > 0) || (config.pinnedWidgets?.length > 0);

  return (
    <div className="absolute inset-0 bg-slate-950/95 z-50 p-4 overflow-y-auto flex flex-col space-y-4 animate-in fade-in duration-200 font-sans">
      
      {/* Modal Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
        <div className="flex items-center space-x-2">
          <Palette className="w-5 h-5 text-amber-400" />
          <h4 className="text-sm font-black text-white uppercase tracking-wide">Personalização da Home</h4>
        </div>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleClearAll}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 text-[10px] font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer"
            title="Limpar todos os elementos fixados (Home Vazia)"
          >
            <Trash2 className="w-3 h-3" />
            <span>Limpar Home</span>
          </button>
          <button
            onClick={handleResetToClean}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 text-[10px] font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer"
            title="Restaurar padrão limpo"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
              title="Fechar Personalização"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Info Status Banner */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-slate-300">
          <Pin className="w-4 h-4 text-amber-400" />
          <span>
            {hasPinnedItems ? (
              <strong className="text-amber-400">
                {(config.visibleShortcuts?.length || 0) + (config.pinnedWidgets?.length || 0)} elemento(s) fixado(s) na Home
              </strong>
            ) : (
              <span className="text-slate-400 italic">Home vazia por padrão (Espaço pessoal limpo)</span>
            )}
          </span>
        </div>
        {hasPinnedItems && (
          <button
            onClick={handleClearAll}
            className="text-[10px] font-mono font-bold text-rose-400 hover:text-rose-300 underline cursor-pointer"
          >
            Esvaziar
          </button>
        )}
      </div>

      {/* 1. SELEÇÃO DE ATALHOS PARA FIXAR NA HOME */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-mono font-black uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
            <Sliders className="w-3.5 h-3.5" />
            <span>Atalhos de Aplicações</span>
          </label>
          <span className="text-[10px] text-slate-500 font-mono">
            {config.visibleShortcuts?.length || 0} selecionado(s)
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {SHORTCUT_CATALOG.map((shortcut) => {
            const IconComp = shortcut.icon;
            const isPinned = config.visibleShortcuts?.includes(shortcut.id);

            return (
              <button
                key={shortcut.id}
                onClick={() => toggleShortcut(shortcut.id)}
                className={`p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-95 ${
                  isPinned
                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <div className={`p-1.5 rounded-xl border ${shortcut.color} shrink-0`}>
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold truncate">{shortcut.label}</span>
                </div>
                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                  isPinned ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-slate-700 bg-slate-800'
                }`}>
                  {isPinned ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3 text-slate-500" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SELEÇÃO DE WIDGETS PARA FIXAR NA HOME */}
      <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-mono font-black uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Widgets de Informação</span>
          </label>
          <span className="text-[10px] text-slate-500 font-mono">
            {config.pinnedWidgets?.length || 0} fixado(s)
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {WIDGET_CATALOG.map((widget) => {
            const isPinned = config.pinnedWidgets?.includes(widget.id);

            return (
              <button
                key={widget.id}
                onClick={() => toggleWidget(widget.id)}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-98 ${
                  isPinned
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-200 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-white">{widget.label}</span>
                    {isPinned && (
                      <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 text-[9px] font-mono font-bold border border-indigo-500/30">
                        Fixado
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">{widget.desc}</p>
                </div>

                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                  isPinned ? 'bg-indigo-500 border-indigo-400 text-white' : 'border-slate-700 bg-slate-800'
                }`}>
                  {isPinned ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3 text-slate-500" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. RELÓGIO & WALLPAPER */}
      <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
        <label className="text-[11px] font-mono font-black uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Relógio & Aparência</span>
        </label>
        
        <div className="grid grid-cols-4 gap-1.5">
          {(['large', 'compact', 'minimal', 'hidden'] as const).map((style) => (
            <button
              key={style}
              onClick={() => onUpdateConfig({ ...config, clockStyle: style })}
              className={`py-1.5 px-2 rounded-xl border text-center font-bold text-[10px] uppercase transition-all cursor-pointer ${
                config.clockStyle === style
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* BOTÃO CONCLUIR */}
      <div className="pt-3 shrink-0">
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
        >
          Aplicar à Home
        </button>
      </div>

    </div>
  );
};
