import { Plugin, PluginEventSubject, Observable } from '../plugin';
import { RuntimeEnvelope } from '../runtimeEngine';

/**
 * Shell Implementation for SMSPlugin implementing standard Plugin interface.
 * Emits events compliant with RuntimeEnvelope and AppEvent models.
 */
export class SMSPlugin implements Plugin<RuntimeEnvelope> {
  id = 'plugin-sms';
  name = 'SMS Capture Shell Plugin';
  version = '2.1.0';

  private active = false;
  private runtimeRef: any = null;
  private eventStream = new PluginEventSubject<RuntimeEnvelope>();

  async initialize(runtime?: any): Promise<void> {
    this.runtimeRef = runtime;
    this.runtimeRef?.log?.('SMSPlugin: Inicializado shell de captura SMS.');
  }

  async start(): Promise<void> {
    this.active = true;
    this.runtimeRef?.log?.('SMSPlugin: Intercetor de SMS ativo.');

    // Emit initial shell event compliant with RuntimeEnvelope structure
    this.emitSMSReceived('+244 923 000 000', 'Mensagem de teste de verificação do sistema SMS.');
  }

  async stop(): Promise<void> {
    this.active = false;
    this.runtimeRef?.log?.('SMSPlugin: Intercetor de SMS pausado.');
  }

  health(): number {
    return this.active ? 100 : 50;
  }

  events(): Observable<RuntimeEnvelope> {
    return this.eventStream;
  }

  /**
   * Generates and pushes SMS events compliant with Event Model
   */
  emitSMSReceived(sender: string, body: string): void {
    const envelope: RuntimeEnvelope = {
      id: `sms-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      time: Date.now(),
      source: 'telephony.sms',
      type: 'SMS',
      priority: 'normal',
      payload: {
        id: `evt-sms-${Date.now()}`,
        deviceId: this.runtimeRef?.deviceState?.id || 'dev-android-001',
        userId: 'deusfundador',
        type: 'sms',
        source: 'telephony',
        title: `SMS de ${sender}`,
        body,
        sender,
        priority: 'normal',
        timestamp: Date.now(),
        read: false,
        archived: false
      }
    };
    this.eventStream.next(envelope);
  }
}
