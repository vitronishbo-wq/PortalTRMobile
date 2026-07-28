import { Plugin, PluginEventSubject, Observable } from '../plugin';
import { RuntimeEnvelope } from '../runtimeEngine';

/**
 * Shell Implementation for NotificationPlugin implementing standard Plugin interface.
 * Emits events compliant with RuntimeEnvelope and AppEvent models.
 */
export class NotificationPlugin implements Plugin<RuntimeEnvelope> {
  id = 'plugin-notification';
  name = 'Notification Listener Shell Plugin';
  version = '2.1.0';

  private active = false;
  private runtimeRef: any = null;
  private eventStream = new PluginEventSubject<RuntimeEnvelope>();

  async initialize(runtime?: any): Promise<void> {
    this.runtimeRef = runtime;
    this.runtimeRef?.log?.('NotificationPlugin: Inicializado shell listener de notificações.');
  }

  async start(): Promise<void> {
    this.active = true;
    this.runtimeRef?.log?.('NotificationPlugin: Listener de notificações ativo.');

    // Emit initial notification compliant with RuntimeEnvelope structure
    this.emitNotification('com.whatsapp', 'WhatsApp', 'Nova mensagem de suporte', 'O sistema de eventos está operacional.');
  }

  async stop(): Promise<void> {
    this.active = false;
    this.runtimeRef?.log?.('NotificationPlugin: Listener de notificações pausado.');
  }

  health(): number {
    return this.active ? 100 : 0;
  }

  events(): Observable<RuntimeEnvelope> {
    return this.eventStream;
  }

  /**
   * Generates and pushes Notification events compliant with Event Model
   */
  emitNotification(packageName: string, appTitle: string, title: string, body: string): void {
    const envelope: RuntimeEnvelope = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      time: Date.now(),
      source: `notification.${packageName}`,
      type: 'NOTIFICATION',
      priority: 'normal',
      payload: {
        id: `evt-notif-${Date.now()}`,
        deviceId: this.runtimeRef?.deviceState?.id || 'dev-android-001',
        userId: 'deusfundador',
        type: 'notification',
        source: packageName.includes('whatsapp') ? 'whatsapp' : packageName.includes('instagram') ? 'instagram' : 'system',
        title: `${appTitle}: ${title}`,
        body,
        app: appTitle,
        packageName,
        priority: 'normal',
        timestamp: Date.now(),
        read: false,
        archived: false
      }
    };
    this.eventStream.next(envelope);
  }
}
