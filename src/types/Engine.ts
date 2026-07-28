export type DeviceOS = 'android' | 'ios' | 'windows' | 'mac' | 'linux' | 'other';
export type BrowserType = 'chrome' | 'safari' | 'firefox' | 'edge' | 'samsung' | 'other';

export type PortalState =
  | 'UNKNOWN'
  | 'DETECTING'
  | 'INSTALL_REQUIRED'
  | 'PAIRING'
  | 'AUTHENTICATING'
  | 'PIN_REQUIRED'
  | 'LOADING'
  | 'READY'
  | 'LOCKED'
  | 'OFFLINE';

export interface DeviceCapabilities {
  isStandalone: boolean;
  hasBeforeInstallPrompt: boolean;
  hasServiceWorker: boolean;
  hasPush: boolean;
  hasNotification: boolean;
  hasCamera: boolean;
  hasClipboard: boolean;
  hasTouch: boolean;
  isOnline: boolean;
  os: DeviceOS;
  browser: BrowserType;
  screenOrientation: string;
}

export interface PairingSession {
  pairingToken: string;
  createdAt: number;
  status: 'pending' | 'paired' | 'expired';
  pairedDeviceId?: string;
  pairedDeviceName?: string;
}

export interface FeatureFlags {
  installerEnabled: boolean;
  pairEnabled: boolean;
  pinEnabled: boolean;
  timelineEnabled: boolean;
  notificationsEnabled: boolean;
  proxyEnabled: boolean;
}
