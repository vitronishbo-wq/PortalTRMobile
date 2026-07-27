export type EventPriority = 'critical' | 'high' | 'normal' | 'low';
export type EventType = 'notification' | 'sms' | 'call' | 'system';

export interface PortalEvent {
  id: string;
  uid: string;
  deviceId: string;
  deviceName?: string;
  app: string;
  packageName: string;
  title: string;
  text: string;
  sender?: string;
  timestamp: number;
  priority: EventPriority;
  type: EventType;
  read: boolean;
  favorite: boolean;
}

export interface Device {
  deviceId: string;
  uid: string;
  name: string;
  model: string;
  osVersion: string;
  lastSync: number;
  online: boolean;
  batteryLevel?: number;
  pairedAt: number;
}

export interface KeepAliveConfig {
  targetUrl: string;
  enabled: boolean;
  intervalMinutes: number;
  latencyThresholdMs?: number;
  adminEmail?: string;
  adminWhatsapp?: string;
  lastPingTime: number | null;
  lastPingStatus: number | null;
  lastLatencyMs: number | null;
  totalPings: number;
  successfulPings: number;
  failedPings: number;
}

export interface PingLog {
  id: string;
  timestamp: number;
  status: number;
  latencyMs: number;
  url: string;
  message: string;
  success: boolean;
}

export interface FirestoreConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  connected: boolean;
  mode: 'cloud' | 'local';
}

export interface EventFilterOptions {
  search: string;
  app: string;
  priority: string;
  type: string;
  favoritesOnly: boolean;
  unreadOnly: boolean;
  deviceId: string;
}

export interface EventStats {
  totalEvents: number;
  unreadCount: number;
  favoriteCount: number;
  deviceCount: number;
  appDistribution: { name: string; count: number }[];
  priorityDistribution: { name: string; count: number }[];
  timelineData: { time: string; count: number }[];
}
