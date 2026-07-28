import { db } from '../firebase/firebase';
import { doc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { PairingSession } from '../types';

export class PairingEngine {
  /**
   * Generates a 6-character clean alphanumeric pairing token
   */
  static generateToken(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let token = '';
    for (let i = 0; i < 6; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Creates a new pairing session in Firestore for Desktop QR scanning
   */
  static async createPairingSession(token: string): Promise<PairingSession> {
    const session: PairingSession = {
      pairingToken: token,
      createdAt: Date.now(),
      status: 'pending'
    };

    if (db) {
      try {
        await setDoc(doc(db, 'pairing_sessions', token), session);
      } catch (e) {
        console.warn('[PairingEngine] Erro ao gravar sessão de emparelhamento:', e);
      }
    }

    return session;
  }

  /**
   * Subscribes to changes on a pairing session in real-time (Desktop listener)
   */
  static listenToPairing(
    token: string,
    onStatusChange: (session: PairingSession) => void
  ): Unsubscribe {
    if (!db) {
      return () => {};
    }

    try {
      const sessionRef = doc(db, 'pairing_sessions', token);
      return onSnapshot(sessionRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as PairingSession;
          onStatusChange(data);
        }
      });
    } catch (e) {
      console.warn('[PairingEngine] Erro ao subscrever emparelhamento:', e);
      return () => {};
    }
  }

  /**
   * Confirms pairing from a mobile device (Android/iOS scanner)
   */
  static async confirmPairing(
    token: string,
    deviceId: string,
    deviceName: string
  ): Promise<boolean> {
    if (!db) return false;
    try {
      const sessionRef = doc(db, 'pairing_sessions', token);
      await setDoc(
        sessionRef,
        {
          status: 'paired',
          pairedDeviceId: deviceId,
          pairedDeviceName: deviceName,
          pairedAt: Date.now()
        },
        { merge: true }
      );
      return true;
    } catch (e) {
      console.error('[PairingEngine] Erro ao confirmar emparelhamento:', e);
      return false;
    }
  }
}
