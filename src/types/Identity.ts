export interface IdentityGraph {
  msisdn: string;              // Phone number or MSISDN primary key
  workspaceId: string;         // Associated workspace ID
  displayName?: string;
  email?: string;
  createdAt: number;
  updatedAt: number;
  devices: IdentityDevice[];   // Linked devices
  activeSessionId?: string;    // Currently active session ID
}

export interface IdentityDevice {
  deviceId: string;            // UUID generated on first registration
  deviceName: string;          // e.g. "iPhone do Sila", "PC Trabalho"
  platform: 'android' | 'ios' | 'web' | 'windows' | 'macos' | 'linux' | 'tablet' | 'tv';
  publicKey?: string;          // For future E2EE
  lastSeen: number;            // Heartbeat timestamp
  isActive: boolean;           // Online status
  pairedAt: number;
  pushToken?: string;          // Push notification token (FCM/APNs)
}

export interface PairingToken {
  token: string;               // Ephemeral pairing token
  msisdn: string;
  workspaceId: string;
  expiresAt: number;
  used: boolean;
}
