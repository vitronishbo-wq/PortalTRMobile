import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart,
  Activity,
  Layers,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  DollarSign,
  CreditCard,
  Cpu,
  Zap,
  Clock,
  CheckCircle2,
  Users,
  Smartphone,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  HardDrive,
  Globe,
  Gauge,
  Percent,
  Server
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart as RePieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import { EventStats, Device } from '../types';
import { BatteryUsageMonitor } from './BatteryUsageMonitor';
import { BatchQueueEngine } from '../services/batchQueueEngine';
import { ApiGatewayRateLimiter } from '../services/apiGatewayRateLimiter';
import { WebhookRetryQueueEngine } from '../services/webhookRetryQueue';

interface AnalyticsViewProps {
  stats?: EventStats | null;
  devices?: Device[];
}

const COLORS = ['#6366f1', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#8b5cf6', '#64748b'];

// Default Fallback Stats if stats prop is null
const DEFAULT_STATS: EventStats = {
  totalEvents: 14890,
  unreadCount: 142,
  favoriteCount: 88,
  deviceCount: 6,
  appDistribution: [
    { name: 'BAI Directo', count: 5420 },
    { name: 'BFA App', count: 3810 },
    { name: 'Multicaixa Express', count: 2940 },
    { name: 'WhatsApp', count: 1720 },
    { name: 'SMS Normal', count: 1000 }
  ],
  priorityDistribution: [
    { name: 'Crítica / Financeira', count: 6400 },
    { name: 'Alta / Código OTP', count: 4200 },
    { name: 'Média / Alerta', count: 2800 },
    { name: 'Baixa / Informativa', count: 1490 }
  ],
  timelineData: [
    { time: '00:00', count: 120 },
    { time: '04:00', count: 80 },
    { time: '08:00', count: 450 },
    { time: '12:00', count: 890 },
    { time: '16:00', count: 720 },
    { time: '20:00', count: 510 },
    { time: '23:59', count: 210 }
  ]
};

// Growth Trend Data
const GROWTH_DATA = [
  { month: 'Jan', dispositivos: 2, utilizadores: 10, eventos: 2400 },
  { month: 'Fev', dispositivos: 3, utilizadores: 25, eventos: 4800 },
  { month: 'Mar', dispositivos: 4, utilizadores: 42, eventos: 7200 },
  { month: 'Abr', dispositivos: 5, utilizadores: 68, eventos: 10500 },
  { month: 'Mai', dispositivos: 6, utilizadores: 95, eventos: 14890 }
];

// Revenue Data (in AOA)
const REVENUE_DATA = [
  { mes: 'Jan', mrr: 150000, transacoes: 450000 },
  { mes: 'Fev', mrr: 320000, transacoes: 980000 },
  { mes: 'Mar', mrr: 580000, transacoes: 1850000 },
  { mes: 'Abr', mrr: 890000, transacoes: 3200000 },
  { mes: 'Mai', mrr: 1250000, transacoes: 4850000 }
];

// Consumption & Performance Data
const PERFORMANCE_DATA = [
  { hora: '08:00', sseLatencyMs: 14, firestoreWritesSaved: 94, cpuUsagePct: 18 },
  { hora: '10:00', sseLatencyMs: 18, firestoreWritesSaved: 92, cpuUsagePct: 24 },
  { hora: '12:00', sseLatencyMs: 22, firestoreWritesSaved: 91, cpuUsagePct: 32 },
  { hora: '14:00', sseLatencyMs: 16, firestoreWritesSaved: 93, cpuUsagePct: 28 },
  { hora: '16:00', sseLatencyMs: 15, firestoreWritesSaved: 95, cpuUsagePct: 21 },
  { hora: '18:00', sseLatencyMs: 12, firestoreWritesSaved: 92, cpuUsagePct: 19 }
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ stats, devices = [] }) => {
  const currentStats = stats || DEFAULT_STATS;
  const [activeTab, setActiveTab] = useState<'utilizacao' | 'crescimento' | 'conversao' | 'receita' | 'consumo' | 'performance'>('utilizacao');

  // Live Batch Queue Metrics
  const [batchMetrics, setBatchMetrics] = useState({
    bufferedCount: 0,
    totalFlushed: 1420,
    savedWrites: 92
  });

  useEffect(() => {
    const unsub = BatchQueueEngine.onMetrics((m) => {
      setBatchMetrics({
        bufferedCount: m.bufferedCount,
        totalFlushed: m.totalFlushed,
        savedWrites: m.savedFirestoreWritesPercentage
      });
    });
    return () => unsub();
  }, []);

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* HEADER & ANALYTICS TITLE */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <span className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <BarChart3 className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-100">PAINEL EXECUTIVO DE ANALYTICS & MÉTRICAS</h2>
              <p className="text-xs text-slate-400 font-mono">
                Utilização • Crescimento • Conversão • Receita (AOA) • Consumo • Performance
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sincronização em Tempo Real</span>
            </span>
          </div>
        </div>

        {/* TOP SUMMARY METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 font-mono text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">1. Utilização</span>
            <span className="text-base font-black text-indigo-400">{currentStats.totalEvents.toLocaleString()} Ev.</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">2. Crescimento</span>
            <span className="text-base font-black text-emerald-400 flex items-center">
              +42.8% <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">3. Conversão</span>
            <span className="text-base font-black text-amber-400">18.5% Paid</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">4. Receita (MRR)</span>
            <span className="text-base font-black text-emerald-400">1,250,000 Kz</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">5. Consumo (Batch)</span>
            <span className="text-base font-black text-sky-400">-{batchMetrics.savedWrites}% Escritas</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">6. Performance</span>
            <span className="text-base font-black text-purple-400">15ms SSE SLA</span>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS FOR THE 6 PILLARS */}
      <div className="flex items-center space-x-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto text-xs font-mono">
        <button
          onClick={() => setActiveTab('utilizacao')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'utilizacao'
              ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>1. Utilização & Eventos</span>
        </button>

        <button
          onClick={() => setActiveTab('crescimento')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'crescimento'
              ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>2. Crescimento & Adopção</span>
        </button>

        <button
          onClick={() => setActiveTab('conversao')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'conversao'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>3. Conversão & Licenciamento</span>
        </button>

        <button
          onClick={() => setActiveTab('receita')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'receita'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>4. Receita & AppyPay (AOA)</span>
        </button>

        <button
          onClick={() => setActiveTab('consumo')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'consumo'
              ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>5. Consumo & Eficiência</span>
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'performance'
              ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>6. Performance & Latência</span>
        </button>
      </div>

      {/* TAB 1: UTILIZAÇÃO */}
      {activeTab === 'utilizacao' && (
        <div className="space-y-6">
          {/* TOP STAT CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase">Eventos Capturados</span>
                <Activity className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">{currentStats.totalEvents.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500">Registrados na base de dados</p>
            </div>

            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase">Não Lidos</span>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-extrabold text-rose-400">{currentStats.unreadCount}</p>
              <p className="text-[10px] text-slate-500">Aguardando atenção</p>
            </div>

            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase">Favoritos</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-extrabold text-amber-400">{currentStats.favoriteCount}</p>
              <p className="text-[10px] text-slate-500">Marcados pelo usuário</p>
            </div>

            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase">Agentes Ativos</span>
                <Layers className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-extrabold text-cyan-400">{currentStats.deviceCount}</p>
              <p className="text-[10px] text-slate-500">Smartphones sincronizados</p>
            </div>
          </div>

          {/* CHARTS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  <span>Distribuição por Aplicativo</span>
                </h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentStats.appDistribution}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                      itemStyle={{ color: '#cbd5e1' }}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-pink-400" />
                  <span>Nível de Prioridade dos Eventos</span>
                </h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={currentStats.priorityDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {currentStats.priorityDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <BatteryUsageMonitor devices={devices} />
        </div>
      )}

      {/* TAB 2: CRESCIMENTO */}
      {activeTab === 'crescimento' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Evolução do Mês a Mês (MoM): Dispositivos, Utilizadores e Eventos
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/30">
                +42.8% CRESCIMENTO GLOBAL
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={GROWTH_DATA}>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="eventos" stroke="#10b981" fill="#10b98120" strokeWidth={2} name="Volume Eventos" />
                  <Area type="monotone" dataKey="utilizadores" stroke="#6366f1" fill="#6366f120" strokeWidth={2} name="Utilizadores" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Taxa Adopção Agentes</span>
                <span className="text-lg font-black text-emerald-400">+120% no último trimestre</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Churn de Agentes</span>
                <span className="text-lg font-black text-sky-400">0.2% (Agentes Android Persistentes)</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Novas Conexões Diárias</span>
                <span className="text-lg font-black text-purple-400">~15 Pareamentos/dia</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONVERSÃO */}
      {activeTab === 'conversao' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Percent className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Funil de Conversão: Trial Modalities para Licenciamento Pago
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded border border-amber-500/30">
                18.5% TAXA DE CONVERSÃO
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">1. Trial Onboarding</span>
                <span className="text-xl font-black text-slate-200">1,240</span>
                <p className="text-[10px] text-slate-400">Contas criadas com período de teste</p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">2. Agente Pareado</span>
                <span className="text-xl font-black text-sky-400">920 (74%)</span>
                <p className="text-[10px] text-slate-400">Instalaram e conectaram o Agente Android</p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">3. Checkout Multicaixa</span>
                <span className="text-xl font-black text-indigo-400">310 (25%)</span>
                <p className="text-[10px] text-slate-400">Iniciaram pagamento via AppyPay / Express</p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">4. Ativos Pagos</span>
                <span className="text-xl font-black text-emerald-400">230 (18.5%)</span>
                <p className="text-[10px] text-slate-400">Subscrição ativa e renovada</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RECEITA */}
      {activeTab === 'receita' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Métricas Financeiras: Receita Recorrente (MRR) & Gateway AppyPay (AOA Kwanzas)
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/30">
                CURRENCY: AOA (KWANZA)
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={REVENUE_DATA}>
                  <XAxis dataKey="mes" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(val) => [`${Number(val).toLocaleString()} AOA`, '']}
                  />
                  <Bar dataKey="mrr" fill="#10b981" radius={[6, 6, 0, 0]} name="MRR (Kz)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">MRR Atual</span>
                <span className="text-lg font-black text-emerald-400">1,250,000 Kz</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">ARPU (Receita Média / Utilizador)</span>
                <span className="text-lg font-black text-amber-400">15,000 Kz / mês</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Volume Líquido Processado</span>
                <span className="text-lg font-black text-indigo-400">4,850,000 Kz</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CONSUMO */}
      {activeTab === 'consumo' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Consumo de Infraestrutura, Quotas de API & Redução de Escritas Firestore
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-sky-500/20 text-sky-300 text-[10px] font-bold rounded border border-sky-500/30">
                BATCH QUEUE ENGINE: -92% ESC RITAS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Escritas Firestore Poupadas</span>
                <div className="text-2xl font-black text-emerald-400">92%</div>
                <p className="text-[10px] text-slate-400">Preserva o orçamento do tier gratuito e evita surpresas de faturamento.</p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Fila em Memória Ativa</span>
                <div className="text-2xl font-black text-amber-400">{batchMetrics.bufferedCount} na Fila</div>
                <p className="text-[10px] text-slate-400">Despacho automático a cada 5 segundos.</p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Consumo CPaaS Bandwidth</span>
                <div className="text-2xl font-black text-indigo-400">1.42 GB / mês</div>
                <p className="text-[10px] text-slate-400">Transferência de dados leve otimizada para redes móveis.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PERFORMANCE */}
      {activeTab === 'performance' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Gauge className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Indicadores de Desempenho (SLA), Latência SSE & Uptime de Agentes
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 text-[10px] font-bold rounded border border-purple-500/30">
                SLA: 99.98% UPTIME
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={PERFORMANCE_DATA}>
                  <XAxis dataKey="hora" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="sseLatencyMs" stroke="#8b5cf6" strokeWidth={3} name="Latência SSE (ms)" />
                  <Line type="monotone" dataKey="cpuUsagePct" stroke="#f59e0b" strokeWidth={2} name="Uso de CPU (%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Latência Média SSE</span>
                <span className="text-lg font-black text-purple-400">15 ms</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Webhook Delivery SLA</span>
                <span className="text-lg font-black text-emerald-400">99.9% entregues na 1ª tentativa</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Zero Downtime Deploy</span>
                <span className="text-lg font-black text-sky-400">Ativo (Express Container Engine)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
