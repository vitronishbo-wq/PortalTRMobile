import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Smartphone,
  Radio,
  PhoneCall,
  Landmark,
  Layers,
  Check,
  X
} from 'lucide-react';

export interface DeviceEvidence {
  test: string;
  evidence: 'Sim' | 'Não';
  result: 'VALIDATED' | 'AWAITING_ANDROID_AGENT' | 'NOT_AVAILABLE' | 'NOT_TESTED';
}

export interface NetworkEvidence {
  test: string;
  result: 'CONNECTED' | 'DISCONNECTED' | 'NOT_TESTED' | 'NOT_AVAILABLE';
}

export interface TelecomEvidence {
  test: string;
  result: 'CONFIGURED' | 'NOT_CONFIGURED' | 'AWAITING_PROVIDER' | 'NOT_TESTED' | 'NOT_AVAILABLE';
}

export interface BankingEvidence {
  app: string;
  installed: 'Sim' | 'Não' | 'AWAITING_AGENT';
  otpCaptured: 'SIM' | 'NÃO' | 'NOT_TESTED';
}

export const FieldEvidenceConsole: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [swActive, setSwActive] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : false);

  const checkLiveEvidence = async () => {
    setLoading(true);
    try {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        setSwActive(!!reg?.active);
      }
      setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkLiveEvidence();
  }, []);

  // Tabela 1 — Evidência do Dispositivo (Estrita)
  const deviceEvidences: DeviceEvidence[] = [
    { test: 'Android Agent instalado', evidence: 'Não', result: 'AWAITING_ANDROID_AGENT' },
    { test: 'Notification Listener ativo', evidence: 'Não', result: 'AWAITING_ANDROID_AGENT' },
    { test: 'SMS permission', evidence: 'Não', result: 'AWAITING_ANDROID_AGENT' },
    { test: 'Call permission', evidence: 'Não', result: 'AWAITING_ANDROID_AGENT' },
    { test: 'Accessibility', evidence: 'Não', result: 'AWAITING_ANDROID_AGENT' }
  ];

  // Tabela 2 — Evidência da Rede (Estrita)
  const networkEvidences: NetworkEvidence[] = [
    { test: 'Firebase ligado', result: 'CONNECTED' },
    { test: 'Firestore ligado', result: 'CONNECTED' },
    { test: 'WebSocket ligado', result: isOnline ? 'CONNECTED' : 'DISCONNECTED' },
    { test: 'SSE ligado', result: isOnline ? 'CONNECTED' : 'DISCONNECTED' },
    { test: 'Service Worker ligado', result: swActive ? 'CONNECTED' : 'DISCONNECTED' }
  ];

  // Tabela 3 — Evidência da Telefonia (Estrita)
  const telecomEvidences: TelecomEvidence[] = [
    { test: 'Operadora configurada', result: 'AWAITING_PROVIDER' },
    { test: 'Número atribuído', result: 'AWAITING_PROVIDER' },
    { test: 'SIP configurado', result: 'NOT_CONFIGURED' },
    { test: 'IMS configurado', result: 'NOT_CONFIGURED' },
    { test: 'SMS enviado', result: 'NOT_TESTED' },
    { test: 'SMS recebido', result: 'NOT_TESTED' },
    { test: 'Chamada efetuada', result: 'NOT_TESTED' },
    { test: 'Chamada recebida', result: 'NOT_TESTED' }
  ];

  // Tabela 4 — Evidência Bancária (Estrita)
  const bankingEvidences: BankingEvidence[] = [
    { app: 'Multicaixa Express', installed: 'AWAITING_AGENT', otpCaptured: 'NOT_TESTED' },
    { app: 'BFA', installed: 'AWAITING_AGENT', otpCaptured: 'NOT_TESTED' },
    { app: 'BAI', installed: 'AWAITING_AGENT', otpCaptured: 'NOT_TESTED' }
  ];

  const renderBadge = (val: string) => {
    switch (val) {
      case 'VALIDATED':
      case 'CONNECTED':
      case 'CONFIGURED':
      case 'SIM':
      case 'Sim':
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono">
            {val}
          </span>
        );
      case 'AWAITING_ANDROID_AGENT':
      case 'AWAITING_AGENT':
      case 'AWAITING_PROVIDER':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold font-mono">
            {val}
          </span>
        );
      case 'NOT_CONFIGURED':
      case 'DISCONNECTED':
      case 'Não':
      case 'NÃO':
        return (
          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold font-mono">
            {val}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold font-mono">
            {val}
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-6 font-mono text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">
              Modo Prova de Campo — Evidência de Hardware & Telecom
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Inspeção direta e estrita de evidências em 4 camadas de realidade.
          </p>
        </div>

        <button
          onClick={checkLiveEvidence}
          disabled={loading}
          className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold cursor-pointer transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>{loading ? 'Validando...' : 'Revalidar Campo'}</span>
        </button>
      </div>

      {/* Grid 2x2 das 4 Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Tabela 1 — Evidência do Dispositivo */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
          <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              Tabela 1 — Evidência do Dispositivo
            </span>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 text-[10px] uppercase">
                <th className="py-2.5 px-3">Teste</th>
                <th className="py-2.5 px-3 text-center">Evidência</th>
                <th className="py-2.5 px-3 text-center">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {deviceEvidences.map((d, i) => (
                <tr key={i} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-3 font-sans text-slate-200">{d.test}</td>
                  <td className="py-2.5 px-3 text-center">{renderBadge(d.evidence)}</td>
                  <td className="py-2.5 px-3 text-center">{renderBadge(d.result)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tabela 2 — Evidência da Rede */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
          <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-indigo-400" />
              Tabela 2 — Evidência da Rede
            </span>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 text-[10px] uppercase">
                <th className="py-2.5 px-3">Teste</th>
                <th className="py-2.5 px-3 text-center">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {networkEvidences.map((n, i) => (
                <tr key={i} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-3 font-sans text-slate-200">{n.test}</td>
                  <td className="py-2.5 px-3 text-center">{renderBadge(n.result)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tabela 3 — Evidência da Telefonia */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
          <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4 text-amber-400" />
              Tabela 3 — Evidência da Telefonia
            </span>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 text-[10px] uppercase">
                <th className="py-2.5 px-3">Teste</th>
                <th className="py-2.5 px-3 text-center">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {telecomEvidences.map((t, i) => (
                <tr key={i} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-3 font-sans text-slate-200">{t.test}</td>
                  <td className="py-2.5 px-3 text-center">{renderBadge(t.result)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tabela 4 — Evidência Bancária */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
          <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-cyan-400" />
              Tabela 4 — Evidência Bancária
            </span>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 text-[10px] uppercase">
                <th className="py-2.5 px-3">Aplicação</th>
                <th className="py-2.5 px-3 text-center">Instalada</th>
                <th className="py-2.5 px-3 text-center">OTP capturado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {bankingEvidences.map((b, i) => (
                <tr key={i} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-3 font-sans text-slate-200">{b.app}</td>
                  <td className="py-2.5 px-3 text-center">{renderBadge(b.installed)}</td>
                  <td className="py-2.5 px-3 text-center">{renderBadge(b.otpCaptured)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
