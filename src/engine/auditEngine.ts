export type AuditCategory =
  | 'admin_actions'
  | 'alteracoes'
  | 'autenticacoes'
  | 'elevacoes_privilegio'
  | 'deploys'
  | 'pagamentos'
  | 'eventos_criticos';

export interface AuditEntry {
  id: string;
  category: AuditCategory;
  action: string;
  actor: string;
  actorRole?: string;
  target?: string;
  details?: string;
  timestamp: number;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'ELEVATED';
  ip?: string;
  deviceId?: string;
  beforeState?: string;
  afterState?: string;
  hash?: string;
}

export class AuditEngine {
  private static logs: AuditEntry[] = [];
  private static listeners: ((logs: AuditEntry[]) => void)[] = [];

  static generateHash(id: string, timestamp: number, actor: string, action: string): string {
    const raw = `${id}:${timestamp}:${actor}:${action}:PORTAL_TR_MOBILE_AUDIT_SALT`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `0x${Math.abs(hash).toString(16).padStart(8, '0')}${timestamp.toString(16)}`;
  }

  static log(
    action: string,
    actor: string,
    status: AuditEntry['status'] = 'SUCCESS',
    details?: string,
    actorRole?: string,
    category: AuditCategory = 'admin_actions',
    target?: string,
    ip: string = '197.218.42.10',
    deviceId: string = 'dev_android_01',
    beforeState?: string,
    afterState?: string
  ): AuditEntry {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = Date.now();
    const entry: AuditEntry = {
      id,
      category,
      action,
      actor,
      actorRole: actorRole || 'Founder',
      target: target || 'SYSTEM_CORE',
      details,
      timestamp,
      status,
      ip,
      deviceId,
      beforeState,
      afterState,
      hash: AuditEngine.generateHash(id, timestamp, actor, action)
    };
    AuditEngine.logs.unshift(entry);
    AuditEngine.notifyListeners();
    return entry;
  }

  static getLogs(): AuditEntry[] {
    if (AuditEngine.logs.length === 0) {
      AuditEngine.seedDefaultLogs();
    }
    return [...AuditEngine.logs];
  }

  static subscribe(listener: (logs: AuditEntry[]) => void): () => void {
    if (AuditEngine.logs.length === 0) {
      AuditEngine.seedDefaultLogs();
    }
    AuditEngine.listeners.push(listener);
    listener([...AuditEngine.logs]);
    return () => {
      AuditEngine.listeners = AuditEngine.listeners.filter((l) => l !== listener);
    };
  }

  private static notifyListeners(): void {
    const current = [...AuditEngine.logs];
    AuditEngine.listeners.forEach((l) => l(current));
  }

  static clear(): void {
    AuditEngine.logs = [];
    AuditEngine.notifyListeners();
  }

