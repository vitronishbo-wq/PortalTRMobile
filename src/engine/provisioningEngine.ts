import { Device } from '../types';
import { db } from '../firebase/firebase';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { CapabilityEngine, OEMBrand, OEMDeepLink } from './CapabilityEngine';

export type { OEMBrand, OEMDeepLink };

export class OEMCapabilityEngine {
  static detectOEM(ua: string = typeof navigator !== 'undefined' ? navigator.userAgent : ''): OEMBrand {
    return CapabilityEngine.detectOEMBrand(ua);
  }

  static getDeepLinksForOEM(oem: OEMBrand): OEMDeepLink[] {
    return CapabilityEngine.getOEMDeepLinks(oem);
  }
}

export interface SyncEventPayload {
  id: string;
  type: 'call' | 'sms' | 'whatsapp' | 'notification' | 'heartbeat';
  priority: 'critical' | 'normal' | 'metrics'; // critical: 0ms, normal: 100ms, metrics: 30s
  data: any;
  timestamp: number;
}

export class BatchingSyncEngine {
  private queue: SyncEventPayload[] = [];
  private batchTimer: any = null;

  enqueue(event: SyncEventPayload, onFlush?: (batch: SyncEventPayload[]) => void) {
    this.queue.push(event);

    if (event.priority === 'critical') {
      // 0ms flush for Calls & SMS
      this.flush(onFlush);
    } else if (event.priority === 'normal') {
      // 100ms debounced flush for WhatsApp/Notifications
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.flush(onFlush), 100);
      }
    } else if (!this.batchTimer) {
      // 30s batch for battery & metrics
      this.batchTimer = setTimeout(() => this.flush(onFlush), 30000);
    }
  }

  async flush(onFlush?: (batch: SyncEventPayload[]) => void) {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.queue.length === 0) return;

    const currentBatch = [...this.queue];
    this.queue = [];

    if (onFlush) {
      onFlush(currentBatch);
    }

    // Atomic write to Firestore if initialized
    if (db) {
      try {
        const batch = writeBatch(db);
        currentBatch.forEach((evt) => {
          const evtRef = doc(db, 'events', evt.id);
          batch.set(evtRef, {
            ...evt.data,
            priority: evt.priority,
            syncedAt: Date.now()
          });
        });
        await batch.commit();
      } catch (err) {
        console.warn('[BatchingSyncEngine] Error committing batch:', err);
      }
    }
  }
}

export class ZeroTouchIdentity {
  static createIdentity(customOem?: OEMBrand): Partial<Device> {
    const oem = customOem || OEMCapabilityEngine.detectOEM();
    const deviceUUID = `dev-${oem}-${Math.random().toString(36).substring(2, 8)}`;
    const installationUUID = `inst-${Date.now().toString(36)}`;

    const oemNames: Record<OEMBrand, string> = {
      samsung: 'Samsung Galaxy S24 Ultra',
      xiaomi: 'Xiaomi 14 Pro (HyperOS)',
      pixel: 'Google Pixel 8 Pro',
      oppo: 'OnePlus 12 (ColorOS)',
      generic: 'Android Device'
    };

    return {
      deviceId: deviceUUID,
      name: oemNames[oem],
      model: `${oem.toUpperCase()} Mobile Agent`,
      osVersion: 'Android 14 (API 34)',
      online: true,
      batteryLevel: 98,
      lastSync: Date.now(),
      pairedAt: Date.now(),
      oemProfile: oem,
      permissionScore: 98,
      notificationListenerStatus: 'active',
      batteryOptimizationStatus: 'unrestricted',
      autostartEnabled: true,
      syncDelayMs: 12,
      unprocessedBatchCount: 0,
      installationUUID
    };
  }

  static async registerZeroTouchDevice(device: Partial<Device>): Promise<boolean> {
    if (!db || !device.deviceId) return false;
    try {
      await setDoc(doc(db, 'devices', device.deviceId), device, { merge: true });
      return true;
    } catch (e) {
      console.error('[ZeroTouchIdentity] Registration failed:', e);
      return false;
    }
  }
}
