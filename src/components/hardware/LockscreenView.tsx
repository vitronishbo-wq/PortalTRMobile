// src/components/hardware/LockscreenView.tsx — Lockscreen Nativa do COS 2.0 (Camada 44)
// Mostra exclusivamente: Hora, Data, Notificações, Estado da Bateria e Conectividade

import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Battery, Wifi, Bell, Shield, ChevronUp } from 'lucide-react';
import { HardwareEngine } from '../../engine/hardwareEngine';

interface LockscreenViewProps {
  batteryLevel?: number;
  isOnline?: boolean;
  unreadNotifsCount?: number;
}

export const LockscreenView: React.FC<LockscreenViewProps> = ({
  batteryLevel = 98,
  isOnline = true,
  unreadNotifsCount = 0
}) => {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }));
      const dateStr = now.toLocaleDateString('pt-PT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
      setDate(dateStr.charAt(0).toUpperCase() + dateStr.slice(1));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      onClick={() => HardwareEngine.unlockScreen()}
      className="absolute inset-0 z-40 bg-gradient-to-b from-neutral-950 via-neutral-900 to-black text-white flex flex-col justify-between p-6 select-none cursor-pointer animate-in fade-in duration-200"
    >
      {/* Top Status Bar da Lockscreen */}
      <div className="flex items-center justify-between text-neutral-400 text-xs font-mono pt-2">
        <div className="flex items-center gap-1.5 text-[11px]">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-bold tracking-wider text-neutral-300">COS SECURE</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <span className="text-neutral-500">Offline</span>}
          <div className="flex items-center gap-1">
            <Battery className="w-4 h-4 text-emerald-400" />
            <span>{batteryLevel}%</span>
          </div>
        </div>
      </div>

      {/* Centro: Relógio & Data Minimalistas */}
      <div className="text-center my-auto space-y-2">
        <div className="inline-flex p-2 rounded-full bg-neutral-800/60 border border-neutral-700/60 text-emerald-400 mb-2">
          <Lock className="w-5 h-5" />
        </div>
        <h1 className="text-5xl sm:text-6xl font-light tracking-tight font-mono text-neutral-100">
          {time || '--:--'}
        </h1>
        <p className="text-sm font-medium text-neutral-400">
          {date}
        </p>

        {/* Notificações Resumidas */}
        {unreadNotifsCount > 0 && (
          <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-800/80 border border-neutral-700 text-xs text-neutral-200">
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>{unreadNotifsCount} notificação(ões) pendente(s)</span>
          </div>
        )}
      </div>

      {/* Rodapé: Ação de Desbloqueio */}
      <div className="text-center pb-4 flex flex-col items-center gap-1 text-neutral-400 animate-pulse">
        <ChevronUp className="w-5 h-5 text-neutral-500" />
        <span className="text-xs font-medium tracking-wide">
          Toque no ecrã para desbloquear
        </span>
      </div>
    </div>
  );
};
