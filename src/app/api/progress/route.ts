import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStudentForRequest } from "@/lib/student";
import { findLesson } from "@/lib/curriculum";
import { PRESCHOOL_CURRICULUM } from "@/lib/preschool";
import { GRADE1_CURRICULUM } from "@/lib/grade1";
import { GRADE2_CURRICULUM } from "@/lib/grade2";
import { GRADE4_CURRICULUM } from "@/lib/grade4";
import { getCurrentRewardMission } from "@/lib/reward-server";
import { saveProgressAttempt } from "@/lib/progress-save";
import { progressAttemptId } from "@/lib/attempt-id";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.lessonId !== "string") {
    return NextResponse.json({ error: "lessonId is required" }, { status: 400 });
  }
  const attemptId = progressAttemptId(body.attemptId);
  if (!attemptId) {
    return NextResponse.json({ error: "valid attemptId is required" }, { status: 400 });
  }

  const lessonId = body.lessonId as string;
  const correctRaw = Math.floor(Number(body.correct ?? 0));
  const total = Math.max(1, Math.floor(Number(body.total ?? 1)));
  const correct = Math.min(total, Math.max(0, correctRaw));
  const score = Math.round((correct / total) * 100);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0;
  const difficulty = body.difficulty === "easy" || body.difficulty === "challenge" ? body.difficulty : null;
  const student = await getStudentForRequest(req);
  const foundLesson = findLessonAny(lessonId);
  if (!foundLesson) return NextResponse.json({ error: "unknown lesson" }, { status: 400 });
  if (foundLesson.level !== student.level) {
    return NextResponse.json({ error: "lesson is not in this learner's grade" }, { status: 403 });
  }

  const result = await saveProgressAttempt({
    studentId: student.id,
    level: student.level,
    lessonId,
    title: foundLesson.lesson.title,
    emoji: foundLesson.lesson.emoji,
    correct,
    total,
    score,
    stars,
    difficulty,
    attemptId,
  });
  if (result.kind === "error") {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  if (result.kind === "duplicate") {
    return responseForExistingAttempt(student.id, result.event);
  }

  const reward = await getCurrentRewardMission(student.id);
  return NextResponse.json({
    ok: true,
    lessonId,
    stars: result.newStars,
    sessionStars: stars,
    score,
    bestScore: result.newBest,
    attempts: result.row.attempts,
    totalStars: result.totalStars,
    streak: result.streak,
    newlyEarned: result.newlyEarned,
    reward,
    passed: result.passed,
    duplicate: false,
  });
}

async function responseForExistingAttempt(studentId: string, event: {
  studentId: string;
  lessonId: string | null;
  score: number;
  correct: number;
  total: number;
  earnedAchievementIds?: string | null;
}) {
  if (event.studentId !== studentId) {
    return NextResponse.json({ error: "attempt id already used" }, { status: 409 });
  }
  const [student, progress, reward] = await Promise.all([
    db.student.findUniqueOrThrow({ where: { id: studentId } }),
    event.lessonId ? db.lessonProgress.findUnique({ where: { studentId_lessonId: { studentId, lessonId: event.lessonId } } }) : null,
    getCurrentRewardMission(studentId),
  ]);
  const sessionStars = event.score >= 90 ? 3 : event.score >= 70 ? 2 : event.score >= 50 ? 1 : 0;
  const newlyEarned = parseAchievementIds(event.earnedAchievementIds);
  return NextResponse.json({
    ok: true,
    lessonId: event.lessonId,
    stars: progress?.stars ?? sessionStars,
    sessionStars,
    score: event.score,
    bestScore: progress?.bestScore ?? event.score,
    attempts: progress?.attempts ?? 1,
    totalStars: student.totalStars,
    streak: student.streak,
    newlyEarned,
    reward,
    passed: event.score >= 70,
    duplicate: true,
  });
}

function parseAchievementIds(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function findLessonAny(lessonId: string) {
  const grade3 = findLesson(lessonId)?.lesson;
  if (grade3) return { level: "grade3", lesson: grade3 };
  const groups = [
    { level: "preschool", domains: PRESCHOOL_CURRICULUM },
    { level: "grade1", domains: GRADE1_CURRICULUM },
    { level: "grade2", domains: GRADE2_CURRICULUM },
    { level: "grade4", domains: GRADE4_CURRICULUM },
  ];
  for (const group of groups) {
    const lesson = group.domains.flatMap((domain) => domain.lessons).find((item) => item.id === lessonId);
    if (lesson) return { level: group.level, lesson };
  }
  return null;
}
