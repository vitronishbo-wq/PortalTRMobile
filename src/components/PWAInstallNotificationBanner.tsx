import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Apple,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Share,
  PlusSquare,
  Download,
  CheckCircle2,
  X,
  HelpCircle
} from 'lucide-react';
import { CapabilityEngine } from '../engine/CapabilityEngine';

interface PWAInstallNotificationBannerProps {
  appName?: string;
  onOpenFullInstaller?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const PWAInstallNotificationBanner: React.FC<PWAInstallNotificationBannerProps> = ({
  appName = 'Calculadora Padrão (Portal Mobile)',
  onOpenFullInstaller,
  isOpen: customIsOpen,
  onClose: customOnClose
}) => {
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'desktop'>('desktop');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect standalone mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // If already running in standalone mode, do not auto-open center notification
    if (standalone) {
      setIsOpen(false);
    }

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

  const modalActive = customIsOpen !== undefined ? customIsOpen : isOpen;

  const handleCloseModal = () => {
    if (customOnClose) {
      customOnClose();
    } else {
      setIsOpen(false);
    }
  };

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || CapabilityEngine.getDeferredPrompt();
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setInstallSuccess(true);
          handleCloseModal();
        }
        setDeferredPrompt(null);
        CapabilityEngine.clearDeferredPrompt();
      } catch (err) {
        console.warn('[PWA] Erro ao disparar prompt nativo:', err);
        setShowGuide(true);
      }
    } else {
      // If no native prompt event available, show guide or full installer
      if (onOpenFullInstaller) {
        onOpenFullInstaller();
        handleCloseModal();
      } else {
        setShowGuide(true);
      }
    }
  };

  // If app is already standalone, don't show prompt
  if (isStandalone) {
    return null;
  }

  if (!modalActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-sans text-slate-100 animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 border border-indigo-500/40 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 relative">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
              <Download className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase rounded-md font-mono border border-emerald-500/30">
                  Notificação de Instalação PWA
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white tracking-tight mt-0.5">
                Instalar Portal TR Mobile no Dispositivo
              </h3>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="text-slate-400 hover:text-white p-1.5 bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-all"
            title="Fechar Notificação"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        {installSuccess ? (
          <div className="bg-emerald-950/80 border border-emerald-500/50 p-4 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="font-extrabold text-emerald-300">Aplicação Instalada com Sucesso!</h4>
            <p className="text-xs text-emerald-200">
              Aceda ao ecrã principal do seu telemóvel para abrir a PWA em Modo Camuflado de Calculadora.
            </p>
            <button
              onClick={handleCloseModal}
              className="mt-2 px-5 py-2 bg-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer"
            >
              Concluir
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <p className="text-slate-300 leading-relaxed text-xs">
              Detetou-se acesso via navegador web. Para executar a app em <strong>Modo Camuflado Nativo (Calculadora)</strong>, sem barras de endereço e com arranque rápido, instale a PWA agora.
            </p>

            {/* Platform instructions or status */}
            {!showGuide ? (
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Plataforma detetada:</span>
                  <span className="text-indigo-300 font-bold uppercase flex items-center space-x-1">
                    {deviceType === 'ios' && <Apple className="w-3.5 h-3.5 inline text-slate-200" />}
                    {deviceType === 'android' && <Smartphone className="w-3.5 h-3.5 inline text-emerald-400" />}
                    <span>{deviceType}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Modo de Operação:</span>
                  <span className="text-emerald-400 font-bold">Camuflagem PWA</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {deviceType === 'android' && (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-[11px]">
                    <span className="font-bold text-emerald-400 block">📱 Passo a Passo Android (Chrome/Edge):</span>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                      <li>Toque no menu <strong>(⋮)</strong> do navegador no canto superior.</li>
                      <li>Clique em <strong>"Adicionar ao ecrã principal"</strong> ou <strong>"Instalar aplicação"</strong>.</li>
                      <li>Confirme a adição ao seu telemóvel.</li>
                    </ol>
                  </div>
                )}

                {deviceType === 'ios' && (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-[11px]">
                    <span className="font-bold text-indigo-300 block">🍎 Passo a Passo iPhone (Safari):</span>
                    <div className="space-y-2 text-slate-300">
                      <div className="flex items-center space-x-2">
                        <Share className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>1. Toque no ícone <strong>Partilhar</strong> na barra do Safari.</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <PlusSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>2. Selecione <strong>"Adicionar ao Ecrã Principal"</strong>.</span>
                      </div>
                    </div>
                  </div>
                )}

                {deviceType === 'desktop' && (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-[11px] text-slate-300">
                    <span className="font-bold text-white block">💻 Passo a Passo Desktop:</span>
                    <p>Clique no ícone de instalação ⊕ no canto superior direito da barra de endereço do navegador.</p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer transform active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                <span>Instalar Agora (PWA)</span>
              </button>

              <button
                onClick={handleCloseModal}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl transition-all cursor-pointer text-center"
              >
                Continuar no Navegador
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
