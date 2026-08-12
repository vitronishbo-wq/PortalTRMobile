import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Crown,
  Zap,
  Clock,
  Sparkles,
  Gift,
  Award,
  TrendingUp,
  ShieldCheck,
  Tag,
  AlertTriangle,
  Plus,
  Copy,
  Check,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Calendar,
  Layers,
  ChevronRight,
  Activity,
  Sliders,
  FileCheck,
  UserCheck,
  UserX,
  Smartphone,
  MessageSquare,
  Lock,
  Unlock,
  Key
} from 'lucide-react';
import {
  SubscriptionEngine,
  SubscriptionPlan,
  SubscriptionRecord,
  PromotionCampaign,
  BonusAllocation,
  ExtensionRecord,
  EntitlementClaim,
  SubscriptionStatus
} from '../../services/subscriptionEngine';
import { TrialEngine, LicenseRecord } from '../../services/trialEngine';
import { IdentityEngine } from '../../engine/identityEngine';
import { UserProfile } from '../../types/User';

export const SubscriptionsConsole: React.FC = () => {
  // Main Subscriptions Hierarchy Tab Switcher:
  // Subscriptions -> Plans | Trials | Promotions | Bonuses | Extensions | Expiration | Entitlements
  const [subTab, setSubTab] = useState<
    'subscriptions' | 'plans' | 'trials' | 'promotions' | 'bonuses' | 'extensions' | 'expiration' | 'entitlements'
  >('subscriptions');

  // Real-time Users List from IdentityEngine / Firestore
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [promotions, setPromotions] = useState<PromotionCampaign[]>(SubscriptionEngine.getPromotions());
  const [bonusLogs, setBonusLogs] = useState<BonusAllocation[]>(SubscriptionEngine.getBonusLogs());
  const [extensionLogs, setExtensionLogs] = useState<ExtensionRecord[]>(SubscriptionEngine.getExtensionLogs());

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Extension Modal State
  const [selectedUserForAction, setSelectedUserForAction] = useState<UserProfile | null>(null);
  const [extensionAction, setExtensionAction] = useState<
    '+3d' | '+15d' | '+30d' | '+90d' | '+365d' | 'lifetime' | 'reset' | 'grace_period'
  >('+30d');
  const [extensionReason, setExtensionReason] = useState<string>('');
  const [actionFeedback, setActionFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Bonus Grant Modal State
  const [bonusDaysInput, setBonusDaysInput] = useState<number>(15);
  const [bonusReasonInput, setBonusReasonInput] = useState<string>('Bónus de fidelização e alta disponibilidade de agentes');

  // Promo Redemption Form State
  const [redeemCodeInput, setRedeemCodeInput] = useState<string>('');
  const [redeemUserInput, setRedeemUserInput] = useState<string>('usr-248');
  const [redeemFeedback, setRedeemFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Entitlement Assessor Tool State
  const [evalUserId, setEvalUserId] = useState<string>('usr-248');
  const [evalUserEmail, setEvalUserEmail] = useState<string>('mario.silva@empresa.ao');
  const [evalClaim, setEvalClaim] = useState<EntitlementClaim>('cpaas_custom_webhooks');
  const [evalResult, setEvalResult] = useState<boolean | null>(null);

  const refreshData = () => {
    IdentityEngine.listenToAllUsers((fetchedUsers) => {
      let finalUsers = fetchedUsers;
      if (!fetchedUsers || fetchedUsers.length === 0) {
        finalUsers = [
          {
            userId: 'deusfundador-master-001',
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
            userId: 'usr-248',
            email: 'mario.silva@empresa.ao',
            displayName: 'Mário Silva (Operador de Caixa)',
            role: 'user',
            system: false,
            immutable: false,
            createdAt: Date.now() - 86400000 * 5,
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
            createdAt: Date.now() - 86400000 * 14,
            lastLogin: Date.now() - 3600000,
            permissions: ['payments.write']
          }
        ];
      }
      setUsers(finalUsers);

      const subsList = finalUsers.map((u) => SubscriptionEngine.getSubscription(u.userId, u.email, u.displayName));
      setSubscriptions(subsList);
      setPromotions(SubscriptionEngine.getPromotions());
      setBonusLogs(SubscriptionEngine.getBonusLogs());
      setExtensionLogs(SubscriptionEngine.getExtensionLogs());
    });
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Handle Extension Submission
  const handleApplyExtension = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAction) return;

    const res = SubscriptionEngine.applyExtension(
      selectedUserForAction.userId,
      selectedUserForAction.email,
      extensionAction,
      extensionReason || 'Ajuste direto efetuado na consola de Subscrições',
      'silajaneiro9@gmail.com'
    );

    setActionFeedback(res);
    refreshData();
    setTimeout(() => {
      setActionFeedback(null);
      setSelectedUserForAction(null);
    }, 2500);
  };

  // Handle Bonus Submission
  const handleGrantBonus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAction) return;

    const res = SubscriptionEngine.grantBonusDays(
      selectedUserForAction.userId,
      selectedUserForAction.email,
      bonusDaysInput,
      bonusReasonInput,
      'FOUNDER_ROOT'
    );

    setActionFeedback(res);
    refreshData();
    setTimeout(() => {
      setActionFeedback(null);
      setSelectedUserForAction(null);
    }, 2500);
  };

  // Handle Promo Redemption
  const handleRedeemPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUser = users.find((u) => u.userId === redeemUserInput) || users[0];
    const res = SubscriptionEngine.redeemPromotionCode(redeemCodeInput, targetUser.userId, targetUser.email);
    setRedeemFeedback(res);
    refreshData();
  };

  // Evaluate Entitlement Claim
  const handleEvaluateEntitlement = () => {
    const res = SubscriptionEngine.hasEntitlement(evalUserId, evalUserEmail, evalClaim);
    setEvalResult(res);
  };

  // Filtered Subscriptions
  const filteredSubs = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const ALL_ENTITLEMENT_CLAIMS: { claim: EntitlementClaim; label: string; desc: string; risk: string }[] = [
    { claim: '*', label: 'Master Entitlement (*)', desc: 'Acesso total a todas as funcionalidades e quotas ilimitadas.', risk: 'ROOT' },
    { claim: 'cpaas_sms_gateway', label: 'CPaaS SMS Gateway', desc: 'Disparo de SMS bidirecional e envio de comandos via agente Android.', risk: 'BASIC' },
    { claim: 'cpaas_custom_webhooks', label: 'CPaaS Custom Webhooks', desc: 'Registrar webhooks HTTP externos para escutar eventos em tempo real.', risk: 'PRO' },
    { claim: 'multi_device_sync', label: 'Sincronização Multi-Dispositivo', desc: 'Conectar múltiplos smartphones Android na mesma conta.', risk: 'PRO' },
    { claim: 'appypay_gateway', label: 'Gateway Multicaixa AppyPay', desc: 'Cobrança automatizada e conciliação de saldos via Multicaixa Express.', risk: 'PRO' },
    { claim: 'unlimited_ai', label: 'IA Gemini Sem Limites', desc: 'Análise contínua de inteligência artificial em conversas e logs.', risk: 'ENTERPRISE' },
    { claim: 'custom_domain', label: 'Domínio Customizado', desc: 'Apontar subdomínio próprio para o workspace do utilizador.', risk: 'ENTERPRISE' },
    { claim: 'audit_exporter', label: 'Exportador de Auditoria', desc: 'Exportação em massa de livros-razão de eventos e pagamentos.', risk: 'ENTERPRISE' },
    { claim: 'high_priority_queue', label: 'Fila de Alta Prioridade', desc: 'Execução prioritária de payloads no BatchQueue com latência <5ms.', risk: 'PRO' },
    { claim: 'dedicated_agent_mesh', label: 'Mesh Dedicado de Agentes', desc: 'Comunicação P2P isolada entre agentes Android.', risk: 'ENTERPRISE' }
  ];

  return (
    <div className="space-y-6 font-sans text-slate-100 select-none">
      {/* Explicit Hierarchy Header Banner */}
      <div className="bg-slate-900/95 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black shadow-md shadow-indigo-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              {/* Hierarchy Tree Visual */}
              <div className="flex items-center space-x-2 text-xs font-mono font-black text-indigo-400 tracking-wider">
                <span className="bg-indigo-500/20 px-2.5 py-0.5 rounded border border-indigo-500/30">SUBSCRIPTIONS</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                <span className="bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                  ENTITLEMENTS LAYER
                </span>
              </div>
              <h1 className="text-base font-extrabold text-slate-100 mt-1">
                CAMADA AUTÓNOMA DE SUBSCRIÇÕES, PLANOS E DIREITOS (ENTITLEMENTS)
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Total Subscrições:</span>
            <span className="text-amber-400 font-bold">{subscriptions.length}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Ativas:</span>
            <span className="text-emerald-400 font-bold">{subscriptions.filter((s) => s.status === 'ACTIVE' || s.status === 'LIFETIME' || s.status === 'TRIAL').length}</span>
          </div>
        </div>

        {/* Scope Rule Notification */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-indigo-500/30 flex items-center justify-between text-xs font-mono text-indigo-300">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              <strong>CAMADA ISOLADA SUBSCRIPTIONS:</strong> Módulo independente desacoplado do menu de Utilizadores para gestão de Planos, Experiências (Trials), Promoções, Bónus, Extensões, Expiração e Entitlements.
            </span>
          </div>
        </div>
      </div>

      {/* Subscriptions 7-Pillar Sub-Navigation Hierarchy:
          Subscriptions | Plans | Trials | Promotions | Bonuses | Extensions | Expiration | Entitlements */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {[
          { id: 'subscriptions', label: 'Subscriptions', desc: 'Subscrições Ativas', icon: CreditCard, count: subscriptions.length },
          { id: 'plans', label: 'Plans', desc: 'Planos & Tarifas', icon: Layers, count: SubscriptionEngine.PLANS.length },
          { id: 'trials', label: 'Trials', desc: 'Período Experimental', icon: Clock, count: subscriptions.filter((s) => s.isTrial).length },
          { id: 'promotions', label: 'Promotions', desc: 'Códigos & Campanhas', icon: Tag, count: promotions.length },
          { id: 'bonuses', label: 'Bonuses', desc: 'Ledger de Bónus', icon: Gift, count: bonusLogs.length },
          { id: 'extensions', label: 'Extensions', desc: 'Histórico de Extensões', icon: RotateCcw, count: extensionLogs.length },
          { id: 'expiration', label: 'Expiration', desc: 'Ciclo & Expiração', icon: AlertTriangle, count: subscriptions.filter((s) => s.status === 'EXPIRED').length },
          { id: 'entitlements', label: 'Entitlements', desc: 'Direitos & Quotas', icon: FileCheck, count: ALL_ENTITLEMENT_CLAIMS.length }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`p-2.5 rounded-xl border flex flex-col items-center text-center space-y-1 transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span className="text-xs font-extrabold">{tab.label}</span>
              <span className="text-[10px] text-slate-500 font-mono">({tab.count})</span>
            </button>
          );
        })}
      </div>

      {/* SUB-SECTION 1: ACTIVE SUBSCRIPTIONS */}
      {subTab === 'subscriptions' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">GESTÃO DE SUBSCRIÇÕES ATIVAS</h3>
                <p className="text-xs text-slate-400 font-mono">Listagem de contas, planos associados e status de ciclo de vida.</p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Pesquisar utilizador ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
              >
                <option value="ALL">Todos os Status</option>
                <option value="ACTIVE">Ativos</option>
                <option value="TRIAL">Trial</option>
                <option value="LIFETIME">Vitalício</option>
                <option value="EXPIRED">Expirados</option>
              </select>
            </div>
          </div>

          {/* Subscriptions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubs.map((sub) => (
              <div
                key={sub.id}
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                  sub.lifetime
                    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 border-amber-500/40'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="space-y-2 font-mono">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-100 text-xs flex items-center space-x-1">
                        <span>{sub.userName}</span>
                        {sub.lifetime && <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{sub.userEmail}</div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        sub.status === 'LIFETIME'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : sub.status === 'TRIAL'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : sub.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Plano Actual:</span>
                      <span className="text-amber-400 font-bold">{sub.planName}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Expira em:</span>
                      <span className="text-slate-300">
                        {sub.lifetime ? 'Nunca (Vitalício)' : new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Bónus Acumulados: +{sub.bonusDaysTotal}d</span>
                      <span>Trial: {sub.isTrial ? 'SIM' : 'NÃO'}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      const u = users.find((x) => x.userId === sub.userId) || {
                        userId: sub.userId,
                        email: sub.userEmail,
                        displayName: sub.userName,
                        role: 'user',
                        system: false,
                        immutable: false,
                        createdAt: Date.now()
                      };
                      setSelectedUserForAction(u);
                    }}
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Ajustar / Estender Subscrição</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-SECTION 2: PLANS & TARIFFS */}
      {subTab === 'plans' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Layers className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">CATÁLOGO DE PLANOS E TARIFAS DE SUBSCRIÇÃO</h3>
                <p className="text-xs text-slate-400 font-mono">Definição das quotas operacionais, limites de agentes e preços em Kwanza (AOA).</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SubscriptionEngine.PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                  plan.featured
                    ? 'bg-gradient-to-b from-indigo-950/60 via-slate-950 to-slate-950 border-indigo-500/60 shadow-xl shadow-indigo-500/10'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="space-y-3 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-100 text-sm">{plan.name}</span>
                    {plan.featured && (
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[9px] font-bold border border-indigo-500/30">
                        MAIS POPULAR
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 font-sans leading-snug">{plan.description}</p>

                  <div className="py-2 border-y border-slate-800/80 space-y-1">
                    <div className="text-xl font-black text-amber-400">
                      {plan.priceMonthlyAOA === 0 ? 'Gratuito' : `${plan.priceMonthlyAOA.toLocaleString('pt-AO')} Kz/mês`}
                    </div>
                    {plan.priceAnnualAOA > 0 && (
                      <div className="text-[10px] text-slate-500">Anuidade: {plan.priceAnnualAOA.toLocaleString('pt-AO')} Kz/ano</div>
                    )}
                  </div>

                  {/* Quotas Matrix */}
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Agentes Android: <strong>{plan.maxDevices === 9999 ? 'Ilimitado' : plan.maxDevices}</strong></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>SMS Diários: <strong>{plan.maxDailySms.toLocaleString('pt-PT')}</strong></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Tokens IA Gemini: <strong>{(plan.aiTokensPerMonth / 1000).toFixed(0)}k/mês</strong></span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Entitlements Incluídos:</span>
                    <div className="flex flex-wrap gap-1">
                      {plan.entitlements.map((e) => (
                        <span key={e} className="px-2 py-0.5 bg-slate-900 text-slate-300 text-[9px] rounded border border-slate-800">
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-SECTION 3: TRIALS */}
      {subTab === 'trials' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">PAINEL DE PERÍODOS EXPERIMENTAIS (SMART TRIALS)</h3>
                <p className="text-xs text-slate-400 font-mono">Monitorização de novas contas no ciclo de trial de 7 dias e conversões.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-4 bg-slate-950 rounded-xl border border-indigo-500/30 space-y-1">
              <span className="text-slate-400 block text-[10px]">Contas em Trial Ativo</span>
              <div className="text-2xl font-black text-indigo-400">
                {subscriptions.filter((s) => s.isTrial && s.status === 'TRIAL').length}
              </div>
              <span className="text-[10px] text-slate-500">Período padrão: 7 dias de acesso total</span>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-1">
              <span className="text-slate-400 block text-[10px]">Taxa de Conversão para Pro</span>
              <div className="text-2xl font-black text-emerald-400">84.2%</div>
              <span className="text-[10px] text-slate-500">Conversões após onboarding automático</span>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-amber-500/30 space-y-1">
              <span className="text-slate-400 block text-[10px]">Média de Dias Bónus Concedidos</span>
              <div className="text-2xl font-black text-amber-400">+12.5 Dias</div>
              <span className="text-[10px] text-slate-500">Atribuídos por campanhas de integração</span>
            </div>
          </div>

          {/* List of Active Trials */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
            <span className="font-bold text-slate-200 text-xs block uppercase">Utilizadores em Período de Experiência</span>
            <div className="space-y-2">
              {subscriptions
                .filter((s) => s.isTrial)
                .map((sub) => {
                  const daysLeft = Math.max(0, Math.ceil((sub.currentPeriodEnd - Date.now()) / 86400000));
                  return (
                    <div key={sub.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-100">{sub.userName} ({sub.userEmail})</div>
                        <div className="text-[10px] text-slate-400">Início: {new Date(sub.startDate).toLocaleDateString('pt-BR')} • Expira em: {new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR')}</div>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 font-bold rounded border border-indigo-500/40 text-xs">
                          {daysLeft} dias restantes
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 4: PROMOTIONS */}
      {subTab === 'promotions' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6 font-mono text-xs">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Tag className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">CAMPANHAS E CÓDIGOS PROMOCIONAIS</h3>
                <p className="text-xs text-slate-400 font-sans">Gestão de cupons de desconto, upgrades de licença e resgate de promoções.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Promotion Campaigns */}
            <div className="space-y-3">
              <span className="font-bold text-slate-200 text-xs block uppercase">Campanhas Promocionais Ativas</span>
              <div className="space-y-3">
                {promotions.map((p) => (
                  <div key={p.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400 text-sm bg-slate-900 px-2.5 py-0.5 rounded border border-slate-800">{p.code}</span>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        {p.redemptionsCount} / {p.maxRedemptions} Resgates
                      </span>
                    </div>
                    <div className="font-bold text-slate-200">{p.name}</div>
                    <p className="text-slate-400 font-sans text-xs">{p.description}</p>
                    <div className="text-[10px] text-slate-500">Válido até: {new Date(p.validUntil).toLocaleDateString('pt-BR')}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Promo Code Redemption */}
            <form onSubmit={handleRedeemPromo} className="p-5 bg-slate-950 rounded-xl border border-indigo-500/30 space-y-4">
              <span className="font-bold text-indigo-400 text-xs block uppercase">Resgatar Código Promocional em Conta</span>

              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Selecionar Utilizador Alvo:</label>
                <select
                  value={redeemUserInput}
                  onChange={(e) => setRedeemUserInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer font-mono"
                >
                  {users.map((u, idx) => {
                    const uKey = u.userId || u.id || u.email || `usr-opt-${idx}`;
                    return (
                      <option key={uKey} value={u.userId || uKey}>
                        {u.displayName} ({u.email})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Inserir Código Promo (ex: ANGOLA2026):</label>
                <input
                  type="text"
                  placeholder="ex: ANGOLA2026, PIONEER-LIFETIME"
                  value={redeemCodeInput}
                  onChange={(e) => setRedeemCodeInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              {redeemFeedback && (
                <div
                  className={`p-3 rounded-lg text-xs font-bold ${
                    redeemFeedback.success ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                  }`}
                >
                  {redeemFeedback.message}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Validar e Aplicar Código
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUB-SECTION 5: BONUSES */}
      {subTab === 'bonuses' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-5 font-mono text-xs">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Gift className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">LIVRO-RAZÃO DE BÓNUS E RECOMPENSAS</h3>
                <p className="text-xs text-slate-400 font-sans">Registo histórico de dias bónus concedidos por automação e recomendação.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {bonusLogs.map((b) => (
              <div key={b.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">{b.userEmail} (+{b.grantedDays} Dias Bónus)</div>
                  <div className="text-slate-400 font-sans text-xs">{b.reason}</div>
                  <div className="text-[10px] text-slate-500">Atribuído por: {b.grantedBy} • {new Date(b.timestamp).toLocaleString('pt-BR')}</div>
                </div>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg font-bold border border-emerald-500/30">
                  +{b.grantedDays}d
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-SECTION 6: EXTENSIONS */}
      {subTab === 'extensions' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-5 font-mono text-xs">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <RotateCcw className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">HISTÓRICO DE EXTENSÕES DE SUBSCRIÇÃO</h3>
                <p className="text-xs text-slate-400 font-sans">Auditoria de alterações manuais de validade e garantias executadas na consola.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {extensionLogs.map((ext) => (
              <div key={ext.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-amber-400">{ext.userEmail} (Ação: {ext.type})</div>
                  <div className="text-slate-300 font-sans text-xs">{ext.reason}</div>
                  <div className="text-[10px] text-slate-500">Executado por: {ext.executedBy} • {new Date(ext.timestamp).toLocaleString('pt-BR')}</div>
                </div>
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-lg font-bold border border-amber-500/30">
                  {ext.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-SECTION 7: EXPIRATION */}
      {subTab === 'expiration' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-5 font-mono text-xs">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">CICLO DE VIDA E EXPIRAÇÃO DE SUBSCRIÇÕES</h3>
                <p className="text-xs text-slate-400 font-sans">Monitorização de licenças expiradas, suspensões temporárias e tolerância de pagamento.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <span className="font-bold text-rose-400 text-xs block uppercase">Subscrições Expiradas ou Suspensas:</span>
            {subscriptions.filter((s) => s.status === 'EXPIRED' || s.status === 'SUSPENDED').length === 0 ? (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-500 italic text-center">
                Nenhuma subscrição expirada no momento.
              </div>
            ) : (
              subscriptions
                .filter((s) => s.status === 'EXPIRED' || s.status === 'SUSPENDED')
                .map((sub) => (
                  <div key={sub.id} className="p-4 bg-slate-950 rounded-xl border border-rose-500/30 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-200">{sub.userName} ({sub.userEmail})</div>
                      <div className="text-rose-400 text-[11px]">Expirou em: {new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <button
                      onClick={() => {
                        SubscriptionEngine.applyExtension(sub.userId, sub.userEmail, '+30d', 'Reativação pós-expiração', 'FOUNDER_ROOT');
                        refreshData();
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all cursor-pointer"
                    >
                      Reativar por +30 Dias
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* SUB-SECTION 8: ENTITLEMENTS */}
      {subTab === 'entitlements' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6 font-mono text-xs">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileCheck className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">DIREITOS, QUOTAS E ENTITLEMENTS ENGINE</h3>
                <p className="text-xs text-slate-400 font-sans">Avaliador em tempo real de privilégios e capacidades habilitadas por conta.</p>
              </div>
            </div>
          </div>

          {/* Entitlements Directory */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ALL_ENTITLEMENT_CLAIMS.map((item) => (
              <div key={item.claim} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 text-xs">{item.claim}</span>
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[9px] font-bold">
                    {item.risk}
                  </span>
                </div>
                <div className="font-bold text-slate-200 text-xs">{item.label}</div>
                <p className="text-slate-400 font-sans text-[11px] leading-snug">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Interactive Entitlement Evaluator */}
          <div className="p-5 bg-slate-950 rounded-xl border border-indigo-500/30 space-y-3">
            <span className="font-bold text-indigo-400 text-xs block uppercase">Avaliador de Entitlement (`SubscriptionEngine.hasEntitlement`)</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Email do Utilizador:</label>
                <input
                  type="email"
                  value={evalUserEmail}
                  onChange={(e) => setEvalUserEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Entitlement Claim:</label>
                <select
                  value={evalClaim}
                  onChange={(e) => setEvalClaim(e.target.value as EntitlementClaim)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer font-mono"
                >
                  {ALL_ENTITLEMENT_CLAIMS.map((item) => (
                    <option key={item.claim} value={item.claim}>
                      {item.claim} ({item.label})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleEvaluateEntitlement}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded cursor-pointer text-xs font-mono"
                >
                  Verificar Habilitação
                </button>
              </div>
            </div>

            {evalResult !== null && (
              <div
                className={`p-3 rounded-lg border text-center font-bold text-xs ${
                  evalResult
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                }`}
              >
                {evalResult
                  ? `✓ ENTITLEMENT ATIVO: O utilizador '${evalUserEmail}' possui o direito '${evalClaim}' habilitado.`
                  : `✕ ENTITLEMENT INATIVO: O utilizador '${evalUserEmail}' NÃO possui o direito '${evalClaim}'.`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL / DRAWER FOR EXTENSION & BONUS ACTIONS */}
      {selectedUserForAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-amber-400 text-sm">Gerir Subscrição de {selectedUserForAction.displayName}</h3>
              </div>
              <button
                onClick={() => setSelectedUserForAction(null)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {actionFeedback && (
              <div
                className={`p-3 rounded-lg font-bold ${
                  actionFeedback.success ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                }`}
              >
                {actionFeedback.message}
              </div>
            )}

            <form onSubmit={handleApplyExtension} className="space-y-3">
              <span className="font-bold text-slate-200 text-xs block uppercase">1. Ajustar Validade / Estender Licença:</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: '+3d', label: '+3 Dias (Curto)' },
                  { id: '+15d', label: '+15 Dias (Onboarding)' },
                  { id: '+30d', label: '+30 Dias (1 Mês)' },
                  { id: '+90d', label: '+90 Dias (Trimestre)' },
                  { id: '+365d', label: '+365 Dias (1 Ano)' },
                  { id: 'lifetime', label: 'Vitalício (Ilimitado)' }
                ].map((act) => (
                  <button
                    type="button"
                    key={act.id}
                    onClick={() => setExtensionAction(act.id as any)}
                    className={`p-2 rounded border font-bold text-xs cursor-pointer ${
                      extensionAction === act.id
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Motivo da Alteração (ex: Cortesia comercial / Suporte)..."
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                Executar Ajuste de Subscrição
              </button>
            </form>

            <form onSubmit={handleGrantBonus} className="pt-3 border-t border-slate-800 space-y-3">
              <span className="font-bold text-slate-200 text-xs block uppercase">2. Atribuir Bónus em Dias:</span>
              <div className="grid grid-cols-3 gap-2">
                {[7, 15, 30].map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setBonusDaysInput(d)}
                    className={`p-1.5 rounded border font-bold text-xs cursor-pointer ${
                      bonusDaysInput === d
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    +{d} Dias
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Conceder Bónus em Dias
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
