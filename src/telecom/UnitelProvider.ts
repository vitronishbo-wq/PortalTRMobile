import { TelecomProvider, TelecomCallRequest, TelecomCallSession } from './TelecomProvider';

export class UnitelProvider extends TelecomProvider {
  name = 'Unitel Angola (GSM/VoLTE Core)';
  code: 'unitel' = 'unitel';
  activeMsisdn = '+244 923 888 111';

  async initiateCall(req: TelecomCallRequest): Promise<TelecomCallSession> {
    return {
      callId: `unitel-call-${Date.now()}`,
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
    console.log(`[UnitelProvider] SMS para ${recipient}: ${message}`);
    return true;
  }

  async checkBalance() {
    return { balanceMznOrAoa: 15400, currency: 'Kz' };
  }
}
