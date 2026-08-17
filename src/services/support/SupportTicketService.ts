// src/services/support/SupportTicketService.ts — Gestão de Tickets e Despacho de Operadores Dinâmicos

import { SupportTicket, SupportTicketStatus, SupportTicketPriority, SupportTicketCategory, SupportOperator } from './types';
import { SupportNotificationService } from './SupportNotificationService';

const STORAGE_KEY = 'portaltr_support_tickets_v1';

export class SupportTicketService {
  private static tickets: Map<string, SupportTicket> = new Map();
  private static operators: Map<string, SupportOperator> = new Map();
  private static ticketListeners: Set<(tickets: SupportTicket[]) => void> = new Set();
  private static isInitialized = false;

  static {
    this.init();
  }

  private static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Inicializa pool padrão de operadores dinâmicos
    this.registerOperator({
      id: 'OP-FOUNDER-ROOT',
      name: 'Operador Técnico COS',
      role: 'FOUNDER',
      status: 'AVAILABLE',
      lastSeen: Date.now()
    });

    // Carrega tickets persistidos
    this.loadPersistedTickets();
  }

  /**
   * Carrega tickets do armazenamento local seguro
   */
  private static loadPersistedTickets(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: SupportTicket[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(t => this.tickets.set(t.id, t));
        }
      }
    } catch {
      // Falha silenciosa em caso de armazenamento indisponível
    }
  }

  /**
   * Salva tickets no armazenamento local
   */
  private static persistTickets(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const list = Array.from(this.tickets.values()).slice(-50); // Mantém os 50 mais recentes para ultra-leveza
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Ignora erro de cota
    }
  }

  /**
   * Registra ou atualiza um operador no pool
   */
  public static registerOperator(operator: SupportOperator): void {
    this.operators.set(operator.id, operator);
    if (operator.status === 'AVAILABLE') {
      this.processQueue();
    }
  }

  /**
   * Atualiza status de disponibilidade de um operador
   */
  public static updateOperatorStatus(operatorId: string, status: SupportOperator['status']): void {
    const op = this.operators.get(operatorId);
    if (op) {
      op.status = status;
      op.lastSeen = Date.now();
      if (status === 'AVAILABLE') {
        this.processQueue();
      }
    }
  }

  /**
   * Retorna operadores disponíveis para atendimento
   */
  public static getAvailableOperators(): SupportOperator[] {
    return Array.from(this.operators.values()).filter(op => op.status === 'AVAILABLE');
  }

  /**
   * Retorna operador por ID
   */
  public static getOperatorById(operatorId: string): SupportOperator | undefined {
    return this.operators.get(operatorId);
  }

  /**
   * Cria um novo ticket de suporte
   */
  public static createTicket(params: {
    userId: string;
    userName?: string;
    category: SupportTicketCategory;
    subject: string;
    priority?: SupportTicketPriority;
  }): SupportTicket {
    const id = `TCK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const now = Date.now();

    const ticket: SupportTicket = {
      id,
      userId: params.userId,
      userName: params.userName || 'Utilizador',
      status: 'ABERTO',
      priority: params.priority || 'NORMAL',
      category: params.category,
      subject: params.subject,
      createdAt: now,
      updatedAt: now
    };

    this.tickets.set(id, ticket);
    this.persistTickets();
    this.notifyListeners();
    return ticket;
  }

  /**
   * Escala o ticket para a fila de espera de operador humano
   */
  public static escalateToOperator(ticketId: string, reason?: string): { ticket?: SupportTicket; assigned?: SupportOperator } {
    let ticket = this.tickets.get(ticketId);
    if (!ticket) {
      ticket = this.createTicket({
        userId: 'USER_LOCAL',
        category: 'OUTRO',
        subject: reason || 'Atendimento com Operador Humano'
      });
    }

    ticket.status = 'AGUARDANDO_OPERADOR';
    ticket.updatedAt = Date.now();

    // Notifica operador de novo chamado
    SupportNotificationService.notifyOperatorNewTicket(ticket.id, ticket.subject);

    // Tenta atribuição imediata se houver operador
    const assigned = this.tryAssignTicket(ticket);

    this.persistTickets();
    this.notifyListeners();
    return { ticket, assigned };
  }

  /**
   * Processa a fila de tickets pendentes (FIFO)
   */
  private static processQueue(): void {
    const pendingTickets = Array.from(this.tickets.values())
      .filter(t => t.status === 'AGUARDANDO_OPERADOR')
      .sort((a, b) => a.createdAt - b.createdAt);

    for (const ticket of pendingTickets) {
      const assigned = this.tryAssignTicket(ticket);
      if (!assigned) break; // Não há mais operadores livres
    }
  }

  /**
   * Tenta alocar um operador livre a um ticket
   */
  private static tryAssignTicket(ticket: SupportTicket): SupportOperator | undefined {
    const availableOps = this.getAvailableOperators();
    if (availableOps.length > 0) {
      const assigned = availableOps[0];
      ticket.assignedOperatorId = assigned.id;
      ticket.status = 'ATENDIDO';
      ticket.updatedAt = Date.now();
      this.persistTickets();
      this.notifyListeners();
      return assigned;
    }
    return undefined;
  }

  /**
   * Atribui manualmente um operador a um ticket
   */
  public static assignOperator(ticketId: string, operatorId: string): boolean {
    const ticket = this.tickets.get(ticketId);
    const op = this.operators.get(operatorId);
    if (!ticket || !op) return false;

    ticket.assignedOperatorId = operatorId;
    ticket.status = 'ATENDIDO';
    ticket.updatedAt = Date.now();
    this.persistTickets();
    this.notifyListeners();
    return true;
  }

  /**
   * Fecha o ticket
   */
  public static closeTicket(ticketId: string): boolean {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return false;

    ticket.status = 'FECHADO';
    ticket.updatedAt = Date.now();
    ticket.closedAt = Date.now();
    this.persistTickets();
    this.notifyListeners();
    return true;
  }

  /**
   * Reabre um ticket
   */
  public static reopenTicket(ticketId: string): boolean {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return false;

    ticket.status = 'ABERTO';
    ticket.updatedAt = Date.now();
    ticket.closedAt = undefined;
    this.persistTickets();
    this.notifyListeners();
    return true;
  }

  public static getTicketById(ticketId: string): SupportTicket | undefined {
    return this.tickets.get(ticketId);
  }

  public static getActiveTickets(): SupportTicket[] {
    return Array.from(this.tickets.values()).filter(t => t.status !== 'FECHADO');
  }

  public static getPendingCount(): number {
    return Array.from(this.tickets.values()).filter(t => t.status === 'AGUARDANDO_OPERADOR').length;
  }

  public static subscribe(callback: (tickets: SupportTicket[]) => void): () => void {
    this.ticketListeners.add(callback);
    callback(Array.from(this.tickets.values()));
    return () => {
      this.ticketListeners.delete(callback);
    };
  }

  private static notifyListeners(): void {
    const all = Array.from(this.tickets.values());
    this.ticketListeners.forEach(cb => cb(all));
  }
}
