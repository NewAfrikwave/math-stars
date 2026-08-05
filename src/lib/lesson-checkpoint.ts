import type { Difficulty, LessonCheckpointState, Problem } from "@/lib/types";

const MAX_PROBLEMS = 20;
const MAX_JSON_LENGTH = 100_000;

export interface CheckpointInput {
  lessonId: string;
  attemptId: string;
  difficulty: Difficulty | null;
  problems: Problem[];
  nextIndex: number;
  correctCount: number;
}

export function parseCheckpointInput(value: unknown): CheckpointInput | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  const lessonId = typeof body.lessonId === "string" ? body.lessonId : "";
  const attemptId = typeof body.attemptId === "string" ? body.attemptId : "";
  const difficulty = body.difficulty === "easy" || body.difficulty === "challenge" ? body.difficulty : null;
  const problems = Array.isArray(body.problems) ? body.problems : [];
  const nextIndex = Number(body.nextIndex);
  const correctCount = Number(body.correctCount);
  if (!lessonId || attemptId.length < 12 || problems.length < 1 || problems.length > MAX_PROBLEMS) return null;
  if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex > problems.length) return null;
  if (!Number.isInteger(correctCount) || correctCount < 0 || correctCount > nextIndex) return null;
  if (!problems.every((problem) => isProblemForLesson(problem, lessonId))) return null;
  if (JSON.stringify(problems).length > MAX_JSON_LENGTH) return null;
  return { lessonId, attemptId, difficulty, problems: problems as Problem[], nextIndex, correctCount };
}

export function restoreCheckpoint(row: {
  lessonId: string;
  attemptId: string;
  difficulty: string | null;
  problemsJson: string;
  nextIndex: number;
  correctCount: number;
  total: number;
  updatedAt: Date;
}): LessonCheckpointState | null {
  try {
    const problems: unknown = JSON.parse(row.problemsJson);
    const parsed = parseCheckpointInput({
      lessonId: row.lessonId,
      attemptId: row.attemptId,
      difficulty: row.difficulty,
      problems,
      nextIndex: row.nextIndex,
      correctCount: row.correctCount,
    });
    if (!parsed || parsed.problems.length !== row.total) return null;
    return {
      ...parsed,
      difficulty: parsed.difficulty ?? undefined,
      total: parsed.problems.length,
      updatedAt: row.updatedAt.toISOString(),
    };
  } catch {
    return null;
  }
}

function isProblemForLesson(value: unknown, lessonId: string) {
  if (!value || typeof value !== "object") return false;
  const problem = value as Record<string, unknown>;
  return typeof problem.id === "string"
    && problem.id.length > 0
    && problem.lessonId === lessonId
    && typeof problem.prompt === "string"
    && typeof problem.answerType === "string";
}
