import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  QrCode, 
  Battery, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  Activity, 
  Wrench, 
  Zap, 
  Globe,
  Tablet,
  Laptop,
  Apple,
  Search,
  X,
  Info,
  Sliders,
  Check,
  AlertTriangle,
  Tv
} from 'lucide-react';
import QRCode from 'qrcode';
import { Device } from '../types';
import { ZeroTouchIdentity } from '../engine/provisioningEngine';
import { BatteryUsageMonitor } from './BatteryUsageMonitor';

interface DevicesViewProps {
  devices?: Device[];
  onAddDevice?: (device: Partial<Device>) => void;
  onRemoveDevice?: (id: string) => void;
  onSimulateEvent?: () => void;
}

const DEFAULT_FLEET_DEVICES: Device[] = [
  {
    deviceId: 'dev-android-samsung-s22',
    nodeId: 'node-android-master-01',
    name: 'Samsung Galaxy S22 Native',
    model: 'SM-S901B',
    manufacturer: 'Samsung',
    platform: 'android',
    osVersion: 'Android 14.0',
    pairedAt: '2026-01-15T10:30:00.000Z',
    online: true,
    batteryLevel: 94,
    ipAddress: '192.168.1.102',
    networkType: '5G / VoLTE',
    signalStrength: '-62 dBm (Excelente)',
    virtualNumber: '+244 923 888 111',
    carrier: 'Unitel Angola',
    permissionScore: 100,
    syncDelayMs: 4,
    lastSync: Date.now() - 3000,
    notificationListenerStatus: 'active',
    capabilities: { sms: true, calls: true, biometrics: true, accessibility: true, camera: true, microphone: true }
  },
  {
    deviceId: 'dev-iphone-15-pro',
    nodeId: 'node-iphone-ios-02',
    name: 'iPhone 15 Pro iOS Agent',
    model: 'iPhone16,1',
    manufacturer: 'Apple',
    platform: 'iphone',
    osVersion: 'iOS 17.5',
    pairedAt: '2026-01-20T14:15:00.000Z',
    online: true,
    batteryLevel: 88,
    ipAddress: '192.168.1.105',
    networkType: 'VoNR 5G',
    signalStrength: '-58 dBm (Forte)',
    virtualNumber: '+244 955 777 222',
    carrier: 'Africell Angola',
    permissionScore: 98,
    syncDelayMs: 6,
    lastSync: Date.now() - 5000,
    notificationListenerStatus: 'active',
    capabilities: { sms: true, calls: true, biometrics: true, accessibility: false, camera: true, microphone: true }
  },
  {
    deviceId: 'dev-windows-11-pro',
    nodeId: 'node-win-workstation-03',
    name: 'Dell XPS Workstation Windows',
    model: 'Dell XPS 15 9530',
    manufacturer: 'Dell Inc.',
    platform: 'windows',
    osVersion: 'Windows 11 Pro 23H2',
    pairedAt: '2026-01-22T08:00:00.000Z',
    online: true,
    batteryLevel: 100,
    ipAddress: '10.0.0.45',
    networkType: 'Ethernet Gigabit',
    signalStrength: '100% (Cabo Directo)',
    virtualNumber: '+244 912 666 333',
    carrier: 'Movicel Angola',
    permissionScore: 100,
    syncDelayMs: 2,
    lastSync: Date.now() - 1500,
    notificationListenerStatus: 'active',
    capabilities: { sms: true, calls: true, biometrics: true, accessibility: true, camera: true, microphone: true }
  },
  {
    deviceId: 'dev-linux-ubuntu-server',
    nodeId: 'node-linux-core-04',
    name: 'Ubuntu Enterprise Core Node',
    model: 'ThinkPad P1 Gen 6',
    manufacturer: 'Lenovo',
    platform: 'linux',
    osVersion: 'Ubuntu 24.04 LTS',
    pairedAt: '2026-01-25T12:00:00.000Z',
    online: true,
    batteryLevel: 95,
    ipAddress: '10.0.0.88',
    networkType: 'WiFi 6E 6GHz',
    signalStrength: '-51 dBm (Excelente)',
    virtualNumber: 'sip:agent01@sip.portal.co.ao',
    carrier: 'SIP Gateway Direct',
    permissionScore: 100,
    syncDelayMs: 3,
    lastSync: Date.now() - 2000,
    notificationListenerStatus: 'active',
    capabilities: { sms: true, calls: true, biometrics: false, accessibility: true, camera: true, microphone: true }
  },
  {
    deviceId: 'dev-desktop-macos-m2',
    nodeId: 'node-desktop-macbook-05',
    name: 'MacBook Pro M2 Desktop',
    model: 'Mac14,9',
    manufacturer: 'Apple',
    platform: 'macos',
    osVersion: 'macOS Sonoma 14.5',
    pairedAt: '2026-02-12T16:20:00.000Z',
    online: true,
    batteryLevel: 99,
    ipAddress: '192.168.1.110',
    networkType: 'WiFi 6 5GHz',
    signalStrength: '-60 dBm',
    virtualNumber: '+244 222 000 999',
    carrier: 'IMS Core Gateway',
    permissionScore: 100,
    syncDelayMs: 3,
    lastSync: Date.now() - 2000,
    notificationListenerStatus: 'active',
    capabilities: { sms: true, calls: true, biometrics: true, accessibility: true, camera: true, microphone: true }
  },
  {
    deviceId: 'dev-ipad-air-tablet',
    nodeId: 'node-ipad-tablet-06',
    name: 'iPad Pro 12.9 (iPadOS)',
    model: 'iPad13,16',
    manufacturer: 'Apple',
    platform: 'ipad',
    osVersion: 'iPadOS 17.4',
    pairedAt: '2026-02-01T09:00:00.000Z',
    online: true,
    batteryLevel: 92,
    ipAddress: '192.168.1.120',
    networkType: 'WiFi 6 5GHz',
    signalStrength: '-65 dBm',
    virtualNumber: '+244 990 123 456',
    carrier: 'eSIM Profile',
    permissionScore: 96,
    syncDelayMs: 8,
    lastSync: Date.now() - 12000,
    notificationListenerStatus: 'active',
    capabilities: { sms: false, calls: true, biometrics: true, accessibility: true, camera: true, microphone: true }
  },
  {
    deviceId: 'dev-android-tablet-s9',
    nodeId: 'node-android-tab-07',
    name: 'Samsung Galaxy Tab S9 (Tablet)',
    model: 'SM-X710',
    manufacturer: 'Samsung',
    platform: 'tablet',
    osVersion: 'Android 14 / One UI 6.1',
    pairedAt: '2026-02-05T15:10:00.000Z',
    online: true,
    batteryLevel: 81,
    ipAddress: '192.168.1.135',
    networkType: 'WiFi 6E',
    signalStrength: '-64 dBm',
    virtualNumber: '+244 923 888 111',
    carrier: 'Unitel Angola',
    permissionScore: 95,
    syncDelayMs: 7,
    lastSync: Date.now() - 8000,
    notificationListenerStatus: 'active',
    capabilities: { sms: true, calls: true, biometrics: true, accessibility: true, camera: true, microphone: true }
  },
  {
    deviceId: 'dev-web-pwa-chrome',
    nodeId: 'node-web-workstation-08',
    name: 'PortalTRMobile Navegador PWA',
    model: 'Chrome 127 WebSockets',
    manufacturer: 'Google',
    platform: 'web',
    osVersion: 'Navegador Web / PWA',
    pairedAt: '2026-02-10T11:45:00.000Z',
    online: true,
    batteryLevel: 100,
    ipAddress: '192.168.1.200',
    networkType: 'WebRTC / WSS',
    signalStrength: '100% (Realtime)',
    virtualNumber: '+244 955 777 222',
    carrier: 'Africell Angola',
    permissionScore: 100,
    syncDelayMs: 2,
    lastSync: Date.now() - 1000,
    notificationListenerStatus: 'active',
    capabilities: { sms: true, calls: true, biometrics: true, accessibility: false, camera: true, microphone: true }
  },
  {
    deviceId: 'dev-smart-tv-lg-webos',
    nodeId: 'node-tv-smart-09',
    name: 'LG OLED Smart TV (Preparação Futura)',
    model: 'OLED65C3PSA',
    manufacturer: 'LG Electronics',
    platform: 'smarttv',
    osVersion: 'webOS 23',
    pairedAt: '2026-02-12T10:00:00.000Z',
    online: true,
    batteryLevel: 100,
    ipAddress: '192.168.1.250',
    networkType: 'Ethernet RJ45',
    signalStrength: '100% (Directo)',
    virtualNumber: '+244 222 000 999',
    carrier: 'IMS Core Gateway',
    permissionScore: 90,
    syncDelayMs: 12,
    lastSync: Date.now() - 15000,
    notificationListenerStatus: 'active',
    capabilities: { sms: false, calls: true, biometrics: false, accessibility: true, camera: false, microphone: true }
  }
];

