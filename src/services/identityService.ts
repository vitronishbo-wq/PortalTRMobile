import { getFirebaseInstance, defaultFirestoreConfig } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { IdentityGraph, IdentityDevice, PairingToken } from '../types/Identity';

const IDENTITIES_COLLECTION = 'identities';
const PAIRING_TOKENS_COLLECTION = 'pairingTokens';

// Local in-memory cache for offline/resilient fallback
const localIdentitiesStore = new Map<string, IdentityGraph>();
const localPairingTokensStore = new Map<string, PairingToken>();

/**
 * Normaliza MSISDN para chave primária padronizada
 */
export function normalizeMsisdn(msisdn: string): string {
  if (!msisdn) return 'anon-workspace-user';
  return msisdn.replace(/[^\w@.-]/g, '_').toLowerCase();
}

// Helper for non-blocking timeout
function withTimeout<T>(promise: Promise<T>, ms: number = 1000, fallbackErrorMsg = 'Firestore timeout'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(fallbackErrorMsg)), ms))
  ]);
}

/**
 * Obtém ou cria um IdentityGraph para um MSISDN
 */
export async function getOrCreateIdentity(msisdnRaw: string, workspaceId: string = 'ws-vitronis-default'): Promise<IdentityGraph> {
  const msisdn = normalizeMsisdn(msisdnRaw);
  const { db } = getFirebaseInstance(defaultFirestoreConfig);

  if (db) {
    try {
      const docRef = doc(db, IDENTITIES_COLLECTION, msisdn);
      const docSnap = await withTimeout(getDoc(docRef), 1000);

      if (docSnap.exists()) {
        const data = docSnap.data() as IdentityGraph;
        localIdentitiesStore.set(msisdn, data);
        return data;
      } else {
        const newIdentity: IdentityGraph = {
          msisdn,
          workspaceId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          devices: [],
        };
        await withTimeout(setDoc(docRef, newIdentity), 1000);
        localIdentitiesStore.set(msisdn, newIdentity);
        return newIdentity;
      }
    } catch (err) {
      console.warn('[IdentityService] Firestore inacessível ou timeout, a usar fallback local:', err);
    }
  }

  // Fallback em memória se Firestore indisponível
  if (localIdentitiesStore.has(msisdn)) {
    return localIdentitiesStore.get(msisdn)!;
  }
  const fallbackIdentity: IdentityGraph = {
    msisdn,
    workspaceId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    devices: [],
  };
  localIdentitiesStore.set(msisdn, fallbackIdentity);
  return fallbackIdentity;
}

/**
 * Regista um novo dispositivo na identidade (IdentityGraph)
 */
export async function registerDevice(
  msisdnRaw: string,
  device: Omit<IdentityDevice, 'pairedAt' | 'isActive' | 'lastSeen'>
): Promise<IdentityDevice> {
  const msisdn = normalizeMsisdn(msisdnRaw);
  const identity = await getOrCreateIdentity(msisdn);
  const { db } = getFirebaseInstance(defaultFirestoreConfig);

  const now = Date.now();
  const existingIndex = identity.devices.findIndex(d => d.deviceId === device.deviceId);

  let updatedDevice: IdentityDevice;

  if (existingIndex >= 0) {
    updatedDevice = {
      ...identity.devices[existingIndex],
      deviceName: device.deviceName,
      platform: device.platform,
      publicKey: device.publicKey || identity.devices[existingIndex].publicKey,
      pushToken: device.pushToken || identity.devices[existingIndex].pushToken,
      lastSeen: now,
      isActive: true,
    };
    identity.devices[existingIndex] = updatedDevice;
  } else {
    updatedDevice = {
      ...device,
      pairedAt: now,
      lastSeen: now,
      isActive: true,
    };
    identity.devices.push(updatedDevice);
  }

  identity.updatedAt = now;
  localIdentitiesStore.set(msisdn, identity);

  if (db) {
    try {
      const docRef = doc(db, IDENTITIES_COLLECTION, msisdn);
      await updateDoc(docRef, {
        devices: identity.devices,
        updatedAt: now,
      });
    } catch (err) {
      console.warn('[IdentityService] Erro ao atualizar no Firestore, mantido no cache local:', err);
    }
  }

  return updatedDevice;
}

/**
 * Atualiza o heartbeat de um dispositivo (presença em tempo real)
 */
export async function updateDeviceHeartbeat(msisdnRaw: string, deviceId: string): Promise<void> {
  const msisdn = normalizeMsisdn(msisdnRaw);
  const identity = localIdentitiesStore.get(msisdn) || await getIdentity(msisdn);
  if (!identity) return;

  const now = Date.now();
  let changed = false;
  identity.devices = identity.devices.map(d => {
    if (d.deviceId === deviceId) {
      changed = true;
      return { ...d, lastSeen: now, isActive: true };
    }
    return d;
  });

  if (changed) {
    identity.updatedAt = now;
    localIdentitiesStore.set(msisdn, identity);
    const { db } = getFirebaseInstance(defaultFirestoreConfig);
    if (db) {
      try {
        await updateDoc(doc(db, IDENTITIES_COLLECTION, msisdn), {
          devices: identity.devices,
          updatedAt: now,
        });
      } catch (err) {
        console.warn('[IdentityService] Heartbeat fallback:', err);
      }
    }
  }
}

