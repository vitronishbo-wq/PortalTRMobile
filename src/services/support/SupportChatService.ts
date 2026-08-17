// src/services/support/SupportChatService.ts — Gestão de Conversação e Mensagens do Canal de Apoio

import { SupportMessage } from './types';
import { SupportNotificationService } from './SupportNotificationService';

export class SupportChatService {
  private static messages: SupportMessage[] = [];
  private static listeners: Set<(messages: SupportMessage[]) => void> = new Set();

  static {
    // Mensagem de boas-vindas do sistema
    this.messages = [
      {
        id: 'MSG-INIT-001',
        senderId: 'SUPPORT-COS',
        senderRole: 'SYSTEM',
        content: 'Olá! Bem-vindo ao canal oficial do PortalTRMobile. Selecione um dos tópicos de auto-resolução abaixo ou solicite transferência para um operador.',
        timestamp: Date.now() - 60000,
        type: 'SYSTEM_EVENT',
        status: 'READ'
      }
    ];
  }

  /**
   * Retorna todo o histórico de mensagens
   */
  public static getMessages(): SupportMessage[] {
    return [...this.messages];
  }

  /**
   * Envia uma mensagem do utilizador
   */
  public static sendUserMessage(content: string, ticketId?: string): SupportMessage {
    const msg: SupportMessage = {
      id: `MSG-U-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      ticketId,
      senderId: 'USER_LOCAL',
      senderRole: 'USER',
      content: content.trim(),
      timestamp: Date.now(),
      type: 'TEXT',
      status: 'SENT'
    };

    this.messages.push(msg);
    this.notifyListeners();
    return msg;
  }

  /**
   * Envia resposta automática do sistema (FAQ ou evento)
   */
  public static sendSystemMessage(content: string, ticketId?: string, type: SupportMessage['type'] = 'FAQ_RESPONSE'): SupportMessage {
    const msg: SupportMessage = {
      id: `MSG-SYS-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      ticketId,
      senderId: 'SUPPORT-COS',
      senderRole: 'SYSTEM',
      content,
      timestamp: Date.now(),
      type,
      status: 'DELIVERED'
    };

    this.messages.push(msg);
    this.notifyListeners();
    return msg;
  }

  /**
   * Envia mensagem assinada pelo operador
   */
  public static sendOperatorMessage(operatorId: string, operatorName: string, content: string, ticketId?: string): SupportMessage {
    const msg: SupportMessage = {
      id: `MSG-OP-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      ticketId,
      senderId: operatorId,
      senderRole: 'OPERATOR',
      content: `[${operatorName}]: ${content}`,
      timestamp: Date.now(),
      type: 'TEXT',
      status: 'DELIVERED'
    };

    this.messages.push(msg);
    SupportNotificationService.playDiscreteChime();
    this.notifyListeners();
    return msg;
  }

  public static clearHistory(): void {
    this.messages = [];
    this.notifyListeners();
  }

  public static subscribe(callback: (messages: SupportMessage[]) => void): () => void {
    this.listeners.add(callback);
    callback([...this.messages]);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private static notifyListeners(): void {
    const msgs = [...this.messages];
    this.listeners.forEach(cb => cb(msgs));
  }
}
