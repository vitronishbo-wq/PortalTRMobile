/* PortalTRMobile Notification Engine — Camada 18 Notification Engine */

export type NotificationChannel =
  | 'SMS'
  | 'CALLS'
  | 'WHATSAPP'
  | 'TELEGRAM'
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'BANKS'
  | 'SYSTEM';

export interface AppNotification {
  id: string;
  channel: NotificationChannel;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  timestamp: number;
  read: boolean;
  sender?: string;
  sourceApp?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export class NotificationEngine {
  private static notifications: AppNotification[] = [];
  private static listeners: Set<(notifications: AppNotification[]) => void> = new Set();

  static push(
    title: string,
    message: string,
    severity: AppNotification['severity'] = 'INFO',
    channel: NotificationChannel = 'SYSTEM',
    extra: Partial<AppNotification> = {}
  ): AppNotification {
    const notif: AppNotification = {
      id: `notif_${Math.random().toString(36).substring(2, 9)}`,
      channel,
      title,
      message,
      severity,
      timestamp: Date.now(),
      read: false,
      ...extra
    };

    NotificationEngine.notifications.unshift(notif);
    if (NotificationEngine.notifications.length > 200) {
      NotificationEngine.notifications.pop();
    }

    NotificationEngine.notifyListeners();
    return notif;
  }

  static pushSms(sender: string, body: string): AppNotification {
    return NotificationEngine.push(`SMS de ${sender}`, body, 'INFO', 'SMS', { sender });
  }

  static pushCall(caller: string, missed: boolean = false): AppNotification {
    return NotificationEngine.push(
      missed ? `Chamada Não Atendida` : `Chamada Recebida`,
      `De: ${caller}`,
      missed ? 'WARNING' : 'INFO',
      'CALLS',
      { sender: caller }
    );
  }

  static pushSocial(platform: 'WHATSAPP' | 'TELEGRAM' | 'INSTAGRAM' | 'FACEBOOK', sender: string, text: string): AppNotification {
    return NotificationEngine.push(`${platform} • ${sender}`, text, 'INFO', platform, { sender });
  }

  static pushBanking(bankName: string, transactionDetails: string): AppNotification {
    return NotificationEngine.push(`Alerta Bancário • ${bankName}`, transactionDetails, 'WARNING', 'BANKS', { sourceApp: bankName });
  }

  static getUnread(): AppNotification[] {
    return NotificationEngine.notifications.filter((n) => !n.read);
  }

  static getByChannel(channel: NotificationChannel): AppNotification[] {
    return NotificationEngine.notifications.filter((n) => n.channel === channel);
  }

  static getAll(): AppNotification[] {
    return [...NotificationEngine.notifications];
  }

  static markAsRead(id: string): void {
    const n = NotificationEngine.notifications.find((item) => item.id === id);
    if (n) {
      n.read = true;
      NotificationEngine.notifyListeners();
    }
  }

  static markAllAsRead(): void {
    NotificationEngine.notifications.forEach((n) => (n.read = true));
    NotificationEngine.notifyListeners();
  }

  static subscribe(fn: (notifications: AppNotification[]) => void): () => void {
    NotificationEngine.listeners.add(fn);
    fn(NotificationEngine.getAll());
    return () => {
      NotificationEngine.listeners.delete(fn);
    };
  }

  private static notifyListeners(): void {
    const list = NotificationEngine.getAll();
    NotificationEngine.listeners.forEach((fn) => fn(list));
  }
}
