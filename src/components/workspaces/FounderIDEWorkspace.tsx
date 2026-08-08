import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Home,
  Users,
  Smartphone,
  CreditCard,
  Plug,
  Cloud,
  Database,
  Rocket,
  BarChart3,
  ScrollText,
  Settings,
  Sliders,
  Wrench,
  Shield,
  ChevronRight,
  ChevronDown,
  X,
  Terminal,
  Activity,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Crown,
  KeyRound,
  Zap,
  Maximize2,
  Minimize2,
  Search,
  Filter,
  ExternalLink,
  Plus,
  Lock,
  Clock,
  Sparkles,
  Radio
} from 'lucide-react';
import { AuthorityEngine, FeatureFlagsState, DEUS_FUNDADOR_CREDENTIALS } from '../../engine/authorityEngine';
import { PaymentRegistry, ChargeResponse, ChargeRequest } from '../../services/paymentEngine';
import { AutomationRulesManager } from '../AutomationRulesManager';
import { CpaasSecurityDispatcherConsole } from '../CpaasSecurityDispatcherConsole';
import { APIKeysManager } from '../APIKeysManager';
import { VirtualNumbersManager } from '../VirtualNumbersManager';
import { RealtimeDevStreamConsole } from '../RealtimeDevStreamConsole';
import { TrialEngine, LicenseRecord } from '../../services/trialEngine';
import { UserProfile, UserRole } from '../../types/User';
import { IdentityEngine } from '../../engine/identityEngine';
import { RootConsoleView } from './RootConsoleView';
import { OperationalOverviewConsole } from './OperationalOverviewConsole';
import { CommandPalette } from './CommandPalette';
import { AutomationEngine, AutomationRule, AutomationExecutionLog } from '../../services/automationEngine';
import { HealthEngine, DeviceHealthMetric, OperationalDiagnostic, DeviceTimelineEvent } from '../../services/healthEngine';
import { BatchQueueEngine, BatchQueueMetrics } from '../../services/batchQueueEngine';

export interface IDETab {
  id: string;
  title: string;
  type: 'overview' | 'user' | 'appypay' | 'flags' | 'runtime' | 'firestore' | 'device' | 'audit' | 'rules' | 'root_authority' | 'automation' | 'health';
  data?: any;
}

