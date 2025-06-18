// Versi cache - ubah ini setiap update aplikasi
const CACHE_NAME = 'osc-v3';
const DYNAMIC_CACHE_NAME = 'osc-dynamic-v3';
const OFFLINE_PAGE = '/offline.html';

// Asset yang akan di-cache saat install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/proxy.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Meng-cache static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Aktifkan Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME && cache !== DYNAMIC_CACHE_NAME) {
            console.log('Menghapus cache lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Strategi caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Network first untuk API dan proxy
  if (url.pathname.includes('proxy.html') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache first untuk static assets
  if (STATIC_ASSETS.some(asset => url.href.includes(asset))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Network first untuk lainnya
  event.respondWith(networkFirst(request));
});

// Strategi Cache First
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    return caches.match(OFFLINE_PAGE) || new Response('Offline');
  }
}

// Strategi Network First
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || caches.match(OFFLINE_PAGE) || new Response('Offline');
  }
}

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('Background sync dijalankan');
    // Implementasi sync logic disini
  }
});

// Pesan antara app dan service worker
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
