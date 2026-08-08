// Math Stars Anywhere service worker.
// The app shell and downloaded grade packs are available without a connection.

const SHELL_CACHE = "mathstars-shell-v4";
const RUNTIME_CACHE = "mathstars-runtime-v4";
const PACK_PREFIX = "mathstars-pack-";
const APP_SHELL = [
  "/offline",
  "/manifest.json",
  "/brand/math-stars-icon-192.png",
  "/brand/math-stars-logo.png",
  "/learner-fox.webp",
  "/learner-owl.webp",
  "/pip-tutor.webp",
];
let lowDataMode = false;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    for (const path of APP_SHELL) {
      try { await cache.add(path); } catch { /* resume on the next visit */ }
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith("mathstars-") && !key.startsWith(PACK_PREFIX) && key !== SHELL_CACHE && key !== RUNTIME_CACHE)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/offline/packs")) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }

  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(navigationResponse(request));
    return;
  }

  event.respondWith(staticResponse(request));
});

self.addEventListener("message", (event) => {
  const message = event.data || {};
  if (message.type === "SET_LOW_DATA") {
    lowDataMode = Boolean(message.enabled);
    return;
  }
  if (message.type === "DOWNLOAD_GRADE_PACK") {
    event.waitUntil(downloadGradePack(event.source, message));
    return;
  }
  if (message.type === "DELETE_GRADE_PACK" && typeof message.level === "string") {
    event.waitUntil(caches.delete(`${PACK_PREFIX}${message.level}`));
    return;
  }
  if (message.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("sync", (event) => {
  if (event.tag !== "math-stars-sync") return;
  event.waitUntil(notifyClients({ type: "SYNC_REQUESTED" }));
});

async function navigationResponse(request) {
  const cached = await caches.match(request);
  try {
    const response = await fetchWithTimeout(request, 4500);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return cached || await caches.match("/") || await caches.match("/offline") || Response.error();
  }
}

async function staticResponse(request) {
  const cached = await caches.match(request);
  if (cached) {
    if (!lowDataMode) fetch(request).then(async (response) => {
      if (response.ok) (await caches.open(RUNTIME_CACHE)).put(request, response);
    }).catch(() => {});
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) (await caches.open(RUNTIME_CACHE)).put(request, response.clone());
    return response;
  } catch {
    return Response.error();
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

async function downloadGradePack(source, message) {
  const { requestId, level, assets } = message;
  if (!requestId || !level || !Array.isArray(assets)) return;
  const cache = await caches.open(`${PACK_PREFIX}${level}`);
  const pending = [...new Set(assets)];
  const discovered = new Set(pending);
  let completed = 0;
  try {
    for (let index = 0; index < pending.length; index += 1) {
      const asset = pending[index];
      let response = await cache.match(asset);
      if (!response) {
        response = await fetch(asset);
        if (!response.ok) throw new Error(`Could not download ${asset}`);
        await cache.put(asset, response.clone());
      }
      if (response.headers.get("content-type")?.includes("text/html")) {
        const html = await response.clone().text();
        for (const dependency of discoverBuildAssets(html)) {
          if (!discovered.has(dependency)) {
            discovered.add(dependency);
            pending.push(dependency);
          }
        }
      }
      completed += 1;
      source?.postMessage({ type: "PACK_PROGRESS", requestId, completed, total: pending.length, current: asset });
    }
    source?.postMessage({ type: "PACK_COMPLETE", requestId, completed, total: pending.length });
  } catch (error) {
    source?.postMessage({ type: "PACK_ERROR", requestId, completed, total: pending.length, error: error instanceof Error ? error.message : "Download interrupted" });
  }
}

function discoverBuildAssets(html) {
  const assets = [];
  const pattern = /(?:src|href)=["']([^"']+)["']/g;
  for (const match of html.matchAll(pattern)) {
    try {
      const url = new URL(match[1], self.location.origin);
      if (url.origin === self.location.origin && url.pathname.startsWith("/_next/")) assets.push(`${url.pathname}${url.search}`);
    } catch { /* ignore malformed markup */ }
  }
  return [...new Set(assets)];
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of clients) client.postMessage(message);
}

function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(request, { signal: controller.signal }).finally(() => clearTimeout(timer));
}
