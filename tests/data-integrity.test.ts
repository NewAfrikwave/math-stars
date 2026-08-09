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
import { parseCheckpointInput, restoreCheckpoint } from "../src/lib/lesson-checkpoint";
import { retryOperation } from "../src/lib/retry-operation";

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

  test("arcade rounds have one active game slot and one idempotent attempt id", () => {
    const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
    expect(schema).toContain("attemptId    String   @unique");
    expect(schema).toContain("activeKey    String?  @unique");
    expect(schema).toContain("arcadeRuns ArcadeRun[]");
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

  test("the arcade initial load can recover from an API failure", () => {
    const source = readFileSync(new URL("../src/components/game/ArcadeView.tsx", import.meta.url), "utf8");
    expect(source).toContain("if (overviewLoading)");
    expect(source).toContain("The arcade could not open");
    expect(source).toContain("onClick={loadOverview}");
  });

  test("the public landing page presents all six Arcade games", () => {
    const source = readFileSync(new URL("../src/components/PublicLanding.tsx", import.meta.url), "utf8");
    for (const title of ["Rocket Builder", "Treasure Hunt", "Math Race", "Bubble Pop", "Shape Safari", "Pizza Party"]) {
      expect(source).toContain(`title: "${title}"`);
    }
    expect(source).toContain("six grade-aware games");
    expect(source).not.toContain("three exciting worlds");
  });

  test("lesson progress carries its actual practice time to Star Practice", () => {
    const studentSource = readFileSync(new URL("../src/lib/student.ts", import.meta.url), "utf8");
    const storeSource = readFileSync(new URL("../src/store/useGameStore.ts", import.meta.url), "utf8");
    expect(studentSource).toContain("lastPlayedAt: r.lastPlayedAt ? r.lastPlayedAt.toISOString() : null");
    expect(storeSource).toContain("lastPlayedAt: new Date().toISOString()");
  });

  test("duplicate arcade answers reconcile without being graded as wrong", () => {
    const viewSource = readFileSync(new URL("../src/components/game/ArcadeView.tsx", import.meta.url), "utf8");
    const answerRouteSource = readFileSync(new URL("../src/app/api/arcade/answer/route.ts", import.meta.url), "utf8");
    expect(viewSource).toContain("if (data.duplicate && data.run)");
    expect(viewSource.indexOf("if (data.duplicate && data.run)")).toBeLessThan(viewSource.indexOf("correct: Boolean(data.correct)"));
    expect(answerRouteSource).toContain("run: reconciledPayload(latestRun, questions)");
    expect(answerRouteSource).not.toContain("This round advanced on another device. Reload it to continue.");
  });

  test("the arcade feedback dialog traps focus and restores a useful target", () => {
    const source = readFileSync(new URL("../src/components/game/ArcadeView.tsx", import.meta.url), "utf8");
    expect(source).toContain("<Dialog open={Boolean(feedback)}>");
    expect(source).toContain("onOpenAutoFocus");
    expect(source).toContain("onCloseAutoFocus");
    expect(source).toContain("returnTarget?.isConnected");
    expect(source).toContain("[data-arcade-focus-target]");
  });

  test("Pip stays still when the learner requests reduced motion", () => {
    const reduced = pipCelebrationMotion(true);
    const animated = pipCelebrationMotion(false);
    expect(reduced.animate).toEqual({ y: 0, rotate: 0, scale: 1 });
    expect("repeat" in reduced.transition).toBe(false);
    expect(animated.transition.repeat).toBe(Infinity);
  });

  test("restores the exact generated questions and score from an unfinished lesson", () => {
    const problems: NumberProblem[] = [
      { id: "mult-concept-1", lessonId: "mult-concept", prompt: "What is 2 × 3?", answerType: "number", answer: 6 },
      { id: "mult-concept-2", lessonId: "mult-concept", prompt: "What is 4 × 3?", answerType: "number", answer: 12 },
    ];
    const restored = restoreCheckpoint({
      lessonId: "mult-concept",
      attemptId: "attempt_resume_1234",
      difficulty: "challenge",
      problemsJson: JSON.stringify(problems),
      nextIndex: 1,
      correctCount: 1,
      total: 2,
      updatedAt: new Date("2026-08-05T04:00:00Z"),
    });

    expect(restored?.problems).toEqual(problems);
    expect(restored?.nextIndex).toBe(1);
    expect(restored?.correctCount).toBe(1);
    expect(restored?.difficulty).toBe("challenge");
  });

  test("rejects checkpoints whose questions belong to another lesson", () => {
    const invalid = parseCheckpointInput({
      lessonId: "mult-concept",
      attemptId: "attempt_resume_1234",
      problems: [{ id: "other-1", lessonId: "fractions", prompt: "What is one half?", answerType: "number", answer: 1 }],
      nextIndex: 1,
      correctCount: 1,
    });
    expect(invalid).toBeNull();
  });

  test("completion clears the saved question checkpoint in the same transaction", () => {
    const progressSource = readFileSync(new URL("../src/lib/progress-save.ts", import.meta.url), "utf8");
    const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
    expect(progressSource).toContain("tx.lessonCheckpoint.deleteMany");
    expect(progressSource).toContain("where: { studentId: input.studentId, lessonId: input.lessonId, attemptId: input.attemptId }");
    expect(schema).toContain("@@unique([studentId, lessonId])");
    expect(schema).toContain("onDelete: Cascade");
  });

  test("automatically retries a temporary checkpoint save failure", async () => {
    let attempts = 0;
    const result = await retryOperation(async () => {
      attempts += 1;
      if (attempts < 3) throw new Error("temporary connection problem");
      return "saved";
    }, 2, async () => {});
    expect(result).toBe("saved");
    expect(attempts).toBe(3);
  });

  test("does not auto-finish a newly saved final answer as if it were a fresh resume", () => {
    const source = readFileSync(new URL("../src/components/game/PracticeSession.tsx", import.meta.url), "utf8");
    expect(source).toContain("const [checkpoint] = useState");
    expect(source).toContain("const [resumedAfterHydration] = useState");
    expect(source).toContain("resumeReadyToFinish={Boolean(resumedAfterHydration && checkpoint");
  });
});