  public static seedDefaultLogs(): void {
    const now = Date.now();
    const min = 60 * 1000;
    const hour = 60 * min;

    const initial: Omit<AuditEntry, 'id' | 'hash'>[] = [
      {
        category: 'elevacoes_privilegio',
        action: 'ELEVATION_GRANT_FOUNDER_CLAIM',
        actor: 'silajaneiro9@gmail.com',
        actorRole: 'Founder',
        target: 'UID_9901_SILAJANEIRO',
        details: 'Elevação de privilégio de segurança com concessão de claim Root (*)',
        timestamp: now - 5 * min,
        status: 'ELEVATED',
        ip: '197.218.42.10',
        deviceId: 'macbook_founder_01',
        beforeState: '{"role": "System Admin", "claims": ["canDeploy"]}',
        afterState: '{"role": "Founder", "claims": ["*"]}'
      },
      {
        category: 'deploys',
        action: 'DEPLOY_FIRESTORE_RULES',
        actor: 'silajaneiro9@gmail.com',
        actorRole: 'Founder',
        target: 'firestore.rules (eur3)',
        details: 'Implantação de regras de segurança com bloqueio estrito de escritas não autorizadas',
        timestamp: now - 18 * min,
        status: 'SUCCESS',
        ip: '197.218.42.10',
        deviceId: 'cloud_build_agent_02',
        beforeState: '{"version": "v2.1", "rules_checksum": "a7b8c9"}',
        afterState: '{"version": "v2.2", "rules_checksum": "d4e5f6"}'
      },
      {
        category: 'pagamentos',
        action: 'APPYPAY_SUBSCRIPTION_RENEWAL',
        actor: 'SISTEMA_APPYPAY_GATEWAY',
        actorRole: 'Payment Engine',
        target: 'SUB_8829_ENTERPRISE',
        details: 'Renovação automática de licença de 15,000 AOA via Multicaixa Express (ID Ref: MCX-99482)',
        timestamp: now - 42 * min,
        status: 'SUCCESS',
        ip: '102.214.12.8',
        deviceId: 'gateway_appy_prod_01',
        beforeState: '{"status": "TRIAL", "mrr_aoa": 0}',
        afterState: '{"status": "ACTIVE_PAID", "mrr_aoa": 15000}'
      },
      {
        category: 'eventos_criticos',
        action: 'DLQ_WEBHOOK_FAILURE',
        actor: 'WEBHOOK_RETRY_ENGINE',
        actorRole: 'System Agent',
        target: 'ENDPOINT_PARTNER_API_03',
        details: 'Falha HTTP 504 Gateway Timeout ao tentar entregar evento SMS para webhook do parceiro',
        timestamp: now - 1 * hour - 12 * min,
        status: 'FAILURE',
        ip: '10.0.4.12',
        deviceId: 'cloud_run_worker_01',
        beforeState: '{"retryCount": 2, "state": "PENDING"}',
        afterState: '{"retryCount": 3, "state": "MOVED_TO_DLQ"}'
      },
      {
        category: 'admin_actions',
        action: 'USER_ROLE_PROMOTION',
        actor: 'silajaneiro9@gmail.com',
        actorRole: 'Founder',
        target: 'user_admin_luanda_02@portal.ao',
        details: 'Alteração de perfil do utilizador para Finance Admin com permissões de faturamento',
        timestamp: now - 2 * hour,
        status: 'SUCCESS',
        ip: '197.218.42.10',
        deviceId: 'macbook_founder_01',
        beforeState: '{"role": "Support Admin"}',
        afterState: '{"role": "Finance Admin"}'
      },
      {
        category: 'alteracoes',
        action: 'FEATURE_FLAG_UPDATE',
        actor: 'silajaneiro9@gmail.com',
        actorRole: 'Founder',
        target: 'audit.extendedLogging.enabled',
        details: 'Alteração de parâmetro global de auditoria para gravação estendida em lote',
        timestamp: now - 3 * hour - 15 * min,
        status: 'SUCCESS',
        ip: '197.218.42.10',
        deviceId: 'macbook_founder_01',
        beforeState: '{"audit.extendedLogging.enabled": false}',
        afterState: '{"audit.extendedLogging.enabled": true}'
      },
      {
        category: 'autenticacoes',
        action: 'MFA_VERIFICATION_SUCCESS',
        actor: 'silajaneiro9@gmail.com',
        actorRole: 'Founder',
        target: 'FOUNDER_CONSOLE_SESSION',
        details: 'Verificação MFA TOTP e impressão digital do dispositivo validadas com sucesso',
        timestamp: now - 4 * hour,
        status: 'SUCCESS',
        ip: '197.218.42.10',
        deviceId: 'android_agent_01',
        beforeState: '{"mfaState": "REQUIRED"}',
        afterState: '{"mfaState": "VERIFIED"}'
      },
      {
        category: 'deploys',
        action: 'CLOUD_RUN_CONTAINER_DEPLOY',
        actor: 'GITHUB_ACTIONS_BOT',
        actorRole: 'CI/CD Pipeline',
        target: 'portal-tr-mobile-applet (rev 00042)',
        details: 'Deploy automático de novo container no Cloud Run com suporte a SSE Direct Stream',
        timestamp: now - 6 * hour,
        status: 'SUCCESS',
        ip: '140.82.112.4',
        deviceId: 'github_runner_linux_x64',
        beforeState: '{"image": "gcr.io/portal-tr/app:v1.4.1"}',
        afterState: '{"image": "gcr.io/portal-tr/app:v1.4.2"}'
      }
    ];

    AuditEngine.logs = initial.map((item) => {
      const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      return {
        ...item,
        id,
        hash: AuditEngine.generateHash(id, item.timestamp, item.actor, item.action)
      };
    });
  }
}

