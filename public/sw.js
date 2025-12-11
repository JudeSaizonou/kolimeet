const CACHE_NAME = 'Kolimeet-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Force update all clients
      return self.clients.claim();
    })
  );
});

// ============================================
// PUSH NOTIFICATIONS
// ============================================

// Réception d'une notification push
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: 'Kolimeet',
    body: 'Vous avez une nouvelle notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'default',
    data: { url: '/' }
  };
  
  // Parser les données si présentes
  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || data.tag,
        data: payload.data || data.data,
        // Options supplémentaires
        vibrate: payload.vibrate || [200, 100, 200],
        requireInteraction: payload.requireInteraction || false,
        actions: payload.actions || []
      };
    } catch (e) {
      // Si ce n'est pas du JSON, utiliser comme texte
      data.body = event.data.text();
    }
  }
  
  // Afficher la notification
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      data: data.data,
      vibrate: data.vibrate,
      requireInteraction: data.requireInteraction,
      actions: data.actions
    })
  );
});

// Clic sur une notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked', event.notification.tag);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  // Gérer les actions (boutons dans la notification)
  if (event.action) {
    console.log('[SW] Action clicked:', event.action);
    // Les actions peuvent avoir leurs propres URLs
    if (event.action === 'reply') {
      // Ouvrir la conversation
      event.waitUntil(clients.openWindow(urlToOpen));
      return;
    }
    if (event.action === 'dismiss') {
      // Juste fermer
      return;
    }
  }
  
  // Ouvrir ou focus une fenêtre existante
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Chercher une fenêtre déjà ouverte sur le même domaine
        for (const client of windowClients) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            // Naviguer vers l'URL et focus
            client.postMessage({ type: 'NOTIFICATION_CLICK', url: urlToOpen });
            return client.focus();
          }
        }
        // Sinon ouvrir une nouvelle fenêtre
        return clients.openWindow(urlToOpen);
      })
  );
});

// Fermeture d'une notification (swipe away, etc.)
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed', event.notification.tag);
});

// Message du client (pour tests ou actions)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Test de notification locale
  if (event.data && event.data.type === 'TEST_NOTIFICATION') {
    self.registration.showNotification('Test Kolimeet', {
      body: 'Les notifications fonctionnent ! 🎉',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200]
    });
  }
});

// ============================================
// CACHE / FETCH
// ============================================

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other unsupported schemes
  try {
    const url = new URL(event.request.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return; // Don't handle non-HTTP(S) requests
    }
  } catch (e) {
    return; // Invalid URL, skip
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses (only HTTP/HTTPS)
        if (response.status === 200) {
          try {
            const url = new URL(event.request.url);
            if (url.protocol === 'http:' || url.protocol === 'https:') {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone).catch(() => {
                  // Ignore cache errors silently (chrome-extension, etc.)
                });
              });
            }
          } catch (e) {
            // Invalid URL, skip caching
          }
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache on network error
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});
