import { db } from '../firebase/firebase';
import { collection, doc, setDoc, getDocs, addDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../services/firestoreCollections';

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  balance: number;
  currency: string;
  accountType: 'corrente' | 'poupanca' | 'empresarial';
  status: 'active' | 'frozen' | 'closed';
  ownerUid: string;
}

export interface BankTransaction {
  id: string;
  accountId: string;
  type: 'transfer' | 'payment' | 'deposit' | 'withdrawal' | 'qr_code';
  amount: number;
  currency: string;
  recipientName: string;
  recipientIbanOrPhone: string;
  referenceNumber?: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: number;
}

export interface DigitalWallet {
  id: string;
  walletName: string;
  provider: string;
  phoneNumber: string;
  balance: number;
  currency: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  title: string;
  type: 'card' | 'bank_account' | 'qr' | 'digital_wallet';
  cardLast4?: string;
  cardExpiry?: string;
  brand?: string;
  isDefault: boolean;
}

export interface DynamicTelecomOperator {
  id: string;
  name: string;
  code: string;
  country: string;
  type: 'mobile' | 'landline' | 'voip' | 'satellite';
  status: 'active' | 'maintenance' | 'offline';
}

export class BankingHubEngine {
  /**
   * Listen to Bank Accounts dynamically from Firestore
   */
  static listenAccounts(uid: string, callback: (accounts: BankAccount[]) => void) {
    if (!db) {
      callback([]);
      return () => {};
    }
    try {
      const q = query(collection(db, FIRESTORE_COLLECTIONS.BANK_ACCOUNTS));
      return onSnapshot(q, (snap) => {
        const accs = snap.docs.map(d => ({ id: d.id, ...d.data() } as BankAccount));
        callback(accs);
      }, (err) => {
        console.warn('[BankingHubEngine] Error listening accounts:', err);
        callback([]);
      });
    } catch {
      callback([]);
      return () => {};
    }
  }

  /**
   * Listen to Transactions dynamically from Firestore
   */
  static listenTransactions(accountId: string, callback: (txs: BankTransaction[]) => void) {
    if (!db) {
      callback([]);
      return () => {};
    }
    try {
      const q = query(collection(db, FIRESTORE_COLLECTIONS.TRANSACTIONS));
      return onSnapshot(q, (snap) => {
        const allTxs = snap.docs.map(d => ({ id: d.id, ...d.data() } as BankTransaction));
        const filtered = accountId ? allTxs.filter(t => t.accountId === accountId || !t.accountId) : allTxs;
        callback(filtered.sort((a, b) => b.timestamp - a.timestamp));
      }, (err) => {
        console.warn('[BankingHubEngine] Error listening transactions:', err);
        callback([]);
      });
    } catch {
      callback([]);
      return () => {};
    }
  }

  /**
   * Listen to Digital Wallets dynamically from Firestore
   */
  static listenWallets(callback: (wallets: DigitalWallet[]) => void) {
    if (!db) {
      callback([]);
      return () => {};
    }
    try {
      const q = query(collection(db, FIRESTORE_COLLECTIONS.WALLETS));
      return onSnapshot(q, (snap) => {
        const wals = snap.docs.map(d => ({ id: d.id, ...d.data() } as DigitalWallet));
        callback(wals);
      }, (err) => {
        console.warn('[BankingHubEngine] Error listening wallets:', err);
        callback([]);
      });
    } catch {
      callback([]);
      return () => {};
    }
  }

  /**
   * Listen to Payment Methods dynamically from Firestore
   */
  static listenPaymentMethods(callback: (methods: PaymentMethod[]) => void) {
    if (!db) {
      callback([]);
      return () => {};
    }
    try {
      const q = query(collection(db, FIRESTORE_COLLECTIONS.PAYMENT_METHODS));
      return onSnapshot(q, (snap) => {
        const pms = snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentMethod));
        callback(pms);
      }, (err) => {
        console.warn('[BankingHubEngine] Error listening payment methods:', err);
        callback([]);
      });
    } catch {
      callback([]);
      return () => {};
    }
  }

  /**
   * Listen to Telecom Operators dynamically from Firestore
   */
  static listenTelecomOperators(callback: (operators: DynamicTelecomOperator[]) => void) {
    if (!db) {
      callback([]);
      return () => {};
    }
    try {
      const q = query(collection(db, FIRESTORE_COLLECTIONS.TELECOM_PROVIDERS));
      return onSnapshot(q, (snap) => {
        const ops = snap.docs.map(d => ({ id: d.id, ...d.data() } as DynamicTelecomOperator));
        callback(ops);
      }, (err) => {
        console.warn('[BankingHubEngine] Error listening telecom operators:', err);
        callback([]);
      });
    } catch {
      callback([]);
      return () => {};
    }
  }

  /**
   * Add a new dynamic Bank Account to Firestore
   */
  static async addBankAccount(acc: Omit<BankAccount, 'id'>): Promise<string> {
    const id = `acc-${Date.now()}`;
    const newAcc: BankAccount = { ...acc, id };
    if (db) {
      try {
        await setDoc(doc(db, FIRESTORE_COLLECTIONS.BANK_ACCOUNTS, id), newAcc);
      } catch (err) {
        console.warn('[BankingHubEngine] Error saving bank account to Firestore:', err);
      }
    }
    return id;
  }

  /**
   * Add a new dynamic Digital Wallet to Firestore
   */
  static async addDigitalWallet(wal: Omit<DigitalWallet, 'id'>): Promise<string> {
    const id = `wal-${Date.now()}`;
    const newWal: DigitalWallet = { ...wal, id };
    if (db) {
      try {
        await setDoc(doc(db, FIRESTORE_COLLECTIONS.WALLETS, id), newWal);
      } catch (err) {
        console.warn('[BankingHubEngine] Error saving wallet to Firestore:', err);
      }
    }
    return id;
  }

  /**
   * Add a new dynamic Transaction to Firestore
   */
  static async addTransaction(tx: Omit<BankTransaction, 'id'>): Promise<string> {
    const id = `tx-${Date.now()}`;
    const newTx: BankTransaction = { ...tx, id };
    if (db) {
      try {
        await setDoc(doc(db, FIRESTORE_COLLECTIONS.TRANSACTIONS, id), newTx);
      } catch (err) {
        console.warn('[BankingHubEngine] Error saving transaction to Firestore:', err);
      }
    }
    return id;
  }
}
