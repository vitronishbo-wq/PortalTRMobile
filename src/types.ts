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

export interface SystemEnvConfig {
  APP_NAME: string;
  APP_CODE: string;
  APP_ENV: string;
  DEFAULT_LANGUAGE: string;
  DEFAULT_COUNTRY: string;
  DEFAULT_TIMEZONE: string;
  APP_VENDOR: string;
  PLATFORM_NAME: string;
  WEB_URL: string;
  API_URL: string;
  HOSTING_URL: string;
  GITHUB_REPOSITORY: string;
  ANDROID_APP_ID: string;
  ANDROID_PACKAGE: string;
  FIRESTORE_DATABASE: string;
  FIRESTORE_EVENTS: string;
  FIRESTORE_USERS: string;
  FIRESTORE_DEVICES: string;
  FIRESTORE_SETTINGS: string;
  FIRESTORE_FAVORITES: string;
  FIRESTORE_LOGS: string;
  FIRESTORE_SESSIONS: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_STORAGE_BUCKET: string;
  FIREBASE_APP_ID: string;
  FIREBASE_MESSAGING_SENDER_ID: string;
  FIREBASE_MEASUREMENT_ID: string;
  FIREBASE_SERVICE_ACCOUNT_TYPE: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_CLIENT_ID: string;
  FIREBASE_DEPLOY_TOKEN: string;
  PORTAL_BUILD: string;
  API_BUILD: string;
  ANDROID_BUILD: string;
  SYNC_BATCH_SIZE: string;
  SYNC_TIMEOUT: string;
  SYNC_RETRY: string;
  ENABLE_SMS: string;
  ENABLE_CALLS: string;
  ENABLE_NOTIFICATIONS: string;
  ENABLE_EMAIL: string;
  ENABLE_ANALYTICS: string;
}

