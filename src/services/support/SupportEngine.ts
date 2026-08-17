// src/services/support/SupportEngine.ts — Orquestrador Central do Subsistema de Apoio Oficial (PortalTRMobile)

import { SupportContact, SupportFAQItem, SupportTicket, SupportMessage } from './types';
import { SupportFAQService } from './SupportFAQService';
import { SupportChatService } from './SupportChatService';
import { SupportTicketService } from './SupportTicketService';
import { SupportNotificationService } from './SupportNotificationService';
import { SupportCallService } from './SupportCallService';

export class SupportEngine {
  public static readonly OFFICIAL_SUPPORT_CONTACT: SupportContact = {
    id: 'SUPPORT-COS',
    type: 'system',
    name: 'Apoio Oficial PortalTRMobile',
    verified: true,
    role: 'OFFICIAL_SUPPORT',
    avatar: '🛡️',
    status: 'ONLINE',
    description: 'Canal Oficial de Atendimento e Diagnóstico PortalTRMobile (Zero-Cost / Sem Linha Telefónica)',
    isVirtual: true,
    requiresPhoneNumber: false,
    channel: 'COS_NATIVE_SUPPORT',
    capabilities: {
      canChat: true,
      canCallP2P: true,
      canResolveFAQ: true,
      requiresSubscription: false,
      requiresSIM: false
    }
  };

  /**
   * Verifica se um dado ID ou contacto corresponde à entidade oficial de suporte
   */
  public static isOfficialSupport(idOrContact?: string | { id?: string }): boolean {
    if (!idOrContact) return false;
    const id = typeof idOrContact === 'string' ? idOrContact : idOrContact.id;
    return id === this.OFFICIAL_SUPPORT_CONTACT.id;
  }

  /**
   * Retorna a entidade oficial de suporte configurada no sistema
   */
  public static getOfficialContact(): SupportContact {
    return this.OFFICIAL_SUPPORT_CONTACT;
  }

  /**
   * Processa a seleção de um tópico de FAQ pelo utilizador no chat
   */
  public static handleFAQSelection(topicId: string, ticketId?: string): { item?: SupportFAQItem; responseMessage?: SupportMessage } {
    const topic = SupportFAQService.getTopicById(topicId);
    if (!topic) return {};

    // 1. Regista mensagem de pergunta do utilizador
    SupportChatService.sendUserMessage(`[Dúvida]: ${topic.title}`, ticketId);

    // 2. Regista resposta oficial estruturada do sistema
    const response = SupportChatService.sendSystemMessage(topic.content, ticketId, 'FAQ_RESPONSE');

    // 3. Se for pedido explícito de operador humano, escala automaticamente o ticket
    if (topic.actionCode === 'ESCALATE_OPERATOR') {
      this.requestHumanAgent(ticketId || 'TCK-AUTO', 'Solicitação de suporte via FAQ');
    }

    return { item: topic, responseMessage: response };
  }

  /**
   * Escala o atendimento para a equipa humana de suporte
   */
  public static requestHumanAgent(ticketId: string, subject: string = 'Atendimento Geral'): SupportTicket {
    let ticket = SupportTicketService.getTicketById(ticketId);
    if (!ticket) {
      ticket = SupportTicketService.createTicket({
        userId: 'USER_LOCAL',
        userName: 'Utilizador PortalTRMobile',
        category: 'OUTRO',
        subject
      });
    }

    const { assigned } = SupportTicketService.escalateToOperator(ticket.id);

    if (assigned) {
      SupportChatService.sendSystemMessage(`👨‍💻 O ${assigned.name} foi designado para o seu atendimento (Ticket #${ticket.id}). Aguarde a mensagem.`, ticket.id, 'SYSTEM_EVENT');
      SupportNotificationService.notifyOperatorNewTicket(ticket.id, ticket.subject);
    } else {
      SupportChatService.sendSystemMessage(`⏳ O seu pedido de apoio foi colocado na fila de espera (Ticket #${ticket.id}). Um operador irá atender em breve.`, ticket.id, 'SYSTEM_EVENT');
      SupportNotificationService.notifyOperatorNewTicket(ticket.id, ticket.subject);
    }

    return ticket;
  }

  /**
   * Envia mensagem do utilizador para a conversa
   */
  public static sendMessage(content: string, ticketId?: string): SupportMessage {
    return SupportChatService.sendUserMessage(content, ticketId);
  }

  /**
   * Inicia chamada de voz IP
   */
  public static async startVoiceCall(ticketId?: string) {
    return SupportCallService.requestCall('USER_LOCAL', ticketId);
  }

  /**
   * Encerra chamada de voz IP
   */
  public static endVoiceCall() {
    SupportCallService.endCall();
  }

  /**
   * Exporta os serviços individuais para consumo desacoplado
   */
  public static readonly faq = SupportFAQService;
  public static readonly chat = SupportChatService;
  public static readonly tickets = SupportTicketService;
  public static readonly notifications = SupportNotificationService;
  public static readonly calls = SupportCallService;
}
