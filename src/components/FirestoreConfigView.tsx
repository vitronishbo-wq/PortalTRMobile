import React, { useState } from 'react';
import { Database, Shield, CheckCircle2, Cloud, HardDrive, Key, Copy, Check, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import { FirestoreConfig } from '../types';

interface FirestoreConfigViewProps {
  config: FirestoreConfig;
  onSaveConfig: (cfg: FirestoreConfig) => void;
  onClearLocalCache?: () => void;
}

export const FirestoreConfigView: React.FC<FirestoreConfigViewProps> = ({
  config,
  onSaveConfig,
  onClearLocalCache
}) => {
  const [form, setForm] = useState<FirestoreConfig>(config);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  const rulesSnippet = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regras de Segurança do Portal Mobile
    match /users/{userId}/events/{eventId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/devices/{deviceId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(rulesSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({ ...form, connected: true });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-6 h-6 text-amber-400" />
            <span>Configuração do Firebase / Firestore (Gratuito)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Armazene e sincronize dados de eventos com o nível gratuito do Firebase Firestore (1GB de armazenamento e 50k leituras/dia grátis para sempre).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onClearLocalCache && (
            <button
              type="button"
              onClick={() => {
                onClearLocalCache();
                setCacheCleared(true);
                setTimeout(() => setCacheCleared(false), 3000);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Limpar o cache local de eventos e dispositivos"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Limpar Cache Local</span>
            </button>
          )}

          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 ${
            form.mode === 'cloud' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
          }`}>
            {form.mode === 'cloud' ? <Cloud className="w-4 h-4" /> : <HardDrive className="w-4 h-4" />}
            <span>{form.mode === 'cloud' ? 'Sincronização em Nuvem' : 'Cache Local + Firestore'}</span>
          </span>
        </div>
      </div>

      {/* Decoupled Real-Time Architecture Flow */}
      <div className="bg-slate-900/90 rounded-2xl p-5 border border-indigo-500/30 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <RefreshCw className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Arquitetura Sem Backend Central (Desconectada do Render)
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Render Pode Dormir Livremente
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-center text-xs font-semibold">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-indigo-400 block font-mono text-[10px] uppercase">1. Origem</span>
            <span className="text-white">App Android</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center">
            <span className="text-amber-400 block font-mono text-[10px] uppercase">2. Autenticação</span>
            <span className="text-white">Firebase Auth</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center">
            <span className="text-emerald-400 block font-mono text-[10px] uppercase">3. Banco de Dados</span>
            <span className="text-white">Firestore DB</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center">
            <span className="text-cyan-400 block font-mono text-[10px] uppercase">4. Escuta Tempo Real</span>
            <span className="text-white">Portal (onSnapshot)</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center">
            <span className="text-violet-400 block font-mono text-[10px] uppercase">5. Renderização</span>
            <span className="text-white">UI do Portal</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 pt-1">
          💡 <strong className="text-slate-200">Papel do Render:</strong> Restrito a utilitários secundários (API, Admin, Logs, Backup, Export, Webhook, Health, Version). O Portal permanece online no Hosting e recebe eventos em tempo real do Android diretamente pelo Firestore, sem passar pelo servidor Render.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-slate-100 text-sm">Credenciais do Projeto Firebase</h3>
            </div>
            <a
              href="https://console.firebase.google.com/"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-400 hover:underline flex items-center space-x-1"
            >
              <span>Console Firebase</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Project ID</label>
              <input
                type="text"
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">API Key</label>
              <input
                type="text"
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Auth Domain</label>
              <input
                type="text"
                value={form.authDomain}
                onChange={(e) => setForm({ ...form, authDomain: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">App ID</label>
              <input
                type="text"
                value={form.appId}
                onChange={(e) => setForm({ ...form, appId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.mode === 'cloud'}
                onChange={(e) => setForm({ ...form, mode: e.target.checked ? 'cloud' : 'local' })}
                className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Ativar gravação direta no Firestore</span>
            </label>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
            >
              Salvar Parâmetros
            </button>
          </div>

          {saved && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Configurações do Firestore salvas com sucesso!</span>
            </div>
          )}

          {cacheCleared && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-rose-400" />
              <span>Cache local de eventos e dispositivos limpo com sucesso.</span>
            </div>
          )}
        </form>

        {/* Security Rules */}
        <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Firestore Security Rules</span>
            </h3>
            <button
              onClick={handleCopyRules}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Copie estas regras para a aba <strong>Rules</strong> do seu console Firestore para proteger o acesso por usuário:
          </p>

          <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-mono overflow-x-auto">
            {rulesSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
};
