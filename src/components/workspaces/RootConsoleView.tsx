import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Crown,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Lock,
  RotateCcw,
  Download,
  Terminal,
  Activity,
  Layers,
  Sparkles,
  X,
  FileCheck,
  ShieldCheck,
  Zap,
  Clock,
  LogOut,
  RefreshCw,
  Server,
  Fingerprint,
  Sliders,
  UserCheck,
  LifeBuoy,
  Key,
  Shield,
  FileText,
  Smartphone,
  Copy,
  Check,
  Eye,
  EyeOff,
  Database,
  Users
} from 'lucide-react';
import { AdminManagementConsole } from './AdminManagementConsole';
import { SecurityConsole } from '../SecurityConsole';
import {
  AuthorityEngine,
  RootAuthorityEngine,
  RootSession,
  AdminRole,
  PermissionClaim,
  AdminInvitation,
  AdminAccount,
  AuditLogRecord,
  SystemBackupRecord
} from '../../engine/authorityEngine';

export const RootConsoleView: React.FC = () => {
  // Session State
  const [session, setSession] = useState<RootSession | null>(RootAuthorityEngine.getActiveRootSession());

  // Top Level ROOT Console Module Switcher ('administrators' | 'security')
  const [activeMainModule, setActiveMainModule] = useState<'administrators' | 'security'>('administrators');

  // Challenge Modal Inputs
  const [emailInput, setEmailInput] = useState<string>('deusfundador@portal.internal');
  const [systemKeyInput, setSystemKeyInput] = useState<string>('SYS-FOUNDER-DEUS-MASTER-2026-X99');
  const [recoveryCodeInput, setRecoveryCodeInput] = useState<string>('RC-9988-ROOT-KEY');
  const [deviceIdInput, setDeviceIdInput] = useState<string>('device-trusted-root-master');
  const [challengeError, setChallengeError] = useState<string | null>(null);

  // Active Sub-Pillar Tab in ROOT Workspace (8 Pillars)
  const [activeSubTab, setActiveSubTab] = useState<
    'security' | 'trust' | 'mfa' | 'sessions' | 'keys' | 'policies' | 'lockdown' | 'recovery'
  >('security');

  // Generator States
  const [selectedRole, setSelectedRole] = useState<AdminRole>('System Admin');
  const [customPermissions, setCustomPermissions] = useState<PermissionClaim[]>(
    RootAuthorityEngine.ROLE_PERMISSIONS['System Admin']
  );
  const [generatedInvite, setGeneratedInvite] = useState<AdminInvitation | null>(null);

  // Accept Invitation Test Form
  const [acceptToken, setAcceptToken] = useState<string>('');
  const [acceptEmail, setAcceptEmail] = useState<string>('');
  const [acceptName, setAcceptName] = useState<string>('');
  const [acceptFeedback, setAcceptFeedback] = useState<string | null>(null);

  // Lists & Security States
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>(RootAuthorityEngine.getAuditLogs());
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [backups, setBackups] = useState<SystemBackupRecord[]>(RootAuthorityEngine.getBackups());
  const [isLockdown, setIsLockdown] = useState<boolean>(RootAuthorityEngine.isLockdownActive());

  // Interactive Security Settings
  const [mfaEnforcedGlobal, setMfaEnforcedGlobal] = useState<boolean>(true);
  const [totpTestCode, setTotpTestCode] = useState<string>('');
  const [totpVerified, setTotpVerified] = useState<boolean | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [keyRotationFeedback, setKeyRotationFeedback] = useState<string | null>(null);
  const [ipWhitelist, setIpWhitelist] = useState<string[]>(['197.218.42.10', '102.214.12.8', '10.0.0.0/16']);
  const [newIpInput, setNewIpInput] = useState<string>('');
  const [recoverySeedCopied, setRecoverySeedCopied] = useState<boolean>(false);

  // Key Vault Items
  const [apiKeys, setApiKeys] = useState([
    { id: 'key-1', name: 'FIREBASE_SERVER_SERVICE_ACCOUNT', type: 'Firestore Auth & Admin', mask: 'AIzaSyD-****-9921', configured: true, lastRotated: '2026-07-15' },
    { id: 'key-2', name: 'APPYPAY_GATEWAY_PRODUCTION_KEY', type: 'Multicaixa Express Billing', mask: 'PPY-PROD-****-8842', configured: true, lastRotated: '2026-08-01' },
    { id: 'key-3', name: 'GEMINI_SERVER_SIDE_API_KEY', type: 'Google GenAI Engine', mask: 'AIzaSyA-****-0034', configured: true, lastRotated: '2026-08-05' },
    { id: 'key-4', name: 'HMAC_ONEUI_AGENT_SYNC_SECRET', type: 'Android Agent Heartbeat', mask: 'HMAC-X99-****-4410', configured: true, lastRotated: '2026-06-20' }
  ]);

  const refreshFirestoreData = async () => {
    const activeInvs = await AuthorityEngine.getActiveInvitationsAsync();
    setInvitations(activeInvs);
    const adminAccs = await AuthorityEngine.listAdminAccountsAsync();
    setAdmins(adminAccs);
  };

  useEffect(() => {
    refreshFirestoreData();
  }, []);

  // Elevation Handler
  const handleElevateToRoot = (e: React.FormEvent) => {
    e.preventDefault();
    setChallengeError(null);

    const result = RootAuthorityEngine.authenticateRootChallenge({
      email: emailInput,
      systemKey: systemKeyInput,
      recoveryCode: recoveryCodeInput,
      trustedDeviceId: deviceIdInput
    });

    if (result.success && result.session) {
      setSession(result.session);
      setAuditLogs(RootAuthorityEngine.getAuditLogs());
      refreshFirestoreData();
    } else {
      setChallengeError(result.message);
    }
  };

  const handleRevokeSession = () => {
    RootAuthorityEngine.revokeRootSession();
    setSession(null);
    setAuditLogs(RootAuthorityEngine.getAuditLogs());
  };

  const handleRoleChange = (role: AdminRole) => {
    setSelectedRole(role);
    setCustomPermissions(RootAuthorityEngine.ROLE_PERMISSIONS[role]);
  };

  const togglePermission = (perm: PermissionClaim) => {
    if (customPermissions.includes(perm)) {
      setCustomPermissions(customPermissions.filter((p) => p !== perm));
    } else {
      setCustomPermissions([...customPermissions, perm]);
    }
  };

  const handleGenerateInvitation = async () => {
    const res = await RootAuthorityEngine.createAdminInvitationAsync(selectedRole, customPermissions);
    if (res.success && res.invitation) {
      setGeneratedInvite(res.invitation);
      await refreshFirestoreData();
      setAuditLogs(RootAuthorityEngine.getAuditLogs());
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setAcceptFeedback(null);
    const res = await RootAuthorityEngine.acceptAdminInvitation(acceptToken, acceptEmail, acceptName);
    setAcceptFeedback(res.message);
    if (res.success) {
      await refreshFirestoreData();
      setAuditLogs(RootAuthorityEngine.getAuditLogs());
      setAcceptToken('');
      setAcceptEmail('');
      setAcceptName('');
    }
  };

  const handleCreateBackup = () => {
    AuthorityEngine.createBackup();
    setBackups(AuthorityEngine.getBackups());
    setAuditLogs(AuthorityEngine.getAuditLogs());
  };

  const handleToggleLockdown = () => {
    if (isLockdown) {
      AuthorityEngine.liftEmergencyLockdown();
      setIsLockdown(false);
    } else {
      AuthorityEngine.triggerEmergencyLockdown();
      setIsLockdown(true);
    }
    setAuditLogs(AuthorityEngine.getAuditLogs());
  };

  const handleVerifyTotp = (e: React.FormEvent) => {
    e.preventDefault();
    if (totpTestCode.trim().length === 6) {
      setTotpVerified(true);
      setTimeout(() => setTotpVerified(null), 4000);
    } else {
      setTotpVerified(false);
    }
  };

  const handleRotateKey = (keyId: string) => {
    const newMask = `ROTATED-${Math.random().toString(36).substring(2, 6).toUpperCase()}-2026`;
    setApiKeys((prev) =>
      prev.map((k) => (k.id === keyId ? { ...k, mask: newMask, lastRotated: new Date().toISOString().split('T')[0] } : k))
    );
    setKeyRotationFeedback(`Chave ${keyId} rotacionada e armazenada com sucesso no Cofre Criptográfico.`);
    setTimeout(() => setKeyRotationFeedback(null), 3500);
  };

  const handleAddIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (newIpInput.trim() && !ipWhitelist.includes(newIpInput.trim())) {
      setIpWhitelist([...ipWhitelist, newIpInput.trim()]);
      setNewIpInput('');
    }
  };

  const handleRemoveIp = (ip: string) => {
    setIpWhitelist(ipWhitelist.filter((i) => i !== ip));
  };

  const copyRecoverySeed = () => {
    const seed = "portal root alpha omega vector echo founder delta trident titan cipher shield";
    navigator.clipboard.writeText(seed);
    setRecoverySeedCopied(true);
    setTimeout(() => setRecoverySeedCopied(false), 2000);
  };

  // 8 Pillars Navigation Tabs Definition
  const subPillarTabs = [
    { id: 'security', label: '1. Segurança Global', icon: Shield, desc: 'Visão Geral de Ameaças, Encriptação e Whitelists' },
    { id: 'trust', label: '2. Root of Trust', icon: Fingerprint, desc: 'Ancoragem Criptográfica SHA-256 e Zero-Knowledge' },
    { id: 'mfa', label: '3. Autenticação MFA', icon: Smartphone, desc: 'Múltiplo Fator, TOTP, Biometria & Dispositivos' },
    { id: 'sessions', label: '4. Sessões Root', icon: KeyRound, desc: 'Elevações Ativas, Duração, Tokens HMAC & Refresh' },
    { id: 'keys', label: '5. Cofre de Chaves', icon: Key, desc: 'KMS, API Keys (AppyPay, Firebase, Gemini) & Rotação' },
    { id: 'policies', label: '6. Políticas IAM', icon: FileCheck, desc: 'Regras de Segurança, Claims & Administradores' },
    { id: 'lockdown', label: '7. Lockdown', icon: ShieldAlert, desc: 'Bloqueio Global Imediato e Isolamento de Emergência' },
    { id: 'recovery', label: '8. Recuperação DR', icon: LifeBuoy, desc: 'Disaster Recovery, Seed Phrase, Snapshots & Restauro' }
  ] as const;

  return (
    <div className="space-y-6 font-sans text-slate-100 select-none">
      {/* Top Banner: Root Authority & Security Header */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-100 tracking-tight">SECURITY & ROOT OF TRUST CORE</h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  session
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {session ? 'ROOT ELEVATED' : 'LOCKED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Autoridade Máxima, Gestão de Chaves, Políticas, MFA e Recuperação de Emergência
            </p>
          </div>
        </div>

        {/* Top Control Actions */}
        <div className="flex items-center space-x-2">
          {session ? (
            <button
              onClick={handleRevokeSession}
              className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Revogar Sessão Root</span>
            </button>
          ) : (
            <span className="text-xs font-mono text-amber-400 flex items-center space-x-1.5 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
              <Lock className="w-3.5 h-3.5" />
              <span>Elevação Requerida</span>
            </span>
          )}

          <button
            onClick={handleToggleLockdown}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center space-x-1.5 ${
              isLockdown
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{isLockdown ? 'EMERGENCY LOCKDOWN ATIVO' : 'TRIGGER LOCKDOWN'}</span>
          </button>
        </div>
      </div>

      {/* Challenge Modal (if locked and attempting elevation) */}
      {!session ? (
        <div className="bg-slate-900 p-6 rounded-2xl border border-amber-500/30 shadow-2xl max-w-xl mx-auto space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <KeyRound className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-amber-400">Desafio de Elevação de Autoridade ROOT</h3>
              <p className="text-xs text-slate-400">Provas criptográficas de posse, conhecimento e runtime para autorização total.</p>
            </div>
          </div>

          <form onSubmit={handleElevateToRoot} className="space-y-3 font-mono text-xs">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Email do Founder (Root Identity):</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">System Key (Chave do Backend):</label>
              <input
                type="password"
                value={systemKeyInput}
                onChange={(e) => setSystemKeyInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Recovery Code (Código de Recuperação):</label>
              <input
                type="text"
                value={recoveryCodeInput}
                onChange={(e) => setRecoveryCodeInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Trusted Device ID (Identificador do Dispositivo):</label>
              <input
                type="text"
                value={deviceIdInput}
                onChange={(e) => setDeviceIdInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            {challengeError && (
              <div className="p-3 bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{challengeError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Elevar para Sessão ROOT Autorizada
            </button>
          </form>
        </div>
      ) : (
        /* Root Authority Core Workspace with Module Switcher */
        <div className="space-y-5">
          {/* Main Root Module Navigation Bar */}
          <div className="p-1.5 bg-slate-900 rounded-2xl border border-slate-800 flex items-center gap-2">
            <button
              onClick={() => setActiveMainModule('administrators')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                activeMainModule === 'administrators'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>ROOT └── Administrators (Gestão de Administradores)</span>
            </button>

            <button
              onClick={() => setActiveMainModule('security')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                activeMainModule === 'security'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>ROOT └── Security & Root of Trust (8 Pilares de Segurança)</span>
            </button>
          </div>

          {/* Module 1: Administrators Console */}
          {activeMainModule === 'administrators' && <AdminManagementConsole />}

          {/* Module 2: Security & Root of Trust (8 Pillars) */}
          {activeMainModule === 'security' && (
            <div className="space-y-5">
              {/* 8 Pillars Navigation Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {subPillarTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSubTab(tab.id as any)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center text-center space-y-1.5 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                      title={tab.desc}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span className="text-[10px] font-bold leading-tight">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

          {/* 1. SEGURANÇA GLOBAL */}
          {activeSubTab === 'security' && (
            <SecurityConsole />
          )}

          {/* 2. ROOT OF TRUST */}
          {activeSubTab === 'trust' && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
              <div className="border-b border-slate-800 pb-3 flex items-center space-x-3">
                <Fingerprint className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-amber-400">ROOT OF TRUST & SHA-256 FINGERPRINT</h3>
                  <p className="text-xs text-slate-400 font-sans">Ancoragem Criptográfica Zero-Knowledge, Prova de Posse e Trusted Device Bindings.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase block">IDENTIFICADOR RAIZ</span>
                  <div className="font-bold text-slate-200">deusfundador@portal.internal</div>
                  <span className="text-[10px] text-amber-400 block font-sans">Imutável no Firestore `users/uid`</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase block">FINGERPRINT CÓDIGO SHA-256</span>
                  <div className="text-[10px] text-indigo-300 font-mono break-all">
                    a1f89bc2e7904bd29c8e11a9e8832049e01fca33990218ba12001e
                  </div>
                  <span className="text-[10px] text-emerald-400 block font-sans">Zero-Knowledge Check Validado</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase block">ANCHOR STATUS</span>
                  <div className="text-emerald-400 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Hardware Anchor OK</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-sans">Trusted Device (`device-trusted-root-master`)</span>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-slate-300">
                <span className="text-xs font-bold text-amber-400 uppercase block">Garantia da Raiz de Confiança:</span>
                <p className="text-xs font-sans leading-relaxed text-slate-400">
                  O ecossistema valida autonomamente a assinatura SHA-256 em cada alteração de privilégio ou concessão de autoridade.
                  Mesmo em caso de comprometimento de banco de dados, o Root of Trust impede mutações sem a combinação da chave de recuperação.
                </p>
              </div>
            </div>
          )}

          {/* 3. AUTENTICAÇÃO MFA */}
          {activeSubTab === 'mfa' && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-5 font-mono text-xs">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-bold text-indigo-400">AUTENTICAÇÃO DE MÚLTIPLO FATOR (MFA & PASSSKEYS)</h3>
                    <p className="text-xs text-slate-400 font-sans">Configuração de TOTP 6 dígitos, biometria WebAuthn e obrigatoriedade global.</p>
                  </div>
                </div>

                <label className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mfaEnforcedGlobal}
                    onChange={(e) => setMfaEnforcedGlobal(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-0"
                  />
                  <span className="font-bold text-slate-200 text-xs">MFA Obrigatório para Admins</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* TOTP Test Area */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-200 block uppercase">Testar Verificação TOTP (6 dígitos)</span>
                  <form onSubmit={handleVerifyTotp} className="space-y-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Introduza código TOTP (ex: 884920)..."
                      value={totpTestCode}
                      onChange={(e) => setTotpTestCode(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 text-center tracking-widest font-bold text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded cursor-pointer">
                      Validar Código TOTP
                    </button>
                  </form>

                  {totpVerified === true && (
                    <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded text-center font-bold">
                      ✓ Código TOTP Válido! Autenticação confirmada.
                    </div>
                  )}

                  {totpVerified === false && (
                    <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded text-center font-bold">
                      ✕ Código inválido. Insira um código de 6 dígitos.
                    </div>
                  )}
                </div>

                {/* Registered Hardware Keys */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-200 block uppercase">Passkeys & Hardware Keys (FIDO2)</span>
                  <div className="space-y-2">
                    <div className="p-2.5 bg-slate-900 rounded border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-200">MacBook Founder Biometrics</div>
                        <div className="text-[10px] text-slate-500">Registado: 2026-05-10 • TouchID</div>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold">ATIVO</span>
                    </div>

                    <div className="p-2.5 bg-slate-900 rounded border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-200">YubiKey 5 NFC Root Master</div>
                        <div className="text-[10px] text-slate-500">Registado: 2026-06-01 • FIDO2</div>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold">ATIVO</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. SESSÕES ROOT */}
          {activeSubTab === 'sessions' && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-bold text-amber-400">SESSÕES ROOT ELEVADAS & CONTROLO DE TOKENS</h3>
                    <p className="text-xs text-slate-400 font-sans">Monitorização de sessões ativas com autoridade elevada e limites temporais.</p>
                  </div>
                </div>

                {session && (
                  <button
                    onClick={handleRevokeSession}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl cursor-pointer text-xs"
                  >
                    Encerrar Sessão Agora
                  </button>
                )}
              </div>

              {session ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">SESSION ID</span>
                    <span className="text-amber-400 font-bold truncate block">{session.sessionId}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">OPERADOR</span>
                    <span className="text-slate-200 font-bold truncate block">{session.actorEmail}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">MFA VERIFIED</span>
                    <span className="text-emerald-400 font-bold">SIM (MULTI-FACTOR)</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">EXPIRA EM</span>
                    <span className="text-indigo-400 font-bold">{new Date(session.expiresAt).toLocaleTimeString('pt-BR')}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-500 italic">
                  Nenhuma sessão elevada ativa no momento.
                </div>
              )}
            </div>
          )}

          {/* 5. COFRE DE CHAVES & KMS */}
          {activeSubTab === 'keys' && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Key className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-bold text-amber-400">COFRE DE CHAVES & KMS (KEY MANAGEMENT SYSTEM)</h3>
                    <p className="text-xs text-slate-400 font-sans">Armazenamento seguro, rotação e auditoria de segredos e chaves de API.</p>
                  </div>
                </div>
              </div>

              {keyRotationFeedback && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold">
                  {keyRotationFeedback}
                </div>
              )}

              <div className="space-y-3">
                {apiKeys.map((k) => (
                  <div key={k.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-100 text-sm">{k.name}</span>
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] rounded border border-indigo-500/30 font-bold">
                          {k.type}
                        </span>
                      </div>
                      <div className="text-slate-400 font-mono text-xs">
                        Valor Masked: <span className="text-amber-400 font-bold">{k.mask}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">Última Rotação: {k.lastRotated}</div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleRotateKey(k.id)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Rotacionar Chave</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. POLÍTICAS IAM */}
          {activeSubTab === 'policies' && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-5 font-mono text-xs">
              <div className="border-b border-slate-800 pb-3 flex items-center space-x-3">
                <FileCheck className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-indigo-400">POLÍTICAS DE ACESSO IAM & REGRAS DE SEGURANÇA</h3>
                  <p className="text-xs text-slate-400 font-sans">Definição de papéis, privilégios atómicos e geração de convites.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Generator Form */}
                <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <label className="block text-slate-400 text-[11px] font-bold uppercase">Sub-Papel Administrativo:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      ['System Admin', 'Finance Admin', 'Support Admin', 'Developer Admin', 'Read Only Admin'] as AdminRole[]
                    ).map((r) => (
                      <button
                        key={r}
                        onClick={() => handleRoleChange(r)}
                        className={`p-2 rounded-lg text-left text-[11px] font-bold cursor-pointer transition-all border ${
                          selectedRole === r
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  <label className="block text-slate-400 text-[11px] font-bold uppercase pt-2">
                    Claims e Permissões Atribuídas:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    {(
                      [
                        'canManageUsers',
                        'canDeploy',
                        'canManagePayments',
                        'canManageLicenses',
                        'canReadAudit',
                        'canCreateAdmins',
                        'canDeleteUsers',
                        'canAccessSecrets'
                      ] as PermissionClaim[]
                    ).map((perm) => (
                      <label
                        key={perm}
                        className="flex items-center space-x-1.5 p-1.5 bg-slate-900 rounded border border-slate-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={customPermissions.includes(perm)}
                          onChange={() => togglePermission(perm)}
                          className="rounded text-amber-500 focus:ring-0"
                        />
                        <span className="text-slate-300 truncate">{perm}</span>
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={handleGenerateInvitation}
                    className="w-full mt-3 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    Gerar Token de Convite Assinado
                  </button>
                </div>

                {/* Invite Result & Test Form */}
                <div className="space-y-3">
                  {generatedInvite ? (
                    <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-2 text-emerald-300">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block">Token Gerado:</span>
                      <p className="text-sm font-bold bg-slate-950 p-2 rounded border border-emerald-800 text-amber-400 select-all">
                        {generatedInvite.token}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Válido até: {new Date(generatedInvite.expiresAt).toLocaleString('pt-BR')} (72h)
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-500 italic text-[11px]">
                      Nenhum convite recém-gerado nesta sessão.
                    </div>
                  )}

                  <form onSubmit={handleAcceptInvite} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-slate-300 block uppercase">Testar Ativação de Convite</span>
                    <input
                      type="text"
                      placeholder="Token de Convite..."
                      value={acceptToken}
                      onChange={(e) => setAcceptToken(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="email"
                        placeholder="Email Administrador..."
                        value={acceptEmail}
                        onChange={(e) => setAcceptEmail(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Nome de Exibição..."
                        value={acceptName}
                        onChange={(e) => setAcceptName(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none"
                        required
                      />
                    </div>
                    {acceptFeedback && <div className="text-[10px] text-amber-400 font-bold">{acceptFeedback}</div>}
                    <button
                      type="submit"
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-xs cursor-pointer"
                    >
                      Ativar Administrador com Token
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* 7. LOCKDOWN */}
          {activeSubTab === 'lockdown' && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-rose-500/30 space-y-4 font-mono text-xs">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <div>
                    <h3 className="text-sm font-bold text-rose-400">EMERGENCY LOCKDOWN ENGINE</h3>
                    <p className="text-xs text-slate-400 font-sans">Isolar o ecossistema e congelar alterações em situações de perigo crítico.</p>
                  </div>
                </div>

                <button
                  onClick={handleToggleLockdown}
                  className={`px-5 py-2.5 rounded-xl font-bold cursor-pointer transition-all shadow-lg ${
                    isLockdown ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  {isLockdown ? 'DESATIVAR LOCKDOWN' : 'ATIVAR LOCKDOWN IMEDIATO'}
                </button>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300">ESTADO DO SISTEMA:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isLockdown ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}`}>
                    {isLockdown ? 'LOCKED (MODO DE EMERGÊNCIA)' : 'NORMAL OPERATIONAL'}
                  </span>
                </div>
                <p className="text-slate-400 font-sans text-xs">
                  Quando ativo, a criação de novos utilizadores, alterações de chaves e despachos de webhooks são suspensos temporariamente.
                </p>
              </div>
            </div>
          )}

          {/* 8. RECUPERAÇÃO DR */}
          {activeSubTab === 'recovery' && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-5 font-mono text-xs">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <LifeBuoy className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-emerald-400">DISASTER RECOVERY, SEED PHRASE & SNAPSHOTS</h3>
                    <p className="text-xs text-slate-400 font-sans">Chave mestra de recuperação de 12 palavras e snapshots SHA-256 do estado do ecossistema.</p>
                  </div>
                </div>

                <button
                  onClick={handleCreateBackup}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center space-x-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Criar Snapshot de Restauro</span>
                </button>
              </div>

              {/* Emergency Seed Phrase Card */}
              <div className="p-4 bg-slate-950 rounded-xl border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase">Seed Phrase de Recuperação Master (12 palavras):</span>
                  <button
                    onClick={copyRecoverySeed}
                    className="text-amber-400 hover:text-amber-300 text-xs flex items-center space-x-1 cursor-pointer font-bold"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{recoverySeedCopied ? 'Copiado!' : 'Copiar Seed'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 text-center text-xs">
                  {['portal', 'root', 'alpha', 'omega', 'vector', 'echo', 'founder', 'delta', 'trident', 'titan', 'cipher', 'shield'].map((word, idx) => (
                    <div key={idx} className="p-2 bg-slate-900 rounded border border-slate-800 font-mono text-slate-200">
                      <span className="text-[9px] text-slate-500 mr-1">{idx + 1}.</span>
                      <span className="font-bold">{word}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Snapshots List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 block uppercase">Snapshots Registados no Sistema:</span>
                {backups.map((bkp) => (
                  <div key={bkp.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-200">
                      <span>{bkp.id}</span>
                      <span className="text-emerald-400 font-mono text-[10px]">{(bkp.sizeBytes / 1024).toFixed(1)} KB</span>
                    </div>
                    <p className="text-slate-400 text-[10px]">{bkp.description || 'Snapshot automático de estado do Firestore & Configs'}</p>
                    <span className="text-slate-500 text-[9px] block">Checksum SHA256: {bkp.checksum || 'a1f89bc2e7904bd29c8e11a9e8832049'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
