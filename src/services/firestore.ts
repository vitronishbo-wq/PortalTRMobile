import { db } from '../firebase/firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  Unsubscribe
} from 'firebase/firestore';
import { AppEvent, Device, UserSettings, UserProfile, AppSession } from '../types/index';

export class FirestoreService {
  /**
   * Listener em tempo real (onSnapshot) para a coleção de eventos/notificações
   */
  static listenToEvents(
    onData: (events: AppEvent[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    if (!db) {
      onData([]);
      return () => {};
    }

    try {
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, orderBy('timestamp', 'desc'), limit(150));

      return onSnapshot(
        q,
        (snapshot) => {
          const events: AppEvent[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              userId: data.userId || data.uid || 'usr-default',
              deviceId: data.deviceId || 'dev-pixel-8',
              type: data.type || 'notification',
              source: data.source || data.app || 'system',
              title: data.title || 'Sem título',
              body: data.body || data.text || data.content || '',
              priority: data.priority || 'normal',
              timestamp: data.timestamp || Date.now(),
              read: data.read ?? false,
              archived: data.archived ?? false,
              favorite: data.favorite ?? false,
              packageName: data.packageName || '',
              sender: data.sender || ''
            };
          });
          onData(events);
        },
        (error) => {
          console.warn('[FirestoreService] Erro no listener de eventos:', error.message);
          if (onError) onError(error);
        }
      );
    } catch (e) {
      console.error('[FirestoreService] Erro ao subscrever eventos:', e);
      return () => {};
    }
  }

  /**
   * Listener em tempo real (onSnapshot) para a coleção de dispositivos pareados
   */
  static listenToDevices(
    onData: (devices: Device[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    if (!db) {
      onData([]);
      return () => {};
    }

    try {
      const devicesRef = collection(db, 'devices');

      return onSnapshot(
        devicesRef,
        (snapshot) => {
          const devices: Device[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              deviceId: docSnap.id,
              userId: data.userId || data.uid || 'usr-default',
              name: data.name || 'Dispositivo Android',
              model: data.model || 'Android',
              osVersion: data.osVersion || 'Android 14',
              lastSync: data.lastSync || Date.now(),
              online: data.online ?? true,
              batteryLevel: data.batteryLevel ?? 100,
              pairedAt: data.pairedAt || Date.now()
            };
          });
          onData(devices);
        },
        (error) => {
          console.warn('[FirestoreService] Erro no listener de dispositivos:', error.message);
          if (onError) onError(error);
        }
      );
    } catch (e) {
      console.error('[FirestoreService] Erro ao subscrever dispositivos:', e);
      return () => {};
    }
  }

  /**
   * Salva ou atualiza um evento/notificação no Firestore
   */
  static async saveEvent(event: AppEvent): Promise<void> {
    if (!db) return;
    try {
      const eventRef = doc(db, 'events', event.id);
      await setDoc(eventRef, {
        ...event,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error('[FirestoreService] Erro ao salvar evento:', error);
    }
  }

  /**
   * Atualiza campos específicos de um evento
   */
  static async updateEvent(eventId: string, updates: Partial<AppEvent>): Promise<void> {
    if (!db) return;
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('[FirestoreService] Erro ao atualizar evento:', error);
    }
  }

  /**
   * Elimina um evento do Firestore
   */
  static async deleteEvent(eventId: string): Promise<void> {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'events', eventId));
    } catch (error) {
      console.error('[FirestoreService] Erro ao eliminar evento:', error);
    }
  }

  /**
   * Salva ou atualiza um dispositivo no Firestore
   */
  static async saveDevice(device: Device): Promise<void> {
    if (!db) return;
    try {
      const deviceRef = doc(db, 'devices', device.deviceId);
      await setDoc(deviceRef, {
        ...device,
        lastSync: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error('[FirestoreService] Erro ao salvar dispositivo:', error);
    }
  }

  /**
   * Elimina um dispositivo do Firestore
   */
  static async deleteDevice(deviceId: string): Promise<void> {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'devices', deviceId));
    } catch (error) {
      console.error('[FirestoreService] Erro ao eliminar dispositivo:', error);
    }
  }

  /**
   * Salva ou atualiza as configurações do utilizador no Firestore
   */
  static async saveSettings(settings: UserSettings): Promise<void> {
    if (!db) return;
    try {
      const settingsRef = doc(db, 'settings', settings.userId);
      await setDoc(settingsRef, {
        ...settings,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error('[FirestoreService] Erro ao salvar configurações:', error);
    }
  }

  /**
   * Salva perfil do utilizador
   */
  static async saveUserProfile(user: UserProfile): Promise<void> {
    if (!db) return;
    try {
      const userRef = doc(db, 'users', user.userId);
      await setDoc(userRef, {
        ...user,
        lastLogin: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error('[FirestoreService] Erro ao salvar perfil do utilizador:', error);
    }
  }

  /**
   * Regista uma nova sessão
   */
  static async saveSession(session: AppSession): Promise<void> {
    if (!db) return;
    try {
      const sessionRef = doc(db, 'sessions', session.sessionId);
      await setDoc(sessionRef, {
        ...session,
        lastActive: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error('[FirestoreService] Erro ao salvar sessão:', error);
    }
  }
}
