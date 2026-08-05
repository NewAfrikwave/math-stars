import { describe, expect, test } from "bun:test";
import { canContinueAfterCheckpoint, checkpointClientOutcome, persistedAttemptScore } from "../src/lib/checkpoint-client";
import { decideCheckpointWrite } from "../src/lib/checkpoint-order";

describe("cross-device checkpoint reconciliation", () => {
  test("stops an older device when another device completed the shared attempt", () => {
    const serverDecision = decideCheckpointWrite({
      completedAttempt: true,
      existing: null,
      incoming: { attemptId: "shared-attempt-123", nextIndex: 4, correctCount: 3 },
    });
    const response = { completed: serverDecision === "completed" };
    const clientOutcome = checkpointClientOutcome(response);

    expect(clientOutcome).toBe("completed");
    expect(canContinueAfterCheckpoint(clientOutcome)).toBe(false);
    expect(persistedAttemptScore(
      { correct: 5, total: 6 },
      { correct: 3, total: 6 },
    )).toEqual({ correct: 5, total: 6 });
  });

  test("allows the quiz to continue after an ordinary durable save", () => {
    const clientOutcome = checkpointClientOutcome({ completed: false });
    expect(clientOutcome).toBe("saved");
    expect(canContinueAfterCheckpoint(clientOutcome)).toBe(true);
  });
});
