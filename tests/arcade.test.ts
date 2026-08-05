import { describe, expect, test } from "bun:test";
import {
  arcadeReward,
  arcadeLevel,
  arcadeSkillForGame,
  companionForCoins,
  createArcadeQuestions,
  publicQuestion,
  summarizeArcadeSkills,
} from "../src/lib/arcade";

describe("math adventure arcade", () => {
  test("keeps answer keys out of learner-facing questions", () => {
    const question = createArcadeQuestions("star-sprint", "grade3", 5, () => 0.42)[0];
    expect(question.answerIndex).toBeNumber();
    expect(publicQuestion(question)).not.toHaveProperty("answerIndex");
  });

  test("creates grade-aware multiplication missions", () => {
    const question = createArcadeQuestions("rocket-builder", "grade4", 5, () => 0.5)[0];
    expect(question.prompt).toContain("×");
    expect(question.helper).toContain("equal groups");
  });

  test("awards the daily bonus and perfect-round bonus once requested", () => {
    expect(arcadeReward(8, 8, true)).toEqual({ score: 100, playCoins: 26, dailyBonus: 10, totalCoins: 36 });
    expect(arcadeReward(6, 8, false)).toEqual({ score: 75, playCoins: 17, dailyBonus: 0, totalCoins: 17 });
  });

  test("falls back to Pip when a saved companion is still locked", () => {
    expect(companionForCoins("orbit", 249).id).toBe("pip");
    expect(companionForCoins("orbit", 250).id).toBe("orbit");
  });

  test("labels rocket skills by grade", () => {
    expect(arcadeSkillForGame("rocket-builder", "grade1")).toBe("Addition");
    expect(arcadeSkillForGame("rocket-builder", "grade3")).toBe("Multiplication");
  });

  test("falls back to third-grade arcade content for an unknown saved level", () => {
    expect(arcadeLevel("unknown-grade")).toBe("grade3");
  });

  test("builds a parent skill report with weighted accuracy and best score", () => {
    const report = summarizeArcadeSkills([
      { gameKey: "star-sprint", correctCount: 4, total: 8 },
      { gameKey: "star-sprint", correctCount: 7, total: 8 },
      { gameKey: "rocket-builder", correctCount: 6, total: 8 },
    ], "grade3");
    const sprint = report.find((item) => item.gameKey === "star-sprint");
    const treasure = report.find((item) => item.gameKey === "treasure-match");
    expect(sprint).toMatchObject({ plays: 2, correctAnswers: 11, totalAnswers: 16, accuracy: 69, bestScore: 88 });
    expect(treasure).toMatchObject({ plays: 0, accuracy: 0, bestScore: 0 });
  });
});
