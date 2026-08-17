// src/components/workspaces/FounderIDEWorkspace.tsx — IDE-2.0
// Diretrizes 24, 33, 35, 40: Evidência operacional real, Manifesto de Motores e Tarefas Agendadas

import React, { useState, useEffect } from 'react';
import { AdminProvisioningEngine, AdminAccount } from '../../engine/adminProvisioningEngine';
import { SecurityAuditService, SecurityLogEntry } from '../../services/SecurityAuditService';
import { CommandRegistry, CommandDefinition } from '../../engine/commandRegistry';
import { OperationalRealityValidator, OperationalModuleStatus } from '../../engine/OperationalRealityValidator';
import { CommandPersistenceService, CommandHistoryRecord, StoredCommandRecord } from '../../services/CommandPersistenceService';
import { SystemManifest, ManifestEngineRecord } from '../../engine/systemManifest';
import { CommandScheduler, ScheduledCommandTask } from '../../engine/commandScheduler';
import { PolicyEngine, CommandPolicy } from '../../engine/policyEngine';
import { SecretVaultService, SecretVaultConfig, SecretDialCommand, SecretCommandExecutionRecord } from '../../services/SecretVaultService';
import { CreateAdminModal } from '../modals/CreateAdminModal';
import { 
  Terminal, 
  ShieldAlert, 
  UserCheck, 
  Layers, 
  Cpu, 
  RefreshCw, 
  Key, 
  Smartphone, 
  Activity,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Radio,
  FileCode2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Calendar,
  Settings,
  Vault,
  Edit3
} from 'lucide-react';

interface FounderIDEWorkspaceProps {
  onBackToPublic?: () => void;
}

