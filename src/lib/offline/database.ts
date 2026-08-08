import {
  OFFLINE_DB_NAME,
  OFFLINE_DB_VERSION,
  type OfflineArcadeRun,
  type OfflineCheckpoint,
  type OfflineEvent,
  type OfflineGradePack,
  type OfflinePreferences,
  type OfflineSnapshot,
  type StoredOfflineEvent,
} from "@/lib/offline/types";
import { retryDelay, toStoredEvent } from "@/lib/offline/event-queue";

const STORES = {
  snapshots: "snapshots",
  events: "events",
  packs: "packs",
  preferences: "preferences",
  checkpoints: "checkpoints",
  arcadeRuns: "arcadeRuns",
} as const;

function available() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDatabase(): Promise<IDBDatabase> {
  if (!available()) return Promise.reject(new Error("Offline storage is unavailable"));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.snapshots)) db.createObjectStore(STORES.snapshots, { keyPath: "key" });
      if (!db.objectStoreNames.contains(STORES.events)) {
        const store = db.createObjectStore(STORES.events, { keyPath: "eventId" });
        store.createIndex("profileId", "profileId", { unique: false });
        store.createIndex("status", "status", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.packs)) db.createObjectStore(STORES.packs, { keyPath: "level" });
      if (!db.objectStoreNames.contains(STORES.preferences)) db.createObjectStore(STORES.preferences, { keyPath: "key" });
      if (!db.objectStoreNames.contains(STORES.checkpoints)) db.createObjectStore(STORES.checkpoints, { keyPath: "key" });
      if (!db.objectStoreNames.contains(STORES.arcadeRuns)) db.createObjectStore(STORES.arcadeRuns, { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Offline storage could not open"));
  });
}

async function request<T>(storeName: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const result = action(transaction.objectStore(storeName));
    result.onsuccess = () => resolve(result.result);
    result.onerror = () => reject(result.error ?? new Error("Offline storage request failed"));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error ?? new Error("Offline storage transaction failed"));
  });
}

export async function saveSnapshot<T>(key: string, value: T) {
  const record: OfflineSnapshot<T> = { key, value, savedAt: new Date().toISOString() };
  await request(STORES.snapshots, "readwrite", (store) => store.put(record));
}

export async function loadSnapshot<T>(key: string): Promise<T | null> {
  if (!available()) return null;
  const record = await request<OfflineSnapshot<T> | undefined>(STORES.snapshots, "readonly", (store) => store.get(key));
  return record?.value ?? null;
}

export async function enqueueOfflineEvent(event: OfflineEvent) {
  const existing = await request<StoredOfflineEvent | undefined>(STORES.events, "readonly", (store) => store.get(event.eventId));
  if (!existing) await request(STORES.events, "readwrite", (store) => store.put(toStoredEvent(event)));
}

export async function listOfflineEvents(): Promise<StoredOfflineEvent[]> {
  if (!available()) return [];
  return request(STORES.events, "readonly", (store) => store.getAll());
}

export async function acknowledgeOfflineEvents(eventIds: readonly string[]) {
  if (!eventIds.length || !available()) return;
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORES.events, "readwrite");
    const store = transaction.objectStore(STORES.events);
    for (const eventId of eventIds) store.delete(eventId);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => reject(transaction.error ?? new Error("Synced events could not be cleared"));
  });
}

export async function failOfflineEvents(events: readonly StoredOfflineEvent[], message: string) {
  if (!events.length || !available()) return;
  const now = Date.now();
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORES.events, "readwrite");
    const store = transaction.objectStore(STORES.events);
    for (const event of events) {
      const attempts = event.attempts + 1;
      store.put({ ...event, status: "failed", attempts, nextAttemptAt: now + retryDelay(attempts), lastError: message });
    }
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => reject(transaction.error ?? new Error("Offline retries could not be updated"));
  });
}

export async function rejectOfflineEvents(events: readonly StoredOfflineEvent[], errors: ReadonlyMap<string, string>) {
  if (!events.length || !available()) return;
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORES.events, "readwrite");
    const store = transaction.objectStore(STORES.events);
    for (const event of events) store.put({ ...event, status: "failed", attempts: event.attempts + 1, nextAttemptAt: Number.MAX_SAFE_INTEGER, lastError: errors.get(event.eventId) ?? "The server rejected this saved work." });
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => reject(transaction.error ?? new Error("Rejected events could not be retained"));
  });
}

