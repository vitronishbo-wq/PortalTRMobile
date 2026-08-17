import { TelecomProvider, TelecomCallRequest, TelecomCallSession } from './TelecomProvider';

export class UnitelProvider extends TelecomProvider {
  name = 'Unitel Angola (GSM/VoLTE Core)';
  code: 'unitel' = 'unitel';

  async initiateCall(req: TelecomCallRequest): Promise<TelecomCallSession> {
    const callId = `unitel-call-${Date.now()}`;
    if (!this.isConfigured) {
      return {
        id: callId,
        callId,
        providerName: this.name,
        targetNumber: req.targetNumber,
        callerMsisdn: this.activeMsisdn,
        status: 'failed',
        startTime: Date.now()
      };
    }
    return {
      id: callId,
      callId,
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
    return this.isConfigured && this.isVerified;
  }

  async checkBalance() {
    if (!this.isConfigured) {
      return { balanceMznOrAoa: 0, currency: 'Kz', status: 'NOT_CONFIGURED' as const };
    }
    if (!this.isVerified) {
      return { balanceMznOrAoa: 0, currency: 'Kz', status: 'NOT_VERIFIED' as const };
    }
    return { balanceMznOrAoa: 0, currency: 'Kz', status: 'READY' as const };
  }
}

