import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { arcadeFeedbackSpeech, arcadeQuestionSpeech, arcadeRoundSpeech } from "../src/lib/arcade-voice";
import { feedbackStatus, parseParentFeedback } from "../src/lib/parent-feedback";

describe("Arcade voice guidance", () => {
  test("reads the question, helper, and every answer choice", () => {
    expect(arcadeQuestionSpeech({
      prompt: "How many straight sides does this triangle have?",
      helper: "Trace around the shape with your finger.",
      choices: ["3", "4", "1", "6"],
    })).toBe("How many straight sides does this triangle have? Trace around the shape with your finger. Your choices are 3, 4, 1, or 6.");
  });

  test("uses named praise after a correct answer and calm coaching after a miss", () => {
    const praise = arcadeFeedbackSpeech({ correct: true, explanation: "A triangle has three sides.", youngerLearner: true, questionIndex: 0, correctCount: 0, studentName: "Brielle" });
    const retry = arcadeFeedbackSpeech({ correct: false, explanation: "Trace each side one time.", youngerLearner: true, questionIndex: 1, correctCount: 0, studentName: "Brielle" });
    expect(praise).toContain("Brielle");
    expect(praise).toContain("A triangle has three sides.");
    expect(retry).toContain("Brielle");
    expect(retry).toContain("Every try helps your math brain grow.");
    expect(retry).not.toMatch(/wrong|failed|bad/i);
  });

  test("celebrates the finished round with results and coins", () => {
    expect(arcadeRoundSpeech("Feodora", 7, 8, 24)).toContain("Feodora");
    expect(arcadeRoundSpeech("Feodora", 7, 8, 24)).toContain("7 out of 8");
    expect(arcadeRoundSpeech("Feodora", 7, 8, 24)).toContain("24 coins");
  });

  test("auto-reads every Arcade question and falls back immediately when offline", () => {
    const arcade = readFileSync(new URL("../src/components/game/ArcadeView.tsx", import.meta.url), "utf8");
    const tts = readFileSync(new URL("../src/hooks/use-tts.ts", import.meta.url), "utf8");
    expect(arcade).toContain("speak(questionSpeech");
    expect(arcade).toContain("speakImmediately(arcadeFeedbackSpeech");
    expect(arcade).toContain('label="Hear question"');
    expect(arcade).toContain("Turn Arcade voice off");
    expect(tts).toContain("if (!navigator.onLine)");
    expect(tts.indexOf("if (!navigator.onLine)")).toBeLessThan(tts.indexOf('fetch("/api/tts"'));
  });
});

describe("parent feedback", () => {
  test("accepts a privacy-safe structured report", () => {
    const parsed = parseParentFeedback({
      category: "bug",
      area: "arcade",
      gameKey: "shape-safari",
      learnerLevel: "grade2",
      pagePath: "/",
      message: "The question did not read aloud after reconnecting.",
      contactAllowed: true,
    });
    expect("data" in parsed && parsed.data).toMatchObject({
      category: "bug",
      area: "arcade",
      gameKey: "shape-safari",
      learnerLevel: "grade2",
      contactAllowed: true,
    });
  });

  test("rejects vague, oversized, or invalid reports", () => {
    expect(parseParentFeedback({ category: "bug", area: "arcade", message: "broken" })).toHaveProperty("error");
    expect(parseParentFeedback({ category: "complaint", area: "arcade", message: "This message has enough detail." })).toHaveProperty("error");
    expect(parseParentFeedback({ category: "bug", area: "arcade", message: "x".repeat(2_001) })).toHaveProperty("error");
    expect(feedbackStatus("closed")).toBeNull();
    expect(feedbackStatus("resolved")).toBe("resolved");
  });

  test("protects reports with the grown-up PIN and includes them in privacy controls", () => {
    const route = readFileSync(new URL("../src/app/api/feedback/route.ts", import.meta.url), "utf8");
    const adminRoute = readFileSync(new URL("../src/app/api/admin/feedback/route.ts", import.meta.url), "utf8");
    const familyData = readFileSync(new URL("../src/app/api/family-data/route.ts", import.meta.url), "utf8");
    const privacy = readFileSync(new URL("../src/app/privacy/page.tsx", import.meta.url), "utf8");
    expect(route).toContain("verifyPin(pinFrom(req), protectedProfile.parentPin)");
    expect(route).toContain('rateLimit(clientKey(req, "parent-feedback"), 10');
    expect(adminRoute).toContain("isAdminRequest(req)");
    expect(familyData).toContain("db.parentFeedback.findMany");
    expect(familyData).toContain("db.parentFeedback.deleteMany");
    expect(privacy).toContain("bug reports, suggestions, and general feedback");
  });
});
