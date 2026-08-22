// src/types/nodeContract.ts
// Contrato Oficial e Unificado entre PortalTRMobile PWA (Control Plane) e PortalTR Agent APK (Physical Node)

export type NodeExecutionStage =
  | 'COMMAND_CREATED'
  | 'STORED_FIRESTORE'
  | 'RECEIVED_DAEMON'
  | 'EXECUTING'
  | 'RESULT_CONFIRMED'
  | 'FAILED';

export type NodeCommandStatus =
  | 'QUEUED'
  | 'EXECUTING'
  | 'RESULT_CONFIRMED'
  | 'FAILED'
  | 'EXPIRED';

export interface AndroidNodeDevice {
  deviceId: string;
  model: string;
  manufacturer: string;
  androidVersion: string;
  appVersion: string;
  status: 'UNPROVISIONED' | 'PROVISIONED' | 'READY' | 'PAIRED' | 'OFFLINE';
  isReady: boolean;
  batteryLevel?: number;
  isCharging?: boolean;
  networkType?: string;
  simSlots?: number;
  activeSim?: string;
  capabilities: string[];
  pairedUid: string;
  pairedAt?: number;
  lastSeen: number;
}

export interface NodePresencePulse {
  uid: string;
  deviceId: string;
  status: 'online' | 'offline' | 'away';
  lastHeartbeat: number;
  lastSeen: number;
  ttlMs: number;
  deviceType: 'android' | 'web' | 'desktop';
  batteryLevel?: number;
}

export interface NodeOutboundCommand {
  id: string;
  nodeId: string;
  type: 'SEND_SMS' | 'MAKE_CALL' | 'RUN_USSD';
  recipient: string;
  message?: string;
  payload?: Record<string, any>;
  status: NodeCommandStatus;
  executionStage?: NodeExecutionStage;
  createdAt: number;
  storedAt?: number;
  receivedAt?: number;
  executingAt?: number;
  executedAt?: number;
  attempts: number;
  error?: string;
  evidenceId?: string;
  resultPayload?: Record<string, any>;
  idempotencyKey?: string;
}

export interface NodePhysicalEvent {
  id: string;
  deviceId: string;
  type: 'SMS_RECEIVED' | 'CALL_MISSED' | 'NOTIFICATION_RECEIVED' | 'USSD_RESPONSE';
  source?: string;
  sender?: string;
  content?: string;
  timestamp: number;
  status: 'NEW' | 'PROCESSED' | 'ARCHIVED';
  category?: 'BANKING' | 'TELECOM' | 'SYSTEM';
  dedupHash?: string;
  rawPayload?: Record<string, any>;
}

