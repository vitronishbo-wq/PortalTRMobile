// src/components/hardware/PowerMenuModal.tsx — Diálogo Nativo de Energia no Ecrã (Camada 45)
// Opções: Reiniciar, Desligar, Bloqueio de Emergência (*111#) e Cancelar

import React from 'react';
import { RotateCw, Power, ShieldAlert, X } from 'lucide-react';
import { HardwareEngine } from '../../engine/hardwareEngine';

interface PowerMenuModalProps {
  isOpen: boolean;
}

export const PowerMenuModal: React.FC<PowerMenuModalProps> = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-150">
      {/* Header do Menu de Energia */}
      <div className="text-center mb-6 space-y-1">
        <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
          COS Hardware Power Control
        </span>
        <h3 className="text-sm font-bold text-white uppercase">
          Opções de Energia
        </h3>
      </div>

      {/* Grid das Ações de Energia */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-xs mb-8">
        {/* Reiniciar */}
        <button
          onClick={() => HardwareEngine.reboot()}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-emerald-400 hover:border-emerald-500 transition-all cursor-pointer group active:scale-95"
          title="Reiniciar o Sistema COS"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-black transition-all mb-2">
            <RotateCw className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-neutral-200">Reiniciar</span>
        </button>

        {/* Desligar */}
        <button
          onClick={() => HardwareEngine.powerOff()}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-rose-400 hover:border-rose-500 transition-all cursor-pointer group active:scale-95"
          title="Desligar Dispositivo"
        >
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/30 group-hover:bg-rose-500 group-hover:text-black transition-all mb-2">
            <Power className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-neutral-200">Desligar</span>
        </button>

        {/* Bloqueio de Emergência SOS */}
        <button
          onClick={() => HardwareEngine.triggerEmergencyLockdown()}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-amber-400 hover:border-amber-500 transition-all cursor-pointer group active:scale-95"
          title="Bloqueio de Emergência (*111#)"
        >
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-black transition-all mb-2">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-neutral-200">SOS *111#</span>
        </button>
      </div>

      {/* Botão Cancelar */}
      <button
        onClick={() => HardwareEngine.closePowerMenu()}
        className="px-6 py-2 rounded-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
        <span>Cancelar</span>
      </button>
    </div>
  );
};
