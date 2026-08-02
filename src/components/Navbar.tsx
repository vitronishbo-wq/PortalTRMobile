import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Zap, Lock, LogOut, KeyRound, UserCheck, Download, Settings, Menu as MenuIcon, X, ChevronRight, Sparkles } from 'lucide-react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  // Status Indicator: Verde (online/estável), Amarelo (conexão instável/fraca), Vermelho (offline/crítico)
  const statusColorClass = isOnline
    ? 'bg-emerald-400 shadow-emerald-500/50'
    : 'bg-rose-500 shadow-rose-500/50';

  const statusTitle = isOnline
    ? 'Online / Conexão Estável'
    : 'Offline / Conexão Interrompida (Crítico)';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 select-none font-sans w-full max-w-[100vw] overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between min-h-[3.5rem] py-2 gap-2 overflow-hidden w-full">
          {/* Logo, Status Dot & Brand Identity */}
          <div className="flex items-center space-x-2.5 min-w-0 shrink truncate">
            {/* Minimalist Status LED Dot (Verde = Online, Amarelo = Instável, Vermelho = Offline) */}
            <div className="relative flex h-3 w-3 shrink-0" title={statusTitle}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusColorClass} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${statusColorClass} shadow-md`}></span>
            </div>

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
          </div>

          {/* Unified Menu Selector Button */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-slate-100 border shadow-lg font-extrabold text-xs flex items-center space-x-2 cursor-pointer transition-all active:scale-95 ${
                isMenuOpen
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/25'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700/80 shadow-slate-950/50'
              }`}
              title="Abrir Menu de Opções"
              aria-label="Menu"
            >
              <MenuIcon className={`w-4 h-4 ${isMenuOpen ? 'text-slate-950' : 'text-amber-400'}`} />
              <span className="tracking-wide">Menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Animated Top Dropdown Sheet Modal (Rendered via React Portal onto document.body) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isMenuOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/80" 
                onClick={() => setIsMenuOpen(false)} 
                aria-hidden="true" 
              />

              <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="relative w-full max-w-md bg-slate-900 border-2 border-slate-700/90 rounded-3xl p-5 shadow-2xl shadow-slate-950/90 z-10 space-y-4 text-slate-100 font-sans my-auto"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white tracking-tight">Menu de Opções</h3>
                      <p className="text-xs text-slate-400 font-medium">Selecione uma funcionalidade</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer border border-slate-700/80"
                    aria-label="Fechar Menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Menu Options List */}
                <div className="space-y-2.5 max-h-[65vh] overflow-y-auto pr-0.5">
                  {/* Option: Download PWA */}
                  {onOpenInstallModal && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenInstallModal();
                      }}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/35 text-left transition-all cursor-pointer group active:scale-[0.98]"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="p-2.5 rounded-xl bg-amber-500/25 text-amber-300 border border-amber-400/50 group-hover:scale-105 transition-transform shrink-0">
                          <Download className="w-4 h-4 animate-bounce" />
                        </div>
                        <div>
                          <span className="block text-xs sm:text-sm font-extrabold text-amber-300">Download PWA / Aplicação</span>
                          <span className="block text-[11px] text-slate-400 font-medium">Instalar no ecrã principal</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-amber-400/60 group-hover:text-amber-300 transition-colors shrink-0" />
                    </button>
                  )}

                  {/* Option: Camuflar / Modo Calculadora */}
                  {onLockCamouflage && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onLockCamouflage();
                      }}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition-all cursor-pointer group active:scale-[0.98]"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="p-2.5 rounded-xl bg-slate-800 text-amber-400 border border-slate-700 group-hover:scale-105 transition-transform shrink-0">
                          <Lock className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <span className="block text-xs sm:text-sm font-extrabold text-slate-100">Modo Calculadora (Cadeado)</span>
                          <span className="block text-[11px] text-slate-400 font-medium">Camuflar em calculadora discreta</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors shrink-0" />
                    </button>
                  )}

                  {/* Option: Configurações */}
                  {onOpenCamouflageSettings && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenCamouflageSettings();
                      }}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition-all cursor-pointer group active:scale-[0.98]"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 group-hover:scale-105 transition-transform shrink-0">
                          <Settings className="w-4 h-4 text-slate-300" />
                        </div>
                        <div>
                          <span className="block text-xs sm:text-sm font-extrabold text-slate-100">Configurações & Perfil</span>
                          <span className="block text-[11px] text-slate-400 font-medium">PIN de acesso e preferências</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors shrink-0" />
                    </button>
                  )}

                  {/* Option: SuperDeus / Founder Mode (Only if authorized) */}
                  {isFounder && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setWorkspaceMode(workspaceMode === 'public' ? 'founder' : 'public');
                      }}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-left transition-all cursor-pointer group active:scale-[0.98]"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="p-2.5 rounded-xl bg-amber-500/30 text-amber-300 border border-amber-400/50 group-hover:scale-105 transition-transform shrink-0">
                          {workspaceMode === 'public' ? (
                            <KeyRound className="w-4 h-4 text-amber-300" />
                          ) : (
                            <LogOut className="w-4 h-4 text-amber-300" />
                          )}
                        </div>
                        <div>
                          <span className="block text-xs sm:text-sm font-black text-amber-300">
                            {workspaceMode === 'public' ? 'SuperDeus / Founder Console' : 'Voltar ao Modo Público'}
                          </span>
                          <span className="block text-[11px] text-slate-400 font-medium">Acesso Root e Infraestrutura</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-amber-400/60 group-hover:text-amber-300 transition-colors shrink-0" />
                    </button>
                  )}

                  {/* Option: Auth Modal / Iniciar Sessão */}
                  {onOpenAuthModal && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenAuthModal();
                      }}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-left transition-all cursor-pointer group active:scale-[0.98]"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 group-hover:scale-105 transition-transform shrink-0">
                          <UserCheck className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                          <span className="block text-xs sm:text-sm font-extrabold text-indigo-300">Autenticação & Conta</span>
                          <span className="block text-[11px] text-slate-400 font-medium truncate max-w-[200px]">
                            {userProfile?.email || authUser?.email || 'Gerir sessão'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-indigo-400/60 group-hover:text-indigo-300 transition-colors shrink-0" />
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </header>
  );
};



