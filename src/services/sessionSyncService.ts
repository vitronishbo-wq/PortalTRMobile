import { db } from '../firebase/firebase';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { SessionState } from '../types/SessionState';
import { commandQueue } from './commandQueue';

const SESSIONS_COLLECTION = 'sessions';

/**
 * Atualiza o estado da sessão ativa para um dispositivo
 */
export async function updateSessionState(
  msisdn: string,
  deviceId: string,
  state: Partial<Omit<SessionState, 'msisdn' | 'deviceId' | 'sessionId' | 'updatedAt'>>
): Promise<SessionState> {
  const sessionId = `${msisdn}:${deviceId}`;
  const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
  
  let currentState: SessionState = {
    sessionId,
    msisdn,
    deviceId,
    activeTab: 'inbox',
    draftMessage: '',
    context: {},
    updatedAt: Date.now(),
    isActive: true,
  };

  try {
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      currentState = existing.data() as SessionState;
    }
  } catch (err) {
    console.warn('[sessionSyncService] Leitura de sessão no Firestore indisponível, a utilizar estado local:', err);
  }

  const newState: SessionState = {
    ...currentState,
    ...state,
    updatedAt: Date.now(),
    isActive: true,
  };

  try {
    await setDoc(docRef, newState);
  } catch (err) {
    console.warn('[sessionSyncService] Escrita de sessão no Firestore indisponível:', err);
  }

  // Notifica outros dispositivos via Command Queue
  commandQueue.emit('state:updated', { msisdn, deviceId, state: newState });

  return newState;
}

/**
 * Obtém o estado da sessão de um dispositivo
 */
export async function getSessionState(msisdn: string, deviceId: string): Promise<SessionState | null> {
  try {
    const docRef = doc(db, SESSIONS_COLLECTION, `${msisdn}:${deviceId}`);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docSnap.data() as SessionState;
  } catch (err) {
    console.warn('[sessionSyncService] Erro ao obter estado da sessão:', err);
    return null;
  }
}

/**
 * Obtém todos os estados de sessão de uma identidade (todos os dispositivos)
 */
export async function getAllSessionStates(msisdn: string): Promise<SessionState[]> {
  try {
    const q = query(collection(db, SESSIONS_COLLECTION), where('msisdn', '==', msisdn));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as SessionState);
  } catch (err) {
    console.warn('[sessionSyncService] Erro ao pesquisar sessões:', err);
    return [];
  }
}

/**
 * Marca uma sessão como inativa (logout ou timeout)
 */
export async function deactivateSession(msisdn: string, deviceId: string): Promise<void> {
  try {
    const docRef = doc(db, SESSIONS_COLLECTION, `${msisdn}:${deviceId}`);
    await updateDoc(docRef, { isActive: false, updatedAt: Date.now() });
  } catch (err) {
    console.warn('[sessionSyncService] Erro ao desativar sessão:', err);
  }
}

/**
 * Função para fazer handover: quando um dispositivo se torna ativo, puxa o estado do último dispositivo ativo
 */
export async function performHandover(msisdn: string, newDeviceId: string): Promise<SessionState | null> {
  const allStates = await getAllSessionStates(msisdn);
  const activeStates = allStates.filter(s => s.isActive && s.deviceId !== newDeviceId);
  if (activeStates.length === 0) return null;

  // Pegar o mais recente (com base no updatedAt)
  const latest = activeStates.reduce((a, b) => a.updatedAt > b.updatedAt ? a : b);

  const newState: Partial<SessionState> = {
    activeTab: latest.activeTab,
    draftMessage: latest.draftMessage,
    draftRecipient: latest.draftRecipient,
    lastViewedEventId: latest.lastViewedEventId,
    scrollPosition: latest.scrollPosition,
    context: latest.context,
  };

  const updated = await updateSessionState(msisdn, newDeviceId, newState);
  return { ...latest, deviceId: newDeviceId, ...newState, updatedAt: updated.updatedAt };
}
