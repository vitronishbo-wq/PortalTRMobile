import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { PortalEvent, Device, KeepAliveConfig, PingLog, FirestoreConfig } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database State with Seed Data
let firestoreConfig: FirestoreConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyA_SampleKeyPortalMobile2026',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'portal-mobile-demo.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'portal-mobile-demo',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'portal-mobile-demo.appspot.com',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '1029384756',
  appId: process.env.FIREBASE_APP_ID || '1:1029384756:web:abcd1234efgh5678',
  connected: true,
  mode: 'local'
};

let keepAliveConfig: KeepAliveConfig = {
  targetUrl: process.env.RENDER_URL || 'https://portal-backend.onrender.com/api/ping',
  enabled: true,
  intervalMinutes: 10,
  latencyThresholdMs: 1500,
  adminEmail: 'trumanmarcelo@gmail.com',
  adminWhatsapp: '+244948323383',
  lastPingTime: Date.now() - 3 * 60 * 1000,
  lastPingStatus: 200,
  lastLatencyMs: 84,
  totalPings: 42,
  successfulPings: 42,
  failedPings: 0
};

let pingLogs: PingLog[] = [
  {
    id: 'log-1',
    timestamp: Date.now() - 3 * 60 * 1000,
    status: 200,
    latencyMs: 84,
    url: keepAliveConfig.targetUrl,
    message: 'Render instance pinged successfully. Host kept warm.',
    success: true
  },
  {
    id: 'log-2',
    timestamp: Date.now() - 13 * 60 * 1000,
    status: 200,
    latencyMs: 91,
    url: keepAliveConfig.targetUrl,
    message: 'Render instance pinged successfully. Host kept warm.',
    success: true
  },
  {
    id: 'log-3',
    timestamp: Date.now() - 23 * 60 * 1000,
    status: 200,
    latencyMs: 78,
    url: keepAliveConfig.targetUrl,
    message: 'Render instance pinged successfully. Host kept warm.',
    success: true
  }
];

let devices: Device[] = [
  {
    deviceId: 'dev-pixel-8',
    uid: 'usr-default',
    name: 'Google Pixel 8 Pro',
    model: 'Pixel 8 Pro (Android 14)',
    osVersion: 'Android 14 (API 34)',
    lastSync: Date.now() - 2 * 60 * 1000,
    online: true,
    batteryLevel: 88,
    pairedAt: Date.now() - 7 * 24 * 3600 * 1000
  },
  {
    deviceId: 'dev-samsung-s23',
    uid: 'usr-default',
    name: 'Samsung Galaxy S23',
    model: 'SM-S911B (One UI 6)',
    osVersion: 'Android 14 (API 34)',
    lastSync: Date.now() - 45 * 60 * 1000,
    online: true,
    batteryLevel: 62,
    pairedAt: Date.now() - 14 * 24 * 3600 * 1000
  }
];

const mockApps = [
  { app: 'WhatsApp', packageName: 'com.whatsapp', priority: 'critical', type: 'notification' },
  { app: 'Banco do Brasil', packageName: 'br.com.bb.app', priority: 'critical', type: 'notification' },
  { app: 'SMS', packageName: 'com.google.android.apps.messaging', priority: 'high', type: 'sms' },
  { app: 'Chamada Telefônica', packageName: 'com.google.android.dialer', priority: 'high', type: 'call' },
  { app: 'Nubank', packageName: 'com.nu.production', priority: 'critical', type: 'notification' },
  { app: 'Telegram', packageName: 'org.telegram.messenger', priority: 'normal', type: 'notification' },
  { app: 'Instagram', packageName: 'com.instagram.android', priority: 'low', type: 'notification' },
  { app: 'Gmail', packageName: 'com.google.android.gm', priority: 'normal', type: 'notification' },
  { app: 'Sistema', packageName: 'android', priority: 'low', type: 'system' }
];

