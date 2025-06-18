const CACHE_NAME = "osc-cache-v3"; // ← Selalu ubah versinya setiap ada update HTML/JS
const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./sw.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
];

// Install & langsung skipWaiting agar update langsung dipakai
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // Penting → Langsung gunakan versi baru
});

// Activate → Hapus cache lama & ambil alih semua tab
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      )
    )
  );
  self.clients.claim(); // Penting → Ambil alih semua halaman yang dibuka
});

// Fetch handler → Cache first, fallback to network
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
