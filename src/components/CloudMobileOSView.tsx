import React, { useState } from 'react';
import {
  Smartphone,
  Sliders,
  Palette,
  Bell,
  Lock,
  Search,
  Grid,
  Layers,
  Cpu,
  RefreshCw,
  Zap,
  Globe,
  Volume2,
  Shield,
  Layout,
  Maximize2
} from 'lucide-react';
import { CloudRuntimeEngine, RuntimeEnvironmentType, VirtualOSPersonalization } from '../engine/cloudRuntimeEngine';

export const CloudMobileOSView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'runtimes' | 'personalizacao' | 'interface'>('runtimes');
  const [selectedRuntime, setSelectedRuntime] = useState<RuntimeEnvironmentType>('android_runtime');
  const [personalization, setPersonalization] = useState<VirtualOSPersonalization>(CloudRuntimeEngine.getDefaultOSPersonalization());
  const [lockScreenActive, setLockScreenActive] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const runtimes = CloudRuntimeEngine.getAvailableEnvironments();

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 text-slate-100 font-sans shadow-2xl space-y-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-tight flex items-center space-x-2">
              <span>CLOUD MOBILE OS 15.0 — SMARTPHONE VIRTUAL COMPLETO</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[9px] font-mono">
                INDEPENDENTE DE HARDWARE
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Sistema Operativo Móvel baseado em Cloud Runtimes com emulação total de hardware e personalização</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setLockScreenActive(!lockScreenActive)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center space-x-1.5 ${
              lockScreenActive
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{lockScreenActive ? 'ECRÃ BLOQUEADO' : 'TESTAR ECRA DE BLOQUEIO'}</span>
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center space-x-1.5 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => setActiveTab('runtimes')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'runtimes'
              ? 'bg-cyan-600 text-slate-950 shadow-md shadow-cyan-600/20'
              : 'bg-slate-950 text-slate-400 border border-slate-800'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>CAMADA 13 — Cloud Runtimes</span>
        </button>

        <button
          onClick={() => setActiveTab('personalizacao')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'personalizacao'
              ? 'bg-cyan-600 text-slate-950 shadow-md shadow-cyan-600/20'
              : 'bg-slate-950 text-slate-400 border border-slate-800'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Personalização do OS</span>
        </button>

        <button
          onClick={() => setActiveTab('interface')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'interface'
              ? 'bg-cyan-600 text-slate-950 shadow-md shadow-cyan-600/20'
              : 'bg-slate-950 text-slate-400 border border-slate-800'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>Controlo de Interface</span>
        </button>
      </div>

      {/* 1. CLOUD RUNTIMES */}
      {activeTab === 'runtimes' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {runtimes.map((rt) => {
              const isSelected = selectedRuntime === rt.type;
              return (
                <div
                  key={rt.type}
                  onClick={() => setSelectedRuntime(rt.type)}
                  className={`p-3.5 bg-slate-950 border rounded-2xl cursor-pointer transition-all space-y-2 ${
                    isSelected
                      ? 'border-cyan-500 shadow-lg shadow-cyan-500/10 bg-slate-950'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{rt.name}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold">
                      {rt.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Núcleo: {rt.os}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[10px] font-mono text-slate-500">
                    <span>Sincronização Total: &lt;12ms</span>
                    <span className="text-cyan-400 font-bold">● CONTINUIDADE ATIVA</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs">
            <span className="font-bold text-white block uppercase">Capacidades do Cloud Runtime Ativo ({selectedRuntime})</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px] text-slate-300">
              <p><strong className="text-slate-500">Execução:</strong> Remota Isolada</p>
              <p><strong className="text-slate-500">Continuidade:</strong> Automática</p>
              <p><strong className="text-slate-500">Transferência:</strong> Instantânea</p>
              <p><strong className="text-slate-500">Sessão:</strong> Persistente Firestore</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. PERSONALIZAÇÃO DO OS */}
      {activeTab === 'personalizacao' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 text-xs">
            <h3 className="font-bold text-white uppercase flex items-center space-x-2">
              <Palette className="w-4 h-4 text-cyan-400" />
              <span>PAINEL DE PERSONALIZAÇÃO VISUAL</span>
            </h3>

            <div className="space-y-2">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">URL do Papel de Parede</label>
                <input
                  type="text"
                  value={personalization.wallpaperUrl}
                  onChange={(e) => setPersonalization({ ...personalization, wallpaperUrl: e.target.value })}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Layout do Ecrã Inicial</label>
                  <select
                    value={personalization.homeLayout}
                    onChange={(e) => setPersonalization({ ...personalization, homeLayout: e.target.value as any })}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  >
                    <option value="dense">Dense Inline Columns</option>
                    <option value="grid">Grid Tradicional</option>
                    <option value="bento">Bento Workspace</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Estilo de Ícones</label>
                  <select
                    value={personalization.iconsStyle}
                    onChange={(e) => setPersonalization({ ...personalization, iconsStyle: e.target.value as any })}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  >
                    <option value="rounded">Arredondados Pro</option>
                    <option value="glass">Glassmorphism Clean</option>
                    <option value="monochrome">Monocromático</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Esquema de Som</label>
                  <select
                    value={personalization.soundScheme}
                    onChange={(e) => setPersonalization({ ...personalization, soundScheme: e.target.value as any })}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  >
                    <option value="subtle">Sutil e Elegante</option>
                    <option value="silent">Silencioso Total</option>
                    <option value="futuristic">Futurista Ciber</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Idioma do Sistema OS</label>
                  <select
                    value={personalization.language}
                    onChange={(e) => setPersonalization({ ...personalization, language: e.target.value as any })}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  >
                    <option value="pt-AO">Português (Angola)</option>
                    <option value="pt-PT">Português (Portugal)</option>
                    <option value="en-US">English (US)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* PREVIEW DO ECRÃ VIRTUAL */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden flex flex-col justify-between h-72">
            <img
              src={personalization.wallpaperUrl}
              alt="Wallpaper"
              className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
            />
            <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-300">
              <span>PORTALTRMOBILE OS</span>
              <span>16:48 • 100% BATERIA</span>
            </div>

            <div className="relative z-10 text-center space-y-1">
              <span className="text-3xl font-mono font-black text-white block">16:48</span>
              <span className="text-[10px] text-cyan-400 font-bold block">SESSÃO CONTINUA EM CLOUD RUNTIME</span>
            </div>

            <div className="relative z-10 grid grid-cols-4 gap-2">
              {['SMS', 'Chamadas', 'Contactos', 'Central'].map((app, i) => (
                <div key={i} className="p-2 bg-slate-900/90 border border-slate-800 rounded-xl text-center text-[9px] font-bold text-white">
                  {app}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. INTERFACE */}
      {activeTab === 'interface' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <span className="font-bold text-white block">Centro de Notificações</span>
            <p className="text-[10px] text-slate-400">Notificações agregadas em tempo real de SMS, chamadas e redes sociais.</p>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <span className="font-bold text-white block">Centro de Controlo & Toggles</span>
            <p className="text-[10px] text-slate-400">Acesso rápido a Wi-Fi, VPN Cloud, Silenciar, Gravador e Telemetria.</p>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <span className="font-bold text-white block">Multitarefa & Gaveta de Apps</span>
            <p className="text-[10px] text-slate-400">Alternância instantânea de sessões sem perda de estado do ecossistema.</p>
          </div>
        </div>
      )}
    </div>
  );
};
