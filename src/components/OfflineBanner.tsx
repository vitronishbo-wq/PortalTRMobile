import React, { useState } from 'react';
import { WifiOff, Database, RefreshCw, CheckCircle2, Info, HardDrive } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
  cachedEventsCount: number;
  lastCacheTime: number | null;
  onForceRefresh?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  cachedEventsCount,
  lastCacheTime,
  onForceRefresh
}) => {
  const [dismissed, setDismissed] = useState<boolean>(false);

  if (isOnline) {
    return null; // Don't show warning banner when online
  }

  if (dismissed) {
    // Show minimal sticky badge when collapsed
    return (
      <div className="bg-amber-950/90 border-b border-amber-500/40 px-3 py-1.5 text-xs text-amber-200 flex items-center justify-between font-mono z-30 sticky top-[3.5rem] backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
          <span className="font-bold">Modo Offline (Cache Local: {cachedEventsCount} eventos)</span>
        </div>
        <button
          onClick={() => setDismissed(false)}
          className="text-[10px] underline hover:text-white cursor-pointer ml-2"
        >
          Ver detalhes
        </button>
      </div>
    );
  }

  const formattedTime = lastCacheTime
    ? new Date(lastCacheTime).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Recentemente';

  return (
    <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-500/50 text-amber-100 px-4 py-3 text-xs z-30 sticky top-[3.5rem] backdrop-blur-md shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 sm:mt-0">
            <WifiOff className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-amber-300 text-sm">Modo de Cache Offline Ativo</span>
              <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                Sem Conexão
              </span>
            </div>
            <p className="text-slate-300 text-[11px] mt-0.5 leading-snug">
              A visualizar <strong>{cachedEventsCount} eventos</strong> em cache local. Sincronização automática quando restabelecer a internet (Última atualização: {formattedTime}).
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0 pt-1 sm:pt-0">
          {onForceRefresh && (
            <button
              onClick={onForceRefresh}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold text-[11px] flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
              <span>Tentar Reconectar</span>
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono transition-colors cursor-pointer"
          >
            Ocultar
          </button>
        </div>
      </div>
    </div>
  );
};
