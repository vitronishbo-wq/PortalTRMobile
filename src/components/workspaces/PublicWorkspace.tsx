import React, { useState } from 'react';
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
  LogOut
} from 'lucide-react';
import { TrialEngine, LicenseRecord } from '../../services/trialEngine';
import { useIdentity, IdentityEngine } from '../../engine/identityEngine';

interface PublicWorkspaceProps {
  onOpenFounderWorkspace?: () => void;
}

export const PublicWorkspace: React.FC<PublicWorkspaceProps> = ({ onOpenFounderWorkspace }) => {
  const { user: authUser, profile: userProfile, loginWithGoogle, logout } = useIdentity();

  const [guestDismissed, setGuestDismissed] = useState<boolean>(false);
  const [pinEnabled, setPinEnabled] = useState<boolean>(false);
  const [activePublicTab, setActivePublicTab] = useState<'timeline' | 'search' | 'favorites' | 'devices' | 'settings'>('timeline');

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
    <div className="max-w-4xl mx-auto space-y-6 select-none font-sans">
      {/* 1. Discrete Guest Reminder Banner (If in guest mode) */}
      {isGuest && !guestDismissed && (
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 p-4 rounded-2xl border border-indigo-500/30 shadow-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h4 className="text-xs font-bold text-slate-100">Modo Convidado Ativo</h4>
              <p className="text-[11px] text-slate-400">
                Ligue a sua conta Google para sincronizar o Portal com o seu dispositivo Android.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleGoogleAuth}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              Conectar Google
            </button>
            <button
              onClick={() => setGuestDismissed(true)}
              className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
            >
              Ignorar
            </button>
          </div>
        </div>
      )}

      {/* 2. Top Header Card */}
      <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-md">
            {displayName ? displayName[0].toUpperCase() : 'U'}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-extrabold text-slate-100">{displayName}</h1>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                  evalState.active
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {evalState.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{displayEmail}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          {isGuest ? (
            <button
              onClick={handleGoogleAuth}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center space-x-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Entrar com Google</span>
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer flex items-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          )}

          {onOpenFounderWorkspace && (
            <button
              onClick={onOpenFounderWorkspace}
              className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Acesso Founder</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Public Portal Sub-Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActivePublicTab('timeline')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
            activePublicTab === 'timeline'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Linha do Tempo</span>
        </button>

        <button
          onClick={() => setActivePublicTab('search')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
            activePublicTab === 'search'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Pesquisa</span>
        </button>

        <button
          onClick={() => setActivePublicTab('favorites')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
            activePublicTab === 'favorites'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Favoritos</span>
        </button>

        <button
          onClick={() => setActivePublicTab('devices')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
            activePublicTab === 'devices'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Dispositivos</span>
        </button>

        <button
          onClick={() => setActivePublicTab('settings')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
            activePublicTab === 'settings'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configurações & PIN</span>
        </button>
      </div>

      {/* 4. Tab Views Content */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        {activePublicTab === 'timeline' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Eventos do Dispositivo</h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-200 block">SMS Recebido (+244 923 000 111)</span>
                  <span className="text-slate-400 text-[11px]">Código de verificação do banco capturado com sucesso.</span>
                </div>
                <span className="text-[10px] text-slate-500">Há 2 min</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-bold text-indigo-400 block">Notificação WhatsApp</span>
                  <span className="text-slate-400 text-[11px]">Suporte técnico: "O seu dispositivo está emparelhado."</span>
                </div>
                <span className="text-[10px] text-slate-500">Há 15 min</span>
              </div>
            </div>
          </div>
        )}

        {activePublicTab === 'settings' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Segurança & Proteção por PIN</h3>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-200 block">Proteger Acesso por PIN</span>
                <span className="text-xs text-slate-400">Exigir código PIN de 4 dígitos ao abrir o PWA</span>
              </div>
              <button
                onClick={() => setPinEnabled(!pinEnabled)}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  pinEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {pinEnabled ? 'PIN ATIVO' : 'PIN DESATIVADO'}
              </button>
            </div>
          </div>
        )}

        {['search', 'favorites', 'devices'].includes(activePublicTab) && (
          <div className="py-8 text-center text-xs text-slate-500 font-mono">
            Módulo {activePublicTab.toUpperCase()} ativo e pronto para utilização.
          </div>
        )}
      </div>
    </div>
  );
};
