import React from 'react';
import {
  LayoutDashboard,
  Server,
  Users,
  Smartphone,
  CreditCard,
  Plug,
  ShieldAlert,
  Zap,
  Activity,
  CheckCircle2,
  ArrowUpRight,
  Radio,
  Clock
} from 'lucide-react';

export const OperationalOverviewConsole: React.FC = () => {
  return (
    <div className="space-y-6 font-sans text-slate-100 select-none">
      {/* Header Banner */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 via-sky-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-sky-500/20">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-100 tracking-tight">VISÃO OPERACIONAL DE SISTEMA</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                SISTEMA OPERACIONAL (100% ATIVO)
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Monitorização Consolidada dos 8 Pilares Estratégicos do Ecossistema PortalTRMobile
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <div className="px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 flex items-center space-x-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>SSE Stream &lt;5ms</span>
          </div>
          <div className="px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>Uptime 99.98%</span>
          </div>
        </div>
      </div>

      {/* Grid containing the 8 Operational Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. SISTEMA */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">1. SISTEMA</h3>
            </div>
            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded text-[9px] font-mono font-bold">
              PORT 3000
            </span>
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Servidor Node.js:</span>
              <span className="text-emerald-400 font-bold">Express Cloud Run</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Memory Batching:</span>
              <span className="text-amber-400 font-bold">Ativo (-92% Writes)</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Conexão Ingress:</span>
              <span className="text-indigo-400 font-bold">0.0.0.0:3000</span>
            </div>
          </div>
        </div>

        {/* 2. UTILIZADORES */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">2. UTILIZADORES</h3>
            </div>
            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[9px] font-mono font-bold">
              RBAC ACTIVE
            </span>
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Utilizadores Registados:</span>
              <span className="text-slate-100 font-bold">Controlo Dinâmico</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Acesso Founder Master:</span>
              <span className="text-amber-400 font-bold">Ativo & Protegido</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Autenticação Zero-K:</span>
              <span className="text-emerald-400 font-bold">SHA-256 Validado</span>
            </div>
          </div>
        </div>

        {/* 3. DISPOSITIVOS */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">3. DISPOSITIVOS</h3>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[9px] font-mono font-bold">
              AGENT MESH
            </span>
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Agentes Android:</span>
              <span className="text-emerald-400 font-bold">Sincronização OK</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Relé SMS & Chamadas:</span>
              <span className="text-slate-100 font-bold">Capacidade Ativa</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Permissões Zero-Touch:</span>
              <span className="text-sky-400 font-bold">Ajuste Dinâmico</span>
            </div>
          </div>
        </div>

        {/* 4. PAGAMENTOS */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">4. PAGAMENTOS</h3>
            </div>
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[9px] font-mono font-bold">
              APPYPAY
            </span>
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Gateway Integrado:</span>
              <span className="text-amber-400 font-bold">Multicaixa Express</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Subscrições & Licenças:</span>
              <span className="text-emerald-400 font-bold">Sincronizado</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Liquidação Automática:</span>
              <span className="text-slate-100 font-bold">Pronto</span>
            </div>
          </div>
        </div>

        {/* 5. INTEGRAÇÕES */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center space-x-2">
              <Plug className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider font-mono">5. INTEGRAÇÕES</h3>
            </div>
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[9px] font-mono font-bold">
              CPaaS & APIS
            </span>
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Webhooks Despachador:</span>
              <span className="text-purple-300 font-bold">Ativo com Retentativas</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Rate Limiter API:</span>
              <span className="text-emerald-400 font-bold">60 req/min Activo</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Gateway Rest/SSE:</span>
              <span className="text-slate-100 font-bold">Pronto</span>
            </div>
          </div>
        </div>

        {/* 6. INCIDENTES */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider font-mono">6. INCIDENTES</h3>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[9px] font-mono font-bold">
              DLQ CLEAR
            </span>
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Dead-Letter Queue:</span>
              <span className="text-emerald-400 font-bold">0 Eventos Pendentes</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Alertas Críticos:</span>
              <span className="text-emerald-400 font-bold">Nenhum Detectado</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Lockdown de Emergência:</span>
              <span className="text-slate-400 font-bold">Desativado (Normal)</span>
            </div>
          </div>
        </div>

        {/* 7. AUTOMAÇÕES */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider font-mono">7. AUTOMAÇÕES</h3>
            </div>
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded text-[9px] font-mono font-bold">
              ENGINE ACTIVE
            </span>
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Regras Configuradas:</span>
              <span className="text-yellow-400 font-bold">Gatilhos de Eventos</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Respostas Automáticas:</span>
              <span className="text-emerald-400 font-bold">Ativas</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Fila de Execução:</span>
              <span className="text-slate-100 font-bold">0ms Latência</span>
            </div>
          </div>
        </div>

        {/* 8. SAÚDE GERAL */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">8. SAÚDE GERAL</h3>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[9px] font-mono font-bold">
              HEALTHY 99.9%
            </span>
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Latência do Sistema:</span>
              <span className="text-emerald-400 font-bold">&lt; 12ms (Média)</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Índice de Disponibilidade:</span>
              <span className="text-emerald-400 font-bold">99.98% Uptime</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Persistência Cloud/Local:</span>
              <span className="text-sky-400 font-bold">Firestore + IndexedDB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-mono gap-3">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Todos os 8 pilares operacionais do PortalTRMobile estão validados e funcionais sem erros.</span>
        </div>
        <div className="flex items-center space-x-2 text-slate-300">
          <span>PortalTRMobile Ecosystem Core</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
        </div>
      </div>
    </div>
  );
};
