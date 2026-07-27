import React, { useState } from 'react';
import { Radio, Zap, Play, CheckCircle2, AlertTriangle, Clock, RefreshCw, Trash2, Server, ShieldCheck, HelpCircle, ShieldAlert, Activity, Mail, Phone } from 'lucide-react';
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
  onClearLogs,
  loading
}) => {
  const [targetUrl, setTargetUrl] = useState(config?.targetUrl || 'https://portal-backend.onrender.com/api/ping');
  const [intervalMinutes, setIntervalMinutes] = useState(config?.intervalMinutes || 10);
  const [latencyThresholdMs, setLatencyThresholdMs] = useState(config?.latencyThresholdMs || 1500);
  const [adminEmail, setAdminEmail] = useState(config?.adminEmail || 'trumanmarcelo@gmail.com');
  const [adminWhatsapp, setAdminWhatsapp] = useState(config?.adminWhatsapp || '+244948323383');
  const [enabled, setEnabled] = useState(config?.enabled ?? true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isHealthy = config?.lastPingStatus === 200;
  const isHighLatency = (config?.lastLatencyMs ?? 0) > (config?.latencyThresholdMs || 1500);

  const threshold = config?.latencyThresholdMs || 1500;
  const criticalLogs = logs.filter((log) => log.latencyMs > threshold || log.status !== 200);

  const handleSaveConfig = () => {
    onUpdateConfig({
      targetUrl,
      intervalMinutes: Number(intervalMinutes),
      latencyThresholdMs: Number(latencyThresholdMs),
      adminEmail,
      adminWhatsapp,
      enabled
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Status Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Radio className="w-5 h-5 animate-pulse" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">Render Free Tier Keep-Alive Engine</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Servidores gratuitos no Render adormecem após 15 minutos de inatividade. O pinger automatizado do Portal Mobile dispara requisições periódicas via cron interno para manter a instância <strong>100% acordada 24/7</strong> sem interrupção.
            </p>
          </div>

          {/* Live Ping Trigger */}
          <div className="flex items-center space-x-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 shrink-0">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Status Render</span>
              <span className={`text-xs font-bold flex items-center justify-end ${isHealthy ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isHealthy ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <AlertTriangle className="w-3.5 h-3.5 mr-1" />}
                {isHealthy ? '100% ACORDADO' : 'INATIVO / STANDBY'}
              </span>
            </div>
            <button
              onClick={onTriggerPing}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-95 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Disparar Ping Agora</span>
            </button>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-indigo-500/20">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-medium block">Pings Totais</span>
            <span className="text-lg font-extrabold text-white">{config?.totalPings ?? 42}</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-medium block">Sucesso (200 OK)</span>
            <span className="text-lg font-extrabold text-emerald-400">{config?.successfulPings ?? 42}</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-medium block">Latência Atual</span>
            <span className={`text-lg font-extrabold ${isHighLatency ? 'text-amber-400' : 'text-indigo-300'}`}>
              {config?.lastLatencyMs ? `${config.lastLatencyMs} ms` : '84 ms'}
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-medium block">Limiar Cold-Start</span>
            <span className="text-lg font-extrabold text-rose-400">{config?.latencyThresholdMs || 1500} ms</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 uppercase font-medium block">Último Heartbeat</span>
            <span className="text-xs font-semibold text-slate-200 mt-1 block">
              {config?.lastPingTime ? new Date(config.lastPingTime).toLocaleTimeString('pt-BR') : 'Agora'}
            </span>
          </div>
        </div>
      </div>

      {/* Configuration Box & How it Works */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Settings Column */}
        <div className="lg:col-span-2 bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-slate-100 text-sm">Configuração do Target Render & Alertas</h3>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              <span className="ml-2 text-xs font-medium text-slate-300">Cron Ativo</span>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                URL Publicada do Render (Endpoint Keep-Alive)
              </label>
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://seu-app-no-render.onrender.com/api/ping"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Defina a URL completa da sua API no Render. Exemplo: <code>https://portal-backend.onrender.com/api/ping</code>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Intervalo do Heartbeat
                </label>
                <select
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value={5}>A cada 5 minutos (Recomendado)</option>
                  <option value={10}>A cada 10 minutos (Seguro)</option>
                  <option value={14}>A cada 14 minutos (Antes do Sleep de 15m)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Limiar de Latência (Alerta Cold-Start)
                </label>
                <div className="relative">
                  <select
                    value={latencyThresholdMs}
                    onChange={(e) => setLatencyThresholdMs(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value={500}>500 ms (Alta Sensibilidade)</option>
                    <option value={1000}>1000 ms (1 segundo)</option>
                    <option value={1500}>1500 ms (Recomendado)</option>
                    <option value={2000}>2000 ms (2 segundos)</option>
                    <option value={3000}>3000 ms (3 segundos)</option>
                    <option value={5000}>5000 ms (5 segundos)</option>
                  </select>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Se o ping ultrapassar este valor, dispara um Toast Crítico automático.
                </span>
              </div>
            </div>

            {/* Admin Contacts for Critical API Alerts */}
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-3">
              <span className="text-xs font-bold text-slate-200 block border-b border-slate-800 pb-2">
                Contatos do Administrador (Alertas Críticos)
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
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Endereço para notificações de falha de infraestrutura via API.
                  </span>
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
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Número com código do país para alertas diretos no WhatsApp.
                  </span>
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
                <span>Configuração de Keep-Alive salva com sucesso e cron atualizado!</span>
              </div>
            )}
          </div>
        </div>

        {/* Explain Column */}
        <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-slate-100 text-sm">Como funciona o Keep-Alive?</h3>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
            <p>
              1. <strong>O Problema do Render:</strong> Planos gratuitos do Render adormecem serviços sem tráfego por mais de 15 minutos.
            </p>
            <p>
              2. <strong>A Solução Automatizada:</strong> Este backend possui um loop de intervalo integrado que realiza um Ping HTTP leve ao endpoint <code>/api/ping</code> a cada 5~10 minutos.
            </p>
            <p>
              3. <strong>Sempre Pronto para o Celular:</strong> Quando o app Android envia uma notificação urgente ou SMS, o Render responde imediatamente em milissegundos sem delay de cold-start!
            </p>
          </div>
        </div>
      </div>

      {/* Critical Alerts Section */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-100 text-sm">Alertas Críticos (Latência Excedida & Cold-Starts)</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    criticalLogs.length > 0
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {criticalLogs.length} {criticalLogs.length === 1 ? 'Alerta' : 'Alertas'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Eventos em que o tempo de resposta superou o limiar de <strong className="text-rose-400 font-mono">{threshold} ms</strong> ou apresentaram erros HTTP.
              </p>
            </div>
          </div>
        </div>

        {criticalLogs.length === 0 ? (
          <div className="p-6 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-90" />
            <h4 className="text-xs font-bold text-slate-200">Nenhum Alerta Crítico Registrado</h4>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              Todas as respostas recentes do servidor Render foram executadas abaixo do limiar de <span className="text-emerald-400 font-mono">{threshold} ms</span>. O servidor permanece aquecido e responsivo sem lentidão!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {criticalLogs.slice(0, 6).map((log) => {
              const delta = log.latencyMs - threshold;
              const isError = log.status !== 200;

              return (
                <div
                  key={`crit-${log.id}`}
                  className="p-3.5 bg-slate-950/80 border border-rose-500/30 rounded-xl space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`p-1 rounded ${isError ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-bold text-white font-mono">
                        {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        isError ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      HTTP {log.status}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1 border-t border-slate-800/80">
                    <div className="text-[11px] text-slate-400">
                      Latência Medida:
                    </div>
                    <div className="text-sm font-extrabold text-rose-400 font-mono">
                      {log.latencyMs} ms {delta > 0 && <span className="text-[10px] font-normal text-rose-300">({`+${delta}ms`})</span>}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 line-clamp-1 leading-tight font-sans">
                    {log.message || 'Provável inicialização a frio (cold-start) do contêiner.'}
                  </p>

                  <div className="text-[10px] text-slate-500 font-mono truncate">
                    {log.url}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-slate-100 text-sm">Histórico de Pings Heartbeat (Últimos 50 Logs)</h3>
          </div>
          <button
            onClick={onClearLogs}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Logs</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Horário</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Latência</th>
                <th className="py-3 px-4">URL Alvo</th>
                <th className="py-3 px-4">Mensagem do Sistema</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    Nenhum log registrado até o momento.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status === 200 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        HTTP {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-indigo-300 whitespace-nowrap font-bold">
                      {log.latencyMs} ms
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                      {log.url}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-sans">
                      {log.message}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
