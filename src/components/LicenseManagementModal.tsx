import React, { useState } from 'react';
import { Clock, ShieldCheck, CreditCard, Check, X, RefreshCw, Zap, Gift, Award, Sparkles, Database } from 'lucide-react';
import { TrialEngine, LicenseRecord } from '../services/trialEngine';
import { useIdentity } from '../engine/identityEngine';

interface LicenseManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLicenseUpdated?: () => void;
}

export const LicenseManagementModal: React.FC<LicenseManagementModalProps> = ({
  isOpen,
  onClose,
  onLicenseUpdated
}) => {
  const { user: authUser, profile: userProfile } = useIdentity();

  const userId = authUser?.uid || userProfile?.userId || 'usr-public-001';
  const userEmail = authUser?.email || userProfile?.email || 'utilizador@portal.ao';

  const [currentLicense, setCurrentLicense] = useState<LicenseRecord>(() =>
    TrialEngine.getLicense(userId, userEmail)
  );

  const [selectedAction, setSelectedAction] = useState<'+7d' | '+15d' | '+30d' | '+90d' | 'lifetime' | 'reset'>('+30d');
  const [selectedPlan, setSelectedPlan] = useState<'trial' | 'pro' | 'enterprise' | 'founder'>('pro');
  const [voucherCode, setVoucherCode] = useState<string>('');
  const [voucherAppliedMessage, setVoucherAppliedMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  if (!isOpen) return null;

  const evalState = TrialEngine.evaluateState(currentLicense);

  const handleApplyVoucher = () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'PILOTO2026' || code === 'PILOTO30') {
      setSelectedAction('+30d');
      setSelectedPlan('pro');
      setVoucherAppliedMessage('Cupão PILOTO30 aplicado: +30 Dias de acesso Pro gratuito!');
    } else if (code === 'ANGOLA_VIP' || code === 'INVESTOR') {
      setSelectedAction('+90d');
      setSelectedPlan('enterprise');
      setVoucherAppliedMessage('Cupão INVESTOR aplicado: +90 Dias Enterprise!');
    } else if (code === 'FOUNDER' || code === 'ROOT_VIP') {
      setSelectedAction('lifetime');
      setSelectedPlan('founder');
      setVoucherAppliedMessage('Cupão FOUNDER VIP aplicado: Acesso Vitalício Total!');
    } else {
      setVoucherAppliedMessage('Cupão personalizado reconhecido: +15 Dias bónus de avaliação.');
      setSelectedAction('+15d');
    }
  };

  const handleConfirmRenewal = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const reason = voucherAppliedMessage
        ? `Renovação via Cupão (${voucherCode || 'AUTO'}): ${voucherAppliedMessage}`
        : `Renovação direta selecionada no painel (+${selectedAction})`;

      const updated = TrialEngine.modifyLicense(
        userId,
        selectedAction,
        reason,
        userEmail
      );

      // Save plan preferences
      localStorage.setItem('user_profile_plan', `${selectedPlan.toUpperCase()} (${updated.daysLeft}d restantes)`);

      setCurrentLicense(updated);
      setIsProcessing(false);
      setSuccessBanner(`Licença atualizada com sucesso! Novo saldo: ${updated.lifetime ? 'Vitalício' : updated.daysLeft + ' dias'}`);

      if (onLicenseUpdated) {
        onLicenseUpdated();
      }

      // Close after short delay
      setTimeout(() => {
        setSuccessBanner(null);
        onClose();
      }, 1500);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100 font-sans space-y-0">
        
        {/* HEADER DENSE */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-2">
                <span>GESTÃO & RENOVAÇÃO DE LICENÇA</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[8px] font-mono border border-amber-500/30 font-bold">
                  PERSISTÊNCIA FIRESTORE/LOCAL
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Gestão de períodos de teste, planos piloto e renovação de subscrição
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-4 space-y-4 text-xs font-sans max-h-[80vh] overflow-y-auto scrollbar-thin">

          {/* BANNER DE SUCESSO */}
          {successBanner && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 font-bold text-xs flex items-center space-x-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successBanner}</span>
            </div>
          )}

          {/* CARD ESTADO ATUAL */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Estado Atual da Conta</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                evalState.active
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}>
                {evalState.active ? 'Ativo' : 'Expirado'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">Utilizador / E-mail</span>
                <span className="font-mono font-bold text-slate-200 text-[11px] truncate block">{userEmail}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Dias Restantes / Validade</span>
                <span className="font-mono font-black text-amber-400 text-[12px] block">
                  {currentLicense.lifetime ? 'Vitalícia (Ilimitada)' : `${evalState.daysRemaining} Dias Restantes`}
                </span>
              </div>
            </div>
          </div>

          {/* DURAÇÃO / EXTENSÃO DA LICENÇA */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
              1. Selecionar Período de Extensão
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '+7d', label: '+7 Dias', desc: 'Renovação Curta' },
                { id: '+15d', label: '+15 Dias', desc: 'Avaliação Estendida' },
                { id: '+30d', label: '+30 Dias', desc: '1 Mês Piloto' },
                { id: '+90d', label: '+90 Dias', desc: 'Trimestre Corporativo' },
                { id: 'lifetime', label: 'Vitalícia', desc: 'Acesso Ilimitado VIP' },
                { id: 'reset', label: 'Reset (7d)', desc: 'Reiniciar Avaliação' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedAction(opt.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedAction === opt.id
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold block">{opt.label}</span>
                  <span className="text-[9px] font-mono text-slate-500 block">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* NÍVEL DO PLANO */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
              2. Nível de Subscrição (Tier)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'trial', label: 'Trial / Piloto', badge: 'Gratuito' },
                { id: 'pro', label: 'Pro Professional', badge: 'Recomendado' },
                { id: 'enterprise', label: 'Enterprise Cloud', badge: 'Corporativo' },
                { id: 'founder', label: 'Founder VIP Root', badge: 'Acesso Total' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id as any)}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedPlan === p.id
                      ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-bold">{p.label}</span>
                  <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 uppercase">
                    {p.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* VOUCHER / CÓDIGO DE CUPÃO */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <label className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider flex items-center space-x-1">
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span>Inserir Código de Cupão / Voucher de Investidor</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Ex: PILOTO2026, ANGOLA_VIP..."
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500 uppercase"
              />
              <button
                onClick={handleApplyVoucher}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Validar
              </button>
            </div>
            {voucherAppliedMessage && (
              <p className="text-[10px] text-amber-400 font-mono italic">{voucherAppliedMessage}</p>
            )}
          </div>

          {/* BOTAO CONFIRMAÇÃO */}
          <button
            onClick={handleConfirmRenewal}
            disabled={isProcessing}
            className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>CONFIRMAR E RENOVAR LICENÇA AGORA</span>
          </button>
        </div>

        {/* FOOTER */}
        <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-center text-[10px] text-slate-500 font-mono flex items-center justify-between px-4">
          <span className="flex items-center space-x-1">
            <Database className="w-3 h-3 text-emerald-400" />
            <span>Sincronizado via TrialEngine & Firestore</span>
          </span>
          <span>PortalTRMobile Ecosystem v2.0</span>
        </div>

      </div>
    </div>
  );
};