let events: PortalEvent[] = [
  {
    id: 'evt-101',
    uid: 'usr-default',
    deviceId: 'dev-pixel-8',
    deviceName: 'Google Pixel 8 Pro',
    app: 'WhatsApp',
    packageName: 'com.whatsapp',
    title: 'Maria Silva',
    text: 'Envei os relatórios financeiros do projeto para revisão. Consegue dar uma olhada?',
    sender: 'Maria Silva',
    timestamp: Date.now() - 5 * 60 * 1000,
    priority: 'critical',
    type: 'notification',
    read: false,
    favorite: true
  },
  {
    id: 'evt-102',
    uid: 'usr-default',
    deviceId: 'dev-pixel-8',
    deviceName: 'Google Pixel 8 Pro',
    app: 'Banco do Brasil',
    packageName: 'br.com.bb.app',
    title: 'Pix Recebido',
    text: 'Você recebeu um Pix de R$ 450,00 de Carlos Santos.',
    sender: 'Banco do Brasil',
    timestamp: Date.now() - 18 * 60 * 1000,
    priority: 'critical',
    type: 'notification',
    read: false,
    favorite: false
  },
  {
    id: 'evt-103',
    uid: 'usr-default',
    deviceId: 'dev-samsung-s23',
    deviceName: 'Samsung Galaxy S23',
    app: 'SMS',
    packageName: 'com.google.android.apps.messaging',
    title: 'Código de Autenticação 2FA',
    text: 'Seu código de acesso temporário é 849-204. Válido por 5 minutos.',
    sender: '+55 11 99887-1234',
    timestamp: Date.now() - 32 * 60 * 1000,
    priority: 'high',
    type: 'sms',
    read: true,
    favorite: true
  },
  {
    id: 'evt-104',
    uid: 'usr-default',
    deviceId: 'dev-pixel-8',
    deviceName: 'Google Pixel 8 Pro',
    app: 'Chamada Telefônica',
    packageName: 'com.google.android.dialer',
    title: 'Chamada Perdida',
    text: 'Chamada não atendida de Dra. Beatriz (Consultório).',
    sender: '+55 21 98112-9900',
    timestamp: Date.now() - 1 * 3600 * 1000,
    priority: 'high',
    type: 'call',
    read: true,
    favorite: false
  },
  {
    id: 'evt-105',
    uid: 'usr-default',
    deviceId: 'dev-pixel-8',
    deviceName: 'Google Pixel 8 Pro',
    app: 'Nubank',
    packageName: 'com.nu.production',
    title: 'Compra no Cartão Aprovada',
    text: 'Compra aprovada no valor de R$ 89,90 em RESTAURANTE SABOR REAL.',
    sender: 'Nubank',
    timestamp: Date.now() - 2.5 * 3600 * 1000,
    priority: 'critical',
    type: 'notification',
    read: true,
    favorite: false
  },
  {
    id: 'evt-106',
    uid: 'usr-default',
    deviceId: 'dev-samsung-s23',
    deviceName: 'Samsung Galaxy S23',
    app: 'Telegram',
    packageName: 'org.telegram.messenger',
    title: 'Grupo DevOps Brasil',
    text: 'Deploy no Render concluído com sucesso via GitHub Actions e webhook automatizado.',
    sender: 'Grupo DevOps',
    timestamp: Date.now() - 4 * 3600 * 1000,
    priority: 'normal',
    type: 'notification',
    read: true,
    favorite: true
  },
  {
    id: 'evt-107',
    uid: 'usr-default',
    deviceId: 'dev-pixel-8',
    deviceName: 'Google Pixel 8 Pro',
    app: 'Gmail',
    packageName: 'com.google.android.gm',
    title: 'GitHub Security Alert',
    text: 'A new personal access token was created for repository portal-mobile-prod.',
    sender: 'notifications@github.com',
    timestamp: Date.now() - 6 * 3600 * 1000,
    priority: 'normal',
    type: 'notification',
    read: true,
    favorite: false
  },
  {
    id: 'evt-108',
    uid: 'usr-default',
    deviceId: 'dev-pixel-8',
    deviceName: 'Google Pixel 8 Pro',
    app: 'Sistema',
    packageName: 'android',
    title: 'Bateria em 15%',
    text: 'Conecte o carregador para evitar o desligamento do dispositivo.',
    sender: 'Android OS',
    timestamp: Date.now() - 8 * 3600 * 1000,
    priority: 'low',
    type: 'system',
    read: true,
    favorite: false
  }
];

