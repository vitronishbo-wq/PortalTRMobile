import React, { useState } from 'react';
import {
  Plug,
  Terminal,
  Shield,
  Key,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Flame,
  CreditCard,
  Plus,
  Trash2,
  Copy,
  Zap,
  Globe,
  Database,
  Lock,
  Layers,
  Activity,
  Sliders,
  Check,
  RotateCcw
} from 'lucide-react';
import { WebhookRetryQueueEngine, WebhookDeliveryJob } from '../services/webhookRetryQueue';
import { ApiGatewayRateLimiter, ApiKeyRecord } from '../services/apiGatewayRateLimiter';
import { PaymentRegistry, AppyPayProvider } from '../services/paymentEngine';

export const IntegrationsConsole: React.FC = () => {
  // Sub-tabs in Integrations
  const [activeTab, setActiveTab] = useState<'appypay' | 'firebase' | 'webhooks' | 'apikeys' | 'external'>('appypay');

  // AppyPay Provider Instance
  const appyPayProvider = (PaymentRegistry.get('appypay') as AppyPayProvider) || new AppyPayProvider();

  // Webhook Queue Data
  const [webhookJobs, setWebhookJobs] = useState<WebhookDeliveryJob[]>(WebhookRetryQueueEngine.getJobs());
  const [testWebhookUrl, setTestWebhookUrl] = useState('https://minhaempresa.co.ao/api/webhooks/appypay');
  const [testPayloadEvent, setTestPayloadEvent] = useState('charge.succeeded');
  const [isDispatching, setIsDispatching] = useState(false);

  // API Keys Data
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>(ApiGatewayRateLimiter.getAllApiKeys());
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newDevName, setNewDevName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newTier, setNewTier] = useState<'FREE_DEVELOPER' | 'PRO_BUSINESS' | 'ENTERPRISE_BANK'>('PRO_BUSINESS');

  // Copy Feedback State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const refreshData = () => {
    setWebhookJobs(WebhookRetryQueueEngine.getJobs());
    setApiKeys(ApiGatewayRateLimiter.getAllApiKeys());
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDispatchTestWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDispatching(true);

    const payload = {
      event: testPayloadEvent,
      timestamp: Date.now(),
      data: {
        chargeId: `chg_appypay_${Math.random().toString(36).substring(2, 8)}`,
        amount: 50000,
        currency: 'AOA',
        referenceCode: '918 273 401',
        customerName: 'SILA JANEIRO (TEST)'
      }
    };

    WebhookRetryQueueEngine.enqueueWebhook(testWebhookUrl, payload);

    setTimeout(() => {
      setIsDispatching(false);
      refreshData();
    }, 500);
  };

  const handleRetryJob = (jobId: string) => {
    WebhookRetryQueueEngine.retryDeadLetterJob(jobId);
    refreshData();
  };

  const handleCreateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevName || !newCompany) return;

    ApiGatewayRateLimiter.createApiKey(newDevName, newCompany, newTier);
    setShowNewKeyModal(false);
    setNewDevName('');
    setNewCompany('');
    refreshData();
  };

  const handleToggleApiKeyStatus = (key: string) => {
    ApiGatewayRateLimiter.toggleActiveKey(key);
    refreshData();
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* HEADER BANNER */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <span className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
              <Plug className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-100">CENTRAL DE INTEGRAÇÕES, APIS & WEBHOOKS</h2>
              <p className="text-xs text-slate-400 font-mono">
                AppyPay • Firebase Platform • Webhooks Queue Engine • API Rate Limiter
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={refreshData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
              title="Atualizar Estado"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowNewKeyModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-purple-600/20"
            >
              <Key className="w-4 h-4" />
              <span>Criar Nova Chave API</span>
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">AppyPay Gateway</span>
            <span className="text-base font-black text-emerald-400">Sandbox Pronta</span>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Firebase Auth & Firestore</span>
            <span className="text-base font-black text-amber-400">Conectado (Realtime)</span>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Webhooks Fila Ativa</span>
            <span className="text-base font-black text-sky-400">{webhookJobs.length} Processados</span>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Chaves API Emissão</span>
            <span className="text-base font-black text-purple-400">{apiKeys.length} Chaves Ativas</span>
          </div>
        </div>
      </div>

      {/* SUB TABS NAVIGATION */}
      <div className="flex items-center space-x-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto text-xs font-mono">
        <button
          onClick={() => setActiveTab('appypay')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'appypay'
              ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>AppyPay Payment Gateway</span>
        </button>

        <button
          onClick={() => setActiveTab('firebase')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'firebase'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Firebase Services</span>
        </button>

        <button
          onClick={() => setActiveTab('webhooks')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'webhooks'
              ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Webhooks & Retry Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('apikeys')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'apikeys'
              ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Chaves API & Rate Limiting</span>
        </button>

        <button
          onClick={() => setActiveTab('external')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'external'
              ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Serviços Externos & CPaaS</span>
        </button>
      </div>

      {/* TAB 1: APPYPAY GATEWAY */}
      {activeTab === 'appypay' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Integração Gateway AppyPay (Multicaixa Express AOA)
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/30">
                VERSÃO API v2.4.0
              </span>
            </div>

            <p className="text-slate-300 text-xs">
              A AppyPay é o gateway principal para liquidação de pagamentos via Multicaixa Express, referências bancárias (Entidade 00124) e cartões de débito angolanos em Kwanzas (AOA).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">CLIENT ID (SANDBOX)</span>
                <span className="font-bold text-indigo-300 break-all">appypay_sbx_client_vcos_9921</span>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">CLIENT SECRET</span>
                <span className="font-bold text-slate-400">••••••••••••••••••••••••</span>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">ASSINATURA HMAC</span>
                <span className="font-bold text-amber-400">SHA256 Verificação Ativa</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FIREBASE PLATFORM */}
      {activeTab === 'firebase' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Firebase Core: Authentication, Firestore, Hosting & Storage
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded border border-amber-500/30">
                PWA SINGLE SOURCE OF TRUTH
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-200">Firebase Authentication</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded">
                    PROVEDOR ATIVO
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Autenticação JWT segura com suporte a Email/Password e Tokens de Sessão para a Founder Console e Agentes Android.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-200">Firestore Realtime Engine</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded">
                    WEBSOCKET LISTENERS
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Sincronização em tempo real de eventos SMS, telemetria de bateria, heartbeat de agentes e logs de auditoria.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-200">Firebase Cloud Messaging (FCM)</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded">
                    PUSH DISPATCHER
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Disparo de ordens silenciosas e mensagens Push para despertar a aplicação Android nativa em segundo plano.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-200">Firebase Hosting CDN</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded">
                    GLOBAL EDGE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Distribuição estática de alta velocidade para o PWA do PortalTRMobile com suporte offline IndexedDB.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WEBHOOKS & RETRY QUEUE */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Fila de Disparo de Webhooks com Retentativa Exponencial (Retry Engine)
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-sky-500/20 text-sky-300 text-[10px] font-bold rounded border border-sky-500/30">
                Exponential Backoff (2s, 4s, 8s, 16s)
              </span>
            </div>

            {/* TEST DISPATCH FORM */}
            <form onSubmit={handleDispatchTestWebhook} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-sky-400 block">Testador de Disparo de Webhook:</span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[10px] text-slate-400 mb-1">URL de Destino (Endpoint HTTP POST)</label>
                  <input
                    type="url"
                    required
                    value={testWebhookUrl}
                    onChange={(e) => setTestWebhookUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Tipo de Evento</label>
                  <select
                    value={testPayloadEvent}
                    onChange={(e) => setTestPayloadEvent(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  >
                    <option value="charge.succeeded">charge.succeeded</option>
                    <option value="charge.failed">charge.failed</option>
                    <option value="SMS_BAI_RECEIVED">SMS_BAI_RECEIVED</option>
                    <option value="reconciliation.matched">reconciliation.matched</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isDispatching}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-sky-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isDispatching ? 'Disparando...' : 'Disparar Webhook de Teste'}</span>
                </button>
              </div>
            </form>

            {/* JOBS QUEUE TABLE */}
            <div className="space-y-2">
              <span className="font-bold text-slate-300 block">Histórico da Fila de Webhooks:</span>
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                      <th className="p-3">Job ID / URL</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3">Tentativas</th>
                      <th className="p-3">HTTP Code</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {webhookJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-900/40">
                        <td className="p-3">
                          <div className="font-bold text-sky-300">{job.id}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{job.url}</div>
                        </td>

                        <td className="p-3">
                          {job.status === 'SUCCESS' && (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/30">
                              ENTREGUE
                            </span>
                          )}
                          {job.status === 'RETRYING' && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded border border-amber-500/30 animate-pulse">
                              REPROCESSANDO
                            </span>
                          )}
                          {job.status === 'DEAD_LETTER' && (
                            <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] font-bold rounded border border-rose-500/30">
                              DEAD-LETTER (FALHA)
                            </span>
                          )}
                        </td>

                        <td className="p-3 font-bold text-slate-300">
                          {job.attempts} / {job.maxAttempts}
                        </td>

                        <td className="p-3 font-mono font-bold text-slate-300">
                          {job.responseStatus ? `HTTP ${job.responseStatus}` : '—'}
                        </td>

                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleRetryJob(job.id)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded text-[10px] transition-all cursor-pointer flex items-center space-x-1 ml-auto"
                            title="Forçar Reenvio"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reenviar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: API KEYS & RATE LIMITING */}
      {activeTab === 'apikeys' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Gerenciador de Chaves API REST & Controlo de Rate Limiting (RPM)
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 text-[10px] font-bold rounded border border-purple-500/30">
                Sliding Window Limiter
              </span>
            </div>

            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                    <th className="p-3">Chave API</th>
                    <th className="p-3">Desenvolvedor / Empresa</th>
                    <th className="p-3">Plano / Tier</th>
                    <th className="p-3">Limite RPM</th>
                    <th className="p-3">Total Requisições</th>
                    <th className="p-3 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {apiKeys.map((key) => (
                    <tr key={key.apiKey} className="hover:bg-slate-900/40">
                      <td className="p-3">
                        <div className="flex items-center space-x-1.5 font-bold text-purple-300">
                          <span>{key.apiKey}</span>
                          <button
                            onClick={() => handleCopy(key.apiKey)}
                            className="hover:text-white"
                            title="Copiar Chave"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-200">{key.developerName}</div>
                        <div className="text-[10px] text-slate-400">{key.companyName}</div>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[10px] uppercase font-bold text-slate-300">
                          {key.tier}
                        </span>
                      </td>

                      <td className="p-3 font-bold text-amber-400">
                        {key.rateLimitRpm} req/min
                      </td>

                      <td className="p-3 font-bold text-emerald-400">
                        {key.requestCountTotal.toLocaleString()}
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleToggleApiKeyStatus(key.apiKey)}
                          className={`px-2.5 py-1 rounded font-bold text-[10px] transition-all cursor-pointer ${
                            key.active
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {key.active ? 'ATIVO' : 'SUSPENSO'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SERVIÇOS EXTERNOS & CPAAS */}
      {activeTab === 'external' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Infraestrutura Cloud & Serviços Externos
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded border border-indigo-500/30">
                SSL STATISTIC ROUTING
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Node.js Express Container</span>
                <span className="font-bold text-emerald-400 text-sm">Porta 3000 (Proxy Reverse NGINX)</span>
                <p className="text-[10px] text-slate-400">Ponto único de entrada e roteamento estrito.</p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">CPaaS Webhook Dispatcher</span>
                <span className="font-bold text-cyan-400 text-sm">Stateless Queue Service</span>
                <p className="text-[10px] text-slate-400">Execução sem estado de tarefas pesadas de rede.</p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">ProxyPay & EMIS Gateway</span>
                <span className="font-bold text-amber-400 text-sm">Entidade 00124 Ativa</span>
                <p className="text-[10px] text-slate-400">Rede interbancária nacional de Angola.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRIAR NOVA CHAVE API */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono text-xs">
          <form
            onSubmit={handleCreateApiKey}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 text-slate-100 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-purple-400 flex items-center space-x-2">
                <Key className="w-4 h-4" />
                <span>Emitir Nova Chave API REST</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewKeyModal(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Nome do Desenvolvedor</label>
              <input
                type="text"
                required
                value={newDevName}
                onChange={(e) => setNewDevName(e.target.value)}
                placeholder="Ex: Engenheiro de Software"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Empresa / Organização</label>
              <input
                type="text"
                required
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                placeholder="Ex: Banco de Poupança e Crédito"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Plano de Rate Limit (RPM)</label>
              <select
                value={newTier}
                onChange={(e) => setNewTier(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              >
                <option value="FREE_DEVELOPER">FREE DEVELOPER (60 RPM)</option>
                <option value="PRO_BUSINESS">PRO BUSINESS (120 RPM)</option>
                <option value="ENTERPRISE_BANK">ENTERPRISE BANK (1200 RPM)</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewKeyModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-purple-600/20"
              >
                <span>Emitir Chave API</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
