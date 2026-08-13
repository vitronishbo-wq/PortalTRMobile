/* Service Worker - Portal TR Mobile PWA & Web Push Background Handler */

const CACHE_NAME = 'portal-tr-mobile-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Falha ao adicionar assets à cache:', err);
      });
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Web Push Event Handler (Processa mensagens enviadas pelo servidor backend ou Cloud Functions)
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Evento Push recebido em background');

  let pushData = {
    title: 'Portal TR Mobile - Nova Captura',
    body: 'Captura de SMS/Notificação recebida do dispositivo Android em tempo real.',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'push-notification-' + Date.now(),
    data: { url: '/', timestamp: Date.now() }
  };

  if (event.data) {
    try {
      const jsonPayload = event.data.json();
      pushData = {
        ...pushData,
        ...jsonPayload,
        data: {
          url: jsonPayload.url || '/',
          eventId: jsonPayload.eventId || jsonPayload.id || null,
          app: jsonPayload.app || null,
          timestamp: Date.now()
        }
      };
    } catch (e) {
      pushData.body = event.data.text() || pushData.body;
    }
  }

  const notificationOptions = {
    body: pushData.body,
    icon: pushData.icon || '/icon.svg',
    badge: pushData.badge || '/icon.svg',
    tag: pushData.tag || 'portal-push-tag',
    data: pushData.data,
    renotify: true,
    vibrate: [200, 100, 200, 100, 300],
    actions: [
      { action: 'open', title: 'Abrir Painel' },
      { action: 'close', title: 'Fechar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(pushData.title, notificationOptions)
  );
});

// Notification Click Event Handler
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Clique em Notificação detectado:', event.action);
  event.notification.close();

  if (event.action === 'close' || event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Tentar focar numa janela existente já aberta
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            eventId: event.notification.data ? event.notification.data.eventId : null,
            app: event.notification.data ? event.notification.data.app : null
          });
          return client.focus();
        }
      }
      // Se não houver janela aberta, abre uma nova
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Message Listener proveniente da aplicação principal
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data === 'SKIP_WAITING' || (typeof event.data === 'object' && event.data.type === 'SKIP_WAITING')) {
    self.skipWaiting();
    return;
  }

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag, data, priority } = event.data.payload || {};

    const options = {
      body: body || 'Nova mensagem capturada no Android',
      icon: icon || '/icon.svg',
      badge: '/icon.svg',
      tag: tag || 'portal-tr-notification',
      data: data || { url: '/' },
      renotify: true,
      vibrate: priority === 'critical' ? [200, 100, 200, 100, 300] : [100, 50, 100],
      actions: [
        { action: 'open', title: 'Ver no Portal' },
        { action: 'dismiss', title: 'Ignorar' }
      ]
    };

    self.registration.showNotification(title || 'Portal TR Mobile', options);
  }
});