// Helper to trigger Keep-Alive Ping
async function executeKeepAlivePing(reason: string = 'Scheduled Heartbeat'): Promise<PingLog> {
  const startTime = Date.now();
  let status = 200;
  let success = true;
  let message = '';

  try {
    const target = keepAliveConfig.targetUrl || `http://localhost:${PORT}/api/ping`;
    
    if (target.startsWith('http://localhost') || target.startsWith('http://127.0.0.1')) {
      // Internal ping
      status = 200;
      message = `Internal Keep-Alive check executed (${reason}). Service operational.`;
    } else {
      // External HTTP request to Keep Render Awake
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch(target, { 
          method: 'GET', 
          headers: { 'User-Agent': 'PortalMobile-KeepAlivePinger/1.0' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        status = response.status;
        success = response.ok;
        message = response.ok 
          ? `Render host keep-alive ping succeeded (${status}). Host active.`
          : `Render host returned HTTP ${status}.`;
      } catch (err: any) {
        clearTimeout(timeoutId);
        status = 503;
        success = false;
        message = `Ping failed or timed out: ${err.message || 'Network unreachable'}. Fallback simulation active.`;
      }
    }
  } catch (e: any) {
    status = 500;
    success = false;
    message = `Ping execution error: ${e.message}`;
  }

  const latencyMs = Math.floor(Math.max(12, Date.now() - startTime));
  const newLog: PingLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
    status,
    latencyMs,
    url: keepAliveConfig.targetUrl,
    message,
    success
  };

  // Update Config Metrics
  keepAliveConfig.lastPingTime = Date.now();
  keepAliveConfig.lastPingStatus = status;
  keepAliveConfig.lastLatencyMs = latencyMs;
  keepAliveConfig.totalPings += 1;
  if (success) {
    keepAliveConfig.successfulPings += 1;
  } else {
    keepAliveConfig.failedPings += 1;
  }

  pingLogs.unshift(newLog);
  if (pingLogs.length > 50) {
    pingLogs = pingLogs.slice(0, 50);
  }

  return newLog;
}

// Background Interval - Runs keep alive auto-pinger every 5 minutes
setInterval(() => {
  if (keepAliveConfig.enabled) {
    executeKeepAlivePing('Autonomous 5-min Render Keep-Alive Cron');
  }
}, 5 * 60 * 1000);

// API ROUTES
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    service: 'Portal Mobile Backend',
    renderKeepAlive: keepAliveConfig
  });
});

app.get('/api/ping', (req, res) => {
  res.json({
    pong: true,
    message: 'Render instance is awake and responsive',
    timestamp: Date.now()
  });
});

// KEEP ALIVE ENDPOINTS
app.get('/api/keep-alive', (req, res) => {
  res.json({
    config: keepAliveConfig,
    logs: pingLogs
  });
});

app.post('/api/keep-alive/config', (req, res) => {
  const { targetUrl, enabled, intervalMinutes, latencyThresholdMs, adminEmail, adminWhatsapp } = req.body;
  if (typeof targetUrl === 'string') keepAliveConfig.targetUrl = targetUrl;
  if (typeof enabled === 'boolean') keepAliveConfig.enabled = enabled;
  if (typeof intervalMinutes === 'number' && intervalMinutes > 0) {
    keepAliveConfig.intervalMinutes = intervalMinutes;
  }
  if (typeof latencyThresholdMs === 'number' && latencyThresholdMs > 0) {
    keepAliveConfig.latencyThresholdMs = latencyThresholdMs;
  }
  if (typeof adminEmail === 'string') keepAliveConfig.adminEmail = adminEmail;
  if (typeof adminWhatsapp === 'string') keepAliveConfig.adminWhatsapp = adminWhatsapp;

  res.json({ success: true, config: keepAliveConfig });
});

app.post('/api/keep-alive/trigger', async (req, res) => {
  const log = await executeKeepAlivePing('Manual User Trigger');
  res.json({ success: true, log, config: keepAliveConfig });
});

app.delete('/api/keep-alive/logs', (req, res) => {
  pingLogs = [];
  res.json({ success: true, message: 'Keep-alive logs cleared' });
});

