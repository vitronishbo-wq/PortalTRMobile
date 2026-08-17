import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Globe,
  CheckCircle2
} from 'lucide-react';
import { InstallEngine, InstallState } from '../engine/installEngine';

interface PWAInstallNotificationBannerProps {
  appName?: string;
  onOpenFullInstaller?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const PWAInstallNotificationBanner: React.FC<PWAInstallNotificationBannerProps> = ({
  appName = 'PortalTRMobile',
  onOpenFullInstaller,
  isOpen: customIsOpen,
  onClose: customOnClose
}) => {
  const [installState, setInstallState] = useState<InstallState>(InstallEngine.getState());
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(true);

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

  const handleInstallClick = async () => {
    const res = await InstallEngine.install();
    if (res.success) {
      setInstallSuccess(true);
      setTimeout(() => handleCloseModal(), 1200);
    }
  };

  if (!modalActive || installState.isInstalled) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 font-sans text-slate-100 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/30 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3 text-center relative">
        
        {/* Simplified Action Options Only — 1 Toque Universal */}
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


