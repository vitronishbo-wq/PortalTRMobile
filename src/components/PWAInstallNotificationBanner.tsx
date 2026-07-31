import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Apple,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Share,
  PlusSquare,
  QrCode,
  Download,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { CapabilityEngine } from '../engine/CapabilityEngine';

interface PWAInstallNotificationBannerProps {
  appName?: string;
  onOpenFullInstaller?: () => void;
}

export const PWAInstallNotificationBanner: React.FC<PWAInstallNotificationBannerProps> = ({
  appName = 'Calculadora Padrão (Portal Mobile)',
  onOpenFullInstaller
}) => {
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'desktop'>('desktop');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);
  const [showHelperModal, setShowHelperModal] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect standalone mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // Detect OS
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceType('ios');
    } else if (/android/.test(ua)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    // Capture beforeinstallprompt immediately on load
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setInstallSuccess(true);
      setDeferredPrompt(null);
    };

    // Check if CapabilityEngine already caught prompt
    const existingPrompt = CapabilityEngine.getDeferredPrompt();
    if (existingPrompt) {
      setDeferredPrompt(existingPrompt);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || CapabilityEngine.getDeferredPrompt();
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setInstallSuccess(true);
        }
        setDeferredPrompt(null);
        CapabilityEngine.clearDeferredPrompt();
      } catch (err) {
        console.warn('Erro ao disparar prompt nativo:', err);
        if (onOpenFullInstaller) onOpenFullInstaller();
        else setShowHelperModal(true);
      }
    } else {
      // If no prompt event available, show step-by-step helper
      if (onOpenFullInstaller) {
        onOpenFullInstaller();
      } else {
        setShowHelperModal(true);
      }
    }
  };

  const handleOpenInstalledApp = () => {
    setShowHelperModal(true);
  };

  if (isStandalone) {
    // If running inside standalone app mode already (matchMedia display-mode: standalone is true)
    return (
      <div className="bg-emerald-950/90 border-b border-emerald-500/40 px-4 py-2.5 text-emerald-200 text-xs font-sans flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold">Aplicações PWA ativa em Modo Nativo (Standalone)</span>
        </div>
        <button
          onClick={() => {
            window.location.href = window.location.origin;
          }}
          className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Abrir Portal</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b-2 border-indigo-500/50 shadow-2xl p-3 sm:p-4 text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left Side: Notification Icon & Title */}
        <div className="flex items-center space-x-3 text-left w-full md:w-auto">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 animate-pulse">
              <Download className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold uppercase rounded-md font-mono border border-indigo-500/30">
                Aviso de Instalação PWA
              </span>
              <span className="text-[10px] text-emerald-400 font-bold hidden sm:inline">
                ● Sempre ativo ao abrir link
              </span>
            </div>
            <h3 className="text-xs sm:text-sm font-extrabold text-white tracking-tight">
              Acedeu via Link Web — Instale a App no Telemóvel
            </h3>
            <p className="text-[11px] text-slate-300 hidden sm:block">
              Para utilizar disfarçado de Calculadora sem barra do navegador, adicione o ícone ao ecrã principal.
            </p>
          </div>
        </div>

        {/* Right Side: Dual Action Buttons */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          {/* Action 1: Install PWA */}
          <button
            onClick={handleInstallClick}
            className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer transform active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-bounce" />
            <span>Instalar PWA Agora</span>
          </button>

          {/* Action 2: Open Installed PWA */}
          <button
            onClick={handleOpenInstalledApp}
            className="flex-1 md:flex-none px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/40 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            title="Ajuda para abrir se a app já foi instalada anteriormente"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            <span>Já Instalado? Abrir App</span>
          </button>
        </div>
      </div>

      {/* Helper Modal for "Already Installed" or Manual Installation */}
      {showHelperModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 text-slate-100 font-sans animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm text-white">Guia de Instalação & Abertura PWA</h3>
              </div>
              <button
                onClick={() => setShowHelperModal(false)}
                className="text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg text-xs"
              >
                ✕
              </button>
            </div>

            {/* Content for Android vs iOS */}
            {deviceType === 'android' && (
              <div className="space-y-4 text-xs">
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl text-emerald-300 space-y-1">
                  <span className="font-bold block text-emerald-400">📱 Se já tem a PWA instalada no Android:</span>
                  <p className="text-[11px] leading-relaxed">
                    Procure no ecrã principal ou na gaveta de aplicações pelo ícone da <strong>"{appName}"</strong>. Abrir pelo ícone executa a aplicação sem barras de navegação.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-200 block">📥 Se ainda não instalou ou quer reinstalar:</span>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
                    <li>Toque no menu de 3 pontos <strong>(⋮)</strong> do Chrome no canto superior direito.</li>
                    <li>Selecione <strong>"Adicionar ao ecrã principal"</strong> ou <strong>"Instalar aplicação"</strong>.</li>
                    <li>Confirme para criar o atalho direto no seu telemóvel.</li>
                  </ol>
                </div>
              </div>
            )}

            {deviceType === 'ios' && (
              <div className="space-y-4 text-xs">
                <div className="bg-indigo-500/10 border border-indigo-500/30 p-3.5 rounded-2xl text-indigo-300 space-y-1">
                  <span className="font-bold block text-indigo-400">🍎 Se já instalou no iPhone / iPad:</span>
                  <p className="text-[11px] leading-relaxed">
                    Saia do Safari e toque no ícone da <strong>"{appName}"</strong> diretamente no seu ecrã de início iOS.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-200 block">📲 Como Instalar no Safari iOS:</span>
                  <div className="space-y-2 text-slate-300 text-[11px]">
                    <div className="flex items-center space-x-2">
                      <Share className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>1. Toque no ícone <strong>Partilhar</strong> na barra inferior do Safari.</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <PlusSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>2. Selecione <strong>"Adicionar ao Ecrã Principal"</strong>.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {deviceType === 'desktop' && (
              <div className="space-y-3 text-xs">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-slate-300">
                  <span className="font-bold text-white block">💻 Instalação em Computador / Laptop:</span>
                  <p className="text-[11px] text-slate-400">
                    No Chrome/Edge/Brave, clique no ícone de instalação ⊕ no canto superior direito da barra de endereço do navegador.
                  </p>
                </div>
              </div>
            )}

            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Instalar PWA</span>
              </button>
              <button
                onClick={() => {
                  window.location.href = window.location.origin;
                }}
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
