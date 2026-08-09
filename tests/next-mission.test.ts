import { describe, expect, test } from "bun:test";
import { chooseNextMission } from "../src/lib/next-mission";
import type { Domain, LessonProgressState } from "../src/lib/types";

const curriculum: Domain[] = [
  {
    id: "one",
    title: "First topic",
    emoji: "1",
    color: "",
    description: "",
    lessons: [
      { id: "available-first", title: "Available first", subtitle: "", emoji: "", teach: [], practiceCount: 1, generator: "test" },
    ],
  },
  {
    id: "two",
    title: "Second topic",
    emoji: "2",
    color: "",
    description: "",
    lessons: [
      { id: "continue-this", title: "Continue this", subtitle: "", emoji: "", teach: [], practiceCount: 1, generator: "test" },
    ],
  },
];

function progress(lessonId: string, status: LessonProgressState["status"]): LessonProgressState {
  return { lessonId, status, stars: 0, bestScore: 0, attempts: 1, lastScore: 50, completedAt: null };
}

describe("dashboard resume mission", () => {
  test("prioritizes an in-progress lesson over an earlier available lesson", () => {
    const selected = chooseNextMission(curriculum, {
      "available-first": progress("available-first", "available"),
      "continue-this": progress("continue-this", "in-progress"),
    });

    expect(selected.lesson.id).toBe("continue-this");
    expect(selected.returning).toBe(true);
  });

  test("resumes a checkpoint from a completed lesson without changing mastery", () => {
    const completed = progress("continue-this", "completed");
    const selected = chooseNextMission(curriculum, {
      "available-first": progress("available-first", "available"),
      "continue-this": completed,
    }, "continue-this");

    expect(selected.lesson.id).toBe("continue-this");
    expect(selected.returning).toBe(true);
    expect(completed.status).toBe("completed");
  });

  test("celebrates a completed grade and reviews the lowest-scoring lesson", () => {
    const selected = chooseNextMission(curriculum, {
      "available-first": { ...progress("available-first", "completed"), bestScore: 92, completedAt: "2026-08-08T12:00:00.000Z" },
      "continue-this": { ...progress("continue-this", "completed"), bestScore: 74, completedAt: "2026-08-08T13:00:00.000Z" },
    });

    expect(selected.gradeComplete).toBe(true);
    expect(selected.lesson.id).toBe("continue-this");
    expect(selected.returning).toBe(false);

    const locked = chooseNextMission(curriculum, {
      "available-first": progress("available-first", "locked"),
      "continue-this": progress("continue-this", "locked"),
    });
    expect(locked.gradeComplete).toBe(false);
  });

  test("uses the least-recently-practiced lesson when completed scores tie", () => {
    const selected = chooseNextMission(curriculum, {
      "available-first": { ...progress("available-first", "completed"), bestScore: 90, completedAt: "2026-08-01T12:00:00.000Z", lastPlayedAt: "2026-08-08T12:00:00.000Z" },
      "continue-this": { ...progress("continue-this", "completed"), bestScore: 90, completedAt: "2026-08-08T12:00:00.000Z", lastPlayedAt: "2026-08-03T12:00:00.000Z" },
    });

    expect(selected.gradeComplete).toBe(true);
    expect(selected.lesson.id).toBe("continue-this");
  });
});