// EVENTS ENDPOINTS
app.get('/api/events', (req, res) => {
  const { search, app: filterApp, priority, type, favorites, unread, deviceId } = req.query;

  let filtered = [...events];

  if (search && typeof search === 'string' && search.trim() !== '') {
    const query = search.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.title.toLowerCase().includes(query) ||
        e.text.toLowerCase().includes(query) ||
        e.app.toLowerCase().includes(query) ||
        (e.sender && e.sender.toLowerCase().includes(query))
    );
  }

  if (filterApp && typeof filterApp === 'string' && filterApp !== 'all') {
    filtered = filtered.filter((e) => e.app === filterApp);
  }

  if (priority && typeof priority === 'string' && priority !== 'all') {
    filtered = filtered.filter((e) => e.priority === priority);
  }

  if (type && typeof type === 'string' && type !== 'all') {
    filtered = filtered.filter((e) => e.type === type);
  }

  if (favorites === 'true') {
    filtered = filtered.filter((e) => e.favorite);
  }

  if (unread === 'true') {
    filtered = filtered.filter((e) => !e.read);
  }

  if (deviceId && typeof deviceId === 'string' && deviceId !== 'all') {
    filtered = filtered.filter((e) => e.deviceId === deviceId);
  }

  filtered.sort((a, b) => b.timestamp - a.timestamp);

  res.json({
    events: filtered,
    total: filtered.length,
    unreadCount: events.filter((e) => !e.read).length
  });
});

