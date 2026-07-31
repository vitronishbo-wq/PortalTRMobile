export interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  actorRole?: string;
  details?: string;
  timestamp: number;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
}

export class AuditEngine {
  private static logs: AuditEntry[] = [];

  static log(action: string, actor: string, status: AuditEntry['status'] = 'SUCCESS', details?: string, actorRole?: string): AuditEntry {
    const entry: AuditEntry = {
      id: `audit_${Math.random().toString(36).substring(2, 9)}`,
      action,
      actor,
      actorRole,
      details,
      timestamp: Date.now(),
      status
    };
    AuditEngine.logs.unshift(entry);
    return entry;
  }

  static getLogs(): AuditEntry[] {
    return [...AuditEngine.logs];
  }

  static clear(): void {
    AuditEngine.logs = [];
  }
}