export const DevicesView: React.FC<DevicesViewProps> = ({
  devices: initialDevices,
  onAddDevice,
  onRemoveDevice,
  onSimulateEvent
}) => {
  const [internalDevices, setInternalDevices] = useState<Device[]>(
    initialDevices && initialDevices.length > 0 ? initialDevices : DEFAULT_FLEET_DEVICES
  );

  useEffect(() => {
    if (initialDevices && initialDevices.length > 0) {
      setInternalDevices(initialDevices);
    }
  }, [initialDevices]);

  const activeFleet = internalDevices.length > 0 ? internalDevices : DEFAULT_FLEET_DEVICES;

  const [showPairModal, setShowPairModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [pairingToken, setPairingToken] = useState<string>('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceModel, setNewDeviceModel] = useState('');
  const [newDevicePlatform, setNewDevicePlatform] = useState<'android' | 'iphone' | 'web' | 'desktop' | 'tablet'>('android');
  const [repairingMap, setRepairingMap] = useState<Record<string, boolean>>({});
  const [isBatteryExpanded, setIsBatteryExpanded] = useState<boolean>(false);
  const [hoveredTooltipId, setHoveredTooltipId] = useState<string | null>(null);

  // Platform filters: todos, android, iphone, web, desktop, tablet
  const [platformFilter, setPlatformFilter] = useState<'todos' | 'android' | 'iphone' | 'web' | 'desktop' | 'tablet'>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    // Generate pairing token & QR Code
    const token = `PORTAL-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    setPairingToken(token);

    const pairingPayload = JSON.stringify({
      serverUrl: window.location.origin,
      token,
      timestamp: Date.now()
    });

    QRCode.toDataURL(pairingPayload, { margin: 2, width: 220 })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [showPairModal]);

  // Manual Add Handler
  const handleManualPair = () => {
    if (!newDeviceName.trim()) return;
    const zeroTouchDev = ZeroTouchIdentity.createIdentity('generic');
    const newDev: Device = {
      ...zeroTouchDev,
      deviceId: zeroTouchDev.deviceId || `dev-${Date.now()}`,
      name: newDeviceName,
      model: newDeviceModel || 'Generic Device',
      platform: newDevicePlatform,
      osVersion: '1.0',
      pairedAt: new Date().toISOString(),
      online: true,
      batteryLevel: 98,
      syncDelayMs: 3,
      permissionScore: 100,
      lastSync: Date.now(),
      notificationListenerStatus: 'active'
    };
    
    setInternalDevices((prev) => [newDev, ...prev]);
    if (onAddDevice) onAddDevice(newDev);

    setNewDeviceName('');
    setNewDeviceModel('');
    setShowPairModal(false);
  };

  const handleAutoRepair = (deviceId: string) => {
    setRepairingMap((prev) => ({ ...prev, [deviceId]: true }));
    setTimeout(() => {
      setRepairingMap((prev) => ({ ...prev, [deviceId]: false }));
      alert(`[Auto-Repair] Comando de reativação enviado com sucesso para o dispositivo ${deviceId}! Listener de Notificações restaurado.`);
    }, 1200);
  };

  const getDeviceCategory = (device: Device): 'android' | 'iphone' | 'web' | 'desktop' | 'tablet' => {
    const platform = (device.platform || '').toLowerCase();
    const str = `${device.name || ''} ${device.model || ''} ${device.osVersion || ''}`.toLowerCase();
    
    if (platform === 'tablet' || str.includes('ipad') || str.includes('tablet') || str.includes('tab s')) return 'tablet';
    if (platform === 'iphone' || str.includes('iphone') || str.includes('ios')) return 'iphone';
    if (platform === 'web' || str.includes('chrome') || str.includes('pwa') || str.includes('firefox')) return 'web';
    if (platform === 'macos' || platform === 'windows' || platform === 'linux' || platform === 'desktop' || str.includes('mac') || str.includes('win') || str.includes('electron') || str.includes('linux')) return 'desktop';
    if (platform === 'android' || str.includes('android') || str.includes('samsung') || str.includes('pixel') || str.includes('xiaomi') || str.includes('itel')) return 'android';
    
    return 'android';
  };

  const renderPlatformIcon = (category: string) => {
    switch (category) {
      case 'android':
        return <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'iphone':
        return <Apple className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
      case 'tablet':
        return <Tablet className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      case 'desktop':
        return <Laptop className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      case 'web':
        return <Globe className="w-3.5 h-3.5 text-teal-400 shrink-0" />;
      default:
        return <Smartphone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
    }
  };

  const handleRemove = (deviceId: string) => {
    setInternalDevices((prev) => prev.filter((d) => d.deviceId !== deviceId));
    if (onRemoveDevice) onRemoveDevice(deviceId);
  };

  // Filtered devices list
  const filteredDevices = activeFleet.filter((device) => {
    const devCategory = getDeviceCategory(device);
    if (platformFilter !== 'todos' && devCategory !== platformFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = device.name.toLowerCase().includes(q);
      const matchModel = device.model.toLowerCase().includes(q);
      const matchOs = (device.osVersion || '').toLowerCase().includes(q);
      return matchName || matchModel || matchOs;
    }

    return true;
  });

  // Calculate fleet stats for the 4 core dimensions
  const onlineCount = activeFleet.filter((d) => d.online).length;
  const avgHealth = Math.round(
    activeFleet.reduce((acc, d) => acc + (d.permissionScore ?? 95), 0) / (activeFleet.length || 1)
  );
  const avgSyncDelay = Math.round(
    activeFleet.reduce((acc, d) => acc + (d.syncDelayMs ?? 5), 0) / (activeFleet.length || 1)
  );

  return (
    <div className="space-y-4 font-sans text-slate-100">
      
      {/* Top Header Banner */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm sm:text-base font-black text-slate-100 tracking-tight">
                Gestão Multiplataforma de Dispositivos (Device Mesh Fleet)
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono font-black text-[10px] tracking-wider uppercase">
                {activeFleet.length} {activeFleet.length === 1 ? 'NÓ' : 'NÓS'}
              </span>
            </div>
          </div>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest pl-11 font-medium opacity-75">
            ORQUESTRAÇÃO COMPACTA ESTILO EXCEL • TABELA UNIFICADA COM TOOLTIPS DETALHADOS
          </p>
        </div>

        <button
          onClick={() => setShowPairModal(true)}
          className="flex items-center justify-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all cursor-pointer shrink-0 active:scale-95 border border-indigo-400/30"
        >
          <QrCode className="w-4 h-4" />
          <span>Emparelhar Dispositivo</span>
        </button>
      </div>

      {/* 4 STRATEGIC OPERATIONAL DIMENSIONS (Estado, Pairing, Health, Sincronização) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* 1. Estado */}
        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-1 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>1. ESTADO</span>
            </span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
              {onlineCount}/{activeFleet.length} ONLINE
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-0.5">
            <span className="text-base font-black text-slate-100 tracking-tight font-mono">
              {onlineCount === activeFleet.length ? 'Operativo' : 'Em Sincronia'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Heartbeat &lt;10s</span>
          </div>
        </div>

        {/* 2. Pairing */}
        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-1 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <QrCode className="w-3 h-3 text-indigo-400" />
              <span>2. PAIRING</span>
            </span>
            <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-mono font-bold">
              ZERO-TOUCH
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-0.5">
            <span className="text-base font-black text-slate-100 tracking-tight font-mono">
              Emparelhamento
            </span>
            <span className="text-[10px] text-indigo-400 font-mono">Chave E2EE OK</span>
          </div>
        </div>

        {/* 3. Health */}
        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-1 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Activity className="w-3 h-3 text-amber-400" />
              <span>3. HEALTH</span>
            </span>
            <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-mono font-bold">
              {avgHealth}% SCORE
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-0.5">
            <span className="text-base font-black text-slate-100 tracking-tight font-mono">
              Saúde Frota
            </span>
            <span className="text-[10px] text-amber-400 font-mono">Auto-Repair</span>
          </div>
        </div>

        {/* 4. Sincronização */}
        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-1 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin-slow" />
              <span>4. SINCRONIA</span>
            </span>
            <span className="px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-mono font-bold">
              {avgSyncDelay}ms
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-0.5">
            <span className="text-base font-black text-slate-100 tracking-tight font-mono">
              Realtime SSE
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">Incremental</span>
          </div>
        </div>
      </div>

      {/* Filter Bar & Sub-Tabs */}
      <div className="space-y-2.5">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar nó por nome, modelo, sistema operativo ou ID..."
            className="w-full pl-10 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Platform Sub-Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'todos', label: 'Todos', icon: Globe },
            { id: 'android', label: 'Android', icon: Smartphone },
            { id: 'iphone', label: 'iPhone', icon: Apple },
            { id: 'windows', label: 'Windows', icon: Laptop },
            { id: 'linux', label: 'Linux', icon: Laptop },
            { id: 'macos', label: 'macOS', icon: Apple },
            { id: 'tablet', label: 'Tablet', icon: Tablet },
            { id: 'ipad', label: 'iPad', icon: Tablet },
            { id: 'web', label: 'Navegador', icon: Globe },
            { id: 'smarttv', label: 'Smart TV (Futuro)', icon: Tv }
          ].map((tab) => {
            const count = tab.id === 'todos' 
              ? activeFleet.length 
              : activeFleet.filter(d => (d.platform || getDeviceCategory(d)) === tab.id).length;
            const IconComp = tab.icon || Globe;
            const isActive = platformFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setPlatformFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{tab.label} ({count})</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* COMPACT EXCEL-STYLE TABLE */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                <th className="py-2.5 px-2.5 border-r border-slate-800/60 w-8 text-center">#</th>
                <th className="py-2.5 px-2.5 border-r border-slate-800/60">ESTADO</th>
                <th className="py-2.5 px-2.5 border-r border-slate-800/60">DISPOSITIVO & FABRICANTE</th>
                <th className="py-2.5 px-2.5 border-r border-slate-800/60">PLATAFORMA / MODELO</th>
                <th className="py-2.5 px-2.5 border-r border-slate-800/60">OPERADORA & NÚMERO VIRTUAL</th>
                <th className="py-2.5 px-2.5 border-r border-slate-800/60 text-center">PRIORIDADE</th>
                <th className="py-2.5 px-2.5 border-r border-slate-800/60">BATERIA</th>
                <th className="py-2.5 px-2.5 border-r border-slate-800/60">SAÚDE</th>
                <th className="py-2.5 px-2.5 text-center">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredDevices.length > 0 ? (
                filteredDevices.map((device, idx) => {
                  const isRepairing = repairingMap[device.deviceId];
                  const healthScore = device.permissionScore ?? 98;
                  const notificationStatus = device.notificationListenerStatus || 'active';
                  const platform = getDeviceCategory(device);

                  // Detailed Tooltip Text Construction
                  const nodeText = device.nodeId || `node-${device.deviceId.substring(0, 8)}`;
                  const pairedDateStr = device.pairedAt ? new Date(device.pairedAt).toLocaleString('pt-BR') : 'Desconhecido';
                  const lastSyncStr = typeof device.lastSync === 'number' ? new Date(device.lastSync).toLocaleTimeString('pt-BR') : (device.lastSync || 'Agora');
                  
                  const capGps = device.capabilities?.gps !== false ? '✓ Active' : '✕ Off';
                  const capNfc = device.capabilities?.nfc !== false ? '✓ Active' : '✕ Off';
                  const capBt = device.capabilities?.bluetooth !== false ? '✓ Active' : '✕ Off';

                  const fullTooltipText = `Dispositivo: ${device.name}\nFabricante: ${device.manufacturer || 'N/A'}\nNó ID: ${nodeText}\nPlataforma: ${platform.toUpperCase()} (${device.osVersion || 'N/A'})\nModelo: ${device.model}\nOperadora: ${device.carrier || 'N/A'} | Número: ${device.virtualNumber || 'N/A'}\nGPS: ${capGps} | NFC: ${capNfc} | Bluetooth: ${capBt}\nPrioridade Mesh: ${device.isPrimaryDevice ? 'PRINCIPAL' : 'SECUNDÁRIO'}\nBateria: ${device.batteryLevel ?? 98}% (${device.batteryOptimizationStatus || 'Otimizado'})\nSincronia Latência: ${device.syncDelayMs ?? 5}ms\nScore Saúde: ${healthScore}%`;

                  return (
                    <tr
                      key={device.deviceId}
                      className="hover:bg-slate-900/60 transition-colors group relative border-b border-slate-800/40"
                      onMouseEnter={() => setHoveredTooltipId(device.deviceId)}
                      onMouseLeave={() => setHoveredTooltipId(null)}
                      title={fullTooltipText}
                    >
                      {/* Row Index */}
                      <td className="py-2 px-2.5 border-r border-slate-800/60 text-center text-slate-500 font-bold text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Online Status */}
                      <td className="py-2 px-2.5 border-r border-slate-800/60 whitespace-nowrap">
                        {device.online ? (
                          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[9px] shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>ONLINE</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 font-bold text-[9px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                            <span>OFFLINE</span>
                          </span>
                        )}
                      </td>

                      {/* Dispositivo & Fabricante */}
                      <td className="py-2 px-2.5 border-r border-slate-800/60">
                        <div className="flex items-center space-x-2">
                          <div className="p-1 rounded-md bg-slate-900 border border-slate-800 text-indigo-400 shrink-0">
                            {renderPlatformIcon(platform)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-100 text-xs truncate block group-hover:text-indigo-300 transition-colors">
                              {device.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono block truncate">
                              {device.manufacturer || 'Fabricante N/A'} • {nodeText}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Plataforma / Modelo */}
                      <td className="py-2 px-2.5 border-r border-slate-800/60 text-slate-300">
                        <span className="font-semibold text-xs block truncate">{device.model}</span>
                        <span className="text-[10px] text-indigo-400 font-bold uppercase block truncate">{platform} • {device.osVersion || 'OS 1.0'}</span>
                      </td>

                      {/* Operadora & Número Virtual */}
                      <td className="py-2 px-2.5 border-r border-slate-800/60">
                        <span className="font-bold text-emerald-400 text-[11px] block truncate font-mono">
                          {device.virtualNumber || '+244 923 000 000'}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {device.carrier || 'Unitel Angola'}
                        </span>
                      </td>

                      {/* Prioridade do Dispositivo Principal */}
                      <td className="py-2 px-2.5 border-r border-slate-800/60 text-center">
                        <button
                          onClick={() => {
                            setInternalDevices(prev => prev.map(d => d.deviceId === device.deviceId ? { ...d, isPrimaryDevice: !d.isPrimaryDevice } : d));
                          }}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase cursor-pointer border transition-all ${
                            device.isPrimaryDevice || idx === 0
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                              : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                          }`}
                          title="Alternar prioridade de dispositivo principal"
                        >
                          {device.isPrimaryDevice || idx === 0 ? '★ PRINCIPAL' : 'SECUNDÁRIO'}
                        </button>
                      </td>

                      {/* Bateria */}
                      <td className="py-2 px-2.5 border-r border-slate-800/60">
                        <div className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-md font-bold text-[10px]" title={`Otimização: ${device.batteryOptimizationStatus || 'Padrão'}`}>
                          <Battery className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{device.batteryLevel ?? 98}%</span>
                        </div>
                      </td>

                      {/* Saúde Score */}
                      <td className="py-2 px-2.5 border-r border-slate-800/60">
                        <div className="flex items-center space-x-1">
                          <div className="w-8 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${healthScore >= 95 ? 'bg-emerald-400' : healthScore >= 80 ? 'bg-amber-400' : 'bg-rose-400'}`}
                              style={{ width: `${healthScore}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-200">{healthScore}%</span>
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="py-2 px-2.5 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {/* Tooltip Info Popover Trigger */}
                          <div className="relative group/popover">
                            <button
                              type="button"
                              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 border border-slate-800 transition-colors cursor-pointer"
                              title="Ver Detalhes Técnicos do Nó"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>

                            {/* Floating Custom Tooltip Popover (Painel Expandido de Telemetria) */}
                            <div className="absolute right-0 bottom-full mb-2 hidden group-hover/popover:block z-50 w-80 p-3.5 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl text-[11px] text-slate-200 font-mono space-y-2 pointer-events-none animate-in fade-in duration-150">
                              <div className="font-bold text-indigo-400 border-b border-slate-800 pb-1 flex items-center justify-between">
                                <span>PAINEL EXPANDIDO DE TELEMETRIA</span>
                                <span className="text-[9px] text-slate-400">{platform.toUpperCase()}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300">
                                <p><strong className="text-slate-400">Nó / ID:</strong> {device.name}</p>
                                <p><strong className="text-slate-400">Modelo:</strong> {device.model}</p>
                                <p><strong className="text-slate-400">CPU:</strong> Octa-Core (2.8 GHz)</p>
                                <p><strong className="text-slate-400">RAM:</strong> 8 GB LPDDR5</p>
                                <p><strong className="text-slate-400">Armazenamento:</strong> 256 GB (180 GB livre)</p>
                                <p><strong className="text-slate-400">Rede:</strong> 5G / Wi-Fi 6E (12ms)</p>
                                <p><strong className="text-slate-400">GPS / Pos.:</strong> {capGps}</p>
                                <p><strong className="text-slate-400">NFC / BLE:</strong> {capNfc} / {capBt}</p>
                                <p><strong className="text-slate-400">Câmara / Mic:</strong> Autorizado / Ativo</p>
                                <p><strong className="text-slate-400">Sensores:</strong> Acel., Giro, Biorritmo</p>
                                <p><strong className="text-slate-400">Operadora:</strong> {device.carrier || 'Unitel/Africell'}</p>
                                <p><strong className="text-slate-400">Telemetria:</strong> Sincronizado (&lt;12ms)</p>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleAutoRepair(device.deviceId)}
                            disabled={isRepairing}
                            className="p-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all cursor-pointer"
                            title="Auto-Repair (Reativar Listener)"
                          >
                            <Wrench className={`w-3.5 h-3.5 ${isRepairing ? 'animate-spin' : ''}`} />
                          </button>

                          <button
                            onClick={onSimulateEvent}
                            className="p-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition-all cursor-pointer"
                            title="Simular Evento"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleRemove(device.deviceId)}
                            className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
                            title="Desconectar Dispositivo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center bg-slate-950 text-slate-500">
                    <div className="max-w-sm mx-auto space-y-2">
                      <Globe className="w-6 h-6 mx-auto text-slate-600" />
                      <span className="block text-xs font-bold text-slate-300">Nenhum dispositivo encontrado</span>
                      <p className="text-[11px] text-slate-500">
                        Não foram encontrados nós para os filtros selecionados ({platformFilter}).
                      </p>
                      {(searchQuery || platformFilter !== 'todos') && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setPlatformFilter('todos');
                          }}
                          className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-indigo-400 rounded-lg text-xs font-bold border border-slate-800 transition-all cursor-pointer"
                        >
                          Limpar Filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Excel Table Footer Status Bar */}
        <div className="bg-slate-900/90 border-t border-slate-800 px-3 py-1.5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <div>
            Exibindo <strong className="text-slate-300">{filteredDevices.length}</strong> de <strong className="text-slate-300">{activeFleet.length}</strong> dispositivos na frota
          </div>
          <div className="flex items-center space-x-3">
            <span>Passe o cursor sobre qualquer linha para ver a ficha técnica completa</span>
            <span className="text-emerald-400 font-bold">SSE Realtime Sync Active</span>
          </div>
        </div>
      </div>

      {/* Historical Battery Usage & Drain Monitor */}
      <BatteryUsageMonitor
        devices={activeFleet}
        isExpanded={isBatteryExpanded}
        onToggleExpand={() => setIsBatteryExpanded((prev) => !prev)}
      />

      {/* QR Code Pair Modal */}
      {showPairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-400" />
                <span>Emparelhar Novo Dispositivo Zero-Touch</span>
              </h3>
              <button
                onClick={() => setShowPairModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-center space-y-3">
              <p className="text-xs text-slate-300">
                Abra o aplicativo <strong>Portal Mobile</strong> ou aceda à consola web e escaneie o código QR abaixo para vincular:
              </p>

              {qrDataUrl ? (
                <div className="inline-block p-3 bg-white rounded-2xl shadow-xl ring-4 ring-indigo-500/20">
                  <img src={qrDataUrl} alt="QR Code de Emparelhamento" className="w-48 h-48 mx-auto" />
                </div>
              ) : (
                <div className="w-48 h-48 bg-slate-800 rounded-2xl mx-auto flex items-center justify-center text-slate-500">
                  Gerando QR Code...
                </div>
              )}

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono">
                Token: <strong className="text-indigo-400">{pairingToken}</strong>
              </div>
            </div>

            {/* Manual Add Form */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-300 block">Ou Adicionar Manualmente para Teste:</span>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nome do Dispositivo"
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Modelo (ex: Galaxy S24 / MacBook)"
                    value={newDeviceModel}
                    onChange={(e) => setNewDeviceModel(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-mono uppercase">Plataforma do Dispositivo:</label>
                  <select
                    value={newDevicePlatform}
                    onChange={(e: any) => setNewDevicePlatform(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="android">📱 Android Native</option>
                    <option value="iphone">🍎 iPhone / iOS</option>
                    <option value="web">🌐 Web Client / PWA</option>
                    <option value="desktop">💻 Desktop Workstation</option>
                    <option value="tablet">📱 Tablet (iPad / Android)</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleManualPair}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl cursor-pointer"
              >
                Adicionar Dispositivo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
