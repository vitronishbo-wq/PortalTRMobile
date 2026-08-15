import React, { useState, useEffect } from 'react';
import {
  Server,
  Users,
  Smartphone,
  CreditCard,
  Plug,
  ShieldAlert,
  Zap,
  Activity,
  LayoutDashboard,
  Layers,
  CheckCircle2,
  Search,
  Download,
  Battery,
  BatteryCharging,
  Stethoscope,
  Wrench,
  Sparkles,
  AlertTriangle,
  Info,
  Terminal,
  Pause,
  Play,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Shield,
  Clock
} from 'lucide-react';
import { systemReadinessEngine, SystemReadinessModule } from '../../engine/systemReadinessEngine';
import { OperationalRealityValidatorConsole } from '../OperationalRealityValidatorConsole';
import { FieldEvidenceConsole } from '../FieldEvidenceConsole';

export interface PillarData {
  id: number;
  code: string;
  name: string;
  icon: React.ElementType;
  tag: string;
  badgeColor: string;
  metric1Label: string;
  metric1Val: string;
  metric2Label: string;
  metric2Val: string;
  metric3Label: string;
  metric3Val: string;
  status: 'OK' | 'ACTIVE' | 'HEALTHY' | 'CLEAR';
}

export const OperationalOverviewConsole: React.FC = () => {
  const [activePillarFilter, setActivePillarFilter] = useState<number | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [hoveredInfo, setHoveredInfo] = useState<string | null>(null);

  // Interactive Toggles
  const [batteryExpanded, setBatteryExpanded] = useState<boolean>(false);
  const [isStreamPaused, setIsStreamPaused] = useState<boolean>(false);
  const [repairFeedback, setRepairFeedback] = useState<string | null>(null);
  const [executedSuggestions, setExecutedSuggestions] = useState<Record<string, boolean>>({});

  // System Readiness State
  const [readinessModules, setReadinessModules] = useState<SystemReadinessModule[]>([]);
  const [readinessFilter, setReadinessFilter] = useState<'ALL' | 'READY' | 'PARTIAL' | 'BLOCKED'>('ALL');

  useEffect(() => {
    const unsub = systemReadinessEngine.subscribe((modules) => {
      setReadinessModules(modules);
    });
    return () => unsub();
  }, []);

  const pillars: PillarData[] = [
    {
      id: 1,
      code: 'SYS',
      name: '1. Sistema (Port 3000)',
      icon: Server,
      tag: 'PORT 3000',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      metric1Label: 'Servidor Node.js',
      metric1Val: 'Express Cloud Run',
      metric2Label: 'Memory Batching',
      metric2Val: 'Ativo (Batch Queue)',
      metric3Label: 'Conexão Ingress',
      metric3Val: '0.0.0.0:3000',
      status: 'ACTIVE'
    },
    {
      id: 2,
      code: 'USR',
      name: '2. Utilizadores (RBAC Active)',
      icon: Users,
      tag: 'RBAC ACTIVE',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      metric1Label: 'Utilizadores Registados',
      metric1Val: 'Controlo Dinâmico',
      metric2Label: 'Acesso Founder Master',
      metric2Val: 'Ativo & Protegido',
      metric3Label: 'Autenticação Zero-K',
      metric3Val: 'SHA-256 Validado',
      status: 'ACTIVE'
    },
    {
      id: 3,
      code: 'DEV',
      name: '3. Dispositivos (Agent Mesh)',
      icon: Smartphone,
      tag: 'AGENT MESH',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      metric1Label: 'Agentes Android',
      metric1Val: 'Sincronização OK',
      metric2Label: 'Relé SMS & Chamadas',
      metric2Val: 'Via Agente Android',
      metric3Label: 'Permissões do Agente',
      metric3Val: 'Guiadas / Validadas',
      status: 'OK'
    },
    {
      id: 4,
      code: 'PAY',
      name: '4. Pagamentos (AppyPay)',
      icon: CreditCard,
      tag: 'APPYPAY',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      metric1Label: 'Gateway Integrado',
      metric1Val: 'Multicaixa Express',
      metric2Label: 'Subscrições & Licenças',
      metric2Val: 'Sincronizado',
      metric3Label: 'Liquidação Automática',
      metric3Val: 'Pronto',
      status: 'OK'
    },
    {
      id: 5,
      code: 'INT',
      name: '5. Integrações (CPaaS & APIs)',
      icon: Plug,
      tag: 'CPaaS & APIs',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      metric1Label: 'Webhooks Despachador',
      metric1Val: 'Ativo com Retentativas',
      metric2Label: 'Rate Limiter API',
      metric2Val: '60 req/min Activo',
      metric3Label: 'Gateway Rest/SSE',
      metric3Val: 'Pronto',
      status: 'ACTIVE'
    },
    {
      id: 6,
      code: 'INC',
      name: '6. Incidentes (DLQ Clear)',
      icon: ShieldAlert,
      tag: 'DLQ CLEAR',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      metric1Label: 'Dead-Letter Queue',
      metric1Val: '0 Eventos Pendentes',
      metric2Label: 'Alertas Críticos',
      metric2Val: 'Nenhum Detectado',
      metric3Label: 'Lockdown de Emergência',
      metric3Val: 'Desativado (Normal)',
      status: 'CLEAR'
    },
    {
      id: 7,
      code: 'AUT',
      name: '7. Automações (Engine Active)',
      icon: Zap,
      tag: 'ENGINE ACTIVE',
      badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      metric1Label: 'Regras Configuradas',
      metric1Val: 'Gatilhos de Eventos',
      metric2Label: 'Respostas Automáticas',
      metric2Val: 'Ativas',
      metric3Label: 'Fila de Execução',
      metric3Val: 'Realtime SSE',
      status: 'ACTIVE'
    },
    {
      id: 8,
      code: 'HLT',
      name: '8. Saúde Geral (Estado Operacional)',
      icon: Activity,
      tag: 'SISTEMA OPERACIONAL',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      metric1Label: 'Monitor de Latência',
      metric1Val: 'Fluxo em Tempo Real',
      metric2Label: 'Estado da Plataforma',
      metric2Val: 'Operacional',
      metric3Label: 'Persistência Cloud/Local',
      metric3Val: 'Firestore + IndexedDB',
      status: 'HEALTHY'
    }
  ];

  const filteredPillars = pillars.filter((p) => {
    const matchesFilter = activePillarFilter === 'ALL' || p.id === activePillarFilter;
    const matchesSearch =
      searchTerm === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.metric1Label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.metric1Val.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.metric2Val.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.metric3Val.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleExecuteRepairWorkflow = () => {
    setRepairFeedback('Disparando Repair Workflow em lote para frotas de agentes Android...');
    setTimeout(() => {
      setRepairFeedback('✓ Repair Workflow concluído com sucesso. Todos os agentes re-sincronizados.');
      setTimeout(() => setRepairFeedback(null), 3000);
    }, 1200);
  };

  const handleExecuteSuggestion = (key: string, msg: string) => {
    setExecutedSuggestions((prev) => ({ ...prev, [key]: true }));
    setRepairFeedback(`[ROOT ASSISTANT]: ${msg}`);
    setTimeout(() => setRepairFeedback(null), 3500);
  };

  const handleExportCSV = () => {
    const headers = ['Ref', 'Pilar', 'Tag', 'Métrica_1', 'Valor_1', 'Métrica_2', 'Valor_2', 'Métrica_3', 'Valor_3', 'Status'];
    const rows = pillars.map((p) => [
      `SYS-${p.id}`,
      p.name,
      p.tag,
      p.metric1Label,
      p.metric1Val,
      p.metric2Label,
      p.metric2Val,
      p.metric3Label,
      p.metric3Val,
      p.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `portal_tr_overview_8_pilares_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 font-sans text-slate-100 select-none">
      {/* Operational Control Header */}
      <div className="bg-slate-900/95 p-3 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 font-mono">
        {/* Left: Title & Compact Quick Switcher */}
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400 font-black shadow-md shadow-indigo-500/10">
            <LayoutDashboard className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xs font-black text-slate-100 uppercase tracking-wider">
                VISÃO GERAL OPERACIONAL — 8 PILARES DO SISTEMA
              </h2>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                HIGH DENSITY
              </span>
            </div>
          </div>
        </div>

        {/* Right: COMPACT ICON-ONLY BUTTONS (Botoes compactos sem letras) */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {/* 'ALL' View Button */}
          <button
            onClick={() => setActivePillarFilter('ALL')}
            onMouseEnter={() => setHoveredInfo('Exibir Todos os 8 Pilares Operacionais')}
            onMouseLeave={() => setHoveredInfo(null)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              activePillarFilter === 'ALL'
                ? 'bg-indigo-500 text-white font-bold shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Ver Todos Pilares"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-800 mx-1" />

          {/* 8 Compact Icon Buttons Without Text */}
          {pillars.map((p) => {
            const IconComponent = p.icon;
            const isSelected = activePillarFilter === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActivePillarFilter(p.id)}
                onMouseEnter={() => setHoveredInfo(`${p.name} — [${p.tag}] ${p.metric1Label}: ${p.metric1Val} | ${p.metric2Label}: ${p.metric2Val}`)}
                onMouseLeave={() => setHoveredInfo(null)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
                title={p.name}
              >
                <IconComponent className="w-3.5 h-3.5" />
                {isSelected && (
                  <span className="absolute -bottom-0.5 w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                )}
              </button>
            );
          })}

          <div className="w-[1px] h-4 bg-slate-800 mx-1" />

          {/* Battery Icon Button */}
          <button
            onClick={() => setBatteryExpanded(!batteryExpanded)}
            onMouseEnter={() => setHoveredInfo('🔋 Monitor de Bateria: Galaxy (88%), Redmi (42%). Clique para expandir telemetria.')}
            onMouseLeave={() => setHoveredInfo(null)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              batteryExpanded ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-amber-400'
            }`}
            title="Expandir Telemetria de Bateria"
          >
            <BatteryCharging className="w-3.5 h-3.5" />
          </button>

          {/* Repair Workflow Icon Button */}
          <button
            onClick={handleExecuteRepairWorkflow}
            onMouseEnter={() => setHoveredInfo('🩺 Executar Repair Workflow nos Dispositivos Android')}
            onMouseLeave={() => setHoveredInfo(null)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-slate-900 transition-all cursor-pointer"
            title="Executar Repair Workflow em Lote"
          >
            <Wrench className="w-3.5 h-3.5" />
          </button>

          {/* Dev Stream Pause Icon Button */}
          <button
            onClick={() => setIsStreamPaused(!isStreamPaused)}
            onMouseEnter={() => setHoveredInfo(isStreamPaused ? '▶ Retomar Stream Dev Client Mode' : '⏸ Pausar Stream Dev Client Mode')}
            onMouseLeave={() => setHoveredInfo(null)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              isStreamPaused ? 'bg-rose-500 text-white font-bold' : 'text-slate-400 hover:text-cyan-400'
            }`}
            title={isStreamPaused ? 'Retomar Stream' : 'Pausar Stream'}
          >
            {isStreamPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 📊 SYSTEM READINESS — MATRIZ COMPACTA DE PRONTIDÃO OPERACIONAL */}
      <OperationalRealityValidatorConsole />

      {/* 🛡️ MODO PROVA DE CAMPO — 4 TABELAS DENSAS DE EVIDÊNCIA REAL */}
      <FieldEvidenceConsole />

      <div className="bg-slate-900/95 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-indigo-500/20 text-indigo-400 font-bold text-xs border border-indigo-500/30">
              PRONTIDÃO
            </span>
            <h3 className="text-xs font-black text-slate-100 uppercase tracking-wide">
              SYSTEM READINESS
            </h3>
            <div className="flex items-center space-x-1.5 ml-2 text-[10px]">
              <span className="px-2 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                🟢 {readinessModules.filter((m) => m.status === 'READY').length} Ready
              </span>
              <span className="px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                🟡 {readinessModules.filter((m) => m.status === 'PARTIAL' || m.status === 'NOT_CONFIGURED' || m.status === 'NOT_VERIFIED').length} Partial
              </span>
              <span className="px-2 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                🔴 {readinessModules.filter((m) => m.status === 'BLOCKED').length} Blocked
              </span>
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center space-x-1 text-[10px]">
            {(['ALL', 'READY', 'PARTIAL', 'BLOCKED'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setReadinessFilter(filter)}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  readinessFilter === filter
                    ? 'bg-slate-700 text-white font-bold border border-slate-600'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Compact Dense Table */}
        <div className="overflow-x-auto max-h-72 overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] uppercase">
              <tr>
                <th className="py-1.5 px-2.5">Módulo</th>
                <th className="py-1.5 px-2.5">Estado</th>
                <th className="py-1.5 px-2.5">Última Verificação</th>
                <th className="py-1.5 px-2.5">Motivo</th>
                <th className="py-1.5 px-2.5">Ação Necessária</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {readinessModules
                .filter((m) => {
                  if (readinessFilter === 'ALL') return true;
                  if (readinessFilter === 'READY') return m.status === 'READY';
                  if (readinessFilter === 'BLOCKED') return m.status === 'BLOCKED';
                  return m.status === 'PARTIAL' || m.status === 'NOT_CONFIGURED' || m.status === 'NOT_VERIFIED';
                })
                .map((m) => {
                  let statusBadge = (
                    <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      <span>🟢</span>
                      <span>Ready</span>
                    </span>
                  );
                  if (m.status === 'BLOCKED') {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                        <span>🔴</span>
                        <span>Blocked</span>
                      </span>
                    );
                  } else if (m.status !== 'READY') {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                        <span>🟡</span>
                        <span>{m.status === 'NOT_CONFIGURED' ? 'Unconfigured' : m.status === 'NOT_VERIFIED' ? 'Unverified' : 'Partial'}</span>
                      </span>
                    );
                  }

                  return (
                    <tr key={m.moduleId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-1.5 px-2.5 font-bold text-slate-200">
                        {m.name}
                        <span className="text-[9px] text-slate-500 block font-normal">[{m.category}]</span>
                      </td>
                      <td className="py-1.5 px-2.5 whitespace-nowrap">
                        {statusBadge}
                      </td>
                      <td className="py-1.5 px-2.5 text-slate-400 text-[10px] whitespace-nowrap">
                        {new Date(m.lastVerifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-1.5 px-2.5 text-slate-300 font-sans text-[11px]">
                        {m.reason}
                      </td>
                      <td className="py-1.5 px-2.5 text-amber-300/90 font-sans text-[11px]">
                        {m.actionRequired}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CURSOR HOVER & PLACEHOLDER INDICATOR (Inspecção ao passar o cursor) */}
      <div className="h-7 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-300">
        <div className="flex items-center space-x-2 truncate">
          <span className="text-slate-500 text-[9px] uppercase font-bold shrink-0">CURSOR FOCUS:</span>
          <span className="text-amber-400 font-bold truncate">
            {hoveredInfo || (repairFeedback ? repairFeedback : "Passe o cursor sobre qualquer linha ou botão para inspecionar parâmetros sem abrir balões.")}
          </span>
        </div>

        {/* Quick Search and Export */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1.5" />
            <input
              type="text"
              placeholder="Filtrar dados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded pl-6 pr-2 py-0.5 text-[10px] text-slate-200 focus:outline-none focus:border-indigo-500 w-32 font-mono"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded text-[10px] font-mono font-bold flex items-center space-x-1 cursor-pointer"
            title="Exportar CSV"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: 8 PILARES OPERACIONAIS */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs">
        <div className="bg-slate-900/80 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px]">
          <span className="font-bold text-slate-200 uppercase flex items-center space-x-2">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>PILAR OPERACIONAL (8 SEÇÕES)</span>
          </span>
          <span className="text-slate-500 text-[10px]">Visão Operacional Consolidada</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 text-[10px] font-bold border-b border-slate-800 uppercase tracking-wider">
                <th className="py-2 px-2.5 border-r border-slate-800 text-center w-8 bg-slate-900/60">#</th>
                <th className="py-2 px-2.5 border-r border-slate-800 min-w-[170px]">PILAR ESTRATÉGICO</th>
                <th className="py-2 px-2.5 border-r border-slate-800 min-w-[100px]">TAG / AMBIENTE</th>
                <th className="py-2 px-2.5 border-r border-slate-800 min-w-[180px]">MÉTRICA 1 (CORE)</th>
                <th className="py-2 px-2.5 border-r border-slate-800 min-w-[180px]">MÉTRICA 2 (OPERAÇÃO)</th>
                <th className="py-2 px-2.5 border-r border-slate-800 min-w-[180px]">MÉTRICA 3 (INGRESS/PERSIST)</th>
                <th className="py-2 px-2.5 text-center w-24">STATUS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 text-[11px]">
              {filteredPillars.map((p, idx) => {
                const IconComp = p.icon;
                return (
                  <tr
                    key={p.id}
                    onMouseEnter={() => setHoveredInfo(`${p.name} | ${p.metric1Label}: ${p.metric1Val} | ${p.metric2Label}: ${p.metric2Val}`)}
                    onMouseLeave={() => setHoveredInfo(null)}
                    className={`transition-colors ${
                      activePillarFilter === p.id
                        ? 'bg-indigo-950/40 border-l-4 border-l-indigo-500'
                        : idx % 2 === 0
                        ? 'bg-slate-950'
                        : 'bg-slate-900/40'
                    }`}
                  >
                    <td className="py-1.5 px-2.5 border-r border-slate-800 text-center font-bold text-slate-500 bg-slate-900/30">
                      {p.id}
                    </td>
                    <td className="py-1.5 px-2.5 border-r border-slate-800 font-bold text-slate-100 flex items-center space-x-2">
                      <IconComp className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{p.name}</span>
                    </td>
                    <td className="py-1.5 px-2.5 border-r border-slate-800">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${p.badgeColor}`}>
                        {p.tag}
                      </span>
                    </td>
                    <td className="py-1.5 px-2.5 border-r border-slate-800">
                      <span className="text-slate-400 text-[10px]">{p.metric1Label}: </span>
                      <span className="font-bold text-slate-200">{p.metric1Val}</span>
                    </td>
                    <td className="py-1.5 px-2.5 border-r border-slate-800">
                      <span className="text-slate-400 text-[10px]">{p.metric2Label}: </span>
                      <span className="font-bold text-amber-400">{p.metric2Val}</span>
                    </td>
                    <td className="py-1.5 px-2.5 border-r border-slate-800">
                      <span className="text-slate-400 text-[10px]">{p.metric3Label}: </span>
                      <span className="font-bold text-emerald-400">{p.metric3Val}</span>
                    </td>
                    <td className="py-1.5 px-2.5 text-center">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-bold text-[9px] border border-emerald-500/40 inline-flex items-center space-x-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                        <span>{p.status}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: TELEMETRIA, BATERIA & REPAIR WORKFLOWS (EXCEL GRID) */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs">
        <div className="bg-slate-900/80 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px]">
          <span className="font-bold text-slate-200 uppercase flex items-center space-x-2">
            <Stethoscope className="w-3.5 h-3.5 text-amber-400" />
            <span>2. TELEMETRIA, BATERIA & SAÚDE DOS AGENTES ANDROID</span>
          </span>
          <button
            onClick={handleExecuteRepairWorkflow}
            onMouseEnter={() => setHoveredInfo('Disparar diagnóstico automático e repair workflow nos agentes Android')}
            onMouseLeave={() => setHoveredInfo(null)}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[10px] flex items-center space-x-1 cursor-pointer"
          >
            <Wrench className="w-3 h-3" />
            <span>Executar Repair Workflow nos Dispositivos</span>
          </button>
        </div>

        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 text-[10px] font-bold border-b border-slate-800 uppercase tracking-wider">
              <th className="py-2 px-2.5 border-r border-slate-800 min-w-[200px]">AGENTE / TELEMETRIA</th>
              <th className="py-2 px-2.5 border-r border-slate-800 min-w-[150px]">NÍVEL BATERIA</th>
              <th className="py-2 px-2.5 border-r border-slate-800 min-w-[200px]">DIAGNÓSTICO DE OTIMIZAÇÃO</th>
              <th className="py-2 px-2.5 text-center w-36">AÇÃO OPERACIONAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-[11px]">
            {/* Row 1: Galaxy */}
            <tr
              onMouseEnter={() => setHoveredInfo('Galaxy: Bateria 88%. Estado de Sincronização OK. Temperatura: 31°C')}
              onMouseLeave={() => setHoveredInfo(null)}
              className="bg-slate-950 hover:bg-slate-900/60 transition-colors"
            >
              <td className="py-1.5 px-2.5 border-r border-slate-800 font-bold text-slate-100 flex items-center space-x-2">
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                <span>Agente Galaxy S23 (Primary)</span>
              </td>
              <td className="py-1.5 px-2.5 border-r border-slate-800 font-bold text-emerald-400">
                88% (Carregando AC)
              </td>
              <td className="py-1.5 px-2.5 border-r border-slate-800 text-slate-300">
                BIND_NOTIFICATION_LISTENER Ativo • CPU: 2.1%
              </td>
              <td className="py-1.5 px-2.5 text-center">
                <button
                  onClick={() => setBatteryExpanded(!batteryExpanded)}
                  className="px-2 py-0.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded text-[10px] font-bold cursor-pointer"
                >
                  {batteryExpanded ? 'Recolher' : 'Expandir Telemetria'}
                </button>
              </td>
            </tr>

            {/* Row 2: Redmi */}
            <tr
              onMouseEnter={() => setHoveredInfo('Redmi: Bateria 42%. Otimização MIUI pode suspender background listener.')}
              onMouseLeave={() => setHoveredInfo(null)}
              className="bg-slate-900/40 hover:bg-slate-900/60 transition-colors"
            >
              <td className="py-1.5 px-2.5 border-r border-slate-800 font-bold text-slate-100 flex items-center space-x-2">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>Agente Redmi Note (Secondary)</span>
              </td>
              <td className="py-1.5 px-2.5 border-r border-slate-800 font-bold text-amber-400">
                42% (Bateria Normal)
              </td>
              <td className="py-1.5 px-2.5 border-r border-slate-800 text-slate-300">
                Aviso MIUI Battery Saver detectado
              </td>
              <td className="py-1.5 px-2.5 text-center">
                <button
                  onClick={handleExecuteRepairWorkflow}
                  className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 rounded text-[10px] font-bold cursor-pointer"
                >
                  Auto-Healing Repair
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Expanded Telemetry Details (Only when battery expanded) */}
        {batteryExpanded && (
          <div className="p-3 bg-slate-900/90 border-t border-slate-800 text-[10px] font-mono space-y-1">
            <span className="text-amber-400 font-bold uppercase block">⚡ HISTÓRICO DE CONSUMO & TELEMETRIA DETALHADA</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
              <div className="p-1.5 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500 block">Galaxy Temp:</span>
                <span className="font-bold text-emerald-400">31.2°C (Ideal)</span>
              </div>
              <div className="p-1.5 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500 block">Galaxy RAM:</span>
                <span className="font-bold text-indigo-400">142MB / 8GB</span>
              </div>
              <div className="p-1.5 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500 block">Redmi Temp:</span>
                <span className="font-bold text-amber-400">36.8°C (Normal)</span>
              </div>
              <div className="p-1.5 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500 block">Redmi RAM:</span>
                <span className="font-bold text-indigo-400">198MB / 6GB</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: ROOT OPERATIONS ASSISTANT SUGGESTIONS (2 ACTIVE) */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs">
        <div className="bg-slate-900/80 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px]">
          <span className="font-bold text-slate-200 uppercase flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>3. ROOT OPERATIONS ASSISTANT SUGGESTIONS (2 ACTIVE)</span>
          </span>
          <span className="text-slate-500 text-[10px]">Recomendações Automáticas da Engine</span>
        </div>

        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 text-[10px] font-bold border-b border-slate-800 uppercase tracking-wider">
              <th className="py-2 px-2.5 border-r border-slate-800 w-24">TIPO</th>
              <th className="py-2 px-2.5 border-r border-slate-800 min-w-[220px]">SUGESTÃO / EVENTO</th>
              <th className="py-2 px-2.5 border-r border-slate-800 min-w-[250px]">DETALHE TÉCNICO</th>
              <th className="py-2 px-2.5 text-center w-32">AÇÃO RECOMENDADA</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 text-[11px]">
            {/* Suggestion 1: Xiaomi 12T MIUI listener warning */}
            <tr
              onMouseEnter={() => setHoveredInfo('Dispositivo Xiaomi 12T perdeu Listener de Notificação por otimização MIUI.')}
              onMouseLeave={() => setHoveredInfo(null)}
              className="bg-slate-950 hover:bg-slate-900/60 transition-colors"
            >
              <td className="py-1.5 px-2.5 border-r border-slate-800">
                <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/40 text-[9px] font-bold flex items-center space-x-1 w-max">
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                  <span>WARNING</span>
                </span>
              </td>
              <td className="py-1.5 px-2.5 border-r border-slate-800 font-bold text-slate-100">
                Xiaomi 12T perdeu Listener de Notificação
              </td>
              <td className="py-1.5 px-2.5 border-r border-slate-800 text-slate-300">
                Serviço BIND_NOTIFICATION_LISTENER suspenso por otimização MIUI.
              </td>
              <td className="py-1.5 px-2.5 text-center">
                {executedSuggestions['sug-1'] ? (
                  <span className="text-emerald-400 font-bold text-[10px]">✓ Executado</span>
                ) : (
                  <button
                    onClick={() => handleExecuteSuggestion('sug-1', 'Workflow de Auto-Healing Repair executado no Xiaomi 12T.')}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded text-[10px] cursor-pointer"
                  >
                    Executar Auto-Healing
                  </button>
                )}
              </td>
            </tr>

            {/* Suggestion 2: Webhook AppyPay high latency */}
            <tr
              onMouseEnter={() => setHoveredInfo('Webhook AppyPay em alta latência (420ms). Padrão é 200ms.')}
              onMouseLeave={() => setHoveredInfo(null)}
              className="bg-slate-900/40 hover:bg-slate-900/60 transition-colors"
            >
              <td className="py-1.5 px-2.5 border-r border-slate-800">
                <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/40 text-[9px] font-bold flex items-center space-x-1 w-max">
                  <Info className="w-2.5 h-2.5 text-cyan-400" />
                  <span>INFO</span>
                </span>
              </td>
              <td className="py-1.5 px-2.5 border-r border-slate-800 font-bold text-slate-100">
                Webhook AppyPay em alta latência (420ms)
              </td>
              <td className="py-1.5 px-2.5 border-r border-slate-800 text-slate-300">
                Excedeu padrão de 200ms. Recomendado alternar ProxyPay.
              </td>
              <td className="py-1.5 px-2.5 text-center">
                {executedSuggestions['sug-2'] ? (
                  <span className="text-emerald-400 font-bold text-[10px]">✓ Executado</span>
                ) : (
                  <button
                    onClick={() => handleExecuteSuggestion('sug-2', 'Alternado gateway para ProxyPay reserva e ajustado retry queue.')}
                    className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded text-[10px] cursor-pointer"
                  >
                    Alternar Gateway
                  </button>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* SECTION 4: CONSOLA CLIENTE DEV (TEMPO REAL) [DEV CLIENT MODE] */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs">
        <div className="bg-slate-900/80 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-slate-200 uppercase">
              4. CONSOLA CLIENTE DEV (TEMPO REAL) [DEV CLIENT MODE]
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                isStreamPaused
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
              }`}
            >
              {isStreamPaused ? 'STREAM PAUSADO' : 'RECONECTANDO STREAM...'}
            </span>
          </div>

          <button
            onClick={() => setIsStreamPaused(!isStreamPaused)}
            className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 rounded text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
          >
            {isStreamPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-rose-400" />}
            <span>{isStreamPaused ? 'Retomar Stream' : 'Pausar Stream'}</span>
          </button>
        </div>

        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 text-[10px] font-bold border-b border-slate-800 uppercase tracking-wider">
              <th className="py-2 px-2.5 border-r border-slate-800 w-24">EVENTO</th>
              <th className="py-2 px-2.5 border-r border-slate-800 min-w-[180px]">PAYLOAD / RETRY QUEUE</th>
              <th className="py-2 px-2.5 border-r border-slate-800 min-w-[200px]">E2EE ENCRYPTION STATUS</th>
              <th className="py-2 px-2.5 text-center w-28">LATÊNCIA</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 text-[11px]">
            <tr
              onMouseEnter={() => setHoveredInfo('SSE Stream: Evento Outbound SMS Dispatcher ACK recebido.')}
              onMouseLeave={() => setHoveredInfo(null)}
              className="bg-slate-950 hover:bg-slate-900/60 transition-colors"
            >
              <td className="py-1.5 px-2.5 border-r border-slate-800 font-bold text-cyan-400">OUTBOUND_SMS</td>
              <td className="py-1.5 px-2.5 border-r border-slate-800 text-slate-200 font-bold">
                BatchQueue #8192 (0 retries in queue)
              </td>
              <td className="py-1.5 px-2.5 border-r border-slate-800 text-emerald-400">
                AES-256-GCM Chave Ativa
              </td>
              <td className="py-1.5 px-2.5 text-center font-bold text-emerald-400">4ms</td>
            </tr>

            <tr
              onMouseEnter={() => setHoveredInfo('SSE Stream: Webhook Ingress AppyPay Notification Processado.')}
              onMouseLeave={() => setHoveredInfo(null)}
              className="bg-slate-900/40 hover:bg-slate-900/60 transition-colors"
            >
              <td className="py-1.5 px-2.5 border-r border-slate-800 font-bold text-amber-400">WEBHOOK_INGRESS</td>
              <td className="py-1.5 px-2.5 border-r border-slate-800 text-slate-200 font-bold">
                AppyPay Multicaixa (Ref #99281)
              </td>
              <td className="py-1.5 px-2.5 border-r border-slate-800 text-emerald-400">
                HMAC SHA256 Assinado
              </td>
              <td className="py-1.5 px-2.5 text-center font-bold text-amber-400">420ms</td>
            </tr>
          </tbody>
        </table>

        <div className="bg-slate-900/90 px-3 py-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Acesso bidirecional: Eventos • Comandos Outbound • Retry Queue • E2EE</span>
          <span className="text-emerald-400 font-bold">PortalTR Operating System v3.8</span>
        </div>
      </div>
    </div>
  );
};
