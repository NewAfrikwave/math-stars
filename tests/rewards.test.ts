import { describe, expect, test } from "bun:test";
import type { RewardGoal } from "@prisma/client";
import { domainsForLevel, rewardMission, topicGoalBaseline } from "../src/lib/rewards";

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
    currentKey: "learner-1",
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

  test("excludes topic lessons completed before the reward was created", () => {
    const domain = domainsForLevel("preschool")[0];
    const completedLessonIds = domain.lessons.slice(0, 3).map((lesson) => lesson.id);
    const mission = rewardMission(goal({ targetType: "topic", domainId: domain.id, startValue: 2, targetValue: domain.lessons.length - 2 }), {
      totalStars: 0,
      completedLessonIds,
      level: "preschool",
    });
    expect(mission.domainTitle).toBe(domain.title);
    expect(mission.currentValue).toBe(1);
    expect(mission.targetValue).toBe(domain.lessons.length - 2);
    expect(mission.status).toBe("active");
  });

  test("earns a topic reward only after all remaining lessons are completed", () => {
    const domain = domainsForLevel("preschool")[0];
    const mission = rewardMission(goal({ targetType: "topic", domainId: domain.id, startValue: 2, targetValue: domain.lessons.length - 2 }), {
      totalStars: 0,
      completedLessonIds: domain.lessons.map((lesson) => lesson.id),
      level: "preschool",
    });
    expect(mission.currentValue).toBe(domain.lessons.length - 2);
    expect(mission.status).toBe("earned");
  });

  test("does not create a new topic goal for an already completed topic", () => {
    const domain = domainsForLevel("grade3")[0];
    const ids = domain.lessons.map((lesson) => lesson.id);
    expect(topicGoalBaseline(ids, ids)).toBeNull();
  });
});
