import React, { useState } from 'react';
import { LayoutGrid, Image, Star, Eye, Sliders, Check, Smartphone, Monitor } from 'lucide-react';

export interface HomeScreenConfig {
  wallpaper: string;
  gridSize: '4x5' | '5x5' | '5x6';
  organization: 'CATEGORIES' | 'USAGE_FREQUENCY' | 'ALPHABETICAL' | 'CUSTOM';
  activeWidgets: { id: string; name: string; enabled: boolean }[];
  favoriteApps: string[];
}

const DEFAULT_CONFIG: HomeScreenConfig = {
  wallpaper: 'DARK_MINIMALIST_OLED',
  gridSize: '5x5',
  organization: 'USAGE_FREQUENCY',
  activeWidgets: [
    { id: 'w-telecom-status', name: 'Status Telecom (SIP/IMS/eSIM)', enabled: true },
    { id: 'w-multicaixa-balance', name: 'Saldo Rápido Multicaixa', enabled: true },
    { id: 'w-device-mesh-health', name: 'Saúde da Frota Mesh', enabled: true },
    { id: 'w-battery-sync', name: 'Monitor de Bateria e Sincronia', enabled: false }
  ],
  favoriteApps: [
    'com.whatsapp.w4b.secure',
    'ao.emis.mcxexpress',
    'ao.portal.telecom.dialer',
    'ao.bfa.mobile'
  ]
};

export const HomeScreenManager: React.FC = () => {
  const [config, setConfig] = useState<HomeScreenConfig>(() => {
    try {
      const saved = localStorage.getItem('virtual_homescreen_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_CONFIG;
  });

  const [savedStatus, setSavedStatus] = useState(false);

  const handleUpdate = (updater: (prev: HomeScreenConfig) => HomeScreenConfig) => {
    setConfig((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem('virtual_homescreen_config', JSON.stringify(next));
      } catch (e) {}
      setSavedStatus(true);
      setTimeout(() => setSavedStatus(false), 2000);
      return next;
    });
  };

  const toggleWidget = (widgetId: string) => {
    handleUpdate((prev) => ({
      ...prev,
      activeWidgets: prev.activeWidgets.map((w) =>
        w.id === widgetId ? { ...w, enabled: !w.enabled } : w
      )
    }));
  };

  return (
    <div className="bg-slate-900/95 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded bg-indigo-500/10 text-indigo-400 font-bold text-xs border border-indigo-500/30">
            HOMESCREEN
          </span>
          <div>
            <h3 className="text-xs font-black text-slate-100 uppercase tracking-wide">
              Gestor do Ecrã Principal do Smartphone Virtual
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">
              Papel de parede, densidade da grelha, widgets integrados e organização de favoritos.
            </p>
          </div>
        </div>

        {savedStatus && (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
            <Check className="w-3 h-3" />
            <span>Configuração Guardada</span>
          </span>
        )}
      </div>

      {/* Grid Settings Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* 1. Wallpaper */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
          <label className="text-[10px] text-slate-400 uppercase font-bold flex items-center space-x-1.5">
            <Image className="w-3.5 h-3.5 text-indigo-400" />
            <span>Papel de Parede</span>
          </label>
          <select
            value={config.wallpaper}
            onChange={(e) => handleUpdate((p) => ({ ...p, wallpaper: e.target.value }))}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-indigo-500 text-xs"
          >
            <option value="DARK_MINIMALIST_OLED">Preto Absoluto (OLED Minimal)</option>
            <option value="PORTAL_CYBER_BLUE">Cyber Blue (PortalTR)</option>
            <option value="EMERALD_TELECOM">Emerald Telecom Theme</option>
            <option value="CLEAN_LIGHT_CONTRAST">Clean Light Contrast</option>
          </select>
          <span className="text-[9px] text-slate-500 block">Renderizado via hardware canvas</span>
        </div>

        {/* 2. Grelha */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
          <label className="text-[10px] text-slate-400 uppercase font-bold flex items-center space-x-1.5">
            <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
            <span>Densidade da Grelha</span>
          </label>
          <select
            value={config.gridSize}
            onChange={(e) => handleUpdate((p) => ({ ...p, gridSize: e.target.value as any }))}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500 text-xs"
          >
            <option value="4x5">4 x 5 (Clássico)</option>
            <option value="5x5">5 x 5 (Alta Densidade)</option>
            <option value="5x6">5 x 6 (Ultra Compacto)</option>
          </select>
          <span className="text-[9px] text-slate-500 block">Distribuição ótica dos ícones</span>
        </div>

        {/* 3. Organização */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
          <label className="text-[10px] text-slate-400 uppercase font-bold flex items-center space-x-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Organização de Apps</span>
          </label>
          <select
            value={config.organization}
            onChange={(e) => handleUpdate((p) => ({ ...p, organization: e.target.value as any }))}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-amber-500 text-xs"
          >
            <option value="USAGE_FREQUENCY">Frequência de Uso</option>
            <option value="CATEGORIES">Por Categoria (Bancos, Telecom, Social)</option>
            <option value="ALPHABETICAL">Ordem Alfabética</option>
            <option value="CUSTOM">Personalizada</option>
          </select>
          <span className="text-[9px] text-slate-500 block">Ordenação preditiva em runtime</span>
        </div>

        {/* 4. Favoritos Dock */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
          <label className="text-[10px] text-slate-400 uppercase font-bold flex items-center space-x-1.5">
            <Star className="w-3.5 h-3.5 text-emerald-400" />
            <span>Favoritos no Dock</span>
          </label>
          <div className="text-[10px] text-slate-300 font-mono space-y-1">
            {config.favoriteApps.map((pkg, i) => (
              <div key={pkg} className="truncate text-emerald-400/90">
                {i + 1}. {pkg.split('.').pop()?.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Widgets Toggles Table */}
      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
        <label className="text-[10px] text-slate-400 uppercase font-bold block">
          Widgets Operacionais do Ecrã Virtual
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {config.activeWidgets.map((w) => (
            <div
              key={w.id}
              onClick={() => toggleWidget(w.id)}
              className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                w.enabled
                  ? 'bg-indigo-500/10 border-indigo-500/40 text-slate-100'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <span className="text-[11px] font-bold truncate mr-2">{w.name}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                w.enabled ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'
              }`}>
                {w.enabled ? 'ATIVO' : 'OFF'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
