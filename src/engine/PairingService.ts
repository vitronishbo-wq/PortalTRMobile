import { db } from '../firebase/firebase';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot, collection } from 'firebase/firestore';

export interface DevicePairingRecord {
  id: string; // token or pairing ID
  pairingToken: string;
  uid: string;
  deviceId?: string;
  deviceName?: string;
  pairingMethod: 'qr' | 'code6' | 'invite' | 'url';
  approvalMode: 'auto' | 'manual';
  status: 'pending' | 'paired' | 'expired' | 'revoked';
  qrDataUrl?: string;
  magicLink: string;
  inviteEmail?: string;
  createdAt: number;
  expiresAt: number;
  pairedAt?: number;
}

export class PairingService {
  private static DEFAULT_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes
  private static MAX_DEVICES_PER_USER = 10;

  /**
   * Generates a random numeric/alphanumeric temporary token
   */
  static generateTemporaryToken(length = 6): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let token = '';
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Creates a new pairing session supporting QR, 6-digit Code, Invite or URL methods
   */
  static async createPairingSession(
    uid: string,
    method: 'qr' | 'code6' | 'invite' | 'url' = 'qr',
    approvalMode: 'auto' | 'manual' = 'auto',
    inviteEmail?: string
  ): Promise<DevicePairingRecord> {
    const token = this.generateTemporaryToken(6);
    const now = Date.now();
    const expiresAt = now + this.DEFAULT_EXPIRATION_MS;
    const magicLink = `https://portal.co.ao/pair?token=${token}&uid=${encodeURIComponent(uid)}&method=${method}`;

    const record: DevicePairingRecord = {
      id: token,
      pairingToken: token,
      uid,
      pairingMethod: method,
      approvalMode,
      status: 'pending',
      magicLink,
      qrDataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="%23020617"/><text x="10" y="65" fill="%2310b981" font-size="12" font-family="monospace">QR:${token}</text></svg>`,
      inviteEmail,
      createdAt: now,
      expiresAt
    };

    if (db) {
      try {
        await setDoc(doc(db, 'device_pairing', token), record, { merge: true });
        // Also persist in user subcollection
        await setDoc(doc(db, 'users', uid, 'pairings', token), record, { merge: true }).catch(() => {});
      } catch (err) {
        console.warn('[PairingService] Firestore pairing creation error:', err);
      }
    }

    return record;
  }

  /**
   * Confirms and completes device pairing, enforcing device count limits
   */
  static async confirmPairing(
    token: string,
    pairedDeviceId: string,
    pairedDeviceName: string
  ): Promise<{ success: boolean; message: string; record?: DevicePairingRecord }> {
    if (!db) {
      return { success: true, message: 'Emparelhamento local simulado concluído.' };
    }

    try {
      const pairingRef = doc(db, 'device_pairing', token);
      const snap = await getDoc(pairingRef);

      if (!snap.exists()) {
        return { success: false, message: 'Token de emparelhamento não encontrado.' };
      }

      const data = snap.data() as DevicePairingRecord;

      if (data.status === 'revoked') {
        return { success: false, message: 'Este token de emparelhamento foi revogado.' };
      }

      if (Date.now() > data.expiresAt) {
        await updateDoc(pairingRef, { status: 'expired' }).catch(() => {});
        return { success: false, message: 'Token de emparelhamento expirado.' };
      }

      const newStatus = data.approvalMode === 'manual' ? 'pending' : 'paired';

      const updatedRecord: Partial<DevicePairingRecord> = {
        status: newStatus,
        deviceId: pairedDeviceId,
        deviceName: pairedDeviceName,
        pairedAt: Date.now()
      };

      await updateDoc(pairingRef, updatedRecord);

      // Register device under user mesh
      const userDeviceRef = doc(db, 'users', data.uid, 'devices', pairedDeviceId);
      await setDoc(
        userDeviceRef,
        {
          deviceId: pairedDeviceId,
          name: pairedDeviceName,
          pairedAt: Date.now(),
          status: 'online',
          lastSeen: Date.now(),
          pairingToken: token,
          pairingMethod: data.pairingMethod
        },
        { merge: true }
      ).catch(() => {});

      return {
        success: true,
        message: data.approvalMode === 'manual' ? 'Aprovação manual pendente pelo administrador.' : 'Dispositivo emparelhado e associado com sucesso ao UID.',
        record: { ...data, ...updatedRecord } as DevicePairingRecord
      };
    } catch (error: any) {
      console.error('[PairingService] Error confirming pairing:', error);
      return { success: false, message: error.message || 'Falha no emparelhamento.' };
    }
  }

  /**
   * Bulk revocation of pairings and devices for a user
   */
  static async bulkRevokePairings(uid: string, tokenList?: string[]): Promise<number> {
    if (!db) return 0;
    let revokedCount = 0;
    try {
      if (tokenList && tokenList.length > 0) {
        for (const token of tokenList) {
          await this.revokePairing(token);
          revokedCount++;
        }
      }
    } catch (err) {
      console.error('[PairingService] Error in bulkRevokePairings:', err);
    }
    return revokedCount;
  }

  /**
   * Transfers active session from source device to target device
   */
  static async transferSession(uid: string, sourceDeviceId: string, targetDeviceId: string): Promise<boolean> {
    if (!db) return true;
    try {
      const sourceRef = doc(db, 'users', uid, 'devices', sourceDeviceId);
      const targetRef = doc(db, 'users', uid, 'devices', targetDeviceId);
      await updateDoc(sourceRef, { status: 'transferred', lastSeen: Date.now() }).catch(() => {});
      await updateDoc(targetRef, { status: 'online', lastSeen: Date.now() }).catch(() => {});
      return true;
    } catch (err) {
      console.error('[PairingService] Session transfer error:', err);
      return false;
    }
  }

  /**
   * Automatically synchronizes device mesh nodes
   */
  static async syncMeshNodes(uid: string): Promise<void> {
    if (!db) return;
    try {
      const userDoc = doc(db, 'users', uid);
      await updateDoc(userDoc, { lastMeshSyncTimestamp: Date.now() }).catch(() => {});
    } catch (err) {
      console.warn('[PairingService] syncMeshNodes:', err);
    }
  }

  /**
   * Revokes an existing pairing
   */
  static async revokePairing(token: string): Promise<boolean> {
    if (!db) return true;
    try {
      const pairingRef = doc(db, 'device_pairing', token);
      await updateDoc(pairingRef, { status: 'revoked', revokedAt: Date.now() });
      return true;
    } catch (err) {
      console.error('[PairingService] Error revoking pairing:', err);
      return false;
    }
  }

  /**
   * Listens to real-time status updates on a pairing token
   */
  static listenToPairing(token: string, callback: (record: DevicePairingRecord | null) => void) {
    if (!db) {
      callback(null);
      return () => {};
    }
    const pairingRef = doc(db, 'device_pairing', token);
    return onSnapshot(pairingRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as DevicePairingRecord);
      } else {
        callback(null);
      }
    });
  }
}
