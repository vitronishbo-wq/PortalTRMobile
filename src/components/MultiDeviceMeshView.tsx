import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Laptop,
  Tv,
  Globe,
  Tablet,
  CheckCircle2,
  RefreshCw,
  Share2,
  Radio,
  Copy,
  Check,
  Phone,
  Zap,
  ShieldCheck,
  Layers,
  ArrowRight
} from 'lucide-react';
import { MultiDeviceMeshEngine, DeviceNode, PlatformType, MultiDeviceUnifiedSession } from '../engine/multiDeviceMeshEngine';

export const MultiDeviceMeshView: React.FC = () => {
  const [session, setSession] = useState<MultiDeviceUnifiedSession | null>(MultiDeviceMeshEngine.getActiveSession());
  const [phoneNumber, setPhoneNumber] = useState<string>('+244 923 000 999');
  const [deviceName, setDeviceName] = useState<string>('');
  const [copiedNodeId, setCopiedNodeId] = useState<string | null>(null);
  const [sharedText, setSharedText] = useState<string>('');
  const [isCopying, setIsCopying] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const localNodeId = MultiDeviceMeshEngine.getLocalNodeId();
  const currentPlatform = MultiDeviceMeshEngine.detectCurrentPlatform();

  useEffect(() => {
    const unsub = MultiDeviceMeshEngine.subscribeSession((activeSession) => {
      setSession(activeSession);
      if (activeSession?.sharedClipboard) {
        setSharedText(activeSession.sharedClipboard);
      }
    });

    // Auto-register current node
    MultiDeviceMeshEngine.registerNodeInMesh({
      primaryPhoneNumber: phoneNumber,
      deviceName: deviceName || undefined
    });

    return () => unsub();
  }, []);

  const handleRegisterNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;

    const updated = await MultiDeviceMeshEngine.registerNodeInMesh({
      primaryPhoneNumber: phoneNumber,
      deviceName: deviceName || undefined
    });

    setSession(updated);
    setStatusMsg(`✅ Dispositivo registado no Mesh de Sessão para ${phoneNumber}!`);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleHandover = async (targetNodeId: string) => {
    await MultiDeviceMeshEngine.handoverSessionToNode(targetNodeId);
    setStatusMsg(`🚀 Foco de sessão transferido instantaneamente para o nó ${targetNodeId}`);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleSyncClipboard = () => {
    if (!sharedText) return;
    MultiDeviceMeshEngine.syncSharedClipboard(sharedText);
    setIsCopying(true);
    setTimeout(() => setIsCopying(false), 2000);
  };

  const copyToClipboard = (nodeId: string) => {
    navigator.clipboard.writeText(nodeId);
    setCopiedNodeId(nodeId);
    setTimeout(() => setCopiedNodeId(null), 2000);
  };

  const getPlatformIcon = (platform: PlatformType) => {
    switch (platform) {
      case 'android_phone':
      case 'iphone':
        return <Smartphone className="w-5 h-5 text-emerald-400" />;
      case 'windows_pc':
      case 'mac_os':
      case 'linux_pc':
        return <Laptop className="w-5 h-5 text-sky-400" />;
      case 'android_tablet':
      case 'ipad':
        return <Tablet className="w-5 h-5 text-indigo-400" />;
      case 'smart_tv':
        return <Tv className="w-5 h-5 text-purple-400" />;
      default:
        return <Globe className="w-5 h-5 text-amber-400" />;
    }
  };

  const allPlatforms: { type: PlatformType; name: string; icon: string; status: 'ATIVO' | 'SUPORTADO' }[] = [
    { type: 'android_phone', name: 'Android Native App', icon: '📱', status: 'ATIVO' },
    { type: 'iphone', name: 'iOS Safari / PWA', icon: '🍎', status: 'ATIVO' },
    { type: 'windows_pc', name: 'Windows Web & PWA', icon: '💻', status: 'ATIVO' },
    { type: 'mac_os', name: 'macOS Safari / Chrome', icon: '🍎', status: 'ATIVO' },
    { type: 'linux_pc', name: 'Linux PWA Container', icon: '🐧', status: 'ATIVO' },
    { type: 'android_tablet', name: 'Android Tablet', icon: '📟', status: 'ATIVO' },
    { type: 'ipad', name: 'Apple iPad OS', icon: '🍏', status: 'ATIVO' },
    { type: 'web_browser', name: 'Navegador Web Universal', icon: '🌐', status: 'ATIVO' },
    { type: 'smart_tv', name: 'Smart TV Web Engine', icon: '📺', status: 'SUPORTADO' },
  ];

  const nodesList: DeviceNode[] = session ? (Object.values(session.nodes) as DeviceNode[]) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>UNIFIED MULTI-DEVICE SESSION MESH</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Um Único Número. Uma Única Identidade. Todos os Dispositivos.
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Continue exatamente a mesma sessão sem interrupções em Android, iPhone, Windows, macOS, Linux, Tablets, Web e Smart TV. Todos funcionam como extensões em tempo real da sua conta principal.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shrink-0 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Plataforma Atual:</span>
              <span className="text-emerald-400 font-bold uppercase">{currentPlatform.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Node ID Local:</span>
              <span className="text-slate-200 font-bold">{localNodeId}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Sincronização:</span>
              <span className="text-sky-400 font-bold">SSE / Firestore Mesh</span>
            </div>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono text-xs shadow-lg animate-fade-in">
          {statusMsg}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Primary Number Binding Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
              <Phone className="w-5 h-5 text-emerald-400" />
              <span>Vincular Número Principal</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Conecte o seu número móvel (MSISDN) para unificar a sessão em todos os seus dispositivos.
            </p>
          </div>

          <form onSubmit={handleRegisterNode} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Número de Telemóvel Principal (E.164)
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+244 923 000 999"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Nome do Dispositivo Atual
              </label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder={`Ex: Meu ${currentPlatform.replace('_', ' ')}`}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl py-3 flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/30"
            >
              <Zap className="w-4 h-4" />
              <span>Conectar ao Mesh Unificado</span>
            </button>
          </form>

          {/* Shared Clipboard Feature */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <Share2 className="w-4 h-4 text-sky-400" />
              <span>Área de Transferência Unificada</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Copie um texto num dispositivo (ex: iPhone) e cole instantaneamente em outro (ex: Windows/Android).
            </p>
            <div className="flex space-x-2">
              <input
                type="text"
                value={sharedText}
                onChange={(e) => setSharedText(e.target.value)}
                placeholder="Digite algo para sincronizar..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleSyncClipboard}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl px-3 py-2 flex items-center space-x-1 cursor-pointer transition-all"
              >
                {isCopying ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{isCopying ? 'Sincronizado!' : 'Sync'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Col 2/3: Connected Device Nodes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <span>Nós Conectados na Sessão ({nodesList.length})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Dispositivos ativos associados ao número {phoneNumber}
                </p>
              </div>

              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                ● MESH ONLINE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nodesList.map((node) => {
                const isCurrentNode = node.nodeId === localNodeId;
                const isFocused = session?.currentFocusedNodeId === node.nodeId;

                return (
                  <div
                    key={node.nodeId}
                    className={`p-4 rounded-2xl border transition-all space-y-3 relative ${
                      isCurrentNode
                        ? 'bg-slate-950 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                          {getPlatformIcon(node.platform)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-xs font-bold text-white">{node.deviceName}</h3>
                            {node.isPrimaryMaster && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                MASTER SIM
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {node.platform.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => copyToClipboard(node.nodeId)}
                        className="text-slate-500 hover:text-slate-300 text-xs p-1 rounded transition-all"
                        title="Copiar Node ID"
                      >
                        {copiedNodeId === node.nodeId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="text-[11px] font-mono space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                      <div className="flex justify-between text-slate-400">
                        <span>Aba Ativa:</span>
                        <span className="text-slate-200 font-bold">{node.activeTab || '/'}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Status:</span>
                        <span className="text-emerald-400 font-bold">● ONLINE</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Ativo há {Math.floor((Date.now() - node.lastActive) / 1000)}s
                      </span>

                      {!isCurrentNode && (
                        <button
                          onClick={() => handleHandover(node.nodeId)}
                          className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center space-x-1 cursor-pointer"
                        >
                          <span>Handover Sessão</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {isCurrentNode && (
                        <span className="text-[10px] font-bold text-emerald-400 font-mono">
                          ✓ ESTE DISPOSITIVO
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Platform Matrix Support */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Matriz de Extensão Multi-Plataforma Unificada</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {allPlatforms.map((p) => (
                <div
                  key={p.type}
                  className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-base">{p.icon}</span>
                    <span className="font-semibold text-slate-200">{p.name}</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
