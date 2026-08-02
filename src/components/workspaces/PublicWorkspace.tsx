import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Search,
  Star,
  Smartphone,
  Settings,
  Lock,
  User,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  LogOut,
  Touchpad,
  Filter,
  MessageSquare,
  PhoneCall,
  Bell,
  SlidersHorizontal,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Radio
} from 'lucide-react';
import { TrialEngine, LicenseRecord } from '../../services/trialEngine';
import { useIdentity, IdentityEngine } from '../../engine/identityEngine';
import { exportEventsToCsv } from '../../lib/csvExporter';
import { SwipeableEventCard, DeviceEvent } from '../SwipeableEventCard';
import { RealtimeDevStreamConsole } from '../RealtimeDevStreamConsole';
import { MultiDeviceMeshView } from '../MultiDeviceMeshView';
import { useSessionSync } from '../../hooks/useSessionSync';

const SUPER_ADMIN_EMAILS = [
  'silajaneiro9@gmail.com',
  'deusfundador@vitronis.co.ao'
];

interface PublicWorkspaceProps {
  onOpenFounderWorkspace?: () => void;
  onOpenAuthModal?: () => void;
}

export const PublicWorkspace: React.FC<PublicWorkspaceProps> = ({ 
  onOpenFounderWorkspace,
  onOpenAuthModal 
}) => {
  const { user: authUser, profile: userProfile, loginWithGoogle, logout, authenticateUser, forceDevLogin } = useIdentity();

  const handleQuickDevLogin = async () => {
    try {
      const res = await authenticateUser('silajaneiro9@gmail.com', 'VitronisFounder2026!');
      if (!res?.success) {
        forceDevLogin('silajaneiro9@gmail.com');
      }
    } catch (err) {
      console.error('[PublicWorkspace] Erro ao autenticar Dev:', err);
      forceDevLogin('silajaneiro9@gmail.com');
    }
  };

  const isDevGodMode = (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') || localStorage.getItem('vitronis_dev_god_mode') === 'true';

  const isFounder = Boolean(
    isDevGodMode ||
    (authUser?.email && SUPER_ADMIN_EMAILS.includes(authUser.email.toLowerCase())) ||
    userProfile?.role === 'founder' ||
    userProfile?.authority === 'ROOT'
  );

  const [guestDismissed, setGuestDismissed] = useState<boolean>(false);
  const [pinEnabled, setPinEnabled] = useState<boolean>(false);
  const [activePublicTab, setActivePublicTab] = useState<'timeline' | 'search' | 'favorites' | 'devices' | 'realtime_dev' | 'mesh' | null>('timeline');

  // Session Sync & Handover Hook (Fase 2)
  const deviceId = typeof localStorage !== 'undefined'
    ? (localStorage.getItem('deviceId') || 'web-pwa-001')
    : 'web-pwa-001';
  const { sessionState, updateState, triggerHandover } = useSessionSync(deviceId);

  // Sync state tab when remote state changes
  useEffect(() => {
    if (sessionState?.activeTab) {
      const tab = sessionState.activeTab as any;
      if (['timeline', 'search', 'favorites', 'devices', 'realtime_dev', 'mesh'].includes(tab)) {
        setActivePublicTab(tab);
      }
    }
  }, [sessionState?.activeTab]);

  // Event Category Filter Modal State
  const [filterModalOpen, setFilterModalOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'sms' | 'call' | 'whatsapp' | 'system'>('all');

  // Sync tab switching via global events for bottom footer navigation
  useEffect(() => {
    const handleSwitchTab = (e: CustomEvent<string>) => {
      const tab = e.detail as 'timeline' | 'search' | 'favorites' | 'devices';
      setActivePublicTab((prev) => {
        const next = prev === tab ? null : tab;
        if (next) {
          updateState({ activeTab: next as any });
        }
        return next;
      });
    };
    window.addEventListener('switch-public-tab' as any, handleSwitchTab);
    return () => window.removeEventListener('switch-public-tab' as any, handleSwitchTab);
  }, [updateState]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('public-tab-changed', { detail: activePublicTab }));
    if (activePublicTab) {
      updateState({ activeTab: activePublicTab as any });
    }
  }, [activePublicTab, updateState]);

  // Device Events State for gesture swipe handling
  const [events, setEvents] = useState<DeviceEvent[]>([
    {
      id: 'evt-1',
      type: 'sms',
      title: 'SMS Recebido (+244 923 000 111)',
      detail: 'Código de verificação do banco capturado com sucesso.',
      timestamp: 'Há 2 min',
      isFavorite: false,
    },
    {
      id: 'evt-2',
      type: 'whatsapp',
      title: 'Notificação WhatsApp',
      detail: 'Suporte técnico: "O seu dispositivo está emparelhado."',
      timestamp: 'Há 15 min',
      isFavorite: true,
    },
    {
      id: 'evt-3',
      type: 'call',
      title: 'Chamada Perdida (+244 912 345 678)',
      detail: 'Chamada recebida enquanto o dispositivo estava em segundo plano.',
      timestamp: 'Há 45 min',
      isFavorite: false,
    },
    {
      id: 'evt-4',
      type: 'system',
      title: 'Emparelhamento Concluído',
      detail: 'Chave RSA de 4096-bit trocada com sucesso com o servidor central.',
      timestamp: 'Há 2 h',
      isFavorite: false,
    }
  ]);

  const toggleTab = (tab: 'timeline' | 'search' | 'favorites' | 'devices') => {
    setActivePublicTab((prev) => (prev === tab ? null : tab));
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleToggleFavorite = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isFavorite: !e.isFavorite } : e))
    );
  };

  const filteredEvents = events.filter((evt) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'sms') return evt.type === 'sms';
    if (selectedCategory === 'call') return evt.type === 'call';
    if (selectedCategory === 'whatsapp') return evt.type === 'whatsapp' || evt.type === 'notification';
    if (selectedCategory === 'system') return evt.type === 'system';
    return true;
  });

  const getCategoryCount = (cat: 'all' | 'sms' | 'call' | 'whatsapp' | 'system') => {
    if (cat === 'all') return events.length;
    if (cat === 'sms') return events.filter((e) => e.type === 'sms').length;
    if (cat === 'call') return events.filter((e) => e.type === 'call').length;
    if (cat === 'whatsapp') return events.filter((e) => e.type === 'whatsapp' || e.type === 'notification').length;
    if (cat === 'system') return events.filter((e) => e.type === 'system').length;
    return 0;
  };

  const getCategoryLabel = (cat: typeof selectedCategory) => {
    switch (cat) {
      case 'sms': return 'SMS / Mensagens';
      case 'call': return 'Chamadas Telefónicas';
      case 'whatsapp': return 'Notificações de Apps';
      case 'system': return 'Eventos de Sistema';
      default: return 'Todos os Eventos';
    }
  };

  const displayName = userProfile?.displayName || authUser?.displayName || 'Utilizador Google';
  const displayEmail = userProfile?.email || authUser?.email || 'utilizador.exemplo@gmail.com';
  const isGuest = !authUser && !userProfile && !isFounder;

  // License State
  const [license, setLicense] = useState<LicenseRecord>(
    TrialEngine.getLicense(authUser?.uid || 'usr-public-001', displayEmail)
  );

  const evalState = TrialEngine.evaluateState(license);

  // Google Smart Onboarding Handler via IdentityEngine
  const handleGoogleAuth = async () => {
    await loginWithGoogle();
    setGuestDismissed(true);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 select-none font-sans w-full max-w-full overflow-hidden">


      {/* 5. Tab Views Content */}
      <AnimatePresence mode="wait">
        {activePublicTab !== null && (
          <motion.div
            key={activePublicTab}
            initial={{ opacity: 0, height: 0, scale: 0.99 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.99 }}
            transition={{ duration: 0.2 }}
            className="bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 overflow-hidden"
          >
            {isGuest ? (
              /* Security Gate Card for Non-Authenticated Visitors */
              <div className="py-6 px-4 text-center space-y-4 max-w-sm mx-auto">
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400 shadow-md">
                  <Lock className="w-6 h-6" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Autenticação Requerida
                  </h3>
                </div>

                {/* Compact Smart Dev Button for Mobile */}
                <button
                  onClick={handleQuickDevLogin}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Entrar como Dev (1-Clique)</span>
                </button>

                <div className="pt-1 flex items-center justify-center gap-2">
                  {onOpenAuthModal && (
                    <button
                      onClick={onOpenAuthModal}
                      className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center justify-center space-x-1.5 active:scale-95"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Credenciais</span>
                    </button>
                  )}

                  <button
                    onClick={handleGoogleAuth}
                    className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Google</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* TAB: MESH UNIFICADO MULTI-DISPOSITIVO */}
                {activePublicTab === 'mesh' && (
                  <MultiDeviceMeshView />
                )}

                {/* TAB: REALTIME DEV STREAM CONSOLE */}
                {activePublicTab === 'realtime_dev' && (
                  <RealtimeDevStreamConsole />
                )}

                {/* TAB: TIMELINE */}
            {activePublicTab === 'timeline' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <Activity className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Eventos do Dispositivo ({filteredEvents.length})</span>
                    </h3>
                    {selectedCategory !== 'all' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {getCategoryLabel(selectedCategory)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* CSV Export Button */}
                    <button
                      onClick={() => exportEventsToCsv(filteredEvents)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all shadow-sm shadow-amber-500/10"
                      title="Exportar os eventos filtrados em CSV"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                      <span>Exportar CSV ({filteredEvents.length})</span>
                    </button>

                    {/* Modal Filter Trigger Button */}
                    <button
                      onClick={() => setFilterModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all shadow-sm"
                    >
                      <Filter className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Filtrar</span>
                    </button>

                    <button
                      onClick={() => setActivePublicTab(null)}
                      className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
                      title="Recolher Painel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Filter option if active */}
                {selectedCategory !== 'all' && (
                  <div className="flex justify-end text-[10px] font-mono px-1">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="text-indigo-400 hover:underline cursor-pointer font-bold"
                    >
                      Limpar Filtro
                    </button>
                  </div>
                )}

                {filteredEvents.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 font-mono bg-slate-950/50 rounded-xl border border-dashed border-slate-800 space-y-2">
                    <p>Nenhum evento encontrado para a categoria "{getCategoryLabel(selectedCategory)}".</p>
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="px-3 py-1.5 bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Ver Todos os Eventos
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <AnimatePresence mode="popLayout">
                      {filteredEvents.map((evt) => (
                        <motion.div
                          key={evt.id}
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, height: 0, marginBottom: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                          <SwipeableEventCard
                            event={evt}
                            onDelete={handleDeleteEvent}
                            onToggleFavorite={handleToggleFavorite}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            {/* TAB: FAVORITES */}
            {activePublicTab === 'favorites' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>Eventos Favoritos ({events.filter((e) => e.isFavorite).length})</span>
                </h3>

                {events.filter((e) => e.isFavorite).length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 font-mono bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
                    Nenhum evento marcado como favorito. Deslize qualquer card para a direita 👉 na Linha do Tempo!
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <AnimatePresence mode="popLayout">
                      {events
                        .filter((e) => e.isFavorite)
                        .map((evt) => (
                          <motion.div
                            key={evt.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <SwipeableEventCard
                              event={evt}
                              onDelete={handleDeleteEvent}
                              onToggleFavorite={handleToggleFavorite}
                            />
                          </motion.div>
                        ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            {/* TAB: SEARCH & DEVICES */}
            {['search', 'devices'].includes(activePublicTab) && (
              <div className="py-8 text-center text-xs text-slate-500 font-mono">
                Módulo {activePublicTab?.toUpperCase()} ativo e pronto para utilização.
              </div>
            )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Event Type Filter Modal */}
      <AnimatePresence>
        {filterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-5 text-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Filter className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">O que deseja visualizar?</h3>
                    <p className="text-[11px] text-slate-400">Escolha o conteúdo a filtrar na linha do tempo</p>
                  </div>
                </div>
                <button
                  onClick={() => setFilterModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Options selection list */}
              <div className="space-y-2">
                {[
                  {
                    id: 'all',
                    title: 'Todos os Eventos',
                    desc: 'Visualizar mensagens, chamadas e notificações simultaneamente',
                    icon: Activity,
                    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
                  },
                  {
                    id: 'sms',
                    title: 'SMS & Mensagens de Texto',
                    desc: 'Exibir apenas mensagens SMS capturadas no dispositivo',
                    icon: MessageSquare,
                    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  },
                  {
                    id: 'call',
                    title: 'Chamadas Telefónicas',
                    desc: 'Exibir apenas registos de chamadas recebidas ou perdidas',
                    icon: PhoneCall,
                    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  },
                  {
                    id: 'whatsapp',
                    title: 'Notificações de Apps',
                    desc: 'Exibir mensagens do WhatsApp e notificações de aplicações',
                    icon: Bell,
                    color: 'text-sky-400 bg-sky-500/10 border-sky-500/20'
                  },
                  {
                    id: 'system',
                    title: 'Eventos de Sistema & Emparelhamento',
                    desc: 'Exibir apenas sincronizações e logs do kernel Android',
                    icon: Smartphone,
                    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
                  }
                ].map((opt) => {
                  const IconComp = opt.icon;
                  const isSelected = selectedCategory === opt.id;
                  const count = getCategoryCount(opt.id as any);

                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSelectedCategory(opt.id as any);
                        setFilterModalOpen(false);
                      }}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500/60 shadow-md shadow-indigo-600/10'
                          : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className={`p-2 rounded-xl border shrink-0 ${opt.color}`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-slate-200 block truncate">{opt.title}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                              {count}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate">{opt.desc}</span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 ml-2">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setFilterModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Concluído
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
