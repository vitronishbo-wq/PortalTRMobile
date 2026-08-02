import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  Radio,
  Terminal,
  RefreshCw,
  Send,
  Lock,
  Play,
  Pause,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Server,
  Smartphone,
  Key,
  ShieldCheck,
  Cpu,
  Layers,
  Copy,
  Check,
  Activity,
  ArrowRight,
  Bell,
  ExternalLink,
  Database
} from 'lucide-react';
import { useIdentity } from '../engine/identityEngine';
import { encryptPayload, decryptPayload } from '../lib/crypto';

export interface StreamItem {
  id: string;
  topic: string;
  timestamp: number;
  data: any;
}

export const RealtimeDevStreamConsole: React.FC = () => {
  const { profile: userProfile } = useIdentity();

  // SSE Stream State
  const [streamConnected, setStreamConnected] = useState<boolean>(false);
  const [streamLogs, setStreamLogs] = useState<StreamItem[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Realtime Stats
  const [stats, setStats] = useState({
    totalEvents: 0,
    commandsPending: 0,
    retriesPending: 0,
    deadLetterCount: 0,
    nodesCount: 1
  });

  // Action Tabs
  const [activeTab, setActiveTab] = useState<'STREAM' | 'COMMANDS' | 'RETRIES' | 'DLQ_ALERTS' | 'E2EE' | 'GATEWAY'>('STREAM');

  // DLQ Alert Configuration States
  const [slackWebhookUrl, setSlackWebhookUrl] = useState<string>('');
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState<string>('');
  const [customDlqWebhookUrl, setCustomDlqWebhookUrl] = useState<string>('');
  const [dlqAlertsEnabled, setDlqAlertsEnabled] = useState<boolean>(true);
  const [dlqAlertLogs, setDlqAlertLogs] = useState<any[]>([]);
  const [isSavingDlqConfig, setIsSavingDlqConfig] = useState<boolean>(false);
  const [isTestingDlqAlert, setIsTestingDlqAlert] = useState<boolean>(false);
  const [dlqStatusMessage, setDlqStatusMessage] = useState<string | null>(null);

  // Queue Persistence States
  const [activePersistenceDriver, setActivePersistenceDriver] = useState<string>('file');
  const [persistenceFilePath, setPersistenceFilePath] = useState<string>('');
  const [isChangingDriver, setIsChangingDriver] = useState<boolean>(false);

  // Interactive Form States
  // 1. Simular Evento Inbound
  const [testNodeId, setTestNodeId] = useState('node-angola-01');
  const [testSender, setTestSender] = useState('+244923111222');
  const [testMessage, setTestMessage] = useState('Transferência BAI recebida: 25.000 Kz de Antonio Silva.');
  const [isSendingEvent, setIsSendingEvent] = useState(false);

  // 2. Enviar Comando Outbound
  const [cmdNodeId, setCmdNodeId] = useState('node-angola-01');
  const [cmdType, setCmdType] = useState<'SEND_SMS' | 'MAKE_CALL' | 'SEND_WHATSAPP' | 'EXECUTE_SHELL'>('SEND_SMS');
  const [cmdPayload, setCmdPayload] = useState('{"phoneNumber":"+244923999888","text":"Código de Confirmação: 849201"}');
  const [isSendingCmd, setIsSendingCmd] = useState(false);

  // 3. Teste Retry Webhook
  const [webhookUrl, setWebhookUrl] = useState('https://webhook.site/test-endpoint');
  const [webhookPayload, setWebhookPayload] = useState('{"event":"PAYMENT_RECEIVED","amount":25000}');
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);

  // 4. E2EE Tester
  const [e2eeSecret, setE2eeSecret] = useState('workspace:node-angola-01:vitronis-super-secret-2026');
  const [e2eeInput, setE2eeInput] = useState('{"account":"BAI","secretCode":"9921"}');
  const [e2eeCiphertext, setE2eeCiphertext] = useState<any>(null);
  const [e2eeDecrypted, setE2eeDecrypted] = useState<string>('');

  // 5. API Gateway Tester
  const [testApiKey, setTestApiKey] = useState('vk_pro_dev_angola_2026_x89a');
  const [gatewayLogs, setGatewayLogs] = useState<any[]>([]);

  // Clipboard copy state
  const [copiedKey, setCopiedKey] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Connect to SSE Stream
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource('/api/v1/stream/realtime');

      eventSource.onopen = () => {
        setStreamConnected(true);
      };

      eventSource.onmessage = (event) => {
        if (isPaused) return;
        try {
          const parsed = JSON.parse(event.data);
          const item: StreamItem = {
            id: `stream-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            topic: parsed.topic || parsed.type || 'SYSTEM',
            timestamp: parsed.timestamp || Date.now(),
            data: parsed.data || parsed
          };

          setStreamLogs((prev) => [item, ...prev.slice(0, 199)]);
          setStats((prev) => ({
            ...prev,
            totalEvents: prev.totalEvents + 1
          }));
        } catch (err) {
          console.error('[SSE Parse Error]', err);
        }
      };

      eventSource.onerror = () => {
        setStreamConnected(false);
      };
    } catch (e) {
      console.warn('[SSE Connection Failed - Fallback active]');
      setStreamConnected(false);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isPaused]);

  // Fetch initial stats from server
  const fetchStats = async () => {
    try {
      const headers = {
        'x-founder-secret': 'vk_founder_root_secret_2026_angola',
        'x-user-role': 'founder',
        'x-user-email': 'silajaneiro9@gmail.com'
      };

      const [retryRes, queuesRes] = await Promise.all([
        fetch('/api/admin/retry-queue/stats', { headers }).then((r) => r.json()).catch(() => null),
        fetch('/api/v1/webhooks/queue').then((r) => r.json()).catch(() => null)
      ]);

      if (retryRes) {
        setStats((prev) => ({
          ...prev,
          retriesPending: retryRes.pendingJobs || 0,
          deadLetterCount: retryRes.deadLetterJobs || 0
        }));
      }
    } catch (e) {
      // quiet catch
    }
  };

  // Fetch DLQ Alert Config & Logs
  const fetchDlqAlertConfig = async () => {
    try {
      const headers = {
        'x-founder-secret': 'vk_founder_root_secret_2026_angola',
        'x-user-role': 'founder',
        'x-user-email': 'silajaneiro9@gmail.com'
      };

      const [configRes, logsRes] = await Promise.all([
        fetch('/api/admin/dlq-alerts/config', { headers }).then((r) => r.json()).catch(() => null),
        fetch('/api/admin/dlq-alerts/logs', { headers }).then((r) => r.json()).catch(() => null)
      ]);

      if (configRes && configRes.success && configRes.config) {
        setSlackWebhookUrl(configRes.config.slackWebhookUrl || '');
        setDiscordWebhookUrl(configRes.config.discordWebhookUrl || '');
        setCustomDlqWebhookUrl(configRes.config.customWebhookUrl || '');
        setDlqAlertsEnabled(configRes.config.enabled ?? true);
      }

      if (logsRes && logsRes.success && Array.isArray(logsRes.logs)) {
        setDlqAlertLogs(logsRes.logs);
      }
    } catch (e) {
      console.error('[DLQ Config Fetch Error]:', e);
    }
  };

  const fetchPersistenceInfo = async () => {
    try {
      const headers = {
        'x-founder-secret': 'vk_founder_root_secret_2026_angola',
        'x-user-role': 'founder',
        'x-user-email': 'silajaneiro9@gmail.com'
      };

      const res = await fetch('/api/admin/retry-queue/persistence', { headers });
      const data = await res.json();
      if (data && data.success && data.info) {
        setActivePersistenceDriver(data.info.activeDriver);
        setPersistenceFilePath(data.info.filePath || '');
      }
    } catch (e) {
      console.error('[Persistence Fetch Error]:', e);
    }
  };

  const handleChangePersistenceDriver = async (driver: string) => {
    setIsChangingDriver(true);
    try {
      const res = await fetch('/api/admin/retry-queue/persistence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-founder-secret': 'vk_founder_root_secret_2026_angola',
          'x-user-role': 'founder',
          'x-user-email': 'silajaneiro9@gmail.com'
        },
        body: JSON.stringify({ driver })
      });
      const data = await res.json();
      if (data && data.success && data.info) {
        setActivePersistenceDriver(data.info.activeDriver);
      }
    } catch (e) {
      console.error('[Change Driver Error]:', e);
    } finally {
      setIsChangingDriver(false);
    }
  };

  const handleSaveDlqConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDlqConfig(true);
    setDlqStatusMessage(null);

    try {
      const res = await fetch('/api/admin/dlq-alerts/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-founder-secret': 'vk_founder_root_secret_2026_angola',
          'x-user-role': 'founder',
          'x-user-email': 'silajaneiro9@gmail.com'
        },
        body: JSON.stringify({
          slackWebhookUrl,
          discordWebhookUrl,
          customWebhookUrl: customDlqWebhookUrl,
          enabled: dlqAlertsEnabled
        })
      });

      const data = await res.json();
      if (data.success) {
        setDlqStatusMessage('✅ Configuração de Alertas Slack/Discord salva com sucesso!');
      } else {
        setDlqStatusMessage(`❌ Falha: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (err: any) {
      setDlqStatusMessage(`❌ Erro de Conexão: ${err.message}`);
    } finally {
      setIsSavingDlqConfig(false);
      setTimeout(() => setDlqStatusMessage(null), 4000);
    }
  };

  const handleTriggerTestDlqAlert = async () => {
    setIsTestingDlqAlert(true);
    setDlqStatusMessage(null);

    try {
      const res = await fetch('/api/admin/dlq-alerts/test', {
        method: 'POST',
        headers: {
          'x-founder-secret': 'vk_founder_root_secret_2026_angola',
          'x-user-role': 'founder',
          'x-user-email': 'silajaneiro9@gmail.com'
        }
      });

      const data = await res.json();
      if (data.success) {
        setDlqStatusMessage(`🚨 Alerta de teste disparado com sucesso! Canais notificados: ${(data.alertResult?.channelsSent || []).join(', ') || 'Nenhum canal ativo'}`);
        fetchDlqAlertConfig();
      } else {
        setDlqStatusMessage(`❌ Falha no teste: ${data.error || 'Erro ao enviar'}`);
      }
    } catch (err: any) {
      setDlqStatusMessage(`❌ Erro no teste: ${err.message}`);
    } finally {
      setIsTestingDlqAlert(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchDlqAlertConfig();
    fetchPersistenceInfo();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Dispatch Inbound Event with E2EE
  const handleSendInboundEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingEvent(true);
    try {
      const secret = `${testNodeId}:${testNodeId}:${process.env.COS_MASTER_SECRET || 'vitronis-super-secret-2026'}`;
      const plainPayload = JSON.stringify({
        sender: testSender,
        message: testMessage,
        timestamp: Date.now()
      });
      const encrypted = encryptPayload(plainPayload, secret);

      const res = await fetch('/api/events/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'ws-angola-dev',
          nodeId: testNodeId,
          encryptedEvents: [
            {
              eventId: `evt-${Date.now()}`,
              iv: encrypted.iv,
              ciphertext: encrypted.ciphertext,
              authTag: encrypted.authTag,
              type: 'SMS_INBOUND'
            }
          ]
        })
      });

      const data = await res.json();
      if (data.success) {
        setTestMessage('');
      }
    } catch (err: any) {
      alert('Erro ao enviar evento: ' + err.message);
    } finally {
      setIsSendingEvent(false);
    }
  };

  // Enviar Comando Outbound
  const handleSendOutboundCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingCmd(true);
    try {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(cmdPayload);
      } catch (err) {
        parsedPayload = { raw: cmdPayload };
      }

      const res = await fetch(`/api/v1/nodes/${cmdNodeId}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: cmdType,
          payload: parsedPayload,
          workspaceId: 'ws-angola-dev'
        })
      });

      const data = await res.json();
      if (data.commandId) {
        fetchStats();
      }
    } catch (err: any) {
      alert('Erro ao enviar comando: ' + err.message);
    } finally {
      setIsSendingCmd(false);
    }
  };

  // Enviar Webhook com Backoff
  const handleSendWebhookTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingWebhook(true);
    try {
      let payloadObj = {};
      try {
        payloadObj = JSON.parse(webhookPayload);
      } catch (err) {
        payloadObj = { data: webhookPayload };
      }

      const res = await fetch('/api/admin/retry-queue/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-founder-secret': 'vk_founder_root_secret_2026_angola',
          'x-user-role': 'founder',
          'x-user-email': 'silajaneiro9@gmail.com'
        },
        body: JSON.stringify({
          url: webhookUrl,
          payload: payloadObj
        })
      });

      const data = await res.json();
      if (data.jobId) {
        fetchStats();
      }
    } catch (err: any) {
      alert('Erro ao enfileirar webhook: ' + err.message);
    } finally {
      setIsSendingWebhook(false);
    }
  };

  // Test E2EE
  const handleEncryptE2ee = () => {
    try {
      const enc = encryptPayload(e2eeInput, e2eeSecret);
      setE2eeCiphertext(enc);
      setE2eeDecrypted('');
    } catch (err: any) {
      alert('Erro na encriptação: ' + err.message);
    }
  };

  const handleDecryptE2ee = () => {
    if (!e2eeCiphertext) return;
    try {
      const dec = decryptPayload(e2eeCiphertext, e2eeSecret);
      setE2eeDecrypted(dec);
    } catch (err: any) {
      setE2eeDecrypted('FALHA DE INTEGRIDADE (AuthTag incorreto ou chave desalinhada)');
    }
  };

  // Test Rate Limit
  const handleTestRateLimit = async () => {
    try {
      const res = await fetch('/api/events/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': testApiKey
        },
        body: JSON.stringify({
          workspaceId: 'ws-dev',
          nodeId: 'node-angola-01',
          events: [{ eventId: `evt-${Date.now()}`, type: 'HEARTBEAT' }]
        })
      });

      const remaining = res.headers.get('X-RateLimit-Remaining');
      const limit = res.headers.get('X-RateLimit-Limit');
      const reset = res.headers.get('X-RateLimit-Reset');
      const data = await res.json();

      setGatewayLogs((prev) => [
        {
          timestamp: Date.now(),
          status: res.status,
          remaining,
          limit,
          reset,
          data
        },
        ...prev
      ]);
    } catch (err: any) {
      console.error(err);
    }
  };

  const copyDevKeyToClipboard = () => {
    navigator.clipboard.writeText('vk_dev_client_master_secret_2026_angola');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl p-4 sm:p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-extrabold text-white tracking-tight">Consola Cliente Dev (Tempo Real)</h2>
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-indigo-500/40 uppercase font-bold">
                DEV CLIENT MODE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Acesso total bidirecional a Eventos, Comandos Outbound, Retry Queue e E2EE em tempo real.
            </p>
          </div>
        </div>

        {/* Realtime Stream Pulse Indicator */}
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-mono font-bold ${
            streamConnected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${streamConnected ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${streamConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span>{streamConnected ? 'SSE STREAM ATIVO (<5ms)' : 'RECONECTANDO STREAM...'}</span>
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              isPaused
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Retomar Stream' : 'Pausar Stream'}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-1">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Eventos Recebidos</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-amber-400 font-mono">{stats.totalEvents}</span>
            <Activity className="w-4 h-4 text-amber-400/60" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-1">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Comandos na Fila</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-indigo-400 font-mono">{stats.commandsPending}</span>
            <Send className="w-4 h-4 text-indigo-400/60" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-1">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Retries em Backoff</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-cyan-400 font-mono">{stats.retriesPending}</span>
            <RefreshCw className="w-4 h-4 text-cyan-400/60" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-1">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Dead Letter Queue</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-rose-400 font-mono">{stats.deadLetterCount}</span>
            <AlertTriangle className="w-4 h-4 text-rose-400/60" />
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'STREAM', label: 'Feed em Tempo Real (SSE)', icon: Terminal },
          { id: 'COMMANDS', label: 'Fila de Comandos Outbound', icon: Send },
          { id: 'RETRIES', label: 'Retry Queue & Webhooks', icon: RefreshCw },
          { id: 'DLQ_ALERTS', label: 'Alertas DLQ (Slack / Discord)', icon: Bell },
          { id: 'E2EE', label: 'Criptografia E2EE (AES-GCM)', icon: Lock },
          { id: 'GATEWAY', label: 'API Gateway & Rate Limit', icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS */}
      {/* 1. STREAM FEED TAB */}
      {activeTab === 'STREAM' && (
        <div className="space-y-4">
          {/* Action Trigger Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Simular Envio de Evento Descriptografado E2EE</span>
            </h3>
            <form onSubmit={handleSendInboundEvent} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                value={testNodeId}
                onChange={(e) => setTestNodeId(e.target.value)}
                placeholder="Node ID"
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
              <input
                type="text"
                value={testSender}
                onChange={(e) => setTestSender(e.target.value)}
                placeholder="Remetente / Telefone"
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Conteúdo do SMS / Notificação"
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white sm:col-span-1"
              />
              <button
                type="submit"
                disabled={isSendingEvent}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl px-4 py-2 flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-amber-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingEvent ? 'Enviando...' : 'Enviar Evento'}</span>
              </button>
            </form>
          </div>

          {/* Terminal Logs Window */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-300 space-y-2 h-96 overflow-y-auto shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-500 text-[10px]">
              <span>BARRAMENTO SSE TEMPO REAL (TOPICS: EVENTS, COMMANDS, RETRIES)</span>
              <button
                onClick={() => setStreamLogs([])}
                className="hover:text-rose-400 flex items-center space-x-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Limpar Consola</span>
              </button>
            </div>

            {streamLogs.length === 0 ? (
              <div className="py-16 text-center text-slate-600 space-y-2 font-sans">
                <Terminal className="w-8 h-8 mx-auto opacity-40 text-slate-500" />
                <p>A aguardar eventos em tempo real... O stream transmitirá SMS, Notificações e Comandos instantaneamente.</p>
              </div>
            ) : (
              streamLogs.map((item) => (
                <div key={item.id} className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-1 animate-fadeIn">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-400 flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      <span>[{item.topic}]</span>
                    </span>
                    <span className="text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <pre className="text-[11px] text-slate-300 whitespace-pre-wrap overflow-x-auto bg-slate-950 p-2 rounded-lg border border-slate-800/50">
                    {JSON.stringify(item.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {/* 2. OUTBOUND COMMANDS TAB */}
      {activeTab === 'COMMANDS' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
              <Send className="w-4 h-4 text-indigo-400" />
              <span>Enfileirar Comando Outbound para Agente Android</span>
            </h3>

            <form onSubmit={handleSendOutboundCommand} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">ID do Nó Android Target</label>
                  <input
                    type="text"
                    value={cmdNodeId}
                    onChange={(e) => setCmdNodeId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">Tipo de Comando</label>
                  <select
                    value={cmdType}
                    onChange={(e) => setCmdType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                  >
                    <option value="SEND_SMS">SEND_SMS (Enviar SMS via GSM)</option>
                    <option value="MAKE_CALL">MAKE_CALL (Iniciar Chamada Telefônica)</option>
                    <option value="SEND_WHATSAPP">SEND_WHATSAPP (Disparar Mensagem WA)</option>
                    <option value="EXECUTE_SHELL">EXECUTE_SHELL (Executar Script no Nó)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">Payload JSON do Comando</label>
                <textarea
                  value={cmdPayload}
                  onChange={(e) => setCmdPayload(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSendingCmd}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl py-2.5 flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
              >
                <Send className="w-4 h-4" />
                <span>{isSendingCmd ? 'Enfileirando...' : 'Adicionar à Fila do Agente (Enqueue)'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. RETRY QUEUE TAB */}
      {activeTab === 'RETRIES' && (
        <div className="space-y-4">
          {/* Persistence Engine Control Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Persistência de Fila (Zero-Data-Loss em Reinícios)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  A fila salva automaticamente o estado de jobs pendentes e DLQ em disco local, Redis ou DynamoDB.
                </p>
              </div>

              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                DRIVER ATIVO: {activePersistenceDriver.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { id: 'file', label: 'Local Disk Store (.data)', desc: 'Zero cost / Auto-Save', icon: '💾' },
                { id: 'redis', label: 'Redis Store', desc: 'REDIS_URL / Cluster', icon: '⚡' },
                { id: 'dynamodb', label: 'AWS DynamoDB', desc: 'AWS SDK Table', icon: '☁️' },
                { id: 'memory', label: 'Volatile In-Memory', desc: 'Apenas RAM', icon: '🧠' }
              ].map((driver) => (
                <button
                  key={driver.id}
                  onClick={() => handleChangePersistenceDriver(driver.id)}
                  disabled={isChangingDriver}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    activePersistenceDriver === driver.id
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{driver.icon}</span>
                    {activePersistenceDriver === driver.id && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-bold block">{driver.label}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{driver.desc}</span>
                  </div>
                </button>
              ))}
            </div>

            {persistenceFilePath && (
              <div className="text-[10px] font-mono text-slate-500 bg-slate-950 p-2 rounded-lg border border-slate-800/80 truncate">
                Snapshot Storage Path: <span className="text-slate-300">{persistenceFilePath}</span>
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              <span>Testar Disparo de Webhook com Exponential Backoff</span>
            </h3>

            <form onSubmit={handleSendWebhookTest} className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">Webhook URL de Destino</label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">Payload do Evento Webhook</label>
                <textarea
                  value={webhookPayload}
                  onChange={(e) => setWebhookPayload(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isSendingWebhook}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl py-2.5 flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-cyan-600/30"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{isSendingWebhook ? 'Enfileirando...' : 'Disparar Webhook (Exponential Backoff)'}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await fetch('/api/admin/retry-queue/force', { method: 'POST' });
                    fetchStats();
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Forçar Processamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3.5. DLQ ALERTS TAB */}
      {activeTab === 'DLQ_ALERTS' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-rose-400" />
                  <span>Configuração de Alertas Automáticos DLQ (Dead Letter Queue)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Notifica canais externos instantaneamente quando um Webhook falhar após o número máximo de retentativas.
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                  dlqAlertsEnabled
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}>
                  {dlqAlertsEnabled ? '● ALERTAS ATIVOS' : '○ ALERTAS PAUSADOS'}
                </span>
              </div>
            </div>

            {/* Status Message Notification */}
            {dlqStatusMessage && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-semibold text-amber-300">
                {dlqStatusMessage}
              </div>
            )}

            {/* Config Form */}
            <form onSubmit={handleSaveDlqConfig} className="space-y-4">
              <div className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  id="dlqEnabledCheck"
                  checked={dlqAlertsEnabled}
                  onChange={(e) => setDlqAlertsEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
                <label htmlFor="dlqEnabledCheck" className="text-xs font-bold text-slate-200 cursor-pointer">
                  Habilitar Disparo de Alertas de DLQ em Tempo Real
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
                    <span>Slack Incoming Webhook URL</span>
                    <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noreferrer" className="text-[10px] text-sky-400 hover:underline flex items-center gap-1">
                      <span>Documentação Slack</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </label>
                  <input
                    type="url"
                    value={slackWebhookUrl}
                    onChange={(e) => setSlackWebhookUrl(e.target.value)}
                    placeholder="https://hooks.slack.com/services/T00/B00/XXXXX"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Recebe mensagem rica formatada com status, URL e erro.</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
                    <span>Discord Webhook URL</span>
                    <a href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks" target="_blank" rel="noreferrer" className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1">
                      <span>Documentação Discord</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </label>
                  <input
                    type="url"
                    value={discordWebhookUrl}
                    onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/12345/XXXXX"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Recebe embed com bot de alertas e timestamp oficial.</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                  Custom HTTP Webhook URL (Opcional)
                </label>
                <input
                  type="url"
                  value={customDlqWebhookUrl}
                  onChange={(e) => setCustomDlqWebhookUrl(e.target.value)}
                  placeholder="https://api.empresa.co.ao/v1/dlq/webhook"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSavingDlqConfig}
                  className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl px-5 py-2.5 flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-rose-600/30"
                >
                  <Bell className="w-4 h-4" />
                  <span>{isSavingDlqConfig ? 'Salvando Configuração...' : 'Salvar Configurações de Alerta'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerTestDlqAlert}
                  disabled={isTestingDlqAlert}
                  className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl px-5 py-2.5 flex items-center justify-center space-x-2 transition-all cursor-pointer border border-amber-500/30"
                >
                  <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>{isTestingDlqAlert ? 'Enviando Alerta de Teste...' : 'Disparar Alerta de Teste DLQ Agora'}</span>
                </button>
              </div>
            </form>

            {/* DLQ Alert Logs Section */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-rose-400" />
                  <span>Histórico Recente de Disparos de Alertas DLQ</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">{dlqAlertLogs.length} Alertas Registrados</span>
              </div>

              {dlqAlertLogs.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center text-slate-500 text-xs">
                  Nenhum alerta DLQ foi disparado ainda nesta sessão. Clique em &quot;Disparar Alerta de Teste&quot; para validar.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {dlqAlertLogs.map((log) => (
                    <div key={log.id} className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1.5 font-mono text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className={`font-extrabold px-2 py-0.5 rounded text-[10px] ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : log.status === 'PARTIAL'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {log.status}
                        </span>
                        <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>

                      <div className="text-slate-300">
                        <span className="text-slate-500">URL:</span> {log.url}
                      </div>

                      <div className="flex items-center justify-between text-slate-400 text-[10px]">
                        <span>Job: <strong className="text-slate-200">{log.jobId}</strong></span>
                        <span>Canais: <strong className="text-indigo-300">{log.channelsSent?.join(', ') || 'Nenhum'}</strong></span>
                      </div>

                      <div className="text-rose-400/90 text-[10px] bg-rose-500/5 p-1.5 rounded border border-rose-500/10 truncate">
                        Erro: {log.lastError}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. E2EE TESTER TAB */}
      {activeTab === 'E2EE' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Testador de Criptografia AES-256-GCM End-to-End</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">Chave Mestra Derivada (Secret)</label>
                <input
                  type="text"
                  value={e2eeSecret}
                  onChange={(e) => setE2eeSecret(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">Texto Claro (JSON Payload)</label>
                <textarea
                  value={e2eeInput}
                  onChange={(e) => setE2eeInput(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleEncryptE2ee}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl py-2.5 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Encriptar (Encrypt AES-256-GCM)</span>
                </button>

                <button
                  onClick={handleDecryptE2ee}
                  disabled={!e2eeCiphertext}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl py-2.5 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Descriptografar (Decrypt & Verify AuthTag)</span>
                </button>
              </div>

              {e2eeCiphertext && (
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl font-mono text-[11px] space-y-1">
                  <span className="text-emerald-400 font-bold block">Ciphertext Gerado:</span>
                  <p className="text-slate-300 break-all">IV: {e2eeCiphertext.iv}</p>
                  <p className="text-slate-300 break-all">AuthTag: {e2eeCiphertext.authTag}</p>
                  <p className="text-slate-400 break-all">Payload Encriptado: {e2eeCiphertext.ciphertext}</p>
                </div>
              )}

              {e2eeDecrypted && (
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl font-mono text-[11px]">
                  <span className="text-amber-400 font-bold block">Resultado Descriptografado:</span>
                  <pre className="text-slate-200 mt-1">{e2eeDecrypted}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. API GATEWAY TAB */}
      {activeTab === 'GATEWAY' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Simulador de API Gateway & Rate Limiting Sliding Window</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">API Key para Teste de Rate Limit</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={testApiKey}
                    onChange={(e) => setTestApiKey(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                  />
                  <button
                    onClick={handleTestRateLimit}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl px-4 py-2 transition-all cursor-pointer"
                  >
                    Fazer Requisição
                  </button>
                </div>
              </div>

              {gatewayLogs.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Histórico de Requisições Gateway</span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {gatewayLogs.map((log, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl font-mono text-[11px] flex items-center justify-between">
                        <span className={`font-bold ${log.status === 200 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          HTTP {log.status}
                        </span>
                        <span className="text-slate-400">Restante: {log.remaining}/{log.limit} reqs</span>
                        <span className="text-slate-500">Reset em: {log.reset}s</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Credentials Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-cyan-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <Key className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <span className="font-extrabold text-xs text-white block">Credenciais Mestas do Usuário Cliente Dev</span>
            <span className="text-[11px] text-slate-400 block font-mono">
              Chave Mestra COS: vitronis-super-secret-2026 | Tier: DEV_FULL_ACCESS
            </span>
          </div>
        </div>

        <button
          onClick={copyDevKeyToClipboard}
          className="bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer shrink-0"
        >
          {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
          <span>{copiedKey ? 'Chave Copiada!' : 'Copiar Secret Mestre'}</span>
        </button>
      </div>
    </div>
  );
};
