export interface AppEvent {
  id: string;
  deviceId: string;
  userId: string;
  uid?: string;
  type: 'notification' | 'sms' | 'call' | 'system';
  source: string; // 'whatsapp', 'instagram', 'telephony', etc.
  title: string;
  body: string;
  text?: string;
  app?: string;
  deviceName?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  timestamp: number | string;
  read: boolean;
  archived: boolean;
  favorite?: boolean;
  packageName?: string;
  sender?: string;
}
