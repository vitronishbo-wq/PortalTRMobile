import { db } from '../firebase/firebase';
import { doc, collection, setDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

export type SecurityAuditEventType =
  | 'Login'
  | 'Logout'
  | 'Novo dispositivo'
  | 'Pedido de emparelhamento'
  | 'Aprovação do emparelhamento'
  | 'Revogação do dispositivo'
  | 'Alteração de permissões'
  | 'Alteração de PIN'
  | 'Alteração do Founder'
  | 'Promoção para Admin'
  | 'Tentativa de acesso não autorizada'
  | 'Alteração das políticas de segurança';

export type SecurityAuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';

export interface SecurityAuditFilter {
  userUid?: string;
  deviceId?: string;
  eventType?: SecurityAuditEventType;
  severity?: SecurityAuditSeverity;
  startDate?: number;
  endDate?: number;
}

export interface SecurityAuditLog {
  id: string;
  uid: string;
  eventType: SecurityAuditEventType;
  severity: SecurityAuditSeverity;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  timestamp: number;
}

export class SecurityAuditService {
  /**
   * Logs a security audit event to `security_logs/{uid}` in Firestore
   */
  static async logEvent(
    uid: string,
    eventType: SecurityAuditEventType,
    details?: string,
    deviceId?: string,
    severity: SecurityAuditSeverity = 'INFO'
  ): Promise<void> {
    const logId = `sec-log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Auto-derive severity if default
    if (severity === 'INFO') {
      if (eventType === 'Tentativa de acesso não autorizada') severity = 'CRITICAL';
      else if (eventType === 'Alteração do Founder' || eventType === 'Revogação do dispositivo') severity = 'EMERGENCY';
      else if (eventType === 'Promoção para Admin' || eventType === 'Alteração das políticas de segurança') severity = 'WARNING';
    }

    const logEntry: SecurityAuditLog = {
      id: logId,
      uid,
      eventType,
      severity,
      details,
      deviceId: deviceId || 'web-pwa-client',
      ipAddress: typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'NodeServer',
      timestamp: Date.now()
    };

    if (db) {
      try {
        const userLogRef = doc(db, 'security_logs', uid, 'events', logId);
        await setDoc(userLogRef, logEntry, { merge: true });
      } catch (err) {
        console.warn('[SecurityAuditService] Firestore audit log failed:', err);
      }
    }
  }

  /**
   * Filters in-memory audit logs by multiple criteria
   */
  static filterLogs(logs: SecurityAuditLog[], filter: SecurityAuditFilter): SecurityAuditLog[] {
    return logs.filter((log) => {
      if (filter.userUid && log.uid !== filter.userUid) return false;
      if (filter.deviceId && log.deviceId !== filter.deviceId) return false;
      if (filter.eventType && log.eventType !== filter.eventType) return false;
      if (filter.severity && log.severity !== filter.severity) return false;
      if (filter.startDate && log.timestamp < filter.startDate) return false;
      if (filter.endDate && log.timestamp > filter.endDate) return false;
      return true;
    });
  }

  /**
   * Listens to real-time security audit logs for a specific user
   */
  static listenToUserLogs(uid: string, callback: (logs: SecurityAuditLog[]) => void) {
    if (!db) {
      callback([]);
      return () => {};
    }
    try {
      const logsRef = collection(db, 'security_logs', uid, 'events');
      return onSnapshot(logsRef, (snapshot) => {
        const logs: SecurityAuditLog[] = snapshot.docs
          .map((d) => d.data() as SecurityAuditLog)
          .sort((a, b) => b.timestamp - a.timestamp);
        callback(logs);
      });
    } catch (err) {
      console.warn('[SecurityAuditService] Error listening to security logs:', err);
      callback([]);
      return () => {};
    }
  }
}
