import type { LessonProgressState } from "@/lib/types";
import type { OfflineEvent, StoredOfflineEvent } from "@/lib/offline/types";

export function toStoredEvent(event: OfflineEvent): StoredOfflineEvent {
  return { ...event, status: "pending", attempts: 0, nextAttemptAt: 0 };
}

export function coalesceEvents(events: readonly StoredOfflineEvent[]) {
  const unique = new Map<string, StoredOfflineEvent>();
  for (const event of [...events].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    if (!unique.has(event.eventId)) unique.set(event.eventId, event);
  }
  return [...unique.values()];
}

export function nextSyncBatch(events: readonly StoredOfflineEvent[], now = Date.now(), limit = 25) {
  return coalesceEvents(events)
    .filter((event) => event.status === "pending" || (event.status === "failed" && event.nextAttemptAt <= now))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, limit);
}

export function retryDelay(attempts: number) {
  return Math.min(5 * 60_000, 2_000 * (2 ** Math.max(0, Math.min(attempts, 8))));
}

export function mergeProgressMaps(
  local: Record<string, LessonProgressState>,
  remote: Record<string, LessonProgressState>,
) {
  const merged = { ...remote };
  for (const [lessonId, localProgress] of Object.entries(local)) {
    const remoteProgress = remote[lessonId];
    if (!remoteProgress) {
      merged[lessonId] = localProgress;
      continue;
    }
    const completed = localProgress.status === "completed" || remoteProgress.status === "completed";
    merged[lessonId] = {
      ...remoteProgress,
      status: completed ? "completed" : remoteProgress.status === "in-progress" || localProgress.status === "in-progress" ? "in-progress" : remoteProgress.status,
      stars: Math.max(localProgress.stars, remoteProgress.stars),
      bestScore: Math.max(localProgress.bestScore, remoteProgress.bestScore),
      attempts: Math.max(localProgress.attempts, remoteProgress.attempts),
      lastScore: remoteProgress.attempts >= localProgress.attempts ? remoteProgress.lastScore : localProgress.lastScore,
      completedAt: remoteProgress.completedAt ?? localProgress.completedAt,
      lastPlayedAt: latestTimestamp(localProgress.lastPlayedAt, remoteProgress.lastPlayedAt),
    };
  }
  return merged;
}

function latestTimestamp(left?: string | null, right?: string | null) {
  if (!left) return right ?? null;
  if (!right) return left;
  return Date.parse(left) >= Date.parse(right) ? left : right;
}
