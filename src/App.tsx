import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { TimelineView } from './components/TimelineView';
import { CloudStatusView } from './components/CloudStatusView';
import { DevicesView } from './components/DevicesView';
import { AnalyticsView } from './components/AnalyticsView';
import { FirestoreConfigView } from './components/FirestoreConfigView';
import { DeploymentGuideView } from './components/DeploymentGuideView';
import { EventSimulatorModal } from './components/EventSimulatorModal';
import { DisguisedCalculator } from './components/DisguisedCalculator';
import { CamouflageSettingsModal } from './components/CamouflageSettingsModal';
import { SmartInstaller } from './components/SmartInstaller';
import { PWAInstallNotificationBanner } from './components/PWAInstallNotificationBanner';
import { AdaptiveOnboardingView } from './components/AdaptiveOnboardingView';
import { RuntimeControlView } from './components/RuntimeControlView';
import { FounderConsoleView } from './components/FounderConsoleView';
import { FounderIDEWorkspace } from './components/workspaces/FounderIDEWorkspace';
import { PublicWorkspace } from './components/workspaces/PublicWorkspace';
import { useAppStateMachine } from './engine/appStateMachine';
import { CapabilityEngine } from './engine/CapabilityEngine';
import { useIdentity, IdentityEngine } from './engine/identityEngine';
import { AuthorityEngine } from './engine/authorityEngine';
import { PortalEvent, Device, FirestoreConfig, EventStats } from './types';
import { Bell, X } from 'lucide-react';
import {
  subscribeToEvents,
  subscribeToDevices,
  saveEventToFirestore,
  updateEventInFirestore,
  deleteEventFromFirestore,
  saveDeviceToFirestore,
  deleteDeviceFromFirestore,
  defaultFirestoreConfig
} from './lib/firebase';
import { registerServiceWorker, sendNativeNotification } from './lib/pushNotifications';

interface ToastItem {
  id: string;
  event: PortalEvent;
  createdAt: number;
}

const mockApps = [
  { app: 'WhatsApp', packageName: 'com.whatsapp', priority: 'critical', type: 'notification' },
  { app: 'Banco do Brasil', packageName: 'br.com.bb.app', priority: 'critical', type: 'notification' },
  { app: 'SMS', packageName: 'com.google.android.apps.messaging', priority: 'high', type: 'sms' },
  { app: 'Chamada Telefônica', packageName: 'com.google.android.dialer', priority: 'high', type: 'call' },
  { app: 'Nubank', packageName: 'com.nu.production', priority: 'critical', type: 'notification' },
  { app: 'Telegram', packageName: 'org.telegram.messenger', priority: 'normal', type: 'notification' },
  { app: 'Instagram', packageName: 'com.instagram.android', priority: 'low', type: 'notification' },
  { app: 'Gmail', packageName: 'com.google.android.gm', priority: 'normal', type: 'notification' },
  { app: 'Sistema', packageName: 'android', priority: 'low', type: 'system' }
];

const initialDevices: Device[] = [
  {
    deviceId: 'dev-pixel-8',
    userId: 'usr-default',
    uid: 'usr-default',
    name: 'Google Pixel 8 Pro',
    model: 'Pixel 8 Pro (Android 14)',
    osVersion: 'Android 14 (API 34)',
    lastSync: Date.now() - 2 * 60 * 1000,
    online: true,
    batteryLevel: 88,
    pairedAt: Date.now() - 7 * 24 * 3600 * 1000
  },
  {
    deviceId: 'dev-samsung-s23',
    userId: 'usr-default',
    uid: 'usr-default',
    name: 'Samsung Galaxy S23',
    model: 'SM-S911B (One UI 6)',
    osVersion: 'Android 14 (API 34)',
    lastSync: Date.now() - 45 * 60 * 1000,
    online: true,
    batteryLevel: 62,
    pairedAt: Date.now() - 14 * 24 * 3600 * 1000
  }
];

