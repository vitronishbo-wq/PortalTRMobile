import React, { useEffect, useState } from 'react';
import { updateEngine, UpdateState } from '../engine/updateEngine';
import { RefreshCw, Zap, X, ShieldCheck, AlertCircle } from 'lucide-react';

export const SystemKernelUpdateBanner: React.FC = () => {
  const [updateState, setUpdateState] = useState<UpdateState>(() => updateEngine.getState());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    updateEngine.init();
    const unsubscribe = updateEngine.subscribe((state) => {
      setUpdateState(state);
      if (state.status === 'update-available') {
        setDismissed(false);
      }
    });

    const handleGlobalUpdateEvent = (e: Event) => {
      const customEvent = e as CustomEvent<UpdateState>;
      if (customEvent.detail) {
        setUpdateState(customEvent.detail);
        setDismissed(false);
      }
    };

    window.addEventListener('pwa-update-available', handleGlobalUpdateEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('pwa-update-available', handleGlobalUpdateEvent);
    };
  }, []);

  if (dismissed || (updateState.status !== 'update-available' && updateState.status !== 'updating')) {
    return null;
  }

  const isUpdating = updateState.status === 'updating';

  return (
    <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-indigo-600 text-slate-950 px-4 py-2.5 shadow-2xl border-b border-amber-400/40 animate-in slide-in-from-top duration-300 relative z-50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        
        <div className="flex items-center space-x-2.5 font-bold">
          <div className="p-1.5 rounded-lg bg-slate-950/10 backdrop-blur-md text-slate-950 shrink-0">
            <Zap className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <span className="font-black uppercase tracking-wider text-[11px] block">
              Kernel PWA Update Available • {updateState.detectedVersion || 'Nova Versão Encontrada'}
            </span>
            <span className="text-[10px] text-slate-900 font-medium block">
              Novo bundle compilado pronto para aplicação sem perda de dados de sessão.
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => updateEngine.forceSystemUpdate()}
            disabled={isUpdating}
            className={`px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center space-x-1.5 border ${
              isUpdating
                ? 'bg-slate-900 text-amber-400 border-amber-500/30'
                : 'bg-slate-950 text-amber-400 hover:bg-slate-900 hover:text-amber-300 border-slate-900 active:scale-95'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isUpdating ? 'A Aplicar Update...' : 'Atualizar Agora'}</span>
          </button>

          {!isUpdating && (
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 rounded-lg text-slate-950/70 hover:text-slate-950 hover:bg-slate-950/10 transition-colors cursor-pointer"
              title="Dispensar Notificação"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
