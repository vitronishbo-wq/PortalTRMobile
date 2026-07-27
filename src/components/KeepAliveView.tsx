import React, { useState } from 'react';
import { Server, CheckCircle2, RefreshCw, Mail, Phone, Zap } from 'lucide-react';
import { KeepAliveConfig, PingLog } from '../types';

interface KeepAliveViewProps {
  config: KeepAliveConfig | null;
  logs: PingLog[];
  onTriggerPing: () => void;
  onUpdateConfig: (newConfig: Partial<KeepAliveConfig>) => void;
  onClearLogs: () => void;
  loading: boolean;
}

export const KeepAliveView: React.FC<KeepAliveViewProps> = ({
  config,
  logs,
  onTriggerPing,
  onUpdateConfig,
  loading
}) => {
  const [targetUrl, setTargetUrl] = useState(config?.targetUrl || 'https://portal-backend.onrender.com/api/ping');
  const [adminEmail, setAdminEmail] = useState(config?.adminEmail || 'trumanmarcelo@gmail.com');
  const [adminWhatsapp, setAdminWhatsapp] = useState(config?.adminWhatsapp || '+244948323383');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveConfig = () => {
    onUpdateConfig({
      targetUrl,
      adminEmail,
      adminWhatsapp
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Server className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">Status e Configuração do Servidor</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Painel simplificado para verificação da saúde do backend e gestão de contatos administrativos para notificações.
            </p>
          </div>

          <button
            onClick={onTriggerPing}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Zap className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Testar Conexão do Backend</span>
          </button>
        </div>
      </div>

      {/* Configuration Box */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-slate-100 text-sm">Configurações Gerais de Comunicação</h3>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              URL do Endpoint de Ping do Backend
            </label>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://seu-app.onrender.com/api/ping"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Admin Contacts */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-3">
            <span className="text-xs font-bold text-slate-200 block border-b border-slate-800 pb-2">
              Contatos do Administrador
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center space-x-1.5 mb-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span>E-mail do Administrador</span>
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="exemplo@dominio.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center space-x-1.5 mb-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp / Telefone</span>
                </label>
                <input
                  type="text"
                  value={adminWhatsapp}
                  onChange={(e) => setAdminWhatsapp(e.target.value)}
                  placeholder="+244..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSaveConfig}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
            >
              Salvar Configurações
            </button>
          </div>

          {saveSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Configurações salvas com sucesso!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
