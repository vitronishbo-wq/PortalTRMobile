import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { CapabilityEngine, OEMBrand, OEMDeepLink } from '../engine/CapabilityEngine';
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
  Globe,
  ArrowRight,
  Activity,
  Layers3,
  CheckSquare,
  Sliders,
  CheckCircle,
  PlayCircle
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

  // OEM DeepLink Permission Queue state
  const [selectedOEM, setSelectedOEM] = useState<OEMBrand>('xiaomi');
  const [permissionQueue, setPermissionQueue] = useState<OEMDeepLink[]>(
    CapabilityEngine.getOEMDeepLinks('xiaomi')
  );
  const [activeQueueStep, setActiveQueueStep] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'flow' | 'orchestrator'>('orchestrator');

  // Re-evaluate State Machine
  const currentState: PortalState = StateMachine.evaluateState({
    capabilities,
    hasPairedDevices,
    isAuthenticated: true,
    isPinUnlocked,
    flags
  });

  // Update OEM DeepLinks when OEM selected changes
  useEffect(() => {
    setPermissionQueue(CapabilityEngine.getOEMDeepLinks(selectedOEM));
    setActiveQueueStep(0);
  }, [selectedOEM]);

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

  const handleGrantPermissionStep = (index: number) => {
    setPermissionQueue((prev) =>
      prev.map((item, i) => (i === index ? { ...item, status: 'granted' } : item))
    );
    if (index < permissionQueue.length - 1) {
      setActiveQueueStep(index + 1);
    }
  };

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-2xl z-10 my-4">
        {/* Header Engine Banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 p-5 text-center text-white relative">
          <div className="inline-flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20">
            <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Zero-Touch Provisioning Orchestrator</span>
          </div>
          <h1 className="text-xl font-black mt-2 tracking-tight">{appName}</h1>
          <p className="text-xs text-indigo-100 mt-0.5">
            Agente Residente Autônomo • Fila Sequencial de Permissões OEM
          </p>

          {/* Mode Switcher */}
          <div className="flex items-center justify-center space-x-2 mt-3">
            <button
              onClick={() => setViewMode('orchestrator')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'orchestrator'
                  ? 'bg-white text-slate-900 shadow'
                  : 'bg-black/30 text-white hover:bg-black/50'
              }`}
            >
              Motor Zero-Touch
            </button>
            <button
              onClick={() => setViewMode('flow')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'flow'
                  ? 'bg-white text-slate-900 shadow'
                  : 'bg-black/30 text-white hover:bg-black/50'
              }`}
            >
              Fluxo Adaptativo
            </button>
          </div>
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

        {/* VIEW MODE: ORCHESTRATOR */}
        {viewMode === 'orchestrator' ? (
          <div className="p-6 space-y-6">
            {/* OEM Selector */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200 flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  <span>Fabricante / Perfil OEM Detetado:</span>
                </span>
                <span className="text-emerald-400 font-mono font-bold uppercase">{selectedOEM}</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs">
                {(['xiaomi', 'samsung', 'pixel', 'oppo'] as OEMBrand[]).map((oem) => (
                  <button
                    key={oem}
                    onClick={() => setSelectedOEM(oem)}
                    className={`py-2 px-3 rounded-xl font-bold uppercase text-[11px] border transition-all cursor-pointer ${
                      selectedOEM === oem
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {oem}
                  </button>
                ))}
              </div>
            </div>

            {/* Permission Queue - DeepLink Sequence */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Fila Sequencial de Permissões (DeepLinks Nativo)</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  {permissionQueue.filter((p) => p.status === 'granted').length}/{permissionQueue.length} Concluído
                </span>
              </div>

              <div className="space-y-2.5">
                {permissionQueue.map((perm, idx) => {
                  const isGranted = perm.status === 'granted';
                  const isActive = idx === activeQueueStep;

                  return (
                    <div
                      key={perm.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isGranted
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : isActive
                          ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10'
                          : 'bg-slate-950/50 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                              isGranted
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : isActive
                                ? 'bg-indigo-600 text-white animate-bounce'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {isGranted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-100">{perm.title}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">{perm.description}</p>
                            <span className="text-[10px] text-indigo-400 font-mono block mt-1">
                              Intent: {perm.intentAction}
                            </span>
                          </div>
                        </div>

                        {!isGranted && (
                          <button
                            onClick={() => handleGrantPermissionStep(idx)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0"
                          >
                            Disparar Intent
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Silent Resident Mode Overview */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-emerald-400 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Modo Agente Residente Silencioso Ativo</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Após este fluxo zero-touch, o agente passa a executar em background. O envio de chamadas (0ms), SMS (0ms) e notificações (100ms) é processado via <strong className="text-indigo-300">BatchingSyncEngine</strong> com registos em tempo real.
              </p>
            </div>

            <button
              onClick={onEnterPortal}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              Concluir & Entrar no Portal
            </button>
          </div>
        ) : (
          /* VIEW MODE: ADAPTIVE FLOW */
          <div className="p-6 space-y-6">
            {currentState === 'OFFLINE' && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl flex items-center justify-center mx-auto">
                  <WifiOff className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-bold text-white">Modo Offline Detetado</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sem ligação à internet. As notificações continuam salvas no IndexedDB local.
                </p>
                <button
                  onClick={onEnterPortal}
                  className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors"
                >
                  Continuar em Modo Offline
                </button>
              </div>
            )}

            {currentState === 'PIN_REQUIRED' && (
              <div className="space-y-5">
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

            {currentState === 'PAIRING' && (
              <div className="space-y-5">
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

                <div className="p-4 bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center max-w-[220px] mx-auto border-4 border-indigo-500/30 relative">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="Pairing QR Code" className="w-44 h-44 object-contain rounded-lg" />
                  ) : (
                    <div className="w-44 h-44 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400 text-xs">
                      <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
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

            {currentState === 'READY' && (
              <div className="text-center space-y-5">
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
        )}

        {/* Footer */}
        <div className="bg-slate-950 p-3.5 border-t border-slate-800 text-center flex items-center justify-between text-[11px] text-slate-500">
          <span>Portal TR Mobile v1.2</span>
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Engenharia Zero-Touch</span>
          </span>
        </div>
      </div>
    </div>
  );
};

