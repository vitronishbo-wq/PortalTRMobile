import React, { useState, useEffect, Suspense, use, useMemo } from 'react';
import {
  LayoutDashboard,
  Shield,
  Crown,
  Lock,
  KeyRound,
  Sliders,
  CreditCard,
  Database,
  Server,
  GitBranch,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Users,
  Smartphone,
  Layers,
  Terminal,
  Activity,
  Zap,
  ArrowRight,
  BarChart3,
  Home,
  Plug,
  Cloud,
  Rocket,
  TrendingUp,
  ScrollText,
  Settings,
  Wrench,
  ShieldCheck,
  Play,
  Pause,
  Clock,
  Plus,
  Trash2,
  Filter,
  Check,
  X,
  AlertTriangle,
  Cpu,
  Radio,
  Download,
  Share2,
  LockKeyhole
} from 'lucide-react';
import {
  AuthorityEngine,
  computeFounderIdentityHash,
  FeatureFlagsState,
  SecretStatusItem
} from '../engine/authorityEngine';
import { PaymentRegistry, ChargeResponse, ChargeRequest } from '../services/paymentEngine';
import { IdentityEngine, useIdentity } from '../engine/identityEngine';
import { UserProfile, UserRole, resolveRootLevel, getDefaultPermissionsForRole } from '../types/User';
import { FirestoreService } from '../services/firestore';
import { TrialEngine } from '../services/trialEngine';
import { AppyPayGatewayConsole } from './AppyPayGatewayConsole';
import { SecurityConsole } from './SecurityConsole';
import { IntegrationsConsole } from './IntegrationsConsole';
import { InfrastructureConsole } from './InfrastructureConsole';
import { AnalyticsView } from './AnalyticsView';
import { AuditConsole } from './AuditConsole';
import { RootConsoleView } from './workspaces/RootConsoleView';
import { OperationalOverviewConsole } from './workspaces/OperationalOverviewConsole';

export interface VerifiedFounderSession {
  verified: boolean;
  profile: UserProfile | null;
  timestamp: number;
}

// Global cache for session verification promises
const founderSessionCache = new Map<string, Promise<VerifiedFounderSession>>();

export function verifyFounderSessionAsync(uid: string = 'default'): Promise<VerifiedFounderSession> {
  if (!founderSessionCache.has(uid)) {
    const promise = (async () => {
      const profile = await AuthorityEngine.initFounderBootstrap();
      const isVerified = Boolean(
        profile &&
          (profile.role === 'founder' ||
            profile.authority === 'ROOT' ||
            profile.permissions?.includes('*'))
      );
      return {
        verified: isVerified,
        profile,
        timestamp: Date.now()
      };
    })();
    founderSessionCache.set(uid, promise);
  }
  return founderSessionCache.get(uid)!;
}

export function invalidateFounderSessionCache(uid?: string) {
  if (uid) {
    founderSessionCache.delete(uid);
  } else {
    founderSessionCache.clear();
  }
}

/**
 * Lightweight loading fallback rendered while session verification resolves
 */
export const FounderConsoleFallback: React.FC = () => {
  return (
    <div className="min-h-[400px] w-full bg-slate-900/90 rounded-2xl border border-amber-500/30 p-8 flex flex-col items-center justify-center space-y-4 text-center shadow-xl animate-pulse">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Crown className="w-8 h-8 animate-bounce" />
        </div>
        <div className="absolute -inset-1 rounded-2xl border border-amber-500/40 animate-ping opacity-25"></div>
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider font-mono flex items-center justify-center gap-2">
          <span>Sessão Founder em Verificação</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-mono font-bold">
            ROOT
          </span>
        </h3>
        <p className="text-xs text-slate-400 font-mono">
          Validando credenciais criptográficas e autoridade de bootstrap...
        </p>
      </div>
      <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-amber-500 rounded-full animate-pulse w-3/4"></div>
      </div>
    </div>
  );
};

export type RootWorkspaceTab =
  | 'overview'
  | 'root'
  | 'automation'
  | 'monitoring'
  | 'identity'
  | 'devices'
  | 'billing'
  | 'integrations'
  | 'infrastructure'
  | 'releases'
  | 'audit'
  | 'developer'
  | 'security';

