import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  Firestore
} from 'firebase/firestore';
import { PortalEvent, Device, FirestoreConfig } from '../types';

let firebaseApp: FirebaseApp | null = null;
let db: Firestore | null = null;

export const defaultFirestoreConfig: FirestoreConfig = {
  apiKey: 'AIzaSyA_SampleKeyPortalMobile2026',
  authDomain: 'portaltrmobile.firebaseapp.com',
  projectId: 'portaltrmobile',
  storageBucket: 'portaltrmobile.appspot.com',
  messagingSenderId: '113504478729039495873',
  appId: '1:113504478729039495873:web:abcd1234efgh5678',
  connected: true,
  mode: 'local'
};

export function getFirebaseInstance(config: FirestoreConfig = defaultFirestoreConfig) {
  try {
    if (!getApps().length) {
      firebaseApp = initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId
      });
    } else {
      firebaseApp = getApp();
    }
    db = getFirestore(firebaseApp);
    return { app: firebaseApp, db };
  } catch (e) {
    console.warn('[Firebase] Erro na inicialização do Firebase:', e);
    return { app: null, db: null };
  }
}

// Subscribe to real-time events via onSnapshot
export function subscribeToEvents(
  config: FirestoreConfig,
  onData: (events: PortalEvent[], lastSyncTime: number) => void
): () => void {
  const { db: firestore } = getFirebaseInstance(config);

  if (!firestore) {
    return () => {};
  }

  try {
    const eventsRef = collection(firestore, 'events');
    const q = query(eventsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const eventsList: PortalEvent[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            uid: data.uid || 'usr-default',
            deviceId: data.deviceId || 'dev-pixel-8',
            deviceName: data.deviceName || 'Google Pixel 8 Pro',
            app: data.app || 'WhatsApp',
            packageName: data.packageName || 'com.whatsapp',
            title: data.title || 'Nova Notificação',
            text: data.text || data.content || '',
            sender: data.sender,
            timestamp: data.timestamp || Date.now(),
            priority: data.priority || 'normal',
            type: data.type || 'notification',
            read: data.read ?? false,
            favorite: data.favorite ?? false
          };
        });

        onData(eventsList, Date.now());
      },
      (error) => {
        console.warn('[Firestore] Error onSnapshot events (using fallback):', error.message);
      }
    );

    return unsubscribe;
  } catch (e) {
    console.warn('[Firestore] onSnapshot error:', e);
    return () => {};
  }
}

// Subscribe to real-time devices via onSnapshot
export function subscribeToDevices(
  config: FirestoreConfig,
  onData: (devices: Device[]) => void
): () => void {
  const { db: firestore } = getFirebaseInstance(config);

  if (!firestore) {
    return () => {};
  }

  try {
    const devicesRef = collection(firestore, 'devices');

    const unsubscribe = onSnapshot(
      devicesRef,
      (snapshot) => {
        const devicesList: Device[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            deviceId: docSnap.id,
            uid: data.uid || 'usr-default',
            name: data.name || 'Dispositivo Android',
            model: data.model || 'Android',
            osVersion: data.osVersion || 'Android 14',
            lastSync: data.lastSync || Date.now(),
            online: data.online ?? true,
            batteryLevel: data.batteryLevel ?? 100,
            pairedAt: data.pairedAt || Date.now()
          };
        });

        if (devicesList.length > 0) {
          onData(devicesList);
        }
      },
      (error) => {
        console.warn('[Firestore] Error onSnapshot devices:', error.message);
      }
    );

    return unsubscribe;
  } catch (e) {
    console.warn('[Firestore] onSnapshot error devices:', e);
    return () => {};
  }
}

// Firestore direct actions
export async function saveEventToFirestore(config: FirestoreConfig, event: PortalEvent) {
  const { db: firestore } = getFirebaseInstance(config);
  if (!firestore) return;
  try {
    await setDoc(doc(firestore, 'events', event.id), event);
  } catch (e) {
    console.warn('[Firestore] Error saving event:', e);
  }
}

export async function updateEventInFirestore(config: FirestoreConfig, eventId: string, updates: Partial<PortalEvent>) {
  const { db: firestore } = getFirebaseInstance(config);
  if (!firestore) return;
  try {
    await updateDoc(doc(firestore, 'events', eventId), updates);
  } catch (e) {
    console.warn('[Firestore] Error updating event:', e);
  }
}

export async function deleteEventFromFirestore(config: FirestoreConfig, eventId: string) {
  const { db: firestore } = getFirebaseInstance(config);
  if (!firestore) return;
  try {
    await deleteDoc(doc(firestore, 'events', eventId));
  } catch (e) {
    console.warn('[Firestore] Error deleting event:', e);
  }
}

export async function saveDeviceToFirestore(config: FirestoreConfig, device: Device) {
  const { db: firestore } = getFirebaseInstance(config);
  if (!firestore) return;
  try {
    await setDoc(doc(firestore, 'devices', device.deviceId), device);
  } catch (e) {
    console.warn('[Firestore] Error saving device:', e);
  }
}

export async function deleteDeviceFromFirestore(config: FirestoreConfig, deviceId: string) {
  const { db: firestore } = getFirebaseInstance(config);
  if (!firestore) return;
  try {
    await deleteDoc(doc(firestore, 'devices', deviceId));
  } catch (e) {
    console.warn('[Firestore] Error deleting device:', e);
  }
}
