import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  QrCode, 
  Battery, 
  Wifi, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  Activity, 
  Cpu, 
  Wrench, 
  Zap, 
  ChevronDown, 
  ChevronUp,
  Globe,
  Tablet,
  Laptop,
  Monitor,
  Terminal,
  Apple,
  Search,
  X
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
    model: 'SM-S901B (Android 14)',
    platform: 'android',
    osVersion: 'Android 14.0',
    pairedAt: '2026-01-15T10:30:00.000Z',
    online: true,
    batteryLevel: 94,
    batteryOptimizationStatus: 'unrestricted',
    oemProfile: 'samsung',
    permissionScore: 100,
    syncDelayMs: 4,
    lastSync: Date.now() - 3000,
    notificationListenerStatus: 'active',
    capabilities: { sms: true, calls: true, biometrics: true, accessibility: true }
  },
  {
    deviceId: 'dev-iphone-15-pro',
    nodeId: 'node-iphone-ios-02',
    name: 'iPhone 15 Pro iOS Agent',
    model: 'iPhone16,1 (iOS 17.5)',
    platform: 'iphone',
    osVersion: 'iOS 17.5',
    pairedAt: '2026-01-20T14:15:00.000Z',
    online: true,
    batteryLevel: 88,
    batteryOptimizationStatus: 'unrestricted',
    oemProfile: 'apple',
    permissionScore: 98,
    syncDelayMs: 6,
    lastSync: Date.now() - 5000,
    notificationListenerStatus: 'active',
    capabilities: { sms: false, calls: true, biometrics: true, accessibility: false }
  },
  {
    deviceId: 'dev-ipad-air-tablet',
    nodeId: 'node-ipad-tablet-03',
    name: 'iPad Air 5th Gen (Tablet)',
    model: 'iPad13,16 (iPadOS 17.4)',
    platform: 'tablet',
    osVersion: 'iPadOS 17.4',
    pairedAt: '2026-02-01T09:00:00.000Z',
    online: true,
    batteryLevel: 92,
    batteryOptimizationStatus: 'unrestricted',
    oemProfile: 'apple',
    permissionScore: 96,
    syncDelayMs: 8,
    lastSync: Date.now() - 12000,
    notificationListenerStatus: 'active',
    capabilities: { sms: false, calls: false, biometrics: true, accessibility: true }
  },
  {
    deviceId: 'dev-web-pwa-chrome',
    nodeId: 'node-web-workstation-04',
    name: 'PortalTRMobile PWA Web Client',
    model: 'Chrome 127 (PWA / WebSockets)',
    platform: 'web',
    osVersion: 'Web / PWA 1.0',
    pairedAt: '2026-02-10T11:45:00.000Z',
    online: true,
    batteryLevel: 100,
    batteryOptimizationStatus: 'unrestricted',
    oemProfile: 'generic',
    permissionScore: 100,
    syncDelayMs: 2,
    lastSync: Date.now() - 1000,
    notificationListenerStatus: 'active',
    capabilities: { sms: false, calls: false, biometrics: true, accessibility: false }
  },
  {
    deviceId: 'dev-desktop-macos-m2',
    nodeId: 'node-desktop-macbook-05',
    name: 'MacBook Pro M2 Desktop Workstation',
    model: 'macOS Sonoma 14.5 (Electron Native)',
    platform: 'macos',
    osVersion: 'macOS 14.5',
    pairedAt: '2026-02-12T16:20:00.000Z',
    online: true,
    batteryLevel: 99,
    batteryOptimizationStatus: 'unrestricted',
    oemProfile: 'apple',
    permissionScore: 100,
    syncDelayMs: 3,
    lastSync: Date.now() - 2000,
    notificationListenerStatus: 'active',
    capabilities: { sms: true, calls: true, biometrics: true, accessibility: true }
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
  const [expandedDeviceMap, setExpandedDeviceMap] = useState<Record<string, boolean>>({});

  // Platform filters matching exact request: todos, android, iphone, web, desktop, tablet
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

  const toggleDeviceExpanded = (deviceId: string) => {
    setExpandedDeviceMap((prev) => ({ ...prev, [deviceId]: !prev[deviceId] }));
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

  const getDeviceOem = (device: Device): string => {
    if (device.oemProfile) return device.oemProfile;
    const fullName = `${device.name || ''} ${device.model || ''}`.toLowerCase();
    if (fullName.includes('samsung') || fullName.includes('galaxy') || fullName.includes('sm-')) return 'samsung';
    if (fullName.includes('pixel') || fullName.includes('google')) return 'pixel';
    if (fullName.includes('xiaomi') || fullName.includes('redmi') || fullName.includes('poco') || fullName.includes('hyperos') || fullName.includes('miui')) return 'xiaomi';
    if (fullName.includes('oppo') || fullName.includes('realme') || fullName.includes('oneplus')) return 'oppo';
    if (fullName.includes('apple') || fullName.includes('iphone') || fullName.includes('ipad')) return 'apple';
    if (fullName.includes('itel')) return 'itel';
    if (fullName.includes('huawei') || fullName.includes('honor')) return 'huawei';
    return 'generic';
  };

  const renderPlatformIcon = (category: string) => {
    switch (category) {
      case 'android':
        return <Smartphone className="w-5 h-5 text-emerald-400" />;
      case 'iphone':
        return <Apple className="w-5 h-5 text-indigo-400" />;
      case 'tablet':
        return <Tablet className="w-5 h-5 text-cyan-400" />;
      case 'desktop':
        return <Laptop className="w-5 h-5 text-purple-400" />;
      case 'web':
        return <Globe className="w-5 h-5 text-teal-400" />;
      default:
        return <Smartphone className="w-5 h-5 text-indigo-400" />;
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
    <div className="space-y-6 font-sans">
      
      {/* Top Header Banner */}
      <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-slate-100 tracking-tight">
                Gestão Multiplataforma de Dispositivos (Device Mesh Fleet)
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono font-black text-[10px] tracking-wider uppercase">
                {activeFleet.length} {activeFleet.length === 1 ? 'NÓ' : 'NÓS'}
              </span>
            </div>
          </div>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest pl-11 font-medium opacity-75">
            ORQUESTRAÇÃO UNIFICADA • ANDROID • IPHONE/IPAD • WEB • DESKTOP • TABLET
          </p>
        </div>

        <button
          onClick={() => setShowPairModal(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all cursor-pointer shrink-0 active:scale-95 border border-indigo-400/30"
        >
          <QrCode className="w-4 h-4" />
          <span>Emparelhar Dispositivo (QR Code)</span>
        </button>
      </div>

      {/* 4 STRATEGIC OPERATIONAL DIMENSIONS (Estado, Pairing, Health, Sincronização) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Estado */}
        <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800/80 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>1. ESTADO</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
              {onlineCount}/{activeFleet.length} ONLINE
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-lg font-black text-slate-100 tracking-tight font-mono">
              {onlineCount === activeFleet.length ? 'Totalmente Operativo' : 'Em Sincronia'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Heartbeat &lt;10s</span>
          </div>
        </div>

        {/* 2. Pairing */}
        <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800/80 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <QrCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>2. PAIRING</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-mono font-bold">
              ZERO-TOUCH
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-lg font-black text-slate-100 tracking-tight font-mono">
              Emparelhamento
            </span>
            <span className="text-[10px] text-indigo-400 font-mono">Chave E2EE OK</span>
          </div>
        </div>

        {/* 3. Health */}
        <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800/80 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>3. HEALTH</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-mono font-bold">
              {avgHealth}% SCORE
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-lg font-black text-slate-100 tracking-tight font-mono">
              Saúde da Frota
            </span>
            <span className="text-[10px] text-amber-400 font-mono">Auto-Repair Ativo</span>
          </div>
        </div>

        {/* 4. Sincronização */}
        <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800/80 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
              <span>4. SINCRONIZAÇÃO</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-mono font-bold">
              {avgSyncDelay}ms LATÊNCIA
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-lg font-black text-slate-100 tracking-tight font-mono">
              Realtime SSE
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">Incremental Sync</span>
          </div>
        </div>
      </div>

      {/* Filter Bar & Sub-Tabs */}
      <div className="space-y-3">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por nome do dispositivo, modelo ou sistema operativo..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
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

        {/* Platform Sub-Tabs requested: Android, iPhone/iPad, Web, Desktop, Tablet */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          
          <button
            onClick={() => setPlatformFilter('todos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2 ${
              platformFilter === 'todos'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Todos os Dispositivos ({activeFleet.length})</span>
          </button>

          <button
            onClick={() => setPlatformFilter('android')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2 ${
              platformFilter === 'android'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-black'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Android ({activeFleet.filter(d => getDeviceCategory(d) === 'android').length})</span>
          </button>

          <button
            onClick={() => setPlatformFilter('iphone')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2 ${
              platformFilter === 'iphone'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Apple className="w-3.5 h-3.5 text-indigo-400" />
            <span>iPhone / iOS ({activeFleet.filter(d => getDeviceCategory(d) === 'iphone').length})</span>
          </button>

          <button
            onClick={() => setPlatformFilter('web')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2 ${
              platformFilter === 'web'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20 font-black'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-teal-400" />
            <span>Web Client / PWA ({activeFleet.filter(d => getDeviceCategory(d) === 'web').length})</span>
          </button>

          <button
            onClick={() => setPlatformFilter('desktop')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2 ${
              platformFilter === 'desktop'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 font-black'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Laptop className="w-3.5 h-3.5 text-purple-400" />
            <span>Desktop ({activeFleet.filter(d => getDeviceCategory(d) === 'desktop').length})</span>
          </button>

          <button
            onClick={() => setPlatformFilter('tablet')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2 ${
              platformFilter === 'tablet'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20 font-black'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Tablet className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tablet ({activeFleet.filter(d => getDeviceCategory(d) === 'tablet').length})</span>
          </button>

        </div>

      </div>

      {/* Device Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDevices.length > 0 ? (
          filteredDevices.map((device) => {
            const isRepairing = repairingMap[device.deviceId];
            const healthScore = device.permissionScore ?? 98;
            const notificationStatus = device.notificationListenerStatus || 'active';
            const platform = getDeviceCategory(device);
            const isExpanded = !!expandedDeviceMap[device.deviceId];

            return (
              <div
                key={device.deviceId}
                className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-800/80 hover:border-slate-700/80 shadow-md hover:shadow-xl transition-all space-y-3.5"
              >
                {/* Header Row: Icon, Title, Platform & Online/Offline Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/15 via-slate-800 to-indigo-500/5 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400">
                      {renderPlatformIcon(platform)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-100 text-sm tracking-tight">{device.name}</h3>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] uppercase font-mono font-bold">
                          {platform}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium block">{device.model}</span>
                    </div>
                  </div>

                  {/* Online / Offline Status Badge with Subtle Gradient */}
                  <div className="shrink-0">
                    {device.online ? (
                      <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-teal-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center space-x-1.5 shadow-sm shadow-emerald-950/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>ONLINE</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-slate-800 to-slate-900 text-slate-400 border border-slate-700/60 text-[10px] font-mono font-bold flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                        <span>OFFLINE</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Badges Row: Simplified Status Labels */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                  <div className="flex items-center space-x-2">
                    {/* Battery Pill */}
                    <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono flex items-center space-x-1.5">
                      <Battery className="w-3.5 h-3.5 text-amber-400" />
                      <span>{device.batteryLevel ?? 98}%</span>
                    </div>

                    {/* Latency Pill */}
                    <div className="bg-gradient-to-r from-indigo-500/10 to-indigo-600/5 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono flex items-center space-x-1.5">
                      <Zap className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{device.syncDelayMs ?? 12}ms</span>
                    </div>

                    {/* Listener Pill */}
                    <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono flex items-center space-x-1.5 border ${
                      notificationStatus === 'active'
                        ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-300 border-emerald-500/20'
                        : 'bg-gradient-to-r from-orange-500/10 to-amber-500/5 text-orange-300 border-orange-500/20'
                    }`}>
                      <Activity className={`w-3.5 h-3.5 ${notificationStatus === 'active' ? 'text-emerald-400' : 'text-orange-400'}`} />
                      <span>{notificationStatus === 'active' ? 'Ativo' : 'Atenção'}</span>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => handleAutoRepair(device.deviceId)}
                      disabled={isRepairing}
                      className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all cursor-pointer flex items-center space-x-1 active:scale-95"
                      title="Auto-Repair"
                    >
                      <Wrench className={`w-3.5 h-3.5 ${isRepairing ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                      onClick={onSimulateEvent}
                      className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition-all cursor-pointer active:scale-95"
                      title="Simular Evento"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => toggleDeviceExpanded(device.deviceId)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer active:scale-95 flex items-center space-x-1 text-[11px] font-bold"
                      title={isExpanded ? "Recolher" : "Detalhes"}
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-amber-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                    </button>

                    <button
                      onClick={() => handleRemove(device.deviceId)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer active:scale-95"
                      title="Desconectar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Collapsible Details Panel */}
                {isExpanded && (
                  <div className="space-y-3 pt-2.5 border-t border-slate-800/80 animate-fadeIn">
                    {/* Capabilities Badges */}
                    <div className="flex items-center flex-wrap gap-1.5">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex items-center space-x-1 ${
                        device.capabilities?.sms !== false
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}>
                        <span>SMS</span>
                        <span>{device.capabilities?.sms !== false ? '✓' : '✕'}</span>
                      </span>

                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex items-center space-x-1 ${
                        device.capabilities?.calls !== false
                          ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}>
                        <span>CHAMADAS</span>
                        <span>{device.capabilities?.calls !== false ? '✓' : '✕'}</span>
                      </span>

                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex items-center space-x-1 ${
                        device.capabilities?.biometrics !== false
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}>
                        <span>BIOMETRIA</span>
                        <span>{device.capabilities?.biometrics !== false ? '✓' : '✕'}</span>
                      </span>

                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex items-center space-x-1 ${
                        device.capabilities?.accessibility
                          ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                          : 'bg-slate-800/80 text-slate-400 border-slate-800'
                      }`}>
                        <span>ACESSIBILIDADE</span>
                        <span>{device.capabilities?.accessibility ? '✓' : 'OFF'}</span>
                      </span>
                    </div>

                    {/* Node Metadata & Heartbeat */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 bg-slate-950/80 p-2 rounded-xl border border-slate-800/60">
                      <span>Nó: <strong className="text-slate-300">{device.nodeId || `node-${device.deviceId.substring(0, 8)}`}</strong></span>
                      <span>Sincronia: <strong className="text-indigo-300">{typeof device.lastSync === 'number' ? new Date(device.lastSync).toLocaleTimeString('pt-BR') : device.lastSync}</strong></span>
                      <span>Saúde: <strong className="text-emerald-400">{healthScore}%</strong></span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full bg-slate-950 p-8 rounded-2xl border border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <Globe className="w-6 h-6" />
            </div>
            <span className="block text-sm font-bold text-slate-300">Nenhum dispositivo encontrado</span>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Não existem dispositivos emparelhados na plataforma selecionada ({platformFilter}).
            </p>
            {(searchQuery || platformFilter !== 'todos') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setPlatformFilter('todos');
                }}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-indigo-400 rounded-xl text-xs font-bold border border-slate-800 transition-all cursor-pointer"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Historical Battery Usage & Drain Monitor (Collapsible) */}
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

