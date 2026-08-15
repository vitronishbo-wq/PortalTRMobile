// src/engine/executionContextEngine.ts — Motor de Contexto de Execução (COS Execution Context)
// Diretriz 36: Preservação do contexto de sessão (user, role, device, workspace, command, timestamp)

import { UserRole, PermissionEngine } from './permissionEngine';

export interface COSExecutionContext {
  contextId: string;
  user: {
    uid: string;
    email: string;
    name: string;
  };
  role: UserRole;
  device: {
    deviceId: string;
    deviceType: 'DESKTOP' | 'MOBILE' | 'TABLET' | 'NODE_AGENT';
    isTrusted: boolean;
    ipAddress?: string;
  };
  workspace: string; // Ex: 'VIRTUAL_PHONE_MAIN', 'FOUNDER_IDE'
  activeCommand?: string;
  timestamp: number;
  environment: 'PRODUCTION_CLOUD' | 'SANDBOX_CONTAINER';
}

export class ExecutionContextEngine {
  private static currentContext: COSExecutionContext = {
    contextId: `ctx_${Date.now()}`,
    user: {
      uid: 'user_founder_root',
      email: 'founder@portal.ao',
      name: 'Portal Founder Root'
    },
    role: 'FOUNDER',
    device: {
      deviceId: 'device_node_master',
      deviceType: 'DESKTOP',
      isTrusted: true,
      ipAddress: '127.0.0.1'
    },
    workspace: 'VIRTUAL_PHONE_MAIN',
    timestamp: Date.now(),
    environment: 'PRODUCTION_CLOUD'
  };

  private static listeners: Set<(ctx: COSExecutionContext) => void> = new Set();

  public static getContext(): COSExecutionContext {
    const permProfile = PermissionEngine.getProfile();
    return {
      ...this.currentContext,
      role: permProfile.role,
      device: {
        ...this.currentContext.device,
        isTrusted: permProfile.isTrustedDevice
      },
      timestamp: Date.now()
    };
  }

  public static updateContext(partial: Partial<COSExecutionContext>): COSExecutionContext {
    this.currentContext = {
      ...this.currentContext,
      ...partial,
      timestamp: Date.now()
    };
    this.listeners.forEach(fn => {
      try {
        fn(this.currentContext);
      } catch (err) {
        console.error(err);
      }
    });
    return this.currentContext;
  }

  public static setWorkspace(workspaceName: string): void {
    this.updateContext({ workspace: workspaceName });
  }

  public static subscribe(listener: (ctx: COSExecutionContext) => void): () => void {
    this.listeners.add(listener);
    listener(this.getContext());
    return () => this.listeners.delete(listener);
  }
}
