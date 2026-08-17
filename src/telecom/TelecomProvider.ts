export interface TelecomCallRequest {
  targetNumber: string;
  callerMsisdn: string;
  enableVideo?: boolean;
}

export interface TelecomCallSession {
  id?: string;
  callId: string;
  providerName: string;
  targetNumber: string;
  callerMsisdn: string;
  status: 'dialing' | 'ringing' | 'connected' | 'ended' | 'failed';
  startTime: number;
  endTime?: number;
  audioStream?: MediaStream;
}

export interface CallRecord {
  id: string; // calls/{callId}
  caller: string;
  recipient: string;
  startTime: number;
  endTime?: number;
  durationSeconds: number;
  status: 'active' | 'on_hold' | 'conference' | 'completed' | 'missed' | 'transferred' | 'forwarded' | 'failed';
  direction: 'inbound' | 'outbound';
  mode?: 'voip' | 'volte' | 'wifi';
  recordingUrl?: string;
  recordingStatus?: 'off' | 'recording' | 'saved' | 'failed';
  isOnHold?: boolean;
  conferenceId?: string;
  forwardTo?: string;
  voicemailUrl?: string;
  isBlacklisted?: boolean;
  isWhitelisted?: boolean;
  isInternational?: boolean;
  countryCode?: string;
}

export interface VirtualNumber {
  id: string; // virtual_numbers/{numberId}
  number: string;
  isPrimary: boolean;
  isSecondary: boolean;
  operator: 'Unitel' | 'Africell' | 'Movicel' | 'SIP Gateway' | 'IMS Core' | 'eSIM Profile';
  category?: 'international' | 'corporate' | 'personal' | 'temporary';
  portability?: {
    isPorted: boolean;
    originalOperator?: string;
    portedAt?: number;
  };
  status: 'active' | 'suspended' | 'reserved';
  type: 'mobile' | 'landline' | 'tollfree' | 'sip_uri';
  country: string;
  esim: boolean;
  esimProfileId?: string;
  sip: boolean;
  sipTrunkUri?: string;
  ims: boolean;
  imsGatewayDomain?: string;
}

export interface MeshSession {
  id: string; // sessions/{sessionId}
  uid: string;
  isPrimarySession: boolean;
  isSecondarySession: boolean;
  currentDeviceId: string;
  activeDevicesCount: number;
  deviceLimit: number; // e.g. 100 (Unlim)
  sessionTransferStatus: 'none' | 'pending' | 'transferred' | 'synced';
  autoContinuation: boolean;
  instantSync: boolean;
  primaryDevicePriority: number;
  lastSyncTimestamp: number;
}


export interface SmsMessage {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: number;
  direction: 'inbound' | 'outbound';
  status: 'sent' | 'delivered' | 'failed';
}

export abstract class TelecomProvider {
  id: string = 'provider-default';
  abstract name: string;
  abstract code: 'unitel' | 'africell' | 'movicel' | 'sip' | 'ims' | 'thirdparty';
  
  get isConfigured(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const creds = localStorage.getItem(`telecom_creds_${this.code}_ao`) || localStorage.getItem(`telecom_creds_${this.id}`);
      return !!(creds && JSON.parse(creds)?.apiKey);
    } catch {
      return false;
    }
  }

  get isVerified(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const creds = localStorage.getItem(`telecom_creds_${this.code}_ao`) || localStorage.getItem(`telecom_creds_${this.id}`);
      return !!(creds && JSON.parse(creds)?.verified);
    } catch {
      return false;
    }
  }

  get activeMsisdn(): string {
    if (typeof window === 'undefined') return 'NOT_CONFIGURED';
    try {
      const creds = localStorage.getItem(`telecom_creds_${this.code}_ao`) || localStorage.getItem(`telecom_creds_${this.id}`);
      if (creds) {
        const parsed = JSON.parse(creds);
        if (parsed.assignedNumber) return parsed.assignedNumber;
      }
    } catch {}
    return 'NOT_CONFIGURED';
  }

  get virtualNumber(): string {
    return this.activeMsisdn;
  }

  abstract initiateCall(req: string | TelecomCallRequest): Promise<TelecomCallSession>;
  abstract endCall(callId: string): Promise<boolean>;
  abstract sendSms(recipient: string, message: string): Promise<SmsMessage | boolean>;
  abstract checkBalance(): Promise<{ balanceMznOrAoa: number; currency: string; status: 'READY' | 'NOT_CONFIGURED' | 'NOT_VERIFIED' }>;
}

export class UnitelProvider extends TelecomProvider {
  id = 'unitel-primary';
  name = 'Unitel Angola (GSM/VoLTE)';
  code: 'unitel' = 'unitel';

