import { describe, expect, test } from "bun:test";
import type { RewardGoal } from "@prisma/client";
import { domainsForLevel, rewardMission } from "../src/lib/rewards";

function goal(overrides: Partial<RewardGoal> = {}): RewardGoal {
  return {
    id: "reward-1",
    studentId: "learner-1",
    title: "Choose a toy",
    emoji: "🧸",
    description: null,
    targetType: "lessons",
    targetValue: 3,
    startValue: 4,
    domainId: null,
    status: "active",
    earnedAt: null,
    claimedAt: null,
    createdAt: new Date("2026-08-04T00:00:00Z"),
    updatedAt: new Date("2026-08-04T00:00:00Z"),
    ...overrides,
  };
}

describe("parent-set reward missions", () => {
  test("counts only lessons completed after a reward is created", () => {
    const mission = rewardMission(goal(), {
      totalStars: 20,
      completedLessonIds: ["one", "two", "three", "four", "five", "six"],
      level: "grade3",
    });
    expect(mission.currentValue).toBe(2);
    expect(mission.remaining).toBe(1);
    expect(mission.status).toBe("active");
  });

  test("marks a star goal earned only after its new-star target is reached", () => {
    const mission = rewardMission(goal({ targetType: "stars", targetValue: 10, startValue: 12 }), {
      totalStars: 22,
      completedLessonIds: [],
      level: "grade3",
    });
    expect(mission.currentValue).toBe(10);
    expect(mission.percent).toBe(100);
    expect(mission.status).toBe("earned");
  });

  test("uses the learner's actual topic lessons for a topic reward", () => {
    const domain = domainsForLevel("preschool")[0];
    const completedLessonIds = domain.lessons.map((lesson) => lesson.id);
    const mission = rewardMission(goal({ targetType: "topic", domainId: domain.id }), {
      totalStars: 0,
      completedLessonIds,
      level: "preschool",
    });
    expect(mission.domainTitle).toBe(domain.title);
    expect(mission.currentValue).toBe(domain.lessons.length);
    expect(mission.status).toBe("earned");
  });
});
