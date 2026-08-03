// Math Stars service worker — enables offline use by caching the app shell.
// Uses a network-first strategy for navigations (so updates show up) and
// cache-first for static assets.

const CACHE = "mathstars-v1";
const APP_SHELL = ["/", "/manifest.json", "/logo.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Only handle GET.
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Network-first for navigations (HTML pages) so the latest content loads
  // when online, but fall back to cache when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r ?? caches.match("/")))
    );
    return;
  }

  // Cache-first for same-origin static assets (JS, CSS, fonts, images).
  // Never cache API requests — they must always hit the server for fresh data.
  if (url.origin === self.location.origin && !url.pathname.startsWith("/api/")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => cached);
      })
    );
  }
  // API and cross-origin requests pass through (no caching).
});
