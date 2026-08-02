import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Send,
  RefreshCw,
  Terminal,
  Zap,
  Key,
  Globe,
  Radio,
  Server,
  Smartphone,
  PhoneCall,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';
import { OutboundCommandDispatcher, OutboundCommand } from '../services/commandDispatcher';
import { WebhookRetryQueueEngine, WebhookDeliveryJob } from '../services/webhookRetryQueue';
import { ApiGatewayRateLimiter, ApiKeyRecord } from '../services/apiGatewayRateLimiter';
import { NodeSecurityEngine, encryptPayload, decryptPayload } from '../lib/crypto';

export const CpaasSecurityDispatcherConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DISPATCHER' | 'E2EE' | 'WEBHOOK_RETRY' | 'CPAAS_KEYS' | 'ANDROID_AGENT_SPEC'>('DISPATCHER');

  // Command Dispatcher State
  const [commands, setCommands] = useState<OutboundCommand[]>(OutboundCommandDispatcher.getAllCommands());
  const [targetNode, setTargetNode] = useState('node-angola-luanda-01');
  const [cmdType, setCmdType] = useState<'SEND_SMS' | 'RUN_USSD' | 'MAKE_CALL' | 'SEND_WHATSAPP'>('SEND_SMS');
  const [recipient, setRecipient] = useState('+244923000111');
  const [cmdMessage, setCmdMessage] = useState('Sua fatura #9012 foi emitida. Pague via Multicaixa Express.');
  const [isDispatching, setIsDispatching] = useState(false);

  // E2EE Tester State
  const [e2eePlaintext, setE2eePlaintext] = useState('{"account":"BAI","balance":"50000.00 Kz","iban":"AO060040..."}');
  const [e2eeSecret, setE2eeSecret] = useState('vitronis_cos_e2ee_root_key_2026_node-angola-luanda-01');
  const [e2eeEncrypted, setE2eeEncrypted] = useState<any>(null);
  const [e2eeDecrypted, setE2eeDecrypted] = useState<string>('');

  // Webhook Retry Queue State
  const [retryJobs, setRetryJobs] = useState<WebhookDeliveryJob[]>(WebhookRetryQueueEngine.getJobs());
  const [testWebhookUrl, setTestWebhookUrl] = useState('https://minhaempresa.co.ao/api/pagamentos');

  // API Gateway Keys State
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>(ApiGatewayRateLimiter.getAllApiKeys());
  const [devName, setDevName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [devTier, setDevTier] = useState<'FREE_DEVELOPER' | 'PRO_BUSINESS' | 'ENTERPRISE_BANK'>('PRO_BUSINESS');

  const refreshData = () => {
    setCommands(OutboundCommandDispatcher.getAllCommands());
    setRetryJobs(WebhookRetryQueueEngine.getJobs());
    setApiKeys(ApiGatewayRateLimiter.getAllApiKeys());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Dispatch Command to Android Node
  const handleDispatchCommand = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDispatching(true);

    const cmd = OutboundCommandDispatcher.enqueueCommand(targetNode, cmdType, recipient, cmdMessage);
    refreshData();
    setIsDispatching(false);
  };

  // Run E2EE Encryption
  const handleTestEncrypt = () => {
    const enc = encryptPayload(e2eePlaintext, e2eeSecret);
    setE2eeEncrypted(enc);
    setE2eeDecrypted('');
  };

  // Run E2EE Decryption
  const handleTestDecrypt = () => {
    if (!e2eeEncrypted) return;
    try {
      const dec = decryptPayload(e2eeEncrypted, e2eeSecret);
      setE2eeDecrypted(dec);
    } catch (err: any) {
      setE2eeDecrypted('ERRO: Falha de integridade AuthTag - ' + err.message);
    }
  };

  // Dispatch Webhook with Exponential Backoff
  const handleDispatchWebhook = () => {
    WebhookRetryQueueEngine.enqueueWebhook(testWebhookUrl, {
      event: 'SMS_BAI_RECEIVED',
      amount: '50000.00 Kz',
      timestamp: Date.now()
    });
    setRetryJobs(WebhookRetryQueueEngine.getJobs());
  };

  // Create Developer API Key
  const handleCreateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!devName || !companyName) return;
    ApiGatewayRateLimiter.createApiKey(devName, companyName, devTier);
    setApiKeys(ApiGatewayRateLimiter.getAllApiKeys());
    setDevName('');
    setCompanyName('');
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Navigation Header Tabs */}
      <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center space-x-2">
          <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Server className="w-5 h-5" />
          </span>
          <div>
            <h2 className="font-extrabold text-slate-100">VITRONIS COS • NÚCLEO DE OPERAÇÕES CPaaS</h2>
            <p className="text-[10px] text-slate-400">
              E2EE Security • Command Dispatcher • Exponential Retry Queue • API Gateway
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 space-x-1">
          <button
            onClick={() => setActiveTab('DISPATCHER')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'DISPATCHER'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Outbound Dispatcher</span>
          </button>

          <button
            onClick={() => setActiveTab('E2EE')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'E2EE'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>E2EE AES-256-GCM</span>
          </button>

          <button
            onClick={() => setActiveTab('WEBHOOK_RETRY')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'WEBHOOK_RETRY'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Retry Queue (Backoff)</span>
          </button>

          <button
            onClick={() => setActiveTab('CPAAS_KEYS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'CPAAS_KEYS'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Gateway & Keys</span>
          </button>

          <button
            onClick={() => setActiveTab('ANDROID_AGENT_SPEC')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'ANDROID_AGENT_SPEC'
                ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Agente Android Native (Kotlin)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OUTBOUND COMMAND DISPATCHER */}
      {activeTab === 'DISPATCHER' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
          {/* Dispatcher Form */}
          <form
            onSubmit={handleDispatchCommand}
            className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-amber-400 flex items-center space-x-2">
                <Send className="w-4 h-4" />
                <span>Despachar Comando Bidirecional para Nó Android</span>
              </h3>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Nó Conectado
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Nó Alvo (Smartphone)</label>
                <select
                  value={targetNode}
                  onChange={(e) => setTargetNode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200"
                >
                  <option value="node-angola-luanda-01">node-angola-luanda-01 (Unitel 4G)</option>
                  <option value="node-angola-benguela-02">node-angola-benguela-02 (Africell 4G)</option>
                  <option value="ANY">Todos os Nós Disponíveis</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Tipo de Operação</label>
                  <select
                    value={cmdType}
                    onChange={(e) => setCmdType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200"
                  >
                    <option value="SEND_SMS">SEND_SMS (Disparar SMS)</option>
                    <option value="RUN_USSD">RUN_USSD (Executar USSD *111#)</option>
                    <option value="MAKE_CALL">MAKE_CALL (Efetuar Chamada)</option>
                    <option value="SEND_WHATSAPP">SEND_WHATSAPP (Mensagem WhatsApp)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Destinatário / Número</label>
                  <input
                    type="text"
                    required
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="+244 923 000 111 ou *111#"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Conteúdo da Mensagem / Comando USSD</label>
                <textarea
                  value={cmdMessage}
                  onChange={(e) => setCmdMessage(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200"
                  placeholder="Texto a enviar via SMS ou comando USSD..."
                />
              </div>

              <button
                type="submit"
                disabled={isDispatching}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Comando ao Nó em Tempo Real</span>
              </button>
            </div>
          </form>

          {/* Command Queue Terminal */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-slate-200 flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>Fila de Comandos Despachados ({commands.length})</span>
              </h3>
              <button
                onClick={refreshData}
                className="p-1 text-slate-400 hover:text-slate-200"
                title="Atualizar"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {commands.map((cmd) => (
                <div key={cmd.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-amber-400">{cmd.type}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                        cmd.status === 'EXECUTED'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : cmd.status === 'QUEUED'
                          ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {cmd.status}
                    </span>
                  </div>

                  <p className="text-slate-300 text-[11px]">
                    Destino: <span className="font-bold text-indigo-300">{cmd.recipient}</span>
                  </p>
                  {cmd.message && <p className="text-slate-400 text-[10px] bg-slate-900 p-2 rounded">"{cmd.message}"</p>}

                  {cmd.resultPayload && (
                    <div className="p-2 bg-emerald-950/30 rounded border border-emerald-500/30 text-[10px] text-emerald-300">
                      Resposta do Nó: {JSON.stringify(cmd.resultPayload)}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-900">
                    <span>Nó: {cmd.nodeId}</span>
                    <span>Criado: {new Date(cmd.createdAt).toLocaleTimeString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: E2EE CRIPTOGRAFIA AES-256-GCM */}
      {activeTab === 'E2EE' && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-slate-200">
                Criptografia E2EE de Nível Bancário (AES-256-GCM + AuthTag)
              </h3>
            </div>
            <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              Criptografia Ativa entre Agente & Servidor
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[11px] text-slate-400">Texto em Claro / Payload Sensível</label>
              <textarea
                value={e2eePlaintext}
                onChange={(e) => setE2eePlaintext(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] text-slate-400">Chave Secreta de Criptografia (PBKDF2 Derived)</label>
              <input
                type="text"
                value={e2eeSecret}
                onChange={(e) => setE2eeSecret(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-1">
            <button
              onClick={handleTestEncrypt}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Criptografar Payload (AES-GCM)</span>
            </button>

            <button
              onClick={handleTestDecrypt}
              disabled={!e2eeEncrypted}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Decifrar & Validar AuthTag</span>
            </button>
          </div>

          {e2eeEncrypted && (
            <div className="p-4 bg-slate-950 rounded-xl border border-indigo-500/30 space-y-2">
              <span className="text-[11px] font-bold text-indigo-300 block">Payload Criptografado E2EE:</span>
              <pre className="text-[10px] text-amber-300 overflow-x-auto p-2 bg-slate-900 rounded border border-slate-800">
                {JSON.stringify(e2eeEncrypted, null, 2)}
              </pre>
            </div>
          )}

          {e2eeDecrypted && (
            <div className="p-4 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-1">
              <span className="text-[11px] font-bold text-emerald-300 block">Resultado Decifrado:</span>
              <p className="text-slate-200 bg-slate-900 p-2.5 rounded border border-slate-800">{e2eeDecrypted}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WEBHOOK RETRY QUEUE WITH EXPONENTIAL BACKOFF */}
      {activeTab === 'WEBHOOK_RETRY' && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-slate-200">
                Retry Queue com Exponential Backoff (Sem Perda de Eventos)
              </h3>
            </div>
            <button
              onClick={handleDispatchWebhook}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center space-x-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simular Webhook</span>
            </button>
          </div>

          <div className="space-y-3">
            {retryJobs.map((job) => (
              <div key={job.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-200 truncate max-w-md">{job.url}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                      job.status === 'SUCCESS'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : job.status === 'RETRYING'
                        ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {job.status} (Tentativa {job.attempts}/{job.maxAttempts})
                  </span>
                </div>

                {job.lastError && (
                  <p className="text-rose-400 text-[10px] bg-rose-950/20 p-2 rounded border border-rose-500/20">
                    Erro: {job.lastError}
                  </p>
                )}

                <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-900">
                  <span>Criado: {new Date(job.createdAt).toLocaleTimeString('pt-BR')}</span>
                  <span>Próxima Tentativa: {new Date(job.nextAttemptAt).toLocaleTimeString('pt-BR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: API GATEWAY & DEVELOPER KEYS */}
      {activeTab === 'CPAAS_KEYS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
          {/* Key Generator */}
          <form
            onSubmit={handleCreateApiKey}
            className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4"
          >
            <h3 className="font-bold text-sky-400 flex items-center space-x-2 border-b border-slate-800 pb-2">
              <Key className="w-4 h-4" />
              <span>Gerar Chave de API CPaaS para Desenvolvedores</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Nome do Desenvolvedor</label>
                <input
                  type="text"
                  required
                  value={devName}
                  onChange={(e) => setDevName(e.target.value)}
                  placeholder="Ex: Engenheiro de Software"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Empresa / Parceiro</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Startup Pagamentos LDA"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Plano & Rate Limit (RPM)</label>
                <select
                  value={devTier}
                  onChange={(e) => setDevTier(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200"
                >
                  <option value="FREE_DEVELOPER">FREE_DEVELOPER (30 req/min)</option>
                  <option value="PRO_BUSINESS">PRO_BUSINESS (180 req/min)</option>
                  <option value="ENTERPRISE_BANK">ENTERPRISE_BANK (1200 req/min)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-lg shadow-sky-500/20"
              >
                <Key className="w-4 h-4" />
                <span>Emitir Nova Chave de API</span>
              </button>
            </div>
          </form>

          {/* Active Keys List */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2">
              Chaves CPaaS Ativas ({apiKeys.length})
            </h3>

            <div className="space-y-3 max-h-[360px] overflow-y-auto">
              {apiKeys.map((k) => (
                <div key={k.apiKey} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-sky-400">{k.companyName}</span>
                    <span className="text-[9px] bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded">
                      {k.tier} ({k.rateLimitRpm} RPM)
                    </span>
                  </div>

                  <p className="text-slate-400 text-[10px] font-mono bg-slate-900 p-2 rounded truncate">{k.apiKey}</p>

                  <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1">
                    <span>Dev: {k.developerName}</span>
                    <span>Requisições Totais: {k.requestCountTotal}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ANDROID NATIVE AGENT KOTLIN ARCHITECTURE SPEC */}
      {activeTab === 'ANDROID_AGENT_SPEC' && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-5 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="font-bold text-slate-100">Agente Android Nativo (Kotlin Architecture Spec)</h3>
                <p className="text-[10px] text-slate-400">Foreground Service • Android Keystore AES-256-GCM • BroadcastReceivers • WebSocket Auto-Reconnect</p>
              </div>
            </div>
            <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded">
              Android 8.0+ (API 26+)
            </span>
          </div>

          {/* Directory Tree Spec */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <span className="text-purple-400 font-bold block text-[11px]">📁 Estrutura de Pastas Kotlin (com.vitronis.agent)</span>
            <pre className="text-[10px] text-slate-300 bg-slate-900 p-3 rounded border border-slate-800 leading-relaxed overflow-x-auto">
{`app/src/main/java/com/vitronis/agent/
├── MainActivity.kt
├── service/
│   ├── ForegroundService.kt   (WakeLock 10min + NotificationChannel)
│   ├── NotificationListener.kt(Captura notificações de bancos/BAI/Multicaixa)
│   ├── SmsReceiver.kt         (Telephony.Sms.SMS_RECEIVED_ACTION)
│   └── CallReceiver.kt        (Monitoramento de chamadas)
├── websocket/
│   ├── WebSocketClient.kt     (OkHttpClient + ping interval 30s + auto-reconnect)
│   └── MessageHandler.kt
├── crypto/
│   ├── AES256GCM.kt           (Cipher AES/GCM/NoPadding + AndroidKeyStore)
│   └── KeyStoreManager.kt
├── command/
│   ├── CommandExecutor.kt     (Execução de SMS, USSD e chamadas)
│   └── SmsSender.kt
└── model/
    ├── COSEvent.kt
    └── DeviceCapabilities.kt`}
            </pre>
          </div>

          {/* Code Tabs Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AES-256-GCM Spec */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-indigo-400 font-bold text-[11px]">AES256GCM.kt (Keystore + PBKDF2)</span>
                <span className="text-[9px] text-slate-500">javax.crypto</span>
              </div>
              <pre className="text-[9px] text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800 max-h-48 overflow-y-auto">
{`class AES256GCM(private val keystore: KeyStore) {
    fun encrypt(plaintext: String, secret: String): EncryptedPayload {
        val key = deriveKey(secret)
        val iv = ByteArray(12)
        SecureRandom().nextBytes(iv)
        
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, key, GCMParameterSpec(128, iv))
        val ciphertext = cipher.doFinal(plaintext.toByteArray())
        
        return EncryptedPayload(
            iv = Base64.encodeToString(iv, Base64.NO_WRAP),
            ciphertext = Base64.encodeToString(ciphertext, Base64.NO_WRAP),
            authTag = Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP)
        )
    }
}`}
              </pre>
            </div>

            {/* Foreground Service Spec */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold text-[11px]">ForegroundService.kt (WakeLock)</span>
                <span className="text-[9px] text-slate-500">android.app.Service</span>
              </div>
              <pre className="text-[9px] text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800 max-h-48 overflow-y-auto">
{`class ForegroundService : Service() {
    private lateinit var wakeLock: PowerManager.WakeLock
    
    override fun onCreate() {
        super.onCreate()
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "Vitronis:COSWakeLock"
        )
        wakeLock.acquire(10 * 60 * 1000L)
        startForeground(1, createNotification())
    }
}`}
              </pre>
            </div>

            {/* SmsReceiver Spec */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-bold text-[11px]">SmsReceiver.kt (SMS Banking Listener)</span>
                <span className="text-[9px] text-slate-500">BroadcastReceiver</span>
              </div>
              <pre className="text-[9px] text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800 max-h-48 overflow-y-auto">
{`class SmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            for (msg in messages) {
                val event = COSEvent(
                    eventId = UUID.randomUUID().toString(),
                    type = EventType.SMS,
                    payload = mapOf("body" to msg.messageBody, "sender" to msg.displayOriginatingAddress)
                )
                sendToServer(event)
            }
        }
    }
}`}
              </pre>
            </div>

            {/* WebSocket Client Spec */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sky-400 font-bold text-[11px]">WebSocketClient.kt (OkHttp Realtime)</span>
                <span className="text-[9px] text-slate-500">okhttp3.WebSocket</span>
              </div>
              <pre className="text-[9px] text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800 max-h-48 overflow-y-auto">
{`class WebSocketClient(val serverUrl: String, val nodeId: String) {
    private val client = OkHttpClient.Builder()
        .pingInterval(30, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()
        
    fun connect() {
        val request = Request.Builder().url("$serverUrl/ws?nodeId=$nodeId").build()
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onMessage(webSocket: WebSocket, text: String) {
                handleCommand(Gson().fromJson(text, Map::class.java))
            }
        })
    }
}`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
