import React, { useState, useEffect } from 'react';
import {
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
  ArrowRight
} from 'lucide-react';
import { BootstrapEngine, FeatureFlagsState, SecretStatusItem } from '../services/bootstrapEngine';
import { PaymentRegistry, ChargeResponse, ChargeRequest } from '../services/paymentEngine';
import { UserProfile, UserRole } from '../types/User';

export const FounderConsoleView: React.FC = () => {
  const [founder, setFounder] = useState<UserProfile | null>(null);
  const [flags, setFlags] = useState<FeatureFlagsState>(BootstrapEngine.getFeatureFlags());
  const [secrets, setSecrets] = useState<SecretStatusItem[]>(BootstrapEngine.getSecretsStatus());
  const [activeTab, setActiveTab] = useState<'overview' | 'secrets' | 'appypay' | 'flags' | 'rbac'>('overview');

  // AppyPay Sandbox Tester State
  const [chargeAmount, setChargeAmount] = useState<number>(15000);
  const [chargeDescription, setChargeDescription] = useState<string>('Plano Subscrição Agente Android TR');
  const [customerEmail, setCustomerEmail] = useState<string>('cliente.teste@appypay.ao');
  const [customerPhone, setCustomerPhone] = useState<string>('+244 923 000 111');
  const [lastCharge, setLastCharge] = useState<ChargeResponse | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);

  // System Users List
  const [usersList, setUsersList] = useState<UserProfile[]>([
    {
      userId: 'founder-master-001',
      email: 'silajaneiro9@gmail.com',
      displayName: 'Founder Master (System)',
      role: 'founder',
      system: true,
      immutable: true,
      createdAt: Date.now() - 86400000 * 30,
      lastLogin: Date.now(),
      permissions: ['*']
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
      userId: 'op-003',
      email: 'operador.suporte@portal.ao',
      displayName: 'Operador Nível 1',
      role: 'operator',
      system: false,
      immutable: false,
      createdAt: Date.now() - 86400000 * 5,
      lastLogin: Date.now() - 7200000,
      permissions: ['events.read']
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
    },
    {
      userId: 'integration-appypay',
      email: 'webhook.appypay@api.internal',
      displayName: 'Integração Webhook AppyPay',
      role: 'integration',
      system: true,
      immutable: true,
      createdAt: Date.now() - 86400000 * 15,
      lastLogin: Date.now() - 120000,
      permissions: ['payments.webhook']
    }
  ]);

  useEffect(() => {
    BootstrapEngine.initFounderBootstrap().then((profile) => {
      setFounder(profile);
    });
  }, []);

  const handleToggleFlag = (key: keyof FeatureFlagsState) => {
    const updated = BootstrapEngine.toggleFeatureFlag(key, !flags[key]);
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

  return (
    <div className="space-y-6">
      {/* Founder Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 p-6 rounded-2xl border border-amber-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Crown className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-100 tracking-tight flex items-center space-x-2">
                <span>Console Administrativa do Founder</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase border border-amber-500/40">
                  System Immutable
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Bootstrap Controlado • RBAC Multinível • Monitor de Segredos • Sandbox AppyPay
              </p>
            </div>
          </div>
        </div>

        {/* Founder Identity Card */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
          <div className="flex items-center space-x-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-200">{founder?.email || 'silajaneiro9@gmail.com'}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>Role: <strong className="text-amber-400 uppercase">{founder?.role || 'founder'}</strong></span>
            <span className="text-emerald-400 font-mono font-bold">✓ Bootstrap Lock</span>
          </div>
        </div>
      </div>

      {/* Console Sub-Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Visão Geral</span>
        </button>

        <button
          onClick={() => setActiveTab('secrets')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'secrets'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Estado dos Segredos</span>
        </button>

        <button
          onClick={() => setActiveTab('appypay')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'appypay'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Gateway AppyPay (Sandbox)</span>
        </button>

        <button
          onClick={() => setActiveTab('flags')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'flags'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Feature Flags</span>
        </button>

        <button
          onClick={() => setActiveTab('rbac')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'rbac'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestão de Papéis (RBAC)</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">User Principal</span>
              <span className="text-base font-bold text-amber-400 flex items-center space-x-1.5">
                <Crown className="w-4 h-4" />
                <span>Founder Master</span>
              </span>
              <span className="text-[10px] text-slate-500 block">System Immutable Profile</span>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">Gateways de Pagamento</span>
              <span className="text-base font-bold text-emerald-400 flex items-center space-x-1.5">
                <CreditCard className="w-4 h-4" />
                <span>AppyPay Pronta</span>
              </span>
              <span className="text-[10px] text-slate-500 block">Multicaixa Express AOA</span>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">Total Utilizadores & Roles</span>
              <span className="text-base font-bold text-indigo-400 font-mono">5 Utilizadores</span>
              <span className="text-[10px] text-slate-500 block">Founder, Admin, Op, Agent, AppyPay</span>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">Estado do Bootstrap</span>
              <span className="text-base font-bold text-emerald-400 font-mono flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Concluído</span>
              </span>
              <span className="text-[10px] text-slate-500 block">Lock de Segurança Ativo</span>
            </div>
          </div>

          {/* Architecture Summary Card */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Hierarquia de Papéis do Sistema (RBAC)</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 font-bold text-center">
                Founder (Master)
              </div>
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 font-bold text-center">
                Admin
              </div>
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-bold text-center">
                Operator
              </div>
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-300 font-bold text-center">
                User
              </div>
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-bold text-center">
                Android Agent
              </div>
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 font-bold text-center">
                Integration
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SECRETS MONITOR */}
      {activeTab === 'secrets' && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Estado e Presença de Segredos (Sem Exposição de Chaves)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Segredos e tokens privados são mantidos apenas nas variáveis de ambiente (.env) do servidor Cloud.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {secrets.map((sec) => (
              <div
                key={sec.id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200">{sec.name}</h4>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono">
                    {sec.statusLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">{sec.modeLabel}</p>
                <span className="text-[10px] text-slate-500 block">
                  Última validação: {new Date(sec.lastChecked).toLocaleTimeString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: APPYPAY GATEWAY SANDBOX */}
      {activeTab === 'appypay' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Testador Sandbox AppyPay (Multicaixa Express AOA)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulação da criação de cobranças e verificação do status com retorno de referência Multicaixa.
              </p>
            </div>

            <form onSubmit={handleTestAppyPayCharge} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Montante da Cobrança (AOA Kwanza)</label>
                <input
                  type="number"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Descrição</label>
                <input
                  type="text"
                  value={chargeDescription}
                  onChange={(e) => setChargeDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">E-mail do Cliente</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isCharging}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                {isCharging ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Criar Cobrança AppyPay</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* AppyPay Response Panel */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>Resposta do Gateway AppyPay (Retorno Sandbox)</span>
            </h3>

            {lastCharge ? (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">ID da Cobrança:</span>
                  <span className="text-indigo-400 font-bold">{lastCharge.chargeId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-emerald-400 font-bold uppercase">{lastCharge.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Montante:</span>
                  <span className="text-emerald-400 font-bold">{lastCharge.amount.toLocaleString()} {lastCharge.currency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Referência Multicaixa Express:</span>
                  <span className="text-amber-400 font-bold">{lastCharge.referenceCode}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <p>{lastCharge.message}</p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500 font-mono">
                Execute o teste ao lado para gerar uma referência AppyPay.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: FEATURE FLAGS */}
      {activeTab === 'flags' && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Gestão Dinâmica de Feature Flags (Persistido no Firestore)</span>
          </h3>

          <div className="space-y-3">
            {(Object.keys(flags) as (keyof FeatureFlagsState)[]).map((flagKey) => {
              const isEnabled = flags[flagKey];
              return (
                <div
                  key={flagKey}
                  className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800/80"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-200 font-mono block">{flagKey}</span>
                    <span className="text-[11px] text-slate-400">
                      {flagKey === 'appypay.enabled'
                        ? 'Ativa o módulo de integração de pagamentos AppyPay'
                        : flagKey === 'payments.enabled'
                        ? 'Habilita subscrições e cobranças no portal'
                        : flagKey === 'admin.enabled'
                        ? 'Permite acesso ao painel administrativo'
                        : flagKey === 'developer.enabled'
                        ? 'Mostra ferramentas de diagnóstico e logs'
                        : 'Ativa proxy de rede para bypass de CORS'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleFlag(flagKey)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isEnabled
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {isEnabled ? '● ATIVO' : '○ DESATIVADO'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: RBAC SYSTEM */}
      {activeTab === 'rbac' && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center space-x-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Matriz de Utilizadores & Papéis Atribuidos</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Utilizador / Entidade</th>
                  <th className="p-3">Papel (Role)</th>
                  <th className="p-3">E-mail</th>
                  <th className="p-3">Permissões</th>
                  <th className="p-3">Imutável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {usersList.map((usr) => (
                  <tr key={usr.userId} className="hover:bg-slate-950/50">
                    <td className="p-3 font-bold text-slate-200">{usr.displayName}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getRoleBadgeStyle(
                          usr.role
                        )}`}
                      >
                        {usr.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{usr.email}</td>
                    <td className="p-3 text-slate-400">{usr.permissions?.join(', ')}</td>
                    <td className="p-3">
                      {usr.immutable ? (
                        <span className="text-amber-400 font-bold">✓ Imutável</span>
                      ) : (
                        <span className="text-slate-500">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
