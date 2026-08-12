import { db } from '../firebase/firebase';
import { doc, getDoc, setDoc, collection, onSnapshot, query } from 'firebase/firestore';
import { LicensePlan } from '../types/License';
import { TrialEngine, LicenseRecord } from './trialEngine';

export type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'GRACE_PERIOD' | 'EXPIRED' | 'SUSPENDED' | 'LIFETIME' | 'CANCELLED';

export interface SubscriptionPlan {
  id: string;
  code: LicensePlan | string;
  name: string;
  priceMonthlyAOA: number;
  priceAnnualAOA: number;
  description: string;
  maxDevices: number;
  maxDailySms: number;
  maxWebhooks: number;
  aiTokensPerMonth: number;
  featured: boolean;
  entitlements: EntitlementClaim[];
}

export type EntitlementClaim =
  | '*'
  | 'cpaas_sms_gateway'
  | 'cpaas_custom_webhooks'
  | 'multi_device_sync'
  | 'appypay_gateway'
  | 'unlimited_ai'
  | 'custom_domain'
  | 'audit_exporter'
  | 'high_priority_queue'
  | 'dedicated_agent_mesh';

export interface PromotionCampaign {
  id: string;
  code: string;
  name: string;
  type: 'DISCOUNT_PERCENT' | 'EXTRA_DAYS' | 'LIFETIME_UPGRADE';
  value: number; // e.g., 50 for 50% or 30 for 30 days
  description: string;
  validUntil: number;
  maxRedemptions: number;
  redemptionsCount: number;
  active: boolean;
}

export interface BonusAllocation {
  id: string;
  userId: string;
  userEmail: string;
  grantedDays: number;
  reason: string;
  grantedBy: string;
  timestamp: number;
}

export interface ExtensionRecord {
  id: string;
  userId: string;
  userEmail: string;
  type: '+3d' | '+15d' | '+30d' | '+90d' | '+365d' | 'lifetime' | 'reset' | 'grace_period';
  addedDays: number;
  reason: string;
  executedBy: string;
  timestamp: number;
}

export interface EntitlementOverride {
  userId: string;
  grantedEntitlements: EntitlementClaim[];
  revokedEntitlements: EntitlementClaim[];
  updatedAt: number;
  updatedBy: string;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  startDate: number;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  trialStartDate?: number;
  trialEndDate?: number;
  isTrial: boolean;
  bonusDaysTotal: number;
  promotionsApplied: string[];
  gracePeriodEnd?: number;
  lifetime: boolean;
  customEntitlements: EntitlementClaim[];
  lastPaymentDate?: number;
  updatedAt: number;
}

export class SubscriptionEngine {
  // Pre-configured Subscription Plans
  public static readonly PLANS: SubscriptionPlan[] = [
    {
      id: 'plan-starter',
      code: 'free',
      name: 'Starter Trial Free',
      priceMonthlyAOA: 0,
      priceAnnualAOA: 0,
      description: 'Plano inicial para testes e pareamento de 1 agente Android.',
      maxDevices: 1,
      maxDailySms: 50,
      maxWebhooks: 2,
      aiTokensPerMonth: 10000,
      featured: false,
      entitlements: ['cpaas_sms_gateway']
    },
    {
      id: 'plan-pro',
      code: 'pro',
      name: 'Pro Communication Engine',
      priceMonthlyAOA: 25000,
      priceAnnualAOA: 240000,
      description: 'Ideal para pequenas empresas. Sincronização multi-dispositivo e AppyPay.',
      maxDevices: 5,
      maxDailySms: 2500,
      maxWebhooks: 10,
      aiTokensPerMonth: 250000,
      featured: true,
      entitlements: [
        'cpaas_sms_gateway',
        'cpaas_custom_webhooks',
        'multi_device_sync',
        'appypay_gateway',
        'high_priority_queue'
      ]
    },
    {
      id: 'plan-enterprise',
      code: 'enterprise',
      name: 'Enterprise Agent Mesh',
      priceMonthlyAOA: 85000,
      priceAnnualAOA: 850000,
      description: 'Infraestrutura dedicada, frota ilimitada de agentes Android e IA Gemini.',
      maxDevices: 50,
      maxDailySms: 50000,
      maxWebhooks: 100,
      aiTokensPerMonth: 2000000,
      featured: false,
      entitlements: [
        'cpaas_sms_gateway',
        'cpaas_custom_webhooks',
        'multi_device_sync',
        'appypay_gateway',
        'unlimited_ai',
        'custom_domain',
        'audit_exporter',
        'high_priority_queue',
        'dedicated_agent_mesh'
      ]
    },
    {
      id: 'plan-founder-master',
      code: 'founder',
      name: 'Founder Master (Unrestricted)',
      priceMonthlyAOA: 0,
      priceAnnualAOA: 0,
      description: 'Plano de autoridade suprema do ecossistema sem quaisquer restrições de quota.',
      maxDevices: 9999,
      maxDailySms: 999999,
      maxWebhooks: 999,
      aiTokensPerMonth: 99999999,
      featured: false,
      entitlements: ['*']
    }
  ];

