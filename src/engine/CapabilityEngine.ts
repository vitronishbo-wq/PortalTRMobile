import { DeviceCapabilities, DeviceOS, BrowserType } from '../types';

export type OEMBrand = 'samsung' | 'xiaomi' | 'pixel' | 'oppo' | 'generic';

export interface OEMDeepLink {
  id: string;
  title: string;
  description: string;
  intentAction: string;
  packageName?: string;
  className?: string;
  mandatory: boolean;
  status: 'granted' | 'pending' | 'deepLinkTriggered';
}

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

  /**
   * Detects browser/OS capabilities (PWA, Standalone, Touch, Camera, ServiceWorker, etc.)
   */
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

  /**
   * Identifies device manufacturer / OEM profile from User Agent or system properties
   */
  static detectOEMBrand(ua: string = typeof navigator !== 'undefined' ? navigator.userAgent : ''): OEMBrand {
    const lower = ua.toLowerCase();
    if (/samsung|sm-/i.test(lower)) return 'samsung';
    if (/xiaomi|miui|redmi|poco|hyperos/i.test(lower)) return 'xiaomi';
    if (/pixel/i.test(lower)) return 'pixel';
    if (/oppo|realme|oneplus|coloros/i.test(lower)) return 'oppo';
    return 'generic';
  }

  /**
   * Returns deep links & native intent mappings for OEM settings based on device brand
   */
  static getOEMDeepLinks(customOem?: OEMBrand): OEMDeepLink[] {
    const oem = customOem || CapabilityEngine.detectOEMBrand();

    const commonLinks: OEMDeepLink[] = [
      {
        id: 'notification_listener',
        title: 'Leitor de Notificações',
        description: 'Redireciona para o painel nativo de acesso a notificações do sistema.',
        intentAction: 'android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS',
        mandatory: true,
        status: 'pending'
      },
      {
        id: 'battery_optimization',
        title: 'Otimização de Bateria Sem Restrições',
        description: 'Solicita desativação do modo de poupança de energia para manter o agente ativo.',
        intentAction: 'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
        mandatory: true,
        status: 'pending'
      },
      {
        id: 'telephony_sms_details',
        title: 'Permissões de Telefonia & SMS',
        description: 'Acesso às definições da aplicação para gerir capturas de chamadas.',
        intentAction: 'android.settings.APPLICATION_DETAILS_SETTINGS',
        mandatory: true,
        status: 'pending'
      }
    ];

    if (oem === 'xiaomi') {
      commonLinks.push({
        id: 'miui_autostart',
        title: 'Início Automático MIUI / HyperOS',
        description: 'Abre o gestor de arranque automático da Xiaomi (Security Center).',
        intentAction: 'com.miui.securitycenter/com.miui.permcenter.autostart.AutoStartManagementActivity',
        packageName: 'com.miui.securitycenter',
        className: 'com.miui.permcenter.autostart.AutoStartManagementActivity',
        mandatory: true,
        status: 'pending'
      });
      commonLinks.push({
        id: 'miui_display_popups',
        title: 'Janelas Pop-up em Segundo Plano',
        description: 'Permite janelas sobrepostas quando a aplicação está em segundo plano.',
        intentAction: 'miui.intent.action.APP_PERM_EDITOR',
        packageName: 'com.miui.securitycenter',
        mandatory: false,
        status: 'pending'
      });
    } else if (oem === 'samsung') {
      commonLinks.push({
        id: 'samsung_device_care',
        title: 'Manutenção do Dispositivo OneUI',
        description: 'Impede o encerramento automático do processo pelo Smart Manager Samsung.',
        intentAction: 'com.samsung.android.sm/com.samsung.android.sm.ui.battery.BatteryActivity',
        packageName: 'com.samsung.android.sm',
        mandatory: true,
        status: 'pending'
      });
    } else if (oem === 'oppo') {
      commonLinks.push({
        id: 'coloros_startup',
        title: 'Gestão de Arranque ColorOS',
        description: 'Permite início automático no ecossistema Oppo/OnePlus/Realme.',
        intentAction: 'com.coloros.safecenter/com.coloros.safecenter.permission.startup.StartupAppListActivity',
        packageName: 'com.coloros.safecenter',
        mandatory: true,
        status: 'pending'
      });
    } else if (oem === 'pixel') {
      commonLinks.push({
        id: 'pixel_unrestricted_battery',
        title: 'Bateria Sem Restrições Android Stock',
        description: 'Configuração direta de segundo plano sem otimizações agressivas.',
        intentAction: 'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS',
        mandatory: false,
        status: 'pending'
      });
    }

    return commonLinks;
  }
}
