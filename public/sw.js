/* Service Worker - Portal TR Mobile PWA & Web Push Notifications */

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
        console.warn('[SW] Caching assets warning:', err);
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

// Fetch Event - Offline Cache Handler
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Ignore API/Firestore requests from SW cache
  if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('identitytoolkit')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Message Listener from Main Thread
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag, data, priority, type } = event.data.payload || {};

    const options = {
      body: body || 'Nova captura recebida',
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

// Push Event (for real Web Push server triggers if VAPID server is used)
self.addEventListener('push', (event) => {
  let pushData = {
    title: 'Portal TR Mobile - Nova Captura',
    body: 'Captura de SMS/Notificação recebida do Android em tempo real.',
    icon: '/icon.svg',
    tag: 'push-notification-' + Date.now(),
    data: { url: '/' }
  };

  if (event.data) {
    try {
      pushData = { ...pushData, ...event.data.json() };
    } catch (e) {
      pushData.body = event.data.text();
    }
  }

  const options = {
    body: pushData.body,
    icon: pushData.icon || '/icon.svg',
    badge: '/icon.svg',
    tag: pushData.tag,
    data: pushData.data || { url: '/' },
    renotify: true,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'Abrir Painel' },
      { action: 'close', title: 'Fechar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(pushData.title, options)
  );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss' || event.action === 'close') {
    return;
  }

  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            eventId: event.notification.data ? event.notification.data.eventId : null
          });
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
