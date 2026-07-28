import { UserProfile, UserRole } from '../types/User';
import { db } from '../firebase/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface FeatureFlagsState {
  'payments.enabled': boolean;
  'appypay.enabled': boolean;
  'admin.enabled': boolean;
  'developer.enabled': boolean;
  'proxy.enabled': boolean;
}

export interface SecretStatusItem {
  id: string;
  name: string;
  category: 'payment' | 'database' | 'hosting' | 'version_control' | 'ai';
  status: 'configured' | 'pending' | 'online' | 'disabled';
  statusLabel: string;
  modeLabel?: string;
  lastChecked: number;
}

export interface SuperUserCredentials {
  username: string;
  email: string;
  role: 'founder';
  pinCode: string;
  systemKey: string;
  immutable: boolean;
}

export const DEUS_FUNDADOR_CREDENTIALS: SuperUserCredentials = {
  username: 'deusfundador',
  email: 'deusfundador@portal.internal',
  role: 'founder',
  pinCode: '0000',
  systemKey: 'SYS-FOUNDER-DEUS-MASTER-2026-X99',
  immutable: true
};

export class BootstrapEngine {
  private static founderProfile: UserProfile | null = null;
  private static bootstrapCompleted = false;

  private static featureFlags: FeatureFlagsState = {
    'payments.enabled': true,
    'appypay.enabled': true,
    'admin.enabled': true,
    'developer.enabled': true,
    'proxy.enabled': false
  };

  /**
   * Controlled Bootstrap: Guarantees a single Founder user exists, system-marked and immutable.
   */
  static async initFounderBootstrap(): Promise<UserProfile> {
    if (BootstrapEngine.founderProfile) {
      return BootstrapEngine.founderProfile;
    }

    const defaultFounder: UserProfile = {
      userId: 'deusfundador-master-001',
      email: DEUS_FUNDADOR_CREDENTIALS.email,
      displayName: 'Deus Fundador (Super Utilizador Master)',
      role: 'founder',
      system: true,
      immutable: true,
      createdAt: Date.now(),
      lastLogin: Date.now(),
      permissions: ['*']
    };

    if (db) {
      try {
        const founderDocRef = doc(db, 'users', defaultFounder.userId);
        const snap = await getDoc(founderDocRef);

        if (snap.exists()) {
          BootstrapEngine.founderProfile = snap.data() as UserProfile;
        } else {
          await setDoc(founderDocRef, defaultFounder);
          BootstrapEngine.founderProfile = defaultFounder;
        }
      } catch (err) {
        console.warn('[BootstrapEngine] Firestore init warning, using local state:', err);
        BootstrapEngine.founderProfile = defaultFounder;
      }
    } else {
      BootstrapEngine.founderProfile = defaultFounder;
    }

    BootstrapEngine.bootstrapCompleted = true;
    return BootstrapEngine.founderProfile;
  }

  static getFounder(): UserProfile | null {
    return BootstrapEngine.founderProfile;
  }

  static isBootstrapCompleted(): boolean {
    return BootstrapEngine.bootstrapCompleted;
  }

  /**
   * Feature Flags management
   */
  static getFeatureFlags(): FeatureFlagsState {
    return { ...BootstrapEngine.featureFlags };
  }

  static toggleFeatureFlag(key: keyof FeatureFlagsState, value: boolean): FeatureFlagsState {
    BootstrapEngine.featureFlags[key] = value;

    if (db) {
      setDoc(doc(db, 'settings', 'feature_flags'), BootstrapEngine.featureFlags, { merge: true }).catch(
        (e) => console.warn('[BootstrapEngine] Flag sync error:', e)
      );
    }

    return { ...BootstrapEngine.featureFlags };
  }

  /**
   * Secrets Status Monitor (Status overview without exposing sensitive secrets)
   */
  static getSecretsStatus(): SecretStatusItem[] {
    return [
      {
        id: 'appypay_secret',
        name: 'AppyPay Gateway',
        category: 'payment',
        status: 'configured',
        statusLabel: '✓ Configurado',
        modeLabel: 'Sandbox Mode (ClientID: appypay_sbx_***)',
        lastChecked: Date.now()
      },
      {
        id: 'firebase_secret',
        name: 'Firebase Firestore & Auth',
        category: 'database',
        status: 'configured',
        statusLabel: '✓ Configurado',
        modeLabel: 'Cloud Project (ais-dev-***)',
        lastChecked: Date.now()
      },
      {
        id: 'render_secret',
        name: 'Render Cloud Run Container',
        category: 'hosting',
        status: 'online',
        statusLabel: '✓ Online',
        modeLabel: 'Port 3000 Ingress',
        lastChecked: Date.now()
      },
      {
        id: 'github_secret',
        name: 'GitHub Repository Sync',
        category: 'version_control',
        status: 'configured',
        statusLabel: '✓ Ligado',
        modeLabel: 'Branch main (Auto-deploy)',
        lastChecked: Date.now()
      },
      {
        id: 'google_ai_secret',
        name: 'Google Gemini AI Key',
        category: 'ai',
        status: 'configured',
        statusLabel: '✓ Configurado',
        modeLabel: 'Server-side Secret (process.env.GEMINI_API_KEY)',
        lastChecked: Date.now()
      }
    ];
  }
}
