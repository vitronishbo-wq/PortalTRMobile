export interface SyncState {
  isOnline: boolean;
  lastSyncTime: number;
  pendingItemsCount: number;
  status: 'IDLE' | 'SYNCING' | 'ERROR' | 'SUCCESS';
}

export class SyncEngine {
  private static state: SyncState = {
    isOnline: true,
    lastSyncTime: Date.now(),
    pendingItemsCount: 0,
    status: 'IDLE'
  };

  static getStatus(): SyncState {
    return { ...SyncEngine.state };
  }

  static async triggerSync(): Promise<SyncState> {
    SyncEngine.state.status = 'SYNCING';
    
    // Simulate sync execution
    await new Promise(resolve => setTimeout(resolve, 300));
    
    SyncEngine.state.lastSyncTime = Date.now();
    SyncEngine.state.pendingItemsCount = 0;
    SyncEngine.state.status = 'SUCCESS';
    return { ...SyncEngine.state };
  }

  static setOnline(online: boolean): void {
    SyncEngine.state.isOnline = online;
  }
}
