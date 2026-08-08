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
  HelpCircle,
  ArrowRight,
  Check,
  Zap,
  Globe,
  Layers
} from 'lucide-react';
import { CapabilityEngine } from '../engine/CapabilityEngine';

interface PWAInstallNotificationBannerProps {
  appName?: string;
  onOpenFullInstaller?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const PWAInstallNotificationBanner: React.FC<PWAInstallNotificationBannerProps> = ({
  appName = 'Portal TR Mobile',
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

    // If running in standalone mode and customIsOpen is not set, don't auto-open center banner
    if (standalone && customIsOpen === undefined) {
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
  }, [customIsOpen]);

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
          setTimeout(() => handleCloseModal(), 1500);
        }
        setDeferredPrompt(null);
        CapabilityEngine.clearDeferredPrompt();
      } catch (err) {
        console.warn('[PWA] Erro ao disparar prompt nativo:', err);
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  if (!modalActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 font-sans text-slate-100 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/30 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3 text-center relative">
        
        {/* Simplified Action Options Only */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={handleInstallClick}
            className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer transform active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>1- Instalar PWA Agora</span>
          </button>

          <button
            onClick={handleCloseModal}
            className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-2xl transition-all cursor-pointer text-center flex items-center justify-center space-x-2 border border-slate-700/80 active:scale-95"
          >
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>2- Continuar no browser</span>
          </button>
        </div>

      </div>
    </div>
  );
};

