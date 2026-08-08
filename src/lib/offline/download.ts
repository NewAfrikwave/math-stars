import type { Level } from "@/lib/types";
import { saveGradePack } from "@/lib/offline/database";
import type { OfflineGradePack } from "@/lib/offline/types";

export interface PackDownloadProgress {
  completed: number;
  total: number;
  current?: string;
}

export async function downloadGradePack(level: Level, onProgress?: (progress: PackDownloadProgress) => void) {
  const response = await fetch(`/api/offline/packs/${level}`);
  if (!response.ok) throw new Error("This grade pack could not be downloaded.");
  const payload = await response.json() as Omit<OfflineGradePack, "downloadedAt">;
  await cacheAssets(level, payload.assets, onProgress);
  const pack: OfflineGradePack = { ...payload, downloadedAt: new Date().toISOString() };
  await saveGradePack(pack);
  return pack;
}

function cacheAssets(level: Level, assets: string[], onProgress?: (progress: PackDownloadProgress) => void) {
  if (!navigator.serviceWorker?.controller) {
    return cacheAssetsDirectly(level, assets, onProgress);
  }
  const requestId = crypto.randomUUID();
  return new Promise<void>((resolve, reject) => {
    const listener = (event: MessageEvent) => {
      const message = event.data as { type?: string; requestId?: string; completed?: number; total?: number; current?: string; error?: string };
      if (message.requestId !== requestId) return;
      if (message.type === "PACK_PROGRESS") onProgress?.({ completed: message.completed ?? 0, total: message.total ?? assets.length, current: message.current });
      if (message.type === "PACK_COMPLETE") { navigator.serviceWorker.removeEventListener("message", listener); resolve(); }
      if (message.type === "PACK_ERROR") { navigator.serviceWorker.removeEventListener("message", listener); reject(new Error(message.error ?? "The grade pack download was interrupted.")); }
    };
    navigator.serviceWorker.addEventListener("message", listener);
    navigator.serviceWorker.controller?.postMessage({ type: "DOWNLOAD_GRADE_PACK", requestId, level, assets });
  });
}

async function cacheAssetsDirectly(level: Level, assets: string[], onProgress?: (progress: PackDownloadProgress) => void) {
  const cache = await caches.open(`mathstars-pack-${level}`);
  const pending = [...new Set(assets)];
  const discovered = new Set(pending);
  let completed = 0;
  for (let index = 0; index < pending.length; index += 1) {
    const asset = pending[index];
    let response = await cache.match(asset);
    if (!response) {
      response = await fetch(asset);
      if (!response.ok) throw new Error(`Could not download ${asset}`);
      await cache.put(asset, response.clone());
    }
    if (response.headers.get("content-type")?.includes("text/html")) {
      for (const dependency of discoverBuildAssets(await response.clone().text(), window.location.origin)) {
        if (!discovered.has(dependency)) {
          discovered.add(dependency);
          pending.push(dependency);
        }
      }
    }
    completed += 1;
    onProgress?.({ completed, total: pending.length, current: asset });
  }
}

export function discoverBuildAssets(html: string, origin: string) {
  const assets: string[] = [];
  const pattern = /(?:src|href)=["']([^"']+)["']/g;
  for (const match of html.matchAll(pattern)) {
    try {
      const url = new URL(match[1], origin);
      if (url.origin === origin && url.pathname.startsWith("/_next/")) assets.push(`${url.pathname}${url.search}`);
    } catch { /* ignore malformed markup */ }
  }
  return [...new Set(assets)];
}