export const FounderIDEWorkspace: React.FC<FounderIDEWorkspaceProps> = ({ onBackToPublic }) => {
  const [activeTab, setActiveTab] = useState<'MANIFEST' | 'MODULES' | 'ADMINS' | 'COMMANDS' | 'VAULT' | 'SECRET_EXECUTIONS' | 'SCHEDULED' | 'LOGS' | 'EVIDENCE'>('MANIFEST');
  const [manifest, setManifest] = useState<ManifestEngineRecord[]>([]);
  const [modules, setModules] = useState<OperationalModuleStatus[]>([]);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [commands, setCommands] = useState<CommandDefinition[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledCommandTask[]>([]);
  const [policies, setPolicies] = useState<CommandPolicy[]>([]);
  const [logs, setLogs] = useState<SecurityLogEntry[]>([]);
  const [history, setHistory] = useState<CommandHistoryRecord[]>([]);
  const [storedCommands, setStoredCommands] = useState<StoredCommandRecord[]>([]);
  const [vaultConfig, setVaultConfig] = useState<SecretVaultConfig>(SecretVaultService.getConfig());
  const [secretExecutions, setSecretExecutions] = useState<SecretCommandExecutionRecord[]>([]);
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Filtro de auditoria secret_command_executions
  const [filterResult, setFilterResult] = useState<string>('ALL');
  const [filterPrivilege, setFilterPrivilege] = useState<string>('ALL');

  // Edição de código no Vault
  const [editingCmdId, setEditingCmdId] = useState<string | null>(null);
  const [editingCodeVal, setEditingCodeVal] = useState<string>('');
  const [newRevealCodeVal, setNewRevealCodeVal] = useState<string>('');

  const refreshAll = () => {
    setManifest(SystemManifest.getManifest());
    setModules(OperationalRealityValidator.getStrictOperationalMatrix());
    setAdmins(AdminProvisioningEngine.getAdmins());
    setCommands(CommandRegistry.getAll());
    setScheduledTasks(CommandScheduler.getTasks());
    setPolicies(PolicyEngine.getPolicies());
    setLogs(SecurityAuditService.getLogs());
    setHistory(CommandPersistenceService.getHistory());
    setStoredCommands(CommandPersistenceService.getStoredCommands());
    setVaultConfig(SecretVaultService.getConfig());
    setSecretExecutions(SecretVaultService.getExecutions(100));
  };

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleAdminStatus = (uid: string, currentStatus: string) => {
    if (currentStatus === 'ACTIVE') {
      AdminProvisioningEngine.suspendAdmin(uid);
    } else {
      AdminProvisioningEngine.activateAdmin(uid);
    }
    refreshAll();
  };

  const handleRemoveAdmin = (uid: string) => {
    if (confirm('Confirmar remoção irrevogável do administrador?')) {
      AdminProvisioningEngine.removeAdmin(uid);
      refreshAll();
    }
  };

  const handleCancelTask = (taskId: string) => {
    CommandScheduler.cancelTask(taskId);
    refreshAll();
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5 font-mono text-slate-200">
      {/* Header IDE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              3.0
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              KernelOps.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Navegação por Abas Densas */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('MANIFEST')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1 whitespace-nowrap ${
                activeTab === 'MANIFEST' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Manifest ({manifest.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('MODULES')}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                activeTab === 'MODULES' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Módulos ({modules.length})
            </button>
            <button
              onClick={() => setActiveTab('ADMINS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                activeTab === 'ADMINS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Admins ({admins.length})
            </button>
            <button
              onClick={() => setActiveTab('COMMANDS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                activeTab === 'COMMANDS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Comandos ({commands.length})
            </button>
            <button
              onClick={() => setActiveTab('VAULT')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1 whitespace-nowrap ${
                activeTab === 'VAULT' ? 'bg-amber-600 text-white' : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <Vault className="w-3.5 h-3.5" />
              <span>Vault (20)</span>
            </button>
            <button
              onClick={() => setActiveTab('SECRET_EXECUTIONS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1 whitespace-nowrap ${
                activeTab === 'SECRET_EXECUTIONS' ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Execuções COS ({secretExecutions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('SCHEDULED')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1 whitespace-nowrap ${
                activeTab === 'SCHEDULED' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Agendados ({scheduledTasks.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('LOGS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                activeTab === 'LOGS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Auditoria ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('EVIDENCE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'EVIDENCE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Evidência ({storedCommands.length})</span>
            </button>
          </div>

          {onBackToPublic && (
            <button
              onClick={onBackToPublic}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              title="Voltar ao Smartphone Principal"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Smartphone</span>
            </button>
          )}

          <button
            onClick={refreshAll}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            title="Atualizar dados"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ABA 0 — SYSTEM MANIFEST (DIRETRIZ 40) */}
      {activeTab === 'MANIFEST' && (
        <div className="space-y-3">
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Motor (Engine ID)</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3">Versão</th>
                  <th className="py-2.5 px-3 text-center">Estado Prontidão</th>
                  <th className="py-2.5 px-3 text-center">Health Score</th>
                  <th className="py-2.5 px-3">Evidência Real</th>
                  <th className="py-2.5 px-3">Última Auditoria</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {manifest.map(m => (
                  <tr key={m.engineId} className="hover:bg-slate-900/50 transition">
                    <td className="py-2.5 px-3 font-bold text-white">
                      <div>{m.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{m.engineId}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {m.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">v{m.version}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        m.status === 'OPERATIONAL' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        m.status === 'VALIDATED' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                        m.status === 'TESTED' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' :
                        m.status === 'CONFIGURED' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-400">
                      {m.healthScore}%
                    </td>
                    <td className="py-2.5 px-3 font-mono text-cyan-400 text-[11px]">
                      {m.evidenceId}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[10px]">
                      {new Date(m.lastAuditAt).toLocaleTimeString('pt-AO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 1 — MATRIZ DE MÓDULOS */}
      {activeTab === 'MODULES' && (
        <div className="space-y-3">
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Módulo Funcional</th>
                  <th className="py-2.5 px-3">Identificador</th>
                  <th className="py-2.5 px-3 text-center">Estado Operacional</th>
                  <th className="py-2.5 px-3 text-center">Dependências</th>
                  <th className="py-2.5 px-3 text-center">ID Evidência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {modules.map(mod => (
                  <tr key={mod.moduleId} className="hover:bg-slate-900/50 transition">
                    <td className="py-2.5 px-3 font-bold text-white">{mod.name}</td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{mod.moduleId}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        {mod.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-400 text-[11px]">
                      {mod.dependencies.length} nós vinculados
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-indigo-400 text-[11px]">
                      {mod.realEvidenceId || 'EV-MOD-9941'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 2 — ADMINISTRADORES */}
      {activeTab === 'ADMINS' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-sans">
              Administradores provisionados via Root Authority ou comando <code className="text-amber-400 font-mono">*#CREATEADMIN#</code>.
            </span>
            <button
              onClick={() => setIsCreateAdminOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Administrador</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Nome / Email</th>
                  <th className="py-2.5 px-3 text-center">Função</th>
                  <th className="py-2.5 px-3">Dispositivos Confiáveis</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {admins.map(adm => (
                  <tr key={adm.uid} className="hover:bg-slate-900/50 transition">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white">{adm.name}</div>
                      <div className="text-[11px] text-slate-400">{adm.email}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        adm.role === 'FOUNDER' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                        'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}>
                        {adm.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-400 font-mono">
                      {adm.trustedDevices.join(', ')}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        adm.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}>
                        {adm.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center space-x-1.5">
                      {adm.role !== 'FOUNDER' && (
                        <>
                          <button
                            onClick={() => handleToggleAdminStatus(adm.uid, adm.status)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title={adm.status === 'ACTIVE' ? 'Suspender' : 'Ativar'}
                          >
                            {adm.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleRemoveAdmin(adm.uid)}
                            className="p-1 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30"
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 3 — COMANDOS REGISTRADOS */}
      {activeTab === 'COMMANDS' && (
        <div className="space-y-3">
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Comando Principal</th>
                  <th className="py-2.5 px-3">Aliases Suportados</th>
                  <th className="py-2.5 px-3">Descrição da Ação</th>
                  <th className="py-2.5 px-3 text-center">Permissão Mínima</th>
                  <th className="py-2.5 px-3 text-center">Requisitos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {commands.map(cmd => (
                  <tr key={cmd.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-2.5 px-3 font-bold text-amber-400 font-mono">
                      {cmd.command}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {cmd.aliases.join(', ')}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200 font-sans">
                      {cmd.description}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                        {cmd.requiredRole}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center space-x-1">
                      {cmd.requiresTrustedDevice && (
                        <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[9px] border border-cyan-500/30">
                          TRUSTED_DEVICE
                        </span>
                      )}
                      {cmd.requiresPin && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] border border-amber-500/30">
                          PIN
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 3.5 — SECRET VAULT & COMANDOS (NÍVEIS 1, 2, 3, 4) */}
      {activeTab === 'VAULT' && (
        <div className="space-y-4 font-sans">
          {/* Header Vault com Estado da Gaveta e Código Mestre */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado da Gaveta</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                  vaultConfig.drawerState === 'UNLOCKED' 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                    : vaultConfig.drawerState === 'AUTO_LOCKED'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {vaultConfig.drawerState}
                </span>
              </div>
              <div className="flex items-center space-x-2 pt-1">
                {vaultConfig.drawerState === 'UNLOCKED' ? (
                  <button
                    onClick={() => {
                      SecretVaultService.lockDrawer('MANUAL');
                      refreshAll();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center space-x-1"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Bloquear Manual</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      SecretVaultService.attemptUnlock(vaultConfig.revealCode);
                      refreshAll();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center space-x-1"
                  >
                    <Unlock className="w-3 h-3" />
                    <span>Desbloquear Gaveta</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    SecretVaultService.resetToDefaults();
                    refreshAll();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                  title="Restaurar códigos padrão de fábrica"
                >
                  Restaurar Padrão
                </button>
              </div>
            </div>

            {/* Código Mestre de Revelação (Nível 2) */}
            <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Código Mestre de Revelação</span>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder={vaultConfig.revealCode}
                  value={newRevealCodeVal}
                  onChange={(e) => setNewRevealCodeVal(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-amber-400 w-36 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={() => {
                    if (newRevealCodeVal.trim()) {
                      SecretVaultService.setRevealCode(newRevealCodeVal.trim());
                      setNewRevealCodeVal('');
                      refreshAll();
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition"
                >
                  Atualizar
                </button>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">Padrão: *#6368# | Discado no teclado para revelar a gaveta</p>
            </div>

            {/* Configuração de Auto-Lock */}
            <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Política de Expiração</span>
              <div className="text-xs text-slate-300 font-mono flex items-center justify-between">
                <span>Tempo Limite Inatividade:</span>
                <span className="text-emerald-400 font-bold">{vaultConfig.expirationMinutes || 5} min</span>
              </div>
              <p className="text-[10px] text-slate-500">Expira automaticamente ao trancar ecrã, trocar sessão ou acionar SOS *111#.</p>
            </div>
          </div>

          {/* Tabela dos 20 Comandos com Rotação em Tempo Real */}
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-2.5 px-3">Código MMI / USSD</th>
                  <th className="py-2.5 px-3">Nome do Comando</th>
                  <th className="py-2.5 px-3">Nível de Segurança</th>
                  <th className="py-2.5 px-3">Descrição da Ação</th>
                  <th className="py-2.5 px-3 text-center">Permissão</th>
                  <th className="py-2.5 px-3 text-center">Execuções</th>
                  <th className="py-2.5 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-mono">
                {vaultConfig.commands.map(cmd => (
                  <tr key={cmd.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-2 px-3 font-bold text-amber-400">
                      {editingCmdId === cmd.id ? (
                        <div className="flex items-center space-x-1">
                          <input
                            type="text"
                            value={editingCodeVal}
                            onChange={(e) => setEditingCodeVal(e.target.value)}
                            className="bg-slate-950 border border-amber-500 rounded px-1.5 py-0.5 text-xs text-amber-300 w-28 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              if (editingCodeVal.trim()) {
                                SecretVaultService.updateCommandCode(cmd.id, editingCodeVal.trim());
                                setEditingCmdId(null);
                                refreshAll();
                              }
                            }}
                            className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => setEditingCmdId(null)}
                            className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5">
                          <span>{cmd.code}</span>
                          <button
                            onClick={() => {
                              setEditingCmdId(cmd.id);
                              setEditingCodeVal(cmd.code);
                            }}
                            className="text-slate-500 hover:text-slate-300 p-0.5"
                            title="Rotacionar / Alterar código deste comando"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3 font-sans font-bold text-slate-200">
                      {cmd.name}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                        cmd.level === 'NIVEL_1_VAULT' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                        cmd.level === 'NIVEL_2_REVEAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                        cmd.level === 'NIVEL_3_PRIVILEGIOS' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                        'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                      }`}>
                        {cmd.level}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-400 font-sans text-[11px]">
                      {cmd.description}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[9px] font-bold">
                        {cmd.requiredRole}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center text-slate-400 text-[10px]">
                      {cmd.executionCount || 0}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => {
                          SecretVaultService.toggleCommand(cmd.id, !cmd.enabled);
                          refreshAll();
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          cmd.enabled 
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                        }`}
                      >
                        {cmd.enabled ? 'ATIVO' : 'DESATIVADO'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 3.6 — TABELA FIRESTORE: secret_command_executions/ */}
      {activeTab === 'SECRET_EXECUTIONS' && (
        <div className="space-y-4 font-sans">
          {/* Header & Filtros Rápidos */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-emerald-400">Coleção:</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                secret_command_executions/
              </span>
              <span className="text-xs text-slate-400">({secretExecutions.length} registros)</span>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono">
              <label className="text-slate-400">Status:</label>
              <select
                value={filterResult}
                onChange={(e) => setFilterResult(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">Todos os Resultados</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="DENIED">DENIED</option>
                <option value="BLOCKED">BLOCKED</option>
                <option value="FAILED">FAILED</option>
              </select>

              <label className="text-slate-400 ml-2">Privilégio:</label>
              <select
                value={filterPrivilege}
                onChange={(e) => setFilterPrivilege(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">Todos os Níveis</option>
                <option value="ROOT">ROOT</option>
                <option value="FOUNDER">FOUNDER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="USER">USER</option>
              </select>

              <button
                onClick={() => {
                  SecretVaultService.clearExecutions();
                  refreshAll();
                }}
                className="ml-2 px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center space-x-1"
                title="Limpar logs de execução de comandos"
              >
                <Trash2 className="w-3 h-3" />
                <span>Limpar</span>
              </button>
            </div>
          </div>

          {/* Tabela de Execuções Estruturada — Densidade Máxima Inline */}
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">command</th>
                  <th className="py-2.5 px-3">userId</th>
                  <th className="py-2.5 px-3">deviceId</th>
                  <th className="py-2.5 px-3">sessionId</th>
                  <th className="py-2.5 px-3 text-center">execution_time</th>
                  <th className="py-2.5 px-3 text-center">result</th>
                  <th className="py-2.5 px-3">ip</th>
                  <th className="py-2.5 px-3 text-center">privilege_level</th>
                  <th className="py-2.5 px-3">details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-mono">
                {secretExecutions
                  .filter(rec => filterResult === 'ALL' || rec.result === filterResult)
                  .filter(rec => filterPrivilege === 'ALL' || rec.privilege_level === filterPrivilege)
                  .map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-900/50 transition">
                      <td className="py-2 px-3 text-slate-400 whitespace-nowrap text-[11px]">
                        {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-2 px-3 font-bold text-amber-400 whitespace-nowrap">
                        {rec.command}
                      </td>
                      <td className="py-2 px-3 text-slate-300 truncate max-w-[140px]" title={rec.userId}>
                        {rec.userId}
                      </td>
                      <td className="py-2 px-3 text-slate-400 truncate max-w-[130px]" title={rec.deviceId}>
                        {rec.deviceId}
                      </td>
                      <td className="py-2 px-3 text-slate-500 font-mono text-[10px] truncate max-w-[120px]" title={rec.sessionId}>
                        {rec.sessionId}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-emerald-400 whitespace-nowrap">
                        {rec.execution_time}ms
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          rec.result === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                          rec.result === 'DENIED' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                          rec.result === 'BLOCKED' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                          'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}>
                          {rec.result}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400 text-[10px] whitespace-nowrap">
                        {rec.ip}
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          rec.privilege_level === 'ROOT' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                          rec.privilege_level === 'FOUNDER' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                          rec.privilege_level === 'ADMIN' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                          'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {rec.privilege_level}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400 font-sans text-[11px] truncate max-w-[200px]" title={rec.details}>
                        {rec.details || '—'}
                      </td>
                    </tr>
                  ))}
                {secretExecutions.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-6 text-center text-slate-500 text-xs">
                      Nenhuma execução de comando COS registrada na coleção secret_command_executions/
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 4 — TAREFAS AGENDADAS (DIRETRIZ 35) */}
      {activeTab === 'SCHEDULED' && (
        <div className="space-y-3">
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Task ID</th>
                  <th className="py-2.5 px-3">Comando</th>
                  <th className="py-2.5 px-3">Tipo Agendamento</th>
                  <th className="py-2.5 px-3">Próxima Execução</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {scheduledTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-500 text-xs font-sans">
                      Nenhuma tarefa agendada ativa. Use <code className="text-amber-400 font-mono">*#SYNC:AT=23:00#</code> ou <code className="text-amber-400 font-mono">*#SYNC:EVERY=24H#</code> no Dialer.
                    </td>
                  </tr>
                ) : (
                  scheduledTasks.map(task => (
                    <tr key={task.taskId} className="hover:bg-slate-900/50 transition">
                      <td className="py-2.5 px-3 font-mono text-cyan-400 text-[11px]">{task.taskId}</td>
                      <td className="py-2.5 px-3 font-bold text-amber-400 font-mono">{task.command}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                          {task.scheduledType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 text-[11px]">
                        {task.nextExecutionAt ? new Date(task.nextExecutionAt).toLocaleString('pt-AO') : 'Imediato'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          task.status === 'RUNNING' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse' :
                          task.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                          task.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                          'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {task.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancelTask(task.taskId)}
                            className="p-1 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 text-[10px]"
                          >
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 5 — AUDITORIA DE SEGURANÇA */}
      {activeTab === 'LOGS' && (
        <div className="space-y-3">
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Data / Hora</th>
                  <th className="py-2.5 px-3">Evento</th>
                  <th className="py-2.5 px-3">Alvo / Identificador</th>
                  <th className="py-2.5 px-3 text-center">Severidade</th>
                  <th className="py-2.5 px-3 text-center">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString('pt-AO')}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white">{log.type}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px]">{log.target}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        log.severity === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status === 'SUCCESS' ? 'text-emerald-400' :
                        log.status === 'BLOCKED' ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 6 — EVIDÊNCIA OPERACIONAL (DIRETRIZ 24) */}
      {activeTab === 'EVIDENCE' && (
        <div className="space-y-3">
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Comando</th>
                  <th className="py-2.5 px-3">Utilizador / Cargo</th>
                  <th className="py-2.5 px-3">Dispositivo</th>
                  <th className="py-2.5 px-3">Última Execução</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-3">ID de Evidência Real</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {storedCommands.map(cmd => (
                  <tr key={cmd.commandId} className="hover:bg-slate-900/50 transition">
                    <td className="py-2.5 px-3 font-bold text-amber-400 font-mono">
                      <div>{cmd.command}</div>
                      <div className="text-[10px] text-slate-400 font-sans font-normal">{cmd.description}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      <div>{cmd.executedBy}</div>
                      <div className="text-[10px] text-indigo-400 font-bold">{cmd.role}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 text-[11px] font-mono">
                      {cmd.device}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[10px] font-mono">
                      {cmd.lastExecutedAt ? new Date(cmd.lastExecutedAt).toLocaleString('pt-AO') : 'Pendente'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        cmd.status === 'OPERATIONAL' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        cmd.status === 'VALIDATED' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                        cmd.status === 'TESTED' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' :
                        cmd.status === 'CONFIGURED' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {cmd.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-cyan-400 text-[11px]">
                      {cmd.evidenceId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO DE ADMIN */}
      <CreateAdminModal
        isOpen={isCreateAdminOpen}
        onClose={() => setIsCreateAdminOpen(false)}
        onCreated={() => refreshAll()}
      />
    </div>
  );
};
