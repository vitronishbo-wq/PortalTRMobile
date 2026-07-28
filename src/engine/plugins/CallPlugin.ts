import { Plugin, PluginEventSubject, Observable } from '../plugin';
import { RuntimeEnvelope } from '../runtimeEngine';

/**
 * Shell Implementation for CallPlugin implementing standard Plugin interface.
 * Emits events compliant with RuntimeEnvelope and AppEvent models.
 */
export class CallPlugin implements Plugin<RuntimeEnvelope> {
  id = 'plugin-call';
  name = 'Call Interceptor Shell Plugin';
  version = '2.1.0';

  private active = false;
  private runtimeRef: any = null;
  private eventStream = new PluginEventSubject<RuntimeEnvelope>();

  async initialize(runtime?: any): Promise<void> {
    this.runtimeRef = runtime;
    this.runtimeRef?.log?.('CallPlugin: Inicializado shell de interceção de chamadas.');
  }

  async start(): Promise<void> {
    this.active = true;
    this.runtimeRef?.log?.('CallPlugin: Intercetor de estado de chamada ativo.');

    // Emit initial shell event compliant with RuntimeEnvelope structure
    this.emitCallStateChanged('+244 912 345 678', 'INCOMING');
  }

  async stop(): Promise<void> {
    this.active = false;
    this.runtimeRef?.log?.('CallPlugin: Intercetor de chamadas pausado.');
  }

  health(): number {
    return this.active ? 100 : 50;
  }

  events(): Observable<RuntimeEnvelope> {
    return this.eventStream;
  }

  /**
   * Generates and pushes Call State events compliant with Event Model
   */
  emitCallStateChanged(phoneNumber: string, callState: 'INCOMING' | 'OFFHOOK' | 'IDLE'): void {
    const envelope: RuntimeEnvelope = {
      id: `call-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      time: Date.now(),
      source: 'telephony.call',
      type: 'CALL',
      priority: 'critical',
      payload: {
        id: `evt-call-${Date.now()}`,
        deviceId: this.runtimeRef?.deviceState?.id || 'dev-android-001',
        userId: 'deusfundador',
        type: 'call',
        source: 'telephony',
        title: `Chamada (${callState}): ${phoneNumber}`,
        body: `Estado da linha telefónica alterado para: ${callState}`,
        sender: phoneNumber,
        priority: 'high',
        timestamp: Date.now(),
        read: false,
        archived: false
      }
    };
    this.eventStream.next(envelope);
  }
}
