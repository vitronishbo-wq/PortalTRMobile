import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, ShieldCheck, Camera, Check, X, Sparkles, CreditCard, RefreshCw, Zap, Gauge, WifiOff, AlertTriangle } from 'lucide-react';
import { useIdentity } from '../engine/identityEngine';
import { TrialEngine } from '../services/trialEngine';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user: authUser, profile: userProfile } = useIdentity();

  // Load from local storage or fallback defaults
  const [name, setName] = useState<string>(() => {
    return localStorage.getItem('user_profile_name') || userProfile?.displayName || authUser?.displayName || 'Sila Janeiro';
  });

  const [email, setEmail] = useState<string>(() => {
    return localStorage.getItem('user_profile_email') || userProfile?.email || authUser?.email || 'silajaneiro9@gmail.com';
  });

  const [targetPhone, setTargetPhone] = useState<string>(() => {
    return localStorage.getItem('user_profile_target_phone') || '+244 912 345 678';
  });

  const [accountPlan, setAccountPlan] = useState<string>(() => {
    return localStorage.getItem('user_profile_plan') || 'Premium (Ativo - 7 Dias Restantes)';
  });

  const [avatarIndex, setAvatarIndex] = useState<number>(() => {
    return parseInt(localStorage.getItem('user_profile_avatar') || '0', 10);
  });

  const [syncMode, setSyncMode] = useState<'realtime' | 'economic'>(() => {
    return (localStorage.getItem('user_profile_sync_mode') as 'realtime' | 'economic') || 'realtime';
  });

  const [role, setRole] = useState<string>(() => {
    return localStorage.getItem('user_profile_role') || userProfile?.role || 'dev_client';
  });

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Preset profile choices corresponding to each avatar photo
  const profilePresets = [
    {
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      name: 'Cliente Dev (Tempo Real)',
      email: 'dev.client@vitronis.co.ao',
      targetPhone: '+244 999 000 777',
      accountPlan: 'Cliente Dev (Acesso Total Tempo Real)',
      role: 'dev_client'
    },
    {
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      name: 'Sila Janeiro',
      email: 'silajaneiro9@gmail.com',
      targetPhone: '+244 912 345 678',
      accountPlan: 'Premium (Ativo - 7 Dias Restantes)',
      role: 'founder'
    },
    {
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      name: 'Carlos Mendoza',
      email: 'carlos.mendoza@portal.ao',
      targetPhone: '+244 923 112 400',
      accountPlan: 'Enterprise (Ativo - Licença Vitalícia)',
      role: 'admin'
    },
    {
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      name: 'Ana Sofia Silva',
      email: 'ana.silva@telecom.co.ao',
      targetPhone: '+244 945 889 201',
      accountPlan: 'Pro (Ativo - 30 Dias Restantes)',
      role: 'user'
    }
  ];

  const handleSelectAvatarPreset = (idx: number) => {
    setAvatarIndex(idx);
    const selected = profilePresets[idx];
    if (selected) {
      setName(selected.name);
      setEmail(selected.email);
      setTargetPhone(selected.targetPhone);
      setAccountPlan(selected.accountPlan);
      if (selected.role) {
        setRole(selected.role);
      }
    }
  };

  if (!isOpen) return null;

  const userId = authUser?.uid || 'usr-public-001';
  const license = TrialEngine.getLicense(userId, email);
  const evalState = TrialEngine.evaluateState(license);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    localStorage.setItem('user_profile_name', name);
    localStorage.setItem('user_profile_email', email);
    localStorage.setItem('user_profile_target_phone', targetPhone);
    localStorage.setItem('user_profile_plan', accountPlan);
    localStorage.setItem('user_profile_avatar', avatarIndex.toString());
    localStorage.setItem('user_profile_sync_mode', syncMode);
    localStorage.setItem('user_profile_role', role);

    // Dispatch event so components can update immediately
    window.dispatchEvent(new CustomEvent('user-profile-updated', {
      detail: { name, email, targetPhone, accountPlan, syncMode, role, avatar: profilePresets[avatarIndex]?.avatar }
    }));

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-slate-100 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Perfil do Utilizador</h3>
              <p className="text-xs text-slate-400">Gestão da Conta e Dispositivo Alvo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <p className="font-bold text-amber-400 text-sm">Perfil guardado com sucesso!</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Avatar Selector */}
            <div className="space-y-2 text-center">
              <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                Foto de Perfil & Seleção de Perfil
              </label>
              <div className="flex items-center justify-center space-x-3 pt-1">
                {profilePresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectAvatarPreset(idx)}
                    title={`Carregar perfil de ${preset.name}`}
                    className={`relative rounded-full overflow-hidden w-12 h-12 border-2 transition-all cursor-pointer ${
                      avatarIndex === idx
                        ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-105'
                        : 'border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={preset.avatar} alt={preset.name} className="w-full h-full object-cover" />
                    {avatarIndex === idx && (
                      <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Nome */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Nome</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Nome do utilizador"
              />
            </div>

            {/* Telefone Alvo */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Telefone Alvo</span>
              </label>
              <input
                type="text"
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors font-mono"
                placeholder="+244 9XX XXX XXX"
              />
              <p className="text-[10px] text-slate-500">Número de telefone emparelhado para receção de eventos.</p>
            </div>

            {/* E-mail */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>E-mail</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="exemplo@email.com"
              />
            </div>

            {/* Modo de Sincronização & Otimização de Dados Móveis */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Modo de Sincronização</span>
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  syncMode === 'realtime'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  {syncMode === 'realtime' ? 'Tempo Real' : 'Econômico (60s)'}
                </span>
              </label>

              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSyncMode('realtime')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                    syncMode === 'realtime'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tempo Real</span>
                  </div>
                  <span className="text-[9.5px] text-slate-400 font-normal text-center">
                    Listeners Firestore
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSyncMode('economic')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                    syncMode === 'economic'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Econômica</span>
                  </div>
                  <span className="text-[9.5px] text-slate-400 font-normal text-center">
                    Poupa Dados Móveis
                  </span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                {syncMode === 'realtime'
                  ? '⚡ Firestore onSnapshot ativo: atualizações instantâneas de notificações.'
                  : '🍃 Sincronização por intervalos maiores (60s) para otimizar consumo de bateria e dados móveis.'}
              </p>
            </div>

            {/* Estado Global da Subscrição da Conta */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                  <span>Estado Global da Subscrição</span>
                </span>
                {!evalState.active ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500 text-white font-black uppercase animate-pulse">
                    Subscrição Expirada
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                    {license.lifetime ? 'Vitalícia' : `${evalState.daysRemaining}d Restantes`}
                  </span>
                )}
              </label>

              {!evalState.active ? (
                <div className="bg-rose-950/60 border border-rose-500/80 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-black text-white">Subscrição expirada</h5>
                      <p className="text-[10px] text-rose-200 leading-tight">
                        A sua licença expirou. Renove sua subscrição para reativar o acesso total.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = TrialEngine.modifyLicense(userId, '+30d', 'Renovação Efetuada no Perfil');
                      setAccountPlan(`Premium (Ativo - ${updated.daysLeft} Dias Restantes)`);
                    }}
                    className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md uppercase tracking-wider flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Renove sua subscrição</span>
                  </button>
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-400 block uppercase">{license.plan || 'Premium'}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {license.lifetime ? 'Licença Vitalícia' : `Ativo (${evalState.daysRemaining} dias restantes)`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      TrialEngine.modifyLicense(userId, '+30d', 'Renovação +30d');
                      setAccountPlan('Premium (Ativo - 30 Dias Restantes)');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold flex items-center space-x-1 cursor-pointer transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Renovar</span>
                  </button>
                </div>
              )}
            </div>

              {/* Quick Dev Client Switcher */}
              <div className="bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/30 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-extrabold text-white">Modo Usuário Cliente Dev</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRole('dev_client');
                      setName('Dev Client (Tempo Real)');
                      setEmail('dev.client@vitronis.co.ao');
                      setAccountPlan('Cliente Dev (Acesso Total Tempo Real)');
                      setSyncMode('realtime');
                    }}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                      role === 'dev_client'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-amber-400 border border-amber-500/40 hover:bg-slate-700'
                    }`}
                  >
                    {role === 'dev_client' ? '⚡ CLIENTE DEV ATIVO' : 'ATIVAR MODO CLIENTE DEV'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Ativa o acesso instantâneo a eventos, comandos outbound, E2EE e barra de stream SSE em tempo real.
                </p>
              </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Alterações</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
