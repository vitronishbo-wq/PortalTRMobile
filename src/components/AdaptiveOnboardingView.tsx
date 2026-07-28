import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { CapabilityEngine } from '../engine/capabilityEngine';
import { PairingEngine } from '../engine/pairingEngine';
import { StateMachine } from '../engine/stateMachine';
import { DeviceCapabilities, PortalState, FeatureFlags, PairingSession, Device } from '../types';
import {
  Smartphone,
  Apple,
  QrCode,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Share,
  PlusSquare,
  WifiOff,
  Lock,
  Cpu,
  Layers,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Globe
} from 'lucide-react';

interface AdaptiveOnboardingViewProps {
  hasPairedDevices: boolean;
  isPinUnlocked: boolean;
  onPinSuccess: () => void;
  onDevicePaired: (device: Partial<Device>) => void;
  onEnterPortal: () => void;
  appName?: string;
}

export const AdaptiveOnboardingView: React.FC<AdaptiveOnboardingViewProps> = ({
  hasPairedDevices,
  isPinUnlocked,
  onPinSuccess,
  onDevicePaired,
  onEnterPortal,
  appName = 'Calculadora Padrão'
}) => {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>(
    CapabilityEngine.detectCapabilities()
  );
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);
  const [pairingToken, setPairingToken] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [pairingSession, setPairingSession] = useState<PairingSession | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [flags] = useState<FeatureFlags>(StateMachine.defaultFlags);

  // Re-evaluate State Machine
  const currentState: PortalState = StateMachine.evaluateState({
    capabilities,
    hasPairedDevices,
    isAuthenticated: true,
    isPinUnlocked,
    flags
  });

  // Capability monitoring & pairing initialization
  useEffect(() => {
    CapabilityEngine.initInstallListener();

    const handleOnline = () => setCapabilities(CapabilityEngine.detectCapabilities());
    const handleOffline = () => setCapabilities(CapabilityEngine.detectCapabilities());

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial capability update
    setCapabilities(CapabilityEngine.detectCapabilities());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize pairing token if in PAIRING mode
  useEffect(() => {
    if (currentState === 'PAIRING' && !pairingToken) {
      const newToken = PairingEngine.generateToken();
      setPairingToken(newToken);

      PairingEngine.createPairingSession(newToken).then((session) => {
        setPairingSession(session);
      });

      const pairUrl = `${window.location.origin}/?pair=${newToken}`;
      QRCode.toDataURL(pairUrl, {
        width: 280,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
        errorCorrectionLevel: 'H'
      }).then((url) => {
        setQrCodeUrl(url);
      });

      // Listen to real-time pairing from phone
      const unsubscribe = PairingEngine.listenToPairing(newToken, (updatedSession) => {
        setPairingSession(updatedSession);
        if (updatedSession.status === 'paired') {
          onDevicePaired({
            deviceId: updatedSession.pairedDeviceId || `dev-${Date.now()}`,
            name: updatedSession.pairedDeviceName || 'Android Emparelhado via QR',
            model: 'Android Device',
            osVersion: 'Android 14',
            online: true,
            batteryLevel: 98,
            lastSync: Date.now()
          });
        }
      });

      return () => unsubscribe();
    }
  }, [currentState, pairingToken, onDevicePaired]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput === '0000') {
      onPinSuccess();
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 2000);
    }
  };

  const handleAndroidInstall = async () => {
    const prompt = CapabilityEngine.getDeferredPrompt();
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        CapabilityEngine.clearDeferredPrompt();
        setCapabilities(CapabilityEngine.detectCapabilities());
      }
    } else {
      alert('Toque nos 3 pontos (⋮) do Chrome e selecione "Adicionar ao ecrã principal".');
    }
  };

  const handleManualPairing = () => {
    onDevicePaired({
      deviceId: `dev-pixel-${Math.floor(Math.random() * 1000)}`,
      name: 'Google Pixel 8 Pro',
      model: 'Pixel 8 Pro (Android 14)',
      osVersion: 'Android 14',
      online: true,
      batteryLevel: 95,
      lastSync: Date.now()
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-2xl z-10">
        {/* Header Engine Banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 p-5 text-center text-white relative">
          <div className="inline-flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20">
            <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Context Engine • State: {currentState}</span>
          </div>
          <h1 className="text-xl font-black mt-2 tracking-tight">{appName}</h1>
          <p className="text-xs text-indigo-100 mt-0.5">
            Fluxo Adaptativo Automático • Portal Mobile TR
          </p>
        </div>

        {/* Real-time Hardware / Capability Diagnostic Bar */}
        <div className="bg-slate-950/80 px-4 py-2.5 border-b border-slate-800/80 text-[11px] grid grid-cols-4 gap-2 text-center font-mono">
          <div className="flex items-center justify-center space-x-1 text-slate-400">
            <Globe className="w-3 h-3 text-indigo-400" />
            <span className="capitalize">{capabilities.os}</span>
          </div>
          <div className="flex items-center justify-center space-x-1 text-slate-400">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="capitalize">{capabilities.browser}</span>
          </div>
          <div className="flex items-center justify-center space-x-1 text-slate-400">
            <Layers className="w-3 h-3 text-emerald-400" />
            <span>{capabilities.isStandalone ? 'PWA' : 'Browser'}</span>
          </div>
          <div className="flex items-center justify-center space-x-1">
            <span className={`w-2 h-2 rounded-full ${capabilities.isOnline ? 'bg-emerald-400' : 'bg-red-400 animate-ping'}`} />
            <span className={capabilities.isOnline ? 'text-emerald-400' : 'text-red-400'}>
              {capabilities.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* STATE: OFFLINE */}
          {currentState === 'OFFLINE' && (
            <div className="text-center space-y-4 animate-in fade-in duration-200">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl flex items-center justify-center mx-auto">
                <WifiOff className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-white">Modo Offline Detetado</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sem ligação à internet. As notificações e registos continuam salvos em IndexedDB local.
              </p>
              <button
                onClick={onEnterPortal}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors"
              >
                Continuar em Modo Offline
              </button>
            </div>
          )}

          {/* STATE: PIN_REQUIRED */}
          {currentState === 'PIN_REQUIRED' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-white">Sessão Protegida por PIN</h2>
                <p className="text-xs text-slate-400">
                  Digite o PIN da calculadora para desbloquear o portal:
                </p>
              </div>

              <form onSubmit={handlePinSubmit} className="space-y-4">
                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="• • • •"
                  className={`w-full text-center tracking-[1em] text-2xl py-3.5 bg-slate-950 border ${
                    pinError ? 'border-red-500 text-red-400 animate-shake' : 'border-slate-700 text-emerald-400'
                  } rounded-2xl focus:outline-none focus:border-emerald-500 font-mono`}
                />
                {pinError && (
                  <p className="text-[11px] text-red-400 text-center font-medium">
                    PIN incorreto. Tente '1234' ou '0000'.
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  Desbloquear Acesso
                </button>
              </form>
            </div>
          )}

          {/* STATE: INSTALL_REQUIRED */}
          {currentState === 'INSTALL_REQUIRED' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {capabilities.os === 'android' ? (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
                      <Smartphone className="w-7 h-7" />
                    </div>
                    <h2 className="text-base font-bold text-white">Instalar PWA no Android</h2>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Adicione a aplicação ao seu ecrã principal para execução direta e sem barras do navegador.
                    </p>
                  </div>

                  <button
                    onClick={handleAndroidInstall}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                    <span>Instalar no Telemóvel Agora</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
                      <Apple className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-base font-bold text-white">Instalar no iPhone (Safari)</h2>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                    <div className="flex items-start space-x-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        1
                      </span>
                      <span>Toque no botão <strong>Partilhar</strong> (<Share className="w-3.5 h-3.5 inline text-indigo-400" />) na barra inferior do Safari.</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        2
                      </span>
                      <span>Selecione <strong className="text-indigo-300">"Adicionar ao Ecrã Principal"</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-indigo-400" />).</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={onEnterPortal}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                Aceder no Navegador Sem Instalar
              </button>
            </div>
          )}

          {/* STATE: PAIRING */}
          {currentState === 'PAIRING' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-full">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Token de Emparelhamento: {pairingToken || '...'}</span>
                </div>
                <h2 className="text-base font-bold text-white mt-2">Digitalize para Emparelhar</h2>
                <p className="text-xs text-slate-400">
                  Aponte a câmara do Android para este QR Code. O Desktop desbloqueia em tempo real!
                </p>
              </div>

              {/* QR Code Container */}
              <div className="p-4 bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center max-w-[220px] mx-auto border-4 border-indigo-500/30 relative">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="Pairing QR Code" className="w-44 h-44 object-contain rounded-lg" />
                ) : (
                  <div className="w-44 h-44 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400 text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                  </div>
                )}
              </div>

              {/* Real-time Pairing status indicator */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center text-xs space-y-1">
                {pairingSession?.status === 'paired' ? (
                  <div className="text-emerald-400 font-bold flex items-center justify-center space-x-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Dispositivo Emparelhado! A Desbloquear...</span>
                  </div>
                ) : (
                  <div className="text-slate-400 flex items-center justify-center space-x-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    <span>A aguardar leitura pelo Android/iPhone...</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleManualPairing}
                  className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                >
                  Emparelhar Manualmente
                </button>
                <button
                  onClick={onEnterPortal}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer text-center"
                >
                  Ignorar e Entrar
                </button>
              </div>
            </div>
          )}

          {/* STATE: READY */}
          {currentState === 'READY' && (
            <div className="text-center space-y-5 animate-in fade-in duration-200">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Dispositivo Pronto & Sincronizado</h2>
                <p className="text-xs text-slate-400 mt-1">
                  O Portal Mobile está configurado com listeners Firestore em tempo real.
                </p>
              </div>

              <button
                onClick={onEnterPortal}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 hover:shadow-emerald-500/50 transition-all cursor-pointer"
              >
                Aceder ao Portal Principal
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-3.5 border-t border-slate-800 text-center flex items-center justify-between text-[11px] text-slate-500">
          <span>Portal TR Mobile v1.2</span>
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Engenharia Adaptativa</span>
          </span>
        </div>
      </div>
    </div>
  );
};
