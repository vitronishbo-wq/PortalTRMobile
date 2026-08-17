// src/services/support/types.ts — Tipos Canónicos do Subsistema de Apoio Oficial (PortalTRMobile)

export interface SupportContact {
  id: 'SUPPORT-COS';
  type: 'system';
  name: 'Apoio Oficial PortalTRMobile';
  verified: true;
  role: 'OFFICIAL_SUPPORT';
  avatar: '🛡️';
  status: 'ONLINE' | 'AWAY';
  description: string;
  isVirtual: true;
  requiresPhoneNumber: false;
  channel: 'COS_NATIVE_SUPPORT';
  capabilities: {
    canChat: true;
    canCallP2P: true;
    canResolveFAQ: true;
    requiresSubscription: false;
    requiresSIM: false;
  };
}

export type SupportTicketStatus = 'ABERTO' | 'AGUARDANDO_OPERADOR' | 'ATENDIDO' | 'FECHADO';

export type SupportTicketPriority = 'BAIXA' | 'NORMAL' | 'ALTA' | 'CRITICA';

export type SupportTicketCategory = 
  | 'INSTALACAO' 
  | 'TECLADO_NUMPAD' 
  | 'ANDROID_COMPANION' 
  | 'DEPLOY_GITHUB' 
  | 'CONTA_SESSAO' 
  | 'OUTRO';

export interface SupportOperator {
  id: string;
  name: string;
  role: 'FOUNDER' | 'ADMIN_SUPPORT';
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  lastSeen: number;
  deviceTokens?: string[];
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName?: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  category: SupportTicketCategory;
  subject: string;
  assignedOperatorId?: string;
  createdAt: number;
  updatedAt: number;
  closedAt?: number;
}

export interface SupportFAQItem {
  id: string;
  title: string;
  category: SupportTicketCategory;
  summary: string;
  content: string;
  actionCode?: 'TRIGGER_INSTALL' | 'CHECK_NUMLOCK' | 'VIEW_REPO' | 'ESCALATE_OPERATOR';
}

export interface SupportMessage {
  id: string;
  ticketId?: string;
  senderId: string;
  senderRole: 'USER' | 'SYSTEM' | 'OPERATOR';
  content: string;
  timestamp: number;
  type: 'TEXT' | 'FAQ_RESPONSE' | 'SYSTEM_EVENT' | 'CALL_EVENT';
  status: 'SENT' | 'DELIVERED' | 'READ';
  metadata?: Record<string, any>;
}

export type SupportCallState = 
  | 'IDLE' 
  | 'CALL_REQUESTED' 
  | 'CALL_RINGING' 
  | 'CALL_ACCEPTED' 
  | 'CALL_CONNECTED' 
  | 'CALL_ENDED' 
  | 'CALL_FAILED';

export interface SupportCallSession {
  callId: string;
  ticketId?: string;
  callerId: string;
  operatorId?: string;
  state: SupportCallState;
  startedAt?: number;
  endedAt?: number;
  failureReason?: string;
  isP2PDirect: boolean;
}
