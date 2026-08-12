import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Crown,
  Zap,
  Lock,
  UserCheck,
  Download,
  Settings,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MoreHorizontal,
  User,
  MessageSquare,
  PhoneCall,
  Bell,
  Grid,
  Activity,
  Layers,
  Home,
  ArrowLeft,
  Search,
  Contact,
  Smartphone,
  ShieldCheck,
  CreditCard,
  Palette,
  Terminal
} from 'lucide-react';
import { useIdentity } from '../engine/identityEngine';
import { useOnlineStatus } from '../lib/offlineCache';
import { NavigationEngine } from '../engine/navigationEngine';
import { CommandEngine } from '../engine/CommandEngine';

interface NavbarProps {
  workspaceMode: 'public' | 'founder';
  setWorkspaceMode: (mode: 'public' | 'founder') => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  unreadCount?: number;
  onSimulateEvent?: () => void;
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
  activeTab,
  setActiveTab,
  onLockCamouflage,
  onOpenInstallModal,
  onOpenAuthModal
}) => {
  const { user: authUser, profile: userProfile } = useIdentity();
  const { isOnline } = useOnlineStatus();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');

  // Collapsible Section States
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    comunicacao: true,
    sistema: true,
    conta: true,
    personalizacao: true
  });

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const isDevGodMode = (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') || localStorage.getItem('vitronis_dev_god_mode') === 'true';

  const isFounder = Boolean(
    isDevGodMode ||
    (authUser?.email && SUPER_ADMIN_EMAILS.includes(authUser.email.toLowerCase())) ||
    userProfile?.role === 'founder' ||
    userProfile?.authority === 'ROOT'
  );

  const displayEmail = userProfile?.email || authUser?.email || 'silajaneiro9@gmail.com';
  const initial = (userProfile?.displayName || displayEmail || 'U').charAt(0).toUpperCase();

  const handleSelectTab = (tabId: string) => {
    if (setActiveTab) {
      setActiveTab(tabId);
    }
    NavigationEngine.navigateTo(tabId as any);
    setIsMenuOpen(false);
  };

  // Hierarchical Menu Structure definition (8 Core Domains)
  const menuHierarchy = [
    {
      key: 'principal',
      title: 'Principal',
      icon: Home,
      color: 'text-indigo-400',
      items: [
        { id: 'inicio', label: 'Home / Início', icon: Home, color: 'text-indigo-400' },
        { id: 'chamadas', label: 'Phone (Dialer, Calls, Contacts)', icon: PhoneCall, color: 'text-emerald-400' },
        { id: 'mensagens', label: 'Messages / SMS', icon: MessageSquare, color: 'text-cyan-400' },
        { id: 'notificacoes', label: 'Notifications', icon: Bell, color: 'text-amber-400' },
      ]
    },
    {
      key: 'gestao',
      title: 'Gestão & Ferramentas',
      icon: Smartphone,
      color: 'text-purple-400',
      items: [
        { id: 'dispositivos', label: 'Devices / Dispositivos', icon: Smartphone, color: 'text-purple-400' },
        { id: 'banking', label: 'Banking Hub & Carteiras', icon: CreditCard, color: 'text-emerald-400' },
        { id: 'app_center', label: 'App Center & Aplicações', icon: Grid, color: 'text-cyan-400' },
        { id: 'favoritos', label: 'Favorites / Favoritos', icon: Sparkles, color: 'text-amber-400' },
        { id: 'pesquisa', label: 'Search / Pesquisa Universal', icon: Search, color: 'text-cyan-400' },
        { id: 'definicoes', label: 'Settings / Configurações', icon: Settings, color: 'text-rose-400' },
      ]
    }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 select-none font-sans w-full max-w-[100vw] overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between min-h-[3.5rem] py-2 w-full gap-2">
          
          {/* ESQUERDA: Identidade Visual (Apenas Logo Icon) */}
          <div className="flex items-center space-x-2 shrink-0">
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => {
                if (setActiveTab) setActiveTab('inicio');
                setWorkspaceMode('public');
              }}
              title={workspaceMode === 'founder' ? 'Founder IDE' : 'Portal TR Mobile'}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-md ring-1 ring-white/20 transition-all shrink-0 ${
                workspaceMode === 'founder'
                  ? 'bg-gradient-to-tr from-amber-500 via-amber-600 to-amber-700 shadow-amber-500/20'
                  : 'bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-indigo-500/20'
              }`}>
                {workspaceMode === 'founder' ? (
                  <Crown className="w-4 h-4 text-slate-950 font-black" />
                ) : (
                  <Zap className="w-4 h-4 text-white fill-white" />
                )}
              </div>
            </div>
          </div>

          {/* CENTRO: Espaço Limpo */}
          <div className="flex-1"></div>

          {/* DIREITA: Estado do Sistema + Botão de Menu */}
          <div className="flex items-center space-x-2 shrink-0">
            
            {/* ● Estado do Sistema */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border transition-all ${
                isOnline
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
              title={isOnline ? 'Sistema Operacional Online' : 'Sistema Sem Ligação à Rede'}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isOnline ? 'bg-emerald-400' : 'bg-rose-500'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  isOnline ? 'bg-emerald-400' : 'bg-rose-500'
                }`}></span>
              </span>
              <span className="uppercase tracking-wider">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </div>

            {/* ⚡ Command Engine Quick Palette Button */}
            <button
              onClick={() => CommandEngine.togglePalette()}
              className="w-9 h-9 rounded-xl border border-indigo-500/40 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 shadow-md font-mono font-bold flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0 group relative"
              title="Paleta de Comandos (Ctrl+K / Cmd+K)"
              aria-label="Comandos"
            >
              <Terminal className="w-4 h-4 text-indigo-400 group-hover:text-amber-300 transition-colors" />
            </button>

            {/* ⋯ Botão de Menu (Acesso ao Drawer do Sistema) */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`w-9 h-9 rounded-xl border shadow-md font-bold flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0 ${
                isMenuOpen
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/25'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700/80 text-amber-400'
              }`}
              title="Menu do Sistema"
              aria-label="Abrir Menu"
            >
              <MoreHorizontal className={`w-5 h-5 ${isMenuOpen ? 'text-slate-950' : 'text-amber-400'}`} />
            </button>

          </div>
        </div>
      </div>

      {/* App Drawer / Menu (Hierárquico com Recuo & Filtro de Pesquisa) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isMenuOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/80" 
                onClick={() => setIsMenuOpen(false)} 
                aria-hidden="true" 
              />

              <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="relative w-full max-w-sm sm:max-w-md bg-slate-900 border-2 border-slate-700/90 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-slate-950/90 z-10 space-y-3.5 text-slate-100 font-sans my-auto max-h-[90vh] flex flex-col overflow-hidden"
              >
                {/* Header: ← Menu                    ⌕ */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-2 text-slate-300 hover:text-white font-mono font-bold text-sm cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5 text-amber-400" />
                    <span>Menu</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowSearchInput(!showSearchInput)}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        showSearchInput ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-cyan-400 hover:bg-slate-700'
                      }`}
                      title="Pesquisar Módulos no Menu"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer border border-slate-700/80"
                      aria-label="Fechar Menu"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Input de Pesquisa Condicional (⌕) */}
                {showSearchInput && (
                  <div className="relative shrink-0">
                    <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={menuSearchQuery}
                      onChange={(e) => setMenuSearchQuery(e.target.value)}
                      placeholder="Pesquisar no menu..."
                      className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all font-sans"
                      autoFocus
                    />
                    {menuSearchQuery && (
                      <button
                        onClick={() => setMenuSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* MENU HIERÁRQUICO RECOLHÍVEL (Sem Duplicações) */}
                <div className="space-y-3 overflow-y-auto pr-1 flex-1 text-xs">
                  {menuHierarchy.map((category) => {
                    const isExpanded = menuSearchQuery ? true : Boolean(expandedSections[category.key]);
                    const CategoryIcon = category.icon;

                    // Filter items if query exists
                    const filteredItems = category.items.filter(item =>
                      !menuSearchQuery ||
                      item.label.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
                      category.title.toLowerCase().includes(menuSearchQuery.toLowerCase())
                    );

                    if (menuSearchQuery && filteredItems.length === 0) {
                      return null;
                    }

                    return (
                      <div key={category.key} className="space-y-1 bg-slate-950/60 rounded-2xl border border-slate-800/80 p-2.5">
                        {/* Header da Categoria (Recolhível) */}
                        <button
                          onClick={() => toggleSection(category.key)}
                          className="w-full flex items-center justify-between p-1.5 rounded-xl text-left hover:bg-slate-900 transition-all cursor-pointer font-bold text-slate-200"
                        >
                          <div className="flex items-center space-x-2">
                            <CategoryIcon className={`w-4 h-4 ${category.color}`} />
                            <span className="text-xs tracking-tight">{category.title}</span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          )}
                        </button>

                        {/* Sub-itens da Categoria */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="pl-4 space-y-1 pt-1 border-l-2 border-slate-800 ml-3"
                            >
                              {filteredItems.map((item) => {
                                const ItemIcon = item.icon;
                                const isActive = activeTab === item.id;
                                return (
                                  <button
                                    key={item.id}
                                    onClick={() => handleSelectTab(item.id)}
                                    className={`w-full flex items-center space-x-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                                      isActive
                                        ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                                    }`}
                                  >
                                    <ItemIcon className={`w-3.5 h-3.5 ${item.color} shrink-0`} />
                                    <span className="text-xs truncate">{item.label}</span>
                                  </button>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}

                  {/* DEFINIÇÕES GERAIS (Fixas na parte inferior do menu) */}
                  <div className="pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleSelectTab('definicoes')}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer font-bold ${
                        activeTab === 'definicoes'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : 'bg-slate-950 hover:bg-slate-900 text-slate-200 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Settings className="w-4 h-4 text-amber-400" />
                        <span>⚙ Definições</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>

                  {/* FERRAMENTAS EXTRA (Instalação / Camuflagem / Founder) */}
                  <div className="pt-2 space-y-1.5 border-t border-slate-800/80">
                    {onOpenInstallModal && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenInstallModal();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-left text-xs font-bold transition-all cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <Download className="w-3.5 h-3.5 text-amber-400" />
                          <span>Instalar App PWA</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-amber-500/60" />
                      </button>
                    )}

                    {onLockCamouflage && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onLockCamouflage();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-left text-xs font-bold transition-all cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Camuflar (Calculadora)</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                    )}

                    {isFounder && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setWorkspaceMode(workspaceMode === 'public' ? 'founder' : 'public');
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-400 border border-slate-800 text-left text-xs font-bold transition-all cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                          <span>{workspaceMode === 'public' ? 'Founder Console IDE' : 'Portal Público'}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-amber-500/60" />
                      </button>
                    )}
                  </div>

                </div>

                {/* Footer do Menu */}
                <div className="pt-2 border-t border-slate-800 text-center text-[10px] text-slate-500 font-mono shrink-0">
                  PORTALTRMOBILE OS • Hierarchical Menu System
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





