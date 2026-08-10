import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  PhoneCall,
  Bell,
  Grid,
  Zap,
  MoreHorizontal,
  Search,
  Star,
  Smartphone,
  CircleDot,
  Activity,
  Layers,
  Battery,
  Wifi,
  WifiOff,
  ChevronRight,
  Sparkles,
  Palette,
  Clock,
  Plus,
  Sliders,
  Users,
  ShieldCheck
} from 'lucide-react';

import { HomeWidget, WidgetType } from './HomeWidget';
import {
  HomePersonalizationWidget,
  HomeCustomizationConfig,
  DEFAULT_CLEAN_CONFIG
} from './HomePersonalizationWidget';

export type { HomeCustomizationConfig };

const DEFAULT_CONFIG: HomeCustomizationConfig = DEFAULT_CLEAN_CONFIG;

interface MobileHomeViewProps {
  onNavigateTab: (tabId: string) => void;
  unreadMessagesCount?: number;
  unreadNotifsCount?: number;
  activeDevicesCount?: number;
  primaryDeviceName?: string;
  batteryLevel?: number;
  isOnline?: boolean;
  daysRemaining?: number;
  onOpenMenu?: () => void;
}

export const MobileHomeView: React.FC<MobileHomeViewProps> = ({
  onNavigateTab,
  unreadMessagesCount = 0,
  unreadNotifsCount = 0,
  activeDevicesCount = 1,
  primaryDeviceName = 'Android Native',
  batteryLevel = 98,
  isOnline = true,
  daysRemaining,
  onOpenMenu
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isCustomizeOpen, setIsCustomizeOpen] = useState<boolean>(false);

  // Home Customization State with LocalStorage Persistence
  const [config, setConfig] = useState<HomeCustomizationConfig>(() => {
    try {
      const saved = localStorage.getItem('portal_home_customization_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        const visibleShortcuts = (parsed.visibleShortcuts && parsed.visibleShortcuts.length > 0)
          ? parsed.visibleShortcuts
          : DEFAULT_CONFIG.visibleShortcuts;
        const pinnedWidgets = (parsed.pinnedWidgets && parsed.pinnedWidgets.length > 0)
          ? parsed.pinnedWidgets
          : DEFAULT_CONFIG.pinnedWidgets;
        return { ...DEFAULT_CONFIG, ...parsed, visibleShortcuts, pinnedWidgets };
      }
    } catch (e) {
      console.warn('Erro ao carregar personalização da home:', e);
    }
    return DEFAULT_CONFIG;
  });

  useEffect(() => {
    try {
      localStorage.setItem('portal_home_customization_v1', JSON.stringify(config));
    } catch (e) {
      console.warn('Erro ao guardar personalização da home:', e);
    }
  }, [config]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
      );
      
      const dateStr = now.toLocaleDateString('pt-PT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
      setCurrentDate(dateStr.charAt(0).toUpperCase() + dateStr.slice(1));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleResetConfig = () => {
    setConfig(DEFAULT_CONFIG);
  };

  // Helper for Wallpaper Styling
  const getWallpaperBackground = () => {
    if (config.wallpaper === 'custom' && config.customWallpaperUrl.trim()) {
      return {
        backgroundImage: `url("${config.customWallpaperUrl.trim()}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    return {};
  };

  const getWallpaperGradientClass = () => {
    if (config.wallpaper === 'cyber_violet') {
      return 'from-purple-950/80 via-slate-950/80 to-slate-950';
    }
    if (config.wallpaper === 'emerald_cyber') {
      return 'from-emerald-950/80 via-slate-950/80 to-slate-950';
    }
    if (config.wallpaper === 'solar_amber') {
      return 'from-amber-950/80 via-slate-950/80 to-slate-950';
    }
    if (config.wallpaper === 'pure_clean') {
      return 'from-slate-900 via-slate-950 to-black';
    }
    return 'from-indigo-950/30 via-slate-950/70 to-slate-950';
  };

  // Icon Density & Sizes
  const getIconContainerPadding = () => {
    if (config.density === 'compact') return 'p-2.5 space-y-1';
    if (config.density === 'spacious') return 'p-5 space-y-3';
    return 'p-3.5 sm:p-4 space-y-2';
  };

  const getIconGraphicSize = () => {
    if (config.iconSize === 'small') return 'w-10 h-10';
    if (config.iconSize === 'large') return 'w-14 h-14';
    return 'w-12 h-12';
  };

  const getGridColsClass = () => {
    if (config.visibleShortcuts.length <= 2) return 'grid-cols-2';
    if (config.visibleShortcuts.length >= 5) return 'grid-cols-3';
    return 'grid-cols-2';
  };

  // Shortcut definitions map
  const SHORTCUT_DEFS: Record<string, { label: string; icon: React.FC<{ className?: string }>; colorClass: string; borderClass: string; badge?: number }> = {
    mensagens: {
      label: 'Mensagens',
      icon: MessageSquare,
      colorClass: 'from-cyan-500/20 to-blue-600/20 text-cyan-400 border-cyan-500/40',
      borderClass: 'hover:border-cyan-500/50',
      badge: unreadMessagesCount
    },
    chamadas: {
      label: 'Chamadas',
      icon: PhoneCall,
      colorClass: 'from-emerald-500/20 to-teal-600/20 text-emerald-400 border-emerald-500/40',
      borderClass: 'hover:border-emerald-500/50'
    },
    notificacoes: {
      label: 'Notificações',
      icon: Bell,
      colorClass: 'from-amber-500/20 to-orange-600/20 text-amber-400 border-amber-500/40',
      borderClass: 'hover:border-amber-500/50',
      badge: unreadNotifsCount
    },
    dispositivos: {
      label: 'Dispositivos',
      icon: Grid,
      colorClass: 'from-purple-500/20 to-indigo-600/20 text-purple-400 border-purple-500/40',
      borderClass: 'hover:border-purple-500/50',
      badge: activeDevicesCount
    },
    atividade: {
      label: 'Atividade',
      icon: Activity,
      colorClass: 'from-rose-500/20 to-pink-600/20 text-rose-400 border-rose-500/40',
      borderClass: 'hover:border-rose-500/50'
    },
    contactos: {
      label: 'Contactos',
      icon: Users,
      colorClass: 'from-blue-500/20 to-indigo-600/20 text-blue-400 border-blue-500/40',
      borderClass: 'hover:border-blue-500/50'
    },
    seguranca: {
      label: 'Segurança',
      icon: ShieldCheck,
      colorClass: 'from-emerald-500/20 to-teal-600/20 text-emerald-400 border-emerald-500/40',
      borderClass: 'hover:border-emerald-500/50'
    },
    arquitetura: {
      label: 'Arquitetura',
      icon: Layers,
      colorClass: 'from-amber-500/20 to-yellow-600/20 text-amber-400 border-amber-500/40',
      borderClass: 'hover:border-amber-500/50'
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-2 px-1 w-full max-w-md mx-auto font-sans select-none">
      
      {/* SMARTPHONE FRAME ENCLOSURE */}
      <div 
        className={`w-full bg-slate-950 border-4 border-slate-800/90 rounded-[2.5rem] shadow-2xl shadow-slate-950 overflow-hidden relative flex flex-col min-h-[580px] sm:min-h-[640px] border-t-slate-700/80 ${
          config.theme === 'midnight' ? 'border-indigo-900/60 shadow-indigo-950/40' : ''
        }`}
      >
        
        {/* CAMERA NOTCH / PUNCH HOLE */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-900 rounded-full border border-slate-800 z-30 flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-800 border border-slate-700"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60"></span>
        </div>

        {/* CUSTOMIZE TRIGGER BUTTON (TOP RIGHT) */}
        <button
          onClick={() => setIsCustomizeOpen(!isCustomizeOpen)}
          className="absolute top-2.5 right-3.5 z-40 p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-amber-400 transition-all cursor-pointer shadow hover:scale-105 active:scale-95"
          title="Personalizar Home (Wallpaper, Tema, Relógio, Ícones)"
        >
          <Palette className="w-3.5 h-3.5" />
        </button>

        {/* 1. TOPO DA TELA MOBILE: STATUS BAR */}
        {config.showStatusBar && (
          <div className="pt-3 px-6 pb-2 flex items-center justify-end text-xs font-mono font-bold text-slate-300 z-20 bg-gradient-to-b from-slate-950/90 to-transparent">
            <div className="flex items-center space-x-2 text-[10px] text-slate-400">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <div className="flex items-center space-x-0.5 text-amber-400">
                <Battery className="w-3.5 h-3.5" />
                <span>{batteryLevel}%</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
          </div>
        )}

        {/* 2. AREA CENTRAL DO SMARTPHONE: CLOCK & DATE + CENTRAL MENU TRIGGER */}
        <div className="flex-1 px-4 sm:px-5 py-6 flex flex-col justify-between relative z-10 space-y-6">
          
          {/* Custom or Preset Wallpaper background */}
          <div 
            className={`absolute inset-0 bg-gradient-to-b ${getWallpaperGradientClass()} pointer-events-none transition-all duration-500`}
            style={getWallpaperBackground()}
          ></div>

          {/* Wallpaper Overlay for Contrast */}
          <div className="absolute inset-0 bg-slate-950/40 pointer-events-none"></div>

          {/* CLOCK & DATE WIDGET */}
          {config.clockStyle !== 'hidden' && (
            <div className="text-center pt-6 pb-2 space-y-0.5 relative z-10">
              {config.clockStyle === 'large' && (
                <>
                  <div className="text-5xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-300 font-mono drop-shadow-md">
                    {currentTime || '23:48'}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-amber-400 tracking-wide font-sans">
                    {currentDate || 'Quinta-feira'}
                  </div>
                </>
              )}

              {config.clockStyle === 'compact' && (
                <div className="inline-flex items-center space-x-3 px-4 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xl font-mono font-black text-white">{currentTime || '23:48'}</span>
                  <span className="text-xs font-semibold text-amber-400">{currentDate}</span>
                </div>
              )}

              {config.clockStyle === 'minimal' && (
                <div className="text-2xl font-mono font-black text-white tracking-widest drop-shadow">
                  {currentTime || '23:48'}
                </div>
              )}
            </div>
          )}

          {/* PINNED SHORTCUTS GRID (Quando selecionados pelo utilizador) */}
          {config.visibleShortcuts && config.visibleShortcuts.length > 0 && (
            <div className={`grid ${getGridColsClass()} gap-2.5 relative z-10 max-w-xs mx-auto w-full`}>
              {config.visibleShortcuts.map((shortcutKey) => {
                const def = SHORTCUT_DEFS[shortcutKey];
                if (!def) return null;
                const IconComp = def.icon;
                const isPrimary = config.primaryShortcut === shortcutKey;

                return (
                  <button
                    key={shortcutKey}
                    onClick={() => onNavigateTab(shortcutKey)}
                    className={`rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 ${def.borderClass} ${getIconContainerPadding()} flex flex-col items-center justify-center transition-all cursor-pointer group active:scale-95 shadow-lg relative overflow-hidden ${
                      isPrimary ? 'ring-2 ring-amber-500/60 shadow-amber-500/10' : ''
                    }`}
                  >
                    <div className={`${getIconGraphicSize()} rounded-2xl bg-gradient-to-br ${def.colorClass} border flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner`}>
                      <IconComp className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate max-w-full mt-1">
                      {def.label}
                    </span>

                    {def.badge !== undefined && def.badge > 0 && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-mono font-black text-[10px] shadow">
                        {def.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* PINNED WIDGETS (Quando selecionados pelo utilizador) */}
          {config.pinnedWidgets && config.pinnedWidgets.length > 0 && (
            <div className="space-y-2.5 relative z-10 max-w-xs mx-auto w-full">
              {config.pinnedWidgets.map((wType) => (
                <HomeWidget
                  key={wType}
                  type={wType}
                  unreadMessagesCount={unreadMessagesCount}
                  batteryLevel={batteryLevel}
                  isOnline={isOnline}
                  onNavigateTab={onNavigateTab}
                  onRemoveWidget={(id) => {
                    setConfig(prev => ({
                      ...prev,
                      pinnedWidgets: prev.pinnedWidgets.filter(w => w !== id)
                    }));
                  }}
                />
              ))}
            </div>
          )}

          {/* HOME VAZIA POR PADRÃO - BOTÃO DISCRETO PARA PERSONALIZAR E FIXAR ELEMENTOS */}
          {(!config.visibleShortcuts || config.visibleShortcuts.length === 0) &&
           (!config.pinnedWidgets || config.pinnedWidgets.length === 0) && (
            <div className="flex justify-center relative z-10">
              <button
                onClick={() => setIsCustomizeOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 text-slate-400 hover:text-amber-400 text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer backdrop-blur-sm shadow group active:scale-95"
                title="Fixar atalhos ou widgets na tela central da Home"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-90 transition-transform" />
                <span>Fixar atalhos ou widgets</span>
              </button>
            </div>
          )}

          {/* CONTEXTUAL AUTOMATIC CARD (Apenas quando relevante) */}
          <div className="relative z-10 max-w-xs mx-auto w-full transition-all">
            {unreadMessagesCount > 0 ? (
              /* CASO 1: Nova mensagem */
              <button
                onClick={() => onNavigateTab('mensagens')}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/90 via-slate-900/90 to-slate-900 border border-cyan-500/40 text-left flex items-center justify-between transition-all cursor-pointer hover:border-cyan-400 active:scale-98 shadow-xl shadow-cyan-950/50 group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 relative shrink-0">
                    <MessageSquare className="w-4 h-4 animate-bounce" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                  </div>
                  <div>
                    <span className="block text-xs font-black text-cyan-300 uppercase tracking-wide">
                      Nova mensagem
                    </span>
                    <span className="block text-[11px] text-slate-300 font-medium mt-0.5">
                      {unreadMessagesCount} mensagem{unreadMessagesCount > 1 ? 's' : ''} não lida{unreadMessagesCount > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : !isOnline ? (
              /* CASO 2: Dispositivo offline */
              <button
                onClick={() => onNavigateTab('dispositivos')}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/90 via-slate-900/90 to-slate-900 border border-rose-500/40 text-left flex items-center justify-between transition-all cursor-pointer hover:border-rose-400 active:scale-98 shadow-xl shadow-rose-950/50 group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                    <WifiOff className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-rose-300 uppercase tracking-wide">
                      Dispositivo offline
                    </span>
                    <span className="block text-[11px] text-slate-300 font-medium mt-0.5">
                      Sem ligação ao servidor de rede
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : daysRemaining !== undefined && daysRemaining <= 7 ? (
              /* CASO 3: 7 dias restantes */
              <button
                onClick={() => onNavigateTab('conta')}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/90 via-slate-900/90 to-slate-900 border border-amber-500/40 text-left flex items-center justify-between transition-all cursor-pointer hover:border-amber-400 active:scale-98 shadow-xl shadow-amber-950/50 group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-amber-300 uppercase tracking-wide">
                      {daysRemaining === 7 ? '7 dias restantes' : `${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''} restante${daysRemaining !== 1 ? 's' : ''}`}
                    </span>
                    <span className="block text-[11px] text-slate-300 font-medium mt-0.5">
                      Licença / avaliação a terminar
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : null}
          </div>

          {/* APP DRAWER / MORE OPTIONS TRIGGER (⋯) */}
          <div className="flex justify-center pt-2 relative z-10">
            <button
              onClick={() => {
                if (onOpenMenu) {
                  onOpenMenu();
                } else {
                  onNavigateTab('atividade');
                }
              }}
              className="p-3 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-amber-400 hover:text-amber-300 transition-all cursor-pointer active:scale-90 shadow-lg group"
              title="Abrir Catálogo Completo / Menu do Sistema"
            >
              <MoreHorizontal className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
          </div>

        </div>

        {/* 3. DOCK INFERIOR MOBILE: DOCK = NAVEGAÇÃO UNIVERSAL (◉  ★  ⌕  📱) */}
        <div className="border-t border-slate-800/90 bg-slate-950/95 py-2.5 px-6 flex items-center justify-around z-20">
          
          {/* ① ◉ — Activity */}
          <button
            onClick={() => onNavigateTab('atividade')}
            className="p-1.5 rounded-xl text-amber-400 hover:text-amber-300 flex flex-col items-center gap-0.5 cursor-pointer transition-all active:scale-95"
            title="① ◉ — Atividade (Timeline, Eventos, Estado)"
          >
            <CircleDot className="w-5 h-5 fill-amber-400/20" />
            <span className="text-[9px] font-mono font-bold">Atividade</span>
          </button>

          {/* ② ★ — Favorites */}
          <button
            onClick={() => onNavigateTab('favoritos')}
            className="p-1.5 rounded-xl text-slate-400 hover:text-amber-400 flex flex-col items-center gap-0.5 cursor-pointer transition-all active:scale-95"
            title="② ★ — Favoritos (Contactos, Ações Rápidas)"
          >
            <Star className="w-5 h-5" />
            <span className="text-[9px] font-mono font-bold">Favoritos</span>
          </button>

          {/* ③ ⌕ — Search */}
          <button
            onClick={() => onNavigateTab('pesquisa')}
            className="p-1.5 rounded-xl text-slate-400 hover:text-cyan-400 flex flex-col items-center gap-0.5 cursor-pointer transition-all active:scale-95"
            title="③ ⌕ — Pesquisa Universal"
          >
            <Search className="w-5 h-5" />
            <span className="text-[9px] font-mono font-bold">Pesquisa</span>
          </button>

          {/* ④ 📱 — Devices */}
          <button
            onClick={() => onNavigateTab('dispositivos')}
            className="p-1.5 rounded-xl text-slate-400 hover:text-purple-400 flex flex-col items-center gap-0.5 cursor-pointer transition-all active:scale-95"
            title="④ 📱 — Dispositivos (Hardware, Mesh)"
          >
            <Smartphone className="w-5 h-5" />
            <span className="text-[9px] font-mono font-bold">Dispositivos</span>
          </button>

        </div>

        {/* PERSONALIZAÇÃO DRAWER / MODAL OVERLAY */}
        <HomePersonalizationWidget
          config={config}
          onUpdateConfig={setConfig}
          onClose={() => setIsCustomizeOpen(false)}
          isOpen={isCustomizeOpen}
        />

      </div>

    </div>
  );
};