app.post('/api/events', (req, res) => {
  const body = req.body;
  const newEvent: PortalEvent = {
    id: body.id || `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    uid: body.uid || 'usr-default',
    deviceId: body.deviceId || 'dev-pixel-8',
    deviceName: body.deviceName || 'Google Pixel 8 Pro',
    app: body.app || 'WhatsApp',
    packageName: body.packageName || 'com.whatsapp',
    title: body.title || 'Nova Notificação',
    text: body.text || 'Conteúdo da notificação capturada.',
    sender: body.sender,
    timestamp: body.timestamp || Date.now(),
    priority: body.priority || 'normal',
    type: body.type || 'notification',
    read: false,
    favorite: false
  };

  events.unshift(newEvent);
  res.status(201).json({ success: true, event: newEvent });
});

app.put('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const index = events.findIndex((e) => e.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }

  events[index] = { ...events[index], ...req.body };
  res.json({ success: true, event: events[index] });
});

app.delete('/api/events/:id', (req, res) => {
  const { id } = req.params;
  events = events.filter((e) => e.id !== id);
  res.json({ success: true, id });
});

app.post('/api/events/read-all', (req, res) => {
  events = events.map((e) => ({ ...e, read: true }));
  res.json({ success: true, count: events.length });
});

app.delete('/api/events', (req, res) => {
  events = [];
  res.json({ success: true, message: 'All events deleted' });
});

// DEVICE ENDPOINTS
app.get('/api/devices', (req, res) => {
  res.json(devices);
});

app.post('/api/devices', (req, res) => {
  const newDevice: Device = {
    deviceId: req.body.deviceId || `dev-${Date.now()}`,
    uid: req.body.uid || 'usr-default',
    name: req.body.name || 'Novo Dispositivo Android',
    model: req.body.model || 'Android Device',
    osVersion: req.body.osVersion || 'Android 14',
    lastSync: Date.now(),
    online: true,
    batteryLevel: req.body.batteryLevel || 100,
    pairedAt: Date.now()
  };

  devices.push(newDevice);
  res.status(201).json({ success: true, device: newDevice });
});

app.delete('/api/devices/:id', (req, res) => {
  const { id } = req.params;
  devices = devices.filter((d) => d.deviceId !== id);
  res.json({ success: true, id });
});

// STATS ENDPOINT
app.get('/api/stats', (req, res) => {
  const appMap: Record<string, number> = {};
  const priorityMap: Record<string, number> = {};

  events.forEach((e) => {
    appMap[e.app] = (appMap[e.app] || 0) + 1;
    priorityMap[e.priority] = (priorityMap[e.priority] || 0) + 1;
  });

  const appDistribution = Object.keys(appMap).map((k) => ({ name: k, count: appMap[k] }));
  const priorityDistribution = Object.keys(priorityMap).map((k) => ({ name: k, count: priorityMap[k] }));

  // Generate timeline for last 7 hours
  const timelineData = Array.from({ length: 6 }).map((_, i) => {
    const hourLabel = `${(new Date().getHours() - (5 - i) + 24) % 24}:00`;
    return {
      time: hourLabel,
      count: Math.floor(Math.random() * 8) + 1
    };
  });

  res.json({
    totalEvents: events.length,
    unreadCount: events.filter((e) => !e.read).length,
    favoriteCount: events.filter((e) => e.favorite).length,
    deviceCount: devices.length,
    appDistribution,
    priorityDistribution,
    timelineData
  });
});

// EVENT SIMULATOR
app.post('/api/simulator/generate', (req, res) => {
  const sample = mockApps[Math.floor(Math.random() * mockApps.length)];
  const randomDevice = devices[Math.floor(Math.random() * devices.length)] || devices[0];

  const sampleMessages: Record<string, { title: string; text: string; sender: string }> = {
    'WhatsApp': { title: 'Ana Beatriz', text: 'Cheguei no local do evento! Pode me mandar o comprovante?', sender: 'Ana Beatriz' },
    'Banco do Brasil': { title: 'Notificação de Saldo', text: 'Seu extrato mensal já está disponível para consulta no App BB.', sender: 'Banco do Brasil' },
    'SMS': { title: 'SMS Recebido', text: 'Seu código de segurança Mercado Pago é: 918204. Não compartilhe.', sender: '+55 11 98820-1122' },
    'Chamada Telefônica': { title: 'Chamada do Sistema', text: 'Chamada recebida e encerrada (Duração: 02 min 14 seg).', sender: '+55 11 3003-0000' },
    'Nubank': { title: 'Transferência Recebida', text: 'Você recebeu R$ 120,00 de Marcos Oliveira via Pix.', sender: 'Nubank' },
    'Telegram': { title: 'Alerta Render Cron', text: 'Serviço Render mantido ativo com sucesso via Keep-Alive Heartbeat.', sender: 'Bot Render' },
    'Instagram': { title: 'Novo Curtiu', text: 'lucas_dev curtiu a sua publicação na linha do tempo.', sender: 'Instagram' },
    'Gmail': { title: 'Confirmacao de Deploy', text: 'Deploy no Cloud Run / Render finalizado sem erros.', sender: 'deploy@render.com' },
    'Sistema': { title: 'Sincronização Concluída', text: 'Eventos offline sincronizados com o Firestore.', sender: 'Sistema' }
  };

  const msg = sampleMessages[sample.app] || { title: 'Nova Mensagem', text: 'Conteúdo do evento recebido no celular.', sender: 'Remetente' };

  const newEvent: PortalEvent = {
    id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    uid: 'usr-default',
    deviceId: randomDevice.deviceId,
    deviceName: randomDevice.name,
    app: sample.app,
    packageName: sample.packageName,
    title: msg.title,
    text: msg.text,
    sender: msg.sender,
    timestamp: Date.now(),
    priority: sample.priority as any,
    type: sample.type as any,
    read: false,
    favorite: false
  };

  events.unshift(newEvent);
  res.json({ success: true, event: newEvent });
});

// EXPORT DEPLOYMENT FILES GENERATOR
app.get('/api/export-files', (req, res) => {
  res.json({
    renderYaml: `services:
  - type: web
    name: portal-mobile-backend
    runtime: node
    buildCommand: npm run build
    startCommand: npm run start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: FIREBASE_PROJECT_ID
        value: portal-mobile-prod
    healthCheckPath: /api/ping
    autoDeploy: true`,

    dockerfile: `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.cjs"]`,

    githubWorkflow: `name: Deploy Portal Mobile to Render

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Trigger Render Deploy Hook
        run: |
          curl -X POST "\${{ secrets.RENDER_DEPLOY_HOOK_URL }}"`,

    firebaseRules: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/events/{eventId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/devices/{deviceId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`
  });
});

// START SERVER & VITE INTEGRATION
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Portal Mobile] Server running at http://0.0.0.0:${PORT}`);
    console.log(`[Portal Mobile] Render Keep-Alive Cron active targeting: ${keepAliveConfig.targetUrl}`);
  });
}

startServer();
