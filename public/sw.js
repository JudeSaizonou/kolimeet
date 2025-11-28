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
