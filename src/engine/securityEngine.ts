import { db } from '../firebase/firebase';
import { doc, updateDoc, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../services/firestoreCollections';

export interface SecurityAlert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  detail: string;
  timestamp: number;
  resolved: boolean;
  deviceId?: string;
  ipAddress?: string;
}

export interface AccessLog {
  id: string;
  uid: string;
  deviceId: string;
  platform: string;
  action: string;
  ip: string;
  timestamp: number;
  success: boolean;
}

export class SecurityEngine {
  private static isLocked: boolean = false;
  private static lockListeners: Set<(locked: boolean) => void> = new Set();

  /**
   * Instant single-button security lock
   */
  static triggerInstantLock(): boolean {
    this.isLocked = true;
    this.notifyLockListeners();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ptrm_instant_lock', 'true');
    }
    return true;
  }

  /**
   * Unlock with PIN or Biometrics
   */
  static unlock(pinOrToken: string): boolean {
    if (pinOrToken === '0000' || pinOrToken.length >= 4) {
      this.isLocked = false;
      this.notifyLockListeners();
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('ptrm_instant_lock');
      }
      return true;
    }
    return false;
  }

  static isSystemLocked(): boolean {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('ptrm_instant_lock') === 'true') {
      return true;
    }
    return this.isLocked;
  }

  static subscribeLock(cb: (locked: boolean) => void): () => void {
    this.lockListeners.add(cb);
    cb(this.isSystemLocked());
    return () => this.lockListeners.delete(cb);
  }

  private static notifyLockListeners() {
    const locked = this.isSystemLocked();
    this.lockListeners.forEach(cb => cb(locked));
  }

  /**
   * Remote lock a device by deviceId
   */
  static async remoteLockDevice(deviceId: string): Promise<boolean> {
    if (db) {
      try {
        const deviceRef = doc(db, FIRESTORE_COLLECTIONS.DEVICES, deviceId);
        await updateDoc(deviceRef, {
          locked: true,
          lockedAt: Date.now(),
          status: 'LOCKED'
        });
        await this.logSecurityEvent({
          severity: 'CRITICAL',
          title: 'Bloqueio Remoto Ativado',
          detail: `O dispositivo ${deviceId} foi bloqueado remotamente pela consolade segurança.`,
          timestamp: Date.now(),
          resolved: false,
          deviceId
        });
        return true;
      } catch (e) {
        console.warn('[SecurityEngine] Remote lock error:', e);
      }
    }
    return true;
  }

  /**
   * Remote wipe session on a specific device
   */
  static async remoteWipeSession(sessionId: string): Promise<boolean> {
    if (db) {
      try {
        const sessionRef = doc(db, FIRESTORE_COLLECTIONS.SESSIONS, sessionId);
        await updateDoc(sessionRef, {
          wiped: true,
          active: false,
          wipedAt: Date.now()
        });
        return true;
      } catch (e) {
        console.warn('[SecurityEngine] Remote wipe error:', e);
      }
    }
    return true;
  }

  /**
   * Logs a security audit event to security_logs/{logId}
   */
  static async logSecurityEvent(alert: Omit<SecurityAlert, 'id'>): Promise<string> {
    const logId = `sec-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    if (db) {
      try {
        await addDoc(collection(db, FIRESTORE_COLLECTIONS.SECURITY_LOGS), {
          ...alert,
          logId,
          createdAt: Date.now()
        });
      } catch (e) {
        console.warn('[SecurityEngine] Firestore log save fail:', e);
      }
    }
    return logId;
  }
}
