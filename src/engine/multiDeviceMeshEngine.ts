import { FirestoreService } from '../services/firestore';
import { IdentityEngine } from './identityEngine';

export type PlatformType =
  | 'android_phone'
  | 'iphone'
  | 'windows_pc'
  | 'mac_os'
  | 'linux_pc'
  | 'android_tablet'
  | 'ipad'
  | 'web_browser'
  | 'smart_tv';

export interface DeviceNode {
  nodeId: string;
  deviceName: string;
  platform: PlatformType;
  primaryPhoneNumber: string; // e.g. "+244923456789"
  isPrimaryMaster: boolean; // True if this is the primary SIM/Phone
  lastActive: number;
  ipAddress?: string;
  activeTab?: string;
  draftState?: string;
  capabilities: {
    sms: boolean;
    notifications: boolean;
    biometrics: boolean;
    webAuthn: boolean;
    push: boolean;
    smartTvDisplay?: boolean;
  };
  status: 'ONLINE' | 'STANDBY' | 'OFFLINE';
}

export interface MultiDeviceUnifiedSession {
  sessionId: string;
  primaryPhoneNumber: string;
  activeWorkspaceId: string;
  currentFocusedNodeId: string;
  activeTab: string;
  sharedClipboard?: string;
  nodes: Record<string, DeviceNode>;
  updatedAt: number;
}

export class MultiDeviceMeshEngine {
  private static localNodeId: string = this.getOrCreateLocalNodeId();
  private static activeSession: MultiDeviceUnifiedSession | null = null;
  private static listeners: Set<(session: MultiDeviceUnifiedSession | null) => void> = new Set();

  private static getOrCreateLocalNodeId(): string {
    let stored = typeof window !== 'undefined' ? localStorage.getItem('ptrm_node_id') : null;
    if (!stored) {
      stored = `node-${Math.random().toString(36).substring(2, 9)}-${Date.now().toString(36)}`;
      if (typeof window !== 'undefined') {
        localStorage.setItem('ptrm_node_id', stored);
      }
    }
    return stored;
  }

  /**
   * Detects current platform environment automatically
   */
  public static detectCurrentPlatform(): PlatformType {
    if (typeof window === 'undefined') return 'web_browser';
    const ua = navigator.userAgent.toLowerCase();

    if (/smart-tv|smarttv|googletv|appletv|hbbtv|netcast/i.test(ua)) return 'smart_tv';
    if (/ipad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ipad';
    if (/iphone|ipod/i.test(ua)) return 'iphone';
    if (/android/i.test(ua) && !/mobile/i.test(ua)) return 'android_tablet';
    if (/android/i.test(ua)) return 'android_phone';
    if (/macintosh|mac os x/i.test(ua)) return 'mac_os';
    if (/windows/i.test(ua)) return 'windows_pc';
    if (/linux/i.test(ua)) return 'linux_pc';

    return 'web_browser';
  }

  /**
   * Registers or updates current device in the Unified Multi-Device Mesh
   */
  public static async registerNodeInMesh(params: {
    primaryPhoneNumber: string;
    deviceName?: string;
    isPrimaryMaster?: boolean;
  }): Promise<MultiDeviceUnifiedSession> {
    const platform = this.detectCurrentPlatform();
    const nodeId = this.localNodeId;

    const capabilities = {
      sms: platform === 'android_phone',
      notifications: typeof window !== 'undefined' && 'Notification' in window,
      biometrics: typeof window !== 'undefined' && 'PublicKeyCredential' in window,
      webAuthn: typeof window !== 'undefined' && 'PublicKeyCredential' in window,
      push: typeof window !== 'undefined' && 'serviceWorker' in navigator,
      smartTvDisplay: platform === 'smart_tv'
    };

    const currentNode: DeviceNode = {
      nodeId,
      deviceName: params.deviceName || `${platform.replace('_', ' ').toUpperCase()} Node`,
      platform,
      primaryPhoneNumber: params.primaryPhoneNumber,
      isPrimaryMaster: params.isPrimaryMaster ?? (platform === 'android_phone'),
      lastActive: Date.now(),
      capabilities,
      status: 'ONLINE',
      activeTab: typeof window !== 'undefined' ? window.location.pathname : '/'
    };

    // Load or initialize mesh session
    let existingMesh = this.activeSession;
    if (!existingMesh) {
      existingMesh = {
        sessionId: `mesh-${params.primaryPhoneNumber.replace(/\+/g, '')}`,
        primaryPhoneNumber: params.primaryPhoneNumber,
        activeWorkspaceId: 'default-workspace',
        currentFocusedNodeId: nodeId,
        activeTab: currentNode.activeTab || 'overview',
        nodes: {},
        updatedAt: Date.now()
      };
    }

    existingMesh.nodes[nodeId] = currentNode;
    existingMesh.currentFocusedNodeId = nodeId;
    existingMesh.updatedAt = Date.now();

    this.activeSession = existingMesh;
    this.notifyListeners();

    // Persist in backend/Firestore if available
    try {
      if (IdentityEngine.getCurrentUser()?.uid) {
        await FirestoreService.saveDevice({
          deviceId: nodeId,
          nodeId: nodeId,
          userId: IdentityEngine.getCurrentUser()!.uid,
          workspaceId: 'ws-mesh-default',
          name: currentNode.deviceName,
          model: currentNode.platform,
          osVersion: currentNode.platform,
          lastSync: Date.now(),
          online: true,
          batteryLevel: 100,
          pairedAt: Date.now(),
          capabilities: currentNode.capabilities as any
        });
      }
    } catch (err) {
      console.warn('[MultiDeviceMesh] Erro ao sincronizar nó no Firestore:', err);
    }

    return existingMesh;
  }

  /**
   * Handover session focus to another node seamlessly
   */
  public static async handoverSessionToNode(targetNodeId: string, targetTab?: string) {
    if (!this.activeSession) return;

    if (this.activeSession.nodes[targetNodeId]) {
      this.activeSession.currentFocusedNodeId = targetNodeId;
      if (targetTab) {
        this.activeSession.activeTab = targetTab;
      }
      this.activeSession.updatedAt = Date.now();
      this.notifyListeners();

      // Trigger SSE event to remote node
      try {
        await fetch('/api/v1/commands/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId: 'ws-mesh-sync',
            commandType: 'HANDOVER_SESSION_TO_NODE',
            targetNodeId,
            payload: {
              activeTab: this.activeSession.activeTab,
              timestamp: Date.now()
            }
          })
        });
      } catch (e) {
        console.warn('[MultiDeviceMesh] Handover SSE trigger notice:', e);
      }
    }
  }

  /**
   * Sync shared clipboard across connected devices
   */
  public static syncSharedClipboard(text: string) {
    if (!this.activeSession) return;
    this.activeSession.sharedClipboard = text;
    this.activeSession.updatedAt = Date.now();
    this.notifyListeners();
  }

  public static getActiveSession(): MultiDeviceUnifiedSession | null {
    return this.activeSession;
  }

  public static getLocalNodeId(): string {
    return this.localNodeId;
  }

  public static subscribeSession(cb: (session: MultiDeviceUnifiedSession | null) => void): () => void {
    this.listeners.add(cb);
    cb(this.activeSession);
    return () => this.listeners.delete(cb);
  }

  private static notifyListeners() {
    this.listeners.forEach((cb) => cb(this.activeSession));
  }
}
