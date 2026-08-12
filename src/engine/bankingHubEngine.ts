import { db } from '../firebase/firebase';
import { collection, doc, setDoc, getDocs, addDoc, query, where, onSnapshot } from 'firebase/firestore';
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
  provider: 'Multicaixa Express' | 'AppyPay' | 'PayPal' | 'M-Pesa' | 'Unitel Money' | 'KwanzaPay';
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
  brand?: 'Multicaixa' | 'Visa' | 'Mastercard';
  isDefault: boolean;
}

export class BankingHubEngine {
  static async getAccounts(uid: string): Promise<BankAccount[]> {
    const defaults: BankAccount[] = [
      {
        id: 'acc-bfa-01',
        bankName: 'Banco Fomento Angola (BFA)',
        accountNumber: '12345678901',
        iban: 'AO06.0006.0000.1234.5678.9010.1',
        balance: 2450000.00,
        currency: 'AOA',
        accountType: 'corrente',
        status: 'active',
        ownerUid: uid
      },
      {
        id: 'acc-[#111]-02',
        bankName: 'Banco BAI',
        accountNumber: '98765432101',
        iban: 'AO06.0040.0000.9876.5432.1010.2',
        balance: 1820500.50,
        currency: 'AOA',
        accountType: 'empresarial',
        status: 'active',
        ownerUid: uid
      }
    ];

    if (!db) return defaults;
    try {
      const q = query(collection(db, FIRESTORE_COLLECTIONS.BANK_ACCOUNTS), where('ownerUid', '==', uid));
      const snap = await getDocs(q);
      if (snap.empty) return defaults;
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as BankAccount));
    } catch {
      return defaults;
    }
  }

  static async getTransactions(accountId: string): Promise<BankTransaction[]> {
    const defaults: BankTransaction[] = [
      {
        id: 'tx-001',
        accountId,
        type: 'transfer',
        amount: 45000,
        currency: 'AOA',
        recipientName: 'Unitel Angola Telecom',
        recipientIbanOrPhone: 'AO06.0006.0000.9999.8888.7777.1',
        referenceNumber: 'REF-2026-9912',
        status: 'completed',
        timestamp: Date.now() - 3600000
      },
      {
        id: 'tx-002',
        accountId,
        type: 'qr_code',
        amount: 12500,
        currency: 'AOA',
        recipientName: 'Pagamento Multicaixa Express QR',
        recipientIbanOrPhone: '+244923888111',
        referenceNumber: 'QR-MCX-88219',
        status: 'completed',
        timestamp: Date.now() - 86400000
      }
    ];

    if (!db) return defaults;
    try {
      const q = query(collection(db, FIRESTORE_COLLECTIONS.TRANSACTIONS), where('accountId', '==', accountId));
      const snap = await getDocs(q);
      if (snap.empty) return defaults;
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as BankTransaction));
    } catch {
      return defaults;
    }
  }

  static async getWallets(): Promise<DigitalWallet[]> {
    return [
      { id: 'wal-1', walletName: 'Multicaixa Express', provider: 'Multicaixa Express', phoneNumber: '+244 923 888 111', balance: 350000.00, currency: 'AOA', isDefault: true },
      { id: 'wal-2', walletName: 'Unitel Money', provider: 'Unitel Money', phoneNumber: '+244 923 888 111', balance: 120000.00, currency: 'AOA', isDefault: false }
    ];
  }

  static async getPaymentMethods(): Promise<PaymentMethod[]> {
    return [
      { id: 'pm-1', title: 'Cartão Multicaixa Debito', type: 'card', cardLast4: '4821', cardExpiry: '08/28', brand: 'Multicaixa', isDefault: true },
      { id: 'pm-2', title: 'Cartão Visa Internacional', type: 'card', cardLast4: '9901', cardExpiry: '12/29', brand: 'Visa', isDefault: false }
    ];
  }
}
