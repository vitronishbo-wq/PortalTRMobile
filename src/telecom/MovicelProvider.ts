import { TelecomProvider, TelecomCallRequest, TelecomCallSession } from './TelecomProvider';

export class MovicelProvider extends TelecomProvider {
  name = 'Movicel Angola (LTE/CDMA)';
  code: 'movicel' = 'movicel';
  activeMsisdn = '+244 912 666 333';

  async initiateCall(req: TelecomCallRequest): Promise<TelecomCallSession> {
    return {
      callId: `movicel-call-${Date.now()}`,
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
    console.log(`[MovicelProvider] SMS para ${recipient}: ${message}`);
    return true;
  }

  async checkBalance() {
    return { balanceMznOrAoa: 9800, currency: 'Kz' };
  }
}