/**
 * Marca um dispositivo como inactivo (logout ou timeout)
 */
export async function setDeviceInactive(msisdnRaw: string, deviceId: string): Promise<void> {
  const msisdn = normalizeMsisdn(msisdnRaw);
  const identity = localIdentitiesStore.get(msisdn) || await getIdentity(msisdn);
  if (!identity) return;

  const now = Date.now();
  identity.devices = identity.devices.map(d => {
    if (d.deviceId === deviceId) {
      return { ...d, isActive: false };
    }
    return d;
  });

  identity.updatedAt = now;
  localIdentitiesStore.set(msisdn, identity);

  const { db } = getFirebaseInstance(defaultFirestoreConfig);
  if (db) {
    try {
      await updateDoc(doc(db, IDENTITIES_COLLECTION, msisdn), {
        devices: identity.devices,
        updatedAt: now,
      });
    } catch (err) {
      console.warn('[IdentityService] SetInactive fallback:', err);
    }
  }
}

/**
 * Gera um token de emparelhamento efémero (QR Code Token)
 */
export async function generatePairingToken(msisdnRaw: string, workspaceId: string = 'ws-vitronis-default'): Promise<string> {
  const msisdn = normalizeMsisdn(msisdnRaw);
  const randomStr = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  const token = `pair_tok_${randomStr}`;
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutos

  const pairingRecord: PairingToken = {
    token,
    msisdn,
    workspaceId,
    expiresAt,
    used: false,
  };

  localPairingTokensStore.set(token, pairingRecord);

  const { db } = getFirebaseInstance(defaultFirestoreConfig);
  if (db) {
    try {
      const tokenRef = doc(db, PAIRING_TOKENS_COLLECTION, token);
      await setDoc(tokenRef, pairingRecord);
    } catch (err) {
      console.warn('[IdentityService] Pairing token salvo no cache local:', err);
    }
  }

  return token;
}

/**
 * Valida e consome um token de emparelhamento
 */
export async function claimPairingToken(
  token: string,
  device: Omit<IdentityDevice, 'pairedAt' | 'isActive' | 'lastSeen'>
): Promise<{ msisdn: string; workspaceId: string; deviceId: string }> {
  let record = localPairingTokensStore.get(token);

  const { db } = getFirebaseInstance(defaultFirestoreConfig);
  if (!record && db) {
    try {
      const tokenRef = doc(db, PAIRING_TOKENS_COLLECTION, token);
      const snap = await getDoc(tokenRef);
      if (snap.exists()) {
        record = snap.data() as PairingToken;
      }
    } catch (err) {
      console.warn('[IdentityService] Claim token read error:', err);
    }
  }

  if (!record) {
    throw new Error('Token de emparelhamento inválido ou não encontrado.');
  }
  if (record.used) {
    throw new Error('Token de emparelhamento já foi utilizado.');
  }
  if (record.expiresAt < Date.now()) {
    throw new Error('Token de emparelhamento expirado.');
  }

  record.used = true;
  localPairingTokensStore.set(token, record);

  if (db) {
    try {
      await updateDoc(doc(db, PAIRING_TOKENS_COLLECTION, token), { used: true });
    } catch (err) {
      console.warn('[IdentityService] Token status update fallback:', err);
    }
  }

  const registeredDevice = await registerDevice(record.msisdn, device);

  return {
    msisdn: record.msisdn,
    workspaceId: record.workspaceId,
    deviceId: registeredDevice.deviceId,
  };
}

/**
 * Obtém a identidade completa para um MSISDN
 */
export async function getIdentity(msisdnRaw: string): Promise<IdentityGraph | null> {
  const msisdn = normalizeMsisdn(msisdnRaw);
  if (localIdentitiesStore.has(msisdn)) {
    return localIdentitiesStore.get(msisdn)!;
  }

  const { db } = getFirebaseInstance(defaultFirestoreConfig);
  if (db) {
    try {
      const docRef = doc(db, IDENTITIES_COLLECTION, msisdn);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as IdentityGraph;
        localIdentitiesStore.set(msisdn, data);
        return data;
      }
    } catch (err) {
      console.warn('[IdentityService] getIdentity fallback:', err);
    }
  }
  return null;
}

/**
 * Remove um dispositivo da identidade
 */
export async function removeDevice(msisdnRaw: string, deviceId: string): Promise<void> {
  const msisdn = normalizeMsisdn(msisdnRaw);
  const identity = await getIdentity(msisdn);
  if (!identity) return;

  identity.devices = identity.devices.filter(d => d.deviceId !== deviceId);
  identity.updatedAt = Date.now();
  localIdentitiesStore.set(msisdn, identity);

  const { db } = getFirebaseInstance(defaultFirestoreConfig);
  if (db) {
    try {
      await updateDoc(doc(db, IDENTITIES_COLLECTION, msisdn), {
        devices: identity.devices,
        updatedAt: identity.updatedAt,
      });
    } catch (err) {
      console.warn('[IdentityService] removeDevice fallback:', err);
    }
  }
}
