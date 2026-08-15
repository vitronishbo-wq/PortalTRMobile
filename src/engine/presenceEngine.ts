/* PortalTRMobile Presence Engine — Camada 17 Presence Engine */

export type PresenceStatus = 'online' | 'offline' | 'busy' | 'away' | 'in-call' | 'invisible';

export interface UserPresence {
  uid: string;
  deviceId: string;
  status: PresenceStatus;
  customStatusMessage?: string;
  lastSeen: number;
  lastHeartbeat: number;
  activeCallId?: string;
  deviceType: 'android' | 'ios' | 'web' | 'desktop' | 'virtual';
  batteryLevel?: number;
  networkType?: string;
  ipAddress?: string;
}

class PresenceEngineService {
  private currentPresence: UserPresence | null = null;
  private presenceMap: Map<string, UserPresence> = new Map();
  private heartbeatTimer: any = null;
  private listeners: Set<(presenceList: UserPresence[]) => void> = new Set();
  private isListening: boolean = false;

  public init(uid: string, deviceId: string, deviceType: UserPresence['deviceType'] = 'web'): void {
    if (this.currentPresence && this.currentPresence.uid === uid && this.currentPresence.deviceId === deviceId) {
      return;
    }

    this.currentPresence = {
      uid,
      deviceId,
      status: 'online',
      lastSeen: Date.now(),
      lastHeartbeat: Date.now(),
      deviceType
    };

    this.presenceMap.set(`${uid}_${deviceId}`, this.currentPresence);
    this.startHeartbeat();
    this.bindWindowEvents();
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

    this.heartbeatTimer = setInterval(() => {
      if (this.currentPresence && this.currentPresence.status !== 'offline') {
        this.currentPresence.lastHeartbeat = Date.now();
        this.currentPresence.lastSeen = Date.now();
        this.notifySubscribers();
      }
    }, 15000);
  }

  private bindWindowEvents(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => this.setStatus('online'));
    window.addEventListener('offline', () => this.setStatus('offline'));
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.currentPresence?.status === 'online') {
          this.setStatus('away');
        }
      } else {
        if (this.currentPresence?.status === 'away') {
          this.setStatus('online');
        }
      }
    });

    window.addEventListener('beforeunload', () => {
      if (this.currentPresence) {
        this.currentPresence.status = 'offline';
        this.currentPresence.lastSeen = Date.now();
      }
    });
  }

  public setStatus(status: PresenceStatus, customMessage?: string): void {
    if (!this.currentPresence) return;

    this.currentPresence.status = status;
    if (customMessage !== undefined) {
      this.currentPresence.customStatusMessage = customMessage;
    }
    this.currentPresence.lastSeen = Date.now();
    this.currentPresence.lastHeartbeat = Date.now();
    this.presenceMap.set(`${this.currentPresence.uid}_${this.currentPresence.deviceId}`, { ...this.currentPresence });
    this.notifySubscribers();
  }

  public setInCall(callId: string, inCall: boolean): void {
    if (!this.currentPresence) return;

    if (inCall) {
      this.currentPresence.status = 'in-call';
      this.currentPresence.activeCallId = callId;
    } else {
      this.currentPresence.status = 'online';
      this.currentPresence.activeCallId = undefined;
    }
    this.currentPresence.lastSeen = Date.now();
    this.notifySubscribers();
  }

  public updatePeerPresence(presence: UserPresence): void {
    this.presenceMap.set(`${presence.uid}_${presence.deviceId}`, presence);
    this.notifySubscribers();
  }

  public getCurrentPresence(): UserPresence | null {
    return this.currentPresence;
  }

  public getAllPresences(): UserPresence[] {
    return Array.from(this.presenceMap.values());
  }

  public subscribe(listener: (presenceList: UserPresence[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getAllPresences());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifySubscribers(): void {
    const list = this.getAllPresences();
    this.listeners.forEach((fn) => fn(list));
  }
}

export const presenceEngine = new PresenceEngineService();
