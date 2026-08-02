export type COSEventType = 'SMS' | 'NOTIFICATION' | 'CALL' | 'BATTERY' | 'WHATSAPP';

export interface COSEvent {
  eventId: string;          // UUID
  workspaceId: string;      // Multi-tenant (Empresa)
  nodeId: string;           // Ex: "node-itel-a100"
  type: COSEventType;
  payload: Record<string, any>;
  timestamp: number;
}

export interface AppEvent {
  id: string;
  deviceId: string;
  userId: string;
  uid?: string;
  workspaceId?: string;
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

/**
 * Helper to convert traditional AppEvent into standardized Vitronis COS COSEvent envelope
 */
export function toCOSEvent(event: AppEvent, workspaceId: string = 'ws-vitronis-default'): COSEvent {
  let cosType: COSEventType = 'NOTIFICATION';
  if (event.type === 'sms') cosType = 'SMS';
  else if (event.type === 'call') cosType = 'CALL';
  else if (event.source?.toLowerCase().includes('whatsapp') || event.packageName?.includes('whatsapp')) cosType = 'WHATSAPP';
  else if (event.type === 'system' && (event.title?.toLowerCase().includes('bateria') || event.body?.toLowerCase().includes('bateria'))) cosType = 'BATTERY';

  return {
    eventId: event.id || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    workspaceId: event.workspaceId || event.userId || workspaceId,
    nodeId: event.deviceId || 'node-001',
    type: cosType,
    payload: {
      title: event.title,
      body: event.body || event.text || '',
      source: event.source || event.app || 'system',
      packageName: event.packageName || '',
      sender: event.sender || '',
      priority: event.priority || 'normal',
      read: event.read ?? false,
      favorite: event.favorite ?? false
    },
    timestamp: typeof event.timestamp === 'number' ? event.timestamp : Date.now()
  };
}

/**
 * Helper to extract AppEvent from a Vitronis COS COSEvent envelope
 */
export function fromCOSEvent(cos: COSEvent): AppEvent {
  const p = cos.payload || {};
  let eventType: 'notification' | 'sms' | 'call' | 'system' = 'notification';
  if (cos.type === 'SMS') eventType = 'sms';
  else if (cos.type === 'CALL') eventType = 'call';
  else if (cos.type === 'BATTERY') eventType = 'system';

  return {
    id: cos.eventId,
    userId: cos.workspaceId,
    workspaceId: cos.workspaceId,
    deviceId: cos.nodeId,
    type: eventType,
    source: cos.type === 'WHATSAPP' ? 'WhatsApp' : (p.source || 'system'),
    title: p.title || `Evento ${cos.type}`,
    body: p.body || p.text || '',
    text: p.body || p.text || '',
    priority: p.priority || 'normal',
    timestamp: cos.timestamp || Date.now(),
    read: p.read ?? false,
    archived: false,
    favorite: p.favorite ?? false,
    packageName: p.packageName || '',
    sender: p.sender || ''
  };
}