  // In-memory collections for instant UI evaluation & sync
  private static promotions: PromotionCampaign[] = [
    {
      id: 'promo-angola-2026',
      code: 'ANGOLA2026',
      name: 'Campanha Angola Digital 2026',
      type: 'DISCOUNT_PERCENT',
      value: 50,
      description: '50% de Desconto na primeira anuidade do Plano Pro.',
      validUntil: Date.now() + 86400000 * 90,
      maxRedemptions: 500,
      redemptionsCount: 42,
      active: true
    },
    {
      id: 'promo-beta-pioneer',
      code: 'PIONEER-LIFETIME',
      name: 'Pioneiros Beta Tester (+Lifetime)',
      type: 'LIFETIME_UPGRADE',
      value: 100,
      description: 'Upgrade automático para licença vitalícia sem expiração.',
      validUntil: Date.now() + 86400000 * 180,
      maxRedemptions: 100,
      redemptionsCount: 18,
      active: true
    },
    {
      id: 'promo-trial-plus',
      code: 'TRIAL30D',
      name: 'Bónus de Expansão de Trial (+30 Dias)',
      type: 'EXTRA_DAYS',
      value: 30,
      description: 'Adiciona 30 dias de trial ilimitado para novos integradores.',
      validUntil: Date.now() + 86400000 * 60,
      maxRedemptions: 1000,
      redemptionsCount: 154,
      active: true
    }
  ];

  private static bonusLog: BonusAllocation[] = [
    {
      id: 'bonus-001',
      userId: 'usr-248',
      userEmail: 'mario.silva@empresa.ao',
      grantedDays: 15,
      reason: 'Bónus de Onboarding: Pareamento do primeiro agente Android efetuado com sucesso.',
      grantedBy: 'SYSTEM_AUTOMATION',
      timestamp: Date.now() - 86400000 * 2
    }
  ];

  private static extensionLog: ExtensionRecord[] = [
    {
      id: 'ext-001',
      userId: 'usr-501',
      userEmail: 'ana.costa@tech.co.ao',
      type: '+30d',
      addedDays: 30,
      reason: 'Extensão de Cortesia executada na Founder Console.',
      executedBy: 'silajaneiro9@gmail.com',
      timestamp: Date.now() - 86400000 * 5
    }
  ];

  private static entitlementOverrides = new Map<string, EntitlementOverride>();

  /**
   * Evaluates dynamic status and days remaining for any user
   */
  static getSubscription(userId: string, email: string = 'utilizador@portal.ao', displayName: string = 'Utilizador PortalTR'): SubscriptionRecord {
    const safeUserId = userId || (email && email !== 'utilizador@portal.ao' ? email.replace(/[^a-zA-Z0-9]/g, '_') : `usr-${Math.random().toString(36).substring(2, 8)}`);
    const trialLic = TrialEngine.getLicense(safeUserId, email);
    const now = Date.now();

    const isFounder = email.toLowerCase().includes('deusfundador') || email.toLowerCase().includes('silajaneiro9') || trialLic.plan === 'founder';
    const isLifetime = trialLic.lifetime || trialLic.state === 'Lifetime';

    let status: SubscriptionStatus = 'ACTIVE';
    if (isLifetime) {
      status = 'LIFETIME';
    } else if (trialLic.trial && trialLic.expires > now) {
      status = 'TRIAL';
    } else if (trialLic.expires <= now) {
      status = 'EXPIRED';
    }

    const matchedPlan = SubscriptionEngine.PLANS.find((p) => p.code === trialLic.plan) || SubscriptionEngine.PLANS[0];

    const record: SubscriptionRecord = {
      id: `sub-${safeUserId}`,
      userId: safeUserId,
      userEmail: email,
      userName: displayName,
      planId: matchedPlan.id,
      planName: matchedPlan.name,
      status,
      startDate: trialLic.createdAt || now - 86400000 * 7,
      currentPeriodStart: trialLic.trialStartDate || now - 86400000 * 7,
      currentPeriodEnd: trialLic.expires,
      trialStartDate: trialLic.trialStartDate,
      trialEndDate: trialLic.trialEndDate,
      isTrial: trialLic.trial,
      bonusDaysTotal: trialLic.bonusDays || 0,
      promotionsApplied: trialLic.appliedPromotions || [],
      lifetime: isLifetime || isFounder,
      customEntitlements: matchedPlan.entitlements,
      updatedAt: trialLic.updatedAt || now
    };

    return record;
  }

