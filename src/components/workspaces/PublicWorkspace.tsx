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
  ChevronUp
} from 'lucide-react';
import { TrialEngine, LicenseRecord } from '../../services/trialEngine';
import { useIdentity, IdentityEngine } from '../../engine/identityEngine';
import { SwipeableEventCard, DeviceEvent } from '../SwipeableEventCard';

const SUPER_ADMIN_EMAILS = [
  'silajaneiro9@gmail.com',
  'deusfundador@vitronis.co.ao'
];

interface PublicWorkspaceProps {
  onOpenFounderWorkspace?: () => void;
}

export const PublicWorkspace: React.FC<PublicWorkspaceProps> = ({ onOpenFounderWorkspace }) => {
  const { user: authUser, profile: userProfile, loginWithGoogle, logout } = useIdentity();

  const isFounder = Boolean(
    (authUser?.email && SUPER_ADMIN_EMAILS.includes(authUser.email.toLowerCase())) ||
    userProfile?.role === 'founder' ||
    userProfile?.authority === 'ROOT'
  );

  const [guestDismissed, setGuestDismissed] = useState<boolean>(false);
  const [pinEnabled, setPinEnabled] = useState<boolean>(false);
  const [activePublicTab, setActivePublicTab] = useState<'timeline' | 'search' | 'favorites' | 'devices' | null>('timeline');

  // Event Category Filter Modal State
  const [filterModalOpen, setFilterModalOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'sms' | 'call' | 'whatsapp' | 'system'>('all');

  // Sync tab switching via global events for bottom footer navigation
  useEffect(() => {
    const handleSwitchTab = (e: CustomEvent<string>) => {
      const tab = e.detail as 'timeline' | 'search' | 'favorites' | 'devices';
      setActivePublicTab((prev) => (prev === tab ? null : tab));
    };
    window.addEventListener('switch-public-tab' as any, handleSwitchTab);
    return () => window.removeEventListener('switch-public-tab' as any, handleSwitchTab);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('public-tab-changed', { detail: activePublicTab }));
  }, [activePublicTab]);

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
  const isGuest = !authUser;

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
      {/* 1. Minimalist Guest Buttons (no heavy banner text) */}
      {isGuest && !guestDismissed && (
        <div className="flex items-center justify-end space-x-2 w-full max-w-full">
          <button
            onClick={handleGoogleAuth}
            className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer text-center truncate"
          >
            Conectar Google
          </button>
          <button
            onClick={() => setGuestDismissed(true)}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-medium cursor-pointer text-center truncate"
          >
            Ignorar
          </button>
        </div>
      )}

      {/* 2. Top Header Card (only shown when authenticated) */}
      {!isGuest && (
        <div className="bg-slate-900/80 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-slate-800/80 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4 w-full max-w-full overflow-hidden flex-wrap">
          <div className="flex items-center space-x-3.5 sm:space-x-4 min-w-0 flex-1 w-full sm:w-auto">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-amber-500 flex items-center justify-center text-white font-black text-base sm:text-lg shadow-md shrink-0">
              {displayName ? displayName[0].toUpperCase() : 'U'}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 min-w-0 flex-wrap">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-100 truncate max-w-full">{displayName}</h1>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono shrink-0 ${
                    evalState.active
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shadow-sm shadow-emerald-500/20'
                      : 'bg-rose-500/25 text-rose-300 border border-rose-400/50'
                  }`}
                >
                  {evalState.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-full">{displayEmail}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-start sm:justify-end">
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer flex items-center space-x-1.5 shrink-0"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Sair</span>
            </button>

            {isFounder && onOpenFounderWorkspace && (
              <button
                onClick={onOpenFounderWorkspace}
                className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 shrink-0"
              >
                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Acesso Founder</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Quick Status Summary Card */}
      <div className="w-full max-w-full">
        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center space-x-3 w-full max-w-full flex-wrap min-w-0">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-slate-400 font-mono uppercase block truncate">Estado da Licença</span>
            <span className="text-xs font-bold text-emerald-300 block truncate">{evalState.label}</span>
          </div>
        </div>
      </div>

      {/* 5. Tab Views Content (Only rendered when activePublicTab is non-null) */}
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
                    {/* Modal Filter Trigger Button */}
                    <button
                      onClick={() => setFilterModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all shadow-sm"
                    >
                      <Filter className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Filtrar Visualização</span>
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

                {/* Gesture hint & clear filter option */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono px-1">
                  <div className="flex items-center space-x-1">
                    <Touchpad className="w-3 h-3 text-amber-400 animate-pulse" />
                    <span>Deslize card: 👉 Favoritar | 👈 Excluir</span>
                  </div>
                  {selectedCategory !== 'all' && (
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="text-indigo-400 hover:underline cursor-pointer"
                    >
                      Limpar Filtro
                    </button>
                  )}
                </div>

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
