// src/components/modals/COSCommandBar.tsx — Barra de Telemetria e Status do Kernel COS 3.0
// Diretriz 33, 37 & 40: Feedback do Kernel Operacional em tempo real

import React, { useState, useEffect } from 'react';
import { COSKernel, KernelTelemetry } from '../../engine/cosKernel';
import { CommandEngine, CommandEngineEventPayload } from '../../engine/commandEngine';
import { Terminal, Shield, CheckCircle2, AlertTriangle, Cpu, Layers } from 'lucide-react';

export const COSCommandBar: React.FC = () => {
  const [kernelTelemetry, setKernelTelemetry] = useState<KernelTelemetry>(COSKernel.getTelemetry());
  const [engineState, setEngineState] = useState<CommandEngineEventPayload>(CommandEngine.getSnapshot());

  useEffect(() => {
    const unsubKernel = COSKernel.subscribe((telemetry) => {
      setKernelTelemetry(telemetry);
    });
    const unsubEngine = CommandEngine.subscribe((snapshot) => {
      setEngineState(snapshot);
    });

    return () => {
      unsubKernel();
      unsubEngine();
    };
  }, []);

  const getKernelColor = (state: string) => {
    switch (state) {
      case 'READY': return 'bg-emerald-500';
      case 'EXECUTING': return 'bg-blue-400 animate-spin';
      case 'BOOTING': return 'bg-cyan-400 animate-pulse';
      case 'WAITING': return 'bg-amber-400 animate-pulse';
      case 'SUSPENDED': return 'bg-purple-500';
      case 'RECOVERY': return 'bg-amber-500 animate-bounce';
      case 'ERROR': return 'bg-rose-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="bg-slate-950 border-t border-slate-800 px-3 py-1.5 flex items-center justify-between text-[11px] font-mono select-none">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400 font-bold uppercase text-[10px]">COS KERNEL 3.0</span>
        </div>
        
        <span className="text-slate-700">|</span>

        {/* Kernel State */}
        <div className="flex items-center space-x-1.5">
          <span className={`w-2 h-2 rounded-full ${getKernelColor(kernelTelemetry.state)}`} />
          <span className="text-slate-200 font-bold text-[10px]">
            {kernelTelemetry.state}
          </span>
        </div>

        {/* Last Stage */}
        {kernelTelemetry.lastReport && (
          <div className="hidden sm:flex items-center space-x-1 text-[10px] text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/60">
            <Layers className="w-3 h-3 text-indigo-400" />
            <span>STAGE:</span>
            <span className="font-bold">{kernelTelemetry.lastReport.currentStage}</span>
            <span className="text-slate-500 font-normal">({kernelTelemetry.lastReport.executionTimeMs}ms)</span>
          </div>
        )}

        {/* Live Buffer */}
        {engineState.buffer && (
          <div className="flex items-center space-x-1 text-amber-300 text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            <span>Buffer:</span>
            <span className="font-bold">{engineState.buffer}</span>
          </div>
        )}

        {/* Kernel Error */}
        {kernelTelemetry.error && (
          <div className="flex items-center space-x-1 text-rose-400 text-[10px]">
            <AlertTriangle className="w-3 h-3" />
            <span>{kernelTelemetry.error}</span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-3 text-[10px] text-slate-500">
        <span className="hidden md:inline">Executados: <b className="text-slate-300">{kernelTelemetry.commandsExecuted}</b></span>
        <span className="text-slate-700 hidden md:inline">•</span>
        <span>Dialer = Terminal</span>
        <span className="text-slate-700">•</span>
        <span className="text-indigo-400 font-bold">CTRL+K</span>
      </div>
    </div>
  );
};
