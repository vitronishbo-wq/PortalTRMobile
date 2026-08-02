import React, { useState } from 'react';
import { Activity, Smartphone, Crown, Zap, Lock, LogOut, KeyRound, UserCheck, Download, ChevronDown, SlidersHorizontal } from 'lucide-react';
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
  onOpenInstallModal?: () => void;
}

const SUPER_ADMIN_EMAILS = [
  'silajaneiro9@gmail.com',
  'deusfundador@vitronis.co.ao'
];

export const Navbar: React.FC<NavbarProps> = ({
  workspaceMode,
  setWorkspaceMode,
  onLockCamouflage,
  onOpenInstallModal
}) => {
  const { user: authUser, profile: userProfile } = useIdentity();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isFounder = Boolean(
    (authUser?.email && SUPER_ADMIN_EMAILS.includes(authUser.email.toLowerCase())) ||
    userProfile?.role === 'founder' ||
    userProfile?.authority === 'ROOT'
  );

  const roleBadge = userProfile?.role ? userProfile.role.toUpperCase() : authUser ? 'AUTHENTICATED' : 'GUEST';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 select-none font-sans w-full max-w-[100vw] overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-wrap items-center justify-between min-h-[3.5rem] py-2 gap-2 overflow-hidden w-full">
          {/* Logo & Brand Identity */}
          <div 
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer min-w-0 max-w-[60%] sm:max-w-none shrink truncate" 
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
              <div className="flex items-center space-x-1 min-w-0 truncate">
                <span className="font-extrabold text-xs sm:text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent truncate block">
                  {workspaceMode === 'founder' ? 'Founder Root Workspace' : 'Portal Mobile PWA'}
                </span>
                <span className={`text-[9px] sm:text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full uppercase shrink-0 truncate ${
                  workspaceMode === 'founder'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                }`}>
                  {workspaceMode === 'founder' ? 'Root' : 'Public'}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block font-mono truncate">
                {workspaceMode === 'founder'
                  ? 'Autoridade Raiz • VS Code IDE Engine'
                  : 'Sincronização Mobile & Notificações'}
              </p>
            </div>
          </div>

          {/* System Status & Auth Badge Indicator (Desktop) */}
          <div className="hidden lg:flex items-center space-x-3 text-xs font-mono shrink-0">
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/60 shrink-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-90"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300 shadow-sm shadow-emerald-400"></span>
              </span>
              <span className="text-slate-200 font-bold truncate">Servidor Kernel Online</span>
            </div>

            {/* Authenticated User / Firestore Profile Badge */}
            {userProfile || authUser ? (
              <div className="flex items-center space-x-1.5 bg-indigo-950/60 px-3 py-1.5 rounded-full border border-indigo-500/30 text-indigo-300 min-w-0 shrink-0">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="font-bold text-[11px] truncate max-w-[130px]">
                  {userProfile?.displayName || authUser?.email || 'Autenticado'}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 truncate">
                  {roleBadge}
                </span>
              </div>
            ) : null}
          </div>

          {/* Desktop Actions Row */}
          <div className="hidden sm:flex items-center space-x-2 shrink-0">
            {onOpenInstallModal && (
              <button
                onClick={onOpenInstallModal}
                className="p-2 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-400/60 shadow-md shadow-emerald-500/20 cursor-pointer flex items-center justify-center transition-all shrink-0"
                title="Instalar PWA"
                aria-label="Instalar PWA"
              >
                <Download className="w-4 h-4 text-emerald-300 animate-pulse" />
              </button>
            )}

            {onLockCamouflage && (
              <button
                onClick={onLockCamouflage}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 cursor-pointer flex items-center justify-center transition-all shrink-0"
                title="Camuflar"
                aria-label="Camuflar"
              >
                <Lock className="w-4 h-4 text-amber-400" />
              </button>
            )}

            {/* Public vs Founder Mode Toggle (ONLY FOR AUTHORIZED FOUNDER) */}
            {isFounder && (
              workspaceMode === 'public' ? (
                <button
                  onClick={() => setWorkspaceMode('founder')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-md shadow-amber-500/10 cursor-pointer font-mono shrink-0"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0 hidden sm:block" />
                  <span className="truncate">Elevação Root / Founder</span>
                </button>
              ) : (
                <button
                  onClick={() => setWorkspaceMode('public')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all cursor-pointer font-mono shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5 text-indigo-400 shrink-0 hidden sm:block" />
                  <span className="truncate">Sair do Founder IDE</span>
                </button>
              )
            )}
          </div>

          {/* Mobile Collapsible Actions Toggle Button (visible only on mobile screens < sm) */}
          <div className="flex sm:hidden items-center space-x-1 shrink-0">
            {isFounder && (
              <button
                onClick={() => setWorkspaceMode(workspaceMode === 'public' ? 'founder' : 'public')}
                className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold font-mono shrink-0"
              >
                {workspaceMode === 'public' ? 'Root' : 'Sair'}
              </button>
            )}
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center space-x-1 cursor-pointer shrink-0"
              aria-label="Menu de Ações Rápidas"
            >
              <SlidersHorizontal className="w-4 h-4 text-indigo-400 shrink-0" />
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${mobileMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Collapsible Mobile Actions Bar */}
        {mobileMenuOpen && (
          <div className="sm:hidden py-2 border-t border-slate-800/80 flex items-center justify-center space-x-3 animate-fadeIn">
            {onOpenInstallModal && (
              <button
                onClick={() => {
                  onOpenInstallModal();
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-400/60 shadow-md shadow-emerald-500/20 cursor-pointer flex items-center justify-center"
                title="Instalar PWA"
                aria-label="Instalar PWA"
              >
                <Download className="w-4 h-4 text-emerald-300 animate-pulse" />
              </button>
            )}

            {onLockCamouflage && (
              <button
                onClick={() => {
                  onLockCamouflage();
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 cursor-pointer flex items-center justify-center"
                title="Camuflar"
                aria-label="Camuflar"
              >
                <Lock className="w-4 h-4 text-amber-400" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

