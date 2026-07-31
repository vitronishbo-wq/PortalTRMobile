import { db } from '../firebase/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { License, LicensePlan } from '../types/License';

export type SubscriptionState = 'Trial' | 'Premium' | 'Lifetime' | 'Suspended' | 'Expired' | 'Developer' | 'Founder';

export interface LicenseRecord extends License {
  userId: string;
  userEmail: string;
  user: string;
  plan: LicensePlan;
  expires: number;
  trial: boolean;
  daysLeft: number;
  activatedBy: string;
  state: SubscriptionState;
  trialStartDate: number;
  trialEndDate: number;
  bonusDays: number;
  promotionDays: number;
  lifetime: boolean;
  reason?: string;
  appliedPromotions: string[];
  updatedAt: number;
}

export interface PromotionRule {
  id: string;
  name: string;
  condition: string;
  grantDays: number | 'lifetime';
  description: string;
  active: boolean;
}

export class TrialEngine {
  private static userLicenses = new Map<string, LicenseRecord>();

  private static promotionRules: PromotionRule[] = [
    {
      id: 'rule-ref-10',
      name: 'Referral > 10 Users',
      condition: 'referralCount >= 10',
      grantDays: 30,
      description: 'Recompensa automática de +30 dias para embaixadores',
      active: true
    },
    {
      id: 'rule-beta-tester',
      name: 'Pioneiro Beta Tester',
      condition: 'isBetaTester === true',
      grantDays: 'lifetime',
      description: 'Acesso Vitalício ilimitado para utilizadores da fase Beta',
      active: true
    },
    {
      id: 'rule-founder-choice',
      name: 'Founder Choice Custom',
      condition: 'grantedByFounder === true',
      grantDays: 90,
      description: 'Concessão direta executada através da Founder Console',
      active: true
    }
  ];

  /**
   * Initializes or gets user license
   */
  static getLicense(userId: string, email: string = 'utilizador@portal.ao'): LicenseRecord {
    const existing = TrialEngine.userLicenses.get(userId);
    if (existing) {
      // Recalculate dynamic daysLeft & expires
      const now = Date.now();
      const msRem = Math.max(0, existing.expires - now);
      existing.daysLeft = existing.lifetime ? 9999 : Math.ceil(msRem / 86400000);
      return existing;
    }

    const now = Date.now();
    const defaultTrialDays = 7;
    const expiresTimestamp = now + defaultTrialDays * 86400000;
    const daysLeftVal = defaultTrialDays;

    const defaultLicense: LicenseRecord = {
      id: userId,
      userId,
      userEmail: email,
      user: userId,
      plan: 'trial',
      expires: expiresTimestamp,
      trial: true,
      daysLeft: daysLeftVal,
      activatedBy: 'system_onboarding',
      state: 'Trial',
      trialStartDate: now,
      trialEndDate: expiresTimestamp,
      bonusDays: 0,
      promotionDays: 0,
      lifetime: false,
      reason: 'Standard 7-Day Smart Onboarding Trial',
      appliedPromotions: [],
      createdAt: now,
      updatedAt: now
    };

    TrialEngine.userLicenses.set(userId, defaultLicense);
    return defaultLicense;
  }

  /**
   * Extends or modifies license directly from Founder Workspace without code deployment
   */
  static modifyLicense(
    userId: string,
    action: '+3d' | '+15d' | '+30d' | '+90d' | 'lifetime' | 'reset',
    reasonByFounder: string = 'Ajuste direto via Founder Workspace',
    activatedByCaller: string = 'ROOT'
  ): LicenseRecord {
    const license = TrialEngine.getLicense(userId);
    const now = Date.now();

    license.activatedBy = activatedByCaller;

    if (action === 'lifetime') {
      license.state = 'Lifetime';
      license.plan = 'founder';
      license.lifetime = true;
      license.trial = false;
      license.expires = now + 36500 * 86400000; // ~100 years
      license.daysLeft = 9999;
      license.reason = reasonByFounder;
    } else if (action === 'reset') {
      license.state = 'Trial';
      license.plan = 'trial';
      license.trial = true;
      license.trialStartDate = now;
      license.trialEndDate = now + 7 * 86400000;
      license.expires = license.trialEndDate;
      license.daysLeft = 7;
      license.lifetime = false;
      license.reason = 'Reset de período experimental efetuado pelo Founder';
    } else {
      const addedDays = action === '+3d' ? 3 : action === '+15d' ? 15 : action === '+30d' ? 30 : 90;
      license.bonusDays += addedDays;
      license.trialEndDate += addedDays * 86400000;
      license.expires = license.trialEndDate;
      const isStillTrial = license.trialEndDate > now;
      license.state = isStillTrial ? 'Trial' : 'Expired';
      license.trial = isStillTrial;
      license.plan = isStillTrial ? 'trial' : 'free';
      license.daysLeft = Math.max(0, Math.ceil((license.expires - now) / 86400000));
      license.reason = `${reasonByFounder} (+${addedDays} dias adicionados)`;
    }

    license.updatedAt = now;
    TrialEngine.userLicenses.set(userId, license);

    if (db) {
      setDoc(doc(db, 'licenses', userId), license, { merge: true }).catch((err) =>
        console.warn('[TrialEngine] Sync warning:', err)
      );
    }

    return license;
  }

  /**
   * Checks validity and automatically calculates status
   */
  static evaluateState(license: LicenseRecord): { active: boolean; daysRemaining: number; label: string } {
    if (license.lifetime || license.state === 'Lifetime' || license.state === 'Founder' || license.plan === 'founder') {
      return { active: true, daysRemaining: 9999, label: 'Licença Vitalícia (Ilimitada)' };
    }

    const now = Date.now();
    const msRemaining = license.expires - now;
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / 86400000));

    license.daysLeft = daysRemaining;

    if (msRemaining <= 0) {
      license.state = 'Expired';
      license.trial = false;
      license.plan = 'free';
      return { active: false, daysRemaining: 0, label: 'Período de Experiência Expirado' };
    }

    return {
      active: true,
      daysRemaining,
      label: `Ativo (${daysRemaining} ${daysRemaining === 1 ? 'dia restante' : 'dias restantes'})`
    };
  }

  static getPromotionRules(): PromotionRule[] {
    return [...TrialEngine.promotionRules];
  }
}

