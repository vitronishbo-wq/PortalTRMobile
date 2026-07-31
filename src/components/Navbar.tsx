import React from 'react';
import { Activity, Smartphone, Crown, Zap, Lock, LogOut, KeyRound, UserCheck } from 'lucide-react';
import { useIdentity } from '../engine/identityEngine';

interface NavbarProps {
  workspaceMode: 'public' | 'founder';
  setWorkspaceMode: (mode: 'public' | 'founder') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount: number;
  onSimulateEvent: () => void;
  onLockCamouflage?: () => void;
  onOpenCamouflageSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  workspaceMode,
  setWorkspaceMode,
  activeTab,
  setActiveTab,
  onLockCamouflage,
  onOpenCamouflageSettings
}) => {
  const { user: authUser, profile: userProfile } = useIdentity();
  const roleBadge = userProfile?.role ? userProfile.role.toUpperCase() : authUser ? 'AUTHENTICATED' : 'GUEST';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 select-none font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setWorkspaceMode('public')}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ring-1 ring-white/20 transition-all ${
              workspaceMode === 'founder'
                ? 'bg-gradient-to-tr from-amber-500 via-amber-600 to-amber-700 shadow-amber-500/20'
                : 'bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-indigo-500/20'
            }`}>
              {workspaceMode === 'founder' ? (
                <Crown className="w-5 h-5 text-slate-950 font-black" />
              ) : (
                <Zap className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  {workspaceMode === 'founder' ? 'Founder Root Workspace' : 'Portal Mobile PWA'}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                  workspaceMode === 'founder'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                }`}>
                  {workspaceMode === 'founder' ? 'Root Mode' : 'Public'}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block font-mono">
                {workspaceMode === 'founder'
                  ? 'Autoridade Raiz • VS Code IDE Engine'
                  : 'Sincronização Mobile & Notificações'}
              </p>
            </div>
          </div>

          {/* System Status & Auth Badge Indicator */}
          <div className="hidden lg:flex items-center space-x-3 text-xs font-mono">
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/60">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-medium">Servidor Kernel Online</span>
            </div>

            {/* Authenticated User / Firestore Profile Badge */}
            {userProfile || authUser ? (
              <div className="flex items-center space-x-1.5 bg-indigo-950/60 px-3 py-1.5 rounded-full border border-indigo-500/30 text-indigo-300">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-bold text-[11px] truncate max-w-[130px]">
                  {userProfile?.displayName || authUser?.email || 'Autenticado'}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {roleBadge}
                </span>
              </div>
            ) : null}
          </div>

          {/* Mode Switcher & Security Controls */}
          <div className="flex items-center space-x-3">
            {onLockCamouflage && (
              <button
                onClick={onLockCamouflage}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs shadow-sm transition-all cursor-pointer border border-slate-700"
                title="Ativar modo de camuflagem (Calculadora)"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Camuflar</span>
              </button>
            )}

            {/* Public vs Founder Mode Toggle */}
            {workspaceMode === 'public' ? (
              <button
                onClick={() => setWorkspaceMode('founder')}
                className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-md shadow-amber-500/10 cursor-pointer font-mono"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Elevação Root / Founder</span>
              </button>
            ) : (
              <button
                onClick={() => setWorkspaceMode('public')}
                className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all cursor-pointer font-mono"
              >
                <LogOut className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sair do Founder IDE</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

