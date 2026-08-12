import { TelecomProvider, TelecomCallRequest, TelecomCallSession } from './TelecomProvider';

export class ImsGatewayProvider extends TelecomProvider {
  name = 'IMS Core VoLTE Direct Gateway';
  code: 'ims' = 'ims';
  activeMsisdn = '+244 222 000 999';

  async initiateCall(req: TelecomCallRequest): Promise<TelecomCallSession> {
    return {
      callId: `ims-call-${Date.now()}`,
      providerName: this.name,
      targetNumber: req.targetNumber,
      callerMsisdn: this.activeMsisdn,
      status: 'dialing',
      startTime: Date.now()
    };
  }

  async endCall(): Promise<boolean> {
    return true;
  }

  async sendSms(recipient: string, message: string): Promise<boolean> {
    console.log(`[ImsGatewayProvider] Instant Message para ${recipient}: ${message}`);
    return true;
  }

  async checkBalance() {
    return { balanceMznOrAoa: 100000, currency: 'Kz' };
  }
}
