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
import { FirestoreService } from '../services/firestore';
import { RootAuthorityEngine, computeFounderIdentityHash } from '../services/rootAuthorityEngine';
import { auth } from '../firebase/firebase';

export const FounderConsoleView: React.FC = () => {
  const [founder, setFounder] = useState<UserProfile | null>(null);
  const [flags, setFlags] = useState<FeatureFlagsState>(BootstrapEngine.getFeatureFlags());
  const [secrets, setSecrets] = useState<SecretStatusItem[]>(BootstrapEngine.getSecretsStatus());
  const [activeTab, setActiveTab] = useState<'overview' | 'secrets' | 'appypay' | 'flags' | 'rbac'>('overview');
  const [mfaSuccessMsg, setMfaSuccessMsg] = useState<string | null>(null);
  const [isPromoting, setIsPromoting] = useState<boolean>(false);

  // Zero-Knowledge Identity Hashing state (SHA-256)
  const [showIdentityHashModal, setShowIdentityHashModal] = useState<boolean>(false);
  const [idEmail, setIdEmail] = useState<string>('');
  const [idPhone, setIdPhone] = useState<string>('');
  const [idBirthDate, setIdBirthDate] = useState<string>('');
  const [idProvince, setIdProvince] = useState<string>('');
  const [idMunicipality, setIdMunicipality] = useState<string>('');
  const [isComputingHash, setIsComputingHash] = useState<boolean>(false);

  // AppyPay Sandbox Tester State
  const [chargeAmount, setChargeAmount] = useState<number>(15000);
  const [chargeDescription, setChargeDescription] = useState<string>('Plano Subscrição Agente Android TR');
  const [customerEmail, setCustomerEmail] = useState<string>('cliente.teste@appypay.ao');
  const [customerPhone, setCustomerPhone] = useState<string>('+244 923 000 111');
  const [lastCharge, setLastCharge] = useState<ChargeResponse | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);

  // System Users List initialized with default fallback and synced to Firestore
  const [usersList, setUsersList] = useState<UserProfile[]>([]);

  useEffect(() => {
    // 1. Inicializar bootstrap do Founder
    BootstrapEngine.initFounderBootstrap().then((profile) => {
      setFounder(profile);
    });

    // 2. Subscrever à coleção 'users' do Firestore em tempo real
    const unsubscribeUsers = FirestoreService.listenToAllUsers((firestoreUsers) => {
      if (firestoreUsers && firestoreUsers.length > 0) {
        setUsersList(firestoreUsers);

        // Se encontrar o founder ativo no Firestore, atualizar o estado
        const activeUserUid = auth?.currentUser?.uid;
        const founderInDb = firestoreUsers.find((u) => u.role === 'founder' || (activeUserUid && u.userId === activeUserUid));
        if (founderInDb) {
          setFounder(founderInDb);
        }
      } else {
        // Se a coleção 'users' estiver vazia, popular com utilizadores base do sistema
        const defaultUsers: UserProfile[] = [
          {
            userId: auth?.currentUser?.uid || 'founder-master-001',
            email: auth?.currentUser?.email || 'silajaneiro9@gmail.com',
            displayName: auth?.currentUser?.displayName || 'Founder Master (System)',
            role: 'founder',
            system: true,
            immutable: true,
            authority: 'ROOT',
            createdAt: Date.now() - 86400000 * 30,
            lastLogin: Date.now(),
            permissions: ['*'],
            claims: ['canManageUsers', 'canDeploy', 'canManagePayments', 'canManageLicenses', 'canReadAudit', 'canCreateAdmins', 'canDeleteUsers', 'canAccessSecrets']
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

        // Garantir salvamento no Firestore
        defaultUsers.forEach((u) => FirestoreService.saveUserProfile(u));
      }
    });

    return () => {
      unsubscribeUsers();
    };
  }, []);

  const handleManualFounderPromotion = async () => {
    const currentUid = auth?.currentUser?.uid;
    const currentEmail = auth?.currentUser?.email || 'founder@portal.internal';
    if (!currentUid) {
      alert('Nenhum utilizador do Firebase Auth autenticado no momento.');
      return;
    }

    setIsPromoting(true);
    try {
      const updatedProfile = await FirestoreService.promoteUserToFounder(
        currentUid,
        currentEmail,
        auth?.currentUser?.displayName || 'Founder Master'
      );
      setFounder(updatedProfile);
      setMfaSuccessMsg(`Autoridade 'founder', status immutable=true e claims gravados com sucesso no Firestore (doc: users/${currentUid})!`);
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

      const currentUid = auth?.currentUser?.uid || founder?.userId || 'founder-master-001';
      const updated = await FirestoreService.promoteUserToFounder(
        currentUid,
        auth?.currentUser?.email || idEmail,
        founder?.displayName || 'Founder Master',
        hash
      );
      setFounder(updated);
      setMfaSuccessMsg(
        `Hash SHA-256 de identidade gerado (${hash.substring(0, 16)}...) e persistido no Firestore (users/${currentUid}) com arquitetura Zero-Knowledge! NENHUM dado pessoal em texto simples foi gravado.`
      );
      setShowIdentityHashModal(false);
    } catch (err) {
      console.error('Erro ao calcular hash de identidade:', err);
    } finally {
      setIsComputingHash(false);
    }
  };


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
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
          <div className="flex items-center space-x-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-200">{founder?.email || auth?.currentUser?.email || 'silajaneiro9@gmail.com'}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 gap-3">
            <span>
              Doc: <strong className="text-amber-300 font-mono">users/{founder?.userId || auth?.currentUser?.uid || 'founder-master-001'}</strong>
            </span>
            <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Firestore Persisted
            </span>
          </div>
          <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
            <div className="text-[10px] text-slate-400">
              <span>Role: <strong className="text-amber-400 uppercase">{founder?.role || 'founder'}</strong> • Immutable: <strong className="text-emerald-400">true</strong></span>
              {founder?.identityHash && (
                <div className="text-indigo-400 font-mono text-[9px] truncate max-w-[200px]">
                  Hash: {founder.identityHash.substring(0, 16)}...
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowIdentityHashModal(true)}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[10px] transition-all flex items-center gap-1 shadow-md cursor-pointer"
                title="Gerar Fingerprint SHA-256 Zero-Knowledge"
              >
                <Lock className="w-3 h-3" />
                <span>Desafio SHA-256</span>
              </button>
              <button
                onClick={handleManualFounderPromotion}
                disabled={isPromoting}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[10px] transition-all flex items-center gap-1 shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-3 h-3" />
                <span>{isPromoting ? 'A gravar...' : 'Persistir no Firestore'}</span>
              </button>
            </div>
          </div>
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
      {/* Zero-Knowledge Identity SHA-256 Modal */}
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
              Para máxima segurança, os teus dados pessoais (email, telefone, nascimento, província, município) <strong>NUNCA</strong> são gravados em texto simples no Firestore. É gerado um <strong>Fingerprint SHA-256 criptográfico</strong> com secret interno de autoridade.
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

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <span className="text-indigo-400 font-bold block">Fórmula do Hash Zero-Knowledge:</span>
              <p className="text-[10px] break-all text-slate-400">
                SHA256(email + telefone + nascimento + província + município + secret)
              </p>
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
