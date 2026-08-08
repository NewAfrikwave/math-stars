import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { buildGradePack, listGradePackMetadata, OFFLINE_LEVELS } from "../src/lib/offline/grade-packs";
import { discoverBuildAssets } from "../src/lib/offline/download";
import { coalesceEvents, mergeProgressMaps, nextSyncBatch, retryDelay, toStoredEvent } from "../src/lib/offline/event-queue";
import { buildMasteryMap, recommendedMission } from "../src/lib/adaptive-learning";
import { consecutiveLearningStreak } from "../src/lib/progress-save";
import type { OfflineEvent } from "../src/lib/offline/types";
import type { LessonProgressState } from "../src/lib/types";

describe("Math Stars Anywhere", () => {
  test("ships a versioned downloadable pack for every supported grade", () => {
    expect(OFFLINE_LEVELS).toEqual(["preschool", "grade1", "grade2", "grade3", "grade4"]);
    const metadata = listGradePackMetadata();
    expect(metadata).toHaveLength(5);
    for (const item of metadata) {
      const pack = buildGradePack(item.level);
      expect(pack.lessonCount).toBeGreaterThan(0);
      expect(pack.lessons).toHaveLength(pack.lessonCount);
      expect(pack.assets).toContain(`/api/offline/packs/${item.level}`);
      expect(pack.estimatedBytes).toBeGreaterThan(1000);
      expect(pack.lessons.every((lesson) => lesson.spokenText.length > 0)).toBe(true);
    }
  });

  test("keeps multiple learners separate and syncs their events in chronological batches", () => {
    const events = [
      lessonEvent("event-b", "learner-b", "2026-08-03T12:00:00.000Z"),
      lessonEvent("event-a", "learner-a", "2026-08-01T12:00:00.000Z"),
      lessonEvent("event-c", "learner-a", "2026-08-02T12:00:00.000Z"),
      lessonEvent("event-a", "learner-a", "2026-08-01T12:00:00.000Z"),
    ].map(toStoredEvent);
    expect(coalesceEvents(events).map((event) => event.eventId)).toEqual(["event-a", "event-c", "event-b"]);
    expect(nextSyncBatch(events).map((event) => `${event.profileId}:${event.eventId}`)).toEqual([
      "learner-a:event-a", "learner-a:event-c", "learner-b:event-b",
    ]);
  });

  test("waits before retrying failed events and caps backoff at five minutes", () => {
    const event = { ...toStoredEvent(lessonEvent("retry", "learner", "2026-08-01T12:00:00.000Z")), status: "failed" as const, attempts: 3, nextAttemptAt: 10_000 };
    expect(nextSyncBatch([event], 9_999)).toHaveLength(0);
    expect(nextSyncBatch([event], 10_000)).toHaveLength(1);
    expect(retryDelay(20)).toBe(300_000);
  });

  test("merges a server refresh without losing newer offline mastery", () => {
    const local = { lesson: progress("completed", 3, 100, 2) };
    const remote = { lesson: progress("in-progress", 1, 60, 1) };
    expect(mergeProgressMaps(local, remote).lesson).toMatchObject({ status: "completed", stars: 3, bestScore: 100, attempts: 2 });
  });

  test("rebuilds a multi-day streak from delayed, out-of-order completions", () => {
    expect(consecutiveLearningStreak([
      new Date(2026, 7, 8, 12),
      new Date(2026, 7, 6, 12),
      new Date(2026, 7, 7, 12),
      new Date(2026, 7, 4, 12),
    ])).toBe(3);
  });

  test("recommends the weakest available skill without requiring the server", () => {
    const progressMap: Record<string, LessonProgressState> = {};
    const pack = buildGradePack("grade1");
    for (const lesson of pack.lessons as Array<{ id: string }>) progressMap[lesson.id] = progress("available", 0, 0, 0, lesson.id);
    const mastery = buildMasteryMap("grade1", progressMap);
    const mission = recommendedMission("grade1", progressMap);
    expect(mastery.length).toBeGreaterThan(1);
    expect(mission?.nextLessonId).toBeTruthy();
    expect(mission?.band).toBe("Starting");
  });

  test("service worker supports resumable packs, offline navigation, low-data mode, and deferred sync", () => {
    const worker = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
    expect(worker).toContain("DOWNLOAD_GRADE_PACK");
    expect(worker).toContain("await cache.match(asset)");
    expect(worker).toContain("PACK_PROGRESS");
    expect(worker).toContain("math-stars-sync");
    expect(worker).toContain("SET_LOW_DATA");
    expect(worker).toContain('caches.match("/offline")');
  });

  test("a downloaded page captures its hashed build files for a cold offline restart", () => {
    const html = `<link rel="stylesheet" href="/_next/static/css/app-123.css"><script src="/_next/static/chunks/app-456.js"></script><script src="https://other.example/tracker.js"></script>`;
    expect(discoverBuildAssets(html, "https://mathstars.example")).toEqual([
      "/_next/static/css/app-123.css",
      "/_next/static/chunks/app-456.js",
    ]);
    expect(readFileSync(new URL("../public/sw.js", import.meta.url), "utf8")).toContain("discoverBuildAssets(html)");
  });

  test("keeps donation requests out of the learner workspace", () => {
    const home = readFileSync(new URL("../src/components/game/HomeView.tsx", import.meta.url), "utf8");
    const page = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
    const access = readFileSync(new URL("../src/components/AccessGate.tsx", import.meta.url), "utf8");
    expect(home).not.toContain("Keep it free");
    expect(page).not.toContain("setView({ name: \"donations\" })");
    expect(access).toContain('pathname === "/support"');
    expect(access).toContain('pathname === "/transparency"');
  });

  test("includes Android, school, and U.S.-Liberia pilot distribution assets", () => {
    const workflow = readFileSync(new URL("../.github/workflows/distribution-packages.yml", import.meta.url), "utf8");
    const school = readFileSync(new URL("../school-kit/docker-compose.yml", import.meta.url), "utf8");
    const pilot = readFileSync(new URL("../docs/MATH_STARS_ANYWHERE_PILOT.md", import.meta.url), "utf8");
    expect(workflow).toContain("math-stars-school-image.tar.gz");
    expect(school).toContain("math-stars-school-data");
    expect(school).toContain("FAMILY_ACCESS_CODE");
    expect(school).toContain("MATH_STARS_ALLOW_LOCAL_HTTP");
    expect(pilot).toContain("families in Iowa");
    expect(pilot).toContain("families in Liberia");
    expect(pilot).toContain("Interrupted download");
  });
});

function lessonEvent(eventId: string, profileId: string, createdAt: string): OfflineEvent {
  return { eventId, profileId, type: "lesson-complete", createdAt, payload: { attemptId: eventId, lessonId: "g1-a", correct: 4, total: 5, timezoneOffsetMinutes: 0 } };
}

function progress(status: LessonProgressState["status"], stars: number, bestScore: number, attempts: number, lessonId = "lesson"): LessonProgressState {
  return { lessonId, status, stars, bestScore, attempts, lastScore: bestScore, completedAt: status === "completed" ? "2026-08-01T12:00:00.000Z" : null };
}
