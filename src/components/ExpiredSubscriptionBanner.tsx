import React from 'react';
import { AlertTriangle, CreditCard, ArrowRight, ShieldAlert } from 'lucide-react';
import { useIdentity } from '../engine/identityEngine';
import { TrialEngine } from '../services/trialEngine';

interface ExpiredSubscriptionBannerProps {
  onNavigateToBilling: () => void;
}

export const ExpiredSubscriptionBanner: React.FC<ExpiredSubscriptionBannerProps> = ({
  onNavigateToBilling
}) => {
  const { user: authUser, profile: userProfile } = useIdentity();

  const userId = authUser?.uid || userProfile?.userId || 'usr-public-001';
  const userEmail = authUser?.email || userProfile?.email || 'utilizador@portal.ao';

  const license = TrialEngine.getLicense(userId, userEmail);
  const evalState = TrialEngine.evaluateState(license);

  const isInactiveProfile = userProfile?.accountState === 'inactive';
  const isExpired = !evalState.active || isInactiveProfile;

  if (!isExpired) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-rose-950 via-slate-950 to-rose-950 border-b-2 border-rose-500/80 text-rose-100 px-4 py-2.5 text-xs z-40 sticky top-0 shadow-2xl shadow-rose-950/80 backdrop-blur-md animate-fadeIn">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shrink-0 animate-pulse">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className="font-black text-rose-200 text-xs tracking-wide uppercase flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Subscrição Expirada</span>
              </span>
              <span className="bg-rose-500 text-white font-mono font-black text-[9px] px-2 py-0.2 rounded-full uppercase tracking-wider shadow">
                Inativo
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-tight">
              O período de utilização da sua conta expirou. Renove a subscrição para reativar o acesso total e a sincronização em tempo real.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0">
          <button
            onClick={onNavigateToBilling}
            className="w-full sm:w-auto px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all transform active:scale-95 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Renovar</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
