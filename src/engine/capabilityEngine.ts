import { DeviceCapabilities, DeviceOS, BrowserType } from '../types';

export class CapabilityEngine {
  private static deferredInstallPrompt: any = null;

  static initInstallListener(): void {
    if (typeof window === 'undefined') return;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      CapabilityEngine.deferredInstallPrompt = e;
    });
  }

  static getDeferredPrompt(): any {
    return CapabilityEngine.deferredInstallPrompt;
  }

  static clearDeferredPrompt(): void {
    CapabilityEngine.deferredInstallPrompt = null;
  }

  static detectCapabilities(): DeviceCapabilities {
    if (typeof window === 'undefined') {
      return {
        isStandalone: false,
        hasBeforeInstallPrompt: false,
        hasServiceWorker: false,
        hasPush: false,
        hasNotification: false,
        hasCamera: false,
        hasClipboard: false,
        hasTouch: false,
        isOnline: true,
        os: 'other',
        browser: 'other',
        screenOrientation: 'landscape'
      };
    }

    const ua = navigator.userAgent.toLowerCase();

    // OS Detection
    let os: DeviceOS = 'other';
    if (/iphone|ipad|ipod/.test(ua)) os = 'ios';
    else if (/android/.test(ua)) os = 'android';
    else if (/win/.test(ua)) os = 'windows';
    else if (/mac/.test(ua)) os = 'mac';
    else if (/linux/.test(ua)) os = 'linux';

    // Browser Detection
    let browser: BrowserType = 'other';
    if (/samsungbrowser/.test(ua)) browser = 'samsung';
    else if (/edg/.test(ua)) browser = 'edge';
    else if (/chrome|crios/.test(ua)) browser = 'chrome';
    else if (/safari/.test(ua) && !/chrome|crios/.test(ua)) browser = 'safari';
    else if (/firefox|fxios/.test(ua)) browser = 'firefox';

    // Standalone Detection
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    return {
      isStandalone,
      hasBeforeInstallPrompt: !!CapabilityEngine.deferredInstallPrompt,
      hasServiceWorker: 'serviceWorker' in navigator,
      hasPush: 'PushManager' in window,
      hasNotification: 'Notification' in window,
      hasCamera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      hasClipboard: !!(navigator.clipboard && navigator.clipboard.writeText),
      hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      isOnline: navigator.onLine,
      os,
      browser,
      screenOrientation: window.screen?.orientation?.type || 'portrait'
    };
  }
}
