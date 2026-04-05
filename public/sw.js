// ============================================================
// Alpha360 — Service Worker
// Handles: Caching, Offline Support, Push Notifications
// ============================================================

const CACHE_NAME = 'alpha360-v1';
const STATIC_ASSETS = [
  '/dashboard',
  '/manifest.json',
];

// ---- INSTALL ----
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Alpha360 Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).catch((err) => {
      console.log('[SW] Cache install error (non-blocking):', err);
    })
  );
  self.skipWaiting();
});

// ---- ACTIVATE ----
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Alpha360 Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ---- FETCH (Network-first strategy) ----
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  // Skip API and firebase requests
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('firestore') ||
      event.request.url.includes('firebase')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache when offline
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // For navigation requests, return the dashboard page
          if (event.request.mode === 'navigate') {
            return caches.match('/dashboard');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// ---- PUSH NOTIFICATIONS ----
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let data = {
    title: '🆘 Alpha360 - Alerta',
    body: 'Novo alerta recebido na central.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'alpha360-alert',
    data: { url: '/dashboard/despacho' },
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    console.log('[SW] Push data parse error:', e);
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-72x72.png',
    tag: data.tag || 'alpha360-alert',
    vibrate: [300, 100, 300, 100, 300],
    data: data.data || { url: '/dashboard/despacho' },
    actions: [
      { action: 'open', title: '📋 Abrir Despacho' },
      { action: 'dismiss', title: '✕ Fechar' },
    ],
    requireInteraction: true, // Keep notification visible until user interacts
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ---- NOTIFICATION CLICK ----
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/dashboard/despacho';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if found
      for (const client of clients) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// ---- BACKGROUND SYNC (for offline alert submissions) ----
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === 'sync-alerts') {
    // Future: process queued alerts when back online
  }
});

console.log('[SW] Alpha360 Service Worker loaded.');
