export interface ApiKey {
  key: string;                 // vtr_live_xxx
  workspaceId: string;
  name: string;
  permissions: string[];       // ['send_sms', 'make_call', 'manage_numbers']
  rateLimit: {
    limit: number;             // requisições por minuto
    windowMs: number;
  };
  createdAt: number;
  lastUsed?: number;
  isActive: boolean;
}

export interface VirtualNumber {
  id: string;
  number: string;              // E.164 format
  workspaceId: string;
  provider: 'twilio' | 'smpp' | 'local';
  status: 'available' | 'assigned' | 'suspended';
  assignedTo?: string;         // nodeId ou userId
  monthlyCost: number;         // em USD cents
  createdAt: number;
  expiresAt?: number;
  capabilities: {
    sms: boolean;
    voice: boolean;
    whatsapp: boolean;
  };
  metadata: Record<string, any>;
}

export interface MessageRequest {
  from?: string;               // número virtual ou ID do nó
  to: string;                  // número do destinatário
  text: string;
  type?: 'sms' | 'whatsapp' | 'notification';
  priority?: 'high' | 'normal' | 'low';
  webhookUrl?: string;         // para callback de entrega
}

export interface MessageResponse {
  messageId: string;
  status: 'queued' | 'sent' | 'failed';
  gateway: 'android' | 'twilio' | 'smpp' | 'none';
  cost?: number;
  error?: string;
}
