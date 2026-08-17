/* PortalTRMobile Telecom Core — Camada 16 Telecom Registry */

export interface TelecomOperator {
  id: string;
  name: string;
  countryCode: string;
  mccMnc: string;
  status: 'active' | 'inactive' | 'degraded' | 'NOT_CONFIGURED' | 'NOT_VERIFIED';
  supportedProtocols: ('SIP' | 'IMS' | 'VoLTE' | 'WebRTC' | 'eSIM')[];
  sipGateway?: string;
  imsApn?: string;
  eSimProfileUrl?: string;
  ussdPrefix?: string;
  createdAt: number;
}

export interface SipEndpoint {
  id: string;
  operatorId: string;
  serverAddress: string;
  port: number;
  transport: 'UDP' | 'TCP' | 'TLS' | 'WSS';
  authRealm: string;
  registered: boolean;
  codecPriority: string[];
}

export interface ImsRegistration {
  impu: string; // IP Multimedia Public Identity (sip:user@domain)
  impi: string; // IP Multimedia Private Identity
  domain: string;
  pCscf: string;
  status: 'registered' | 'registering' | 'deregistered' | 'failed';
  lastHandshake: number;
}

export interface ESimProfile {
  iccid: string;
  operatorId: string;
  matchingId: string;
  smdpAddress: string;
  state: 'available' | 'provisioned' | 'active' | 'deactivated';
  pin?: string;
  puk?: string;
}

export interface PortabilityRequest {
  id: string;
  phoneNumber: string;
  donorOperatorId: string;
  recipientOperatorId: string;
  status: 'pending' | 'verifying' | 'completed' | 'rejected';
  requestTimestamp: number;
  completedTimestamp?: number;
}

class TelecomRegistryEngine {
  private operators: Map<string, TelecomOperator> = new Map();
  private sipRegistry: Map<string, SipEndpoint> = new Map();
  private imsRegistry: Map<string, ImsRegistration> = new Map();
  private eSimRegistry: Map<string, ESimProfile> = new Map();
  private portabilityQueue: Map<string, PortabilityRequest> = new Map();

  constructor() {
    this.seedDefaultTelecomOperators();
  }

  private seedDefaultTelecomOperators() {
    const getStoredCreds = (opId: string) => {
      try {
        if (typeof window === 'undefined') return null;
        const item = localStorage.getItem(`telecom_creds_${opId}`);
        return item ? JSON.parse(item) : null;
      } catch {
        return null;
      }
    };

    const unitelCreds = getStoredCreds('unitel_ao');
    const movicelCreds = getStoredCreds('movicel_ao');
    const africellCreds = getStoredCreds('africell_ao');

    const defaultOps: TelecomOperator[] = [
      {
        id: 'unitel-ao',
        name: 'Unitel Angola',
        countryCode: '+244',
        mccMnc: '63102',
        status: unitelCreds?.apiKey ? (unitelCreds.verified ? 'active' : 'NOT_VERIFIED') : 'NOT_CONFIGURED',
        supportedProtocols: ['SIP', 'IMS', 'VoLTE', 'WebRTC', 'eSIM'],
        sipGateway: unitelCreds?.sipServer || undefined,
        imsApn: undefined,
        eSimProfileUrl: undefined,
        ussdPrefix: '*111#',
        createdAt: Date.now()
      },
      {
        id: 'movicel-ao',
        name: 'Movicel',
        countryCode: '+244',
        mccMnc: '63104',
        status: movicelCreds?.apiKey ? (movicelCreds.verified ? 'active' : 'NOT_VERIFIED') : 'NOT_CONFIGURED',
        supportedProtocols: ['SIP', 'IMS', 'WebRTC', 'eSIM'],
        sipGateway: movicelCreds?.sipServer || undefined,
        imsApn: undefined,
        ussdPrefix: '*196#',
        createdAt: Date.now()
      },
      {
        id: 'africell-ao',
        name: 'Africell Angola',
        countryCode: '+244',
        mccMnc: '63105',
        status: africellCreds?.apiKey ? (africellCreds.verified ? 'active' : 'NOT_VERIFIED') : 'NOT_CONFIGURED',
        supportedProtocols: ['SIP', 'IMS', 'VoLTE', 'WebRTC', 'eSIM'],
        sipGateway: africellCreds?.sipServer || undefined,
        imsApn: undefined,
        eSimProfileUrl: undefined,
        ussdPrefix: '*123#',
        createdAt: Date.now()
      }
    ];

    defaultOps.forEach((op) => this.operators.set(op.id, op));
  }

  // --- Dynamic Operator Registration ---
  public registerOperator(operator: TelecomOperator): void {
    this.operators.set(operator.id, { ...operator, createdAt: operator.createdAt || Date.now() });
  }

  public getOperators(): TelecomOperator[] {
    return Array.from(this.operators.values());
  }

  public getOperator(id: string): TelecomOperator | undefined {
    return this.operators.get(id);
  }

  // --- SIP Registry ---
  public registerSipEndpoint(endpoint: SipEndpoint): void {
    this.sipRegistry.set(endpoint.id, endpoint);
  }

  public getSipEndpoints(): SipEndpoint[] {
    return Array.from(this.sipRegistry.values());
  }

  // --- IMS Registry ---
  public registerIms(registration: ImsRegistration): void {
    this.imsRegistry.set(registration.impu, registration);
  }

  public getImsRegistration(impu: string): ImsRegistration | undefined {
    return this.imsRegistry.get(impu);
  }

  // --- eSIM Registry & Auto-Provisioning ---
  public provisionESim(iccid: string, operatorId: string, smdpAddress: string, matchingId: string): ESimProfile {
    const profile: ESimProfile = {
      iccid,
      operatorId,
      matchingId,
      smdpAddress,
      state: 'provisioned'
    };
    this.eSimRegistry.set(iccid, profile);
    return profile;
  }

  public activateESim(iccid: string): boolean {
    const profile = this.eSimRegistry.get(iccid);
    if (!profile) return false;
    profile.state = 'active';
    this.eSimRegistry.set(iccid, profile);
    return true;
  }

  public deactivateESim(iccid: string): boolean {
    const profile = this.eSimRegistry.get(iccid);
    if (!profile) return false;
    profile.state = 'deactivated';
    this.eSimRegistry.set(iccid, profile);
    return true;
  }

  public getESimProfiles(): ESimProfile[] {
    return Array.from(this.eSimRegistry.values());
  }

  // --- Automatic Number Portability ---
  public requestPortability(phoneNumber: string, donorOperatorId: string, recipientOperatorId: string): PortabilityRequest {
    const id = `port_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const request: PortabilityRequest = {
      id,
      phoneNumber,
      donorOperatorId,
      recipientOperatorId,
      status: 'pending',
      requestTimestamp: Date.now()
    };
    this.portabilityQueue.set(id, request);
    return request;
  }

  public completePortability(id: string): boolean {
    const req = this.portabilityQueue.get(id);
    if (!req) return false;
    req.status = 'completed';
    req.completedTimestamp = Date.now();
    this.portabilityQueue.set(id, req);
    return true;
  }

  public getPortabilityRequests(): PortabilityRequest[] {
    return Array.from(this.portabilityQueue.values());
  }
}

export const TelecomRegistry = new TelecomRegistryEngine();
