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
  Server
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

  // Invitation Generator States
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

  return (
    <div className="space-y-6 font-sans text-slate-100 select-none">
      {/* 1. Header Bar with Root Elevation Status */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-100 tracking-tight">ROOT OF TRUST CONSOLE</h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  session
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {session ? 'ROOT ELEVATED SESSION' : 'LOCKED (REQUIRE CHALLENGE)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Autoridade Raiz Imutável • Modelo Múltiplo-Fator (Knowledge + Possession + Runtime)
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

      {/* 2. Challenge Form Modal (If Session is not elevated) */}
      {!session ? (
        <div className="bg-slate-900 p-6 rounded-2xl border border-amber-500/30 shadow-2xl max-w-xl mx-auto space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <KeyRound className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-amber-400">Desafio de Elevação do Root Authority</h3>
              <p className="text-xs text-slate-400">Autenticação com múltiplos fatores de prova para acesso irrestrito.</p>
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
              Verificar Fatores e Elevar Sessão ROOT
            </button>
          </form>
        </div>
      ) : (
        /* 3. Elevated ROOT Workspace View */
        <div className="space-y-6">
          {/* Active Session Info Panel */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-amber-500/40 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">SESSION ID</span>
              <span className="text-amber-400 font-bold truncate block">{session.sessionId}</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">ACTOR IDENTITY</span>
              <span className="text-slate-200 font-bold truncate block">{session.actorEmail}</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">MFA STATUS</span>
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified (Multi-Factor)</span>
              </span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">EXPIRA EM</span>
              <span className="text-indigo-400 font-bold">
                {new Date(session.expiresAt).toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </div>

          {/* Admin Invitation Engine */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-amber-400 flex items-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Motor de Convites de Administrador (Single-Use Token, 72h Expira)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Apenas a Autoridade Raiz pode criar sub-administradores com claims granulares.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Generator Form */}
              <div className="space-y-3 font-mono text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
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
                  Claims e Permissões Atribuidas:
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

              {/* Generated Invite Info & Test Acceptance */}
              <div className="space-y-3 font-mono text-xs">
                {generatedInvite ? (
                  <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-2 text-emerald-300">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">Token Gerado:</span>
                    <p className="text-sm font-bold bg-slate-950 p-2 rounded border border-emerald-800 text-amber-400 select-all">
                      {generatedInvite.token}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Válido até: {new Date(generatedInvite.expiresAt).toLocaleString('pt-BR')} (72 Horas)
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-500 italic text-[11px]">
                    Nenhum convite recém-gerado nesta sessão.
                  </div>
                )}

                {/* Form to test accepting invite token */}
                <form onSubmit={handleAcceptInvite} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 block uppercase">Aceitar Convite (Test Workflow)</span>
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
                  {acceptFeedback && (
                    <div className="text-[10px] text-amber-400 font-bold">{acceptFeedback}</div>
                  )}
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

          {/* Active Administrators List & Active Invitations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            {/* Active Administrators */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-indigo-400 flex items-center space-x-2 border-b border-slate-800 pb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Administradores Ativos ({admins.length})</span>
              </h3>
              {admins.length === 0 ? (
                <p className="text-slate-500 text-[11px] italic">Nenhum sub-administrador criado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {admins.map((adm) => (
                    <div key={adm.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-200">
                        <span>{adm.displayName}</span>
                        <span className="px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 text-[9px] rounded uppercase">
                          {adm.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">{adm.email}</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {adm.permissions.map((p) => (
                          <span key={p} className="px-1.5 py-0.2 bg-slate-900 text-slate-400 text-[8px] rounded border border-slate-800">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Disaster Recovery Controls */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center space-x-2 border-b border-slate-800 pb-2">
                <Server className="w-4 h-4" />
                <span>Disaster Recovery Engine ({backups.length} Snapshots)</span>
              </h3>

              <button
                onClick={handleCreateBackup}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Criar Snapshot de Recuperação</span>
              </button>

              <div className="space-y-2 pt-1">
                {backups.map((bkp) => (
                  <div key={bkp.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] space-y-0.5">
                    <div className="flex items-center justify-between font-bold text-slate-200">
                      <span>{bkp.id}</span>
                      <span className="text-emerald-400 font-mono text-[10px]">{(bkp.sizeBytes / 1024).toFixed(1)} KB</span>
                    </div>
                    <p className="text-slate-400 text-[10px]">{bkp.description}</p>
                    <span className="text-slate-500 text-[9px] block">Checksum: {bkp.checksum}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cryptographic Audit Trail */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
            <h3 className="text-sm font-bold text-amber-400 flex items-center space-x-2 border-b border-slate-800 pb-2">
              <Activity className="w-4 h-4" />
              <span>Trilho de Auditoria Criptográfico (Audit Trail Engine)</span>
            </h3>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">{log.action}</span>
                    <span className="text-slate-500 text-[10px]">{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                  </div>
                  <div className="text-slate-400 flex items-center justify-between">
                    <span>Ator: {log.actor}</span>
                    <span className="text-slate-500 text-[9px]">{log.signature}</span>
                  </div>
                  {log.afterState && <div className="text-[10px] text-slate-500 bg-slate-900 p-1 rounded">{log.afterState}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
