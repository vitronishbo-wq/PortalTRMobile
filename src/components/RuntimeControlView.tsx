import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Activity,
  Zap,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Layers,
  Radio,
  Clock,
  Terminal,
  Smartphone,
  Tv,
  Monitor,
  Download,
  Send,
  Sparkles
} from 'lucide-react';
import { globalRuntime, RuntimeEnvelope, ActionItem } from '../engine/runtimeEngine';
import { getPlatform, isTauri, sendDesktopNotification } from '../lib/platform';
import { useTVMode } from '../hooks/useTVMode';
import { dispatchAPNsNotification } from '../services/apns';
import { operationalValidation, CapabilityAuditResult } from '../engine/operationalValidationEngine';

export const RuntimeControlView: React.FC = () => {
  const [runtimeState, setRuntimeState] = useState(globalRuntime.state);
  const [healthScore, setHealthScore] = useState(globalRuntime.calculateHealthScore());
  const [logs, setLogs] = useState<string[]>(globalRuntime.logs);
  const [eventHistory, setEventHistory] = useState<RuntimeEnvelope[]>(globalRuntime.eventBus.getHistory());
  const [capabilities, setCapabilities] = useState(globalRuntime.capabilitiesGraph);
  const [pipelineQueue, setPipelineQueue] = useState<ActionItem[]>(globalRuntime.actionPipeline.getQueue());
  const [repairedCount, setRepairedCount] = useState<number | null>(null);

  // Operational Validation State
  const [auditResults, setAuditResults] = useState<CapabilityAuditResult[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);

  // Multi-Platform Runtime states
  const { isTV, toggleTVMode } = useTVMode();
  const [detectedPlatform, setDetectedPlatform] = useState(getPlatform());
  const [apnsStatus, setApnsStatus] = useState<string | null>(null);
  const [tauriBuildStatus, setTauriBuildStatus] = useState<string | null>(null);

  const handleTestAPNs = async () => {
    setApnsStatus('Enviando...');
    const result = await dispatchAPNsNotification('sample-ios-device-token-12345', {
      title: 'Notificação iOS APNs',
      body: 'Notificação Push enviada com sucesso via gateway APNs!',
      topic: 'com.vitronis.cos',
      badge: 1
    });
    setApnsStatus(result.success ? `Enviado (ID: ${result.messageId.substring(0, 10)})` : 'Falhou');
    setTimeout(() => setApnsStatus(null), 4000);
  };

  const handleTestTauriNotification = async () => {
    setTauriBuildStatus('Enviando Notificação...');
    const sent = await sendDesktopNotification('Vitronis COS Desktop', 'Notificação de teste no ecossistema Tauri/Desktop.');
    setTauriBuildStatus(sent ? 'Notificação Entregue' : 'Notificação Simulada');
    setTimeout(() => setTauriBuildStatus(null), 3000);
  };

  // Subscribe to runtime events and sync UI state
  useEffect(() => {
    // Initial boot trigger if BOOT state
    if (globalRuntime.state === 'BOOT') {
      globalRuntime.boot().then(() => syncUI());
    }

    const unsub = globalRuntime.eventBus.subscribe(() => {
      syncUI();
    });

    // Run Operational Validation System Probe
    runAudit();

    const interval = setInterval(() => {
      syncUI();
    }, 1000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const runAudit = async () => {
    setIsAuditing(true);
    try {
      const results = await operationalValidation.performSystemAudit();
      setAuditResults(results);
    } catch (e) {
      console.error('[RuntimeControlView] Erro ao auditar capacidades operacionais:', e);
    } finally {
      setIsAuditing(false);
    }
  };

  const syncUI = () => {
    setRuntimeState(globalRuntime.state);
    setHealthScore(globalRuntime.calculateHealthScore());
    setLogs([...globalRuntime.logs]);
    setEventHistory(globalRuntime.eventBus.getHistory());
    setCapabilities([...globalRuntime.capabilitiesGraph]);
    setPipelineQueue(globalRuntime.actionPipeline.getQueue());
  };

  const handleRunAutoRepair = async () => {
    const count = await globalRuntime.runAutoRepair();
    setRepairedCount(count);
    syncUI();
    setTimeout(() => setRepairedCount(null), 3000);
  };

  const handleExecutePipelineStep = async (actionId: string) => {
    await globalRuntime.executePipelineStep(actionId);
    syncUI();
  };

  const handleRebootRuntime = async () => {
    await globalRuntime.boot();
    syncUI();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/80 via-slate-900 to-purple-900/80 p-6 rounded-2xl border border-indigo-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
              <Cpu className="w-6 h-6" />
            </span>
            <h2 className="text-xl font-black text-slate-100 tracking-tight">
              Runtime Autónomo V2 Declarativo
            </h2>
          </div>
          <p className="text-xs text-slate-300">
            Motor de Estado Unificado, Grafo de Capacidades (Diff), Action Pipeline & Auto-Reparação Declarativa.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunAutoRepair}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Wrench className="w-4 h-4" />
            <span>Auto-Reparação Declarativa</span>
          </button>

          <button
            onClick={handleRebootRuntime}
            className="flex items-center space-x-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reboot</span>
          </button>
        </div>
      </div>

      {repairedCount !== null && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 p-4 rounded-xl text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Auto-Reparação concluída com sucesso! {repairedCount} regra(s) resolvida(s).</span>
        </div>
      )}

      {/* Top Diagnostics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Runtime State */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Estado do Runtime
          </span>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
            <span className="text-lg font-black text-indigo-300 tracking-tight">{runtimeState}</span>
          </div>
          <span className="text-[10px] text-slate-500 block">State Controller V2</span>
        </div>

        {/* Health Metric Score */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Health Score Unificado
          </span>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span className="text-lg font-black text-emerald-400 font-mono">{healthScore}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full rounded-full transition-all"
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>

        {/* OEM Profile */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Fabricante OEM
          </span>
          <div className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-purple-400" />
            <span className="text-base font-bold text-slate-200 uppercase">{globalRuntime.oemBrand}</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Identificação Automática</span>
        </div>

        {/* Active Plugins Count */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Plugins Ativos
          </span>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span className="text-lg font-black text-cyan-300 font-mono">{globalRuntime.plugins.size} Plugins</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Interface Única Registada</span>
        </div>
      </div>

      {/* 🟡 MATRIZ DE VALIDAÇÃO OPERACIONAL — Hardware Real vs. Abstração de Software */}
      <div className="bg-slate-900/95 p-5 rounded-2xl border border-amber-500/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-black text-xs">
              🟡 AUDIT
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-100 flex items-center space-x-2">
                <span>Validação Operacional: Hardware Real vs. Abstração de Software</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono font-bold">
                  {auditResults.filter((r) => r.isRealOperational).length}/{auditResults.length} Operacionais Comprovados
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Critério estrito: nenhuma capacidade é considerada operacional apenas por possuir código, interface ou coleção Firestore.
              </p>
            </div>
          </div>

          <button
            onClick={runAudit}
            disabled={isAuditing}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>{isAuditing ? 'Sondando Hardware...' : 'Revalidar Hardware & APIs'}</span>
          </button>
        </div>

        {/* Dense Inline Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <th className="py-2.5 px-3">Domínio & Capacidade</th>
                <th className="py-2.5 px-3">Classificação Operacional</th>
                <th className="py-2.5 px-3">Métrica / Evidência Real</th>
                <th className="py-2.5 px-3">Método de Verificação</th>
                <th className="py-2.5 px-3">Diagnóstico Arquitetural</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {auditResults.map((r) => {
                let badgeClass = 'bg-slate-800 text-slate-400 border-slate-700';
                if (r.level === 'HARDWARE_REAL') {
                  badgeClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
                } else if (r.level === 'CONNECTED_ACTIVE') {
                  badgeClass = 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
                } else if (r.level === 'CONFIGURED_ONLY') {
                  badgeClass = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
                } else if (r.level === 'SIMULATED_MOCK') {
                  badgeClass = 'bg-purple-500/20 text-purple-400 border-purple-500/40';
                } else if (r.level === 'UNSUPPORTED') {
                  badgeClass = 'bg-rose-500/20 text-rose-400 border-rose-500/40';
                }

                return (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-200">
                      <div>{r.name}</div>
                      <span className="text-[10px] text-slate-500 font-mono font-normal">[{r.category}]</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}`}>
                        {r.level}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 text-[11px]">
                      {r.actualMetric || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[10px]">
                      {r.verificationMethod}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-sans text-[11px] max-w-xs">
                      {r.details}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Platform Operational Control Card (Fase 4) */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-amber-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Monitor className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-100 flex items-center space-x-2">
                <span>Runtime Multi-Plataforma (Fase 4)</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold uppercase">
                  {detectedPlatform}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Execução unificada em 8 ecossistemas: Windows, macOS, Linux (Tauri 3MB), iOS APNs, Android Node & Smart TV.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              Modo TV: <strong className={isTV ? 'text-amber-400' : 'text-slate-400'}>{isTV ? 'ATIVO' : 'INATIVO'}</strong>
            </span>
          </div>
        </div>

        {/* Operational Control Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setDetectedPlatform(getPlatform())}
            className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition-all cursor-pointer group active:scale-95 space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                Detetar Plataforma
              </span>
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <p className="text-[10px] text-slate-400">Ambiente atual: <strong className="text-amber-400 uppercase">{detectedPlatform}</strong></p>
          </button>

          <button
            onClick={handleTestTauriNotification}
            className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition-all cursor-pointer group active:scale-95 space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">
                Tauri Desktop API
              </span>
              <Download className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-[10px] text-slate-400">{tauriBuildStatus || 'Testar Notificação Tauri'}</p>
          </button>

          <button
            onClick={handleTestAPNs}
            className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition-all cursor-pointer group active:scale-95 space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 group-hover:text-purple-300 transition-colors">
                iOS APNs Gateway
              </span>
              <Send className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <p className="text-[10px] text-slate-400">{apnsStatus || 'Disparar Push iOS'}</p>
          </button>

          <button
            onClick={toggleTVMode}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer group active:scale-95 space-y-1 ${
              isTV
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                : 'bg-slate-950 hover:bg-slate-800 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                Modo Smart TV
              </span>
              <Tv className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-[10px] text-slate-400">
              {isTV ? 'Navegação Setas ATIVA' : 'Alternar UI para Ecrã Grande'}
            </p>
          </button>
        </div>
      </div>

      {/* Uniform Plugins Matrix Section */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-slate-100 text-sm flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Matriz de Plugins Modulares (Interface Uniforme: initialize, start, stop, health, events)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {Array.from(globalRuntime.plugins.values()).filter((p) => p.health() >= 50).length}/
            {globalRuntime.plugins.size} Operacionais
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from(globalRuntime.plugins.values()).map((plugin) => {
            const score = plugin.health();
            const h = plugin.healthDetails
              ? plugin.healthDetails()
              : {
                  score,
                  status: score >= 80 ? 'ok' : score >= 50 ? 'degraded' : 'down',
                  message: score >= 50 ? 'Plugin operacional' : 'Plugin desativado'
                };

            return (
              <div
                key={plugin.id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{plugin.name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {plugin.id} • v{plugin.version}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                      h.status === 'ok'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {h.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Score de Saúde (health):</span>
                    <span className="font-mono font-bold text-emerald-400">{h.score}%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{h.message}</p>
                </div>

                <div className="pt-1 flex items-center space-x-2">
                  <button
                    onClick={async () => {
                      await plugin.start();
                      syncUI();
                    }}
                    className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg border border-slate-700 transition-all cursor-pointer"
                  >
                    start()
                  </button>
                  <button
                    onClick={async () => {
                      await plugin.stop();
                      syncUI();
                    }}
                    className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-bold rounded-lg border border-slate-800 transition-all cursor-pointer"
                  >
                    stop()
                  </button>
                  <button
                    onClick={() => {
                      const evStream = plugin.events();
                      const count = typeof evStream?.getHistory === 'function' ? evStream.getHistory().length : 0;
                      globalRuntime.log(`[Plugin ${plugin.id}] Observable de Eventos. Eventos em buffer: ${count}`);
                      syncUI();
                    }}
                    className="flex-1 py-1 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 text-[10px] font-bold rounded-lg border border-indigo-800/50 transition-all cursor-pointer"
                  >
                    events()
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Capability Graph & Action Diff Pipeline */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-100 text-sm flex items-center space-x-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span>Grafo de Capacidades & Action Diff Pipeline</span>
            </h3>
            <span className="text-xs text-indigo-400 font-mono">Desired vs Current</span>
          </div>

          <div className="space-y-3">
            {capabilities.map((cap) => (
              <div
                key={cap.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  cap.active
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-amber-950/20 border-amber-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{cap.label}</h4>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      Intent: {cap.resolverAction}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      cap.active
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {cap.active ? '● Ativo' : '▲ Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Action Pipeline Queue Execution */}
          {pipelineQueue.length > 0 && (
            <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 space-y-3">
              <h4 className="text-xs font-bold text-indigo-300 flex items-center space-x-2">
                <Play className="w-4 h-4 text-indigo-400" />
                <span>Action Pipeline Pending Steps ({pipelineQueue.filter((a) => a.status === 'pending').length})</span>
              </h4>

              <div className="space-y-2">
                {pipelineQueue.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-200 block">{item.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.intentAction}</span>
                    </div>

                    {item.status === 'pending' ? (
                      <button
                        onClick={() => handleExecutePipelineStep(item.id)}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                      >
                        Executar Diff
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-bold text-[10px]">Concluído</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Unified Event Envelope Stream Log */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-100 text-sm flex items-center space-x-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Event Envelope Stream (Barramento Unificado)</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">{eventHistory.length} Eventos</span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {eventHistory.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 font-mono">
                Aguardando eventos do barramento...
              </div>
            ) : (
              eventHistory.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1 hover:border-slate-700 transition-all text-xs"
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-indigo-400 uppercase">{evt.type}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(evt.time).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Origem: {evt.source}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                      {evt.priority}
                    </span>
                  </div>
                  <pre className="text-[10px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-800 overflow-x-auto font-mono mt-1">
                    {JSON.stringify(evt.payload, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Runtime Terminal Logs Section */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-3 font-mono">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-slate-300 flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span>Terminal de Registos do Runtime Autónomo</span>
          </span>
          <span className="text-[10px] text-slate-500">Auto-scroll ativo</span>
        </div>

        <div className="max-h-48 overflow-y-auto space-y-1 text-[11px] text-slate-400">
          {logs.map((log, i) => (
            <div key={i} className="leading-relaxed hover:text-slate-200">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
