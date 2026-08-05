import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { latestCompletionDate, streakAfterCompletion } from "../src/lib/progress-save";
import { progressAttemptId } from "../src/lib/attempt-id";
import { correctAnswerPraise } from "../src/lib/celebrations";
import { resolveSubmittedAnswer } from "../src/lib/answer-submit";
import type { NumberProblem, MultipleChoiceProblem } from "../src/lib/types";
import { tutorFallback } from "../src/lib/tutor-fallback";
import { tutorLearnerContext, tutorSystemPrompt } from "../src/lib/tutor-context";
import { pipCelebrationMotion } from "../src/lib/celebration-motion";

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

  test("provides spoken correct-answer praise for younger and older learners", () => {
    expect(correctAnswerPraise(true, 0, 0, "Brielle")).toContain("Brielle");
    expect(correctAnswerPraise(false, 0, 0, "Feodora")).toBe("Well done, Feodora! Your careful thinking paid off!");
    expect(correctAnswerPraise(false, 1, 1, "Feodora")).toContain("Feodora");
  });

  test("never grades a typed answer using the Check button click event", () => {
    const problem: NumberProblem = {
      id: "typed",
      lessonId: "mult-concept",
      prompt: "What is 5 × 2?",
      answerType: "number",
      answer: 10,
    };
    const clickEvent = { type: "click", currentTarget: {} };
    expect(resolveSubmittedAnswer(problem, 10, clickEvent)).toBe(10);
  });

  test("still accepts immediate multiple-choice answers", () => {
    const problem: MultipleChoiceProblem = {
      id: "choice",
      lessonId: "mult-concept",
      prompt: "Choose ten",
      answerType: "multiple-choice",
      choices: ["8", "10"],
      correctIndex: 1,
    };
    expect(resolveSubmittedAnswer(problem, null, 1)).toBe(1);
  });

  test("Pip has a useful local response when the tutor provider is unavailable", () => {
    expect(tutorFallback("What is 5 times 2?")).toContain("5 × 2");
    expect(tutorFallback("Help me with fractions")).toContain("pizza");
  });

  test("Pip receives distinct, age-appropriate instructions for every learner level", () => {
    const levels = ["preschool", "grade1", "grade2", "grade3", "grade4"] as const;
    const contexts = levels.map((level) => tutorLearnerContext(level));

    expect(new Set(contexts).size).toBe(levels.length);
    expect(contexts[0]).toContain("preschool");
    expect(contexts[1]).toContain("1st-grade");
    expect(contexts[2]).toContain("2nd-grade");
    expect(contexts[3]).toContain("3rd-grade");
    expect(contexts[4]).toContain("4th-grade");
    for (const level of levels) {
      expect(tutorSystemPrompt(level, "\nLesson context")).toContain(tutorLearnerContext(level));
      expect(tutorSystemPrompt(level, "\nLesson context")).toContain("Lesson context");
    }
  });

  test("the learning-tools modal uses a focus-trapping dialog and restores its opener", () => {
    const source = readFileSync(new URL("../src/components/game/PracticeToolsDialog.tsx", import.meta.url), "utf8");
    expect(source).toContain("<Dialog open={open}");
    expect(source).toContain("onCloseAutoFocus");
    expect(source).toContain("returnFocusRef.current?.focus()");
  });

  test("Pip stays still when the learner requests reduced motion", () => {
    const reduced = pipCelebrationMotion(true);
    const animated = pipCelebrationMotion(false);
    expect(reduced.animate).toEqual({ y: 0, rotate: 0, scale: 1 });
    expect("repeat" in reduced.transition).toBe(false);
    expect(animated.transition.repeat).toBe(Infinity);
  });
});
