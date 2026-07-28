export interface AutomationRule {
  id: string;
  name: string;
  triggerEvent: string; // e.g. 'device.offline', 'trial.expired', 'payment.approved', 'permission.lost'
  condition: string; // e.g. 'duration > 300s', 'licenseState === Trial'
  action: string; // e.g. 'notify.founder', 'license.activate', 'device.repair'
  active: boolean;
  triggerCount: number;
  lastTriggered?: number;
}

export interface AutomationExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  triggeredAt: number;
  inputPayload: any;
  result: 'SUCCESS' | 'FAILED';
  actionOutput: string;
}

export class AutomationEngine {
  private static rules: AutomationRule[] = [
    {
      id: 'rule-device-offline',
      name: 'Notificar Founder quando Dispositivo Ficar Offline > 5 min',
      triggerEvent: 'device.offline',
      condition: 'offlineDurationMs >= 300000',
      action: 'notify.founder',
      active: true,
      triggerCount: 14,
      lastTriggered: Date.now() - 3600000 * 2
    },
    {
      id: 'rule-trial-expired',
      name: 'Lembrete de Expiração e Oferta Promocional',
      triggerEvent: 'trial.expired',
      condition: 'licenseState === Expired',
      action: 'send.notification',
      active: true,
      triggerCount: 42,
      lastTriggered: Date.now() - 3600000 * 12
    },
    {
      id: 'rule-payment-approved',
      name: 'Ativar Licença Premium Automaticamente',
      triggerEvent: 'payment.approved',
      condition: 'chargeStatus === SUCCESS',
      action: 'license.activate',
      active: true,
      triggerCount: 8,
      lastTriggered: Date.now() - 86400000
    },
    {
      id: 'rule-permission-lost',
      name: 'Iniciar Workflow de Reparação Auto-Healing no Agente',
      triggerEvent: 'permission.lost',
      condition: 'notificationListener === false',
      action: 'device.repair',
      active: true,
      triggerCount: 3,
      lastTriggered: Date.now() - 86400000 * 3
    }
  ];

  private static executionLogs: AutomationExecutionLog[] = [
    {
      id: 'exec-101',
      ruleId: 'rule-payment-approved',
      ruleName: 'Ativar Licença Premium Automaticamente',
      triggeredAt: Date.now() - 86400000,
      inputPayload: { chargeId: 'chg_appypay_091', amount: 5000 },
      result: 'SUCCESS',
      actionOutput: 'Licença estendida +30 dias para mario.silva@empresa.ao'
    },
    {
      id: 'exec-102',
      ruleId: 'rule-permission-lost',
      ruleName: 'Iniciar Workflow de Reparação Auto-Healing no Agente',
      triggeredAt: Date.now() - 86400000 * 3,
      inputPayload: { deviceId: 'agent-samsung-s22', missingPermission: 'BIND_NOTIFICATION_LISTENER_SERVICE' },
      result: 'SUCCESS',
      actionOutput: 'Notificação de intent Accessibility re-enviada para o agente Android'
    }
  ];

  static getRules(): AutomationRule[] {
    return [...AutomationEngine.rules];
  }

  static toggleRule(ruleId: string, active: boolean): AutomationRule | undefined {
    const rule = AutomationEngine.rules.find((r) => r.id === ruleId);
    if (rule) {
      rule.active = active;
    }
    return rule;
  }

  static triggerRule(ruleId: string, payload?: any): AutomationExecutionLog {
    const rule = AutomationEngine.rules.find((r) => r.id === ruleId) || AutomationEngine.rules[0];
    rule.triggerCount += 1;
    rule.lastTriggered = Date.now();

    const log: AutomationExecutionLog = {
      id: `exec-${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      triggeredAt: Date.now(),
      inputPayload: payload || { origin: 'manual_trigger' },
      result: 'SUCCESS',
      actionOutput: `Ação '${rule.action}' executada com sucesso pelo Automation Engine.`
    };

    AutomationEngine.executionLogs.unshift(log);
    if (AutomationEngine.executionLogs.length > 50) AutomationEngine.executionLogs.pop();

    return log;
  }

  static getExecutionLogs(): AutomationExecutionLog[] {
    return [...AutomationEngine.executionLogs];
  }
}
