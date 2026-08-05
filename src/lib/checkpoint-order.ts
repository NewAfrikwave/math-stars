export interface CheckpointPosition {
  attemptId: string;
  nextIndex: number;
  correctCount: number;
}

export type CheckpointWriteDecision = "write" | "duplicate" | "stale" | "invalid" | "completed";

/**
 * Checkpoint writes are append-only within an attempt. This keeps a delayed
 * request from moving a learner backwards after a newer answer was saved.
 */
export function decideCheckpointWrite({
  completedAttempt,
  existing,
  incoming,
}: {
  completedAttempt: boolean;
  existing: CheckpointPosition | null;
  incoming: CheckpointPosition;
}): CheckpointWriteDecision {
  if (completedAttempt) return "completed";

  if (!existing || existing.attemptId !== incoming.attemptId) {
    return incoming.nextIndex === 1 && incoming.correctCount >= 0 && incoming.correctCount <= 1
      ? "write"
      : "invalid";
  }

  if (incoming.nextIndex === existing.nextIndex && incoming.correctCount === existing.correctCount) return "duplicate";
  if (incoming.nextIndex <= existing.nextIndex) return "stale";
  if (incoming.nextIndex !== existing.nextIndex + 1) return "invalid";

  const correctAdvance = incoming.correctCount - existing.correctCount;
  return correctAdvance === 0 || correctAdvance === 1 ? "write" : "invalid";
}
