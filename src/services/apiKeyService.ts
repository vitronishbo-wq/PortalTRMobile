import { db } from '../firebase/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { ApiKey } from '../types/cpaas';

const API_KEYS_COLLECTION = 'apiKeys';

// Memory cache for resilience
const localKeysMap = new Map<string, ApiKey>();

export async function generateApiKey(
  workspaceId: string,
  name: string,
  permissions: string[] = ['send_sms', 'make_call', 'manage_numbers'],
  rateLimit: { limit: number; windowMs: number } = { limit: 60, windowMs: 60000 }
): Promise<string> {
  const randomStr = Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
  const key = `vtr_live_${randomStr}`;

  const apiKey: ApiKey = {
    key,
    workspaceId,
    name,
    permissions,
    rateLimit,
    createdAt: Date.now(),
    isActive: true,
  };

  localKeysMap.set(key, apiKey);

  if (db) {
    try {
      await setDoc(doc(db, API_KEYS_COLLECTION, key), apiKey);
    } catch (err) {
      console.warn('[apiKeyService] Escrita no Firestore indisponível, salvo no cache local:', err);
    }
  }

  return key;
}

export async function getApiKey(key: string): Promise<ApiKey | null> {
  if (localKeysMap.has(key)) {
    return localKeysMap.get(key)!;
  }

  if (db) {
    try {
      const docRef = doc(db, API_KEYS_COLLECTION, key);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as ApiKey;
        localKeysMap.set(key, data);
        return data;
      }
    } catch (err) {
      console.warn('[apiKeyService] Leitura no Firestore falhou:', err);
    }
  }

  return null;
}

export async function listApiKeys(workspaceId: string): Promise<ApiKey[]> {
  const result: ApiKey[] = [];

  if (db) {
    try {
      const q = query(collection(db, API_KEYS_COLLECTION), where('workspaceId', '==', workspaceId));
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(d => {
        const keyObj = d.data() as ApiKey;
        localKeysMap.set(keyObj.key, keyObj);
        result.push(keyObj);
      });
      if (result.length > 0) return result;
    } catch (err) {
      console.warn('[apiKeyService] Pesquisa no Firestore falhou, usando cache local:', err);
    }
  }

  localKeysMap.forEach((val) => {
    if (val.workspaceId === workspaceId) {
      result.push(val);
    }
  });

  return result;
}

export async function revokeApiKey(key: string): Promise<void> {
  const record = localKeysMap.get(key);
  if (record) {
    record.isActive = false;
    localKeysMap.set(key, record);
  }

  if (db) {
    try {
      await updateDoc(doc(db, API_KEYS_COLLECTION, key), { isActive: false });
    } catch (err) {
      console.warn('[apiKeyService] Revogação no Firestore falhou:', err);
    }
  }
}

export async function deleteApiKey(key: string): Promise<void> {
  localKeysMap.delete(key);

  if (db) {
    try {
      await deleteDoc(doc(db, API_KEYS_COLLECTION, key));
    } catch (err) {
      console.warn('[apiKeyService] Eliminação no Firestore falhou:', err);
    }
  }
}

export async function updateApiKeyLastUsed(key: string): Promise<void> {
  const record = localKeysMap.get(key);
  const now = Date.now();
  if (record) {
    record.lastUsed = now;
    localKeysMap.set(key, record);
  }

  if (db) {
    try {
      await updateDoc(doc(db, API_KEYS_COLLECTION, key), { lastUsed: now });
    } catch (err) {
      // Slient fallback
    }
  }
}
