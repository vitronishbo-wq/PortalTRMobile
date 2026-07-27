import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { TimelineView } from './components/TimelineView';
import { KeepAliveView } from './components/KeepAliveView';
import { DevicesView } from './components/DevicesView';
import { AnalyticsView } from './components/AnalyticsView';
import { FirestoreConfigView } from './components/FirestoreConfigView';
import { DeploymentGuideView } from './components/DeploymentGuideView';
import { EventSimulatorModal } from './components/EventSimulatorModal';
import { DisguisedCalculator } from './components/DisguisedCalculator';
import { PortalEvent, Device, KeepAliveConfig, PingLog, FirestoreConfig, EventStats } from './types';
import { Bell, X, ShieldAlert, Sparkles, Smartphone, CheckCircle, AlertTriangle } from 'lucide-react';

interface ToastItem {
  id: string;
  event: PortalEvent;
  createdAt: number;
}

export default function App() {
  const [isCamouflaged, setIsCamouflaged] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('timeline');
  const [events, setEvents] = useState<PortalEvent[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [keepAliveConfig, setKeepAliveConfig] = useState<KeepAliveConfig | null>(null);
  const [pingLogs, setPingLogs] = useState<PingLog[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [firestoreConfig, setFirestoreConfig] = useState<FirestoreConfig>({
    apiKey: 'AIzaSyA_SampleKeyPortalMobile2026',
    authDomain: 'portal-mobile-demo.firebaseapp.com',
    projectId: 'portal-mobile-demo',
    storageBucket: 'portal-mobile-demo.appspot.com',
    messagingSenderId: '1029384756',
    appId: '1:1029384756:web:abcd1234efgh5678',
    connected: true,
    mode: 'local'
  });

  const [loading, setLoading] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Track event IDs to trigger real-time toasts on new items
  const knownEventIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);
  const lastAlertedPingTimeRef = useRef<number | null>(null);

  // Audio tone synthesizer for notification sound
  const playNotificationSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

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

  // Check latency against configured threshold and trigger critical toast alert
  const checkLatencyAndAlert = useCallback((cfg: KeepAliveConfig) => {
    if (!cfg || cfg.lastLatencyMs === null || !cfg.lastPingTime) return;
    const threshold = cfg.latencyThresholdMs || 1500;

    if (cfg.lastLatencyMs > threshold && lastAlertedPingTimeRef.current !== cfg.lastPingTime) {
      lastAlertedPingTimeRef.current = cfg.lastPingTime;
      
      playNotificationSound();
      
      const alertEvent: PortalEvent = {
        id: `coldstart-${cfg.lastPingTime}`,
        uid: 'usr-default',
        deviceId: 'render-server',
        deviceName: 'Servidor Render',
        app: 'Alerta Keep-Alive',
        packageName: 'com.render.coldstart',
        title: '⚠️ Latência Elevada Detectada',
        text: `Tempo de resposta do Render foi de ${cfg.lastLatencyMs}ms (Limiar: ${threshold}ms). Possível cold-start do servidor em andamento!`,
        sender: 'Sistema de Infraestrutura',
        timestamp: cfg.lastPingTime,
        priority: 'critical',
        type: 'system',
        read: false,
        favorite: false
      };

      const newToast: ToastItem = {
        id: `toast-coldstart-${cfg.lastPingTime}-${Date.now()}`,
        event: alertEvent,
        createdAt: Date.now()
      };

      setToasts((prev) => [newToast, ...prev].slice(0, 5));
    }
  }, [playNotificationSound]);

  // Fetch Events & Devices
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const [resEvts, resDevs, resStats, resKeep] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/devices'),
        fetch('/api/stats'),
        fetch('/api/keep-alive')
      ]);

      if (resEvts.ok) {
        const dataEvts = await resEvts.json();
        const fetchedEvents: PortalEvent[] = dataEvts.events || [];
        setEvents(fetchedEvents);

        // Detect new events for real-time toast notifications
        if (initialLoadDoneRef.current) {
          const newEvents = fetchedEvents.filter((e) => !knownEventIdsRef.current.has(e.id));
          if (newEvents.length > 0) {
            playNotificationSound();
            newEvents.forEach((evt) => {
              const newToast: ToastItem = {
                id: evt.id + '-' + Date.now(),
                event: evt,
                createdAt: Date.now()
              };
              setToasts((prev) => [newToast, ...prev].slice(0, 5));
            });
          }
        }

        // Update known IDs
        fetchedEvents.forEach((e) => knownEventIdsRef.current.add(e.id));
        initialLoadDoneRef.current = true;
      }

      if (resDevs.ok) {
        const dataDevs = await resDevs.json();
        setDevices(dataDevs || []);
      }

      if (resStats.ok) {
        const dataStats = await resStats.json();
        setStats(dataStats);
      }

      if (resKeep.ok) {
        const dataKeep = await resKeep.json();
        setKeepAliveConfig(dataKeep.config);
        setPingLogs(dataKeep.logs || []);
        if (dataKeep.config) {
          checkLatencyAndAlert(dataKeep.config);
        }
      }
    } catch (err) {
      console.error('Error fetching portal data:', err);
    } finally {
      setLoading(false);
    }
  }, [playNotificationSound, checkLatencyAndAlert]);

  // Polling every 4s for instant real-time updates
  useEffect(() => {
    fetchEvents();

    const interval = setInterval(() => {
      fetchEvents();
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchEvents]);

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
    try {
      await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorite: !current })
      });
    } catch (e) {
      console.error('Error updating favorite:', e);
    }
  };

  const handleMarkRead = async (id: string, current: boolean) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, read: !current } : e)));
    try {
      await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: !current })
      });
    } catch (e) {
      console.error('Error updating read status:', e);
    }
  };

  const handleMarkAllRead = async () => {
    setEvents((prev) => prev.map((e) => ({ ...e, read: true })));
    try {
      await fetch('/api/events/read-all', { method: 'POST' });
    } catch (e) {
      console.error('Error marking all read:', e);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    try {
      await fetch(`/api/events/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Error deleting event:', e);
    }
  };

  const handleClearAllEvents = async () => {
    if (!window.confirm('Tem certeza que deseja apagar todos os eventos capturados?')) return;
    setEvents([]);
    try {
      await fetch('/api/events', { method: 'DELETE' });
    } catch (e) {
      console.error('Error clearing events:', e);
    }
  };

  const handleTriggerPing = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/keep-alive/trigger', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setKeepAliveConfig(data.config);
        setPingLogs((prev) => [data.log, ...prev].slice(0, 50));
        if (data.config) {
          checkLatencyAndAlert(data.config);
        }
      }
    } catch (e) {
      console.error('Error triggering ping:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateKeepAliveConfig = async (newCfg: Partial<KeepAliveConfig>) => {
    try {
      const res = await fetch('/api/keep-alive/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCfg)
      });
      if (res.ok) {
        const data = await res.json();
        setKeepAliveConfig(data.config);
        if (data.config) {
          checkLatencyAndAlert(data.config);
        }
      }
    } catch (e) {
      console.error('Error updating config:', e);
    }
  };

  const handleClearLogs = async () => {
    setPingLogs([]);
    try {
      await fetch('/api/keep-alive/logs', { method: 'DELETE' });
    } catch (e) {
      console.error('Error clearing logs:', e);
    }
  };

  const handleAddDevice = async (deviceData: Partial<Device>) => {
    try {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceData)
      });
      if (res.ok) {
        const data = await res.json();
        setDevices((prev) => [...prev, data.device]);
      }
    } catch (e) {
      console.error('Error adding device:', e);
    }
  };

  const handleRemoveDevice = async (id: string) => {
    setDevices((prev) => prev.filter((d) => d.deviceId !== id));
    try {
      await fetch(`/api/devices/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Error removing device:', e);
    }
  };

  const handleSimulateCustomEvent = async (data: any) => {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const resData = await res.json();
        setEvents((prev) => [resData.event, ...prev]);
      }
    } catch (e) {
      console.error('Error simulating event:', e);
    }
  };

  const handleSimulateRandomEvent = async () => {
    try {
      const res = await fetch('/api/simulator/generate', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setEvents((prev) => [data.event, ...prev]);
      }
    } catch (e) {
      console.error('Error generating random event:', e);
    }
  };

  const unreadCount = events.filter((e) => !e.read).length;

  if (isCamouflaged) {
    return <DisguisedCalculator onUnlock={() => setIsCamouflaged(false)} secretPin="12345" />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col selection:bg-indigo-500 selection:text-white relative">
      
      {/* Toast Notifications Floating Stack */}
      <div className="fixed top-5 right-5 z-50 space-y-2.5 max-w-sm w-full px-4 sm:px-0 pointer-events-none">
        {toasts.map((toast) => {
          const evt = toast.event;
          const isHigh = evt.priority === 'HIGH' || evt.priority === 'CRITICAL';

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
                    <span className="font-bold text-xs truncate">{evt.appName || 'Notificação'}</span>
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
                    {evt.content}
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
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        keepAliveConfig={keepAliveConfig}
        unreadCount={unreadCount}
        onSimulateEvent={handleSimulateRandomEvent}
        onLockCamouflage={() => setIsCamouflaged(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'timeline' && (
          <TimelineView
            events={events}
            devices={devices}
            loading={loading}
            onRefresh={fetchEvents}
            onToggleFavorite={handleToggleFavorite}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
            onDeleteEvent={handleDeleteEvent}
            onClearAll={handleClearAllEvents}
          />
        )}

        {activeTab === 'keepalive' && (
          <KeepAliveView
            config={keepAliveConfig}
            logs={pingLogs}
            onTriggerPing={handleTriggerPing}
            onUpdateConfig={handleUpdateKeepAliveConfig}
            onClearLogs={handleClearLogs}
            loading={loading}
          />
        )}

        {activeTab === 'devices' && (
          <DevicesView
            devices={devices}
            onAddDevice={handleAddDevice}
            onRemoveDevice={handleRemoveDevice}
            onSimulateEvent={handleSimulateRandomEvent}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView stats={stats} />
        )}

        {activeTab === 'firestore' && (
          <FirestoreConfigView
            config={firestoreConfig}
            onSaveConfig={(cfg) => setFirestoreConfig(cfg)}
          />
        )}

        {activeTab === 'ritual' && (
          <DeploymentGuideView />
        )}
      </main>

      {/* Custom Simulator Modal */}
      <EventSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSimulate={handleSimulateCustomEvent}
      />

      {/* Footer */}
      <footer className="bg-slate-900/80 border-t border-slate-800 py-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Portal Mobile • Sistema de Monitoramento & Sincronização 24/7</span>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="text-emerald-400 font-semibold">● Render Keep-Alive Ativo</span>
            <span>•</span>
            <span className="text-indigo-400 font-semibold">● Firestore Sincronizado</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
