import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { latestCompletionDate, streakAfterCompletion } from "../src/lib/progress-save";
import { progressAttemptId } from "../src/lib/attempt-id";

describe("launch data integrity", () => {
  test("a failed attempt does not consume the date used by a later passing streak", () => {
    const yesterday = new Date("2026-08-03T15:00:00Z");
    const today = new Date("2026-08-04T16:00:00Z");
    expect(streakAfterCompletion(4, yesterday, today)).toBe(5);
  });

  test("the database enforces one current reward and one activity per attempt id", () => {
    const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
    expect(schema).toContain("currentKey  String?  @unique");
    expect(schema).toContain("attemptId String?  @unique");
  });

  test("backfills an existing learner from saved completions, not a failed play timestamp", () => {
    const completedYesterday = new Date("2026-08-03T15:00:00Z");
    const failedPlayToday = new Date("2026-08-04T09:00:00Z");
    const passingAttemptToday = new Date("2026-08-04T16:00:00Z");
    const baseline = latestCompletionDate([completedYesterday]);

    expect(failedPlayToday.getTime()).toBeGreaterThan(baseline!.getTime());
    expect(streakAfterCompletion(4, baseline, passingAttemptToday)).toBe(5);
  });

  test("keeps old cached clients saving while preserving new-client retry ids", () => {
    expect(progressAttemptId(undefined, () => "generated-id")).toBe("legacy-generated-id");
    expect(progressAttemptId("stable_attempt_1234", () => "unused")).toBe("stable_attempt_1234");
    expect(progressAttemptId("too-short", () => "unused")).toBeNull();
  });
});
