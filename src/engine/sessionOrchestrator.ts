/* PortalTRMobile Session Orchestrator — Camada 19 Session Orchestrator */

export interface ActiveSessionContext {
  sessionId: string;
  userId: string;
  deviceId: string;
  deviceType: 'android' | 'ios' | 'desktop' | 'web';
  status: 'active' | 'suspended' | 'transferring' | 'terminated';
  currentRoute: string;
  activeAppId?: string;
  dialerDraft?: string;
  activeCallId?: string;
  clipboardSync: boolean;
  lastSyncTimestamp: number;
  metadata?: Record<string, any>;
}

export interface SessionTransferPayload {
  transferToken: string;
  fromDeviceId: string;
  toDeviceId: string;
  context: ActiveSessionContext;
  createdTimestamp: number;
  expiresTimestamp: number;
}

class SessionOrchestratorEngine {
  private currentContext: ActiveSessionContext | null = null;
  private knownSessions: Map<string, ActiveSessionContext> = new Map();
  private listeners: Set<(session: ActiveSessionContext | null) => void> = new Set();

  public initSession(userId: string, deviceId: string, deviceType: ActiveSessionContext['deviceType'] = 'web'): ActiveSessionContext {
    const sessionId = `sess_${userId}_${deviceId}_${Date.now()}`;
    this.currentContext = {
      sessionId,
      userId,
      deviceId,
      deviceType,
      status: 'active',
      currentRoute: '/',
      clipboardSync: true,
      lastSyncTimestamp: Date.now()
    };

    this.knownSessions.set(sessionId, this.currentContext);
    this.notifySubscribers();
    return this.currentContext;
  }

  // --- Retomar Sessão ---
  public resumeSession(sessionId: string): boolean {
    const session = this.knownSessions.get(sessionId);
    if (!session) return false;

    session.status = 'active';
    session.lastSyncTimestamp = Date.now();
    this.currentContext = session;
    this.notifySubscribers();
    return true;
  }

  // --- Transferir Sessão ---
  public initiateTransfer(toDeviceId: string): SessionTransferPayload | null {
    if (!this.currentContext) return null;

    this.currentContext.status = 'transferring';
    this.notifySubscribers();

    const transferPayload: SessionTransferPayload = {
      transferToken: `xfer_${Math.random().toString(36).substring(2, 10)}`,
      fromDeviceId: this.currentContext.deviceId,
      toDeviceId,
      context: { ...this.currentContext },
      createdTimestamp: Date.now(),
      expiresTimestamp: Date.now() + 60000 // 60 segundos
    };

    return transferPayload;
  }

  // --- Migrar Sessão ---
  public applyTransfer(payload: SessionTransferPayload, currentDeviceId: string): boolean {
    if (payload.expiresTimestamp < Date.now()) {
      console.warn('[SessionOrchestrator] Token de transferência expirado');
      return false;
    }

    this.currentContext = {
      ...payload.context,
      deviceId: currentDeviceId,
      status: 'active',
      lastSyncTimestamp: Date.now()
    };

    this.knownSessions.set(this.currentContext.sessionId, this.currentContext);
    this.notifySubscribers();
    return true;
  }

  // --- Suspender Sessão ---
  public suspendSession(): void {
    if (!this.currentContext) return;
    this.currentContext.status = 'suspended';
    this.currentContext.lastSyncTimestamp = Date.now();
    this.notifySubscribers();
  }

  // --- Encerrar Sessão ---
  public terminateSession(): void {
    if (!this.currentContext) return;
    this.currentContext.status = 'terminated';
    this.currentContext.lastSyncTimestamp = Date.now();
    this.notifySubscribers();
    this.currentContext = null;
  }

  // --- Alternar Dispositivo ---
  public switchDevice(targetDeviceId: string): void {
    if (this.currentContext) {
      this.currentContext.deviceId = targetDeviceId;
      this.currentContext.lastSyncTimestamp = Date.now();
      this.notifySubscribers();
    }
  }

  // --- Sincronizar Contexto ---
  public updateContext(partial: Partial<ActiveSessionContext>): void {
    if (!this.currentContext) return;
    this.currentContext = {
      ...this.currentContext,
      ...partial,
      lastSyncTimestamp: Date.now()
    };
    this.knownSessions.set(this.currentContext.sessionId, this.currentContext);
    this.notifySubscribers();
  }

  public getCurrentContext(): ActiveSessionContext | null {
    return this.currentContext;
  }

  public subscribe(fn: (session: ActiveSessionContext | null) => void): () => void {
    this.listeners.add(fn);
    fn(this.currentContext);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notifySubscribers(): void {
    this.listeners.forEach((fn) => fn(this.currentContext));
  }
}

export const sessionOrchestrator = new SessionOrchestratorEngine();
