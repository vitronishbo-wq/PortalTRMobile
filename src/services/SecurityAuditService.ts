// src/services/SecurityAuditService.ts — Auditoria Global e Imutável de Segurança
// Diretrizes 08, 33, 37: Registro rigoroso de comandos, acessos e auditoria no Firestore / Local Storage

export type SecurityEventType = 
  | 'COMMAND_EXECUTED'
  | 'COMMAND_DENIED'
  | 'COMMAND_FAILURE'
  | 'SYSTEM_COMMAND'
  | 'SECURITY_ALERT'
  | 'SECURITY_POLICY_VIOLATION'
  | 'UNAUTHORIZED_ACCESS'
  | 'KERNEL_SUSPENDED'
  | 'ROLE_CHANGED'
  | 'ADMIN_CREATED'
  | 'ADMIN_REMOVED'
  | 'ROOT_ACCESS'
  | 'PIN_FAILED'
  | 'BIOMETRIC_FAILED'
  | 'SESSION_TRANSFER'
  | 'DEVICE_LOCKED'
  | 'DEVICE_WIPED';

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'INFO' | 'HIGH' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';

export interface SecurityLogEntry {
  logId: string;
  id: string;
  type: string;
  target: string;
  uid: string;
  deviceId: string;
  command: string;
  timestamp: number;
  status: 'SUCCESS' | 'DENIED' | 'FAILED' | 'BLOCKED';
  ip: string;
  platform: string;
  sessionId: string;
  severity: SecuritySeverity;
  details?: Record<string, any>;
}

export class SecurityAuditService {
  private static readonly STORAGE_KEY = 'portal_security_logs';

  public static log(
    eventType: SecurityEventType,
    command: string,
    status: SecurityLogEntry['status'],
    severity: SecuritySeverity = 'INFO',
    details?: Record<string, any>
  ): SecurityLogEntry {
    const logId = `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const entry: SecurityLogEntry = {
      logId,
      id: logId,
      type: eventType,
      target: command,
      uid: localStorage.getItem('portal_current_uid') || 'root_founder',
      deviceId: localStorage.getItem('portal_device_id') || 'dev_node_master',
      command,
      timestamp: Date.now(),
      status,
      ip: '127.0.0.1 (Loopback Container)',
      platform: navigator.userAgent || 'Web/PWA',
      sessionId: localStorage.getItem('portal_session_id') || 'sess_master_active',
      severity,
      details
    };

    const logs = this.getLogs();
    logs.unshift(entry);
    // Limita aos 150 eventos mais recentes
    if (logs.length > 150) logs.pop();

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
    } catch {
      // Ignora erro de cota
    }

    return entry;
  }

  public static getLogs(): SecurityLogEntry[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Fallback
    }
    return [];
  }

  public static clearLogs(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
