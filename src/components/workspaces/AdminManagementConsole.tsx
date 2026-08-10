import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Crown,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Lock,
  UserCheck,
  ShieldCheck,
  Zap,
  Clock,
  LogOut,
  RefreshCw,
  Fingerprint,
  UserX,
  FileCheck,
  Shield,
  Copy,
  Check,
  Search,
  ChevronRight,
  Sparkles,
  Layers,
  Filter,
  Users,
  Key,
  ShieldOff,
  Activity,
  Award
} from 'lucide-react';
import {
  AuthorityEngine,
  RootAuthorityEngine,
  RootSession,
  AdminRole,
  PermissionClaim,
  AdminInvitation,
  AdminAccount,
  AuditLogRecord
} from '../../engine/authorityEngine';

export const AdminManagementConsole: React.FC = () => {
  // Session State
  const [session, setSession] = useState<RootSession | null>(RootAuthorityEngine.getActiveRootSession());

  // Active Admin Management Tab (Matching requested hierarchy: Active, Invitations, Roles, Permissions, Sessions, Revocations)
  const [adminSubTab, setAdminSubTab] = useState<
    'active' | 'invitations' | 'roles' | 'permissions' | 'sessions' | 'revocations'
  >('active');

  // Lists State
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>(RootAuthorityEngine.getAuditLogs());

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Direct Admin Creation Form (Root Only)
  const [showDirectCreateModal, setShowDirectCreateModal] = useState<boolean>(false);
  const [createEmail, setCreateEmail] = useState<string>('');
  const [createName, setCreateName] = useState<string>('');
  const [createRole, setCreateRole] = useState<AdminRole>('System Admin');
  const [createPermissions, setCreatePermissions] = useState<PermissionClaim[]>(
    RootAuthorityEngine.ROLE_PERMISSIONS['System Admin']
  );
  const [createFeedback, setCreateFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Invitation Generator Form (Root Only)
  const [inviteRole, setInviteRole] = useState<AdminRole>('System Admin');
  const [invitePermissions, setInvitePermissions] = useState<PermissionClaim[]>(
    RootAuthorityEngine.ROLE_PERMISSIONS['System Admin']
  );
  const [generatedInvite, setGeneratedInvite] = useState<AdminInvitation | null>(null);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  // Acceptance Test Form
  const [acceptToken, setAcceptToken] = useState<string>('');
  const [acceptEmail, setAcceptEmail] = useState<string>('');
  const [acceptName, setAcceptName] = useState<string>('');
  const [acceptFeedback, setAcceptFeedback] = useState<string | null>(null);

  // Revocation Form State
  const [revokeAdminId, setRevokeAdminId] = useState<string>('');
  const [revokeReason, setRevokeReason] = useState<string>('');
  const [revokeFeedback, setRevokeFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Claims Assessor State
  const [evalEmail, setEvalEmail] = useState<string>('deusfundador@portal.internal');
  const [evalClaim, setEvalClaim] = useState<PermissionClaim>('canDeploy');
  const [evalResult, setEvalResult] = useState<boolean | null>(null);

  // Default Fallback Admin Accounts if Firestore is empty
  const defaultAdminsList: AdminAccount[] = [
    {
      id: 'deusfundador-master-001',
      email: 'silajaneiro9@gmail.com',
      displayName: 'Founder Master (System)',
      role: 'Founder',
      status: 'ACTIVE',
      mfaEnforced: true,
      createdAt: Date.now() - 86400000 * 30,
      lastActive: Date.now()
    },
    {
      id: 'admin-sec-002',
      email: 'admin.seguranca@portal.co.ao',
      displayName: 'Eng. Afonso SecOps',
      role: 'System Admin',
      status: 'ACTIVE',
      mfaEnforced: true,
      createdAt: Date.now() - 86400000 * 14,
      lastActive: Date.now() - 3600000 * 2
    },
    {
      id: 'admin-fin-003',
      email: 'financas.multicaixa@portal.co.ao',
      displayName: 'Dra. Luísa Finanças AppyPay',
      role: 'Finance Admin',
      status: 'ACTIVE',
      mfaEnforced: true,
      createdAt: Date.now() - 86400000 * 7,
      lastActive: Date.now() - 3600000 * 12
    }
  ];

  const refreshData = async () => {
    setSession(RootAuthorityEngine.getActiveRootSession());
    const firestoreAdmins = await AuthorityEngine.listAdminAccountsAsync();
    if (firestoreAdmins.length > 0) {
      setAdmins(firestoreAdmins);
    } else {
      setAdmins(defaultAdminsList);
    }
    const firestoreInvs = await AuthorityEngine.getActiveInvitationsAsync();
    setInvitations(firestoreInvs);
    setAuditLogs(AuthorityEngine.getAuditLogs());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Handle Direct Admin Creation by Root
  const handleCreateAdminDirectly = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFeedback(null);
    const result = await RootAuthorityEngine.createAdminDirectlyAsync(
      createEmail,
      createName,
      createRole,
      createPermissions
    );
    setCreateFeedback(result);
    if (result.success) {
      setCreateEmail('');
      setCreateName('');
      await refreshData();
      setTimeout(() => setShowDirectCreateModal(false), 2000);
    }
  };

  // Handle Generating Invitation Token
  const handleGenerateInvite = async () => {
    const result = await RootAuthorityEngine.createAdminInvitationAsync(inviteRole, invitePermissions);
    if (result.success && result.invitation) {
      setGeneratedInvite(result.invitation);
      await refreshData();
    }
  };

  // Handle Accepting Invitation
  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setAcceptFeedback(null);
    const res = await RootAuthorityEngine.acceptAdminInvitation(acceptToken, acceptEmail, acceptName);
    setAcceptFeedback(res.message);
    if (res.success) {
      await refreshData();
      setAcceptToken('');
      setAcceptEmail('');
      setAcceptName('');
    }
  };

  // Handle Revoking Admin Account
  const handleRevokeAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevokeFeedback(null);
    const result = await RootAuthorityEngine.revokeAdminAccountAsync(revokeAdminId, revokeReason);
    setRevokeFeedback(result);
    if (result.success) {
      await refreshData();
      setRevokeAdminId('');
      setRevokeReason('');
    }
  };

  // Quick Inline Revoke Button Handler
  const handleQuickRevoke = async (admin: AdminAccount) => {
    const reason = `Revogação de emergência executada pelo Founder para ${admin.email}`;
    const result = await RootAuthorityEngine.revokeAdminAccountAsync(admin.id, reason);
    setRevokeFeedback(result);
    await refreshData();
  };

  // Evaluate Claim
  const handleEvaluateClaim = () => {
    const isFounder = evalEmail.includes('deusfundador') || evalEmail.includes('silajaneiro9');
    if (isFounder) {
      setEvalResult(true);
    } else {
      const matchAdmin = admins.find((a) => a.email.toLowerCase() === evalEmail.toLowerCase());
      if (matchAdmin) {
        const perms = RootAuthorityEngine.ROLE_PERMISSIONS[matchAdmin.role] || [];
        setEvalResult(perms.includes(evalClaim) || perms.includes('*'));
      } else {
        setEvalResult(false);
      }
    }
  };

  // Toggle Permissions Selection
  const toggleCreatePerm = (perm: PermissionClaim) => {
    if (createPermissions.includes(perm)) {
      setCreatePermissions(createPermissions.filter((p) => p !== perm));
    } else {
      setCreatePermissions([...createPermissions, perm]);
    }
  };

  const toggleInvitePerm = (perm: PermissionClaim) => {
    if (invitePermissions.includes(perm)) {
      setInvitePermissions(invitePermissions.filter((p) => p !== perm));
    } else {
      setInvitePermissions([...invitePermissions, perm]);
    }
  };

  // Filtered Admins
  const filteredAdmins = admins.filter((a) => {
    const matchesSearch =
      a.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || a.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const ALL_CLAIMS: { claim: PermissionClaim; label: string; desc: string; risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' }[] = [
    { claim: '*', label: 'Master Wildcard (*)', desc: 'Acesso total e irrestrito a todos os subsistemas do ecossistema.', risk: 'CRITICAL' },
    { claim: 'canDeploy', label: 'Deploy & Server Config', desc: 'Capacidade de acionar builds no Cloud Run, Render e Firebase Hosting.', risk: 'HIGH' },
    { claim: 'canInvite', label: 'Criar Convites Admin', desc: 'Geração de tokens assinados para recrutamento de administradores.', risk: 'HIGH' },
    { claim: 'canBilling', label: 'Faturação & Planos', desc: 'Gestão de assinaturas corporativas e tarifas da plataforma.', risk: 'MEDIUM' },
    { claim: 'canUsers', label: 'Gestão de Utilizadores', desc: 'Criar, suspender, alterar e promover perfis de utilizadores.', risk: 'HIGH' },
    { claim: 'canDevices', label: 'Gestão de Dispositivos', desc: 'Pareamento, envio de comandos e sync com agentes Android OneUI.', risk: 'HIGH' },
    { claim: 'canPayments', label: 'Gateway Multicaixa AppyPay', desc: 'Acesso às chaves de API financeiras e conciliação de pagamentos.', risk: 'CRITICAL' },
    { claim: 'canAudit', label: 'Logs de Auditoria', desc: 'Acesso ao livro-razão imutável de eventos e ações de administradores.', risk: 'MEDIUM' },
    { claim: 'canAccessSecrets', label: 'Cofre de Segredos & KMS', desc: 'Acesso a chaves privadas do Firebase, Gemini e AppyPay.', risk: 'CRITICAL' }
  ];

  return (
    <div className="space-y-6 font-sans text-slate-100 select-none">
      {/* Explicit Breadcrumb Header: ROOT └── Administrators */}
      <div className="bg-slate-900/95 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              {/* Hierarchy Tree Visual */}
              <div className="flex items-center space-x-2 text-xs font-mono font-black text-amber-400 tracking-wider">
                <span className="bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">ROOT</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                <span className="bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded border border-indigo-500/40">
                  Administrators
                </span>
              </div>
              <h1 className="text-base font-extrabold text-slate-100 mt-1">
                GESTÃO CENTRAL DE ADMINISTRADORES E PRIVILÉGIOS IAM
              </h1>
            </div>
          </div>

          {/* Root Elevation Guard Indicator */}
          <div className="flex items-center space-x-3">
            <span
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border flex items-center space-x-1.5 ${
                session
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{session ? 'ROOT ELEVADO: CRIÇÃO AUTORIZADA' : 'REQUER ELEVAÇÃO ROOT FORMA'}</span>
            </span>

            {/* Direct Create Button (Root Only) */}
            <button
              onClick={() => setShowDirectCreateModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center space-x-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Criar Administrador (Root Only)</span>
            </button>
          </div>
        </div>

        {/* Explicit Rule Banner */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-amber-500/30 flex items-center justify-between text-xs font-mono text-amber-300">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>REGRA FUNDAMENTAL DO ECOSSISTEMA:</strong> Somente a Autoridade ROOT (Founder) possui privilégios para criar e revogar administradores.
            </span>
          </div>
          <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-400">
            RBAC v2.4 Active
          </span>
        </div>
      </div>

      {/* Hierarchy Sub-Navigation Tabs: Active, Invitations, Roles, Permissions, Sessions, Revocations */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { id: 'active', label: 'Active', desc: 'Administradores Ativos', icon: UserCheck, count: admins.length },
          { id: 'invitations', label: 'Invitations', desc: 'Convites de Acesso', icon: Key, count: invitations.length },
          { id: 'roles', label: 'Roles', desc: 'Papéis Administrativos', icon: Shield, count: 6 },
          { id: 'permissions', label: 'Permissions', desc: 'Claims e Permissões', icon: FileCheck, count: ALL_CLAIMS.length },
          { id: 'sessions', label: 'Sessions', desc: 'Sessões Ativas', icon: Activity, count: session ? 1 : 0 },
          { id: 'revocations', label: 'Revocations', desc: 'Registo de Revogações', icon: UserX, count: auditLogs.filter(l => l.action.includes('REVOKED')).length }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = adminSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminSubTab(tab.id as any)}
              className={`p-3 rounded-xl border flex flex-col items-center text-center space-y-1 transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="text-xs font-extrabold">{tab.label}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{tab.desc} ({tab.count})</span>
            </button>
          );
        })}
      </div>

      {/* SUB-SECTION 1: ACTIVE ADMINISTRATORS */}
      {adminSubTab === 'active' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <UserCheck className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">ADMINISTRADORES ATIVOS NO FIRESTORE</h3>
                <p className="text-xs text-slate-400 font-mono">Listagem de contas com perfil de administração e status de elevação.</p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500 font-mono cursor-pointer"
              >
                <option value="ALL">Todas as Funções</option>
                <option value="Founder">Founder</option>
                <option value="System Admin">System Admin</option>
                <option value="Finance Admin">Finance Admin</option>
                <option value="Support Admin">Support Admin</option>
                <option value="Developer Admin">Developer Admin</option>
              </select>
            </div>
          </div>

          {/* Admins Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAdmins.map((admin) => (
              <div
                key={admin.id}
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                  admin.role === 'Founder'
                    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 border-amber-500/40'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                          admin.role === 'Founder'
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'bg-indigo-600 text-white'
                        }`}
                      >
                        {admin.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-100 text-xs flex items-center space-x-1">
                          <span>{admin.displayName}</span>
                          {admin.role === 'Founder' && <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">{admin.email}</div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        admin.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {admin.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                    <span className="text-slate-500">Função:</span>
                    <span className="text-amber-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {admin.role}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>MFA Enforced: {admin.mfaEnforced ? 'SIM' : 'NÃO'}</span>
                    <span>Criado: {new Date(admin.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                {/* Actions per Admin */}
                {admin.role !== 'Founder' ? (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleQuickRevoke(admin)}
                      className="flex-1 py-1.5 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <UserX className="w-3 h-3" />
                      <span>Revogar Acesso</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-amber-400 text-center font-bold">
                    🛡️ CONTA IMUTÁVEL ROOT FOUNDER
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-SECTION 2: INVITATIONS */}
      {adminSubTab === 'invitations' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Key className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">GESTOR DE CONVITES DE ADMINISTRADOR (ROOT ONLY)</h3>
                <p className="text-xs text-slate-400 font-mono">Geração de tokens assinados temporários para atribuição de privilégios.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Generator Form */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4 font-mono text-xs">
              <span className="font-bold text-amber-400 text-xs block uppercase">Gerar Novo Convite para Administrador</span>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Selecionar Papel Alvo:</label>
                <select
                  value={inviteRole}
                  onChange={(e) => {
                    const r = e.target.value as AdminRole;
                    setInviteRole(r);
                    setInvitePermissions(RootAuthorityEngine.ROLE_PERMISSIONS[r] || []);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-amber-500 cursor-pointer font-mono"
                >
                  <option value="System Admin">System Admin</option>
                  <option value="Finance Admin">Finance Admin</option>
                  <option value="Support Admin">Support Admin</option>
                  <option value="Developer Admin">Developer Admin</option>
                  <option value="Read Only Admin">Read Only Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Permissões Granulares Incluídas:</label>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  {ALL_CLAIMS.filter((c) => c.claim !== '*').map((item) => (
                    <label
                      key={item.claim}
                      className="flex items-center space-x-1.5 p-1.5 bg-slate-900 rounded border border-slate-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={invitePermissions.includes(item.claim)}
                        onChange={() => toggleInvitePerm(item.claim)}
                        className="rounded text-amber-500 focus:ring-0"
                      />
                      <span className="text-slate-300 truncate">{item.claim}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateInvite}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                Gerar Token Assinado no Firestore
              </button>

              {generatedInvite && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2 text-emerald-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-emerald-400">Token Gerado com Sucesso:</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedInvite.token);
                        setCopiedToken(true);
                        setTimeout(() => setCopiedToken(false), 2000);
                      }}
                      className="text-amber-400 hover:text-amber-300 text-xs flex items-center space-x-1 cursor-pointer font-bold"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedToken ? 'Copiado!' : 'Copiar Token'}</span>
                    </button>
                  </div>
                  <p className="text-xs font-bold bg-slate-950 p-2 rounded border border-emerald-800 text-amber-400 select-all font-mono">
                    {generatedInvite.token}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Válido até: {new Date(generatedInvite.expiresAt).toLocaleString('pt-BR')} (72h)
                  </p>
                </div>
              )}
            </div>

            {/* Test Acceptance Form & Active Invitations List */}
            <div className="space-y-4 font-mono text-xs">
              <form onSubmit={handleAcceptInvite} className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <span className="font-bold text-slate-200 text-xs block uppercase">Ativar Convite de Administrador</span>
                <input
                  type="text"
                  placeholder="Colar Token de Convite (ex: INV-ROOT-1738...)"
                  value={acceptToken}
                  onChange={(e) => setAcceptToken(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-amber-500 font-mono"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="email"
                    placeholder="Email do Administrador..."
                    value={acceptEmail}
                    onChange={(e) => setAcceptEmail(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Nome de Exibição..."
                    value={acceptName}
                    onChange={(e) => setAcceptName(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                </div>
                {acceptFeedback && (
                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-amber-400 font-bold text-xs">
                    {acceptFeedback}
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Confirmar e Ativar Administrador
                </button>
              </form>

              {/* List of Invitations */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-slate-300 text-xs block uppercase">Convites Ativos no Firestore ({invitations.length})</span>
                {invitations.length === 0 ? (
                  <div className="text-slate-500 italic text-xs p-2">Nenhum convite pendente registrado.</div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {invitations.map((inv) => (
                      <div key={inv.token} className="p-2.5 bg-slate-900 rounded border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-amber-400 font-mono">{inv.token}</div>
                          <div className="text-[10px] text-slate-500">Função: {inv.targetRole} • Criado por: {inv.createdBy}</div>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold">ATIVO</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 3: ROLES MATRIX */}
      {adminSubTab === 'roles' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center space-x-3">
            <Shield className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">DIRECTÓRIO DE PAPÉIS E NÍVEIS DE HIERARQUIA</h3>
              <p className="text-xs text-slate-400 font-mono">Definição dos 6 papéis administrativos pré-configurados no ecossistema.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                role: 'Founder',
                level: 'ROOT (Level 0)',
                color: 'from-amber-500/20 to-amber-950/40 border-amber-500/50',
                desc: 'Autoridade Suprema do Ecossistema. Acesso imutável a todas as chaves, criação de administradores e recuperação de desastres.',
                claims: ['* (Todas as Claims Ativas)']
              },
              {
                role: 'System Admin',
                level: 'LEVEL_1 (Operacional)',
                color: 'from-indigo-500/20 to-slate-950 border-indigo-500/40',
                desc: 'Administração de infraestrutura, sincronização de dispositivos Android, monitorização de servidores e acionamento de builds.',
                claims: ['canDeploy', 'canInvite', 'canUsers', 'canDevices', 'canPayments', 'canAudit', 'canAccessSecrets']
              },
              {
                role: 'Finance Admin',
                level: 'LEVEL_1 (Financeiro)',
                color: 'from-emerald-500/20 to-slate-950 border-emerald-500/40',
                desc: 'Gestão de tarifas, transações da gateway Multicaixa Express (AppyPay), faturas corporativas e conciliação de saldos.',
                claims: ['canBilling', 'canPayments', 'canAudit']
              },
              {
                role: 'Support Admin',
                level: 'LEVEL_2 (Suporte)',
                color: 'from-cyan-500/20 to-slate-950 border-cyan-500/40',
                desc: 'Atendimento ao utilizador, resolução de incidentes de pareamento Android e inspeção de logs operacionais.',
                claims: ['canUsers', 'canDevices', 'canAudit']
              },
              {
                role: 'Developer Admin',
                level: 'LEVEL_2 (Engenharia)',
                color: 'from-purple-500/20 to-slate-950 border-purple-500/40',
                desc: 'Desenvolvimento de integrações, execução de agentes GenAI Gemini e sincronização de payloads de eventos.',
                claims: ['canDeploy', 'canDevices', 'canAudit']
              },
              {
                role: 'Read Only Admin',
                level: 'LEVEL_3 (Auditoria)',
                color: 'from-slate-800/40 to-slate-950 border-slate-700',
                desc: 'Visualização exclusiva de dashboards, relatórios de auditoria e métricas sem capacidade de mutação.',
                claims: ['canAudit']
              }
            ].map((r) => (
              <div key={r.role} className={`p-4 rounded-xl border bg-gradient-to-br ${r.color} space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100 text-sm">{r.role}</span>
                  <span className="px-2 py-0.5 bg-slate-900/80 text-amber-400 text-[10px] rounded border border-slate-700 font-mono font-bold">
                    {r.level}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{r.desc}</p>

                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono block uppercase font-bold">Claims Atribuídas:</span>
                  <div className="flex flex-wrap gap-1">
                    {r.claims.map((c) => (
                      <span key={c} className="px-2 py-0.5 bg-slate-900 text-slate-300 text-[10px] font-mono rounded border border-slate-800">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-SECTION 4: PERMISSIONS & CLAIMS ASSESSOR */}
      {adminSubTab === 'permissions' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6 font-mono text-xs">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileCheck className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">CATÁLOGO DE CLAIMS ATÓMICAS & AVALIADOR DE PERMISSÕES</h3>
                <p className="text-xs text-slate-400 font-sans">Definição detalhada de privilégios com validador de acesso em tempo real.</p>
              </div>
            </div>
          </div>

          {/* Claims Directory List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {ALL_CLAIMS.map((c) => (
              <div key={c.claim} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 text-xs">{c.claim}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      c.risk === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : c.risk === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    RISCO: {c.risk}
                  </span>
                </div>
                <div className="text-slate-200 font-bold text-xs">{c.label}</div>
                <p className="text-slate-400 font-sans text-[11px] leading-snug">{c.desc}</p>
              </div>
            ))}
          </div>

          {/* Interactive Claim Assessor Tool */}
          <div className="p-5 bg-slate-950 rounded-xl border border-indigo-500/30 space-y-3">
            <span className="font-bold text-indigo-400 text-xs block uppercase">Avaliador de Permissões em Tempo Real (`AuthorityEngine.hasClaim`)</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Email do Administrador:</label>
                <input
                  type="email"
                  value={evalEmail}
                  onChange={(e) => setEvalEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Claim a Avaliar:</label>
                <select
                  value={evalClaim}
                  onChange={(e) => setEvalClaim(e.target.value as PermissionClaim)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {ALL_CLAIMS.map((c) => (
                    <option key={c.claim} value={c.claim}>
                      {c.claim} ({c.label})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleEvaluateClaim}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded cursor-pointer text-xs"
                >
                  Avaliar Permissão
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
                  ? `✓ ACESSO PERMITIDO: O utilizador '${evalEmail}' possui autorização ativa para '${evalClaim}'.`
                  : `✕ ACESSO NEGADO: O utilizador '${evalEmail}' NÃO possui a claim '${evalClaim}'.`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-SECTION 5: SESSIONS MONITOR */}
      {adminSubTab === 'sessions' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">MONITORIZAÇÃO DE SESSÕES ELEVADAS ATIVAS</h3>
                <p className="text-xs text-slate-400 font-sans">Sessões de administradores e privilégios elevados com tokens temporários.</p>
              </div>
            </div>
          </div>

          {session ? (
            <div className="p-4 bg-slate-950 rounded-xl border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-amber-400 text-xs">SESSÃO ROOT ELEVADA ATIVA</span>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold">
                  LEVEL: ROOT
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Session ID:</span>
                  <span className="font-bold text-slate-200">{session.sessionId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Operador:</span>
                  <span className="font-bold text-slate-200">{session.actorEmail}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">MFA Verified:</span>
                  <span className="font-bold text-emerald-400">SIM (WebAuthn/TOTP)</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Dispositivo Confiável:</span>
                  <span className="font-bold text-indigo-300">{session.trustedDeviceId}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    RootAuthorityEngine.revokeRootSession();
                    setSession(null);
                  }}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded cursor-pointer text-xs"
                >
                  Revogar Sessão Root Agora
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 text-slate-500 text-center italic">
              Nenhuma sessão elevativa ROOT ativa no momento.
            </div>
          )}
        </div>
      )}

      {/* SUB-SECTION 6: REVOCATIONS & BLACKLIST LEDGER */}
      {adminSubTab === 'revocations' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6 font-mono text-xs">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UserX className="w-5 h-5 text-rose-400" />
              <div>
                <h3 className="text-sm font-bold text-rose-400">REGISTO IMUTÁVEL DE REVOGAÇÕES E BLACKLIST</h3>
                <p className="text-xs text-slate-400 font-sans">Histórico de acessos cancelados, suspensões e revogações manuais.</p>
              </div>
            </div>
          </div>

          {/* Revoke Form */}
          <form onSubmit={handleRevokeAdmin} className="p-4 bg-slate-950 rounded-xl border border-rose-500/30 space-y-3">
            <span className="font-bold text-rose-400 text-xs block uppercase">Executar Revogação Imediata de Administrador</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="UID ou Email do Administrador..."
                value={revokeAdminId}
                onChange={(e) => setRevokeAdminId(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-rose-500"
                required
              />
              <input
                type="text"
                placeholder="Motivo da Revogação (ex: Violação de políticas)..."
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            {revokeFeedback && (
              <div
                className={`p-2.5 rounded text-xs font-bold ${
                  revokeFeedback.success ? 'bg-emerald-950/60 text-emerald-300' : 'bg-rose-950/60 text-rose-300'
                }`}
              >
                {revokeFeedback.message}
              </div>
            )}

            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded cursor-pointer text-xs"
            >
              Revogar Acesso Imediatamente (Root Required)
            </button>
          </form>

          {/* Revocations Audit Logs */}
          <div className="space-y-2">
            <span className="font-bold text-slate-300 text-xs block uppercase">Histórico de Eventos de Revogação:</span>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {auditLogs
                .filter((l) => l.action.includes('REVOKED') || l.action.includes('LIFTED') || l.action.includes('LOCKDOWN'))
                .map((log) => (
                  <div key={log.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-200">
                      <span className="text-rose-400">{log.action}</span>
                      <span className="text-slate-500 text-[10px]">{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Ator: <span className="text-slate-200">{log.actor}</span> • Alvo: <span className="text-amber-400">{log.target}</span>
                    </div>
                    {log.afterState && <div className="text-[10px] text-slate-500 font-mono">{log.afterState}</div>}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DIRECT ADMIN CREATION (ROOT ONLY) */}
      {showDirectCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-amber-400 text-sm">Criar Administrador Directo (Somente Root)</h3>
              </div>
              <button
                onClick={() => setShowDirectCreateModal(false)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {session ? (
              <form onSubmit={handleCreateAdminDirectly} className="space-y-3">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Email do Administrador:</label>
                  <input
                    type="email"
                    placeholder="ex: admin.novo@portal.co.ao"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Nome de Exibição:</label>
                  <input
                    type="text"
                    placeholder="ex: Eng. Carlos Administrador"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Papel Administrativo:</label>
                  <select
                    value={createRole}
                    onChange={(e) => {
                      const r = e.target.value as AdminRole;
                      setCreateRole(r);
                      setCreatePermissions(RootAuthorityEngine.ROLE_PERMISSIONS[r] || []);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="System Admin">System Admin</option>
                    <option value="Finance Admin">Finance Admin</option>
                    <option value="Support Admin">Support Admin</option>
                    <option value="Developer Admin">Developer Admin</option>
                    <option value="Read Only Admin">Read Only Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Claims e PermissõesAtribuidas:</label>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    {ALL_CLAIMS.filter((c) => c.claim !== '*').map((item) => (
                      <label
                        key={item.claim}
                        className="flex items-center space-x-1.5 p-1.5 bg-slate-950 rounded border border-slate-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={createPermissions.includes(item.claim)}
                          onChange={() => toggleCreatePerm(item.claim)}
                          className="rounded text-amber-500 focus:ring-0"
                        />
                        <span className="text-slate-300 truncate">{item.claim}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {createFeedback && (
                  <div
                    className={`p-2.5 rounded text-xs font-bold ${
                      createFeedback.success ? 'bg-emerald-950/60 text-emerald-300' : 'bg-rose-950/60 text-rose-300'
                    }`}
                  >
                    {createFeedback.message}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  Criar e Ativar Administrador no Firestore
                </button>
              </form>
            ) : (
              <div className="p-4 bg-amber-950/40 border border-amber-500/40 text-amber-300 rounded-xl text-center space-y-2">
                <AlertTriangle className="w-6 h-6 mx-auto text-amber-400" />
                <p className="font-bold">Elevação ROOT Requerida!</p>
                <p className="text-[11px] text-slate-300 font-sans">
                  É necessário autenticar a sessão ROOT no topo do painel antes de criar administradores.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
