/* PortalTRMobile Trust Engine — Camada 21 Trust Engine */

export interface TrustScoreAssessment {
  overallScore: number; // 0 to 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  deviceRisk: number; // 0 (safe) to 100 (critical)
  sessionRisk: number;
  locationRisk: number;
  authRisk: number;
  isAutoBlocked: boolean;
  isRevoked: boolean;
  reasons: string[];
  evaluatedAt: number;
}

export interface DeviceRiskFactors {
  isRootedOrJailbroken: boolean;
  isEmulator: boolean;
  hasHardwareKeystore: boolean;
  hasScreenLock: boolean;
  isKnownTrustedDevice: boolean;
  ipMismatch: boolean;
  mfaPassed: boolean;
  failedAuthAttempts: number;
}

class TrustEngineService {
  private currentAssessment: TrustScoreAssessment | null = null;
  private blockedDevices: Set<string> = new Set();
  private revokedSessions: Set<string> = new Set();
  private listeners: Set<(assessment: TrustScoreAssessment) => void> = new Set();

  public evaluateTrust(
    deviceId: string,
    sessionId: string,
    factors: Partial<DeviceRiskFactors> = {}
  ): TrustScoreAssessment {
    let deviceRisk = 0;
    let sessionRisk = 0;
    let locationRisk = 0;
    let authRisk = 0;
    const reasons: string[] = [];

    // 1. Device Risk Evaluation
    if (factors.isRootedOrJailbroken) {
      deviceRisk += 50;
      reasons.push('Dispositivo com privilégios de Root/Jailbreak detectado');
    }
    if (factors.isEmulator) {
      deviceRisk += 30;
      reasons.push('Execução em ambiente de emulação');
    }
    if (!factors.hasHardwareKeystore) {
      deviceRisk += 15;
      reasons.push('Ausência de hardware keystore / enclave seguro');
    }
    if (!factors.hasScreenLock) {
      deviceRisk += 20;
      reasons.push('Sem bloqueio de ecrã ativo no dispositivo');
    }
    if (!factors.isKnownTrustedDevice) {
      deviceRisk += 10;
    }

    // 2. Session Risk Evaluation
    if (this.revokedSessions.has(sessionId)) {
      sessionRisk = 100;
      reasons.push('Sessão revogada previamente por autoridade de segurança');
    }

    // 3. Location / Network Risk Evaluation
    if (factors.ipMismatch) {
      locationRisk += 35;
      reasons.push('Discrepância súbita de IP / ASN de rede');
    }

    // 4. Auth Risk Evaluation
    if (!factors.mfaPassed) {
      authRisk += 20;
    }
    if (factors.failedAuthAttempts && factors.failedAuthAttempts > 2) {
      authRisk += factors.failedAuthAttempts * 15;
      reasons.push(`${factors.failedAuthAttempts} tentativas falhadas de autenticação`);
    }

    // Aggregate Trust Score (0 to 100, where 100 is maximum trust)
    const totalRisk = Math.min(
      100,
      Math.round(deviceRisk * 0.35 + sessionRisk * 0.3 + locationRisk * 0.15 + authRisk * 0.2)
    );
    const overallScore = Math.max(0, 100 - totalRisk);

    let riskLevel: TrustScoreAssessment['riskLevel'] = 'LOW';
    if (totalRisk >= 75) riskLevel = 'CRITICAL';
    else if (totalRisk >= 50) riskLevel = 'HIGH';
    else if (totalRisk >= 25) riskLevel = 'MEDIUM';

    const isAutoBlocked = riskLevel === 'CRITICAL' || this.blockedDevices.has(deviceId);
    const isRevoked = sessionRisk === 100;

    if (isAutoBlocked) {
      this.blockedDevices.add(deviceId);
    }

    this.currentAssessment = {
      overallScore,
      riskLevel,
      deviceRisk: Math.min(100, deviceRisk),
      sessionRisk: Math.min(100, sessionRisk),
      locationRisk: Math.min(100, locationRisk),
      authRisk: Math.min(100, authRisk),
      isAutoBlocked,
      isRevoked,
      reasons,
      evaluatedAt: Date.now()
    };

    this.notifySubscribers();
    return this.currentAssessment;
  }

  public blockDevice(deviceId: string): void {
    this.blockedDevices.add(deviceId);
    if (this.currentAssessment) {
      this.currentAssessment.isAutoBlocked = true;
      this.notifySubscribers();
    }
  }

  public unblockDevice(deviceId: string): void {
    this.blockedDevices.delete(deviceId);
    if (this.currentAssessment) {
      this.currentAssessment.isAutoBlocked = false;
      this.notifySubscribers();
    }
  }

  public revokeSession(sessionId: string): void {
    this.revokedSessions.add(sessionId);
    if (this.currentAssessment) {
      this.currentAssessment.isRevoked = true;
      this.notifySubscribers();
    }
  }

  public getAssessment(): TrustScoreAssessment | null {
    return this.currentAssessment;
  }

  public subscribe(fn: (assessment: TrustScoreAssessment) => void): () => void {
    this.listeners.add(fn);
    if (this.currentAssessment) fn(this.currentAssessment);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notifySubscribers(): void {
    if (this.currentAssessment) {
      this.listeners.forEach((fn) => fn(this.currentAssessment!));
    }
  }
}

export const trustEngine = new TrustEngineService();
