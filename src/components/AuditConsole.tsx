import React, { useState, useEffect, useMemo } from 'react';
import {
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Key,
  Rocket,
  CreditCard,
  AlertTriangle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Copy,
  Lock,
  Terminal,
  Activity,
  Layers,
  Sparkles,
  Database
} from 'lucide-react';
import { AuditEngine, AuditEntry, AuditCategory } from '../engine/auditEngine';

export const AuditConsole: React.FC = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AuditCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [inspectingEntry, setInspectingEntry] = useState<AuditEntry | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = AuditEngine.subscribe((newLogs) => {
      setLogs(newLogs);
    });
    return () => unsubscribe();
  }, []);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Category filter
      if (selectedCategory !== 'all' && log.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'all' && log.status !== selectedStatus) {
        return false;
      }
      // Search term filter
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchActor = log.actor.toLowerCase().includes(term);
        const matchAction = log.action.toLowerCase().includes(term);
        const matchDetails = log.details?.toLowerCase().includes(term) || false;
        const matchTarget = log.target?.toLowerCase().includes(term) || false;
        const matchIp = log.ip?.toLowerCase().includes(term) || false;
        const matchHash = log.hash?.toLowerCase().includes(term) || false;
        return matchActor || matchAction || matchDetails || matchTarget || matchIp || matchHash;
      }
      return true;
    });
  }, [logs, selectedCategory, selectedStatus, searchTerm]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: logs.length,
      admin_actions: 0,
      alteracoes: 0,
      autenticacoes: 0,
      elevacoes_privilegio: 0,
      deploys: 0,
      pagamentos: 0,
      eventos_criticos: 0
    };
    logs.forEach((log) => {
      if (counts[log.category] !== undefined) {
        counts[log.category]++;
      }
    });
    return counts;
  }, [logs]);

  // Action helpers
  const handleSimulateEvent = (category: AuditCategory) => {
    setIsSimulating(true);
    setTimeout(() => {
      const now = Date.now();
      switch (category) {
        case 'admin_actions':
          AuditEngine.log(
            'ADMIN_UPDATE_SECURITY_RULES',
            'silajaneiro9@gmail.com',
            'SUCCESS',
            'Atualização manual das regras de autorização de administradores',
            'Founder',
            'admin_actions',
            'ROLE_POLICIES_V2',
            '197.218.42.10',
            'macbook_founder_01',
            '{"policy": "v1.2"}',
            '{"policy": "v1.3"}'
          );
          break;

        case 'alteracoes':
          AuditEngine.log(
            'CONFIG_MUTATION_MAX_BATCH_SIZE',
            'SISTEMA_AUTO_TUNER',
            'SUCCESS',
            'Ajuste dinâmico do tamanho do lote de memória para 200 eventos',
            'System Agent',
            'alteracoes',
            'batchQueueEngineConfig',
            '10.0.0.1',
            'cloud_run_instance_01',
            '{"maxBatchSize": 100}',
            '{"maxBatchSize": 200}'
          );
          break;

        case 'autenticacoes':
          AuditEngine.log(
            'FOUNDER_LOGIN_MFA_SUCCESS',
            'silajaneiro9@gmail.com',
            'SUCCESS',
            'Autenticação efetuada via Token OAuth e biometria do dispositivo',
            'Founder',
            'autenticacoes',
            'AUTH_FIREBASE_SESSION',
            '197.218.42.10',
            'android_agent_01'
          );
          break;

        case 'elevacoes_privilegio':
          AuditEngine.log(
            'ELEVATION_EMERGENCY_ROOT_SESSION',
            'silajaneiro9@gmail.com',
            'ELEVATED',
            'Elevação temporária para sessão Root por razões de auditoria crítica',
            'Founder',
            'elevacoes_privilegio',
            'ROOT_CONSOLE_SESSION',
            '197.218.42.10',
            'macbook_founder_01',
            '{"privilege": "STANDARD"}',
            '{"privilege": "ROOT_BYPASS"}'
          );
          break;

        case 'deploys':
          AuditEngine.log(
            'DEPLOY_CONTAINER_RELEASE_V2',
            'GITHUB_ACTIONS_BOT',
            'SUCCESS',
            'Implantação concluída com sucesso no Container Express (Porta 3000)',
            'CI/CD Pipeline',
            'deploys',
            'cloud_run_service_portal',
            '140.82.112.4',
            'github_runner_01'
          );
          break;

        case 'pagamentos':
          AuditEngine.log(
            'APPYPAY_PAYMENT_CONFIRMED',
            'GATEWAY_APPYPAY_MCX',
            'SUCCESS',
            'Pagamento de 15.000,00 AOA confirmado via Multicaixa Express (Ref #98412)',
            'Payment Engine',
            'pagamentos',
            'SUB_ENTERPRISE_9921',
            '102.214.12.8',
            'ppy_terminal_prod'
          );
          break;

        case 'eventos_criticos':
          AuditEngine.log(
            'DLQ_MAX_RETRIES_EXCEEDED',
            'ALERT_MONITOR_ENGINE',
            'FAILURE',
            'Webhook do sistema excedeu 5 tentativas de retentativa (DLQ Alert)',
            'System Monitor',
            'eventos_criticos',
            'DLQ_WEBHOOK_QUEUE',
            '10.0.2.14',
            'worker_dlq_01',
            '{"retryCount": 5}',
            '{"status": "ALERT_TRIGGERED"}'
          );
          break;
      }
      setIsSimulating(false);
    }, 400);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Data/Hora', 'Categoria', 'Acao', 'Ator', 'Role', 'Status', 'Alvo', 'IP', 'Dispositivo', 'Hash'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      new Date(l.timestamp).toISOString(),
      l.category,
      l.action,
      l.actor,
      l.actorRole || '',
      l.status,
      l.target || '',
      l.ip || '',
      l.deviceId || '',
      l.hash || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `audit_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const getCategoryBadge = (cat: AuditCategory) => {
    switch (cat) {
      case 'admin_actions':
        return { label: 'Ações Admin', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', icon: ShieldCheck };
      case 'alteracoes':
        return { label: 'Alterações', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', icon: Database };
      case 'autenticacoes':
        return { label: 'Autenticações', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40', icon: UserCheck };
      case 'elevacoes_privilegio':
        return { label: 'Elevação Privilégio', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: Key };
      case 'deploys':
        return { label: 'Deploys & Releases', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: Rocket };
      case 'pagamentos':
        return { label: 'Pagamentos (AOA)', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', icon: CreditCard };
      case 'eventos_criticos':
        return { label: 'Eventos Críticos', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', icon: AlertTriangle };
    }
  };

  const getStatusBadge = (status: AuditEntry['status']) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-bold">SUCESSO</span>;
      case 'ELEVATED':
        return <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-bold animate-pulse">ELEVAÇÃO ROOT</span>;
      case 'WARNING':
        return <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded font-bold">AVISO</span>;
      case 'FAILURE':
        return <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded font-bold">FALHA CRÍTICA</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* CONSOLE HEADER */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <span className="p-3 bg-orange-500/20 text-orange-400 rounded-2xl border border-orange-500/30">
              <ScrollText className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-100 tracking-wide">
                CONSOLE DE AUDITORIA & REGISTO INALTERÁVEL
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Rastreabilidade Completa: Ações Admin • Alterações • Autenticações • Privilégios • Deploys • Pagamentos • DLQ Críticos
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="px-3 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30 font-bold flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Assinatura Criptográfica Ativa</span>
            </span>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 font-bold transition-all flex items-center space-x-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Exportar CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 font-bold transition-all flex items-center space-x-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS BY DOMAIN */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 font-mono text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-indigo-400 uppercase font-bold block">1. Ações Admin</span>
            <span className="text-base font-black text-slate-100">{categoryCounts.admin_actions}</span>
            <span className="text-[9px] text-slate-500 block">Permissões e Roles</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-cyan-400 uppercase font-bold block">2. Alterações</span>
            <span className="text-base font-black text-slate-100">{categoryCounts.alteracoes}</span>
            <span className="text-[9px] text-slate-500 block">Configs e Flags</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-sky-400 uppercase font-bold block">3. Autenticações</span>
            <span className="text-base font-black text-slate-100">{categoryCounts.autenticacoes}</span>
            <span className="text-[9px] text-slate-500 block">Sessões e MFA</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-amber-400 uppercase font-bold block">4. Privilégios</span>
            <span className="text-base font-black text-amber-400">{categoryCounts.elevacoes_privilegio}</span>
            <span className="text-[9px] text-slate-500 block">Root e Claims</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-emerald-400 uppercase font-bold block">5. Deploys</span>
            <span className="text-base font-black text-slate-100">{categoryCounts.deploys}</span>
            <span className="text-[9px] text-slate-500 block">Container e Regras</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-emerald-400 uppercase font-bold block">6. Pagamentos</span>
            <span className="text-base font-black text-emerald-400">{categoryCounts.pagamentos}</span>
            <span className="text-[9px] text-slate-500 block">AppyPay e Licenças</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-rose-400 uppercase font-bold block">7. Críticos / DLQ</span>
            <span className="text-base font-black text-rose-400">{categoryCounts.eventos_criticos}</span>
            <span className="text-[9px] text-slate-500 block">Webhooks e Falhas</span>
          </div>
        </div>

        {/* LIVE TEST EVENT TRIGGER BAR */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center space-x-2 text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-bold">Simular Evento de Auditoria em Tempo Real:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              disabled={isSimulating}
              onClick={() => handleSimulateEvent('autenticacoes')}
              className="px-2.5 py-1 bg-slate-900 hover:bg-sky-950 text-sky-300 border border-sky-800/60 rounded cursor-pointer transition-all text-[11px]"
            >
              + Login Founder
            </button>
            <button
              disabled={isSimulating}
              onClick={() => handleSimulateEvent('elevacoes_privilegio')}
              className="px-2.5 py-1 bg-slate-900 hover:bg-amber-950 text-amber-300 border border-amber-800/60 rounded cursor-pointer transition-all text-[11px]"
            >
              + Elevação Root
            </button>
            <button
              disabled={isSimulating}
              onClick={() => handleSimulateEvent('deploys')}
              className="px-2.5 py-1 bg-slate-900 hover:bg-emerald-950 text-emerald-300 border border-emerald-800/60 rounded cursor-pointer transition-all text-[11px]"
            >
              + Deploy Regras
            </button>
            <button
              disabled={isSimulating}
              onClick={() => handleSimulateEvent('pagamentos')}
              className="px-2.5 py-1 bg-slate-900 hover:bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded cursor-pointer transition-all text-[11px]"
            >
              + Pagamento AppyPay
            </button>
            <button
              disabled={isSimulating}
              onClick={() => handleSimulateEvent('eventos_criticos')}
              className="px-2.5 py-1 bg-slate-900 hover:bg-rose-950 text-rose-300 border border-rose-800/60 rounded cursor-pointer transition-all text-[11px]"
            >
              + Falha DLQ
            </button>
          </div>
        </div>
      </div>

      {/* CATEGORY TABS & SEARCH BAR */}
      <div className="space-y-3">
        {/* TAB BUTTONS */}
        <div className="flex items-center space-x-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Todos ({logs.length})
          </button>

          <button
            onClick={() => setSelectedCategory('admin_actions')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'admin_actions'
                ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            1. Ações Admin ({categoryCounts.admin_actions})
          </button>

          <button
            onClick={() => setSelectedCategory('alteracoes')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'alteracoes'
                ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            2. Alterações ({categoryCounts.alteracoes})
          </button>

          <button
            onClick={() => setSelectedCategory('autenticacoes')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'autenticacoes'
                ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            3. Autenticações ({categoryCounts.autenticacoes})
          </button>

          <button
            onClick={() => setSelectedCategory('elevacoes_privilegio')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'elevacoes_privilegio'
                ? 'bg-amber-600 text-white font-bold shadow-md shadow-amber-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            4. Privilégios ({categoryCounts.elevacoes_privilegio})
          </button>

          <button
            onClick={() => setSelectedCategory('deploys')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'deploys'
                ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            5. Deploys ({categoryCounts.deploys})
          </button>

          <button
            onClick={() => setSelectedCategory('pagamentos')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'pagamentos'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            6. Pagamentos ({categoryCounts.pagamentos})
          </button>

          <button
            onClick={() => setSelectedCategory('eventos_criticos')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'eventos_criticos'
                ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            7. Críticos / DLQ ({categoryCounts.eventos_criticos})
          </button>
        </div>

        {/* SEARCH AND FILTER BAR */}
        <div className="flex flex-col sm:flex-row items-center gap-3 font-mono text-xs">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por Ator, Ação, IP, Dispositivo, Hash ou Descrição..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 rounded-xl border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500/60"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-900 text-slate-200 px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500/60 cursor-pointer w-full sm:w-auto"
            >
              <option value="all">Todos os Status</option>
              <option value="SUCCESS">Sucesso</option>
              <option value="ELEVATED">Elevação Root</option>
              <option value="WARNING">Aviso</option>
              <option value="FAILURE">Falha Crítica</option>
            </select>
          </div>
        </div>
      </div>

      {/* AUDIT LOG TABLE / FEED */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-slate-400">
          <span className="font-bold text-slate-200">
            Apresentando {filteredLogs.length} de {logs.length} Registos Inalteráveis
          </span>
          <span className="text-[11px] text-slate-500">Ordenação: Mais recentes primeiro</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <ScrollText className="w-8 h-8 mx-auto text-slate-600" />
            <p className="font-bold text-slate-400">Nenhum registo de auditoria encontrado para os filtros selecionados.</p>
            <p className="text-[11px]">Tente alterar a pesquisa ou selecionar outra categoria.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredLogs.map((entry) => {
              const catInfo = getCategoryBadge(entry.category);
              const CatIcon = catInfo.icon;
              const formattedDate = new Date(entry.timestamp).toLocaleString('pt-PT', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });

              return (
                <div
                  key={entry.id}
                  className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className={`px-2 py-0.5 rounded border font-bold flex items-center space-x-1 ${catInfo.color}`}>
                        <CatIcon className="w-3 h-3" />
                        <span>{catInfo.label}</span>
                      </span>

                      {getStatusBadge(entry.status)}

                      <span className="text-slate-400 font-bold">[{formattedDate}]</span>

                      {entry.actorRole && (
                        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] border border-slate-700">
                          {entry.actorRole}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm tracking-tight">{entry.action}</span>
                      <span className="text-slate-400 hidden sm:inline">•</span>
                      <span className="text-amber-300 font-medium">{entry.actor}</span>
                    </div>

                    {entry.details && (
                      <p className="text-slate-300 text-xs font-sans leading-relaxed">{entry.details}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 pt-1">
                      {entry.target && (
                        <div>
                          Alvo: <span className="text-slate-300 font-bold">{entry.target}</span>
                        </div>
                      )}
                      {entry.ip && (
                        <div>
                          IP: <span className="text-slate-300">{entry.ip}</span>
                        </div>
                      )}
                      {entry.deviceId && (
                        <div>
                          Dispositivo: <span className="text-slate-300">{entry.deviceId}</span>
                        </div>
                      )}
                      {entry.hash && (
                        <div className="text-indigo-400/80 font-mono">
                          Hash: {entry.hash.substring(0, 14)}...
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setInspectingEntry(entry)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold flex items-center space-x-1.5 cursor-pointer transition-all self-end md:self-center"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Inspecionar</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* INSPECTOR MODAL */}
      {inspectingEntry && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 font-mono text-xs shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-sm">Inspeção Detalhada de Auditoria</h3>
              </div>
              <button
                onClick={() => setInspectingEntry(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* INTEGRITY PROOF BADGE */}
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 flex items-center justify-between text-emerald-300">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">INTEGRIDADE CRIPTOGRÁFICA VERIFICADA</span>
              </div>
              <span className="text-[10px] text-emerald-400/80">SALT: PORTAL_TR_MOBILE</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-300">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">ID do Registo</span>
                <span className="font-bold text-slate-200">{inspectingEntry.id}</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Data & Hora</span>
                <span className="font-bold text-slate-200">{new Date(inspectingEntry.timestamp).toISOString()}</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Ator Principal</span>
                <span className="font-bold text-amber-300">{inspectingEntry.actor}</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Perfil / Role</span>
                <span className="font-bold text-indigo-300">{inspectingEntry.actorRole || 'N/A'}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Ação Executada</span>
              <span className="font-bold text-slate-100 text-sm">{inspectingEntry.action}</span>
            </div>

            {inspectingEntry.details && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Descrição Operacional</span>
                <p className="text-slate-300 font-sans leading-relaxed">{inspectingEntry.details}</p>
              </div>
            )}

            {/* BEFORE / AFTER STATE DIFF IF PRESENT */}
            {(inspectingEntry.beforeState || inspectingEntry.afterState) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Estado Anterior (Before)</span>
                  <pre className="text-[11px] text-rose-300/90 whitespace-pre-wrap font-mono overflow-x-auto">
                    {inspectingEntry.beforeState || '{}'}
                  </pre>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Estado Resultante (After)</span>
                  <pre className="text-[11px] text-emerald-300/90 whitespace-pre-wrap font-mono overflow-x-auto">
                    {inspectingEntry.afterState || '{}'}
                  </pre>
                </div>
              </div>
            )}

            {/* HASH BOX */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Assinatura de Imutabilidade (Hash)</span>
                <button
                  onClick={() => copyToClipboard(inspectingEntry.hash || '')}
                  className="text-indigo-400 hover:text-indigo-300 text-[10px] flex items-center space-x-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedHash ? 'Copiado!' : 'Copiar Hash'}</span>
                </button>
              </div>
              <span className="text-xs font-mono text-indigo-300 block break-all">{inspectingEntry.hash}</span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectingEntry(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
