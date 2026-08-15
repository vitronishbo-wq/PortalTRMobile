// src/components/hardware/VolumeHud.tsx — HUD de Volume Dinâmico no Ecrã (Camada 43)
// Surge lateralmente ao pressionar os botões de volume físicos

import React from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { VolumeLevel } from '../../engine/hardwareEngine';

interface VolumeHudProps {
  volume: VolumeLevel;
  visible: boolean;
}

export const VolumeHud: React.FC<VolumeHudProps> = ({ volume, visible }) => {
  if (!visible) return null;

  return (
    <div className="absolute top-20 left-3 z-50 animate-in fade-in slide-in-from-left duration-150 pointer-events-none">
      <div className="bg-neutral-900/95 backdrop-blur-md border border-neutral-700/80 rounded-2xl p-2.5 shadow-2xl flex flex-col items-center gap-2 w-10">
        <div className="text-emerald-400">
          {volume === 0 ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : volume < 50 ? (
            <Volume1 className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </div>
        
        {/* Barra Vertical de Nível de Volume (0-100%) */}
        <div className="w-2 h-24 bg-neutral-950 rounded-full overflow-hidden flex flex-col justify-end p-0.5 border border-neutral-800">
          <div 
            className="w-full bg-emerald-500 rounded-full transition-all duration-100"
            style={{ height: `${volume}%` }}
          />
        </div>

        <span className="text-[9px] font-mono font-bold text-neutral-300">
          {volume}%
        </span>
      </div>
    </div>
  );
};
