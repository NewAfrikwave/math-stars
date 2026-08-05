import { describe, expect, test } from "bun:test";
import { decideCheckpointWrite } from "../src/lib/checkpoint-order";

const attemptId = "attempt-123456789";

describe("checkpoint write ordering", () => {
  test("never recreates a checkpoint after the same attempt completed", () => {
    expect(decideCheckpointWrite({
      completedAttempt: true,
      existing: null,
      incoming: { attemptId, nextIndex: 4, correctCount: 3 },
    })).toBe("completed");
  });

  test("ignores an older request that arrives after a newer answer", () => {
    expect(decideCheckpointWrite({
      completedAttempt: false,
      existing: { attemptId, nextIndex: 4, correctCount: 3 },
      incoming: { attemptId, nextIndex: 3, correctCount: 2 },
    })).toBe("stale");
  });

  test("accepts a network retry of the latest saved position as a duplicate", () => {
    expect(decideCheckpointWrite({
      completedAttempt: false,
      existing: { attemptId, nextIndex: 4, correctCount: 3 },
      incoming: { attemptId, nextIndex: 4, correctCount: 3 },
    })).toBe("duplicate");
  });

  test("accepts exactly one monotonic answer at a time", () => {
    expect(decideCheckpointWrite({
      completedAttempt: false,
      existing: { attemptId, nextIndex: 3, correctCount: 2 },
      incoming: { attemptId, nextIndex: 4, correctCount: 3 },
    })).toBe("write");
    expect(decideCheckpointWrite({
      completedAttempt: false,
      existing: { attemptId, nextIndex: 3, correctCount: 2 },
      incoming: { attemptId, nextIndex: 5, correctCount: 3 },
    })).toBe("invalid");
  });
});
