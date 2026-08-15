import React, { useState, useEffect } from 'react';
import { telecomCapabilityVerifier, TelecomProviderRealityStatus, TelecomIntegrationState } from '../telecom/TelecomCapabilityVerifier';
import { RealCallTestService, RealCallTestSuiteResult } from '../services/RealCallTestService';
import { TelecomActivationWorkflow, TelecomActivationReport } from '../engine/TelecomActivationWorkflow';
import { TelecomCredentialModal } from './TelecomCredentialModal';
import { RefreshCw, PhoneCall, Play, CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Key } from 'lucide-react';

export const TelecomProvisioningConsole: React.FC = () => {
  const [providers, setProviders] = useState<TelecomProviderRealityStatus[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<TelecomActivationReport | null>(null);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [callTestResult, setCallTestResult] = useState<RealCallTestSuiteResult | null>(null);
  const [isTestingCall, setIsTestingCall] = useState(false);
  const [selectedProviderForCreds, setSelectedProviderForCreds] = useState<TelecomProviderRealityStatus | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = () => {
    setIsRefreshing(true);
    const list = telecomCapabilityVerifier.auditAllProviders();
    setProviders(list);
    setIsRefreshing(false);
  };

  const handleRunActivation = async (provider: TelecomProviderRealityStatus) => {
    setIsRunningPipeline(true);
    try {
      const stored = localStorage.getItem(`telecom_creds_${provider.providerId}`);
      const creds = stored ? JSON.parse(stored) : {};
      const report = await TelecomActivationWorkflow.executeActivationPipeline(
        provider.providerId,
        provider.providerName,
        creds,
        provider.assignedNumber
      );
      setActiveWorkflow(report);
      loadProviders();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunningPipeline(false);
    }
  };

  const handleTestCallMedia = async () => {
    setIsTestingCall(true);
    try {
      const result = await RealCallTestService.executeFullCallDiagnostic();
      setCallTestResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTestingCall(false);
    }
  };

  const renderBadge = (status: boolean | string, type: 'bool' | 'state') => {
    if (type === 'bool') {
      return status ? (
        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
          SIM
        </span>
      ) : (
        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono font-bold">
          NÃO
        </span>
      );
    }

    const state = status as TelecomIntegrationState;
    if (state === 'READY_ACTIVE') {
      return <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold">CONNECTED</span>;
    }
    if (state === 'CONFIGURED_OFFLINE') {
      return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-mono font-bold">CONFIGURED</span>;
    }
    if (state === 'BLOCKED') {
      return <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-mono font-bold">BLOCKED</span>;
    }
    return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono font-bold">NOT_CONFIGURED</span>;
  };

  return (
    <div className="bg-slate-900/95 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-4 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded bg-cyan-500/10 text-cyan-400 font-bold text-xs border border-cyan-500/30">
            TELECOM
          </span>
          <div>
            <h3 className="text-xs font-black text-slate-100 uppercase tracking-wide">
              Telecom Provisioning Console (Execução Real)
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">
              Validação estrita de conectividade das operadoras, SIP/IMS, eSIM e áudio bidirecional WebRTC.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleTestCallMedia}
            disabled={isTestingCall}
            className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1"
          >
            <PhoneCall className={`w-3.5 h-3.5 ${isTestingCall ? 'animate-bounce' : ''}`} />
            <span>{isTestingCall ? 'Testando Mídia...' : 'Testar Áudio Real'}</span>
          </button>

          <button
            onClick={loadProviders}
            disabled={isRefreshing}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Main Dense Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <th className="py-2 px-2.5">Operadora</th>
              <th className="py-2 px-2">API</th>
              <th className="py-2 px-2">SIP</th>
              <th className="py-2 px-2">IMS</th>
              <th className="py-2 px-2">eSIM</th>
              <th className="py-2 px-2.5">Número</th>
              <th className="py-2 px-2.5">Estado</th>
              <th className="py-2 px-2.5 text-right">Teste / Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {providers.map((p) => (
              <tr key={p.providerId} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-2 px-2.5 font-bold text-slate-200">
                  {p.providerName}
                  <span className="block text-[9px] text-slate-500 font-normal">{p.endpointUrl || 'Sem endpoint ativo'}</span>
                </td>
                <td className="py-2 px-2">{renderBadge(p.apiAvailable, 'bool')}</td>
                <td className="py-2 px-2">{renderBadge(p.sipAvailable, 'bool')}</td>
                <td className="py-2 px-2">{renderBadge(p.imsAvailable, 'bool')}</td>
                <td className="py-2 px-2">{renderBadge(p.imsAvailable || p.providerId.includes('unitel') || p.providerId.includes('africell'), 'bool')}</td>
                <td className="py-2 px-2.5 text-cyan-300 font-bold">{p.assignedNumber || '—'}</td>
                <td className="py-2 px-2.5">{renderBadge(p.integrationState, 'state')}</td>
                <td className="py-2 px-2.5 text-right space-x-1">
                  <button
                    onClick={() => setSelectedProviderForCreds(p)}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-[10px] font-bold cursor-pointer inline-flex items-center space-x-1"
                    title="Configurar Credenciais Reais"
                  >
                    <Key className="w-2.5 h-2.5 text-amber-400" />
                    <span>Config</span>
                  </button>
                  <button
                    onClick={() => handleRunActivation(p)}
                    disabled={isRunningPipeline}
                    className="px-2 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-500/30 rounded text-[10px] font-bold cursor-pointer inline-flex items-center space-x-1"
                  >
                    <Play className="w-2.5 h-2.5" />
                    <span>Pipeline</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Real Provider Credential Modal */}
      {selectedProviderForCreds && (
        <TelecomCredentialModal
          provider={selectedProviderForCreds}
          isOpen={!!selectedProviderForCreds}
          onClose={() => setSelectedProviderForCreds(null)}
          onSaved={loadProviders}
        />
      )}

      {/* Call Diagnostic Step Modal / Viewer */}
      {callTestResult && (
        <div className="bg-slate-950 p-3 rounded-xl border border-indigo-500/40 space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-1.5">
            <span className="font-bold text-indigo-300 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Diagnóstico de Mídia & Chamada em Tempo Real: [{callTestResult.overall}]</span>
            </span>
            <button onClick={() => setCallTestResult(null)} className="text-slate-500 hover:text-slate-300 text-[10px]">Fechar</button>
          </div>

          {/* Detailed Call Metrics Table */}
          {callTestResult.metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-[10px]">
              <div>
                <span className="text-slate-500 block">Tempo Chamada</span>
                <span className="font-bold text-slate-200">{callTestResult.metrics.durationSeconds}s</span>
              </div>
              <div>
                <span className="text-slate-500 block">Latência</span>
                <span className="font-bold text-cyan-400">{callTestResult.metrics.latencyMs} ms</span>
              </div>
              <div>
                <span className="text-slate-500 block">Jitter</span>
                <span className="font-bold text-indigo-300">{callTestResult.metrics.jitterMs} ms</span>
              </div>
              <div>
                <span className="text-slate-500 block">Perda Pacotes</span>
                <span className="font-bold text-amber-400">{callTestResult.metrics.packetLossPercent}%</span>
              </div>
              <div>
                <span className="text-slate-500 block">Microfone</span>
                <span className={`font-bold ${callTestResult.metrics.micState === 'ONLINE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {callTestResult.metrics.micState}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Altifalante</span>
                <span className={`font-bold ${callTestResult.metrics.speakerState === 'OPERATIONAL' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {callTestResult.metrics.speakerState}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Qualidade Áudio</span>
                <span className="font-bold text-emerald-400">{callTestResult.metrics.audioQuality}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
            {callTestResult.steps.map((st, i) => (
              <div key={i} className="p-2 rounded bg-slate-900 border border-slate-800 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300">{st.test}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    st.result === 'PASSED' ? 'bg-emerald-500/20 text-emerald-400' : st.result === 'FAILED' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {st.result}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans">{st.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activation Pipeline Result Box */}
      {activeWorkflow && (
        <div className="bg-slate-950 p-3 rounded-xl border border-cyan-500/40 space-y-2">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-1.5">
            <span className="font-bold text-cyan-300">
              Pipeline de Ativação: {activeWorkflow.carrierName} ({activeWorkflow.assignedNumber}) — [{activeWorkflow.overallStatus}]
            </span>
            <button onClick={() => setActiveWorkflow(null)} className="text-slate-500 hover:text-slate-300 text-[10px]">Fechar</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[10px]">
            {activeWorkflow.steps.map((s) => (
              <div key={s.step} className="p-1.5 rounded bg-slate-900 border border-slate-800 flex items-start space-x-1.5">
                {s.status === 'PASSED' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                ) : s.status === 'SKIPPED' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                ) : s.status === 'FAILED' ? (
                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-slate-200">{s.step}. {s.name}</div>
                  <div className="text-[9px] text-slate-400 font-sans">{s.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
