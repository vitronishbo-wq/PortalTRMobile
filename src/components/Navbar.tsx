import React from 'react';
import { Crown, Zap, Lock, LogOut, KeyRound, UserCheck, Download, Settings, WifiOff, Wifi } from 'lucide-react';
import { useIdentity } from '../engine/identityEngine';
import { useOnlineStatus } from '../lib/offlineCache';
import { TrialEngine } from '../services/trialEngine';

interface NavbarProps {
  workspaceMode: 'public' | 'founder';
  setWorkspaceMode: (mode: 'public' | 'founder') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount: number;
  onSimulateEvent: () => void;
  onLockCamouflage?: () => void;
  onOpenCamouflageSettings?: () => void;
  onOpenInstallModal?: () => void;
  onOpenAuthModal?: () => void;
}

const SUPER_ADMIN_EMAILS = [
  'silajaneiro9@gmail.com',
  'deusfundador@vitronis.co.ao'
];

export const Navbar: React.FC<NavbarProps> = ({
  workspaceMode,
  setWorkspaceMode,
  onLockCamouflage,
  onOpenCamouflageSettings,
  onOpenInstallModal,
  onOpenAuthModal
}) => {
  const { user: authUser, profile: userProfile } = useIdentity();
  const { isOnline } = useOnlineStatus();

  const isDevGodMode = (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') || localStorage.getItem('vitronis_dev_god_mode') === 'true';

  const isFounder = Boolean(
    isDevGodMode ||
    (authUser?.email && SUPER_ADMIN_EMAILS.includes(authUser.email.toLowerCase())) ||
    userProfile?.role === 'founder' ||
    userProfile?.authority === 'ROOT'
  );

  const displayEmail = userProfile?.email || authUser?.email || 'silajaneiro9@gmail.com';
  const license = TrialEngine.getLicense(authUser?.uid || 'usr-public-001', displayEmail);
  const evalState = TrialEngine.evaluateState(license);
  const daysLabel = license.lifetime || license.plan === 'founder' || license.state === 'Lifetime'
    ? 'Licença Vitalícia'
    : evalState.daysRemaining > 0
      ? `${evalState.daysRemaining} ${evalState.daysRemaining === 1 ? 'dia restante' : 'dias restantes'}`
      : 'Subscrição Expirada';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 select-none font-sans w-full max-w-[100vw] overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between min-h-[3.5rem] py-2 gap-2 overflow-hidden w-full">
          {/* Logo & Brand Identity */}
          <div 
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer min-w-0 shrink truncate" 
            onClick={() => setWorkspaceMode('public')}
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-lg ring-1 ring-white/20 transition-all shrink-0 ${
              workspaceMode === 'founder'
                ? 'bg-gradient-to-tr from-amber-500 via-amber-600 to-amber-700 shadow-amber-500/20'
                : 'bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-indigo-500/20'
            }`}>
              {workspaceMode === 'founder' ? (
                <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 font-black shrink-0" />
              ) : (
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" />
              )}
            </div>
            <div className="min-w-0 flex-1 truncate">
              <span className="font-extrabold text-xs sm:text-base tracking-tight text-white truncate block">
                {workspaceMode === 'founder' ? 'Founder Root Workspace' : 'Portal Mobile'}
              </span>
              {workspaceMode === 'public' && (
                <span className="text-[10px] text-amber-400 font-mono font-bold block truncate -mt-0.5">
                  {daysLabel}
                </span>
              )}
            </div>
          </div>

          {/* System Status & Auth Badge Indicator (Desktop) */}
          <div className="hidden lg:flex items-center space-x-3 text-xs font-mono shrink-0">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border shrink-0 ${
              isOnline
                ? 'bg-slate-800/80 border-slate-700/60'
                : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
            }`}>
              <span className="relative flex h-2 w-2 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'} opacity-90`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-300' : 'bg-amber-300'}`}></span>
              </span>
              <span className="text-slate-200 font-bold truncate">
                {isOnline ? 'Servidor Kernel Online' : 'Modo Offline (Cache Local)'}
              </span>
            </div>

            {/* Authenticated User / Firestore Profile Badge */}
            {userProfile || authUser ? (
              <div className="flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/60 text-slate-300 min-w-0 shrink-0">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="font-bold text-[11px] truncate max-w-[130px]">
                  {userProfile?.displayName || authUser?.email || 'Autenticado'}
                </span>
              </div>
            ) : null}
          </div>

          {/* Action Icons Row (Icon-only, visible at the top) */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {onOpenInstallModal && (
              <button
                onClick={onOpenInstallModal}
                className="p-2 sm:p-2.5 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 text-amber-300 border border-amber-400/60 shadow-md shadow-amber-500/20 cursor-pointer flex items-center justify-center transition-all shrink-0"
                title="Instalar Aplicação"
                aria-label="Instalar Aplicação"
              >
                <Download className="w-4 h-4 text-amber-300 animate-pulse" />
              </button>
            )}

            {onLockCamouflage && (
              <button
                onClick={onLockCamouflage}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 cursor-pointer flex items-center justify-center transition-all shrink-0"
                title="Camuflar"
                aria-label="Camuflar"
              >
                <Lock className="w-4 h-4 text-amber-400" />
              </button>
            )}

            {onOpenCamouflageSettings && (
              <button
                onClick={onOpenCamouflageSettings}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer flex items-center justify-center transition-all shrink-0"
                title="Configurações"
                aria-label="Configurações"
              >
                <Settings className="w-4 h-4 text-slate-300" />
              </button>
            )}

            {/* Founder Mode Toggle Button (Only for authorized founder) */}
            {isFounder && (
              <button
                onClick={() => setWorkspaceMode(workspaceMode === 'public' ? 'founder' : 'public')}
                className="p-2 sm:p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 cursor-pointer flex items-center justify-center transition-all shrink-0 font-mono"
                title={workspaceMode === 'public' ? 'Elevação Root / Founder' : 'Sair do Founder IDE'}
                aria-label="Toggle Founder Mode"
              >
                {workspaceMode === 'public' ? (
                  <KeyRound className="w-4 h-4 text-amber-400" />
                ) : (
                  <LogOut className="w-4 h-4 text-amber-400" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

