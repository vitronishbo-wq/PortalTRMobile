export interface DigitalTwinCapabilities {
  sms: boolean;
  calls: boolean;
  accessibility: boolean;
  biometrics: boolean;
  whatsapp?: boolean;
  camera?: boolean;
  microphone?: boolean;
  gps?: boolean;
  nfc?: boolean;
  bluetooth?: boolean;
}

export interface DeviceHealth {
  battery: number;
  network: string; // e.g. "AFRICELL_4G", "UNITEL_5G", "WIFI"
  storageFreeMb?: number;
  memoryUsagePct?: number;
  lastPingMs?: number;
}

export interface Device {
  deviceId: string;
  nodeId?: string; // Digital Twin node ID (e.g. "node-itel-a100")
  userId?: string;
  workspaceId?: string; // Multi-tenant (Empresa)
  uid?: string;
  name: string;
  model: string;
  manufacturer?: string;
  osVersion: string;
  lastSync: number | string;
  online: boolean;
  batteryLevel?: number;
  pairedAt: number | string;
  ipAddress?: string;
  networkType?: string;
  signalStrength?: string;
  virtualNumber?: string;
  carrier?: string;

  // Vitronis COS Device Digital Twin
  capabilities?: DigitalTwinCapabilities;
  health?: DeviceHealth;

  // Multi-Device Mesh 3.0 Priority & Session
  isPrimaryDevice?: boolean;
  primaryPriority?: number; // e.g. 1 (Highest) to 10

  platform?: 'android' | 'iphone' | 'tablet' | 'windows' | 'macos' | 'linux' | 'web' | 'ipad' | 'smarttv';
  oemProfile?: 'samsung' | 'xiaomi' | 'pixel' | 'oppo' | 'apple' | 'generic';
  permissionScore?: number; // 0-100
  notificationListenerStatus?: 'active' | 'degraded' | 'disabled';
  batteryOptimizationStatus?: 'unrestricted' | 'optimized' | 'restricted';
  autostartEnabled?: boolean;
  syncDelayMs?: number;
  unprocessedBatchCount?: number;
  installationUUID?: string;
}


