// Service Worker for Posts Manager PWA
const CACHE_NAME = 'posts-pwa-v2';
const DYNAMIC_CACHE = 'posts-dynamic-v1';

// Static assets to cache on install
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/static-logo.png'
];

// ================================================
// Install Event - Cache Static Assets
// ================================================
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Installed successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// ================================================
// Activate Event - Clean Up Old Caches
// ================================================
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activated successfully');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// ================================================
// Fetch Event - Serve From Cache, Fallback to Network
// ================================================
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if found
        if (cachedResponse) {
          console.log('[Service Worker] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Don't cache non-successful responses
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response
            const responseToCache = networkResponse.clone();

            // Cache dynamic content
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch failed:', error);
            
            // Return offline fallback for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            throw error;
          });
      })
  );
});

// ================================================
// Background Sync (Optional - for future enhancement)
// ================================================
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-posts') {
    event.waitUntil(
      // Add background sync logic here if needed
      Promise.resolve()
    );
  }
});

// ================================================
// Push Notifications (Optional - for future enhancement)
// ================================================
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/icons/static-logo.png',
    badge: '/icons/static-logo.png',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification('Posts Manager', options)
  );
});

// ================================================
// Message Handler - Communication with Main Thread
// ================================================
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => cache.addAll(event.data.urls))
    );
  }
});

console.log('[Service Worker] Script loaded');
