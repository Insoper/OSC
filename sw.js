const CACHE_NAME = "osc-cache-v4"; // Ubah versi
const urlsToCache = [
  "/", // Pastikan path benar
  "index.html",
  "proxy.html", // Tambahkan ini
  "manifest.json",
  // Hapus reference ke icon jika file tidak ada
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache).catch(err => {
          console.log("Gagal cache:", err);
        });
      })
  );
  self.skipWaiting();
});