  async initiateCall(req: string | TelecomCallRequest): Promise<TelecomCallSession> {
    const target = typeof req === 'string' ? req : req.targetNumber;
    const callId = `unitel-call-${Date.now()}`;
    if (!this.isConfigured) {
      return {
        id: callId,
        callId,
        providerName: this.name,
        targetNumber: target,
        callerMsisdn: this.activeMsisdn,
        status: 'failed',
        startTime: Date.now()
      };
    }
    return {
      id: callId,
      callId,
      providerName: this.name,
      targetNumber: target,
      callerMsisdn: this.activeMsisdn,
      status: 'dialing',
      startTime: Date.now()
    };
  }

  async endCall(): Promise<boolean> {
    return true;
  }

  async sendSms(recipient: string, message: string): Promise<SmsMessage> {
    const isReady = this.isConfigured && this.isVerified;
    return {
      id: `sms-unitel-${Date.now()}`,
      sender: this.activeMsisdn,
      recipient,
      content: message,
      timestamp: Date.now(),
      direction: 'outbound',
      status: isReady ? 'delivered' : 'failed'
    };
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

export class AfricellProvider extends TelecomProvider {
  id = 'africell-primary';
  name = 'Africell Angola (VoNR 5G)';
  code: 'africell' = 'africell';

  async initiateCall(req: string | TelecomCallRequest): Promise<TelecomCallSession> {
    const target = typeof req === 'string' ? req : req.targetNumber;
    const callId = `africell-call-${Date.now()}`;
    if (!this.isConfigured) {
      return {
        id: callId,
        callId,
        providerName: this.name,
        targetNumber: target,
        callerMsisdn: this.activeMsisdn,
        status: 'failed',
        startTime: Date.now()
      };
    }
    return {
      id: callId,
      callId,
      providerName: this.name,
      targetNumber: target,
      callerMsisdn: this.activeMsisdn,
      status: 'dialing',
      startTime: Date.now()
    };
  }

  async endCall(): Promise<boolean> {
    return true;
  }

  async sendSms(recipient: string, message: string): Promise<SmsMessage> {
    const isReady = this.isConfigured && this.isVerified;
    return {
      id: `sms-africell-${Date.now()}`,
      sender: this.activeMsisdn,
      recipient,
      content: message,
      timestamp: Date.now(),
      direction: 'outbound',
      status: isReady ? 'delivered' : 'failed'
    };
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

export class MovicelProvider extends TelecomProvider {
  id = 'movicel-primary';
  name = 'Movicel Angola (LTE/CDMA)';
  code: 'movicel' = 'movicel';

  async initiateCall(req: string | TelecomCallRequest): Promise<TelecomCallSession> {
    const target = typeof req === 'string' ? req : req.targetNumber;
    const callId = `movicel-call-${Date.now()}`;
    if (!this.isConfigured) {
      return {
        id: callId,
        callId,
        providerName: this.name,
        targetNumber: target,
        callerMsisdn: this.activeMsisdn,
        status: 'failed',
        startTime: Date.now()
      };
    }
    return {
      id: callId,
      callId,
      providerName: this.name,
      targetNumber: target,
      callerMsisdn: this.activeMsisdn,
      status: 'dialing',
      startTime: Date.now()
    };
  }

  async endCall(): Promise<boolean> {
    return true;
  }

  async sendSms(recipient: string, message: string): Promise<SmsMessage> {
    const isReady = this.isConfigured && this.isVerified;
    return {
      id: `sms-movicel-${Date.now()}`,
      sender: this.activeMsisdn,
      recipient,
      content: message,
      timestamp: Date.now(),
      direction: 'outbound',
      status: isReady ? 'delivered' : 'failed'
    };
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

export class SIPProvider extends TelecomProvider {
  id = 'sip-primary';
  name = 'SIP Trunk Direct (IMS / IP Telecom)';
  code: 'sip' = 'sip';

  async initiateCall(req: string | TelecomCallRequest): Promise<TelecomCallSession> {
    const target = typeof req === 'string' ? req : req.targetNumber;
    const callId = `sip-call-${Date.now()}`;
    if (!this.isConfigured) {
      return {
        id: callId,
        callId,
        providerName: this.name,
        targetNumber: target,
        callerMsisdn: this.activeMsisdn,
        status: 'failed',
        startTime: Date.now()
      };
    }
    return {
      id: callId,
      callId,
      providerName: this.name,
      targetNumber: target,
      callerMsisdn: this.activeMsisdn,
      status: 'dialing',
      startTime: Date.now()
    };
  }

  async endCall(): Promise<boolean> {
    return true;
  }

  async sendSms(recipient: string, message: string): Promise<SmsMessage> {
    const isReady = this.isConfigured && this.isVerified;
    return {
      id: `sms-sip-${Date.now()}`,
      sender: this.activeMsisdn,
      recipient,
      content: message,
      timestamp: Date.now(),
      direction: 'outbound',
      status: isReady ? 'delivered' : 'failed'
    };
  }

  async checkBalance() {
    if (!this.isConfigured) {
      return { balanceMznOrAoa: 0, currency: 'Kz', status: 'NOT_CONFIGURED' as const };
    }
    return { balanceMznOrAoa: 0, currency: 'Kz', status: 'NOT_VERIFIED' as const };
  }
}

export class IMSProvider extends TelecomProvider {
  id = 'ims-primary';
  name = 'IMS Core VoLTE Direct Router';
  code: 'ims' = 'ims';

  async initiateCall(req: string | TelecomCallRequest): Promise<TelecomCallSession> {
    const target = typeof req === 'string' ? req : req.targetNumber;
    const callId = `ims-call-${Date.now()}`;
    if (!this.isConfigured) {
      return {
        id: callId,
        callId,
        providerName: this.name,
        targetNumber: target,
        callerMsisdn: this.activeMsisdn,
        status: 'failed',
        startTime: Date.now()
      };
    }
    return {
      id: callId,
      callId,
      providerName: this.name,
      targetNumber: target,
      callerMsisdn: this.activeMsisdn,
      status: 'dialing',
      startTime: Date.now()
    };
  }

  async endCall(): Promise<boolean> {
    return true;
  }

  async sendSms(recipient: string, message: string): Promise<SmsMessage> {
    const isReady = this.isConfigured && this.isVerified;
    return {
      id: `sms-ims-${Date.now()}`,
      sender: this.activeMsisdn,
      recipient,
      content: message,
      timestamp: Date.now(),
      direction: 'outbound',
      status: isReady ? 'delivered' : 'failed'
    };
  }

  async checkBalance() {
    if (!this.isConfigured) {
      return { balanceMznOrAoa: 0, currency: 'Kz', status: 'NOT_CONFIGURED' as const };
    }
    return { balanceMznOrAoa: 0, currency: 'Kz', status: 'NOT_VERIFIED' as const };
  }
}

export class ThirdPartyProvider extends TelecomProvider {
  id = 'thirdparty-primary';
  name = 'Generic ThirdParty API Router';
  code: 'thirdparty' = 'thirdparty';

  async initiateCall(req: string | TelecomCallRequest): Promise<TelecomCallSession> {
    const target = typeof req === 'string' ? req : req.targetNumber;
    const callId = `tp-call-${Date.now()}`;
    if (!this.isConfigured) {
      return {
        id: callId,
        callId,
        providerName: this.name,
        targetNumber: target,
        callerMsisdn: this.activeMsisdn,
        status: 'failed',
        startTime: Date.now()
      };
    }
    return {
      id: callId,
      callId,
      providerName: this.name,
      targetNumber: target,
      callerMsisdn: this.activeMsisdn,
      status: 'dialing',
      startTime: Date.now()
    };
  }

  async endCall(): Promise<boolean> {
    return true;
  }

  async sendSms(recipient: string, message: string): Promise<SmsMessage> {
    const isReady = this.isConfigured && this.isVerified;
    return {
      id: `sms-tp-${Date.now()}`,
      sender: this.activeMsisdn,
      recipient,
      content: message,
      timestamp: Date.now(),
      direction: 'outbound',
      status: isReady ? 'delivered' : 'failed'
    };
  }

  async checkBalance() {
    if (!this.isConfigured) {
      return { balanceMznOrAoa: 0, currency: 'USD', status: 'NOT_CONFIGURED' as const };
    }
    return { balanceMznOrAoa: 0, currency: 'USD', status: 'NOT_VERIFIED' as const };
  }
}

export class TelecomRegistry {
  private static providers: Map<string, TelecomProvider> = new Map<string, TelecomProvider>([
    ['unitel-primary', new UnitelProvider()],
    ['unitel', new UnitelProvider()],
    ['africell-primary', new AfricellProvider()],
    ['africell', new AfricellProvider()],
    ['movicel-primary', new MovicelProvider()],
    ['movicel', new MovicelProvider()],
    ['sip-primary', new SIPProvider()],
    ['sip', new SIPProvider()],
    ['ims-primary', new IMSProvider()],
    ['ims', new IMSProvider()],
    ['thirdparty-primary', new ThirdPartyProvider()],
    ['thirdparty', new ThirdPartyProvider()]
  ]);

  static getProvider(key: string): TelecomProvider {
    return this.providers.get(key.toLowerCase()) || this.providers.get('unitel-primary')!;
  }

  static listProviders(): TelecomProvider[] {
    const list: TelecomProvider[] = [];
    const seen = new Set<string>();
    for (const p of this.providers.values()) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        list.push(p);
      }
    }
    return list;
  }
}