const initialEvents: PortalEvent[] = [
  {
    id: 'evt-101',
    userId: 'usr-default',
    uid: 'usr-default',
    deviceId: 'dev-pixel-8',
    deviceName: 'Google Pixel 8 Pro',
    app: 'WhatsApp',
    source: 'WhatsApp',
    packageName: 'com.whatsapp',
    title: 'Maria Silva',
    body: 'Enviei os relatórios financeiros do projeto para revisão. Consegue dar uma olhada?',
    text: 'Enviei os relatórios financeiros do projeto para revisão. Consegue dar uma olhada?',
    sender: 'Maria Silva',
    timestamp: Date.now() - 5 * 60 * 1000,
    priority: 'critical',
    type: 'notification',
    read: false,
    archived: false,
    favorite: true
  },
  {
    id: 'evt-102',
    userId: 'usr-default',
    uid: 'usr-default',
    deviceId: 'dev-pixel-8',
    deviceName: 'Google Pixel 8 Pro',
    app: 'Banco do Brasil',
    source: 'Banco do Brasil',
    packageName: 'br.com.bb.app',
    title: 'Pix Recebido',
    body: 'Você recebeu um Pix de R$ 450,00 de Carlos Santos.',
    text: 'Você recebeu um Pix de R$ 450,00 de Carlos Santos.',
    sender: 'Banco do Brasil',
    timestamp: Date.now() - 18 * 60 * 1000,
    priority: 'critical',
    type: 'notification',
    read: false,
    archived: false,
    favorite: false
  },
  {
    id: 'evt-103',
    userId: 'usr-default',
    uid: 'usr-default',
    deviceId: 'dev-samsung-s23',
    deviceName: 'Samsung Galaxy S23',
    app: 'SMS',
    source: 'SMS',
    packageName: 'com.google.android.apps.messaging',
    title: 'Código de Autenticação 2FA',
    body: 'Seu código de acesso temporário é 849-204. Válido por 5 minutos.',
    text: 'Seu código de acesso temporário é 849-204. Válido por 5 minutos.',
    sender: '+55 11 99887-1234',
    timestamp: Date.now() - 32 * 60 * 1000,
    priority: 'high',
    type: 'sms',
    read: true,
    archived: false,
    favorite: true
  }
];

