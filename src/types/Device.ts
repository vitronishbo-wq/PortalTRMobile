export interface Device {
  deviceId: string;
  userId?: string;
  uid?: string;
  name: string;
  model: string;
  osVersion: string;
  lastSync: number | string;
  online: boolean;
  batteryLevel?: number;
  pairedAt: number | string;

  // Zero-Touch Health Diagnostics
  oemProfile?: 'samsung' | 'xiaomi' | 'pixel' | 'oppo' | 'generic';
  permissionScore?: number; // 0-100
  notificationListenerStatus?: 'active' | 'degraded' | 'disabled';
  batteryOptimizationStatus?: 'unrestricted' | 'optimized' | 'restricted';
  autostartEnabled?: boolean;
  syncDelayMs?: number;
  unprocessedBatchCount?: number;
  installationUUID?: string;
}

