import React, { useState, useEffect } from 'react';
import {
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
  Sparkles
} from 'lucide-react';
import { AuthorityEngine, FeatureFlagsState, DEUS_FUNDADOR_CREDENTIALS } from '../../engine/authorityEngine';
import { PaymentRegistry, ChargeResponse, ChargeRequest } from '../../services/paymentEngine';
import { TrialEngine, LicenseRecord } from '../../services/trialEngine';
import { UserProfile, UserRole } from '../../types/User';
import { IdentityEngine } from '../../engine/identityEngine';
import { RootConsoleView } from './RootConsoleView';
import { CommandPalette } from './CommandPalette';
import { AutomationEngine, AutomationRule, AutomationExecutionLog } from '../../services/automationEngine';
import { HealthEngine, DeviceHealthMetric, OperationalDiagnostic, DeviceTimelineEvent } from '../../services/healthEngine';

export interface IDETab {
  id: string;
  title: string;
  type: 'user' | 'appypay' | 'flags' | 'runtime' | 'firestore' | 'device' | 'audit' | 'rules' | 'root_authority' | 'automation' | 'health';
  data?: any;
}

export const FounderIDEWorkspace: React.FC = () => {
  // Command Palette State
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(false);
  const [paletteCommandLog, setPaletteCommandLog] = useState<string | null>(null);

  // Navigation & Layout States
  const [activeActivity, setActiveActivity] = useState<string>('root_authority');
  const [sidePanelOpen, setSidePanelOpen] = useState<boolean>(true);
  const [bottomPanelOpen, setBottomPanelOpen] = useState<boolean>(true);
  const [bottomPanelTab, setBottomPanelTab] = useState<'terminal' | 'logs' | 'queue' | 'errors'>('terminal');

  // Engines State
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>(AutomationEngine.getRules());
  const [automationLogs, setAutomationLogs] = useState<AutomationExecutionLog[]>(AutomationEngine.getExecutionLogs());
  const [healthMetrics, setHealthMetrics] = useState<DeviceHealthMetric[]>(HealthEngine.getHealthMetrics());
  const [diagnostics, setDiagnostics] = useState<OperationalDiagnostic[]>(HealthEngine.getDiagnostics());
  const [deviceTimeline, setDeviceTimeline] = useState<DeviceTimelineEvent[]>(HealthEngine.getTimelineEvents());

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

  // Activity Bar Navigation Definition
  const activityItems = [
    { id: 'root_authority', label: 'Root of Trust Console', icon: Crown },
    { id: 'automation', label: 'Automation Engine (Rules)', icon: Zap },
    { id: 'health', label: 'Health & Operations Assistant', icon: Activity },
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'users', label: 'Users & Trial', icon: Users, badge: users.length },
    { id: 'devices', label: 'Android Devices', icon: Smartphone },
    { id: 'payments', label: 'Payments & AppyPay', icon: CreditCard },
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'runtime', label: 'Runtime Kernel', icon: Cloud },
    { id: 'firestore', label: 'Firestore Data', icon: Database },
    { id: 'deploy', label: 'Deploy & Cloud Run', icon: Rocket },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'audit', label: 'Audit Logs', icon: ScrollText },
    { id: 'flags', label: 'Feature Flags', icon: Sliders },
    { id: 'developer', label: 'Developer Console', icon: Wrench },
    { id: 'security', label: 'Security & Secrets', icon: Shield }
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
    } else if (cmd === 'help') {
      newLogs.push(`Comandos disponíveis: 'trial grant <user>', 'appypay status', 'flags sync', 'clear', 'status'`);
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
            {activeActivity === 'root_authority' || activeTabObj?.type === 'root_authority' ? (
              <RootConsoleView />
            ) : activeActivity === 'automation' ? (
              /* AUTOMATION ENGINE VIEW */
              <div className="space-y-6 font-sans text-slate-100">
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                      <Zap className="w-6 h-6" />
                    </span>
                    <div>
                      <h2 className="text-lg font-black text-slate-100">AUTOMATION ENGINE (RULE ENGINE)</h2>
                      <p className="text-xs text-slate-400 font-mono">Regras IF/WHEN -&gt; THEN Autônomas do Sistema</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const log = AutomationEngine.triggerRule('rule-permission-lost');
                      setAutomationLogs(AutomationEngine.getExecutionLogs());
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-amber-500/20 flex items-center space-x-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Executar Diagnóstico do Automation Engine</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                  {/* Rules Config List */}
                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <h3 className="text-sm font-bold text-amber-400 border-b border-slate-800 pb-2 flex items-center justify-between">
                      <span>Regras Ativas ({automationRules.length})</span>
                      <span className="text-[10px] text-slate-500">Auto-Triggers</span>
                    </h3>
                    <div className="space-y-3">
                      {automationRules.map((rule) => (
                        <div key={rule.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between font-bold text-slate-200">
                            <span>{rule.name}</span>
                            <input
                              type="checkbox"
                              checked={rule.active}
                              onChange={(e) => {
                                AutomationEngine.toggleRule(rule.id, e.target.checked);
                                setAutomationRules(AutomationEngine.getRules());
                              }}
                              className="rounded text-amber-500"
                            />
                          </div>
                          <div className="p-2 bg-slate-900 rounded border border-slate-800 text-[10px] space-y-1">
                            <span className="text-indigo-400 font-bold block">WHEN: {rule.triggerEvent} ({rule.condition})</span>
                            <span className="text-emerald-400 font-bold block">THEN: {rule.action}</span>
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-slate-500">
                            <span>Execuções: {rule.triggerCount}</span>
                            <span>{rule.lastTriggered ? new Date(rule.lastTriggered).toLocaleTimeString('pt-BR') : 'Never'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Execution Logs */}
                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <h3 className="text-sm font-bold text-emerald-400 border-b border-slate-800 pb-2">
                      Logs de Execução em Tempo Real
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {automationLogs.map((log) => (
                        <div key={log.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] space-y-1">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-slate-200">{log.ruleName}</span>
                            <span className="text-emerald-400 text-[9px] uppercase font-mono">{log.result}</span>
                          </div>
                          <p className="text-slate-400 text-[10px]">{log.actionOutput}</p>
                          <span className="text-[9px] text-slate-500 block">{new Date(log.triggeredAt).toLocaleTimeString('pt-BR')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : activeActivity === 'health' ? (
              /* HEALTH & OPERATIONS ASSISTANT VIEW */
              <div className="space-y-6 font-sans text-slate-100">
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                      <Activity className="w-6 h-6" />
                    </span>
                    <div>
                      <h2 className="text-lg font-black text-slate-100">OPERATIONS ASSISTANT & HEALTH ENGINE</h2>
                      <p className="text-xs text-slate-400 font-mono">Monitorização de Dispositivos e Recomendações Proativas de Diagnóstico</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const res = HealthEngine.runAutoRepair('dev-xiaomi-12t-02');
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
            ) : !activeTabObj ? (
              /* Empty VS Code Welcome Screen */
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto my-auto text-slate-500 font-mono">
                <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 text-amber-400 shadow-xl">
                  <Crown className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-300">Nenhum Editor Aberto no Workbench</h3>
                  <p className="text-xs text-slate-500">
                    Selecione uma entidade no Side Panel (Users, AppyPay, Feature Flags, Runtime) para abrir uma aba de trabalho por intenção.
                  </p>
                </div>
                <div className="pt-2 text-[11px] text-slate-600 space-y-1">
                  <p>• Atalho: Clique em 'Users & Trial' na Activity Bar</p>
                  <p>• Atalho: Selecione 'AppyPay Gateway' para testar cobranças</p>
                </div>
              </div>
            ) : (
              /* Active Tab Renderers */
              <div>
                {/* USER & TRIAL TAB */}
                {activeTabObj.type === 'user' && activeTabObj.data && (
                  <div className="space-y-6">
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

                    {/* Trial & Promotion Engine Direct Controls */}
                    <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                      <div className="border-b border-slate-800 pb-3">
                        <h3 className="text-sm font-bold text-amber-400 flex items-center space-x-2">
                          <Sparkles className="w-4 h-4" />
                          <span>Motor de Experiência Gratuita (Trial & Extension Engine)</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Concessão direta de dias bónus ou conversão para licença Vitalícia sem alterar o código.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <button
                          onClick={() => {
                            const updated = TrialEngine.modifyLicense(activeTabObj.data.user.userId, '+3d');
                            activeTabObj.data.license = updated;
                            setTerminalLogs([
                              ...terminalLogs,
                              `[TRIAL ENGINE] Concedido +3 dias ao utilizador '${activeTabObj.data.user.email}'.`
                            ]);
                          }}
                          className="py-2.5 px-3 bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer text-center"
                        >
                          +3 Dias
                        </button>

                        <button
                          onClick={() => {
                            const updated = TrialEngine.modifyLicense(activeTabObj.data.user.userId, '+15d');
                            activeTabObj.data.license = updated;
                            setTerminalLogs([
                              ...terminalLogs,
                              `[TRIAL ENGINE] Concedido +15 dias ao utilizador '${activeTabObj.data.user.email}'.`
                            ]);
                          }}
                          className="py-2.5 px-3 bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer text-center"
                        >
                          +15 Dias
                        </button>

                        <button
                          onClick={() => {
                            const updated = TrialEngine.modifyLicense(activeTabObj.data.user.userId, '+30d');
                            activeTabObj.data.license = updated;
                            setTerminalLogs([
                              ...terminalLogs,
                              `[TRIAL ENGINE] Concedido +30 dias ao utilizador '${activeTabObj.data.user.email}'.`
                            ]);
                          }}
                          className="py-2.5 px-3 bg-slate-950 hover:bg-slate-800 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer text-center"
                        >
                          +30 Dias
                        </button>

                        <button
                          onClick={() => {
                            const updated = TrialEngine.modifyLicense(activeTabObj.data.user.userId, 'lifetime');
                            activeTabObj.data.license = updated;
                            setTerminalLogs([
                              ...terminalLogs,
                              `[TRIAL ENGINE] Utilizador '${activeTabObj.data.user.email}' promovido para VITALÍCIO!`
                            ]);
                          }}
                          className="py-2.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer text-center"
                        >
                          Ilimitado (Lifetime)
                        </button>

                        <button
                          onClick={() => {
                            const updated = TrialEngine.modifyLicense(activeTabObj.data.user.userId, 'reset');
                            activeTabObj.data.license = updated;
                            setTerminalLogs([
                              ...terminalLogs,
                              `[TRIAL ENGINE] Reset do período de teste para '${activeTabObj.data.user.email}'.`
                            ]);
                          }}
                          className="py-2.5 px-3 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer text-center"
                        >
                          Reset Trial
                        </button>
                      </div>

                      {/* License details */}
                      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
                        <div>
                          <span className="text-slate-500">Motivo de Alteração:</span> {activeTabObj.data.license.reason}
                        </div>
                        <div>
                          <span className="text-slate-500">Expiração Prevista:</span>{' '}
                          {new Date(activeTabObj.data.license.trialEndDate).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* APPYPAY GATEWAY TAB */}
                {activeTabObj.type === 'appypay' && (
                  <div className="space-y-6">
                    <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="text-sm font-bold text-emerald-400 flex items-center space-x-2">
                          <CreditCard className="w-4 h-4" />
                          <span>AppyPay Payment Provider Module</span>
                        </h3>
                        <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold">
                          ✓ Integrado (Interface Única Operacional)
                        </span>
                      </div>

                      <p className="text-xs text-slate-300">
                        Módulo isolado no Integration Layer. Suporta Autenticação (`ClientID` + `Secret`), `POST charges`, `GET charges` e `Webhook`.
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs pt-2">
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">AUTH MODE</span>
                          <span className="text-slate-200 font-bold">ClientID + Secret</span>
                        </div>
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">ENVIRONMENT</span>
                          <span className="text-amber-400 font-bold">Sandbox (Testing)</span>
                        </div>
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">CURRENCY</span>
                          <span className="text-emerald-400 font-bold">AOA (Angola Kwanza)</span>
                        </div>
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">WEBHOOK RECEIVER</span>
                          <span className="text-indigo-400 font-bold">Active /api/appypay/webhook</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* FEATURE FLAGS TAB */}
                {activeTabObj.type === 'flags' && (
                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
                    <h3 className="text-sm font-bold text-amber-400 border-b border-slate-800 pb-3 flex items-center space-x-2">
                      <Sliders className="w-4 h-4" />
                      <span>Feature Flags do Firestore (Sem necessidade de recompilar)</span>
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
            </div>

            <button
              onClick={() => setBottomPanelOpen(false)}
              className="hover:text-slate-200 cursor-pointer text-slate-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-1 text-slate-300 font-mono text-[11px] leading-relaxed">
            {terminalLogs.map((log, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <span className="text-slate-600 select-none">&gt;</span>
                <span className={log.startsWith('$') ? 'text-amber-400 font-bold' : ''}>{log}</span>
              </div>
            ))}
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
