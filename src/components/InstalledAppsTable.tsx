import React, { useState } from 'react';
import { Play, Pause, Trash2, Shield, RefreshCw, Smartphone, Layers, CheckCircle2, AlertCircle, Check, X } from 'lucide-react';
import { AppCompatibilityEngine, AppCompatibilityRecord } from '../engine/AppCompatibilityEngine';

export interface InstalledAppRecord {
  id: string;
  name: string;
  packageName: string;
  installed: boolean;
  executable: boolean;
  synchronized: boolean;
  requiresRealAndroid: boolean;
  supportsCloudRuntime: boolean;
  type: 'NATIVE_ANDROID' | 'PWA' | 'SYSTEM' | 'CONTAINER_ISOLATED';
  state: 'RUNNING' | 'STOPPED' | 'SUSPENDED' | 'STANDBY';
  origin: 'PLAY_STORE' | 'PORTAL_MARKET' | 'APK_SIDELOAD' | 'LOCAL_SYSTEM';
  session: string;
  lastActive: string;
  isolated: boolean;
}

const DEFAULT_INSTALLED_APPS: InstalledAppRecord[] = [
  {
    id: 'app-whatsapp-biz',
    name: 'WhatsApp Business',
    packageName: 'com.whatsapp.w4b.secure',
    installed: true,
    executable: true,
    synchronized: true,
    requiresRealAndroid: true,
    supportsCloudRuntime: false,
    type: 'CONTAINER_ISOLATED',
    state: 'RUNNING',
    origin: 'PORTAL_MARKET',
    session: 'sess_prod_9921_w4b',
    lastActive: 'Agora mesmo',
    isolated: true
  },
  {
    id: 'app-multicaixa-express',
    name: 'Multicaixa Express (EMIS)',
    packageName: 'ao.emis.mcxexpress',
    installed: true,
    executable: true,
    synchronized: true,
    requiresRealAndroid: true,
    supportsCloudRuntime: false,
    type: 'NATIVE_ANDROID',
    state: 'STANDBY',
    origin: 'PLAY_STORE',
    session: 'sess_emis_sec_01',
    lastActive: 'Há 5 min',
    isolated: true
  },
  {
    id: 'app-bfa-app',
    name: 'BFA Net Mobile',
    packageName: 'ao.bfa.mobile',
    installed: true,
    executable: false,
    synchronized: false,
    requiresRealAndroid: true,
    supportsCloudRuntime: false,
    type: 'NATIVE_ANDROID',
    state: 'STOPPED',
    origin: 'PLAY_STORE',
    session: 'none',
    lastActive: 'Há 2 horas',
    isolated: true
  },
  {
    id: 'app-telecom-dialer',
    name: 'PortalTR Telecom SIP/IMS Dialer',
    packageName: 'ao.portal.telecom.dialer',
    installed: true,
    executable: true,
    synchronized: true,
    requiresRealAndroid: false,
    supportsCloudRuntime: true,
    type: 'SYSTEM',
    state: 'RUNNING',
    origin: 'LOCAL_SYSTEM',
    session: 'sess_telecom_core_01',
    lastActive: 'Sempre Ativo',
    isolated: false
  },
  {
    id: 'app-sms-forwarder',
    name: 'Zero-Touch SMS Engine',
    packageName: 'ao.portal.sms.daemon',
    installed: true,
    executable: true,
    synchronized: true,
    requiresRealAndroid: true,
    supportsCloudRuntime: false,
    type: 'SYSTEM',
    state: 'RUNNING',
    origin: 'LOCAL_SYSTEM',
    session: 'sess_sms_daemon_01',
    lastActive: 'Sempre Ativo',
    isolated: false
  },
  {
    id: 'app-facebook',
    name: 'Facebook',
    packageName: 'com.facebook.katana',
    installed: true,
    executable: true,
    synchronized: true,
    requiresRealAndroid: false,
    supportsCloudRuntime: true,
    type: 'PWA',
    state: 'STANDBY',
    origin: 'PORTAL_MARKET',
    session: 'sess_fb_01',
    lastActive: 'Há 1 dia',
    isolated: true
  }
];

