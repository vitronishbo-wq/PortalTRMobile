// src/services/support/SupportCallService.ts — Coordenação de Chamadas de Voz IP WebRTC (P2P Sem Custos)

import { SupportCallSession, SupportCallState } from './types';
import { SupportNotificationService } from './SupportNotificationService';
import { SupportChatService } from './SupportChatService';

export class SupportCallService {
  private static activeSession: SupportCallSession | null = null;
  private static peerConnection: RTCPeerConnection | null = null;
  private static localStream: MediaStream | null = null;
  private static sessionListeners: Set<(session: SupportCallSession | null) => void> = new Set();

  private static readonly ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  /**
   * Inicia solicitação de chamada de voz IP para o suporte
   */
  public static async requestCall(callerId: string = 'USER_LOCAL', ticketId?: string): Promise<SupportCallSession> {
    if (this.activeSession && this.activeSession.state !== 'CALL_ENDED' && this.activeSession.state !== 'CALL_FAILED') {
      return this.activeSession;
    }

    const session: SupportCallSession = {
      callId: `CALL-${Date.now().toString(36).toUpperCase()}`,
      ticketId,
      callerId,
      state: 'CALL_REQUESTED',
      isP2PDirect: true,
      startedAt: Date.now()
    };

    this.activeSession = session;
    this.notifySessionListeners();

    // Mensagem de evento no chat oficial
    SupportChatService.sendSystemMessage('📞 Chamada de Voz IP solicitada via WebRTC...', ticketId, 'CALL_EVENT');
    SupportNotificationService.playDiscreteChime();

    // Inicializa captura de microfone e RTCPeerConnection
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      }
      this.initPeerConnection();
      this.updateState('CALL_RINGING');
    } catch (err: any) {
      console.warn('[SupportCallService] Erro ao obter microfone:', err);
      this.failCall(err?.message || 'Permissão de microfone não concedida.');
    }

    return this.activeSession;
  }

  /**
   * Inicializa instância local do RTCPeerConnection
   */
  private static initPeerConnection(): void {
    if (typeof window === 'undefined' || typeof RTCPeerConnection === 'undefined') return;

    try {
      this.peerConnection = new RTCPeerConnection({
        iceServers: this.ICE_SERVERS
      });

      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          if (this.peerConnection && this.localStream) {
            this.peerConnection.addTrack(track, this.localStream);
          }
        });
      }

      this.peerConnection.oniceconnectionstatechange = () => {
        const iceState = this.peerConnection?.iceConnectionState;
        if (iceState === 'connected' || iceState === 'completed') {
          this.updateState('CALL_CONNECTED');
        } else if (iceState === 'failed' || iceState === 'disconnected') {
          this.failCall('Conexão P2P WebRTC não estabelecida (Bloqueio de NAT/Firewall sem TURN).');
        }
      };
    } catch (err: any) {
      console.warn('[SupportCallService] Erro ao instanciar RTCPeerConnection:', err);
    }
  }

  /**
   * Atende a chamada pelo operador
   */
  public static acceptCall(operatorId: string): void {
    if (!this.activeSession) return;
    this.activeSession.operatorId = operatorId;
    this.updateState('CALL_ACCEPTED');
    SupportChatService.sendSystemMessage(`📞 Chamada atendida pelo Operador (${operatorId}). Conectando áudio...`, this.activeSession.ticketId, 'CALL_EVENT');
    
    // Simula transição para conectado após handshake
    setTimeout(() => {
      if (this.activeSession?.state === 'CALL_ACCEPTED') {
        this.updateState('CALL_CONNECTED');
      }
    }, 1000);
  }

  /**
   * Encerra a chamada ativa
   */
  public static endCall(): void {
    if (!this.activeSession) return;
    this.activeSession.endedAt = Date.now();
    this.updateState('CALL_ENDED');

    SupportChatService.sendSystemMessage('📞 Chamada de Voz IP encerrada.', this.activeSession.ticketId, 'CALL_EVENT');

    this.cleanupMedia();
  }

  /**
   * Registra falha na chamada com motivo transparente
   */
  private static failCall(reason: string): void {
    if (!this.activeSession) return;
    this.activeSession.failureReason = reason;
    this.activeSession.endedAt = Date.now();
    this.updateState('CALL_FAILED');

    SupportChatService.sendSystemMessage(`⚠️ Falha na Chamada de Voz: ${reason}`, this.activeSession.ticketId, 'CALL_EVENT');
    this.cleanupMedia();
  }

  private static cleanupMedia(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  private static updateState(state: SupportCallState): void {
    if (this.activeSession) {
      this.activeSession.state = state;
      this.notifySessionListeners();
    }
  }

  public static getSession(): SupportCallSession | null {
    return this.activeSession;
  }

  public static subscribeSession(callback: (session: SupportCallSession | null) => void): () => void {
    this.sessionListeners.add(callback);
    callback(this.activeSession);
    return () => {
      this.sessionListeners.delete(callback);
    };
  }

  private static notifySessionListeners(): void {
    this.sessionListeners.forEach(cb => cb(this.activeSession));
  }
}
