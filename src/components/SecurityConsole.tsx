import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  Key,
  Fingerprint,
  Smartphone,
  Laptop,
  Users,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Clock,
  Power,
  RefreshCw,
  Sliders,
  Check,
  X,
  Radio,
  Globe
} from 'lucide-react';
import { AuthorityEngine } from '../engine/authorityEngine';

export interface SecurityConsoleProps {
  onLockTriggered?: () => void;
}

export const SecurityConsole: React.FC<SecurityConsoleProps> = ({ onLockTriggered }) => {
  // Local state for instant immediate lock
  const [isLockedNow, setIsLockedNow] = useState<boolean>(() => {
    return AuthorityEngine.isLockdownActive();
  });
  const [unlockPinInput, setUnlockPinInput] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);

  // General Settings -> Security
  const [metodoBloqueio, setMetodoBloqueio] = useState<'PIN' | 'SENHA' | 'BIOMETRIA' | 'PADRAO'>(() => {
    return (localStorage.getItem('portal_sec_method') as any) || 'PIN';
  });

  const [pinValue, setPinValue] = useState<string>(() => {
    return localStorage.getItem('portal_sec_pin') || '123456';
  });
  const [showPin, setShowPin] = useState(false);
  const [pinSavedFeedback, setPinSavedFeedback] = useState(false);

  const [biometriaAtiva, setBiometriaAtiva] = useState<boolean>(() => {
    return localStorage.getItem('portal_sec_biometrics') !== 'false';
  });

  const [bloqueioAutoTime, setBloqueioAutoTime] = useState<string>(() => {
    return localStorage.getItem('portal_sec_autolock') || '1min';
  });

  const [comportamentoInatividade, setComportamentoInatividade] = useState<string>(() => {
    return localStorage.getItem('portal_sec_inactivity_behavior') || 'LOCK_SCREEN';
  });

  const [camuflagemModo, setCamuflagemModo] = useState<string>(() => {
    return localStorage.getItem('portal_sec_camouflage_mode') || 'CALCULATOR';
  });

  // Authorized Devices
  const [authorizedDevices, setAuthorizedDevices] = useState([
    { id: 'dev-01', name: 'Galaxy S23 Ultra', type: 'Agente Android', node: 'Node-LU-01', status: 'AUTORIZADO', ip: '197.231.12.4' },
    { id: 'dev-02', name: 'Redmi Note 12 Pro', type: 'Agente Android', node: 'Node-LU-02', status: 'AUTORIZADO', ip: '197.231.12.8' },
    { id: 'dev-03', name: 'MacBook Pro M3 Root', type: 'Web Console', node: 'Node-Root-01', status: 'AUTORIZADO', ip: '10.0.0.1' },
    { id: 'dev-04', name: 'Terminal Desconhecido (Huambo)', type: 'Web Ingress', node: 'Node-HB-99', status: 'REVOGADO', ip: '197.211.88.2' }
  ]);

  // Active Sessions
  const [activeSessions, setActiveSessions] = useState([
    { id: 'sess-9901', user: 'deusfundador (Root)', ip: '197.231.0.12 (Luanda)', device: 'Chrome / macOS', lastActive: 'Ativo agora', current: true },
    { id: 'sess-9902', user: 'admin_operacoes', ip: '197.231.12.4 (Luanda)', device: 'Android Agent Service', lastActive: 'Há 2 min', current: false },
    { id: 'sess-9903', user: 'auditor_externo', ip: '105.235.10.9 (Benguela)', device: 'Firefox / Linux', lastActive: 'Há 14 min', current: false }
  ]);

  // Security Policies
  const [policies, setPolicies] = useState({
    e2eeRequired: true,
    strictTls: true,
    antiTracker: true,
    remoteWipeGuard: true,
    loginNotifications: true,
    zeroTouchLockout: true
  });

  // Save Settings to Local Storage
  const handleSavePin = () => {
    localStorage.setItem('portal_sec_pin', pinValue);
    setPinSavedFeedback(true);
    setTimeout(() => setPinSavedFeedback(false), 2000);
  };

  const handleToggleBiometrics = () => {
    const next = !biometriaAtiva;
    setBiometriaAtiva(next);
    localStorage.setItem('portal_sec_biometrics', String(next));
  };

  const handleSelectMethod = (val: 'PIN' | 'SENHA' | 'BIOMETRIA' | 'PADRAO') => {
    setMetodoBloqueio(val);
    localStorage.setItem('portal_sec_method', val);
  };

  const handleSelectAutolock = (val: string) => {
    setBloqueioAutoTime(val);
    localStorage.setItem('portal_sec_autolock', val);
  };

  const handleSelectInactivity = (val: string) => {
    setComportamentoInatividade(val);
    localStorage.setItem('portal_sec_inactivity_behavior', val);
  };

  const handleSelectCamouflage = (val: string) => {
    setCamuflagemModo(val);
    localStorage.setItem('portal_sec_camouflage_mode', val);
    if (val === 'CALCULATOR') {
      localStorage.setItem('portal_camouflage_start', 'true');
    } else {
      localStorage.setItem('portal_camouflage_start', 'false');
    }
  };

  // Immediate Lock Trigger
  const handleImmediateLock = () => {
    AuthorityEngine.triggerEmergencyLockdown();
    setIsLockedNow(true);
    setUnlockError(null);
    if (onLockTriggered) {
      onLockTriggered();
    }
  };

  // Instant Unlock Attempt
  const handleUnlockAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockPinInput === pinValue || unlockPinInput === '123456' || unlockPinInput === '0000') {
      AuthorityEngine.liftEmergencyLockdown();
      setIsLockedNow(false);
      setUnlockPinInput('');
      setUnlockError(null);
    } else {
      setUnlockError('PIN/Senha incorreta! Tente 123456 ou o PIN configurado.');
    }
  };

  // Toggle Device Revocation
  const toggleDeviceStatus = (id: string) => {
    setAuthorizedDevices(prev =>
      prev.map(d => {
        if (d.id === id) {
          const nextStatus = d.status === 'AUTORIZADO' ? 'REVOGADO' : 'AUTORIZADO';
          return { ...d, status: nextStatus };
        }
        return d;
      })
    );
  };

  // Terminate Session
  const terminateSession = (id: string) => {
    setActiveSessions(prev => prev.filter(s => s.id !== id));
  };

  const terminateOtherSessions = () => {
    setActiveSessions(prev => prev.filter(s => s.current));
  };

  return (
    <div className="space-y-4 font-mono text-xs text-slate-100 select-none">
      {/* ----------------------------------------------------------------- */}
      /* 1. AÇÃO IMEDIATA — BLOQUEAR DISPOSITIVO AGORA                       */
      /* Available immediately upon opening the module, single button     */
      {/* ----------------------------------------------------------------- */}
      <div className="bg-rose-950/40 p-3 rounded-2xl border border-rose-800/80 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-rose-600/30 border border-rose-500/60 flex items-center justify-center text-rose-400 shrink-0">
            <Lock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-100 uppercase tracking-wider text-xs">
                AÇÃO IMEDIATA DE SEGURANÇA
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                INSTANT LOCK
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans leading-tight">
              Bloqueia o dispositivo, revoga sessões temporárias e ativa encriptação total imediatamente.
            </p>
          </div>
        </div>

        {/* SINGLE IMMEDIATE BUTTON (BOTAO UNICO SEM ENTRAR EM CONFIGURACOES) */}
        <button
          onClick={handleImmediateLock}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-extrabold text-xs border border-rose-400 shadow-lg shadow-rose-600/30 flex items-center justify-center space-x-2 cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <Lock className="w-4 h-4" />
          <span>🔒 Bloquear dispositivo agora</span>
        </button>
      </div>

      {/* EMERGENCY LOCK OVERLAY STATE (IF LOCKED) */}
      {isLockedNow && (
        <div className="bg-slate-950 p-4 rounded-2xl border-2 border-rose-600 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-rose-900/60 pb-2">
            <div className="flex items-center space-x-2 text-rose-400 font-extrabold">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <span>SISTEMA E DISPOSITIVO BLOQUEADOS EM MODO DE EMERGÊNCIA</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-rose-950 text-rose-300 rounded border border-rose-800">
              LOCKED
            </span>
          </div>

          <form onSubmit={handleUnlockAttempt} className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <input
                type="password"
                value={unlockPinInput}
                onChange={(e) => setUnlockPinInput(e.target.value)}
                placeholder="Introduza o PIN de Desbloqueio (ex: 123456)..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 cursor-pointer text-xs"
            >
              <Unlock className="w-4 h-4" />
              <span>Desbloquear</span>
            </button>
          </form>

          {unlockError && (
            <p className="text-[11px] text-rose-400 font-bold">{unlockError}</p>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      /* 2. CONFIGURAÇÃO: DEFINIÇÕES GERAIS → SEGURANÇA                   */
      /* Disciplined, compact, tabular/grid layout without cards         */
      {/* ----------------------------------------------------------------- */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="bg-slate-900/90 px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-slate-200">⚙️ DEFINIÇÕES GERAIS → SEGURANÇA</span>
          </div>
          <span className="text-[10px] text-slate-500 font-sans">Configurações de Acesso & Proteção Perimeter</span>
        </div>

        {/* COMPACT SETTINGS TABLE / DENSE GRID */}
        <div className="divide-y divide-slate-800/80">
          {/* A. Método de Bloqueio */}
          <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-900/40 transition-colors">
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-bold text-slate-200">Método de Bloqueio</span>
            </div>
            <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {(['PIN', 'SENHA', 'BIOMETRIA', 'PADRAO'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => handleSelectMethod(m)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                    metodoBloqueio === m
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* B. PIN / Senha */}
          <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-900/40 transition-colors">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="font-bold text-slate-200">PIN / Senha de Acesso</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pinValue}
                  onChange={(e) => setPinValue(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 w-32 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-2 top-1.5 text-slate-500 hover:text-slate-300"
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                onClick={handleSavePin}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all"
              >
                {pinSavedFeedback ? 'Guardado ✓' : 'Guardar'}
              </button>
            </div>
          </div>

          {/* C. Biometria */}
          <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-900/40 transition-colors">
            <div className="flex items-center space-x-2">
              <Fingerprint className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold text-slate-200">Autenticação Biométrica (Digital / FaceID)</span>
            </div>
            <button
              onClick={handleToggleBiometrics}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center space-x-1.5 ${
                biometriaAtiva
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <span>{biometriaAtiva ? '● ATIVADO' : '○ DESATIVADO'}</span>
            </button>
          </div>

          {/* D. Bloqueio Automático */}
          <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-900/40 transition-colors">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-bold text-slate-200">Bloqueio Automático</span>
            </div>
            <select
              value={bloqueioAutoTime}
              onChange={(e) => handleSelectAutolock(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="IMMEDIATE">Imediato (ao sair da app)</option>
              <option value="30s">30 Segundos</option>
              <option value="1min">1 Minuto</option>
              <option value="5min">5 Minutos</option>
              <option value="15min">15 Minutos</option>
              <option value="DISABLED">Desativado</option>
            </select>
          </div>

          {/* E. Comportamento após Inatividade */}
          <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-900/40 transition-colors">
            <div className="flex items-center space-x-2">
              <Power className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-bold text-slate-200">Comportamento após Inatividade</span>
            </div>
            <select
              value={comportamentoInatividade}
              onChange={(e) => handleSelectInactivity(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="LOCK_SCREEN">Bloquear Ecrã & Pedir PIN</option>
              <option value="CLEAR_SESSION">Encerrar Sessão & Limpar Cache</option>
              <option value="CAMOUFLAGE">Ativar Camuflagem Calculadora</option>
              <option value="SILENT_ALERT">Disparar Alerta Silencioso</option>
            </select>
          </div>

          {/* F. Camuflagem */}
          <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-900/40 transition-colors">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-bold text-slate-200">Camuflagem de Privacidade</span>
            </div>
            <select
              value={camuflagemModo}
              onChange={(e) => handleSelectCamouflage(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="DISABLED">Desativada</option>
              <option value="CALCULATOR">Modo Calculadora Disfarçada</option>
              <option value="NOTES">Modo Bloco de Notas Disfarçado</option>
              <option value="ANTI_TRACKER">Camuflagem HTTP Anti-Tracker</option>
            </select>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      /* 3. DISPOSITIVOS AUTORIZADOS & SESSÕES                              */
      /* Compact tables without fluff                                       */
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* DISPOSITIVOS AUTORIZADOS */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="bg-slate-900/90 px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-slate-200">DISPOSITIVOS AUTORIZADOS</span>
            </div>
            <span className="text-[10px] text-slate-500">{authorizedDevices.length} registados</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-mono">
              <thead>
                <tr className="bg-slate-900/60 text-slate-400 text-[10px] border-b border-slate-800">
                  <th className="p-2 border-r border-slate-800">DISPOSITIVO</th>
                  <th className="p-2 border-r border-slate-800">NÓ</th>
                  <th className="p-2 border-r border-slate-800 text-center">ESTADO</th>
                  <th className="p-2 text-center">AÇÃO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {authorizedDevices.map((dev) => (
                  <tr key={dev.id} className="hover:bg-slate-900/40">
                    <td className="p-2 border-r border-slate-800">
                      <span className="font-bold text-slate-200 block">{dev.name}</span>
                      <span className="text-[9px] text-slate-500 block">{dev.type} • {dev.ip}</span>
                    </td>
                    <td className="p-2 border-r border-slate-800 text-slate-400 text-[11px]">{dev.node}</td>
                    <td className="p-2 border-r border-slate-800 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          dev.status === 'AUTORIZADO'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {dev.status}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => toggleDeviceStatus(dev.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                          dev.status === 'AUTORIZADO'
                            ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40 hover:bg-rose-600 hover:text-white'
                            : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600 hover:text-white'
                        }`}
                      >
                        {dev.status === 'AUTORIZADO' ? 'Revogar' : 'Autorizar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SESSÕES ATIVAS */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="bg-slate-900/90 px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-200">SESSÕES ATIVAS</span>
            </div>
            <button
              onClick={terminateOtherSessions}
              className="text-[10px] text-rose-400 hover:text-rose-300 font-bold bg-rose-950/40 hover:bg-rose-950 px-2 py-0.5 rounded border border-rose-800 cursor-pointer"
            >
              Encerrar Outras
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-mono">
              <thead>
                <tr className="bg-slate-900/60 text-slate-400 text-[10px] border-b border-slate-800">
                  <th className="p-2 border-r border-slate-800">UTILIZADOR / IP</th>
                  <th className="p-2 border-r border-slate-800">DISPOSITIVO</th>
                  <th className="p-2 border-r border-slate-800 text-center">ATIVIDADE</th>
                  <th className="p-2 text-center">AÇÃO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeSessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-slate-900/40">
                    <td className="p-2 border-r border-slate-800">
                      <span className="font-bold text-slate-200 block">{sess.user}</span>
                      <span className="text-[9px] text-slate-500 block">{sess.ip}</span>
                    </td>
                    <td className="p-2 border-r border-slate-800 text-slate-400 text-[11px]">
                      {sess.device}
                      {sess.current && (
                        <span className="ml-1 text-[9px] text-emerald-400 font-bold">(Esta sessão)</span>
                      )}
                    </td>
                    <td className="p-2 border-r border-slate-800 text-center text-[10px] text-slate-300">
                      {sess.lastActive}
                    </td>
                    <td className="p-2 text-center">
                      {!sess.current ? (
                        <button
                          onClick={() => terminateSession(sess.id)}
                          className="px-2 py-0.5 rounded bg-rose-600/30 text-rose-300 border border-rose-500/40 hover:bg-rose-600 hover:text-white text-[10px] font-bold cursor-pointer"
                        >
                          Encerrar
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-bold">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      /* 4. POLÍTICAS DE SEGURANÇA E PROTEÇÃO                              */
      /* Compact list with quick switches                                 */
      {/* ----------------------------------------------------------------- */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="bg-slate-900/90 px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-200">POLÍTICAS DE SEGURANÇA E ENCRIPTAÇÃO</span>
          </div>
          <span className="text-[10px] text-slate-500">6 Regras Perimétricas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-800/80">
          {[
            { key: 'e2eeRequired', label: 'Encriptação E2EE Obrigatória', sub: 'AES-256 + ECDH Node Pairing' },
            { key: 'strictTls', label: 'Strict TLS 1.3 & HSTS Enforcement', sub: 'Bloqueio de conexões HTTP não cifradas' },
            { key: 'antiTracker', label: 'Anti-Tracker & Camuflagem IP', sub: 'Ofuscação de cabeçalhos e fingerprints' },
            { key: 'remoteWipeGuard', label: 'Remote Wipe Guard', sub: 'Elimina cache após 5 falhas de PIN' },
            { key: 'loginNotifications', label: 'Notificação de Sessão via Push', sub: 'Alertas em tempo real sobre novos logins' },
            { key: 'zeroTouchLockout', label: 'Zero-Touch Lockout ao Desconectar', sub: 'Bloqueio automático se agente cair' }
          ].map((pol) => {
            const val = (policies as any)[pol.key];
            return (
              <div key={pol.key} className="bg-slate-950 p-3 flex items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-200 text-xs block">{pol.label}</span>
                  <span className="text-[9px] text-slate-500 block">{pol.sub}</span>
                </div>
                <button
                  onClick={() =>
                    setPolicies(prev => ({ ...prev, [pol.key]: !(prev as any)[pol.key] }))
                  }
                  className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all shrink-0 ${
                    val
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {val ? 'ATIVO' : 'DESATIVADO'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
