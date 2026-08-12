import { TelecomProvider, TelecomCallRequest, TelecomCallSession } from './TelecomProvider';

export class EsimProvider extends TelecomProvider {
  name = 'eSIM Virtual Profile Engine';
  code: 'thirdparty' = 'thirdparty';
  activeMsisdn = '+244 990 123 456';

  async initiateCall(req: TelecomCallRequest): Promise<TelecomCallSession> {
    return {
      callId: `esim-call-${Date.now()}`,
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
    console.log(`[EsimProvider] SMS enviado via eSIM profile para ${recipient}: ${message}`);
    return true;
  }

  async checkBalance() {
    return { balanceMznOrAoa: 35000, currency: 'Kz' };
  }
}