export const InstalledAppsTable: React.FC = () => {
  const [apps, setApps] = useState<InstalledAppRecord[]>(DEFAULT_INSTALLED_APPS);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'installed' | 'compatibility'>('installed');

  const compatibilityList = AppCompatibilityEngine.getCompatibilityList();

  const toggleAppState = (id: string) => {
    setApps((prev) =>
      prev.map((app) => {
        if (app.id !== id) return app;
        const nextState = app.state === 'RUNNING' ? 'STOPPED' : 'RUNNING';
        return {
          ...app,
          state: nextState,
          session: nextState === 'RUNNING' ? `sess_${Math.random().toString(36).substring(2, 7)}` : 'none',
          lastActive: nextState === 'RUNNING' ? 'Agora mesmo' : app.lastActive
        };
      })
    );
  };

  const handleUninstall = (id: string) => {
    setApps((prev) => prev.filter((a) => a.id !== id));
  };

  const filteredApps = apps.filter((app) => {
    if (filterType === 'ALL') return true;
    return app.type === filterType;
  });

  const renderBadgeBool = (val: boolean) => (
    <span className={`inline-flex items-center space-x-1 px-1.5 py-0.2 rounded text-[10px] font-bold ${
      val ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'
    }`}>
      {val ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
      <span>{val ? 'Sim' : 'Não'}</span>
    </span>
  );

  const renderStateBadge = (state: InstalledAppRecord['state']) => {
    switch (state) {
      case 'RUNNING':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>RUNNING</span>
          </span>
        );
      case 'STANDBY':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold">
            <span>STANDBY</span>
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
            <span>SUSPENDED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold">
            <span>STOPPED</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/95 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-4 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded bg-indigo-500/10 text-indigo-400 font-bold text-xs border border-indigo-500/30">
            APPS
          </span>
          <div>
            <h3 className="text-xs font-black text-slate-100 uppercase tracking-wide">
              Validação do Smartphone Virtual & Runtime
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">
              Estado de execução, compatibilidade Android real vs Cloud runtime e isolamento.
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center space-x-1.5 text-xs">
          <button
            onClick={() => setActiveTab('installed')}
            className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
              activeTab === 'installed'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Aplicações Instaladas ({apps.length})
          </button>
          <button
            onClick={() => setActiveTab('compatibility')}
            className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
              activeTab === 'compatibility'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Matriz de Compatibilidade (AppCompatibilityEngine)
          </button>
        </div>
      </div>

      {activeTab === 'installed' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="py-2 px-2.5">Aplicação</th>
                <th className="py-2 px-2 text-center">Instalada</th>
                <th className="py-2 px-2 text-center">Executável</th>
                <th className="py-2 px-2 text-center">Sincronizada</th>
                <th className="py-2 px-2 text-center">Requer Android Real</th>
                <th className="py-2 px-2 text-center">Suporta Cloud</th>
                <th className="py-2 px-2 text-center">Estado</th>
                <th className="py-2 px-2.5 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2 px-2.5">
                    <span className="font-bold text-slate-200 block">{app.name}</span>
                    <span className="text-[9px] text-slate-500 font-mono">{app.packageName}</span>
                  </td>
                  <td className="py-2 px-2 text-center">{renderBadgeBool(app.installed)}</td>
                  <td className="py-2 px-2 text-center">{renderBadgeBool(app.executable)}</td>
                  <td className="py-2 px-2 text-center">{renderBadgeBool(app.synchronized)}</td>
                  <td className="py-2 px-2 text-center">{renderBadgeBool(app.requiresRealAndroid)}</td>
                  <td className="py-2 px-2 text-center">{renderBadgeBool(app.supportsCloudRuntime)}</td>
                  <td className="py-2 px-2 text-center">{renderStateBadge(app.state)}</td>
                  <td className="py-2 px-2.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button
                        onClick={() => toggleAppState(app.id)}
                        className={`p-1.5 rounded cursor-pointer transition-colors ${
                          app.state === 'RUNNING'
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                        }`}
                        title={app.state === 'RUNNING' ? 'Pausar/Parar' : 'Iniciar Aplicação'}
                      >
                        {app.state === 'RUNNING' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      </button>
                      {app.type !== 'SYSTEM' && (
                        <button
                          onClick={() => handleUninstall(app.id)}
                          className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                          title="Desinstalar Aplicação"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Compatibility Matrix Table */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="py-2 px-3">Aplicação</th>
                <th className="py-2 px-2 text-center">Android</th>
                <th className="py-2 px-2 text-center">Cloud</th>
                <th className="py-2 px-2 text-center">Web</th>
                <th className="py-2 px-2 text-center">Estado</th>
                <th className="py-2 px-3">Diagnóstico Operacional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {compatibilityList.map((item) => (
                <tr key={item.packageName} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2 px-3">
                    <span className="font-bold text-slate-200 block">{item.app}</span>
                    <span className="text-[9px] text-slate-500">{item.packageName}</span>
                  </td>
                  <td className="py-2 px-2 text-center">{renderBadgeBool(item.android)}</td>
                  <td className="py-2 px-2 text-center">{renderBadgeBool(item.cloud)}</td>
                  <td className="py-2 px-2 text-center">{renderBadgeBool(item.web)}</td>
                  <td className="py-2 px-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      item.state === 'Pronto'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : item.state === 'Parcial'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}>
                      {item.state}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-[10px] text-slate-400 font-sans">
                    {item.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

