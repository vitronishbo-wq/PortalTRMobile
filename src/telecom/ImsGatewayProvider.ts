import { TelecomProvider, TelecomCallRequest, TelecomCallSession } from './TelecomProvider';

export class ImsGatewayProvider extends TelecomProvider {
  name = 'IMS Core VoLTE Direct Gateway';
  code: 'ims' = 'ims';

  async initiateCall(req: TelecomCallRequest): Promise<TelecomCallSession> {
    const callId = `ims-call-${Date.now()}`;
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
    console.log(`[ImsGatewayProvider] Instant Message para ${recipient}: ${message}`);
    return this.isConfigured && this.isVerified;
  }

  async checkBalance() {
    if (!this.isConfigured) {
      return { balanceMznOrAoa: 0, currency: 'Kz', status: 'NOT_CONFIGURED' as const };
    }
    return { balanceMznOrAoa: 0, currency: 'Kz', status: 'NOT_VERIFIED' as const };
  }
}