  /**
   * Extends subscription or alters state with full audit trail
   */
  static applyExtension(
    userId: string,
    userEmail: string,
    action: '+3d' | '+15d' | '+30d' | '+90d' | '+365d' | 'lifetime' | 'reset' | 'grace_period',
    reason: string,
    operatorEmail: string
  ): { success: boolean; subscription: SubscriptionRecord; message: string } {
    const actionTrial = action === '+365d' ? '+90d' : action === 'grace_period' ? '+15d' : action;
    const modifiedLic = TrialEngine.modifyLicense(userId, actionTrial as any, reason, operatorEmail);

    const addedDays = action === '+3d' ? 3 : action === '+15d' ? 15 : action === '+30d' ? 30 : action === '+90d' ? 90 : action === '+365d' ? 365 : 0;

    const ext: ExtensionRecord = {
      id: `ext-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      userId,
      userEmail,
      type: action,
      addedDays,
      reason,
      executedBy: operatorEmail,
      timestamp: Date.now()
    };
    SubscriptionEngine.extensionLog.unshift(ext);

    const sub = SubscriptionEngine.getSubscription(userId, userEmail);
    return {
      success: true,
      subscription: sub,
      message: `Subscrição de ${userEmail} atualizada com sucesso: Ação '${action}' aplicada.`
    };
  }

  /**
   * Grants bonus days to a user
   */
  static grantBonusDays(
    userId: string,
    userEmail: string,
    days: number,
    reason: string,
    grantedBy: string
  ): { success: boolean; message: string } {
    TrialEngine.modifyLicense(userId, days >= 30 ? '+30d' : days >= 15 ? '+15d' : '+3d', `Bónus: ${reason}`, grantedBy);

    const bonus: BonusAllocation = {
      id: `bonus-${Date.now()}`,
      userId,
      userEmail,
      grantedDays: days,
      reason,
      grantedBy,
      timestamp: Date.now()
    };
    SubscriptionEngine.bonusLog.unshift(bonus);

    return { success: true, message: `Bónus de +${days} dias concedido a ${userEmail}.` };
  }

  /**
   * Validates and applies a promotion code
   */
  static redeemPromotionCode(
    code: string,
    userId: string,
    userEmail: string
  ): { success: boolean; promotion?: PromotionCampaign; message: string } {
    const cleanCode = code.trim().toUpperCase();
    const promo = SubscriptionEngine.promotions.find((p) => p.code.toUpperCase() === cleanCode && p.active);

    if (!promo) {
      return { success: false, message: 'Código promocional inválido ou expirado.' };
    }

    if (promo.validUntil < Date.now()) {
      return { success: false, message: 'Esta campanha promocional já expirou.' };
    }

    if (promo.redemptionsCount >= promo.maxRedemptions) {
      return { success: false, message: 'O limite máximo de resgates deste código foi atingido.' };
    }

    promo.redemptionsCount += 1;

    if (promo.type === 'LIFETIME_UPGRADE') {
      SubscriptionEngine.applyExtension(userId, userEmail, 'lifetime', `Promo Code: ${promo.name}`, 'PROMO_ENGINE');
    } else if (promo.type === 'EXTRA_DAYS') {
      SubscriptionEngine.grantBonusDays(userId, userEmail, promo.value, `Promo Code: ${promo.name}`, 'PROMO_ENGINE');
    }

    return {
      success: true,
      promotion: promo,
      message: `Código Promocional '${promo.code}' resgatado com sucesso! (${promo.description})`
    };
  }

  /**
   * Entitlement Assessor: Checks if a user has access to a specific capability
   */
  static hasEntitlement(userId: string, email: string, claim: EntitlementClaim): boolean {
    if (email.toLowerCase().includes('deusfundador') || email.toLowerCase().includes('silajaneiro9')) {
      return true; // Founder always entitled
    }

    // Check custom overrides
    const override = SubscriptionEngine.entitlementOverrides.get(userId);
    if (override) {
      if (override.grantedEntitlements.includes(claim) || override.grantedEntitlements.includes('*')) {
        return true;
      }
      if (override.revokedEntitlements.includes(claim)) {
        return false;
      }
    }

    const sub = SubscriptionEngine.getSubscription(userId, email);
    if (sub.status === 'EXPIRED' || sub.status === 'SUSPENDED') {
      return false; // Expired subscriptions lose feature entitlements
    }

    if (sub.customEntitlements.includes('*') || sub.customEntitlements.includes(claim)) {
      return true;
    }

    return false;
  }

  /**
   * Sets custom entitlement override
   */
  static setEntitlementOverride(
    userId: string,
    granted: EntitlementClaim[],
    revoked: EntitlementClaim[],
    operator: string
  ) {
    SubscriptionEngine.entitlementOverrides.set(userId, {
      userId,
      grantedEntitlements: granted,
      revokedEntitlements: revoked,
      updatedAt: Date.now(),
      updatedBy: operator
    });
  }

  /**
   * Getters for UI lists
   */
  static getPromotions(): PromotionCampaign[] {
    return [...SubscriptionEngine.promotions];
  }

  static getBonusLogs(): BonusAllocation[] {
    return [...SubscriptionEngine.bonusLog];
  }

  static getExtensionLogs(): ExtensionRecord[] {
    return [...SubscriptionEngine.extensionLog];
  }
}
