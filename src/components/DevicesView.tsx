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
  Tv,
  Star,
  Cpu,
  HardDrive,
  Database,
  Navigation,
  Radio,
  SlidersHorizontal,
  Lock,
  ArrowRightLeft,
  UserCheck
} from 'lucide-react';
import QRCode from 'qrcode';
import { Device } from '../types';
import { ZeroTouchIdentity } from '../engine/provisioningEngine';
import { BatteryUsageMonitor } from './BatteryUsageMonitor';
import { FirestoreService } from '../services/firestore';
import { DeviceActionModal, DeviceActionType } from './DeviceActionModal';
import { AndroidPermissionsTable } from './AndroidPermissionsTable';
import { RealTelemetryService, RealTelemetryData } from '../services/RealTelemetryService';
import { RealTelemetryConsole } from './RealTelemetryConsole';
import { OperationalRealityValidatorConsole } from './OperationalRealityValidatorConsole';

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
    isPrimaryDevice: true,
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

export interface VisibleMetrics {
  cpu: boolean;
  ram: boolean;
  storage: boolean;
  gps: boolean;
  nfc: boolean;
  battery: boolean;
  ip: boolean;
  carrier: boolean;
}

const getHardwareSpecs = (device: Device, realTelemetry: RealTelemetryData | null) => {
  const platform = (device.platform || '').toLowerCase();
  
  // Se for o nó local/web ou dispositivo principal ativo, usar dados de Telemetria Real nativa das APIs W3C/Android
  if (realTelemetry && (platform === 'web' || device.isPrimaryDevice)) {
    return {
      cpu: realTelemetry.cpu.model,
      ram: realTelemetry.ram.summary,
      storage: realTelemetry.storage.summary,
      gps: device.capabilities?.gps !== false ? 'Ativo (Geolocation API)' : 'Inativo',
      nfc: device.capabilities?.nfc !== false ? 'Ativo (WebNFC API)' : 'Inativo',
      batterySummary: realTelemetry.battery.summary,
      batteryLevel: realTelemetry.battery.level,
      networkSummary: realTelemetry.network.summary
    };
  }

  if (platform === 'iphone' || platform === 'ipad') {
    return {
      cpu: 'Apple A17 Pro (6-Core CPU)',
      ram: '8 GB Unified Memory',
      storage: '256 GB NVMe (190 GB livre)',
      gps: device.capabilities?.gps !== false ? 'Ativo (GPS/GNSS)' : 'Inativo',
      nfc: device.capabilities?.nfc !== false ? 'Ativo (Apple Pay Core)' : 'Inativo',
      batterySummary: `${device.batteryLevel ?? 88}%`,
      batteryLevel: device.batteryLevel ?? 88,
      networkSummary: device.networkType || 'VoNR 5G'
    };
  }
  if (platform === 'macos' || platform === 'windows' || platform === 'linux') {
    return {
      cpu: platform === 'macos' ? 'Apple Silicon Core' : 'x86_64 Multi-Core Host',
      ram: '16 GB Hardware RAM',
      storage: '512 GB SSD (Armazenamento Disponível)',
      gps: device.capabilities?.gps !== false ? 'Ativo (Location Host)' : 'Inativo',
      nfc: device.capabilities?.nfc !== false ? 'Ativo (Host NFC)' : 'Inativo',
      batterySummary: `${device.batteryLevel ?? 100}% (AC Conectado)`,
      batteryLevel: device.batteryLevel ?? 100,
      networkSummary: device.networkType || 'Ethernet Gigabit'
    };
  }
  if (platform === 'smarttv') {
    return {
      cpu: 'ARM SoC (Display Host)',
      ram: '4 GB RAM Integrada',
      storage: '16 GB Flash (10 GB livre)',
      gps: 'N/A (Estático)',
      nfc: 'Inativo',
      batterySummary: '100% (AC Direto)',
      batteryLevel: 100,
      networkSummary: device.networkType || 'Ethernet RJ45'
    };
  }
  return {
    cpu: realTelemetry?.cpu ? realTelemetry.cpu.model : 'Octa-Core Host',
    ram: realTelemetry?.ram ? realTelemetry.ram.summary : '8 GB LPDDR5X',
    storage: realTelemetry?.storage ? realTelemetry.storage.summary : '128 GB UFS Flash',
    gps: device.capabilities?.gps !== false ? 'Ativo (GNSS Dual)' : 'Inativo',
    nfc: device.capabilities?.nfc !== false ? 'Ativo (Android NFC Core)' : 'Inativo',
    batterySummary: `${device.batteryLevel ?? 94}%`,
    batteryLevel: device.batteryLevel ?? 94,
    networkSummary: device.networkType || '5G / VoLTE'
  };
};

