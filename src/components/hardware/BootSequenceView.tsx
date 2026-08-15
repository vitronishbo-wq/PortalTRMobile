// src/components/hardware/BootSequenceView.tsx — Sequência de Arranque COS 2.0 (Camada 46)
// Animação de inicialização do sistema operativo

import React from 'react';
import { Cpu, CheckCircle2 } from 'lucide-react';

interface BootSequenceViewProps {
  progress: number;
  stage: string;
}

export const BootSequenceView: React.FC<BootSequenceViewProps> = ({ progress, stage }) => {
  return (
    <div className="absolute inset-0 z-50 bg-black text-neutral-100 flex flex-col items-center justify-between p-8 select-none font-mono animate-in fade-in duration-100">
      <div className="w-full text-right text-[10px] text-neutral-500">
        BOOTLOADER v2.4-UEFI
      </div>

      {/* Centro: Logo e Nome do Sistema */}
      <div className="text-center space-y-4 my-auto">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-700/80 mx-auto flex items-center justify-center text-emerald-400 shadow-xl relative">
          <Cpu className="w-8 h-8 animate-pulse" />
          <div className="absolute -inset-1 rounded-2xl bg-emerald-500/10 blur-sm pointer-events-none" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-widest text-white uppercase">
            VITRONIS COS
          </h2>
          <p className="text-[11px] text-neutral-400 tracking-wider">
            Communication Operating System
          </p>
        </div>

        {/* Estágio Atual de Inicialização */}
        <div className="pt-4 space-y-2 max-w-xs mx-auto">
          <div className="flex items-center justify-between text-[10px] text-neutral-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              {stage}
            </span>
            <span className="text-emerald-400 font-bold">{progress}%</span>
          </div>

          {/* Barra de Progresso */}
          <div className="w-48 h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="text-center text-[10px] text-neutral-600">
        Secure Boot • Root of Trust Verified
      </div>
    </div>
  );
};
