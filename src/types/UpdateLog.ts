export type UpdateLifecycleEventType =
  | 'update-detected'
  | 'update-initiated'
  | 'update-applied'
  | 'update-failed'
  | 'update-check';

export interface UpdateLifecycleLog {
  id: string;
  eventType: UpdateLifecycleEventType;
  currentVersion: string;
  detectedVersion: string | null;
  status: 'current' | 'update-available' | 'updating' | 'failed';
  timestamp: number;
  userId: string;
  deviceId: string;
  platform?: string;
  userAgent?: string;
  error?: string;
  durationMs?: number;
  metadata?: Record<string, any>;
}
