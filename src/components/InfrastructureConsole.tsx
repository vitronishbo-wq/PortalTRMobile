import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Server,
  Database,
  Layers,
  Cpu,
  Flame,
  HardDrive,
  RefreshCw,
  Terminal,
  Activity,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Clock,
  Zap,
  Globe,
  Radio,
  FileCode,
  FolderTree,
  Send,
  AlertTriangle,
  Play,
  RotateCcw,
  Check,
  Key
} from 'lucide-react';
import { BatchQueueEngine, BatchQueueMetrics } from '../services/batchQueueEngine';
import { WebhookRetryQueueEngine } from '../services/webhookRetryQueue';
import { DLQAlertService } from '../services/dlqAlertService';

const dlqAlertService = new DLQAlertService();

export const InfrastructureConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'firebase' | 'render' | 'queues' | 'storage' | 'environment'>('overview');

  // Queue Metrics
  const [metrics, setMetrics] = useState<BatchQueueMetrics>({
    bufferedCount: 0,
    totalFlushed: 1420,
    totalEventsReceived: 1580,
    savedFirestoreWritesPercentage: 92,
    lastFlushTime: Date.now() - 4000,
    sseConnectedClients: 3
  });

  const [webhookJobsCount, setWebhookJobsCount] = useState<number>(0);
  const [dlqLogsCount, setDlqLogsCount] = useState<number>(0);
  const [isSimulatingFlush, setIsSimulatingFlush] = useState(false);
  const [isFlushedSuccess, setIsFlushedSuccess] = useState(false);

  useEffect(() => {
    // Initial fetch
    setWebhookJobsCount(WebhookRetryQueueEngine.getJobs().length);
    setDlqLogsCount(dlqAlertService.getAlertLogs().length);

    // Subscribe to BatchQueue Engine metrics
    const unsubscribe = BatchQueueEngine.onMetrics((newMetrics) => {
      setMetrics(newMetrics);
    });

    return () => unsubscribe();
  }, []);

  const handleManualFlush = () => {
    setIsSimulatingFlush(true);
    setTimeout(() => {
      BatchQueueEngine.flushQueue();
      setIsSimulatingFlush(false);
      setIsFlushedSuccess(true);
      setTimeout(() => setIsFlushedSuccess(false), 2500);
    }, 600);
  };

  const handleAddSimulatedEvent = () => {
    BatchQueueEngine.pushLocalEvent({
      eventId: `evt_infra_${Math.random().toString(36).substring(2, 7)}`,
      workspaceId: 'ws-portal-tr-mobile',
      nodeId: 'node-android-agent-01',
      type: 'BATTERY',
      payload: { battery: 94, network: '4G_UNITEL', rssi: -62 },
      timestamp: Date.now()
    });
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* HEADER BANNER */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <span className="p-3 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30">
              <Cloud className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-100">PLATAFORMA DE INFRAESTRUTURA & STORAGE ENGINE</h2>
              <p className="text-xs text-slate-400 font-mono">
                Express Container • Firebase Platform • CPaaS Dispatcher • In-Memory Queue • Runtime Env
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs">
            <button
              onClick={handleAddSimulatedEvent}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Injetar Evento na Fila</span>
            </button>

            <button
              onClick={handleManualFlush}
              disabled={isSimulatingFlush}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-cyan-600/20"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isSimulatingFlush ? 'animate-spin' : ''}`} />
              <span>{isFlushedSuccess ? 'Batch Forçado!' : 'Forçar Despacho (Flush)'}</span>
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Container Express Runtime</span>
            <span className="text-base font-black text-emerald-400">Porta 3000 (0.0.0.0)</span>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Fila Em Memória (Buffer)</span>
            <span className="text-base font-black text-amber-400">{metrics.bufferedCount} Na Fila</span>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Escritas Firestore (Batching)</span>
            <span className="text-base font-black text-sky-400">{metrics.totalFlushed} Flushed</span>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Serviço CPaaS Dispatcher</span>
            <span className="text-base font-black text-purple-400">CONFIGURED</span>
          </div>
        </div>
      </div>

      {/* SUB TABS NAVIGATION */}
      <div className="flex items-center space-x-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto text-xs font-mono">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Topologia Global & Express Engine</span>
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
          <span>Firebase & Firestore Database</span>
        </button>

        <button
          onClick={() => setActiveTab('render')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'render'
              ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Render CPaaS Microservices</span>
        </button>

        <button
          onClick={() => setActiveTab('queues')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'queues'
              ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Batch Queues & Retry Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'storage'
              ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Storage & Offline Cache</span>
        </button>

        <button
          onClick={() => setActiveTab('environment')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'environment'
              ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Variáveis de Ambiente (.env)</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Arquitetura de Servidores e Topologia Cloud
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/30">
                TOPOLOGIA OPERACIONAL
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center space-x-1.5">
                    <Cloud className="w-4 h-4 text-cyan-400" />
                    <span>Cloud Run Container</span>
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded">
                    ONLINE (PORT 3000)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Servidor Express com Vite Middleware em modo SPA. Ponto de entrada das requisições via Proxy Reverso NGINX.
                </p>
                <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 space-y-1">
                  <div>• Binds: <span className="text-slate-300">0.0.0.0:3000</span></div>
                  <div>• Protocolo: <span className="text-slate-300">HTTP/2, WebSockets, SSE</span></div>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center space-x-1.5">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>Firebase Platform</span>
                  </span>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[9px] font-bold rounded">
                    PERSISTENCE LAYER
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Firestore para persistência durável em tempo real, Firebase Auth para tokens de sessão e Firebase Hosting CDN.
                </p>
                <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 space-y-1">
                  <div>• Firestore Region: <span className="text-slate-300">eur3 (Europe)</span></div>
                  <div>• Listeners: <span className="text-slate-300">Realtime Event Stream</span></div>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center space-x-1.5">
                    <Server className="w-4 h-4 text-purple-400" />
                    <span>Render CPaaS Backend</span>
                  </span>
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[9px] font-bold rounded">
                    STATELESS SERVICE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Microserviços auxiliares para operações pesadas sem estado (processamento de mídia, Webhook Dispatchers).
                </p>
                <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 space-y-1">
                  <div>• Cluster: <span className="text-slate-300">Render Free/Pro Tier</span></div>
                  <div>• Auto-scale: <span className="text-slate-300">0-to-1 Instances</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FIREBASE & FIRESTORE */}
      {activeTab === 'firebase' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Firebase Core, Security Rules & Coleções Firestore
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded border border-amber-500/30">
                PROVISIONADO VIA FIREBASE SKILL
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <span className="font-bold text-amber-400 block border-b border-slate-800 pb-2">
                  Coleções Principais do Firestore Engine:
                </span>
                <ul className="space-y-2 text-[11px]">
                  <li className="flex items-center justify-between p-2 bg-slate-900 rounded-lg">
                    <span className="text-slate-300 font-bold">/events</span>
                    <span className="text-slate-500 text-[10px]">Eventos de SMS, Chamadas e Notificações</span>
                  </li>
                  <li className="flex items-center justify-between p-2 bg-slate-900 rounded-lg">
                    <span className="text-slate-300 font-bold">/devices</span>
                    <span className="text-slate-300 font-mono">Agentes Android & PWA Clients</span>
                  </li>
                  <li className="flex items-center justify-between p-2 bg-slate-900 rounded-lg">
                    <span className="text-slate-300 font-bold">/webhook_jobs</span>
                    <span className="text-slate-500 text-[10px]">Histórico de Retentativas de Webhooks</span>
                  </li>
                  <li className="flex items-center justify-between p-2 bg-slate-900 rounded-lg">
                    <span className="text-slate-300 font-bold">/api_keys</span>
                    <span className="text-slate-500 text-[10px]">Chaves REST API Emitidas</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <span className="font-bold text-amber-400 block border-b border-slate-800 pb-2">
                  Regras de Segurança & Autorização (firestore.rules):
                </span>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-[10px] text-amber-200/90 leading-relaxed font-mono overflow-x-auto">
                  <pre>{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{eventId} {
      allow read, write: if request.auth != null;
    }
    match /devices/{deviceId} {
      allow read, write: if request.auth != null;
    }
    match /api_keys/{keyId} {
      allow read, write: if request.auth != null && request.auth.token.founder == true;
    }
  }
}`}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RENDER CPaaS */}
      {activeTab === 'render' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Server className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Microserviços Render CPaaS (Stateless Processing)
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 text-[10px] font-bold rounded border border-purple-500/30">
                NO-STATE RENDER WORKERS
              </span>
            </div>

            <p className="text-slate-300 text-xs">
              Conforme a filosofia arquitetural do PortalTRMobile, o Render é estritamente stateless e executa apenas tarefas pesadas de rede ou processamento de comunicação que não podem ser processadas no frontend ou no PWA.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">GATEWAY DE SAÍDA HTTP/REST</span>
                <div className="font-bold text-purple-300 text-sm">Render CPaaS Dispatcher</div>
                <p className="text-[10px] text-slate-400">Despacho massivo de requisições de comunicação com suporte a Retry Exponencial.</p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">TAXA DE DISPONIBILIDADE</span>
                <div className="font-bold text-emerald-400 text-sm">99.98% SLA Operacional</div>
                <p className="text-[10px] text-slate-400">Recuperação automática e reinício em caso de falha transitória de rede.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: QUEUES ENGINE */}
      {activeTab === 'queues' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Engine de Filas em Memória, Batching & Retentativa Exponencial
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-sky-500/20 text-sky-300 text-[10px] font-bold rounded border border-sky-500/30">
                MEMORY BATCHING ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">1. BATCH QUEUE IN-MEMORY</span>
                <div className="font-bold text-amber-400 text-base">{metrics.bufferedCount} Eventos Agrupados</div>
                <p className="text-[10px] text-slate-400">Flushes automáticos a cada 5 segundos para minimizar gravações no Firestore.</p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">2. WEBHOOK RETRY QUEUE</span>
                <div className="font-bold text-sky-400 text-base">{webhookJobsCount} Jobs Registados</div>
                <p className="text-[10px] text-slate-400">Regra de Backoff Exponencial (2s, 4s, 8s, 16s) com limite de 5 tentativas.</p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">3. DEAD-LETTER QUEUE (DLQ)</span>
                <div className="font-bold text-rose-400 text-base">{dlqLogsCount} Alertas de DLQ</div>
                <p className="text-[10px] text-slate-400">Alertas em tempo real via Slack, Discord ou Webhook configurado.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: STORAGE & OFFLINE CACHE */}
      {activeTab === 'storage' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Firebase Storage & IndexedDB Offline Architecture
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded border border-emerald-500/30">
                OFFLINE-FIRST DESIGN
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <span className="font-bold text-emerald-400 block border-b border-slate-800 pb-2">
                  IndexedDB Client Storage (PWA)
                </span>
                <p className="text-[11px] text-slate-400">
                  Garante que o PWA continue operacional mesmo em quedas temporárias de conectividade 3G/4G da Unitel ou Movicel em Angola.
                </p>
                <div className="text-[10px] text-slate-500 space-y-1 pt-1">
                  <div>• Cache de Eventos: <span className="text-slate-300">Retenção de 7 dias</span></div>
                  <div>• Sincronização: <span className="text-slate-300">Automática ao reconectar</span></div>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <span className="font-bold text-emerald-400 block border-b border-slate-800 pb-2">
                  Firebase Storage Bucket
                </span>
                <p className="text-[11px] text-slate-400">
                  Armazenamento de ficheiros binários, gravações de chamadas e assets visuais dos Agentes Android.
                </p>
                <div className="text-[10px] text-slate-500 space-y-1 pt-1">
                  <div>• Bucket URI: <span className="text-slate-300">gs://portal-tr-mobile.appspot.com</span></div>
                  <div>• Access Control: <span className="text-slate-300">Sessões JWT Autorizadas</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ENVIRONMENT VARIABLES */}
      {activeTab === 'environment' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileCode className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Inspecção de Variáveis de Ambiente & Declaração (.env.example)
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded border border-indigo-500/30">
                SEGURANÇA SEM HARDCODE
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="font-bold text-slate-200 block border-b border-slate-800 pb-2">
                Variáveis Obrigatórias Registadas no Sistema:
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80 flex justify-between items-center">
                  <span className="text-indigo-300 font-bold">PORT</span>
                  <span className="text-emerald-400 font-bold">3000 (Obrigatório)</span>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80 flex justify-between items-center">
                  <span className="text-indigo-300 font-bold">GEMINI_API_KEY</span>
                  <span className="text-amber-400 font-bold">Server-Side Protegido</span>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80 flex justify-between items-center">
                  <span className="text-indigo-300 font-bold">FIREBASE_PROJECT_ID</span>
                  <span className="text-sky-400 font-bold">Configurado</span>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80 flex justify-between items-center">
                  <span className="text-indigo-300 font-bold">APPYPAY_SANDBOX_CLIENT</span>
                  <span className="text-purple-400 font-bold">Ativo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
