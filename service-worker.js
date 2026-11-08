
const CACHE_NAME = "lumia-corroboraai-v4";

const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./script.js",
  "./lumi.png",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

// Instalar y guardar los archivos principales
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activar la nueva versión y eliminar cachés antiguas
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Obtener archivos actualizados desde la red
self.addEventListener("fetch", event => {
  const request = event.request;

  if (
    request.method !== "GET" ||
    new URL(request.url).origin !== self.location.origin
  ) return;

  // Páginas HTML: primero intentar obtener la versión publicada
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache =>
              cache.put("./index.html", copy)
            );
          }
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // JavaScript y CSS: priorizar siempre la versión nueva
  if (
    request.destination === "script" ||
    request.destination === "style"
  ) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache =>
              cache.put(request, copy)
            );
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Otros recursos: utilizar caché y recurrir a la red
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache =>
            cache.put(request, copy)
          );
        }
        return response;
      });
    })
  );
});
