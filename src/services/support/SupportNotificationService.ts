// src/services/support/SupportNotificationService.ts — Notificações Controladas e UX Ética (Sem Loops Sonoros)

export class SupportNotificationService {
  private static audioCtx: AudioContext | null = null;
  private static unreadCount: number = 0;
  private static badgeListeners: Set<(count: number) => void> = new Set();

  /**
   * Toca um chime discreto de 300ms via Web Audio API (100% nativo, sem ficheiros externos)
   */
  public static playDiscreteChime(): void {
    try {
      if (typeof window === 'undefined') return;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880.00, this.audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.3);
    } catch (err) {
      // Ignora silenciosamente se o browser restringir áudio antes de interação
    }
  }

  /**
   * Dispara vibração tátil curta quando suportado no dispositivo móvel
   */
  public static triggerVibration(pattern: number[] = [100, 50, 100]): void {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Falha silenciosa em navegadores que não suportam
    }
  }

  /**
   * Dispara notificação de sistema (Web Notification) com tratamento de permissões
   */
  public static async sendSystemNotification(title: string, options?: NotificationOptions): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    try {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          icon: '/app_icon.jpg',
          badge: '/app_icon.jpg',
          ...options
        });
        return true;
      } else if (Notification.permission !== 'denied') {
        const res = await Notification.requestPermission();
        if (res === 'granted') {
          new Notification(title, {
            icon: '/app_icon.jpg',
            ...options
          });
          return true;
        }
      }
    } catch {
      // Fallback quando executado em iframes ou sem permissão
    }

    return false;
  }

  /**
   * Notifica novo chamado para o operador
   */
  public static notifyOperatorNewTicket(ticketId: string, subject: string): void {
    this.incrementBadge();
    this.playDiscreteChime();
    this.triggerVibration([150, 80, 150]);
    this.sendSystemNotification('Novo Atendimento Oficial', {
      body: `Ticket ${ticketId}: ${subject}`,
      tag: `support-ticket-${ticketId}`
    });
  }

  /**
   * Gestão de contadores de badges
   */
  public static incrementBadge(): void {
    this.unreadCount += 1;
    this.notifyBadgeListeners();
  }

  public static clearBadge(): void {
    this.unreadCount = 0;
    this.notifyBadgeListeners();
  }

  public static getUnreadCount(): number {
    return this.unreadCount;
  }

  public static subscribeBadge(callback: (count: number) => void): () => void {
    this.badgeListeners.add(callback);
    callback(this.unreadCount);
    return () => {
      this.badgeListeners.delete(callback);
    };
  }

  private static notifyBadgeListeners(): void {
    this.badgeListeners.forEach(cb => cb(this.unreadCount));
  }
}
