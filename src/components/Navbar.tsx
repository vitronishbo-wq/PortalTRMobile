import React from 'react';
import { Activity, Cloud, Smartphone, BarChart3, Database, Rocket, Plus, Lock, Zap, Shield, Cpu } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount: number;
  onSimulateEvent: () => void;
  onLockCamouflage?: () => void;
  onOpenCamouflageSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  unreadCount,
  onSimulateEvent,
  onLockCamouflage,
  onOpenCamouflageSettings
}) => {
  const navItems = [
    { id: 'timeline', label: 'Linha do Tempo', icon: Activity, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'runtime', label: 'Runtime V2', icon: Cpu, highlight: true },
    { id: 'onboarding', label: 'Engine Zero-Touch', icon: Zap },
    { id: 'installer', label: 'Instalação PWA', icon: Smartphone },
    { id: 'cloudstatus', label: 'Cloud Status', icon: Cloud },
    { id: 'devices', label: 'Dispositivos', icon: Smartphone },
    { id: 'analytics', label: 'Métricas', icon: BarChart3 },
    { id: 'firestore', label: 'Firestore', icon: Database },
    { id: 'ritual', label: 'Ritual Deploy', icon: Rocket }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Status */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('timeline')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
                  Portal Mobile
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Sincronização Mobile & Monitoramento 24/7
              </p>
            </div>
          </div>

          {/* System Status Indicator */}
          <div className="hidden lg:flex items-center space-x-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/60">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">Servidor Online</span>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-2">
            {onOpenCamouflageSettings && (
              <button
                onClick={onOpenCamouflageSettings}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-indigo-300 border border-slate-700/80 transition-colors cursor-pointer"
                title="Configurar Perfil de Camuflagem (Calculadora/PIN)"
              >
                <Shield className="w-4 h-4" />
              </button>
            )}

            {onLockCamouflage && (
              <button
                onClick={onLockCamouflage}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs shadow-sm transition-all cursor-pointer border border-slate-700"
                title="Ativar camuflagem (Disfarçar como Calculadora)"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Camuflar</span>
              </button>
            )}
            <button
              onClick={onSimulateEvent}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-xs shadow-sm transition-all cursor-pointer ring-1 ring-indigo-400/30"
              title="Simular disparo de evento de notificação/SMS"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Simular Evento</span>
            </button>
          </div>
        </div>


        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto pb-2 pt-1 no-scrollbar border-t border-slate-800/60 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 ring-1 ring-indigo-500/40 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
                {item.highlight && !isActive && (
                  <span className="ml-1 flex h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