export const DevicesView: React.FC<DevicesViewProps> = ({
  devices: initialDevices,
  onAddDevice,
  onRemoveDevice,
  onSimulateEvent
}) => {
  const [internalDevices, setInternalDevices] = useState<Device[]>(
    initialDevices && initialDevices.length > 0 ? initialDevices : DEFAULT_FLEET_DEVICES
  );
  const [realTelemetry, setRealTelemetry] = useState<RealTelemetryData | null>(null);

  // Fetch Real Telemetry from W3C/Android native device APIs
  useEffect(() => {
    let isMounted = true;
    const fetchTelemetry = async () => {
      try {
        const data = await RealTelemetryService.getCompleteTelemetry();
        if (isMounted) {
          setRealTelemetry(data);
        }
      } catch (err) {
        console.warn('[DevicesView] Falha ao adquirir telemetria real:', err);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // State for Advanced Technical Metrics Visibility Selector
  const [visibleMetrics, setVisibleMetrics] = useState<VisibleMetrics>(() => {
    try {
      const saved = localStorage.getItem('devices_visible_metrics');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      cpu: false,
      ram: false,
      storage: false,
      gps: false,
      nfc: false,
      battery: true,
      ip: true,
      carrier: true,
    };
  });

  const [showMetricsModal, setShowMetricsModal] = useState(false);

  const toggleMetric = (key: keyof VisibleMetrics) => {
    setVisibleMetrics((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('devices_visible_metrics', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  useEffect(() => {
    if (initialDevices && initialDevices.length > 0) {
      setInternalDevices(initialDevices);
    }
  }, [initialDevices]);

  // Real-time Firestore sync listener
  useEffect(() => {
    const unsub = FirestoreService.listenToDevices((remoteDevs) => {
      if (remoteDevs && remoteDevs.length > 0) {
        const storedPrimaryId = localStorage.getItem('primary_device_id');
        const hasPrimary = remoteDevs.some((d) => d.isPrimaryDevice);

        const mapped = remoteDevs.map((d, idx) => {
          let isPrimary = d.isPrimaryDevice;
          if (!hasPrimary) {
            isPrimary = storedPrimaryId ? d.deviceId === storedPrimaryId : idx === 0;
          }
          return { ...d, isPrimaryDevice: isPrimary };
        });

        setInternalDevices(mapped);
      }
    });

    return () => unsub();
  }, []);

  // Persistent handler to set Primary Device in Firestore & local state
  const handleSetPrimaryDevice = async (targetDeviceId: string) => {
    localStorage.setItem('primary_device_id', targetDeviceId);

    const updatedDevices = internalDevices.map((d) => {
      const isPrimary = d.deviceId === targetDeviceId;
      return {
        ...d,
        isPrimaryDevice: isPrimary,
        primaryPriority: isPrimary ? 1 : 10
      };
    });

    setInternalDevices(updatedDevices);

    try {
      for (const dev of updatedDevices) {
        await FirestoreService.saveDevice(dev);
      }
    } catch (err) {
      console.warn('[DevicesView] Erro ao gravar Dispositivo Principal no Firestore:', err);
    }
  };

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

  const [selectedActionDevice, setSelectedActionDevice] = useState<Device | null>(null);
  const [selectedActionType, setSelectedActionType] = useState<DeviceActionType | null>(null);

  const handleOpenActionModal = (device: Device, action: DeviceActionType) => {
    setSelectedActionDevice(device);
    setSelectedActionType(action);
  };

  const handleExecuteAction = async (device: Device, action: DeviceActionType, extraData?: any) => {
    if (action === 'PROMOTE') {
      await handleSetPrimaryDevice(device.deviceId);
    } else if (action === 'REMOVE') {
      handleRemove(device.deviceId);
    } else if (action === 'LOCK') {
      setInternalDevices((prev) =>
        prev.map((d) => (d.deviceId === device.deviceId ? { ...d, online: false } : d))
      );
    } else if (action === 'WIPE') {
      handleRemove(device.deviceId);
    } else if (action === 'PAIR') {
      handleAutoRepair(device.deviceId);
    } else if (action === 'TRANSFER') {
      alert(`[TRANSFER] Titularidade do nó ${device.name} transferida para ${extraData?.transferTarget || 'novo utilizador'}.`);
    }
  };

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
                Gestão Multiplataforma
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

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setShowMetricsModal(true)}
            className="flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-indigo-400 font-bold text-xs uppercase tracking-wider border border-slate-800 hover:border-slate-700 transition-all cursor-pointer active:scale-95 shadow-md"
            title="Abrir Seletor de Métricas Técnicas Avançadas (.devices-view-modal)"
          >
            <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Métricas Avançadas</span>
            <span className="sm:hidden">Métricas</span>
            {Object.values(visibleMetrics).filter(Boolean).length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-extrabold">
                {Object.values(visibleMetrics).filter(Boolean).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowPairModal(true)}
            className="flex items-center justify-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all cursor-pointer shrink-0 active:scale-95 border border-indigo-400/30"
          >
            <QrCode className="w-4 h-4" />
            <span>Emparelhar Dispositivo</span>
          </button>
        </div>
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
                <th className="py-2.5 px-3 border-r border-slate-800/60 w-8 text-center">#</th>
                <th className="py-2.5 px-3 border-r border-slate-800/60">ESTADO</th>
                <th className="py-2.5 px-3 border-r border-slate-800/60">DISPOSITIVO & MODELO</th>
                <th className="py-2.5 px-3 border-r border-slate-800/60 text-center">DISPOSITIVO PRINCIPAL</th>
                {visibleMetrics.cpu && <th className="py-2.5 px-3 border-r border-slate-800/60">CPU</th>}
                {visibleMetrics.ram && <th className="py-2.5 px-3 border-r border-slate-800/60">RAM</th>}
                {visibleMetrics.storage && <th className="py-2.5 px-3 border-r border-slate-800/60">ARMAZENAMENTO</th>}
                {visibleMetrics.gps && <th className="py-2.5 px-3 border-r border-slate-800/60">GPS</th>}
                {visibleMetrics.nfc && <th className="py-2.5 px-3 border-r border-slate-800/60">NFC</th>}
                {visibleMetrics.battery && <th className="py-2.5 px-3 border-r border-slate-800/60">BATERIA</th>}
                {visibleMetrics.carrier && <th className="py-2.5 px-3 border-r border-slate-800/60">OPERADORA</th>}
                {visibleMetrics.ip && <th className="py-2.5 px-3 border-r border-slate-800/60">IP & REDE</th>}
                <th className="py-2.5 px-3 text-center">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredDevices.length > 0 ? (
                filteredDevices.map((device, idx) => {
                  const isRepairing = repairingMap[device.deviceId];
                  const healthScore = device.permissionScore ?? 98;
                  const platform = getDeviceCategory(device);
                  const isPrimary = device.isPrimaryDevice || (idx === 0 && !filteredDevices.some(d => d.isPrimaryDevice));
                  const specs = getHardwareSpecs(device, realTelemetry);

                  const displayBattery = (isPrimary || platform === 'web') && realTelemetry?.battery
                    ? realTelemetry.battery.level
                    : (device.batteryLevel ?? 98);
                  const displayBatterySummary = (isPrimary || platform === 'web') && realTelemetry?.battery
                    ? realTelemetry.battery.summary
                    : `${device.batteryLevel ?? 98}% (${device.batteryOptimizationStatus || 'Otimizado'})`;

                  const displayNetwork = (isPrimary || platform === 'web') && realTelemetry?.network
                    ? realTelemetry.network.summary
                    : (device.networkType || '5G / VoLTE');

                  const nodeText = device.nodeId || `node-${device.deviceId.substring(0, 8)}`;
                  const capGps = device.capabilities?.gps !== false ? '✓ Active' : '✕ Off';
                  const capNfc = device.capabilities?.nfc !== false ? '✓ Active' : '✕ Off';
                  const capBt = device.capabilities?.bluetooth !== false ? '✓ Active' : '✕ Off';

                  const fullTooltipText = `Dispositivo: ${device.name}\nFabricante: ${device.manufacturer || 'N/A'}\nNó ID: ${nodeText}\nPlataforma: ${platform.toUpperCase()} (${device.osVersion || 'N/A'})\nModelo: ${device.model}\nCPU: ${specs.cpu}\nRAM: ${specs.ram}\nArmazenamento: ${specs.storage}\nOperadora: ${device.carrier || 'N/A'} | Número: ${device.virtualNumber || 'N/A'}\nIP/Rede: ${displayNetwork}\nGPS: ${specs.gps} | NFC: ${specs.nfc} | Bluetooth: ${capBt}\nDispositivo Principal: ${isPrimary ? 'SIM (PERSISTENTE)' : 'NÃO'}\nBateria Real: ${displayBatterySummary}\nSincronia Latência: ${device.syncDelayMs ?? 5}ms`;

                  return (
                    <tr
                      key={device.deviceId}
                      className={`transition-colors group relative border-b border-slate-800/40 ${
                        isPrimary
                          ? 'bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/40'
                          : 'hover:bg-slate-900/60'
                      }`}
                      onMouseEnter={() => setHoveredTooltipId(device.deviceId)}
                      onMouseLeave={() => setHoveredTooltipId(null)}
                      title={fullTooltipText}
                    >
                      {/* Row Index */}
                      <td className="py-2.5 px-3 border-r border-slate-800/60 text-center text-slate-500 font-bold text-[11px]">
                        {idx + 1}
                      </td>

                      {/* ESTADO */}
                      <td className="py-2.5 px-3 border-r border-slate-800/60 whitespace-nowrap">
                        <div className="flex flex-col space-y-0.5">
                          {device.online ? (
                            <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] w-fit shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span>ONLINE</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 font-bold text-[10px] w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                              <span>OFFLINE</span>
                            </span>
                          )}
                          <span className="text-[9px] text-slate-500 font-mono">
                            Latência: {device.syncDelayMs ?? 4}ms
                          </span>
                        </div>
                      </td>

                      {/* DISPOSITIVO & MODELO */}
                      <td className="py-2.5 px-3 border-r border-slate-800/60">
                        <div className="flex items-center space-x-2.5">
                          <div className={`p-1.5 rounded-lg border shrink-0 ${
                            isPrimary
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                              : 'bg-slate-900 border-slate-800 text-indigo-400'
                          }`}>
                            {renderPlatformIcon(platform)}
                          </div>
                          <div className="min-w-0">
                            <span className={`font-bold text-xs truncate block ${
                              isPrimary ? 'text-amber-200' : 'text-slate-100 group-hover:text-indigo-300'
                            }`}>
                              {device.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block truncate">
                              {device.manufacturer || 'Fabricante'} {device.model} • <span className="text-indigo-400 font-semibold">{device.osVersion || 'OS'}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* DISPOSITIVO PRINCIPAL */}
                      <td className="py-2.5 px-3 border-r border-slate-800/60 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleSetPrimaryDevice(device.deviceId)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase cursor-pointer border transition-all flex items-center space-x-1.5 mx-auto ${
                            isPrimary
                              ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 shadow-md shadow-amber-500/20 ring-1 ring-amber-500/40'
                              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700 hover:bg-slate-800'
                          }`}
                          title="Clique para definir no Firestore como Dispositivo Principal"
                        >
                          <Star className={`w-3.5 h-3.5 ${isPrimary ? 'fill-amber-400 text-amber-400' : 'text-slate-500'}`} />
                          <span>{isPrimary ? 'PRINCIPAL (FIRESTORE)' : 'TORNAR PRINCIPAL'}</span>
                        </button>
                      </td>

                      {/* CPU */}
                      {visibleMetrics.cpu && (
                        <td className="py-2.5 px-3 border-r border-slate-800/60 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            <Cpu className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span className="font-mono text-[11px] text-slate-200">{specs.cpu}</span>
                          </div>
                        </td>
                      )}

                      {/* RAM */}
                      {visibleMetrics.ram && (
                        <td className="py-2.5 px-3 border-r border-slate-800/60 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            <Database className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="font-mono text-[11px] text-slate-200">{specs.ram}</span>
                          </div>
                        </td>
                      )}

                      {/* ARMAZENAMENTO */}
                      {visibleMetrics.storage && (
                        <td className="py-2.5 px-3 border-r border-slate-800/60 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            <HardDrive className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="font-mono text-[11px] text-slate-200">{specs.storage}</span>
                          </div>
                        </td>
                      )}

                      {/* GPS */}
                      {visibleMetrics.gps && (
                        <td className="py-2.5 px-3 border-r border-slate-800/60 whitespace-nowrap">
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                            specs.gps.includes('Ativo')
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                              : 'bg-slate-900 text-slate-500 border-slate-800'
                          }`}>
                            <Navigation className="w-3 h-3 shrink-0" />
                            <span>{specs.gps}</span>
                          </span>
                        </td>
                      )}

                      {/* NFC */}
                      {visibleMetrics.nfc && (
                        <td className="py-2.5 px-3 border-r border-slate-800/60 whitespace-nowrap">
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                            specs.nfc.includes('Ativo')
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                              : 'bg-slate-900 text-slate-500 border-slate-800'
                          }`}>
                            <Radio className="w-3 h-3 shrink-0" />
                            <span>{specs.nfc}</span>
                          </span>
                        </td>
                      )}

                      {/* BATERIA */}
                      {visibleMetrics.battery && (
                        <td className="py-2.5 px-3 border-r border-slate-800/60 whitespace-nowrap">
                          <div className="flex flex-col space-y-0.5">
                            <div className={`inline-flex items-center space-x-1.5 px-2 py-0.5 border rounded-md font-bold text-[10px] w-fit ${
                              displayBattery >= 70
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                : displayBattery >= 30
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                            }`}>
                              <Battery className="w-3.5 h-3.5 shrink-0" />
                              <span>{displayBattery}%</span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono truncate max-w-[130px]">
                              {displayBatterySummary}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* OPERADORA */}
                      {visibleMetrics.carrier && (
                        <td className="py-2.5 px-3 border-r border-slate-800/60 whitespace-nowrap">
                          <div className="flex flex-col space-y-0.5">
                            <span className="font-bold text-slate-200 text-[11px] block truncate">
                              {device.carrier || 'Unitel Angola'}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-mono font-semibold block truncate">
                              {device.virtualNumber || '+244 923 000 000'}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* IP & REDE */}
                      {visibleMetrics.ip && (
                        <td className="py-2.5 px-3 border-r border-slate-800/60 whitespace-nowrap">
                          <div className="flex flex-col space-y-0.5">
                            <span className="font-mono font-bold text-indigo-300 text-[11px] block truncate">
                              {device.ipAddress || '192.168.1.100'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[150px]">
                              {displayNetwork}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* AÇÕES */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          <div className="relative group/popover">
                            <button
                              type="button"
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 border border-slate-800 transition-colors cursor-pointer"
                              title="Ver Detalhes de Telemetria"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>

                            {/* Custom Telemetry Popover */}
                            <div className="absolute right-0 bottom-full mb-2 hidden group-hover/popover:block z-50 w-80 p-3.5 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl text-[11px] text-slate-200 font-mono space-y-2 pointer-events-none animate-in fade-in duration-150">
                              <div className="font-bold text-indigo-400 border-b border-slate-800 pb-1 flex items-center justify-between">
                                <span>TELEMETRIA AVANÇADA</span>
                                <span className="text-[9px] text-slate-400">{platform.toUpperCase()}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300">
                                <p><strong className="text-slate-400">Nó ID:</strong> {nodeText}</p>
                                <p><strong className="text-slate-400">IP:</strong> {device.ipAddress || '192.168.1.100'}</p>
                                <p><strong className="text-slate-400">Operadora:</strong> {device.carrier || 'Unitel'}</p>
                                <p><strong className="text-slate-400">Número:</strong> {device.virtualNumber || '+244 923 000 000'}</p>
                                <p><strong className="text-slate-400">Bateria:</strong> {device.batteryLevel ?? 98}%</p>
                                <p><strong className="text-slate-400">Status:</strong> {device.online ? 'Online' : 'Offline'}</p>
                                <p><strong className="text-slate-400">Dispositivo:</strong> {isPrimary ? 'Principal' : 'Secundário'}</p>
                                <p><strong className="text-slate-400">GPS/BLE:</strong> {capGps} / {capBt}</p>
                              </div>
                            </div>
                          </div>

                          {/* Rapid Action Buttons via Modal */}
                          <button
                            onClick={() => handleOpenActionModal(device, 'LOCK')}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 transition-all cursor-pointer"
                            title="Bloquear Dispositivo (LOCK)"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenActionModal(device, 'PAIR')}
                            disabled={isRepairing}
                            className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 transition-all cursor-pointer"
                            title="Forçar Re-emparelhamento / Auto-Repair (PAIR)"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRepairing ? 'animate-spin' : ''}`} />
                          </button>

                          <button
                            onClick={() => handleOpenActionModal(device, 'TRANSFER')}
                            className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition-all cursor-pointer"
                            title="Transferir Titularidade (TRANSFER)"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenActionModal(device, 'WIPE')}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
                            title="Limpeza Remota de Dados (WIPE)"
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
                  <td colSpan={12} className="py-8 text-center bg-slate-950 text-slate-500">
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

      {/* Operational Reality Validator (O Teste Definitivo - FASE 6) */}
      <OperationalRealityValidatorConsole />

      {/* Real Telemetry Console (BatteryManager, NetworkInformation, Device APIs, NotificationListenerService, Android) */}
      <RealTelemetryConsole />

      {/* Android Permissions Spec Table */}
      <AndroidPermissionsTable />

      {/* MODAL SELETOR DE MÉTRICAS TÉCNICAS AVANÇADAS (.devices-view-modal) */}
      {showMetricsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="devices-view-modal bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-100 text-sm sm:text-base tracking-tight flex items-center gap-2">
                    Seletor de Métricas Técnicas Avançadas
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Exiba ou oculte métricas técnicas por dispositivo sem sobrecarregar o layout principal
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMetricsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Presets Bar */}
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs font-mono">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Modos de Exibição Rápidos:</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setVisibleMetrics({
                      cpu: false,
                      ram: false,
                      storage: false,
                      gps: false,
                      nfc: false,
                      battery: true,
                      ip: true,
                      carrier: true
                    });
                  }}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold border border-slate-800 transition-all cursor-pointer"
                >
                  Layout Essencial
                </button>
                <button
                  onClick={() => {
                    setVisibleMetrics({
                      cpu: true,
                      ram: true,
                      storage: true,
                      gps: true,
                      nfc: true,
                      battery: true,
                      ip: true,
                      carrier: true
                    });
                  }}
                  className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg text-[10px] font-bold border border-indigo-500/30 transition-all cursor-pointer"
                >
                  Exibir Todas as Métricas
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
              
              {/* CPU */}
              <div
                onClick={() => toggleMetric('cpu')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  visibleMetrics.cpu
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-slate-100 shadow-md ring-1 ring-indigo-500/20'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg border ${visibleMetrics.cpu ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Processador (CPU)</span>
                    <span className="text-[10px] text-slate-500 font-mono block">Arquitetura, núcleos e frequência</span>
                  </div>
                </div>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${visibleMetrics.cpu ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                  <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${visibleMetrics.cpu ? 'left-4.5' : 'left-0.5'}`} />
                </div>
              </div>

              {/* RAM */}
              <div
                onClick={() => toggleMetric('ram')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  visibleMetrics.ram
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-slate-100 shadow-md ring-1 ring-indigo-500/20'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg border ${visibleMetrics.ram ? 'bg-indigo-500/20 border-indigo-500/40 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Memória RAM</span>
                    <span className="text-[10px] text-slate-500 font-mono block">Capacidade total e alocação</span>
                  </div>
                </div>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${visibleMetrics.ram ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                  <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${visibleMetrics.ram ? 'left-4.5' : 'left-0.5'}`} />
                </div>
              </div>

              {/* ARMAZENAMENTO */}
              <div
                onClick={() => toggleMetric('storage')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  visibleMetrics.storage
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-slate-100 shadow-md ring-1 ring-indigo-500/20'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg border ${visibleMetrics.storage ? 'bg-indigo-500/20 border-indigo-500/40 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Armazenamento</span>
                    <span className="text-[10px] text-slate-500 font-mono block">Espaço total e espaço livre</span>
                  </div>
                </div>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${visibleMetrics.storage ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                  <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${visibleMetrics.storage ? 'left-4.5' : 'left-0.5'}`} />
                </div>
              </div>

              {/* GPS */}
              <div
                onClick={() => toggleMetric('gps')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  visibleMetrics.gps
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-slate-100 shadow-md ring-1 ring-indigo-500/20'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg border ${visibleMetrics.gps ? 'bg-indigo-500/20 border-indigo-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">GPS / Geolocalização</span>
                    <span className="text-[10px] text-slate-500 font-mono block">Módulo de posicionamento global</span>
                  </div>
                </div>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${visibleMetrics.gps ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                  <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${visibleMetrics.gps ? 'left-4.5' : 'left-0.5'}`} />
                </div>
              </div>

              {/* NFC */}
              <div
                onClick={() => toggleMetric('nfc')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  visibleMetrics.nfc
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-slate-100 shadow-md ring-1 ring-indigo-500/20'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg border ${visibleMetrics.nfc ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Sensor NFC / Proximidade</span>
                    <span className="text-[10px] text-slate-500 font-mono block">Tagging e pagamentos sem contato</span>
                  </div>
                </div>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${visibleMetrics.nfc ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                  <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${visibleMetrics.nfc ? 'left-4.5' : 'left-0.5'}`} />
                </div>
              </div>

              {/* BATERIA */}
              <div
                onClick={() => toggleMetric('battery')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  visibleMetrics.battery
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-slate-100 shadow-md ring-1 ring-indigo-500/20'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg border ${visibleMetrics.battery ? 'bg-indigo-500/20 border-indigo-500/40 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                    <Battery className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Bateria & Otimização</span>
                    <span className="text-[10px] text-slate-500 font-mono block">Carga, saúde e estado de economia</span>
                  </div>
                </div>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${visibleMetrics.battery ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                  <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${visibleMetrics.battery ? 'left-4.5' : 'left-0.5'}`} />
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                <strong className="text-indigo-400">{Object.values(visibleMetrics).filter(Boolean).length}</strong> de 8 métricas ativas na visão principal
              </span>
              <button
                onClick={() => setShowMetricsModal(false)}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
              >
                Aplicar e Salvar
              </button>
            </div>

          </div>
        </div>
      )}

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

      {/* Action Modal */}
      {selectedActionDevice && selectedActionType && (
        <DeviceActionModal
          device={selectedActionDevice}
          action={selectedActionType}
          isOpen={true}
          onClose={() => {
            setSelectedActionDevice(null);
            setSelectedActionType(null);
          }}
          onConfirm={handleExecuteAction}
        />
      )}
    </div>
  );
};
