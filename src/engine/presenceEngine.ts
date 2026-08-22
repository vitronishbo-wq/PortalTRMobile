/* PortalTRMobile Presence Engine — Camada 17 Presence Engine */
// Presença Real com Heartbeat e TTL sincronizada no Firestore (/presence)

import { FirestoreService } from '../services/firestore';

export type PresenceStatus = 'online' | 'offline' | 'busy' | 'away' | 'in-call' | 'invisible';

export interface UserPresence {
  uid: string;
  deviceId: string;
  status: PresenceStatus;
  customStatusMessage?: string;
  lastSeen: number;
  lastHeartbeat: number;
  ttlMs?: number;
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
  private isListeningFirestore: boolean = false;
  private unsubscribeFirestore: (() => void) | null = null;

  public init(uid: string, deviceId: string, deviceType: UserPresence['deviceType'] = 'web'): void {
    if (this.currentPresence && this.currentPresence.uid === uid && this.currentPresence.deviceId === deviceId) {
      return;
    }

    const now = Date.now();
    this.currentPresence = {
      uid,
      deviceId,
      status: 'online',
      lastSeen: now,
      lastHeartbeat: now,
      ttlMs: 45000,
      deviceType
    };

    this.presenceMap.set(`${uid}_${deviceId}`, this.currentPresence);
    this.syncToFirestore();
    this.startHeartbeat();
    this.bindWindowEvents();
    this.startFirestoreListener();
  }

  private startFirestoreListener(): void {
    if (this.isListeningFirestore) return;
    this.isListeningFirestore = true;

    this.unsubscribeFirestore = FirestoreService.listenToAllPresence((remoteList) => {
      remoteList.forEach((item) => {
        if (item.uid && item.deviceId) {
          const key = `${item.uid}_${item.deviceId}`;
          // Se for o nó atual local, mantém o status atual se estiver gravando
          if (this.currentPresence && `${this.currentPresence.uid}_${this.currentPresence.deviceId}` === key) {
            return;
          }
          this.presenceMap.set(key, item as UserPresence);
        }
      });
      this.notifySubscribers();
    });
  }

  private syncToFirestore(): void {
    if (!this.currentPresence) return;
    FirestoreService.updatePresenceHeartbeat({
      ...this.currentPresence,
      lastHeartbeat: Date.now(),
      lastSeen: Date.now(),
      ttlMs: 45000
    }).catch((err) => {
      console.warn('[PresenceEngine] Falha ao enviar heartbeat para Firestore:', err);
    });
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

    this.heartbeatTimer = setInterval(() => {
      if (this.currentPresence && this.currentPresence.status !== 'offline') {
        const now = Date.now();
        this.currentPresence.lastHeartbeat = now;
        this.currentPresence.lastSeen = now;
        this.syncToFirestore();
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
        this.syncToFirestore();
      }
    });
  }

  public setStatus(status: PresenceStatus, customMessage?: string): void {
    if (!this.currentPresence) return;

    this.currentPresence.status = status;
    if (customMessage !== undefined) {
      this.currentPresence.customStatusMessage = customMessage;
    }
    const now = Date.now();
    this.currentPresence.lastSeen = now;
    this.currentPresence.lastHeartbeat = now;
    this.presenceMap.set(`${this.currentPresence.uid}_${this.currentPresence.deviceId}`, { ...this.currentPresence });
    this.syncToFirestore();
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
    this.syncToFirestore();
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
    const now = Date.now();
    // Avalia TTL dinamicamente para cada nó
    return Array.from(this.presenceMap.values()).map((p) => {
      const timeSinceHeartbeat = now - (p.lastHeartbeat || 0);
      let evaluatedStatus = p.status;
      if (evaluatedStatus !== 'offline') {
        if (timeSinceHeartbeat > 120000) {
          evaluatedStatus = 'offline';
        } else if (timeSinceHeartbeat > 45000) {
          evaluatedStatus = 'away';
        }
      }
      return {
        ...p,
        status: evaluatedStatus
      };
    });
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

