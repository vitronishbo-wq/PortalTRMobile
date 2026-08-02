import React, { useState } from 'react';
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
  Touchpad
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
  const [activePublicTab, setActivePublicTab] = useState<'timeline' | 'search' | 'favorites' | 'devices' | 'settings'>('timeline');

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

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleToggleFavorite = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isFavorite: !e.isFavorite } : e))
    );
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
        <div className="bg-slate-900/90 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4 w-full max-w-full overflow-hidden flex-wrap">
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

      {/* 3. Quick Status Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-full flex-wrap">
        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center space-x-3 w-full max-w-full flex-wrap min-w-0">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-slate-400 font-mono uppercase block truncate">Dispositivo</span>
            <span className="text-xs font-bold text-slate-200 block truncate">Android Emparelhado</span>
          </div>
        </div>

        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center space-x-3 w-full max-w-full flex-wrap min-w-0">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-slate-400 font-mono uppercase block truncate">Estado da Licença</span>
            <span className="text-xs font-bold text-emerald-300 block truncate">{evalState.label}</span>
          </div>
        </div>

        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center space-x-3 w-full max-w-full flex-wrap min-w-0">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-slate-400 font-mono uppercase block truncate">Eventos Registados</span>
            <span className="text-xs font-bold text-slate-200 block truncate">{events.length} Capturas</span>
          </div>
        </div>
      </div>

      {/* 4. Public Portal Sub-Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar text-xs font-bold w-full max-w-full flex-wrap gap-y-2">
        <button
          onClick={() => setActivePublicTab('timeline')}
          className={`px-3 sm:px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 sm:space-x-2 cursor-pointer shrink-0 ${
            activePublicTab === 'timeline'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Activity className="w-4 h-4 shrink-0" />
          <span className="truncate">Linha do Tempo</span>
        </button>

        <button
          onClick={() => setActivePublicTab('search')}
          className={`px-3 sm:px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 sm:space-x-2 cursor-pointer shrink-0 ${
            activePublicTab === 'search'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Search className="w-4 h-4 shrink-0" />
          <span className="truncate">Pesquisa</span>
        </button>

        <button
          onClick={() => setActivePublicTab('favorites')}
          className={`px-3 sm:px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 sm:space-x-2 cursor-pointer shrink-0 ${
            activePublicTab === 'favorites'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Star className="w-4 h-4 shrink-0" />
          <span className="truncate">Favoritos</span>
        </button>

        <button
          onClick={() => setActivePublicTab('devices')}
          className={`px-3 sm:px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 sm:space-x-2 cursor-pointer shrink-0 ${
            activePublicTab === 'devices'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Smartphone className="w-4 h-4 shrink-0" />
          <span className="truncate">Dispositivos</span>
        </button>

        <button
          onClick={() => setActivePublicTab('settings')}
          className={`px-3 sm:px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 sm:space-x-2 cursor-pointer shrink-0 ${
            activePublicTab === 'settings'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span className="truncate">Configurações</span>
        </button>
      </div>

      {/* 4. Tab Views Content */}
      <div className="bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        {activePublicTab === 'timeline' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                <span>Eventos do Dispositivo ({events.length})</span>
              </h3>
              <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-mono">
                <Touchpad className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>Deslize card: 👉 Favoritar | 👈 Excluir</span>
              </div>
            </div>

            {events.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-mono bg-slate-950/50 rounded-xl border border-dashed border-slate-800 space-y-2">
                <p>Nenhum evento registado na linha do tempo.</p>
                <button
                  onClick={() =>
                    setEvents([
                      {
                        id: `evt-${Date.now()}`,
                        type: 'sms',
                        title: 'SMS de Teste Recebido',
                        detail: 'Mensagem automatizada de teste do dispositivo.',
                        timestamp: 'Agora',
                        isFavorite: false,
                      },
                    ])
                  }
                  className="px-3 py-1.5 bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Restaurar Eventos
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <AnimatePresence mode="popLayout">
                  {events.map((evt) => (
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

        {activePublicTab === 'settings' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Segurança & Proteção por PIN</h3>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full max-w-full flex-wrap">
              <div className="min-w-0 flex-1">
                <span className="font-bold text-xs text-slate-200 block truncate">Proteger Acesso por PIN</span>
                <span className="text-xs text-slate-400 block truncate">Exigir código PIN de 4 dígitos ao abrir o PWA</span>
              </div>
              <button
                onClick={() => setPinEnabled(!pinEnabled)}
                className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all shrink-0 w-full sm:w-auto truncate ${
                  pinEnabled ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {pinEnabled ? 'PIN ATIVO' : 'PIN DESATIVADO'}
              </button>
            </div>
          </div>
        )}

        {['search', 'devices'].includes(activePublicTab) && (
          <div className="py-8 text-center text-xs text-slate-500 font-mono">
            Módulo {activePublicTab.toUpperCase()} ativo e pronto para utilização.
          </div>
        )}
      </div>
    </div>
  );
};
