import { db } from '../firebase/firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../services/firestoreCollections';

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  role: 'family' | 'backup' | 'emergency' | 'admin';
  verified: boolean;
}

export interface MasterIdentity {
  uid: string;
  primaryNumber: string;
  primaryDevice: string;
  primarySession: string;
  identityRecovery: {
    recoveryHash: string;
    generatedAt: number;
    methods: ('sms' | 'email' | 'biometric' | 'trusted_contacts')[];
  };
  identityBackup: {
    lastBackupAt: number;
    cloudSnapshotRef: string;
    autoSyncEnabled: boolean;
  };
  identityTransfer: {
    inProgress: boolean;
    transferToken?: string;
    targetDeviceId?: string;
    expiresAt?: number;
  };
  trustedContacts: TrustedContact[];
  sessionMigration: {
    lastMigrationAt: number;
    fromDeviceId?: string;
    toDeviceId?: string;
    status: 'IDLE' | 'MIGRATING' | 'COMPLETED' | 'FAILED';
  };
  crossPlatformIdentity: {
    android: boolean;
    iphone: boolean;
    windows: boolean;
    macos: boolean;
    linux: boolean;
    tablet: boolean;
    ipad: boolean;
    web: boolean;
    smarttv: boolean;
  };
  createdAt: number;
  updatedAt: number;
}

export class MasterIdentityEngine {
  /**
   * Initializes or fetches master identity for user uid
   */
  static async getOrCreateMasterIdentity(uid: string, initialNumber?: string): Promise<MasterIdentity> {
    const defaultNumber = initialNumber || '+244 923 000 111';
    const defaultIdentity: MasterIdentity = {
      uid,
      primaryNumber: defaultNumber,
      primaryDevice: `dev-primary-${uid.substring(0, 6)}`,
      primarySession: `sess-master-${uid.substring(0, 6)}`,
      identityRecovery: {
        recoveryHash: `rec-${Math.random().toString(36).substring(2, 10)}`,
        generatedAt: Date.now(),
        methods: ['sms', 'email', 'trusted_contacts']
      },
      identityBackup: {
        lastBackupAt: Date.now(),
        cloudSnapshotRef: `gs://portal-backup/${uid}/latest.json`,
        autoSyncEnabled: true
      },
      identityTransfer: {
        inProgress: false
      },
      trustedContacts: [
        { id: 'tc-1', name: 'Suporte Founder', phone: '+244 923 888 111', role: 'emergency', verified: true }
      ],
      sessionMigration: {
        lastMigrationAt: Date.now(),
        status: 'COMPLETED'
      },
      crossPlatformIdentity: {
        android: true,
        iphone: true,
        windows: true,
        macos: true,
        linux: true,
        tablet: true,
        ipad: true,
        web: true,
        smarttv: true
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (!db) return defaultIdentity;

    try {
      const docRef = doc(db, FIRESTORE_COLLECTIONS.MASTER_IDENTITY, uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as MasterIdentity;
      } else {
        await setDoc(docRef, defaultIdentity);
        return defaultIdentity;
      }
    } catch (e) {
      console.warn('[MasterIdentityEngine] Firestore error, returning local default:', e);
      return defaultIdentity;
    }
  }

  /**
   * Initiates seamless cross-platform session migration from one device to another
   */
  static async migrateSession(uid: string, fromDeviceId: string, toDeviceId: string): Promise<boolean> {
    const docRef = db ? doc(db, FIRESTORE_COLLECTIONS.MASTER_IDENTITY, uid) : null;
    const payload = {
      primaryDevice: toDeviceId,
      primarySession: `sess-migrated-${Date.now().toString(36)}`,
      sessionMigration: {
        lastMigrationAt: Date.now(),
        fromDeviceId,
        toDeviceId,
        status: 'COMPLETED' as const
      },
      updatedAt: Date.now()
    };

    if (docRef) {
      try {
        await updateDoc(docRef, payload);
        return true;
      } catch (e) {
        console.warn('[MasterIdentityEngine] Migration update error:', e);
      }
    }
    return true;
  }

  /**
   * Listens to real-time updates for master identity
   */
  static listenMasterIdentity(uid: string, callback: (identity: MasterIdentity) => void) {
    if (!db) return () => {};
    const docRef = doc(db, FIRESTORE_COLLECTIONS.MASTER_IDENTITY, uid);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        callback(snap.data() as MasterIdentity);
      }
    });
  }
}