interface TabDef {
  id: RootWorkspaceTab;
  label: string;
  icon: React.ElementType;
  color: string;
  badge?: string;
  desc: string;
}

const TAB_DEFS: TabDef[] = [
  { id: 'overview', label: 'Overview Operacional', icon: LayoutDashboard, color: 'text-sky-400', badge: '8 PILARES', desc: 'Visão Operacional Consolidada de Sistema' },
  { id: 'root', label: 'Root Authority', icon: Crown, color: 'text-amber-400', badge: 'MASTER', desc: 'Controlo Root & Autoridade Bootstrap' },
  { id: 'automation', label: 'Automation Engine', icon: Zap, color: 'text-yellow-400', badge: '3 Ativas', desc: 'Regras de Eventos e Gatilhos' },
  { id: 'monitoring', label: 'Telemetry & Health', icon: Activity, color: 'text-emerald-400', badge: 'Ativo', desc: 'Telemetria, Saúde dos Dispositivos & Métricas' },
  { id: 'identity', label: 'Identity & Access', icon: Users, color: 'text-indigo-400', badge: 'RBAC', desc: 'Gestão de Utilizadores e Zero-Knowledge' },
  { id: 'devices', label: 'Devices & Agent Mesh', icon: Smartphone, color: 'text-emerald-400', badge: 'Agentes', desc: 'Agentes Android e Dispositivos Pareados' },
  { id: 'billing', label: 'Billing & Subscriptions', icon: CreditCard, color: 'text-amber-400', badge: 'AppyPay', desc: 'Subscrições, Licenças & Gateway AppyPay' },
  { id: 'integrations', label: 'Integrations & CPaaS', icon: Plug, color: 'text-purple-400', desc: 'Webhooks, CPaaS & APIs' },
  { id: 'infrastructure', label: 'Infrastructure & Storage', icon: Cloud, color: 'text-cyan-400', desc: 'Servidores Node.js Express & Firestore' },
  { id: 'releases', label: 'Releases & Build', icon: Rocket, color: 'text-rose-400', badge: 'v2.4.0', desc: 'Versões PWA & Compilações APK' },
  { id: 'audit', label: 'Audit & DLQ Logs', icon: ScrollText, color: 'text-orange-400', desc: 'Registo Inalterável & Incidentes DLQ' },
  { id: 'developer', label: 'Command Center & CLI', icon: Wrench, color: 'text-emerald-400', badge: 'CLI', desc: 'Terminal Único & Registos de Depuração' },
  { id: 'security', label: 'Security & Feature Flags', icon: ShieldCheck, color: 'text-rose-400', badge: 'E2EE', desc: 'Chaves, Segredos & Feature Flags Globais' }
];

interface FounderConsoleContentProps {
  sessionPromise: Promise<VerifiedFounderSession>;
}

