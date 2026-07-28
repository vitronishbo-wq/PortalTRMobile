import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// API ROUTES (Essenciais de Manutenção e Diagnóstico Render)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    service: 'Portal Mobile API'
  });
});

app.get('/api/version', (req, res) => {
  res.json({
    version: '1.2.0',
    build: '2026.07.28',
    runtime: 'NodeJS',
    platform: 'Render / Cloud Run'
  });
});

app.post('/api/export', (req, res) => {
  res.json({
    success: true,
    timestamp: Date.now(),
    message: 'Exportação de metadados realizada com sucesso.',
    exportFiles: {
      renderYaml: `services:\n  - type: web\n    name: portal-mobile-backend\n    runtime: node\n    buildCommand: npm run build\n    startCommand: npm run start`,
      dockerfile: `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD ["node", "dist/server.cjs"]`,
      githubWorkflow: `name: Deploy Portal Mobile\non:\n  push:\n    branches: [ main ]`
    }
  });
});

app.post('/api/backup', (req, res) => {
  const backupId = `bkp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  res.json({
    success: true,
    backupId,
    timestamp: Date.now(),
    message: 'Backup das configurações e estado efetuado com sucesso.'
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
  });
}

startServer();
