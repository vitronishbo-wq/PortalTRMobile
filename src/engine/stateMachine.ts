import { PortalState, DeviceCapabilities, FeatureFlags } from '../types';

export interface StateMachineContext {
  capabilities: DeviceCapabilities;
  hasPairedDevices: boolean;
  isAuthenticated: boolean;
  isPinUnlocked: boolean;
  flags: FeatureFlags;
}

export class StateMachine {
  static defaultFlags: FeatureFlags = {
    installerEnabled: true,
    pairEnabled: true,
    pinEnabled: true,
    timelineEnabled: true,
    notificationsEnabled: true,
    proxyEnabled: true
  };

  /**
   * Deterministically evaluates the exact PortalState based on complete runtime context
   */
  static evaluateState(context: StateMachineContext): PortalState {
    const { capabilities, hasPairedDevices, isPinUnlocked, flags } = context;

    // 1. Offline Check
    if (!capabilities.isOnline) {
      return 'OFFLINE';
    }

    // 2. PIN Protection Gate
    if (flags.pinEnabled && !isPinUnlocked) {
      return 'PIN_REQUIRED';
    }

    // 3. Desktop without paired devices -> Show QR Pairing Token immediately
    if (
      (capabilities.os === 'windows' ||
        capabilities.os === 'mac' ||
        capabilities.os === 'linux' ||
        capabilities.os === 'other') &&
      !hasPairedDevices &&
      flags.pairEnabled
    ) {
      return 'PAIRING';
    }

    // 4. Mobile device not yet running in Standalone (PWA) mode
    if (
      (capabilities.os === 'android' || capabilities.os === 'ios') &&
      !capabilities.isStandalone &&
      flags.installerEnabled
    ) {
      return 'INSTALL_REQUIRED';
    }

    // 5. Mobile in Standalone mode but no device registered yet -> PAIRING
    if (!hasPairedDevices && flags.pairEnabled) {
      return 'PAIRING';
    }

    // 6. All requirements met -> READY
    return 'READY';
  }
}
