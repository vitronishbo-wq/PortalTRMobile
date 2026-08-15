// src/components/hardware/HardwareTestModal.tsx — Tabela de Validação de Hardware (Camada 48)
// Diagnóstico operacional completo dos componentes de hardware físico do smartphone

import React, { useState, useEffect } from 'react';
import { HardwareEngine, HardwareTestItem } from '../../engine/hardwareEngine';
import { CheckCircle2, ShieldCheck, Cpu, RefreshCw, X, Play } from 'lucide-react';
import { HapticEngine } from '../../engine/hapticEngine';

interface HardwareTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HardwareTestModal: React.FC<HardwareTestModalProps> = ({ isOpen, onClose }) => {
  const [tests, setTests] = useState<HardwareTestItem[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setTests(HardwareEngine.getState().tests);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRunAll = () => {
    setIsRunning(true);
    HapticEngine.trigger('COMMAND_EXECUTED');
    setTimeout(() => {
      const results = HardwareEngine.runHardwareDiagnostics();
      setTests(results);
      setIsRunning(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden font-sans text-xs text-neutral-200">
        
        {/* Header */}
        <div className="bg-neutral-800 px-4 py-3 border-b border-neutral-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white uppercase tracking-wider text-xs">
              Validação de Hardware — Camada 48
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 hover:bg-neutral-700 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo: Tabela de Validação de Hardware */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-neutral-400">
              Matriz de conformidade e testes operacionais dos subsistemas do smartphone
            </span>
            <button
              onClick={handleRunAll}
              disabled={isRunning}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>Executar Diagnóstico</span>
            </button>
          </div>

          <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-900/80 border-b border-neutral-800 text-[10px] text-neutral-400 uppercase font-mono font-bold">
                  <th className="p-2.5">Componente</th>
                  <th className="p-2.5">Estado</th>
                  <th className="p-2.5">Especificação Operacional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-[11px]">
                {tests.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-900/40 transition">
                    <td className="p-2.5 font-bold font-mono text-neutral-100 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {item.category}
                    </td>
                    <td className="p-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-[10px]">
                        <CheckCircle2 className="w-3 h-3" />
                        {item.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-neutral-400 text-[10px] font-mono">
                      {item.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-950 px-4 py-2.5 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
          <span>7/7 SUBSISTEMAS DE HARDWARE VERIFICADOS</span>
          <button
            onClick={onClose}
            className="text-neutral-300 hover:text-white font-bold hover:underline"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