export default function App() {
  // IdentityEngine central auth hook subscribing directly to Firebase Auth & Firestore user profile document
  const { user: authUser, profile: userProfile, loading: authLoading } = useIdentity();

  // Reactive role & claim verification directly from authenticated Firestore document users/{uid}
  const isFounderUser = userProfile?.role === 'founder' || userProfile?.authority === 'ROOT' || AuthorityEngine.hasClaim(userProfile, 'canDeploy');

  const [secretPin, setSecretPin] = useState<string>(() => {
    return localStorage.getItem('portal_camouflage_pin') || '12345';
  });
  const [calcTitle, setCalcTitle] = useState<string>(() => {
    return localStorage.getItem('portal_camouflage_title') || 'Calculadora Padrão';
  });
  const [startCamouflaged, setStartCamouflaged] = useState<boolean>(() => {
    return localStorage.getItem('portal_camouflage_start') === 'true';
  });
  const [hideUnlockBtn, setHideUnlockBtn] = useState<boolean>(() => {
    return localStorage.getItem('portal_camouflage_hide_btn') === 'true';
  });

  // Workspace Mode State: 'public' (User PWA Portal) vs 'founder' (Founder IDE)
  const [workspaceMode, setWorkspaceMode] = useState<'public' | 'founder'>('public');

  // Formal State Machine replacing scattered boolean flags
  const appStateMachine = useAppStateMachine(startCamouflaged);
  const activeTab = appStateMachine.state.activeTab;
  const setActiveTab = appStateMachine.setActiveTab;

  const handleSavePin = (pin: string) => {
    setSecretPin(pin);
    localStorage.setItem('portal_camouflage_pin', pin);
  };

  const handleSaveCalcTitle = (title: string) => {
    setCalcTitle(title);
    localStorage.setItem('portal_camouflage_title', title);
  };

  const handleSaveStartCamouflaged = (val: boolean) => {
    setStartCamouflaged(val);
    localStorage.setItem('portal_camouflage_start', String(val));
  };

  const handleSaveHideUnlockBtn = (val: boolean) => {
    setHideUnlockBtn(val);
    localStorage.setItem('portal_camouflage_hide_btn', String(val));
  };

  const [events, setEvents] = useState<PortalEvent[]>(initialEvents);
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(Date.now());
  const [firestoreConfig, setFirestoreConfig] = useState<FirestoreConfig>(defaultFirestoreConfig);
  const [githubRepo, setGithubRepo] = useState<string>(() => {
    return localStorage.getItem('portal_github_repo') || 'https://github.com/vitronishbo-wq/PortalTRMobile';
  });

  useEffect(() => {
    localStorage.setItem('portal_github_repo', githubRepo);
  }, [githubRepo]);

  useEffect(() => {
    CapabilityEngine.initInstallListener();
  }, []);

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Track event IDs to trigger real-time toasts on new items
  const knownEventIdsRef = useRef<Set<string>>(new Set(initialEvents.map((e) => e.id)));
  const initialLoadDoneRef = useRef(false);

  // Audio tone synthesizer for notification sound
  const playNotificationSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      // Ignore audio error if user hasn't interacted with page yet
    }
  }, []);

  // Register Service Worker on mount for Web Push and Offline capabilities
  useEffect(() => {
    registerServiceWorker();

    // Listen for notification clicks from Service Worker
    const handleSwMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'NOTIFICATION_CLICKED') {
        setActiveTab('timeline');
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
    };
  }, []);

  // Real-Time Firestore Subscription using onSnapshot (No HTTP polling)
  useEffect(() => {
    appStateMachine.setLoading(true);

    const unsubEvents = subscribeToEvents(firestoreConfig, (fetchedEvents, syncTimestamp) => {
      setLastSyncTime(syncTimestamp);

      if (fetchedEvents.length > 0) {
        setEvents(fetchedEvents);

        // Real-time toast & native Web Push notification detection for newly added events via onSnapshot
        if (initialLoadDoneRef.current) {
          const newEvents = fetchedEvents.filter((e) => !knownEventIdsRef.current.has(e.id));
          if (newEvents.length > 0) {
            playNotificationSound();
            const autoNotifySetting = localStorage.getItem('portal_auto_push_notify') !== 'false';

            newEvents.forEach((evt) => {
              const newToast: ToastItem = {
                id: evt.id + '-' + Date.now(),
                event: evt,
                createdAt: Date.now()
              };
              setToasts((prev) => [newToast, ...prev].slice(0, 5));

              // Trigger native browser notification via Service Worker / Web Push API
              if (autoNotifySetting) {
                sendNativeNotification(evt);
              }
            });
          }
        }

        fetchedEvents.forEach((e) => knownEventIdsRef.current.add(e.id));
      }

      initialLoadDoneRef.current = true;
      appStateMachine.setLoading(false);
    });

    const unsubDevices = subscribeToDevices(firestoreConfig, (fetchedDevices) => {
      if (fetchedDevices.length > 0) {
        setDevices(fetchedDevices);
      }
    });

    return () => {
      unsubEvents();
      unsubDevices();
    };
  }, [firestoreConfig, playNotificationSound]);

  // Toast Auto-dismiss
  useEffect(() => {
    if (toasts.length === 0) return;

    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(0, prev.length - 1));
    }, 5000);

    return () => clearTimeout(timer);
  }, [toasts]);

  const handleDismissToast = (toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  };

  // Handlers
  const handleToggleFavorite = async (id: string, current: boolean) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, favorite: !current } : e)));
    updateEventInFirestore(firestoreConfig, id, { favorite: !current });
  };

  const handleMarkRead = async (id: string, current: boolean) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, read: !current } : e)));
    updateEventInFirestore(firestoreConfig, id, { read: !current });
  };

  const handleMarkAllRead = async () => {
    setEvents((prev) => prev.map((e) => ({ ...e, read: true })));
    events.forEach((e) => {
      updateEventInFirestore(firestoreConfig, e.id, { read: true });
    });
  };

  const handleDeleteEvent = async (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    deleteEventFromFirestore(firestoreConfig, id);
  };

  const handleClearLocalCache = useCallback(() => {
    setEvents([]);
    setDevices([]);
    setToasts([]);
    knownEventIdsRef.current.clear();
    initialLoadDoneRef.current = false;
  }, []);

  const handleClearAllEvents = async () => {
    if (!window.confirm('Tem certeza que deseja apagar todos os eventos capturados?')) return;
    events.forEach((e) => deleteEventFromFirestore(firestoreConfig, e.id));
    handleClearLocalCache();
  };

  const handleAddDevice = async (deviceData: Partial<Device>) => {
    const newDevice: Device = {
      deviceId: deviceData.deviceId || `dev-${Date.now()}`,
      userId: deviceData.userId || deviceData.uid || 'usr-default',
      uid: deviceData.uid || 'usr-default',
      name: deviceData.name || 'Novo Dispositivo Android',
      model: deviceData.model || 'Android Device',
      osVersion: deviceData.osVersion || 'Android 14',
      lastSync: Date.now(),
      online: true,
      batteryLevel: deviceData.batteryLevel || 100,
      pairedAt: Date.now()
    };

    setDevices((prev) => [...prev, newDevice]);
    saveDeviceToFirestore(firestoreConfig, newDevice);
  };

  const handleRemoveDevice = async (id: string) => {
    setDevices((prev) => prev.filter((d) => d.deviceId !== id));
    deleteDeviceFromFirestore(firestoreConfig, id);
  };

  const handleSimulateCustomEvent = async (data: any) => {
    const newEvent: PortalEvent = {
      id: data.id || `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: data.userId || data.uid || 'usr-default',
      uid: data.uid || 'usr-default',
      deviceId: data.deviceId || 'dev-pixel-8',
      deviceName: data.deviceName || 'Google Pixel 8 Pro',
      app: data.app || 'WhatsApp',
      source: data.source || data.app || 'WhatsApp',
      packageName: data.packageName || 'com.whatsapp',
      title: data.title || 'Nova Notificação',
      body: data.body || data.text || 'Conteúdo da notificação capturada.',
      text: data.text || data.body || 'Conteúdo da notificação capturada.',
      sender: data.sender,
      timestamp: data.timestamp || Date.now(),
      priority: data.priority || 'normal',
      type: data.type || 'notification',
      read: false,
      archived: false,
      favorite: false
    };

    setEvents((prev) => [newEvent, ...prev]);
    knownEventIdsRef.current.add(newEvent.id);
    saveEventToFirestore(firestoreConfig, newEvent);
  };

  const handleSimulateRandomEvent = async () => {
    const sample = mockApps[Math.floor(Math.random() * mockApps.length)];
    const randomDevice = devices[Math.floor(Math.random() * devices.length)] || initialDevices[0];

    const sampleMessages: Record<string, { title: string; text: string; sender: string }> = {
      'WhatsApp': { title: 'Ana Beatriz', text: 'Cheguei no local do evento! Pode me mandar o comprovante?', sender: 'Ana Beatriz' },
      'Banco do Brasil': { title: 'Notificação de Saldo', text: 'Seu extrato mensal já está disponível para consulta no App BB.', sender: 'Banco do Brasil' },
      'SMS': { title: 'SMS Recebido', text: 'Seu código de segurança Mercado Pago é: 918204. Não compartilhe.', sender: '+55 11 98820-1122' },
      'Chamada Telefônica': { title: 'Chamada do Sistema', text: 'Chamada recebida e encerrada (Duração: 02 min 14 seg).', sender: '+55 11 3003-0000' },
      'Nubank': { title: 'Transferência Recebida', text: 'Você recebeu R$ 120,00 de Marcos Oliveira via Pix.', sender: 'Nubank' },
      'Telegram': { title: 'Alerta Firestore', text: 'Evento recebido instantaneamente via onSnapshot sem backend intermediário.', sender: 'Firestore Realtime' },
      'Instagram': { title: 'Novo Curtiu', text: 'lucas_dev curtiu a sua publicação na linha do tempo.', sender: 'Instagram' },
      'Gmail': { title: 'Confirmação de Sync', text: 'Sincronização em tempo real do Android com Firestore concluída com sucesso.', sender: 'notifications@firebase.com' },
      'Sistema': { title: 'Sincronização Concluída', text: 'Eventos sincronizados diretamente com o Firestore DB.', sender: 'Sistema' }
    };

    const msg = sampleMessages[sample.app] || { title: 'Nova Mensagem', text: 'Conteúdo do evento recebido no celular.', sender: 'Remetente' };

    const newEvent: PortalEvent = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: 'usr-default',
      uid: 'usr-default',
      deviceId: randomDevice.deviceId,
      deviceName: randomDevice.name,
      app: sample.app,
      source: sample.app,
      packageName: sample.packageName,
      title: msg.title,
      body: msg.text,
      text: msg.text,
      sender: msg.sender,
      timestamp: Date.now(),
      priority: sample.priority as any,
      type: sample.type as any,
      read: false,
      archived: false,
      favorite: false
    };

    setEvents((prev) => [newEvent, ...prev]);
    knownEventIdsRef.current.add(newEvent.id);
    saveEventToFirestore(firestoreConfig, newEvent);

    // Trigger toast & sound
    playNotificationSound();
    const newToast: ToastItem = {
      id: newEvent.id + '-' + Date.now(),
      event: newEvent,
      createdAt: Date.now()
    };
    setToasts((prev) => [newToast, ...prev].slice(0, 5));
  };

  // Compute Event Stats dynamically in memory
  const computedStats: EventStats = React.useMemo(() => {
    const appMap: Record<string, number> = {};
    const priorityMap: Record<string, number> = {};

    events.forEach((e) => {
      appMap[e.app] = (appMap[e.app] || 0) + 1;
      priorityMap[e.priority] = (priorityMap[e.priority] || 0) + 1;
    });

    const appDistribution = Object.keys(appMap).map((k) => ({ name: k, count: appMap[k] }));
    const priorityDistribution = Object.keys(priorityMap).map((k) => ({ name: k, count: priorityMap[k] }));

    const timelineData = Array.from({ length: 6 }).map((_, i) => {
      const hourLabel = `${(new Date().getHours() - (5 - i) + 24) % 24}:00`;
      return {
        time: hourLabel,
        count: Math.floor(Math.random() * 8) + 1
      };
    });

    return {
      totalEvents: events.length,
      unreadCount: events.filter((e) => !e.read).length,
      favoriteCount: events.filter((e) => e.favorite).length,
      deviceCount: devices.length,
      appDistribution,
      priorityDistribution,
      timelineData
    };
  }, [events, devices]);

  const unreadCount = computedStats.unreadCount;

  if (appStateMachine.isLocked) {
    return (
      <DisguisedCalculator
        onUnlock={appStateMachine.unlockApp}
        secretPin={secretPin}
        calcTitle={calcTitle}
        hideUnlockBtn={hideUnlockBtn}
      />
    );
  }

  if (appStateMachine.isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-mono">A carregar Portal TR Mobile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col selection:bg-indigo-500 selection:text-white relative">
      
      {/* Toast Notifications Floating Stack */}
      <div className="fixed top-5 right-5 z-50 space-y-2.5 max-w-sm w-full px-4 sm:px-0 pointer-events-none">
        {toasts.map((toast) => {
          const evt = toast.event;
          const isHigh = evt.priority === 'high' || evt.priority === 'critical';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-3.5 rounded-2xl border shadow-2xl transition-all duration-300 animate-in slide-in-from-top-3 flex items-start justify-between space-x-3 backdrop-blur-md ${
                isHigh
                  ? 'bg-rose-950/90 border-rose-500/50 text-rose-100 shadow-rose-950/40'
                  : 'bg-slate-900/95 border-indigo-500/40 text-slate-100 shadow-indigo-950/50'
              }`}
            >
              <div className="flex items-start space-x-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isHigh ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'
                  }`}
                >
                  <Bell className="w-4 h-4 animate-bounce" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs truncate">{evt.app || 'Notificação'}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                        isHigh ? 'bg-rose-500/30 text-rose-300' : 'bg-indigo-500/30 text-indigo-300'
                      }`}
                    >
                      {evt.priority || 'NORMAL'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white truncate">{evt.title}</p>
                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-tight">
                    {evt.text}
                  </p>
                  <div className="text-[10px] text-slate-400 font-mono pt-1">
                    {new Date(evt.timestamp).toLocaleTimeString()} • {evt.deviceName}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDismissToast(toast.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Top Navbar */}
      <Navbar
        workspaceMode={workspaceMode}
        setWorkspaceMode={setWorkspaceMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadCount={unreadCount}
        onSimulateEvent={handleSimulateRandomEvent}
        onLockCamouflage={appStateMachine.lockApp}
        onOpenCamouflageSettings={() => appStateMachine.setCamouflageModalOpen(true)}
      />

      {/* PWA Install Notification Banner - ALWAYS triggered when opened via web link */}
      <PWAInstallNotificationBanner
        appName={calcTitle}
        onOpenFullInstaller={() => {
          setWorkspaceMode('founder');
          appStateMachine.setActiveTab('installer');
        }}
      />

      {/* Main Content Body */}
      <main className="flex-1 w-full mx-auto py-4 px-4 sm:px-6 lg:px-8">
        {workspaceMode === 'public' ? (
          <PublicWorkspace onOpenFounderWorkspace={() => setWorkspaceMode('founder')} />
        ) : (
          <FounderIDEWorkspace />
        )}
      </main>

      {/* Custom Simulator Modal */}
      <EventSimulatorModal
        isOpen={appStateMachine.state.isSimulatorOpen}
        onClose={() => appStateMachine.setSimulatorOpen(false)}
        onSimulate={handleSimulateCustomEvent}
      />

      {/* Camouflage Settings Modal */}
      <CamouflageSettingsModal
        isOpen={appStateMachine.state.isCamouflageModalOpen}
        onClose={() => appStateMachine.setCamouflageModalOpen(false)}
        secretPin={secretPin}
        onSavePin={handleSavePin}
        startCamouflaged={startCamouflaged}
        onSaveStartCamouflaged={handleSaveStartCamouflaged}
        hideUnlockBtn={hideUnlockBtn}
        onSaveHideUnlockBtn={handleSaveHideUnlockBtn}
        calcTitle={calcTitle}
        onSaveCalcTitle={handleSaveCalcTitle}
      />


      {/* Footer */}
      <footer className="bg-slate-900/80 border-t border-slate-800 py-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Portal Mobile • Sincronização Direta Android ↔ Firestore 24/7</span>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="text-emerald-400 font-semibold">● Firestore Realtime (onSnapshot)</span>
            <span>•</span>
            <span className="text-indigo-400 font-semibold">● Firebase Auth & Hosting</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
