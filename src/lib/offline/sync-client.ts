import { acknowledgeOfflineEvents, failOfflineEvents, getOfflinePreferences, listOfflineEvents, rejectOfflineEvents, saveOfflinePreferences } from "@/lib/offline/database";
import { nextSyncBatch } from "@/lib/offline/event-queue";

let activeSync: Promise<SyncSummary> | null = null;

export interface SyncSummary {
  acknowledged: number;
  pending: number;
  failed: number;
}

export function syncOfflineEvents(force = false) {
  if (activeSync) return activeSync;
  activeSync = runSync(force).finally(() => { activeSync = null; });
  return activeSync;
}

async function runSync(force: boolean): Promise<SyncSummary> {
  const preferences = await getOfflinePreferences();
  if (!force && !preferences.autoSync) return summarize();
  if (typeof navigator !== "undefined" && !navigator.onLine) return summarize();
  const allEvents = await listOfflineEvents();
  const batch = nextSyncBatch(allEvents);
  if (!batch.length) {
    await saveOfflinePreferences({ lastSyncAt: new Date().toISOString() });
    return summarize();
  }

  let acknowledgedCount = 0;
  const byProfile = new Map<string, typeof batch>();
  for (const event of batch) {
    const group = byProfile.get(event.profileId) ?? [];
    group.push(event);
    byProfile.set(event.profileId, group);
  }

  for (const [profileId, events] of byProfile) {
    try {
      const response = await fetch("/api/offline/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-profile-id": profileId },
        body: JSON.stringify({ events: events.map(({ status: _status, attempts: _attempts, nextAttemptAt: _nextAttemptAt, lastError: _lastError, ...event }) => event) }),
      });
      const data = await response.json().catch(() => null) as { acknowledged?: string[]; rejected?: Array<{ eventId: string; error: string; retryable: boolean }> } | null;
      if (!response.ok || !data) throw new Error("Math Stars could not confirm the sync batch");
      const acknowledged = data.acknowledged ?? [];
      await acknowledgeOfflineEvents(acknowledged);
      acknowledgedCount += acknowledged.length;
      const retryableIds = new Set((data.rejected ?? []).filter((item) => item.retryable).map((item) => item.eventId));
      const permanentErrors = new Map((data.rejected ?? []).filter((item) => !item.retryable).map((item) => [item.eventId, item.error]));
      const permanentlyRejected = events.filter((event) => permanentErrors.has(event.eventId));
      if (permanentlyRejected.length) await rejectOfflineEvents(permanentlyRejected, permanentErrors);
      const retryable = events.filter((event) => retryableIds.has(event.eventId));
      if (retryable.length) await failOfflineEvents(retryable, "The server asked Math Stars to retry this work.");
    } catch (error) {
      await failOfflineEvents(events, error instanceof Error ? error.message : "Connection interrupted");
    }
  }

  await saveOfflinePreferences({ lastSyncAt: new Date().toISOString() });
  const summary = await summarize();
  window.dispatchEvent(new CustomEvent("mathstars-sync-complete", { detail: { ...summary, acknowledged: acknowledgedCount } }));
  return { ...summary, acknowledged: acknowledgedCount };
}

async function summarize(): Promise<SyncSummary> {
  const events = await listOfflineEvents();
  return {
    acknowledged: 0,
    pending: events.filter((event) => event.status === "pending").length,
    failed: events.filter((event) => event.status === "failed").length,
  };
}

export async function requestBackgroundSync() {
  const registration = await navigator.serviceWorker?.ready;
  const sync = registration && "sync" in registration
    ? (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync
    : null;
  if (sync) await sync.register("math-stars-sync").catch(() => {});
}
