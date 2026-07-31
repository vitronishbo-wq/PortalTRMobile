import { PortalEvent } from '../types';
import { getFirebaseInstance } from './firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

export interface SwRegistrationStatus {
  supported: boolean;
  registered: boolean;
  permission: NotificationPermission;
  active: boolean;
  scope?: string;
  error?: string;
}

export interface WebPushSubscriptionStatus {
  subscribed: boolean;
  endpoint?: string;
  vapidKey?: string;
  subscription?: PushSubscriptionJSON;
  error?: string;
}

let swRegistration: ServiceWorkerRegistration | null = null;

// Default VAPID Public Key for Portal TR Mobile
export const DEFAULT_VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-m9GY281m2m1m2m1_portal_tr_mobile_vapid_key';

/**
 * Utility to convert URL-safe Base64 string to Uint8Array for PushManager
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Gets or sets stored VAPID Public Key in localStorage
 */
export function getStoredVapidKey(): string {
  if (typeof window === 'undefined') return DEFAULT_VAPID_PUBLIC_KEY;
  return localStorage.getItem('portal_vapid_public_key') || DEFAULT_VAPID_PUBLIC_KEY;
}

export function saveStoredVapidKey(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('portal_vapid_public_key', key.trim());
  }
}

/**
 * Registers VAPID keys into Firestore ('vapid_keys' collection and 'config/push_auth')
 * to ensure Web Push service is authenticated for sending push notifications.
 * Verifies Notification.requestPermission() to guarantee user permission before registering keys.
 */
export async function registerVapidKeys(publicKey?: string, privateKey?: string): Promise<{ success: boolean; id?: string; error?: string }> {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission !== 'granted') {
      const perm = await requestNotificationPermission();
      if (perm !== 'granted') {
        return {
          success: false,
          error: 'Permissão de notificação negada pelo utilizador. VAPID keys não registradas.'
        };
      }
    }
  }

  const vapidPublicKey = publicKey || getStoredVapidKey();
  if (publicKey) saveStoredVapidKey(publicKey);

  try {
    const { db } = getFirebaseInstance();
    if (!db) {
      throw new Error('Firestore não está inicializado');
    }

    const keyData = {
      publicKey: vapidPublicKey,
      privateKey: privateKey || null,
      updatedAt: Date.now(),
      status: 'active',
      app: 'Portal TR Mobile',
      environment: 'production'
    };

    // Store in 'vapid_keys' collection under document 'default'
    await setDoc(doc(collection(db, 'vapid_keys'), 'default'), keyData);

    // Also store in 'config/push_auth' for Cloud Functions direct lookup
    await setDoc(doc(collection(db, 'config'), 'push_auth'), keyData);

    console.log('[WebPush] Chaves VAPID registradas com sucesso no Firestore');

    return {
      success: true,
      id: 'default'
    };
  } catch (err) {
    console.error('[WebPush] Erro ao registrar chaves VAPID no Firestore:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

/**
 * Registers the Service Worker (/sw.js)
 */
export async function registerServiceWorker(): Promise<SwRegistrationStatus> {
  if (typeof window === 'undefined') {
    return {
      supported: false,
      registered: false,
      permission: 'default',
      active: false
    };
  }

  const supported = 'serviceWorker' in navigator && 'Notification' in window;
  const permission = supported ? Notification.permission : 'default';

  if (!supported) {
    return {
      supported: false,
      registered: false,
      permission,
      active: false,
      error: 'Navegador não suporta Service Worker ou Notificações Push'
    };
  }

  try {
    let reg: ServiceWorkerRegistration;
    try {
      reg = await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
    } catch {
      reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    }
    swRegistration = reg;

    console.log('[SW] Service Worker registrado no escopo:', reg.scope);
    await navigator.serviceWorker.ready;

    return {
      supported: true,
      registered: true,
      permission: Notification.permission,
      active: !!reg.active,
      scope: reg.scope
    };
  } catch (error) {
    console.error('[SW] Erro ao registrar Service Worker:', error);
    return {
      supported: true,
      registered: false,
      permission,
      active: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Requests native browser Notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted' && 'serviceWorker' in navigator) {
      await registerServiceWorker();
    }
    return permission;
  } catch (e) {
    console.error('Erro ao solicitar permissão de notificação:', e);
    return 'denied';
  }
}

/**
 * Subscribes user to Web Push using PushManager & VAPID Key
 */
export async function subscribeToWebPush(customVapidKey?: string): Promise<WebPushSubscriptionStatus> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return { subscribed: false, error: 'Service Worker não suportado' };
  }

  const vapidKey = customVapidKey || getStoredVapidKey();
  if (customVapidKey) saveStoredVapidKey(customVapidKey);

  try {
    const perm = await requestNotificationPermission();
    if (perm !== 'granted') {
      return { subscribed: false, error: 'Permissão de notificação negada pelo utilizador' };
    }

    const reg = swRegistration || (await navigator.serviceWorker.ready);
    if (!reg.pushManager) {
      return { subscribed: false, error: 'PushManager não suportado pelo navegador' };
    }

    // Check existing subscription
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      // Create new PushSubscription with VAPID Key
      try {
        const applicationServerKey = urlBase64ToUint8Array(vapidKey);
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });
      } catch (subErr) {
        // Fallback without binary conversion if VAPID string is standard
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true
        });
      }
    }

    const subJson = subscription.toJSON();
    localStorage.setItem('portal_push_subscription', JSON.stringify(subJson));

    // Optionally register subscription in Firestore collection 'push_subscriptions' for Cloud Functions
    const { db } = getFirebaseInstance();
    if (db) {
      try {
        const subId = btoa(subJson.endpoint || 'sub-' + Date.now()).replace(/=/g, '').slice(-30);
        await setDoc(doc(collection(db, 'push_subscriptions'), subId), {
          endpoint: subJson.endpoint,
          keys: subJson.keys || {},
          vapidKey,
          userAgent: navigator.userAgent,
          updatedAt: Date.now(),
          status: 'active'
        });
        console.log('[WebPush] Subscrição salva no Firestore em push_subscriptions');

        // Also ensure VAPID Key authorization is registered in Firestore
        await registerVapidKeys(vapidKey);
      } catch (fsErr) {
        console.warn('[WebPush] Aviso ao salvar subscrição no Firestore:', fsErr);
      }
    }

    return {
      subscribed: true,
      endpoint: subJson.endpoint,
      vapidKey,
      subscription: subJson
    };
  } catch (err) {
    console.error('[WebPush] Erro ao subscrever Web Push:', err);
    return {
      subscribed: false,
      vapidKey,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

/**
 * Unsubscribes user from Web Push
 */
export async function unsubscribeFromWebPush(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const reg = swRegistration || (await navigator.serviceWorker.ready);
    if (reg.pushManager) {
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
    }
    localStorage.removeItem('portal_push_subscription');
    return true;
  } catch (e) {
    console.error('[WebPush] Erro ao cancelar subscrição:', e);
    return false;
  }
}

/**
 * Gets active Web Push subscription if registered
 */
export async function getActivePushSubscription(): Promise<PushSubscriptionJSON | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = swRegistration || (await navigator.serviceWorker.ready);
    if (reg.pushManager) {
      const sub = await reg.pushManager.getSubscription();
      if (sub) return sub.toJSON();
    }

    const saved = localStorage.getItem('portal_push_subscription');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('[WebPush] Erro ao obter subscrição ativa:', e);
  }

  return null;
}

