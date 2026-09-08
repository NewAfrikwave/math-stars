import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { ORCHARD_TOTAL, checkOrchardSolo, moveOrchardApple, orchardDemonstration, orchardFeedback, orchardIsEqual, validOrchardCounts } from "../src/lib/equal-groups-lesson";

describe("hands-on Equal Groups lesson", () => {
  test("demonstration places one apple per step, filling each group to four", () => {
    for (let step = 0; step <= ORCHARD_TOTAL; step++) {
      const counts = orchardDemonstration(step);
      expect(counts.reduce((sum, n) => sum + n, 0)).toBe(step);
      expect(counts.every((n) => n >= 0 && n <= 4)).toBe(true);
      expect(validOrchardCounts(counts)).toBe(true);
    }
    expect(orchardDemonstration(4)).toEqual([4, 0, 0]);
    expect(orchardDemonstration(8)).toEqual([4, 4, 0]);
    expect(orchardDemonstration(12)).toEqual([4, 4, 4]);
    expect(orchardDemonstration(Infinity)).toEqual([0, 0, 0]);
    expect(orchardDemonstration(-20)).toEqual([0, 0, 0]);
    expect(orchardDemonstration(99)).toEqual([4, 4, 4]);
  });
  test("moves conserve apples and do not mutate undo history", () => {
    const empty = [0, 0, 0];
    const added = moveOrchardApple(empty, 0, 1);
    expect(empty).toEqual([0, 0, 0]);
    expect(added).toEqual([1, 0, 0]);
    expect(moveOrchardApple(added, 0, -1)).toEqual(empty);
    expect(moveOrchardApple(empty, 0, -1)).toBe(empty);
    const full = [4, 4, 4];
    expect(moveOrchardApple(full, 0, 1)).toBe(full);
    expect(moveOrchardApple(empty, -1, 1)).toBe(empty);
    expect(moveOrchardApple(empty, 3, 1)).toBe(empty);
    expect(moveOrchardApple(empty, 0.5, 1)).toBe(empty);
  });
  test("unequal groups cannot pass just because the total is correct", () => {
    expect(orchardIsEqual([4, 4, 4])).toBe(true);
    for (const counts of [[12, 0, 0], [3, 4, 5], [4, 4, 3], [4, 4], [4, 4, 4, 0]]) expect(orchardIsEqual(counts)).toBe(false);
    expect(orchardFeedback([3, 4, 5])).toContain("Not quite yet");
    expect(orchardFeedback([4, 4, 4])).toContain("3 × 4 = 12");
  });
  test("rejects malformed counts", () => {
    for (const counts of [null, "4,4,4", [NaN, 0, 0], [-1, 0, 0], [0.5, 0, 0], [13, 0, 0], ["4", 4, 4]]) expect(validOrchardCounts(counts)).toBe(false);
  });
  test("the independent question has a different answer and strict input checking", () => {
    expect(checkOrchardSolo("8")).toBe(true);
    expect(checkOrchardSolo(" 8 ")).toBe(true);
    for (const answer of ["", "12", "4", "2", "8 apples", "8.5", "8e0", "-8"]) expect(checkOrchardSolo(answer)).toBe(false);
  });
  test("pilot is opt-in by lesson, grade, and existing feature setting; saved practice is unchanged", () => {
    const lesson = readFileSync(new URL("../src/components/game/LessonView.tsx", import.meta.url), "utf8");
    expect(lesson).toContain('lessonId === "mult-concept" && level === "grade3" && siteSettings?.manipulativesEnabled !== false');
    expect(lesson).toContain('onPractice={() => setView({ name: "practice", lessonId, difficulty })}');
    const activity = readFileSync(new URL("../src/components/game/EqualGroupsLesson.tsx", import.meta.url), "utf8");
    expect(activity).not.toContain("profileFetch");
    expect(activity).not.toContain("saveProgress");
    expect(activity).toContain("return () => stop()");
    expect(activity).toContain("window.clearTimeout(timer)");
    expect(activity).toContain("Stop reading");
    expect(activity).toContain("Simple view");
    expect(activity).toContain('role="status"');
    expect(activity).toContain("nextButton.current?.focus");
    expect(activity).toContain("full ? checkButton.current : pickButton.current");
    expect(lesson).toContain("key={currentProfileId}");
  });
});