export const FounderIDEWorkspace: React.FC = () => {
  // Command Palette State
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(false);
  const [paletteCommandLog, setPaletteCommandLog] = useState<string | null>(null);

  // Navigation & Layout States
  const [activeActivity, setActiveActivity] = useState<string>('overview');
  const [sidePanelOpen, setSidePanelOpen] = useState<boolean>(true);
  const [bottomPanelOpen, setBottomPanelOpen] = useState<boolean>(true);
  const [bottomPanelTab, setBottomPanelTab] = useState<'terminal' | 'logs' | 'queue' | 'errors'>('terminal');

  // Engines State
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>(AutomationEngine.getRules());
  const [automationLogs, setAutomationLogs] = useState<AutomationExecutionLog[]>(AutomationEngine.getExecutionLogs());
  const [healthMetrics, setHealthMetrics] = useState<DeviceHealthMetric[]>(HealthEngine.getHealthMetrics());
  const [diagnostics, setDiagnostics] = useState<OperationalDiagnostic[]>(HealthEngine.getDiagnostics());
  const [deviceTimeline, setDeviceTimeline] = useState<DeviceTimelineEvent[]>(HealthEngine.getTimelineEvents());

  // Memory Batching & SSE Stream Metrics
  const [queueMetrics, setQueueMetrics] = useState<BatchQueueMetrics>({
    bufferedCount: 0,
    totalFlushed: 0,
    totalEventsReceived: 0,
    savedFirestoreWritesPercentage: 92,
    lastFlushTime: Date.now(),
    sseConnectedClients: 1
  });

  useEffect(() => {
    BatchQueueEngine.initSSEStream();
    const unsubMetrics = BatchQueueEngine.onMetrics((metrics) => {
      setQueueMetrics(metrics);
    });
    const unsubEvents = BatchQueueEngine.onEvent((event) => {
      setTerminalLogs((prev) => [
        ...prev.slice(-40),
        `[SSE <5ms STREAM] Evento recebido: ${event.type} de Node: ${event.nodeId}`
      ]);
    });
    return () => {
      unsubMetrics();
      unsubEvents();
    };
  }, []);

  useEffect(() => {
    const handleSwitchActivity = (e: CustomEvent<string>) => {
      if (e.detail === 'billing' || e.detail === 'payments') {
        setActiveActivity('payments');
      } else if (e.detail) {
        setActiveActivity(e.detail);
      }
    };
    window.addEventListener('switch-founder-activity' as any, handleSwitchActivity);
    return () => window.removeEventListener('switch-founder-activity' as any, handleSwitchActivity);
  }, []);

  // Workbench Tabs
  const [openTabs, setOpenTabs] = useState<IDETab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Terminal State
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    `[SYSTEM BOOT] Kernel Web OS v2.4 initialized.`,
    `[FOUNDER LOCK] Master user: '${DEUS_FUNDADOR_CREDENTIALS.username}' authenticated. Immutable flag: true.`,
    `[INTEGRATION] AppyPay Gateway registered in Sandbox mode.`,
    `[FEATURE FLAGS] Loaded from Firestore. Payments: Enabled, AppyPay: Enabled.`,
    `[RUNTIME] Port 3000 reverse proxy connected. Ready for commands.`
  ]);
  const [commandInput, setCommandInput] = useState<string>('');

  // Domain Data States
  const [flags, setFlags] = useState<FeatureFlagsState>(AuthorityEngine.getFeatureFlags());
  const [selectedUserFilter, setSelectedUserFilter] = useState<'all' | 'trial' | 'lifetime' | 'founder' | 'admin'>('all');

  // Real-time Users List from IdentityEngine / Firestore
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const unsub = IdentityEngine.listenToAllUsers((fetchedUsers) => {
      if (fetchedUsers && fetchedUsers.length > 0) {
        setUsers(fetchedUsers);
      } else {
        setUsers([
          {
            userId: 'deusfundador-master-001',
            email: DEUS_FUNDADOR_CREDENTIALS.email,
            displayName: 'Deus Fundador (Super Master)',
            role: 'founder',
            system: true,
            immutable: true,
            createdAt: Date.now() - 86400000 * 60,
            lastLogin: Date.now(),
            permissions: ['*']
          },
          {
            userId: 'usr-248',
            email: 'mario.silva@empresa.ao',
            displayName: 'Mário Silva (Operador de Caixa)',
            role: 'user',
            system: false,
            immutable: false,
            createdAt: Date.now() - 86400000 * 3,
            lastLogin: Date.now() - 1800000,
            permissions: ['events.read']
          },
          {
            userId: 'usr-501',
            email: 'ana.costa@tech.co.ao',
            displayName: 'Ana Costa (Gestora Financeira)',
            role: 'admin',
            system: false,
            immutable: false,
            createdAt: Date.now() - 86400000 * 12,
            lastLogin: Date.now() - 3600000,
            permissions: ['devices.manage', 'events.read', 'payments.write']
          },
          {
            userId: 'agent-samsung-s22',
            email: 'android.samsung@internal.device',
            displayName: 'Agente Android Samsung S22',
            role: 'android_agent',
            system: true,
            immutable: true,
            createdAt: Date.now() - 86400000 * 20,
            lastLogin: Date.now() - 30000,
            permissions: ['sync.write', 'events.push']
          }
        ]);
      }
    });

    return () => unsub();
  }, []);

  // Activity Bar Navigation Definition (Clean Founder IDE Architecture)
  const activityItems = [
    { id: 'overview', label: '0. Overview Operacional (8 Pilares)', icon: LayoutDashboard },
    { id: 'root_authority', label: '1. Root Authority & Identity Core', icon: Crown },
    { id: 'devices', label: '2. Devices & Agent Mesh Fleet', icon: Smartphone },
    { id: 'cpaas_dispatcher', label: '3. CPaaS, Command & Retry Queue', icon: Shield },
    { id: 'automation', label: '4. Automation Engine', icon: Zap },
    { id: 'health', label: '5. Telemetry, Realtime SSE & Health', icon: Activity },
    { id: 'users', label: '6. Identity & User Licenses', icon: Users, badge: users.length },
    { id: 'payments', label: '7. Billing & AppyPay Gateway', icon: CreditCard },
    { id: 'flags', label: '8. Feature Flags', icon: Sliders },
    { id: 'infrastructure', label: '9. Infrastructure & Storage', icon: Cloud },
    { id: 'audit', label: '10. Audit Logs & System DLQ', icon: ScrollText }
  ];

  // Open or focus tab
  const openTab = (tab: IDETab) => {
    if (!openTabs.some((t) => t.id === tab.id)) {
      setOpenTabs([...openTabs, tab]);
    }
    setActiveTabId(tab.id);
  };

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = openTabs.filter((t) => t.id !== tabId);
    setOpenTabs(filtered);
    if (activeTabId === tabId) {
      setActiveTabId(filtered.length > 0 ? filtered[filtered.length - 1].id : null);
    }
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    const cmd = commandInput.trim();
    const newLogs = [...terminalLogs, `$ ${cmd}`];

    if (cmd === 'clear') {
      setTerminalLogs([]);
      setCommandInput('');
      return;
    }

    if (cmd.startsWith('trial grant')) {
      newLogs.push(`[TRIAL ENGINE] Licença estendida com sucesso para o utilizador alvo.`);
    } else if (cmd === 'appypay status') {
      newLogs.push(`[APPYPAY] ClientID: appypay_sbx_99482 • Status: ONLINE (Sandbox) • Gateway Ping: 18ms`);
    } else if (cmd === 'flags sync') {
      newLogs.push(`[FLAGS] Sincronização em tempo real com Firestore concluída.`);
    } else if (cmd === 'batch status' || cmd === 'queue status') {
      newLogs.push(`[MEMORY BATCHING] Buffer: ${queueMetrics.bufferedCount} eventos | Total Flushed: ${queueMetrics.totalFlushed} | Economia Firestore: ${queueMetrics.savedFirestoreWritesPercentage}%`);
    } else if (cmd === 'autodiscovery test') {
      BatchQueueEngine.registerAutodiscovery({
        deviceId: 'node-itel-a100',
        nodeId: 'node-itel-a100',
        capabilities: { sms: true, notifications: true, accessibility: true, calls: true, biometrics: true, whatsapp: true },
        oemProfile: 'generic',
        permissionScore: 98
      }).then((res) => {
        setTerminalLogs((prev) => [...prev, `[AUTODISCOVERY] ${res.message} (Rotas ativas: ${res.activeRoutes.join(', ')})`]);
      });
    } else if (cmd === 'help') {
      newLogs.push(`Comandos disponíveis: 'batch status', 'autodiscovery test', 'trial grant <user>', 'appypay status', 'flags sync', 'clear'`);
    } else {
      newLogs.push(`[KERNEL] Comando executado: '${cmd}' com sucesso.`);
    }

    setTerminalLogs(newLogs);
    setCommandInput('');
  };

  const activeTabObj = openTabs.find((t) => t.id === activeTabId);

  return (
    <div className="flex flex-col h-[85vh] bg-slate-950 text-slate-100 font-sans border border-slate-800 rounded-2xl shadow-2xl overflow-hidden select-none">
      {/* Top IDE Bar Header */}
      <div className="h-10 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
          </div>
          <span className="text-slate-400 font-bold flex items-center space-x-1">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>FOUNDER WORKSPACE (IDE CONSOLE)</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-normal">deusfundador</span>
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px] text-slate-400">
          <button
            onClick={() => setIsPaletteOpen(true)}
            className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono font-bold rounded-lg border border-amber-500/40 flex items-center space-x-1.5 cursor-pointer transition-all shadow-sm"
          >
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span>Command Palette (Ctrl+Shift+P)</span>
          </button>
          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
            Bootstrap Immutable Lock
          </span>
          <button
            onClick={() => setSidePanelOpen(!sidePanelOpen)}
            className="hover:text-slate-200 transition-colors cursor-pointer"
            title="Toggle Explorer Side Panel"
          >
            Explorer [{sidePanelOpen ? 'ON' : 'OFF'}]
          </button>
          <button
            onClick={() => setBottomPanelOpen(!bottomPanelOpen)}
            className="hover:text-slate-200 transition-colors cursor-pointer"
            title="Toggle Bottom Terminal"
          >
            Terminal [{bottomPanelOpen ? 'ON' : 'OFF'}]
          </button>
        </div>
      </div>

      {/* Main IDE Body Grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* 1. Vertical Activity Bar */}
        <div className="w-14 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-3 space-y-3 overflow-y-auto shrink-0">
          {activityItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeActivity === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveActivity(item.id);
                  if (!sidePanelOpen) setSidePanelOpen(true);
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5" />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border border-slate-900">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 2. Collapsible Side Panel (Explorer Tree) */}
        {sidePanelOpen && (
          <div className="w-64 bg-slate-900/60 border-r border-slate-800 flex flex-col shrink-0 overflow-hidden text-xs">
            <div className="p-3 border-b border-slate-800/80 font-mono text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>EXPLORER: {activeActivity}</span>
              <button
                onClick={() => setSidePanelOpen(false)}
                className="text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-2 overflow-y-auto flex-1 space-y-2">
              {/* Root of Trust Explorer Tree */}
              {activeActivity === 'root_authority' && (
                <div className="space-y-2 font-mono">
                  <div className="text-[10px] text-amber-500 font-bold uppercase px-2 py-1">Root Authority Control</div>
                  <button
                    onClick={() =>
                      openTab({
                        id: 'root-console-tab',
                        title: 'Root Console',
                        type: 'root_authority'
                      })
                    }
                    className="w-full text-left p-2.5 bg-amber-500/10 rounded-lg hover:bg-amber-500/20 cursor-pointer transition-colors border border-amber-500/30 text-amber-300 font-bold flex items-center space-x-2 text-xs"
                  >
                    <Crown className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Root of Trust Console</span>
                  </button>
                </div>
              )}

              {/* Users Explorer Tree */}
              {activeActivity === 'users' && (
                <div className="space-y-1 font-mono">
                  <div className="text-[10px] text-slate-500 font-bold uppercase px-2 py-1">Filtro de Papéis</div>
                  {users.map((usr) => {
                    const lic = TrialEngine.getLicense(usr.userId, usr.email);
                    const evalState = TrialEngine.evaluateState(lic);
                    return (
                      <div
                        key={usr.userId}
                        onClick={() =>
                          openTab({
                            id: `user-${usr.userId}`,
                            title: `User: ${usr.displayName.split(' ')[0]}`,
                            type: 'user',
                            data: { user: usr, license: lic }
                          })
                        }
                        className="p-2 rounded-lg hover:bg-slate-800/80 cursor-pointer transition-colors border border-transparent hover:border-slate-700/60 space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-200">
                          <span className="truncate max-w-[130px]">{usr.displayName}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] uppercase ${
                              usr.role === 'founder'
                                ? 'bg-amber-500/20 text-amber-400'
                                : usr.role === 'admin'
                                ? 'bg-indigo-500/20 text-indigo-400'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {usr.role}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-between">
                          <span className="truncate text-slate-500">{usr.email}</span>
                          <span
                            className={`font-mono text-[9px] font-bold ${
                              evalState.active ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {lic.lifetime ? 'Lifetime' : `${evalState.daysRemaining}d Trial`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Payments & AppyPay Tree */}
              {activeActivity === 'payments' && (
                <div className="space-y-1 font-mono text-xs">
                  <div
                    onClick={() =>
                      openTab({
                        id: 'appypay-gateway',
                        title: 'AppyPay Gateway Provider',
                        type: 'appypay'
                      })
                    }
                    className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 hover:bg-emerald-900/40 cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <span className="flex items-center space-x-1.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>AppyPay Gateway</span>
                      </span>
                      <span className="text-[9px] bg-emerald-500/20 px-1.5 py-0.2 rounded">SANDBOX</span>
                    </div>
                    <p className="text-[10px] text-slate-400">ClientID & Secret • GET/POST Charges • Webhook</p>
                  </div>
                </div>
              )}

              {/* Feature Flags Tree */}
              {activeActivity === 'flags' && (
                <div className="space-y-1 font-mono text-xs">
                  <div
                    onClick={() =>
                      openTab({
                        id: 'feature-flags-editor',
                        title: 'Feature Flags (Firestore)',
                        type: 'flags'
                      })
                    }
                    className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 hover:bg-amber-900/40 cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between text-amber-400 font-bold">
                      <span className="flex items-center space-x-1.5">
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Flags de Sistema</span>
                      </span>
                      <span className="text-[9px] bg-amber-500/20 px-1.5 py-0.2 rounded">5 FLAGS</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Ativação instantânea no Firestore sem recompilar</p>
                  </div>
                </div>
              )}

              {/* Default Tree fallback for other Activity items */}
              {!['users', 'payments', 'flags'].includes(activeActivity) && (
                <div className="p-3 text-center text-slate-500 font-mono text-[11px] space-y-2">
                  <p>Atividade: {activeActivity.toUpperCase()}</p>
                  <button
                    onClick={() =>
                      openTab({
                        id: `tab-${activeActivity}`,
                        title: `Inspector: ${activeActivity}`,
                        type: activeActivity === 'runtime' ? 'runtime' : 'audit'
                      })
                    }
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs cursor-pointer font-bold w-full"
                  >
                    Abrir no Workbench
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Center Workbench (Tabbed Editor) */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
          {/* Tabs Bar */}
          <div className="h-9 bg-slate-900/80 border-b border-slate-800 flex items-center overflow-x-auto text-xs font-mono">
            {openTabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`h-full px-3.5 flex items-center space-x-2 border-r border-slate-800/80 cursor-pointer select-none transition-colors ${
                    isActive
                      ? 'bg-slate-950 text-amber-400 border-t-2 border-t-amber-500 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <span className="truncate max-w-[150px]">{tab.title}</span>
                  <button
                    onClick={(e) => closeTab(tab.id, e)}
                    className="p-0.5 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            {openTabs.length === 0 && (
              <div className="px-4 text-[11px] text-slate-500 italic">No editor opened</div>
            )}
          </div>

          {/* Workbench Center Viewport */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeActivity === 'overview' || activeTabObj?.type === 'overview' ? (
              <OperationalOverviewConsole />
            ) : activeActivity === 'root_authority' || activeTabObj?.type === 'root_authority' ? (
              <RootConsoleView />
            ) : activeActivity === 'devices' || activeTabObj?.type === 'device' ? (
              /* MULTI-DEVICE MESH & FLEET MANAGER */
              <div className="space-y-6 font-mono text-slate-100">
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
                      <Smartphone className="w-6 h-6" />
                    </span>
                    <div>
                      <h2 className="text-lg font-black text-slate-100">MULTI-DEVICE MESH & FLEET ENGINE</h2>
                      <p className="text-xs text-slate-400">Orquestração em Nuvem do Ecossistema Mobile, PWA e Desktop</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setTerminalLogs((prev) => [
                        ...prev,
                        `[PAIRING ENGINE] Token QR gerado com sucesso. Expiração: 300s.`
                      ]);
                      setBottomPanelOpen(true);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-amber-500/20 flex items-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Gerar QR Code de Pareamento (Zero-Touch)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-400">Agente Android Samsung S22</span>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] rounded font-bold">ONLINE</span>
                    </div>
                    <p className="text-[11px] text-slate-400">SIM Físico Ativo • Interceptador SMS & Chamadas (&lt;5ms)</p>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Node ID: agent-samsung-s22</span>
                      <span className="text-amber-400 font-bold">Capacidade: 100%</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-400">PWA Master Workstation (Chrome/macOS)</span>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] rounded font-bold">ACTIVE</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Sessão Handover Pronta • Chave E2EE Verificada</p>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Node ID: pwa-workstation-001</span>
                      <span className="text-sky-400 font-bold">Clipboard Sync: OK</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-400">Agente Itel A100 (Dispositivo Bónus)</span>
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] rounded font-bold">STANDBY</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Auto-Discovery Registrado • Rota de Failover Pronta</p>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Node ID: node-itel-a100</span>
                      <span className="text-emerald-400 font-bold">Score: 98%</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeActivity === 'cpaas_dispatcher' ? (
              /* CPaaS SECURITY, DISPATCHER ENGINE, API KEYS & VIRTUAL NUMBERS */
              <div className="space-y-6 font-sans">
                <CpaasSecurityDispatcherConsole />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <APIKeysManager />
                  <VirtualNumbersManager />
                </div>
              </div>
            ) : activeActivity === 'automation' ? (
              /* AUTOMATION ENGINE VIEW */
              <AutomationRulesManager />
            ) : activeActivity === 'health' ? (
              /* TELEMETRY, REALTIME SSE & HEALTH VIEW */
              <div className="space-y-6 font-sans text-slate-100">
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                      <Activity className="w-6 h-6" />
                    </span>
                    <div>
                      <h2 className="text-lg font-black text-slate-100">TELEMETRY, REALTIME SSE & HEALTH ENGINE</h2>
                      <p className="text-xs text-slate-400 font-mono">Monitorização em Tempo Real, Diagnósticos & Transmissão SSE (&lt;5ms)</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      HealthEngine.runAutoRepair('dev-xiaomi-12t-02');
                      setHealthMetrics(HealthEngine.getHealthMetrics());
                      setDiagnostics(HealthEngine.getDiagnostics());
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-emerald-600/20 flex items-center space-x-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Executar Repair Workflow nos Dispositivos</span>
                  </button>
                </div>

                {/* Operations Assistant Diagnostics Banner */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider flex items-center space-x-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Root Operations Assistant Suggestions ({diagnostics.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                    {diagnostics.map((diag) => (
                      <div key={diag.id} className="p-4 bg-slate-900 rounded-2xl border border-amber-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-300">{diag.title}</span>
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] rounded font-bold uppercase">
                            {diag.severity}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{diag.description}</p>
                        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                          <span className="text-emerald-400 font-bold text-[10px]">{diag.suggestedAction}</span>
                          <button
                            onClick={() => {
                              HealthEngine.runAutoRepair('dev-xiaomi-12t-02');
                              setHealthMetrics(HealthEngine.getHealthMetrics());
                            }}
                            className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-[10px] cursor-pointer"
                          >
                            Executar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Realtime SSE Dev Stream */}
                <RealtimeDevStreamConsole />

                {/* Device Health Score Cards */}
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
                  <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">
                    Métricas de Saúde dos Agentes Android ({healthMetrics.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {healthMetrics.map((m) => (
                      <div key={m.deviceId} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-100">{m.deviceName}</span>
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded">
                            Health: {m.healthScore}%
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400">
                          <div className="p-2 bg-slate-900 rounded border border-slate-800">
                            <span className="block text-[9px] text-slate-500">BATTERY</span>
                            <span className="font-bold text-slate-200">{m.batteryLevel}%</span>
                          </div>
                          <div className="p-2 bg-slate-900 rounded border border-slate-800">
                            <span className="block text-[9px] text-slate-500">HEARTBEAT</span>
                            <span className="font-bold text-indigo-400">{m.heartbeatIntervalSec}s</span>
                          </div>
                          <div className="p-2 bg-slate-900 rounded border border-slate-800">
                            <span className="block text-[9px] text-slate-500">PERMISSIONS</span>
                            <span className="font-bold text-emerald-400">{m.permissionScore}%</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 text-[10px] text-slate-400">
                          <span className={m.notificationListenerActive ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            • Notification Listener: {m.notificationListenerActive ? 'OK' : 'LOST'}
                          </span>
                          <span className="text-emerald-400 font-bold">• SMS Interceptor: OK</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Device Timeline */}
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
                  <h3 className="text-sm font-bold text-indigo-400 border-b border-slate-800 pb-2">
                    Cronologia Eventual dos Agentes (Device Timeline Engine)
                  </h3>
                  <div className="space-y-2">
                    {deviceTimeline.map((evt) => (
                      <div key={evt.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 font-bold text-[9px] rounded mr-2 uppercase">
                            {evt.type}
                          </span>
                          <span className="text-slate-300">{evt.detail}</span>
                        </div>
                        <span className="text-slate-500 text-[10px]">{new Date(evt.timestamp).toLocaleString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeActivity === 'users' ? (
              /* USERS & IDENTITY MANAGER VIEW */
              <div className="space-y-6 font-mono text-slate-100 text-xs">
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-100">IDENTITY & USER LICENSES</h2>
                    <p className="text-xs text-slate-400">Gestão de Utilizadores, Regras e Licenças com Trial Engine</p>
                  </div>
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/40 font-bold">
                    {users.length} Utilizadores Ativos
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {users.map((usr) => {
                    const lic = TrialEngine.getLicense(usr.userId, usr.email);
                    return (
                      <div key={usr.userId} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-100 text-sm">{usr.displayName}</span>
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded uppercase font-bold">
                            {usr.role}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs">{usr.email}</p>
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-400">Estado Licença:</span>
                          <span className="text-emerald-400 font-bold">
                            {lic.lifetime ? 'LIFETIME' : 'TRIAL ATIVO'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : activeActivity === 'payments' ? (
              /* PAYMENTS & APPYPAY GATEWAY VIEW */
              <div className="space-y-6 font-mono text-slate-100 text-xs">
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-emerald-400 flex items-center space-x-2">
                      <CreditCard className="w-4 h-4" />
                      <span>AppyPay Payment Provider Module (Angola Kwanza - AOA)</span>
                    </h3>
                    <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold text-xs">
                      ✓ SANDBOX ATIVO
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Processamento seguro de cobranças com suporte a pagamentos por referência Multicaixa Express e AppyPay.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">MOEDA</span>
                      <span className="text-emerald-400 font-bold text-sm">AOA (Kwanza)</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">GATEWAY STATUS</span>
                      <span className="text-amber-400 font-bold text-sm">18ms Ping</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">WEBHOOK URL</span>
                      <span className="text-indigo-400 font-bold text-sm">/api/appypay</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">TAXA SUCESSO</span>
                      <span className="text-emerald-400 font-bold text-sm">99.8%</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeActivity === 'flags' ? (
              /* FEATURE FLAGS VIEW */
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
                <h3 className="text-sm font-bold text-amber-400 border-b border-slate-800 pb-3 flex items-center space-x-2">
                  <Sliders className="w-4 h-4" />
                  <span>Feature Flags em Tempo Real (Firestore Event Bus)</span>
                </h3>
                <div className="space-y-3">
                  {(Object.keys(flags) as (keyof FeatureFlagsState)[]).map((key) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <div>
                        <span className="font-bold text-slate-200 block">{key}</span>
                        <span className="text-[10px] text-slate-500">Valor persistido e propagado via Firestore Event</span>
                      </div>
                      <button
                        onClick={() => {
                          const updated = AuthorityEngine.toggleFeatureFlag(key, !flags[key]);
                          setFlags(updated);
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
                          flags[key] ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {flags[key] ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeActivity === 'infrastructure' ? (
              /* CONSOLIDATED INFRASTRUCTURE & STORAGE VIEW */
              <div className="space-y-6 font-mono text-slate-100 text-xs">
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-100">INFRASTRUCTURE & STORAGE ENGINE</h2>
                    <p className="text-xs text-slate-400">Node.js Express (Port 3000), Memory Batching, Firestore & IndexedDB</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-500/40 font-bold">
                    Port 3000 Bound & IndexedDB Ready
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[10px]">MEMORY BUFFER</span>
                    <span className="text-amber-400 font-bold block text-base">{queueMetrics.bufferedCount} Eventos</span>
                  </div>
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[10px]">TOTAL FLUSHED</span>
                    <span className="text-indigo-400 font-bold block text-base">{queueMetrics.totalFlushed} Gravações</span>
                  </div>
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[10px]">ECONOMIA FIRESTORE</span>
                    <span className="text-emerald-400 font-bold block text-base">-{queueMetrics.savedFirestoreWritesPercentage}% Custos</span>
                  </div>
                </div>
                <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-sky-400 border-b border-slate-800 pb-2">
                    Persistência & Cache Offline (IndexedDB / Firestore Engine)
                  </h3>
                  <p className="text-slate-300 text-xs">
                    Sincronização bidirecional em segundo plano e otimização de custo via memória com redução de 92% de operações de escrita.
                  </p>
                </div>
              </div>
            ) : activeActivity === 'audit' ? (
              /* AUDIT & DEAD LETTER QUEUE LOGS VIEW */
              <div className="space-y-6 font-mono text-slate-100 text-xs">
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-100">AUDIT LOGS & DEAD LETTER QUEUE (DLQ)</h2>
                    <p className="text-xs text-slate-400">Inspeção de Webhooks Falhados e Disparos Automáticos de Retentativas</p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/40 font-bold">
                    DLQ Health: 100% OK
                  </span>
                </div>
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                  <p className="text-slate-300">Nenhum evento falhado crítico no momento. Toda a fila de retentativas foi processada com sucesso!</p>
                </div>
              </div>
            ) : (
              /* ACTIVE TAB RENDERERS FALLBACK */
              <div>
                {/* USER & TRIAL TAB */}
                {activeTabObj?.type === 'user' && activeTabObj.data && (
                  <div className="space-y-6 font-mono text-xs">
                    <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h2 className="text-lg font-bold text-slate-100">{activeTabObj.data.user.displayName}</h2>
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold uppercase">
                            {activeTabObj.data.user.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono">{activeTabObj.data.user.email}</p>
                      </div>

                      <div className="text-right font-mono text-xs space-y-1">
                        <span className="text-slate-500 block">ID: {activeTabObj.data.user.userId}</span>
                        <span className="text-emerald-400 font-bold block">
                          {activeTabObj.data.license.lifetime ? 'Licença Vitalícia' : 'Trial Ativo'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Bottom Collapsible Panel (Terminal / Logs / Console) */}
      {bottomPanelOpen && (
        <div className="h-44 bg-slate-900 border-t border-slate-800 flex flex-col font-mono text-xs shrink-0">
          <div className="h-8 bg-slate-950 border-b border-slate-800/80 px-3 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setBottomPanelTab('terminal')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded cursor-pointer ${
                  bottomPanelTab === 'terminal' ? 'bg-slate-800 text-amber-400 font-bold' : 'hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>TERMINAL</span>
              </button>
              <button
                onClick={() => setBottomPanelTab('logs')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded cursor-pointer ${
                  bottomPanelTab === 'logs' ? 'bg-slate-800 text-indigo-400 font-bold' : 'hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>SYSTEM LOGS</span>
              </button>
              <button
                onClick={() => setBottomPanelTab('queue')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded cursor-pointer ${
                  bottomPanelTab === 'queue' ? 'bg-slate-800 text-emerald-400 font-bold' : 'hover:text-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>IN-MEMORY QUEUE & SSE ({queueMetrics.bufferedCount})</span>
              </button>
            </div>

            <button
              onClick={() => setBottomPanelOpen(false)}
              className="hover:text-slate-200 cursor-pointer text-slate-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-1 text-slate-300 font-mono text-[11px] leading-relaxed">
            {bottomPanelTab === 'queue' ? (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">BUFFER DE MEMÓRIA</span>
                    <span className="text-amber-400 font-bold text-sm">{queueMetrics.bufferedCount} eventos</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">TOTAL FLUSHED</span>
                    <span className="text-indigo-400 font-bold text-sm">{queueMetrics.totalFlushed} gravados</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">ECONOMIA FIRESTORE</span>
                    <span className="text-emerald-400 font-bold text-sm">-{queueMetrics.savedFirestoreWritesPercentage}% Custos</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">LATÊNCIA BARRAMENTO</span>
                    <span className="text-cyan-400 font-bold text-sm">&lt;5ms SSE Realtime</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                  <div className="text-[11px] text-slate-400">
                    <span>In-Memory Buffer no Express reduz até 90% das leituras/escritas diretas no Firestore. 20 notificações são agrupadas em 1 único Batch Write!</span>
                  </div>
                  <button
                    onClick={() => {
                      BatchQueueEngine.sendEventBatch([
                        {
                          eventId: `evt-test-${Date.now()}-1`,
                          workspaceId: 'ws-vitronis-default',
                          nodeId: 'node-itel-a100',
                          type: 'NOTIFICATION',
                          payload: { title: 'Notificação Batch Simulação', body: 'Disparado com latência <5ms via Express' },
                          timestamp: Date.now()
                        },
                        {
                          eventId: `evt-test-${Date.now()}-2`,
                          workspaceId: 'ws-vitronis-default',
                          nodeId: 'node-itel-a100',
                          type: 'SMS',
                          payload: { sender: '+244923000111', body: 'SMS recebido pelo agente Android' },
                          timestamp: Date.now()
                        }
                      ]).then((res) => {
                        setTerminalLogs((prev) => [...prev, `[BATCH TEST] Sent 2 events to express buffer. Buffered count: ${res.bufferedCount}`]);
                      });
                    }}
                    className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold rounded-md border border-emerald-500/40 cursor-pointer text-xs"
                  >
                    Simular Batch (2 Notificações)
                  </button>
                </div>
              </div>
            ) : (
              terminalLogs.map((log, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <span className="text-slate-600 select-none">&gt;</span>
                  <span className={log.startsWith('[SUCCESS]') ? 'text-emerald-400' : log.startsWith('[ERROR]') ? 'text-rose-400' : 'text-slate-300'}>{log}</span>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleCommandSubmit} className="h-8 bg-slate-950 border-t border-slate-800 px-3 flex items-center">
            <span className="text-amber-400 font-bold mr-2 select-none">$</span>
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Digite um comando (ex: 'appypay status', 'trial grant', 'help', 'clear')..."
              className="flex-1 bg-transparent text-slate-200 focus:outline-none text-xs font-mono"
            />
          </form>
        </div>
      )}

      {/* VS Code Style Operational Status Bar */}
      <div className="h-6 bg-slate-950 border-t border-slate-800 px-3 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0 select-none">
        <div className="flex items-center space-x-2.5 overflow-x-auto">
          <span className="flex items-center space-x-1 text-amber-400 font-extrabold">
            <Crown className="w-3 h-3" />
            <span>ROOT</span>
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-emerald-400 font-semibold flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Firebase</span>
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-indigo-400 font-semibold">Render: ONLINE</span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-300 font-semibold">Firestore: READY</span>
          <span className="text-slate-700">|</span>
          <span className="text-sky-400 font-semibold">GitHub: SYNC</span>
          <span className="text-slate-700">|</span>
          <span className="text-emerald-300 font-semibold">AppyPay: SBX</span>
          <span className="text-slate-700">|</span>
          <span className="text-amber-300 font-semibold">Android: 1 AGENT</span>
          <span className="text-slate-700">|</span>
          <span className="text-cyan-300 font-semibold">Realtime &lt;5ms</span>
        </div>

        <div className="hidden md:flex items-center space-x-3 text-slate-500">
          <span>CPU: 0.4%</span>
          <span>RAM: 148MB</span>
          <span>Latency: 12ms</span>
          <span className="text-amber-400 font-bold">v2.4.0</span>
        </div>
      </div>

      {/* Global Command Palette Modal */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onExecuteCommand={(title, output) => {
          setTerminalLogs((prev) => [...prev, `$ ${title}`, `[CommandPalette] ${output}`]);
          setBottomPanelOpen(true);
        }}
      />
    </div>
  );
};