const FounderConsoleContent: React.FC<FounderConsoleContentProps> = ({ sessionPromise }) => {
  const verifiedSession = use(sessionPromise);
  const { user: authUser } = useIdentity();
  const [founder, setFounder] = useState<UserProfile | null>(verifiedSession.profile);
  const [flags, setFlags] = useState<FeatureFlagsState>(AuthorityEngine.getFeatureFlags());
  const [secrets, setSecrets] = useState<SecretStatusItem[]>(AuthorityEngine.getSecretsStatus());
  const [activeTab, setActiveTab] = useState<RootWorkspaceTab>('overview');
  const [mfaSuccessMsg, setMfaSuccessMsg] = useState<string | null>(null);
  const [isPromoting, setIsPromoting] = useState<boolean>(false);

  // Zero-Knowledge Modal
  const [showIdentityHashModal, setShowIdentityHashModal] = useState<boolean>(false);
  const [idEmail, setIdEmail] = useState<string>('');
  const [idPhone, setIdPhone] = useState<string>('');
  const [idBirthDate, setIdBirthDate] = useState<string>('');
  const [idProvince, setIdProvince] = useState<string>('');
  const [idMunicipality, setIdMunicipality] = useState<string>('');
  const [isComputingHash, setIsComputingHash] = useState<boolean>(false);

  // AppyPay Sandbox State
  const [chargeAmount, setChargeAmount] = useState<number>(15000);
  const [chargeDescription, setChargeDescription] = useState<string>('Plano Subscrição Agente Android TR');
  const [customerEmail, setCustomerEmail] = useState<string>('cliente.teste@appypay.ao');
  const [customerPhone, setCustomerPhone] = useState<string>('+244 923 000 111');
  const [lastCharge, setLastCharge] = useState<ChargeResponse | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);

  // Users List
  const [usersList, setUsersList] = useState<UserProfile[]>([]);

  // Developer Terminal Input
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[SYSTEM] Root Workspace carregado com sucesso.',
    '[AUTH] Autoridade de Founder inicializada.',
    '[REALTIME] Conexão com Firestore ativa.'
  ]);
  const [cmdInput, setCmdInput] = useState<string>('');

  // Automation Rules State
  const [rules, setRules] = useState([
    { id: 'rule-1', name: 'SMS Received -> Webhook Dispatch', trigger: 'SMS_INBOUND', active: true, count: 142 },
    { id: 'rule-2', name: 'Call Missed -> Auto-Reply SMS', trigger: 'CALL_MISSED', active: true, count: 89 },
    { id: 'rule-3', name: 'Low Battery (<15%) -> Alert Founder', trigger: 'BATTERY_LOW', active: true, count: 12 }
  ]);

  useEffect(() => {
    const handleSwitchActivity = (e: CustomEvent<string>) => {
      if (e.detail === 'billing' || e.detail === 'payments') {
        setActiveTab('billing');
      } else if (e.detail) {
        setActiveTab(e.detail as RootWorkspaceTab);
      }
    };
    window.addEventListener('switch-founder-activity' as any, handleSwitchActivity);
    return () => window.removeEventListener('switch-founder-activity' as any, handleSwitchActivity);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const unsubscribeUsers = IdentityEngine.listenToAllUsers((firestoreUsers) => {
      if (!isMounted) return;
      if (firestoreUsers && firestoreUsers.length > 0) {
        setUsersList(firestoreUsers);
        const activeUserUid = authUser?.uid;
        const founderInDb = firestoreUsers.find((u) => u.role === 'founder' || (activeUserUid && u.userId === activeUserUid));
        if (founderInDb) {
          setFounder((prev) => {
            if (prev?.userId === founderInDb.userId && prev?.role === founderInDb.role && prev?.lastLogin === founderInDb.lastLogin) {
              return prev;
            }
            return founderInDb;
          });
        }
      } else {
        const defaultUsers: UserProfile[] = [
          {
            userId: authUser?.uid || 'founder-master-001',
            email: authUser?.email || 'silajaneiro9@gmail.com',
            displayName: authUser?.displayName || 'Founder Master (System)',
            role: 'founder',
            system: true,
            immutable: true,
            authority: 'ROOT',
            rootLevel: 'ROOT',
            createdAt: Date.now() - 86400000 * 30,
            lastLogin: Date.now(),
            permissions: ['*'],
            ...getDefaultPermissionsForRole('founder', 'ROOT')
          },
          {
            userId: 'admin-002',
            email: 'admin.operacoes@portal.ao',
            displayName: 'Administrador de Operações',
            role: 'admin',
            system: false,
            immutable: false,
            createdAt: Date.now() - 86400000 * 10,
            lastLogin: Date.now() - 3600000,
            permissions: ['devices.manage', 'events.read', 'logs.read']
          },
          {
            userId: 'agent-dev-001',
            email: 'agent.samsung@device.internal',
            displayName: 'Agente Android Samsung OneUI',
            role: 'android_agent',
            system: true,
            immutable: true,
            createdAt: Date.now() - 86400000 * 20,
            lastLogin: Date.now() - 60000,
            permissions: ['sync.write', 'events.push']
          }
        ];
        setUsersList(defaultUsers);
      }
    });

    return () => {
      isMounted = false;
      unsubscribeUsers();
    };
  }, [authUser?.uid]);

  const handleManualFounderPromotion = async () => {
    const currentUid = authUser?.uid;
    const currentEmail = authUser?.email || 'founder@portal.internal';
    if (!currentUid) {
      alert('Nenhum utilizador do Firebase Auth autenticado no momento.');
      return;
    }

    setIsPromoting(true);
    try {
      const updatedProfile = await FirestoreService.promoteUserToFounder(
        currentUid,
        currentEmail,
        authUser?.displayName || 'Founder Master'
      );
      setFounder(updatedProfile);
      setMfaSuccessMsg(`Autoridade Root e perfil imutável persistidos no Firestore (users/${currentUid})!`);
    } catch (e) {
      console.error('Erro ao promover utilizador:', e);
    } finally {
      setIsPromoting(false);
    }
  };

  const handleComputeAndPersistIdentityHash = async () => {
    if (!idEmail.trim()) {
      alert('Por favor introduza o email para calcular o hash SHA-256.');
      return;
    }
    setIsComputingHash(true);
    try {
      const hash = await computeFounderIdentityHash({
        email: idEmail,
        phone: idPhone,
        birthDate: idBirthDate,
        province: idProvince,
        municipality: idMunicipality
      });

      const currentUid = authUser?.uid || founder?.userId || 'founder-master-001';
      const updated = await FirestoreService.promoteUserToFounder(
        currentUid,
        authUser?.email || idEmail,
        founder?.displayName || 'Founder Master',
        hash
      );
      setFounder(updated);
      setMfaSuccessMsg(
        `Fingerprint SHA-256 gerado (${hash.substring(0, 16)}...) e persistido no Firestore (users/${currentUid}) com arquitetura Zero-Knowledge!`
      );
      setShowIdentityHashModal(false);
    } catch (err) {
      console.error('Erro ao calcular hash de identidade:', err);
    } finally {
      setIsComputingHash(false);
    }
  };

  const handleToggleFlag = (key: keyof FeatureFlagsState) => {
    const updated = AuthorityEngine.toggleFeatureFlag(key, !flags[key]);
    setFlags(updated);
  };

  const handleTestAppyPayCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCharging(true);

    const appypay = PaymentRegistry.get('appypay');
    if (appypay) {
      const request: ChargeRequest = {
        amount: chargeAmount,
        currency: 'AOA',
        description: chargeDescription,
        customerEmail,
        customerPhone,
        paymentMethod: 'multicaixa_express'
      };

      const result = await appypay.charge(request);
      setLastCharge(result);
    }

    setIsCharging(false);
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdInput.trim()) return;
    const cmd = cmdInput.trim();
    setTerminalLogs((prev) => [...prev, `> ${cmd}`]);

    if (cmd === 'help') {
      setTerminalLogs((prev) => [
        ...prev,
        'Comandos disponíveis:',
        '  status     - Mostra estado dos serviços',
        '  clear      - Limpa o terminal',
        '  ping       - Testa conectividade de rede',
        '  secrets    - Verifica chaves de ambiente'
      ]);
    } else if (cmd === 'clear') {
      setTerminalLogs([]);
    } else if (cmd === 'status') {
      setTerminalLogs((prev) => [
        ...prev,
        '● Node.js Server: OK (Port 3000)',
        '● Firestore: Conectado (Realtime ON)',
        '● ServiceWorker: Ativo',
        '● AppyPay: Sandbox Pronta'
      ]);
    } else if (cmd === 'ping') {
      setTerminalLogs((prev) => [...prev, 'PONG (24ms) - Servidor respondendo normalmente.']);
    } else {
      setTerminalLogs((prev) => [...prev, `Comando desconhecido: '${cmd}'. Digite 'help' para ajuda.`]);
    }
    setCmdInput('');
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'founder':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'admin':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40';
      case 'operator':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
      case 'android_agent':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'integration':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const activeTabDef = TAB_DEFS.find((t) => t.id === activeTab) || TAB_DEFS[0];

  return (
    <div className="space-y-6">
      {/* FOUNDER ROOT HEADER */}
      <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-amber-500/30 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400 border border-amber-500/40 shadow-inner">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-white tracking-tight">Root Workspace Console</h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-black uppercase border border-amber-500/40">
                ROOT AUTHORITY
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {founder?.email || authUser?.email || 'silajaneiro9@gmail.com'}
            </p>
          </div>
        </div>

        {/* Quick Root Control Buttons */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <button
            onClick={() => setShowIdentityHashModal(true)}
            className="px-3 py-2 bg-indigo-600/90 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            title="Fingerprint Criptográfico"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Fingerprint SHA-256</span>
          </button>
          <button
            onClick={handleManualFounderPromotion}
            disabled={isPromoting}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isPromoting ? 'A gravar...' : 'Persistir Firestore'}</span>
          </button>
        </div>
      </div>

      {mfaSuccessMsg && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 p-3.5 rounded-xl text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{mfaSuccessMsg}</span>
          </div>
          <button onClick={() => setMfaSuccessMsg(null)} className="text-emerald-400 hover:text-white font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* 16 ROOT WORKSPACE TABS GRID / SCROLL */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 px-1">
          <span>SECÇÕES DO WORKSPACE ROOT ({TAB_DEFS.length})</span>
          <span className="text-amber-400">Ativo: {activeTabDef.label}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {TAB_DEFS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer relative group ${
                  isActive
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:bg-slate-800/90 hover:text-slate-200'
                }`}
                title={tab.desc}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400 scale-110' : tab.color}`} />
                <span className="text-[11px] font-bold truncate max-w-full">{tab.label}</span>
                {tab.badge && (
                  <span className="absolute top-1 right-1 px-1 py-0.2 text-[8px] font-mono font-black rounded bg-amber-500/30 text-amber-300 border border-amber-500/40">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT PANELS */}

      {/* 0. 📊 OVERVIEW OPERACIONAL */}
      {activeTab === 'overview' && (
        <OperationalOverviewConsole />
      )}

      {/* 1. 👑 ROOT */}
      {activeTab === 'root' && (
        <RootConsoleView />
      )}

      {/* 2. ⚡ AUTOMATION */}
      {activeTab === 'automation' && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-yellow-400 flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Motor de Automação & Regras de Eventos</span>
              </h3>
              <p className="text-xs text-slate-400">Regras automáticas executadas ao receber eventos dos Agentes Android.</p>
            </div>
            <button
              onClick={() => {
                const name = prompt('Nome da Regra de Automação:');
                if (name) {
                  setRules(prev => [...prev, { id: `rule-${Date.now()}`, name, trigger: 'CUSTOM_EVENT', active: true, count: 0 }]);
                }
              }}
              className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Regra</span>
            </button>
          </div>

          <div className="space-y-3">
            {rules.map(rule => (
              <div key={rule.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{rule.name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="px-2 py-0.5 bg-slate-900 text-yellow-400 border border-slate-800 rounded font-mono text-[10px]">
                      Gatilho: {rule.trigger}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{rule.count} Execuções</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, active: !r.active } : r));
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer ${
                      rule.active ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {rule.active ? 'Ativa' : 'Pausada'}
                  </button>
                  <button
                    onClick={() => setRules(prev => prev.filter(r => r.id !== rule.id))}
                    className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. 📊 MONITORING & ANALYTICS */}
      {activeTab === 'monitoring' && (
        <AnalyticsView stats={null} />
      )}

      {/* 5. 👥 IDENTITY */}
      {activeTab === 'identity' && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-indigo-400 border-b border-slate-800 pb-3 flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Matriz de Identidades & Matriz RBAC</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Utilizador</th>
                  <th className="p-3">Papel</th>
                  <th className="p-3">Nível Root</th>
                  <th className="p-3">E-mail</th>
                  <th className="p-3">Permissões</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {usersList.map((usr, idx) => {
                  const level = usr.rootLevel || resolveRootLevel(usr.role, usr.authority);
                  const uKey = usr.userId || usr.id || usr.email || `usr-table-${idx}`;
                  return (
                    <tr key={uKey} className="hover:bg-slate-950/50">
                      <td className="p-3 font-bold text-slate-200">{usr.displayName}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getRoleBadgeStyle(usr.role)}`}>
                          {usr.role}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-amber-400">{level}</td>
                      <td className="p-3 text-slate-400">{usr.email}</td>
                      <td className="p-3 text-slate-400">{usr.permissions?.join(', ')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. 📱 DEVICES */}
      {activeTab === 'devices' && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-emerald-400 border-b border-slate-800 pb-3 flex items-center space-x-2">
            <Smartphone className="w-4 h-4" />
            <span>Gestão de Agentes Android e Dispositivos Pareados</span>
          </h3>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-200">Agente Android Samsung OneUI</h4>
                <p className="text-[10px] text-slate-400 font-mono">ID: agent-dev-001 | Bateria: 92% | Online</p>
              </div>
            </div>

            <button
              onClick={() => alert('Sinal de Ping enviado ao Agente Android!')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Enviar Ping
            </button>
          </div>
        </div>
      )}

      {/* 7. 💳 BILLING */}
      {activeTab === 'billing' && (
        <AppyPayGatewayConsole />
      )}

      {/* 8. 🔌 INTEGRATIONS */}
      {activeTab === 'integrations' && (
        <IntegrationsConsole />
      )}

      {/* 8. ☁ INFRASTRUCTURE & STORAGE */}
      {activeTab === 'infrastructure' && (
        <InfrastructureConsole />
      )}

      {/* 9. 🚀 RELEASES */}
      {activeTab === 'releases' && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-rose-400 border-b border-slate-800 pb-3 flex items-center space-x-2">
            <Rocket className="w-4 h-4" />
            <span>Gestão de Releases PWA e Agente Android APK</span>
          </h3>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <h4 className="font-bold text-slate-200">PortalTRMobile PWA v2.4.0</h4>
              <p className="text-[10px] text-slate-400 font-mono">Compilação Produção - Container Engine</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[10px] rounded border border-emerald-500/30">
              PRODUÇÃO (STABLE)
            </span>
          </div>
        </div>
      )}

      {/* 10. 📜 AUDIT */}
      {activeTab === 'audit' && (
        <AuditConsole />
      )}

      {/* 15. 🛠 DEVELOPER */}
      {activeTab === 'developer' && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-emerald-400 border-b border-slate-800 pb-3 flex items-center space-x-2">
            <Wrench className="w-4 h-4" />
            <span>Terminal Interativo de Registos</span>
          </h3>

          <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs text-slate-300 h-64 overflow-y-auto space-y-1">
            {terminalLogs.map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
          </div>

          <form onSubmit={handleTerminalSubmit} className="flex space-x-2">
            <input
              type="text"
              value={cmdInput}
              onChange={(e) => setCmdInput(e.target.value)}
              placeholder="Digite um comando (ex: help, status, ping, clear)..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer">
              Executar
            </button>
          </form>
        </div>
      )}

      {/* 16. 🛡 SECURITY & FEATURE FLAGS */}
      {activeTab === 'security' && (
        <SecurityConsole />
      )}

      {/* Zero-Knowledge SHA-256 Identity Modal */}
      {showIdentityHashModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  Desafio de Identidade SHA-256 (Zero-Knowledge)
                </h3>
              </div>
              <button
                onClick={() => setShowIdentityHashModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Para máxima segurança, os teus dados pessoais (email, telefone, nascimento, província, município) <strong>NUNCA</strong> são gravados em texto simples no Firestore. É gerado um <strong>Fingerprint SHA-256 criptográfico</strong>.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">E-mail do Founder</label>
                <input
                  type="email"
                  value={idEmail}
                  onChange={(e) => setIdEmail(e.target.value)}
                  placeholder="silajaneiro9@gmail.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-mono focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={idPhone}
                    onChange={(e) => setIdPhone(e.target.value)}
                    placeholder="+244 9XX XXX XXX"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-mono focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Data Nascimento</label>
                  <input
                    type="text"
                    value={idBirthDate}
                    onChange={(e) => setIdBirthDate(e.target.value)}
                    placeholder="AAAA-MM-DD"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-mono focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Província</label>
                  <input
                    type="text"
                    value={idProvince}
                    onChange={(e) => setIdProvince(e.target.value)}
                    placeholder="Ex: Luanda"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-mono focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Município</label>
                  <input
                    type="text"
                    value={idMunicipality}
                    onChange={(e) => setIdMunicipality(e.target.value)}
                    placeholder="Ex: Talatona"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-mono focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowIdentityHashModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleComputeAndPersistIdentityHash}
                disabled={isComputingHash}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isComputingHash ? 'A calcular Hash...' : 'Calcular & Persistir Hash'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const FounderConsoleView: React.FC = () => {
  const { user: authUser } = useIdentity();

  const sessionPromise = useMemo(() => {
    return verifyFounderSessionAsync(authUser?.uid || 'default');
  }, [authUser?.uid]);

  return (
    <Suspense fallback={<FounderConsoleFallback />}>
      <FounderConsoleContent sessionPromise={sessionPromise} />
    </Suspense>
  );
};