/**
 * Sends a native browser push notification via Service Worker or Native API
 */
export async function sendNativeNotification(event: PortalEvent) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  const title = `${event.app} - ${event.title}`;
  const body = event.text || 'Nova mensagem capturada no dispositivo Android';

  try {
    // Try via Service Worker Registration if active
    if (swRegistration && swRegistration.active) {
      const options: any = {
        body,
        icon: '/app_icon.jpg',
        badge: '/app_icon.jpg',
        tag: `evt-${event.id}`,
        renotify: true,
        data: {
          eventId: event.id,
          app: event.app,
          url: '/'
        },
        vibrate: event.priority === 'critical' ? [200, 100, 200, 100, 300] : [100, 50, 100],
        actions: [
          { action: 'open', title: 'Ver no Portal' },
          { action: 'dismiss', title: 'Fechar' }
        ]
      };
      await swRegistration.showNotification(title, options);
      return;
    }

    // Try via SW controller postMessage
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        payload: {
          title,
          body,
          icon: '/app_icon.jpg',
          tag: `evt-${event.id}`,
          priority: event.priority,
          data: { eventId: event.id, url: '/' }
        }
      });
      return;
    }

    // Fallback to standard Notification constructor
    new Notification(title, {
      body,
      icon: '/app_icon.jpg',
      tag: `evt-${event.id}`
    });
  } catch (err) {
    console.warn('[Push] Falha ao disparar notificação nativa:', err);
  }
}

/**
 * Tests background notification with sample payload
 */
export async function sendTestNotification() {
  const testEvent: PortalEvent = {
    id: 'test-' + Date.now(),
    userId: 'usr-default',
    uid: 'usr-default',
    deviceId: 'dev-pixel-8',
    deviceName: 'Google Pixel 8 Pro',
    app: 'SMS / Web Push Test',
    source: 'SMS / Web Push Test',
    packageName: 'com.google.android.apps.messaging',
    title: 'Notificação Nativa do Navegador',
    body: 'Esta é uma notificação disparada via Service Worker & VAPID Web Push.',
    text: 'Esta é uma notificação disparada via Service Worker & VAPID Web Push.',
    timestamp: Date.now(),
    priority: 'critical',
    type: 'sms',
    read: false,
    archived: false,
    favorite: true
  };

  await sendNativeNotification(testEvent);
}

