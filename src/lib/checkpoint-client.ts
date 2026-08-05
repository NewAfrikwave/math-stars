export type CheckpointClientOutcome = "saved" | "completed";

export function checkpointClientOutcome(response: { completed?: boolean }): CheckpointClientOutcome {
  return response.completed ? "completed" : "saved";
}

/** A completed attempt must stop the current quiz instead of enabling Next. */
export function canContinueAfterCheckpoint(outcome: CheckpointClientOutcome | void) {
  return outcome !== "completed";
}

export function persistedAttemptScore(
  response: { correct?: number; total?: number },
  fallback: { correct: number; total: number },
) {
  const total = Number.isInteger(response.total) && (response.total ?? 0) > 0
    ? response.total!
    : fallback.total;
  const correct = Number.isInteger(response.correct)
    && (response.correct ?? -1) >= 0
    && (response.correct ?? 0) <= total
    ? response.correct!
    : fallback.correct;
  return { correct, total };
}
