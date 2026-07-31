export interface AppNotification {
  id: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  timestamp: number;
  read: boolean;
}

export class NotificationEngine {
  private static notifications: AppNotification[] = [];

  static push(title: string, message: string, severity: AppNotification['severity'] = 'INFO'): AppNotification {
    const notif: AppNotification = {
      id: `notif_${Math.random().toString(36).substring(2, 9)}`,
      title,
      message,
      severity,
      timestamp: Date.now(),
      read: false
    };
    NotificationEngine.notifications.unshift(notif);
    return notif;
  }

  static getUnread(): AppNotification[] {
    return NotificationEngine.notifications.filter(n => !n.read);
  }

  static getAll(): AppNotification[] {
    return [...NotificationEngine.notifications];
  }

  static markAsRead(id: string): void {
    const n = NotificationEngine.notifications.find(item => item.id === id);
    if (n) n.read = true;
  }
}
