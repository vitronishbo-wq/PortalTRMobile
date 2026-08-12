import { TelecomProvider, TelecomCallRequest, TelecomCallSession } from './TelecomProvider';

export class SipGatewayProvider extends TelecomProvider {
  name = 'SIP Gateway Direct Core';
  code: 'sip' = 'sip';
  activeMsisdn = 'sip:agent01@sip.portal.co.ao';

  async initiateCall(req: TelecomCallRequest): Promise<TelecomCallSession> {
    return {
      callId: `sip-call-${Date.now()}`,
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
    console.log(`[SipGatewayProvider] MESSAGE para ${recipient}: ${message}`);
    return true;
  }

  async checkBalance() {
    return { balanceMznOrAoa: 50000, currency: 'Kz' };
  }
}
