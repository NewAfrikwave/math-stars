import { describe, expect, test } from "bun:test";
import { createArcadeQuestions, evaluateArcadeAnswer, parseArcadeQuestions, publicQuestion } from "../src/lib/arcade";
import { arcadeQuestionSpeech } from "../src/lib/arcade-voice";
import { checkPizzaPlacements, makePizzaChallenge, movePizzaSlice, pizzaExplanation, pizzaPlateCounts, pizzaTarget, validPizzaChallenge, validPizzaPlacements } from "../src/lib/pizza-party";

const levels = ["preschool", "grade1", "grade2", "grade3", "grade4"] as const;

describe("hands-on Pizza Party", () => {
  for (const level of levels) {
    test(`${level}: valid, solvable orders and authoritative arrangement scoring`, () => {
      for (const random of [0, 0.2, 0.5, 0.99]) {
        const questions = createArcadeQuestions("pizza-party", level, 10, () => random);
        expect(parseArcadeQuestions(JSON.stringify(questions))).toEqual(questions);
        for (const question of questions) {
          const p = question.pizza!;
          expect(validPizzaChallenge(p)).toBe(true);
          const target = pizzaTarget(p);
          const arrangement = Array.from({ length: p.slices }, (_, index) => p.mode === "share" ? index % p.plates : index < target ? 0 : -1);
          expect(checkPizzaPlacements(p, arrangement)).toBe(true);
          const result = evaluateArcadeAnswer(question, { pizzaPlacements: arrangement, choiceIndex: -100 });
          expect(result).toMatchObject({ correct: true, choiceIndex: question.answerIndex, pizzaPlacements: arrangement });
          expect(evaluateArcadeAnswer(question, { pizzaPlacements: Array(p.slices).fill(-1), choiceIndex: question.answerIndex })?.correct).toBe(false);
          expect(evaluateArcadeAnswer(question, result!)?.correct).toBe(true); // offline reconciliation
          expect(question.choices[question.answerIndex]).toBe(String(target)); // older clients
          expect(publicQuestion(question)).not.toHaveProperty("answerIndex");
          expect(publicQuestion(question).pizza).toEqual(p);
        }
      }
    });
  }

  test("rejects malformed or excessive placement payloads", () => {
    const q = createArcadeQuestions("pizza-party", "preschool", 5, () => 0.5)[0];
    for (const value of [null, "0,1", [], Array(1000).fill(0), Array(q.pizza!.slices).fill(0.5), Array(q.pizza!.slices).fill(9), Array(q.pizza!.slices).fill("1"), Array(q.pizza!.slices).fill(-2)]) {
      expect(validPizzaPlacements(q.pizza!, value)).toBe(false);
      expect(evaluateArcadeAnswer(q, { pizzaPlacements: value })).toBeNull();
    }
  });

  test("requires every friend to receive the same number, not just the first plate", () => {
    const p = makePizzaChallenge("grade1", 1, () => 0.5);
    expect(p).toMatchObject({ slices: 6, plates: 3 });
    expect(checkPizzaPlacements(p, [0, 0, 1, 1, 1, 2])).toBe(false);
    expect(checkPizzaPlacements(p, [0, 0, 1, 1, 2, -1])).toBe(false);
    expect(checkPizzaPlacements(p, [2, 0, 1, 2, 1, 0])).toBe(true);
  });

  test("Grade 3 varies fractions rather than repeating one-half", () => {
    const questions = createArcadeQuestions("pizza-party", "grade3", 8, () => 0.5);
    expect(new Set(questions.map((q) => `${q.pizza!.numerator}/${q.pizza!.denominator}`)).size).toBe(6);
  });

  test("Grade 4 alternates fraction addition and subtraction", () => {
    const add = makePizzaChallenge("grade4", 0, () => 0.5);
    const subtract = makePizzaChallenge("grade4", 1, () => 0.5);
    expect(add.operation).toBe("add"); expect(subtract.operation).toBe("subtract");
    expect(pizzaTarget(add)).toBe(add.numerator + add.secondNumerator);
    expect(pizzaTarget(subtract)).toBe(subtract.numerator - subtract.secondNumerator);
  });

  test("moving and returning slices is immutable and conserves the pizza", () => {
    const p = makePizzaChallenge("preschool", 0, () => 0.5);
    const original = Array(p.slices).fill(-1);
    const served = movePizzaSlice(p, original, 1, 0);
    expect(original.every((v) => v === -1)).toBe(true);
    expect(pizzaPlateCounts(p, served)).toEqual([1, 0]);
    expect(movePizzaSlice(p, served, 1, -1)).toEqual(original);
    expect(movePizzaSlice(p, served, 99, 0)).toBe(served);
    expect(movePizzaSlice(p, served, 0, 99)).toBe(served);
  });

  test("legacy saved rounds and older clients can still submit answer choices", () => {
    const q = createArcadeQuestions("pizza-party", "grade3", 5, () => 0.5)[0];
    const { pizza: _pizza, ...oldQuestion } = q;
    expect(evaluateArcadeAnswer(oldQuestion, { choiceIndex: oldQuestion.answerIndex })?.correct).toBe(true);
    expect(evaluateArcadeAnswer(q, { choiceIndex: q.answerIndex })?.correct).toBe(true);
    expect(evaluateArcadeAnswer(oldQuestion, { pizzaPlacements: [0] })).toBeNull();
    for (const choice of [NaN, -1, 999, 0.5, "0"]) expect(evaluateArcadeAnswer(oldQuestion, { choiceIndex: choice })).toBeNull();
  });

  test("malformed saved 3D tasks fail closed", () => {
    const q = createArcadeQuestions("pizza-party", "grade3", 5, () => 0.5)[0];
    for (const patch of [{ slices: 999 }, { denominator: 0 }, { plates: 0 }, { numerator: 100 }, { version: 2 }]) {
      expect(parseArcadeQuestions(JSON.stringify([{ ...q, pizza: { ...q.pizza, ...patch } }]))).toBeNull();
    }
  });

  test("narration describes interaction, without reading unused multiple-choice answers", () => {
    const q = createArcadeQuestions("pizza-party", "preschool", 5, () => 0.5)[0];
    expect(arcadeQuestionSpeech(publicQuestion(q))).toContain("Pick a slice");
    expect(arcadeQuestionSpeech(publicQuestion(q))).not.toContain("Your choices");
    expect(pizzaExplanation(q.pizza!, true)).toContain("Fair sharing!");
  });
});
