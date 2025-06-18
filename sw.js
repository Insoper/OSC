// Versi cache - ubah ini setiap update aplikasi
const CACHE_NAME = 'sw.js?v=3';
const DYNAMIC_CACHE_NAME = 'operator-checklist-dynamic-v3';

// Asset yang akan di-cache saat install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// Strategi: Cache First dengan fallback ke network
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Meng-cache static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Skip waiting untuk aktivasi langsung');
        return self.skipWaiting();
      })
  );
});

// Aktifkan SW segera
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          // Hapus cache lama yang tidak match dengan versi saat ini
          if (cache !== CACHE_NAME && cache !== DYNAMIC_CACHE_NAME) {
            console.log('Menghapus cache lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
    .then(() => {
      console.log('Mengklaim semua klien');
      return self.clients.claim();
    })
  );
});

// Strategi caching untuk berbagai request
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // 2. Handle proxy.html secara khusus (selalu dari network)
  if (url.pathname.includes('proxy.html')) {
    event.respondWith(fetch(request));
    return;
  }

  // 3. Handle API calls ke Google Sheets (selalu dari network)
  if (url.href.includes('script.google.com')) {
    event.respondWith(fetch(request));
    return;
  }

  // 4. Strategi untuk static assets (Cache First)
  if (STATIC_ASSETS.some(asset => url.href.includes(asset))) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        return cachedResponse || fetch(request).then(response => {
          // Tambahkan ke dynamic cache jika valid
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // 5. Fallback: Network First dengan cache fallback
  event.respondWith(
    fetch(request).then(response => {
      // Simpan response ke cache jika valid
      if (response && response.status === 200) {
        const responseToCache = response.clone();
        caches.open(DYNAMIC_CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });
      }
      return response;
    }).catch(() => {
      // Fallback ke cache jika offline
      return caches.match(request).then(response => {
        return response || caches.match('/offline.html');
      });
    })
  );
});

// Background sync (untuk data yang gagal dikirim)
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
