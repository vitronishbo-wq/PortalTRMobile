export interface SessionState {
  sessionId: string;          // UUID da sessão ativa
  msisdn: string;             // Identidade
  deviceId: string;           // Dispositivo que detém o estado
  activeTab: 'inbox' | 'calls' | 'messages' | 'devices' | 'settings' | 'automation' | 'analytics';
  draftMessage?: string;       // Rascunho da mensagem atual
  draftRecipient?: string;    // Destinatário do rascunho
  lastViewedEventId?: string; // Último evento visualizado
  scrollPosition?: number;    // Posição de scroll na lista
  context: Record<string, any>; // Dados de contexto (ex: filtros ativos)
  updatedAt: number;
  isActive: boolean;
}
