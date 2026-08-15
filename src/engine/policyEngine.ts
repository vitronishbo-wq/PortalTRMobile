// src/engine/policyEngine.ts — Motor de Políticas e Regras Operacionais (COS Policy Engine)
// Diretriz 34: Validação estrita de políticas no Firestore (policies/)

import { UserRole } from './permissionEngine';

export interface CommandPolicy {
  policyId: string;
  command: string;
  role: UserRole;
  trustedDevice: boolean;
  requiresPin: boolean;
  requiresMfa: boolean;
  enabled: boolean;
  expiresAt?: number;
  maxExecutionsPerHour?: number;
  ipWhitelist?: string[];
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  policyId?: string;
  reason?: string;
  requiresPin: boolean;
  requiresMfa: boolean;
  requiresTrustedDevice: boolean;
}

export class PolicyEngine {
  private static readonly POLICIES_STORAGE_KEY = 'portal_cos_policies';

  /**
   * Obtém as políticas operacionais ativas
   */
  public static getPolicies(): CommandPolicy[] {
    try {
      const raw = localStorage.getItem(this.POLICIES_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }

    const defaultPolicies: CommandPolicy[] = [
      {
        policyId: 'pol_root_founder',
        command: '*#FOUNDER#',
        role: 'FOUNDER',
        trustedDevice: true,
        requiresPin: false,
        requiresMfa: false,
        enabled: true
      },
      {
        policyId: 'pol_create_admin',
        command: '*#CREATEADMIN#',
        role: 'FOUNDER',
        trustedDevice: true,
        requiresPin: false,
        requiresMfa: false,
        enabled: true
      },
      {
        policyId: 'pol_security_wipe',
        command: '*#SECURITY#',
        role: 'FOUNDER',
        trustedDevice: true,
        requiresPin: true,
        requiresMfa: false,
        enabled: true
      },
      {
        policyId: 'pol_banking_access',
        command: '*#BANKING#',
        role: 'FOUNDER',
        trustedDevice: true,
        requiresPin: true,
        requiresMfa: false,
        enabled: true
      },
      {
        policyId: 'pol_lock_device',
        command: '*#LOCK#',
        role: 'ADMIN',
        trustedDevice: false,
        requiresPin: false,
        requiresMfa: false,
        enabled: true
      },
      {
        policyId: 'pol_fleet_devices',
        command: '*#DEVICES#',
        role: 'ADMIN',
        trustedDevice: false,
        requiresPin: false,
        requiresMfa: false,
        enabled: true
      },
      {
        policyId: 'pol_telecom_admin',
        command: '*#TELECOM#',
        role: 'ADMIN',
        trustedDevice: false,
        requiresPin: false,
        requiresMfa: false,
        enabled: true
      },
      {
        policyId: 'pol_sync_operator',
        command: '*#SYNC#',
        role: 'OPERATOR',
        trustedDevice: false,
        requiresPin: false,
        requiresMfa: false,
        enabled: true
      },
      {
        policyId: 'pol_pair_operator',
        command: '*#PAIR#',
        role: 'OPERATOR',
        trustedDevice: false,
        requiresPin: false,
        requiresMfa: false,
        enabled: true
      },
      {
        policyId: 'pol_transfer_operator',
        command: '*#TRANSFER#',
        role: 'OPERATOR',
        trustedDevice: false,
        requiresPin: false,
        requiresMfa: false,
        enabled: true
      },
      {
        policyId: 'pol_user_call',
        command: '*#CALL#',
        role: 'USER',
        trustedDevice: false,
        requiresPin: false,
        requiresMfa: false,
        enabled: true
      },
      {
        policyId: 'pol_user_sms',
        command: '*#SMS#',
        role: 'USER',
        trustedDevice: false,
        requiresPin: false,
        requiresMfa: false,
        enabled: true
      }
    ];

    try {
      localStorage.setItem(this.POLICIES_STORAGE_KEY, JSON.stringify(defaultPolicies));
    } catch (e) {
      console.error(e);
    }

    return defaultPolicies;
  }

  /**
   * Avalia se um comando atende às regras de política
   */
  public static evaluate(
    commandStr: string,
    userRole: UserRole,
    isTrustedDevice: boolean
  ): PolicyEvaluationResult {
    const policies = this.getPolicies();
    const cleanCmd = commandStr.toUpperCase();

    // Busca política exata ou correspondente por prefixo
    const matched = policies.find(p => 
      p.enabled && (
        p.command === cleanCmd || 
        cleanCmd.startsWith(p.command.replace(/#$/, ''))
      )
    );

    if (!matched) {
      // Política default permissiva para usuários normais se for comando de usuário
      return {
        allowed: true,
        requiresPin: false,
        requiresMfa: false,
        requiresTrustedDevice: false
      };
    }

    // Validação de Expiração
    if (matched.expiresAt && Date.now() > matched.expiresAt) {
      return {
        allowed: false,
        policyId: matched.policyId,
        reason: 'Política de comando expirada',
        requiresPin: matched.requiresPin,
        requiresMfa: matched.requiresMfa,
        requiresTrustedDevice: matched.trustedDevice
      };
    }

    // Validação de Dispositivo Confiável
    if (matched.trustedDevice && !isTrustedDevice && userRole !== 'FOUNDER') {
      return {
        allowed: false,
        policyId: matched.policyId,
        reason: 'Comando exige nó ou dispositivo confiável verificado',
        requiresPin: matched.requiresPin,
        requiresMfa: matched.requiresMfa,
        requiresTrustedDevice: true
      };
    }

    return {
      allowed: true,
      policyId: matched.policyId,
      requiresPin: matched.requiresPin,
      requiresMfa: matched.requiresMfa,
      requiresTrustedDevice: matched.trustedDevice
    };
  }

  /**
   * Salva ou atualiza uma política
   */
  public static savePolicy(policy: CommandPolicy): void {
    const list = this.getPolicies();
    const idx = list.findIndex(p => p.policyId === policy.policyId || p.command === policy.command);
    if (idx >= 0) {
      list[idx] = policy;
    } else {
      list.push(policy);
    }
    localStorage.setItem(this.POLICIES_STORAGE_KEY, JSON.stringify(list));
  }
}
