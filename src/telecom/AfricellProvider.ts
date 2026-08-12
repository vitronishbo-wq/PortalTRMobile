import { TelecomProvider, TelecomCallRequest, TelecomCallSession } from './TelecomProvider';

export class AfricellProvider extends TelecomProvider {
  name = 'Africell Angola (VoNR 5G)';
  code: 'africell' = 'africell';
  activeMsisdn = '+244 955 777 222';

  async initiateCall(req: TelecomCallRequest): Promise<TelecomCallSession> {
    return {
      callId: `africell-call-${Date.now()}`,
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
    console.log(`[AfricellProvider] SMS para ${recipient}: ${message}`);
    return true;
  }

  async checkBalance() {
    return { balanceMznOrAoa: 18200, currency: 'Kz' };
  }
}
