export interface AppSession {
  sessionId: string;
  userId: string;
  deviceId?: string;
  userAgent: string;
  ipAddress?: string;
  createdAt: number | string;
  lastActive: number | string;
  active: boolean;
}
