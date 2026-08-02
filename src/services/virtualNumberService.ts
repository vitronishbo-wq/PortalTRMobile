import { db } from '../firebase/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { VirtualNumber } from '../types/cpaas';

const NUMBERS_COLLECTION = 'virtualNumbers';

const localNumbersMap = new Map<string, VirtualNumber>();

export async function buyNumber(workspaceId: string, areaCode?: string): Promise<VirtualNumber> {
  const code = areaCode || '244';
  const randomStr = Math.floor(10000000 + Math.random() * 90000000).toString();
  const number = `+${code}${randomStr}`;

  const id = `num_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
  const virtualNumber: VirtualNumber = {
    id,
    number,
    workspaceId,
    provider: 'twilio',
    status: 'assigned',
    monthlyCost: 100, // 1 USD em cents
    createdAt: Date.now(),
    capabilities: { sms: true, voice: true, whatsapp: true },
    metadata: { areaCode: code },
  };

  localNumbersMap.set(id, virtualNumber);

  if (db) {
    try {
      await setDoc(doc(db, NUMBERS_COLLECTION, id), virtualNumber);
    } catch (err) {
      console.warn('[virtualNumberService] Erro ao salvar no Firestore, usando cache local:', err);
    }
  }

  return virtualNumber;
}

export async function listVirtualNumbers(workspaceId: string): Promise<VirtualNumber[]> {
  const result: VirtualNumber[] = [];

  if (db) {
    try {
      const q = query(collection(db, NUMBERS_COLLECTION), where('workspaceId', '==', workspaceId));
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(d => {
        const num = d.data() as VirtualNumber;
        localNumbersMap.set(num.id, num);
        result.push(num);
      });
      if (result.length > 0) return result;
    } catch (err) {
      console.warn('[virtualNumberService] Erro ao pesquisar no Firestore, caindo no cache local:', err);
    }
  }

  localNumbersMap.forEach((val) => {
    if (val.workspaceId === workspaceId) {
      result.push(val);
    }
  });

  return result;
}

export async function assignNumberToNode(numberId: string, nodeId: string): Promise<void> {
  const record = localNumbersMap.get(numberId);
  if (record) {
    record.assignedTo = nodeId;
    localNumbersMap.set(numberId, record);
  }

  if (db) {
    try {
      await updateDoc(doc(db, NUMBERS_COLLECTION, numberId), { assignedTo: nodeId });
    } catch (err) {
      console.warn('[virtualNumberService] Erro ao atualizar atribuição no Firestore:', err);
    }
  }
}

export async function releaseNumber(numberId: string): Promise<void> {
  const record = localNumbersMap.get(numberId);
  if (record) {
    record.status = 'available';
    delete record.assignedTo;
    localNumbersMap.set(numberId, record);
  }

  if (db) {
    try {
      await updateDoc(doc(db, NUMBERS_COLLECTION, numberId), { status: 'available', assignedTo: null });
    } catch (err) {
      console.warn('[virtualNumberService] Erro ao libertar número no Firestore:', err);
    }
  }
}

export async function deleteNumber(numberId: string): Promise<void> {
  localNumbersMap.delete(numberId);

  if (db) {
    try {
      await deleteDoc(doc(db, NUMBERS_COLLECTION, numberId));
    } catch (err) {
      console.warn('[virtualNumberService] Erro ao eliminar número no Firestore:', err);
    }
  }
}