export async function saveGradePack(pack: OfflineGradePack) {
  await request(STORES.packs, "readwrite", (store) => store.put(pack));
}

export async function listGradePacks(): Promise<OfflineGradePack[]> {
  if (!available()) return [];
  return request(STORES.packs, "readonly", (store) => store.getAll());
}

export async function deleteGradePack(level: string) {
  if (!available()) return;
  await request(STORES.packs, "readwrite", (store) => store.delete(level));
  navigator.serviceWorker?.controller?.postMessage({ type: "DELETE_GRADE_PACK", level });
}

const DEFAULT_PREFERENCES: OfflinePreferences = { lowDataMode: false, autoSync: true, lastSyncAt: null };

export async function getOfflinePreferences(): Promise<OfflinePreferences> {
  if (!available()) return DEFAULT_PREFERENCES;
  const record = await request<{ key: string; value: OfflinePreferences } | undefined>(STORES.preferences, "readonly", (store) => store.get("offline"));
  return { ...DEFAULT_PREFERENCES, ...(record?.value ?? {}) };
}

export async function saveOfflinePreferences(value: Partial<OfflinePreferences>) {
  const current = await getOfflinePreferences();
  const next = { ...current, ...value };
  await request(STORES.preferences, "readwrite", (store) => store.put({ key: "offline", value: next }));
  document.documentElement.dataset.lowData = next.lowDataMode ? "true" : "false";
  navigator.serviceWorker?.controller?.postMessage({ type: "SET_LOW_DATA", enabled: next.lowDataMode });
  return next;
}

export async function saveOfflineCheckpoint(checkpoint: Omit<OfflineCheckpoint, "key">) {
  const value = { ...checkpoint, key: `${checkpoint.profileId}:${checkpoint.lessonId}` };
  await request(STORES.checkpoints, "readwrite", (store) => store.put(value));
  return value;
}

export async function loadOfflineCheckpoint(profileId: string, lessonId: string) {
  if (!available()) return null;
  return (await request<OfflineCheckpoint | undefined>(STORES.checkpoints, "readonly", (store) => store.get(`${profileId}:${lessonId}`))) ?? null;
}

export async function loadLatestOfflineCheckpoint(profileId: string) {
  if (!available()) return null;
  const rows = await request<OfflineCheckpoint[]>(STORES.checkpoints, "readonly", (store) => store.getAll());
  return rows.filter((row) => row.profileId === profileId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
}

export async function deleteOfflineCheckpoint(profileId: string, lessonId: string) {
  if (!available()) return;
  await request(STORES.checkpoints, "readwrite", (store) => store.delete(`${profileId}:${lessonId}`));
}

export async function saveOfflineArcadeRun(run: OfflineArcadeRun) {
  await request(STORES.arcadeRuns, "readwrite", (store) => store.put(run));
}

export async function loadOfflineArcadeRun(profileId: string, gameKey: string) {
  if (!available()) return null;
  return (await request<OfflineArcadeRun | undefined>(STORES.arcadeRuns, "readonly", (store) => store.get(`${profileId}:${gameKey}`))) ?? null;
}

export async function deleteOfflineArcadeRun(profileId: string, gameKey: string) {
  if (!available()) return;
  await request(STORES.arcadeRuns, "readwrite", (store) => store.delete(`${profileId}:${gameKey}`));
}

export async function offlineStorageEstimate() {
  const estimate = await navigator.storage?.estimate?.();
  return { usage: estimate?.usage ?? 0, quota: estimate?.quota ?? 0 };
}

export async function clearOfflineDeviceData() {
  if (available()) {
    await new Promise<void>((resolve) => {
      const deletion = indexedDB.deleteDatabase(OFFLINE_DB_NAME);
      deletion.onsuccess = () => resolve();
      deletion.onerror = () => resolve();
      deletion.onblocked = () => resolve();
    });
  }
  if (typeof caches !== "undefined") {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("mathstars-")).map((key) => caches.delete(key)));
  }
  localStorage.removeItem("mathstars-profile");
  localStorage.removeItem("mathstars-device-id");
}
