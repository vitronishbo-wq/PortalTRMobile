export type WorkspaceType = 'ROOT_CONSOLE' | 'FOUNDER_IDE' | 'PUBLIC_WORKSPACE' | 'ADMIN_PORTAL';

export interface WorkspaceConfig {
  id: string;
  name: string;
  type: WorkspaceType;
  requiredAuthority: 'ROOT' | 'ADMIN' | 'OPERATOR' | 'USER';
}

export class WorkspaceEngine {
  private static activeWorkspace: WorkspaceType = 'PUBLIC_WORKSPACE';

  private static workspaces: WorkspaceConfig[] = [
    { id: 'ws-root', name: 'Root Console', type: 'ROOT_CONSOLE', requiredAuthority: 'ROOT' },
    { id: 'ws-ide', name: 'Founder IDE', type: 'FOUNDER_IDE', requiredAuthority: 'ROOT' },
    { id: 'ws-public', name: 'Public Workspace', type: 'PUBLIC_WORKSPACE', requiredAuthority: 'USER' },
    { id: 'ws-admin', name: 'Admin Portal', type: 'ADMIN_PORTAL', requiredAuthority: 'ADMIN' },
  ];

  static getActiveWorkspace(): WorkspaceType {
    return WorkspaceEngine.activeWorkspace;
  }

  static setActiveWorkspace(type: WorkspaceType): void {
    WorkspaceEngine.activeWorkspace = type;
  }

  static getAvailableWorkspaces(): WorkspaceConfig[] {
    return [...WorkspaceEngine.workspaces];
  }
}
