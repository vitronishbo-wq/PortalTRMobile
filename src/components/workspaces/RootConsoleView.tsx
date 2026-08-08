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
  LifeBuoy
} from 'lucide-react';
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

  // Challenge Modal Inputs
  const [emailInput, setEmailInput] = useState<string>('deusfundador@portal.internal');
  const [systemKeyInput, setSystemKeyInput] = useState<string>('SYS-FOUNDER-DEUS-MASTER-2026-X99');
  const [recoveryCodeInput, setRecoveryCodeInput] = useState<string>('RC-9988-ROOT-KEY');
  const [deviceIdInput, setDeviceIdInput] = useState<string>('device-trusted-root-master');
  const [challengeError, setChallengeError] = useState<string | null>(null);

  // Active Sub-Pillar Tab in ROOT Workspace
  const [activeSubTab, setActiveSubTab] = useState<
    'identity' | 'founder' | 'admins' | 'delegation' | 'lockdown' | 'sessions' | 'recovery'
  >('identity');

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

  // Lists
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>(RootAuthorityEngine.getAuditLogs());
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [backups, setBackups] = useState<SystemBackupRecord[]>(RootAuthorityEngine.getBackups());
  const [isLockdown, setIsLockdown] = useState<boolean>(RootAuthorityEngine.isLockdownActive());

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

  const subPillarTabs = [
    { id: 'identity', label: '1. Root Identity', icon: Fingerprint, desc: 'Identidade Criptográfica SHA-256 e Múltiplo-Fator' },
    { id: 'founder', label: '2. Founder Status', icon: Crown, desc: 'Estatuto de Fundador Imutável e Atribuição Master' },
    { id: 'admins', label: '3. Admin Management', icon: UserCheck, desc: 'Gestão, Aprovação e Controlo de Administradores' },
    { id: 'delegation', label: '4. Delegation', icon: UserPlus, desc: 'Delegação de Permissões Granulares e Convites' },
    { id: 'lockdown', label: '5. Emergency Lockdown', icon: ShieldAlert, desc: 'Bloqueio Global de Emergência do Sistema' },
    { id: 'sessions', label: '6. Root Sessions', icon: KeyRound, desc: 'Sessões Elevações Ativas, Tokens & MFA' },
    { id: 'recovery', label: '7. Recovery', icon: LifeBuoy, desc: 'Chaves de Restauro e Snapshots de Emergência' }
  ] as const;

  return (
    <div className="space-y-6 font-sans text-slate-100 select-none">
      {/* Top Banner: Root Authority Header */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-100 tracking-tight">ROOT AUTHORITY CORE</h2>
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
              Autoridade Máxima do Ecossistema • Imutável, Autenticada e Soberana
            </p>
          </div>
        </div>

        {/* Action Controls */}
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
        /* Root Authority Core Workspace with 7 Sub-Pillars Navigation */
        <div className="space-y-5">
          {/* 7 Pillars Navigation Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {subPillarTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`p-3 rounded-xl border flex flex-col items-center text-center space-y-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                  title={tab.desc}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span className="text-[11px] font-bold leading-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-Pillar Views */}

          {/* 1. ROOT IDENTITY */}
          {activeSubTab === 'identity' && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
              <div className="border-b border-slate-800 pb-3 flex items-center space-x-3">
                <Fingerprint className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-amber-400">ROOT IDENTITY & SHA-256 FINGERPRINT</h3>
                  <p className="text-xs text-slate-400 font-sans">Identidade criptográfica zero-knowledge e prova de propriedade única.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase block">IDENTIFICADOR RAiZ</span>
                  <div className="font-bold text-slate-200">deusfundador@portal.internal</div>
                  <span className="text-[10px] text-amber-400 block font-sans">Imutável no Firestore</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase block">HASH SHA-256</span>
                  <div className="text-[10px] text-indigo-300 font-mono break-all">
                    a1f89bc2e7904bd29c8e11a9e8832049e01fca33990218ba12001e
                  </div>
                  <span className="text-[10px] text-emerald-400 block font-sans">Zero-Knowledge Validado</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase block">AUTENTICAÇÃO FATOR MÚLTIPLO</span>
                  <div className="text-emerald-400 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Conhecimento + Posse OK</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-sans">Trusted Device Bound</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. FOUNDER STATUS */}
          {activeSubTab === 'founder' && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
              <div className="border-b border-slate-800 pb-3 flex items-center space-x-3">
                <Crown className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-amber-400">FOUNDER STATUS & IMMUTABLE AUTHORITY</h3>
                  <p className="text-xs text-slate-400 font-sans">Estatuto soberano do Fundador. Não pode ser revogado por sub-administradores.</p>
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">ESTATUTO DO FUNDADOR</span>
                  <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold">
                    ROOT MASTER FOUNDER
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-sans">
                  O Founder possui a chave raiz do ecossistema PortalTRMobile. Nenhuma ação de administradores secundários pode revogar esta autoridade.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-300">
                    Nível de Acesso: <span className="text-amber-400 font-bold">L10 (Soberano)</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-300">
                    Acesso a Segredos: <span className="text-emerald-400 font-bold">SIM (Total)</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-300">
                    Gestão de Billing: <span className="text-indigo-400 font-bold">EXCLUSIVA</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-300">
                    Recuperação Master: <span className="text-amber-400 font-bold">HABILITADA</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. ADMIN MANAGEMENT */}
          {activeSubTab === 'admins' && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <UserCheck className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-bold text-indigo-400">ADMIN MANAGEMENT ({admins.length} Administradores)</h3>
                    <p className="text-xs text-slate-400 font-sans">Gestão e monitorização de sub-administradores do sistema.</p>
                  </div>
                </div>
              </div>

              {admins.length === 0 ? (
                <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 text-center text-slate-500 italic font-sans">
                  Nenhum sub-administrador secundário registado. Ative convites no módulo de Delegação.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {admins.map((adm) => (
                    <div key={adm.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between font-bold text-slate-200">
                        <span>{adm.displayName}</span>
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] rounded uppercase">
                          {adm.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{adm.email}</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {adm.permissions.map((p) => (
                          <span key={p} className="px-1.5 py-0.5 bg-slate-900 text-slate-400 text-[9px] rounded border border-slate-800">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. DELEGATION */}
          {activeSubTab === 'delegation' && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
              <div className="border-b border-slate-800 pb-3 flex items-center space-x-3">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-amber-400">DELEGATION & SINGLE-USE TOKENS</h3>
                  <p className="text-xs text-slate-400 font-sans">Gerar convites seguros com papéis específicos e expiração de 72h.</p>
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

          {/* 5. EMERGENCY LOCKDOWN */}
          {activeSubTab === 'lockdown' && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-rose-500/30 space-y-4 font-mono text-xs">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <div>
                    <h3 className="text-sm font-bold text-rose-400">EMERGENCY LOCKDOWN ENGINE</h3>
                    <p className="text-xs text-slate-400 font-sans">Isolar o ecossistema e congelar alterações em situações de perigo.</p>
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

          {/* 6. ROOT SESSIONS */}
          {activeSubTab === 'sessions' && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
              <div className="border-b border-slate-800 pb-3 flex items-center space-x-3">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-amber-400">ROOT ELEVATED SESSIONS</h3>
                  <p className="text-xs text-slate-400 font-sans">Sessões elevações ativas com validade temporal restrita.</p>
                </div>
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
                    <span className="text-slate-500 block text-[10px]">STATUS MFA</span>
                    <span className="text-emerald-400 font-bold">VERIFIED (MULTI-FACTOR)</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">EXPIRA EM</span>
                    <span className="text-indigo-400 font-bold">{new Date(session.expiresAt).toLocaleTimeString('pt-BR')}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-500 italic">
                  Nenhuma sessão elevada ativa.
                </div>
              )}
            </div>
          )}

          {/* 7. RECOVERY */}
          {activeSubTab === 'recovery' && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <LifeBuoy className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-emerald-400">DISASTER RECOVERY & BACKUP SNAPSHOTS</h3>
                    <p className="text-xs text-slate-400 font-sans">Snapshots do estado do sistema e códigos de recuperação de emergência.</p>
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

              <div className="space-y-2">
                {backups.map((bkp) => (
                  <div key={bkp.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-200">
                      <span>{bkp.id}</span>
                      <span className="text-emerald-400 font-mono text-[10px]">{(bkp.sizeBytes / 1024).toFixed(1)} KB</span>
                    </div>
                    <p className="text-slate-400 text-[10px]">{bkp.description}</p>
                    <span className="text-slate-500 text-[9px] block">Checksum SHA256: {bkp.checksum}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

