import { describe, expect, test } from "bun:test";
import {
  ARCADE_GAME_KEYS,
  arcadeReward,
  arcadeLevel,
  arcadeSkillForGame,
  companionForCoins,
  createArcadeQuestions,
  pizzaSlicesEarned,
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

  test("builds all six games safely at every supported grade", () => {
    const levels = ["preschool", "grade1", "grade2", "grade3", "grade4"] as const;
    expect(ARCADE_GAME_KEYS).toHaveLength(6);
    for (const level of levels) {
      for (const gameKey of ARCADE_GAME_KEYS) {
        const questions = createArcadeQuestions(gameKey, level, 8, () => 0.42);
        expect(questions).toHaveLength(8);
        for (const question of questions) {
          expect(question.choices.length).toBeGreaterThanOrEqual(2);
          expect(new Set(question.choices).size).toBe(question.choices.length);
          expect(question.answerIndex).toBeGreaterThanOrEqual(0);
          expect(question.answerIndex).toBeLessThan(question.choices.length);
          expect(question.choices[question.answerIndex]).toBeTruthy();
        }
      }
    }
  });

  test("gives the new games distinct learning goals", () => {
    expect(arcadeSkillForGame("bubble-pop", "grade4")).toBe("Number bonds & place value");
    expect(arcadeSkillForGame("shape-safari", "grade3")).toBe("Geometry & measurement");
    expect(arcadeSkillForGame("pizza-party", "preschool")).toBe("Equal sharing");
    expect(arcadeSkillForGame("pizza-party", "grade4")).toBe("Fractions");
  });

  test("keeps Grade 2 Shape Safari on shapes, arrays, and equal partitions", () => {
    const questions = createArcadeQuestions("shape-safari", "grade2", 9, () => 0.42);
    expect(questions.some((question) => question.prompt.includes("sides"))).toBe(true);
    expect(questions.some((question) => question.prompt.includes("array"))).toBe(true);
    expect(questions.some((question) => question.prompt.includes("equal parts"))).toBe(true);
    expect(questions.every((question) => !question.prompt.toLowerCase().includes("perimeter"))).toBe(true);
  });

  test("keeps perimeter practice in Grade 3 Shape Safari", () => {
    const questions = createArcadeQuestions("shape-safari", "grade3", 4, () => 0.42);
    expect(questions.some((question) => question.prompt.toLowerCase().includes("perimeter"))).toBe(true);
  });

  test("shows no earned pizza slices before the first answer", () => {
    expect(pizzaSlicesEarned(0, 8)).toBe(0);
    expect(pizzaSlicesEarned(1, 8)).toBe(1);
    expect(pizzaSlicesEarned(8, 8)).toBe(8);
  });
});
