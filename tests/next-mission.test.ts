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
});
