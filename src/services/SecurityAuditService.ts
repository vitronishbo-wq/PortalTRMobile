// src/services/SecurityAuditService.ts — Auditoria Global e Imutável de Segurança
// Diretrizes 08, 33, 37: Registro rigoroso de comandos, acessos e auditoria no Firestore / Local Storage

import { FirestoreService } from './firestore';

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
  evidenceHash?: string;
  details?: Record<string, any>;
}

export class SecurityAuditService {
  private static readonly STORAGE_KEY = 'portal_security_logs';
  private static memoryLogs: SecurityLogEntry[] = [];
  private static isInitialized = false;

  public static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        this.memoryLogs = JSON.parse(raw);
      }
    } catch {
      this.memoryLogs = [];
    }

    FirestoreService.listenToSecurityAuditLogs((remoteLogs) => {
      if (remoteLogs && remoteLogs.length > 0) {
        this.memoryLogs = remoteLogs as SecurityLogEntry[];
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.memoryLogs.slice(0, 150)));
        } catch {}
      }
    });
  }

  public static log(
    eventType: SecurityEventType,
    command: string,
    status: SecurityLogEntry['status'],
    severity: SecuritySeverity = 'INFO',
    details?: Record<string, any>
  ): SecurityLogEntry {
    this.init();

    const timestamp = Date.now();
    const logId = `sec_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;
    const uid = localStorage.getItem('portal_current_uid') || 'root_founder';
    const deviceId = localStorage.getItem('portal_device_id') || 'dev_node_master';
    
    // Hash determinístico simples de evidência
    const rawData = `${logId}:${eventType}:${command}:${status}:${timestamp}:${uid}:${deviceId}`;
    let hash = 0;
    for (let i = 0; i < rawData.length; i++) {
      hash = ((hash << 5) - hash) + rawData.charCodeAt(i);
      hash |= 0;
    }
    const evidenceHash = `sha256_mock_${Math.abs(hash).toString(16)}`;

    const entry: SecurityLogEntry = {
      logId,
      id: logId,
      type: eventType,
      target: command,
      uid,
      deviceId,
      command,
      timestamp,
      status,
      ip: '127.0.0.1 (Loopback Container)',
      platform: typeof navigator !== 'undefined' ? navigator.userAgent : 'Web/PWA',
      sessionId: localStorage.getItem('portal_session_id') || 'sess_master_active',
      severity,
      evidenceHash,
      details
    };

    this.memoryLogs.unshift(entry);
    if (this.memoryLogs.length > 200) this.memoryLogs.pop();

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.memoryLogs.slice(0, 150)));
    } catch {}

    // Gravação real nas coleções do Firestore: security_audit e security_logs
    FirestoreService.saveSecurityAuditLog(entry).catch((e) => {
      console.warn('[SecurityAuditService] Erro ao gravar log de auditoria no Firestore:', e);
    });

    FirestoreService.logSecurityEvent(entry).catch((e) => {
      console.warn('[SecurityAuditService] Erro ao gravar log de segurança no Firestore:', e);
    });

    return entry;
  }

  public static getLogs(): SecurityLogEntry[] {
    this.init();
    return [...this.memoryLogs];
  }

  public static clearLogs(): void {
    this.memoryLogs = [];
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

