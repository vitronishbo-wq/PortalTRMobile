// src/lib/platform.ts

export type PlatformType = 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'tv' | 'web';

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

export function getPlatform(): PlatformType {
  if (typeof window === 'undefined') return 'web';

  const ua = navigator.userAgent;

  // TV Detection
  if (/SmartTV|WebOS|Tizen|AppleTV|Android TV|GoogleTV|HbbTV|NetCast/.test(ua)) {
    return 'tv';
  }

  // Mobile iOS / Android
  if (/iPhone|iPad|iPod/.test(ua)) {
    return 'ios';
  }
  if (/Android/.test(ua)) {
    return 'android';
  }

  // Desktop (Tauri or Browser)
  if (isTauri()) {
    if (navigator.platform.toUpperCase().indexOf('MAC') >= 0) return 'macos';
    if (navigator.platform.toUpperCase().indexOf('WIN') >= 0) return 'windows';
    return 'linux';
  }

  return 'web';
}

export function isTVDevice(): boolean {
  return getPlatform() === 'tv' || (typeof window !== 'undefined' && window.innerWidth > 1920 && window.innerHeight > 1080);
}

export async function sendDesktopNotification(title: string, body: string): Promise<boolean> {
  if (isTauri()) {
    try {
      // @ts-ignore - optional dynamic Tauri API resolution
      const tauriNotification = await import('@tauri-apps/api/notification');
      tauriNotification.sendNotification({ title, body });
      return true;
    } catch {
      // Fallback to Web Notification API
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icons/icon-192.png' });
      return true;
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, { body, icon: '/icons/icon-192.png' });
        return true;
      }
    }
  }
  return false;
}
