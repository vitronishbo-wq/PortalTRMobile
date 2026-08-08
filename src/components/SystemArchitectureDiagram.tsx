import React, { useState } from 'react';
import {
  MessageSquare,
  PhoneCall,
  Bell,
  ShieldCheck,
  Smartphone,
  Tablet,
  Monitor,
  Cloud,
  Cpu,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  Lock,
  Radio,
  Server,
  Database
} from 'lucide-react';

export const SystemArchitectureDiagram: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string | null>('identidade');

  return (
    <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
              Arquitetura Oficial
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Live Engine
            </span>
          </div>
          <h3 className="text-lg font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <span>Ecossistema PortalTRMobile</span>
          </h3>
          <p className="text-xs text-slate-400">
            Visão esquemática da orquestração de canais, motor de identidade, nós de hardware e camada Cloud/IA.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center space-x-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Topologia Ativa</span>
          </div>
        </div>
      </div>

      {/* VISUAL ASCII / NODE FLOW DIAGRAM */}
      <div className="bg-slate-950/90 rounded-2xl p-6 border border-slate-800/80 font-mono relative overflow-hidden">
        
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center space-y-6 max-w-2xl mx-auto">

          {/* 1. ROOT: PORTALTRMOBILE */}
          <div
            onClick={() => setSelectedNode('root')}
            className={`w-full max-w-sm p-4 rounded-2xl border cursor-pointer transition-all text-center relative group ${
              selectedNode === 'root'
                ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30'
                : 'bg-slate-900 border-slate-700/80 text-slate-200 hover:border-amber-500/50'
            }`}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-950 border border-amber-500/40 text-[9px] font-bold text-amber-400 uppercase tracking-widest">
              Root Operating System
            </div>
            <div className="flex items-center justify-center space-x-2 mt-1">
              <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
              <span className="font-black tracking-widest text-sm text-white">PORTALTRMOBILE</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-sans">Barramento Central de Comunicação & Eventos</p>
          </div>

          {/* Connecting Vertical Line & Branch */}
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-6 bg-gradient-to-b from-amber-500 to-indigo-500"></div>
            <div className="w-full max-w-md h-0.5 bg-slate-700 relative">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-700"></div>
              <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-slate-700"></div>
            </div>
          </div>

          {/* 2. THREE PILLARS: MENSAGENS | CHAMADAS | NOTIFICAÇÕES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            
            {/* Mensagens */}
            <div
              onClick={() => setSelectedNode('mensagens')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all text-center space-y-1.5 ${
                selectedNode === 'mensagens'
                  ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/10 ring-2 ring-cyan-500/30'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-cyan-500/50'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mx-auto">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold block text-slate-100">Mensagens</span>
              <span className="text-[9px] text-slate-400 block font-sans">SMS & Realtime Chat</span>
            </div>

            {/* Chamadas */}
            <div
              onClick={() => setSelectedNode('chamadas')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all text-center space-y-1.5 ${
                selectedNode === 'chamadas'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/30'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-emerald-500/50'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                <PhoneCall className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold block text-slate-100">Chamadas</span>
              <span className="text-[9px] text-slate-400 block font-sans">Registos & Telemetria</span>
            </div>

            {/* Notificações */}
            <div
              onClick={() => setSelectedNode('notificacoes')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all text-center space-y-1.5 ${
                selectedNode === 'notificacoes'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-amber-500/50'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
                <Bell className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold block text-slate-100">Notificações</span>
              <span className="text-[9px] text-slate-400 block font-sans">Push & Listener Native</span>
            </div>

          </div>

          {/* Convergence Line down to IDENTIDADE */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-md h-0.5 bg-slate-700"></div>
            <div className="w-0.5 h-6 bg-slate-700"></div>
          </div>

          {/* 3. UNIFIED ENGINE: IDENTIDADE */}
          <div
            onClick={() => setSelectedNode('identidade')}
            className={`w-full max-w-sm p-4 rounded-2xl border cursor-pointer transition-all text-center relative ${
              selectedNode === 'identidade'
                ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/30'
                : 'bg-slate-900 border-slate-700/80 text-slate-200 hover:border-indigo-500/50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span className="font-black tracking-widest text-xs text-white">IDENTIDADE</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-sans">
              Identity Engine • Single Source of Truth • Founder Root Authority & RBAC
            </p>
          </div>

          {/* Divergence Line down to Devices */}
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-6 bg-slate-700"></div>
            <div className="w-full max-w-md h-0.5 bg-slate-700"></div>
          </div>

          {/* 4. CROSS-PLATFORM DEVICES: PHONE | TABLET | DESKTOP */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            
            {/* Phone */}
            <div
              onClick={() => setSelectedNode('phone')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all text-center space-y-1.5 ${
                selectedNode === 'phone'
                  ? 'bg-purple-500/15 border-purple-500 text-purple-300 shadow-lg shadow-purple-500/10 ring-2 ring-purple-500/30'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-purple-500/50'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 mx-auto">
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold block text-slate-100">Phone</span>
              <span className="text-[9px] text-slate-400 block font-sans">Android Native / PWA</span>
            </div>

            {/* Tablet */}
            <div
              onClick={() => setSelectedNode('tablet')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all text-center space-y-1.5 ${
                selectedNode === 'tablet'
                  ? 'bg-blue-500/15 border-blue-500 text-blue-300 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/30'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-blue-500/50'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mx-auto">
                <Tablet className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold block text-slate-100">Tablet</span>
              <span className="text-[9px] text-slate-400 block font-sans">Touch Node / PWA</span>
            </div>

            {/* Desktop */}
            <div
              onClick={() => setSelectedNode('desktop')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all text-center space-y-1.5 ${
                selectedNode === 'desktop'
                  ? 'bg-sky-500/15 border-sky-500 text-sky-300 shadow-lg shadow-sky-500/10 ring-2 ring-sky-500/30'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-sky-500/50'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 mx-auto">
                <Monitor className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold block text-slate-100">Desktop</span>
              <span className="text-[9px] text-slate-400 block font-sans">Founder IDE Console</span>
            </div>

          </div>

          {/* Convergence Line down to CLOUD / IA */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-md h-0.5 bg-slate-700"></div>
            <div className="w-0.5 h-6 bg-gradient-to-b from-slate-700 to-amber-500"></div>
          </div>

          {/* 5. BASE LAYER: CLOUD / IA */}
          <div
            onClick={() => setSelectedNode('cloud_ia')}
            className={`w-full max-w-sm p-4 rounded-2xl border cursor-pointer transition-all text-center relative ${
              selectedNode === 'cloud_ia'
                ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30'
                : 'bg-slate-900 border-slate-700/80 text-slate-200 hover:border-amber-500/50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Cloud className="w-5 h-5 text-amber-400" />
              <Cpu className="w-5 h-5 text-cyan-400" />
              <span className="font-black tracking-widest text-xs text-white">CLOUD / IA</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-sans">
              Firebase Firestore • Gemini AI Intelligence • Realtime Event Engine
            </p>
          </div>

        </div>
      </div>

      {/* NODE INSPECTOR CARD */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
        {selectedNode === 'root' && (
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>PORTALTRMOBILE — Core Gateway & Event Bus Engine</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              O ponto central de entrada e roteamento de eventos de comunicação do ecossistema. Funciona como um barramento em tempo real com pub/sub desacoplado.
            </p>
          </div>
        )}

        {selectedNode === 'mensagens' && (
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>Mensagens — Canal de SMS, Chat & Protocolos de Texto</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Gerencia a captura nativa de SMS via Android Accessibility e SMS Listener, sincronização incremental e chat bidirecional em tempo real.
            </p>
          </div>
        )}

        {selectedNode === 'chamadas' && (
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <PhoneCall className="w-4 h-4" />
              <span>Chamadas — Registos de Chamadas & Telemetria de Voz</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Supervisiona eventos de chamadas de voz de operadora, contadores de chamadas perdidas/atendidas e orquestração de chamadas diretas.
            </p>
          </div>
        )}

        {selectedNode === 'notificacoes' && (
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span>Notificações — Push Dispatcher & Native Listener</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Agente de escuta nativo para interceptação de notificações do sistema operacional e disparo de alertas Web Push prioritários.
            </p>
          </div>
        )}

        {selectedNode === 'identidade' && (
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>IDENTIDADE — Single Source of Truth & Bootstrapping Founder</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              O motor de autenticação e RBAC unificado. Nenhuma permissão ou estado de segurança é duplicado. O Founder atua como autoridade raiz (Root Authority).
            </p>
          </div>
        )}

        {selectedNode === 'phone' && (
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-purple-400 flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span>Phone — Agente Nativo Android & Smartphone PWA</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dispositivo móvel com permissões de comunicação (SMS, Chamadas, Bateria, Notificações). Suporta Zero-Touch Provisioning e camuflagem.
            </p>
          </div>
        )}

        {selectedNode === 'tablet' && (
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
              <Tablet className="w-4 h-4" />
              <span>Tablet — Nó de Gestão de Ecrã Tátil</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Interface PWA responsiva otimizada para ecrãs de média dimensão e operação de supervisão móvel.
            </p>
          </div>
        )}

        {selectedNode === 'desktop' && (
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-sky-400 flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              <span>Desktop — Workstation IDE do Founder Console</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ambiente estilo IDE para o Founder com painéis colapsáveis, exploradores, gestão de secrets e orquestração global.
            </p>
          </div>
        )}

        {selectedNode === 'cloud_ia' && (
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              <span>CLOUD / IA — Firebase Platform & Gemini AI Intelligence</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Persistência em tempo real via Firestore, classificação automatizada de eventos por IA, regras de automação inteligentes e sincronização de estado.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
