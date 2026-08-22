import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Globe,
  CheckCircle2,
  Share,
  PlusSquare,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  X
} from 'lucide-react';
import { InstallEngine, InstallState } from '../engine/installEngine';

interface PWAInstallNotificationBannerProps {
  appName?: string;
  onOpenFullInstaller?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const PWAInstallNotificationBanner: React.FC<PWAInstallNotificationBannerProps> = ({
  appName = 'Calculadora',
  onOpenFullInstaller,
  isOpen: customIsOpen,
  onClose: customOnClose
}) => {
  const [installState, setInstallState] = useState<InstallState>(InstallEngine.getState());
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [showAndroidManual, setShowAndroidManual] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = InstallEngine.subscribe((state) => {
      setInstallState(state);
      if (state.isInstalled && customIsOpen === undefined) {
        setIsOpen(false);
      }
    });

    return () => unsubscribe();
  }, [customIsOpen]);

  const modalActive = customIsOpen !== undefined ? customIsOpen : isOpen;

  const handleCloseModal = () => {
    if (customOnClose) {
      customOnClose();
    } else {
      setIsOpen(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInstallClick = async () => {
    const res = await InstallEngine.install();
    if (res.success) {
      setInstallSuccess(true);
      setTimeout(() => handleCloseModal(), 1200);
    } else if (res.reason === 'prompt_not_ready') {
      setShowAndroidManual(true);
    }
  };

  if (!modalActive || installState.isInstalled) {
    return null;
  }

  const isIOS = installState.platform === 'MOBILE_IOS';
  const isInApp = installState.isInAppBrowser;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 font-sans text-slate-100 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/30 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 text-center relative">
        
        {/* Header Close button */}
        <button
          onClick={handleCloseModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title & App Icon */}
        <div className="pt-2 space-y-1 text-center">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400 shadow-inner">
            <Smartphone className="w-6 h-6" />
          </div>
          <h2 className="text-base font-black text-white">
            Instalar {appName}
          </h2>
          <p className="text-xs text-slate-400">
            Adicione ao ecrã principal para acesso rápido e ecrã inteiro.
          </p>
        </div>

        {/* IN-APP BROWSER DETECTED (Instagram, WhatsApp, etc.) */}
        {isInApp ? (
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-amber-500/30 space-y-2.5 text-left text-xs">
            <div className="flex items-center space-x-2 text-amber-400 font-bold">
              <ExternalLink className="w-4 h-4 shrink-0" />
              <span>Navegador Interno Detetado</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Para instalar este PWA, abra esta ligação no navegador nativo do telemóvel (<strong>Safari</strong> no iPhone ou <strong>Chrome</strong> no Android).
            </p>
            <button
              onClick={handleCopyLink}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 border border-slate-700 active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Ligação Copiada!' : 'Copiar Ligação'}</span>
            </button>
          </div>
        ) : isIOS ? (
          /* IOS / SAFARI DETERMINISTIC 2-STEP VISUAL GUIDE */
          <div className="space-y-3 text-left">
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-indigo-500/30 space-y-3 text-xs">
              <div className="flex items-start space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  1
                </div>
                <p className="text-slate-200 text-[11px] leading-relaxed">
                  Toque no ícone de <strong>Partilhar</strong> na barra inferior do Safari (o quadrado com a seta para cima <Share className="w-3.5 h-3.5 inline text-indigo-400 ml-0.5" />).
                </p>
              </div>

              <div className="flex items-start space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  2
                </div>
                <p className="text-slate-200 text-[11px] leading-relaxed">
                  Role o menu para baixo e selecione <strong className="text-indigo-300">"Adicionar ao Ecrã Principal"</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-indigo-400 ml-0.5" />).
                </p>
              </div>
            </div>

            <button
              onClick={handleCloseModal}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl transition-all cursor-pointer text-center flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Entendido, vou adicionar</span>
            </button>
          </div>
        ) : (
          /* ANDROID / CHROME / DESKTOP NATIVE OR FALLBACK */
          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer transform active:scale-95"
            >
              {installSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Instalação Concluída</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>1- Instalar PWA Agora</span>
                </>
              )}
            </button>

            {showAndroidManual && (
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 text-left space-y-1 animate-in fade-in">
                <p className="font-semibold text-slate-300">Dica de instalação:</p>
                <p>Toque no menu <strong>(⋮)</strong> do navegador e selecione <strong>"Adicionar ao ecrã principal"</strong> ou <strong>"Instalar aplicação"</strong>.</p>
              </div>
            )}

            <button
              onClick={handleCloseModal}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl transition-all cursor-pointer text-center flex items-center justify-center space-x-2 border border-slate-700/80 active:scale-95"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>2- Continuar no browser</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};



