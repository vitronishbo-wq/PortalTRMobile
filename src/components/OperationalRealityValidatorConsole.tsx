import React, { useState, useEffect } from 'react';
import { 
  OperationalRealityValidator, 
  OperationalRealityReport, 
  OperationalModuleStatus 
} from '../engine/OperationalRealityValidator';
import { 
  ShieldAlert, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Layers,
  Terminal,
  Activity,
  Smartphone,
  Cpu
} from 'lucide-react';

export const OperationalRealityValidatorConsole: React.FC = () => {
  const [report, setReport] = useState<OperationalRealityReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedModule, setSelectedModule] = useState<OperationalModuleStatus | null>(null);

  const runAudit = async () => {
    setIsLoading(true);
    try {
      const res = await OperationalRealityValidator.executeStrictAudit();
      setReport(res);
    } catch (e) {
      console.error('Falha ao auditar realidade operacional:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runAudit();
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 font-mono text-slate-200">
      {/* HEADER DA AUDITORIA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-white tracking-wide uppercase">
              Matriz de Realidade Operacional (Maturidade Estrita)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Regra Fundamental: <span className="text-emerald-400 font-semibold">IMPLEMENTADO</span> ≠ <span className="text-blue-400 font-semibold">CONFIGURADO</span> ≠ <span className="text-amber-400 font-semibold">TESTADO</span> ≠ <span className="text-purple-400 font-semibold">VALIDADO NUM DISPOSITIVO REAL</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400">Validados:</span>
            <span className={`font-bold ${report?.validatedCount === 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {report?.validatedCount ?? 0} / {report?.totalModules ?? 12} ({report?.operationalScore ?? 0}%)
            </span>
          </div>

          <button
            onClick={runAudit}
            disabled={isLoading}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isLoading ? 'Auditando...' : 'Reauditar'}</span>
          </button>
        </div>
      </div>

      {/* BANNER DE RIGOR OPERACIONAL */}
      <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-3 flex items-start space-x-3 text-xs text-amber-300">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-200">
            Critério Estrito: Apenas código em execução num dispositivo físico e com tráfego verificado é considerado OPERACIONAL.
          </p>
          <p className="text-amber-400/80 text-[11px]">
            Telecomunicações (Unitel/Africell/SIP/IMS/SMS) e Bancos (BFA/Multicaixa) requerem credenciais de produção e validação em hardware físico para avançar além de IMPLEMENTADO.
          </p>
        </div>
      </div>

      {/* TABELA PRINCIPAL DE MATURIDADE OPERACIONAL */}
      <div className="overflow-x-auto border border-slate-800 rounded-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Módulo</th>
              <th className="py-3 px-3 text-center">Implementado</th>
              <th className="py-3 px-3 text-center">Configurado</th>
              <th className="py-3 px-3 text-center">Testado</th>
              <th className="py-3 px-3 text-center">Validado (Real)</th>
              <th className="py-3 px-4">Estado Real de Campo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/50 font-sans">
            {report?.modules.map((mod) => (
              <tr 
                key={mod.id} 
                onClick={() => setSelectedModule(mod)}
                className="hover:bg-slate-800/50 cursor-pointer transition text-slate-300"
              >
                <td className="py-3 px-4 font-mono font-bold text-white flex items-center space-x-2">
                  <span className="text-slate-500 text-[10px] w-4">{mod.order}.</span>
                  <span>{mod.name}</span>
                </td>

                {/* Implementado */}
                <td className="py-3 px-3 text-center">
                  {mod.implemented ? (
                    <span className="inline-flex items-center text-emerald-400 font-bold font-mono">
                      <CheckCircle2 className="w-4 h-4 inline mr-1 text-emerald-400" /> SIM
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-slate-500 font-mono">
                      <XCircle className="w-4 h-4 inline mr-1 text-slate-600" /> NÃO
                    </span>
                  )}
                </td>

                {/* Configurado */}
                <td className="py-3 px-3 text-center">
                  {mod.configured ? (
                    <span className="inline-flex items-center text-blue-400 font-bold font-mono">
                      <CheckCircle2 className="w-4 h-4 inline mr-1 text-blue-400" /> SIM
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-slate-500 font-mono">
                      <XCircle className="w-4 h-4 inline mr-1 text-rose-500/70" /> NÃO
                    </span>
                  )}
                </td>

                {/* Testado */}
                <td className="py-3 px-3 text-center">
                  {mod.tested ? (
                    <span className="inline-flex items-center text-amber-400 font-bold font-mono">
                      <CheckCircle2 className="w-4 h-4 inline mr-1 text-amber-400" /> SIM
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-slate-500 font-mono">
                      <XCircle className="w-4 h-4 inline mr-1 text-rose-500/70" /> NÃO
                    </span>
                  )}
                </td>

                {/* Validado em Dispositivo Real */}
                <td className="py-3 px-3 text-center">
                  {mod.validated ? (
                    <span className="inline-flex items-center text-purple-400 font-bold font-mono">
                      <CheckCircle2 className="w-4 h-4 inline mr-1 text-purple-400" /> SIM
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-slate-500 font-mono">
                      <XCircle className="w-4 h-4 inline mr-1 text-rose-500/70" /> NÃO
                    </span>
                  )}
                </td>

                {/* Estado Real / Notas de Campo */}
                <td className="py-3 px-4 text-xs text-slate-400 font-mono">
                  {mod.realStateNotes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SUMÁRIO DE MATURIDADE POR CAMADAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">1. Implementado</div>
          <div className="text-lg font-bold text-emerald-400 font-mono">
            {report?.implementedCount ?? 0} / {report?.totalModules ?? 12}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Código fonte escrito</div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">2. Configurado</div>
          <div className="text-lg font-bold text-blue-400 font-mono">
            {report?.configuredCount ?? 0} / {report?.totalModules ?? 12}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Credenciais & schemas</div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">3. Testado</div>
          <div className="text-lg font-bold text-amber-400 font-mono">
            {report?.testedCount ?? 0} / {report?.totalModules ?? 12}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Bateria E2E em lab</div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">4. Validado (Real)</div>
          <div className="text-lg font-bold text-rose-400 font-mono">
            {report?.validatedCount ?? 0} / {report?.totalModules ?? 12}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Hardware físico de campo</div>
        </div>
      </div>

      {/* DETALHES DO MÓDULO SELECIONADO */}
      {selectedModule && (
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Diagnóstico de Campo: {selectedModule.name}</span>
            </span>
            <button 
              onClick={() => setSelectedModule(null)}
              className="text-xs text-slate-500 hover:text-white"
            >
              Fechar
            </button>
          </div>
          <p className="text-xs text-slate-300 font-mono">
            {selectedModule.realStateNotes}
          </p>
          <div className="flex items-center space-x-4 text-[11px] text-slate-400 pt-1">
            <span>Categoria: <strong className="text-slate-200">{selectedModule.category}</strong></span>
            <span>Estágio Atual: <strong className="text-amber-400">{selectedModule.currentStage}</strong></span>
            <span>Dispositivo Físico: <strong className="text-rose-400">PENDENTE</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
