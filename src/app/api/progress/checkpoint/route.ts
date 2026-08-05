import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStudentForRequest } from "@/lib/student";
import { parseCheckpointInput } from "@/lib/lesson-checkpoint";
import { findLesson, isLessonAvailable } from "@/lib/curriculum";
import { findPsLesson, psIsLessonAvailable } from "@/lib/preschool";
import { findG1Lesson, isLessonAvailable as isG1LessonAvailable } from "@/lib/grade1";
import { findG2Lesson, isLessonAvailable as isG2LessonAvailable } from "@/lib/grade2";
import { findG4Lesson, isLessonAvailable as isG4LessonAvailable } from "@/lib/grade4";

export async function POST(req: Request) {
  const input = parseCheckpointInput(await req.json().catch(() => null));
  if (!input) return NextResponse.json({ error: "invalid lesson checkpoint" }, { status: 400 });

  const student = await getStudentForRequest(req);
  if (levelForLesson(input.lessonId) !== student.level) {
    return NextResponse.json({ error: "lesson is not in this learner's grade" }, { status: 403 });
  }
  const progressRows = await db.lessonProgress.findMany({
    where: { studentId: student.id },
    select: { lessonId: true, status: true },
  });
  const existing = progressRows.find((row) => row.lessonId === input.lessonId);
  const completed = (lessonId: string) => progressRows.some((row) => row.lessonId === lessonId && row.status === "completed");
  if (existing?.status === "locked" || (!existing && !isAvailableForLevel(student.level, input.lessonId, completed))) {
    return NextResponse.json({ error: "lesson is locked" }, { status: 403 });
  }

  const row = await db.$transaction(async (tx) => {
    // A learner has one active mission. Starting a different lesson replaces
    // the older unfinished set so the dashboard never offers stale work.
    await tx.lessonCheckpoint.deleteMany({
      where: { studentId: student.id, lessonId: { not: input.lessonId } },
    });
    const checkpoint = await tx.lessonCheckpoint.upsert({
      where: { studentId_lessonId: { studentId: student.id, lessonId: input.lessonId } },
      create: {
        studentId: student.id,
        lessonId: input.lessonId,
        attemptId: input.attemptId,
        difficulty: input.difficulty,
        problemsJson: JSON.stringify(input.problems),
        nextIndex: input.nextIndex,
        correctCount: input.correctCount,
        total: input.problems.length,
      },
      update: {
        attemptId: input.attemptId,
        difficulty: input.difficulty,
        problemsJson: JSON.stringify(input.problems),
        nextIndex: input.nextIndex,
        correctCount: input.correctCount,
        total: input.problems.length,
      },
    });
    await tx.lessonProgress.upsert({
      where: { studentId_lessonId: { studentId: student.id, lessonId: input.lessonId } },
      create: { studentId: student.id, lessonId: input.lessonId, status: "in-progress", lastPlayedAt: new Date() },
      update: { status: existing?.status === "completed" ? "completed" : "in-progress", lastPlayedAt: new Date() },
    });
    await tx.student.update({ where: { id: student.id }, data: { lastPlayedAt: new Date() } });
    return checkpoint;
  });

  return NextResponse.json({ ok: true, updatedAt: row.updatedAt.toISOString() });
}

function isAvailableForLevel(level: string, lessonId: string, completed: (lessonId: string) => boolean) {
  if (level === "preschool") return psIsLessonAvailable(lessonId, completed);
  if (level === "grade1") return isG1LessonAvailable(lessonId, completed);
  if (level === "grade2") return isG2LessonAvailable(lessonId, completed);
  if (level === "grade4") return isG4LessonAvailable(lessonId, completed);
  return isLessonAvailable(lessonId, completed);
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => null) as { lessonId?: unknown } | null;
  if (!body || typeof body.lessonId !== "string") {
    return NextResponse.json({ error: "lessonId is required" }, { status: 400 });
  }
  const student = await getStudentForRequest(req);
  await db.lessonCheckpoint.deleteMany({ where: { studentId: student.id, lessonId: body.lessonId } });
  return NextResponse.json({ ok: true });
}

function levelForLesson(lessonId: string) {
  if (findLesson(lessonId)) return "grade3";
  if (findPsLesson(lessonId)) return "preschool";
  if (findG1Lesson(lessonId)) return "grade1";
  if (findG2Lesson(lessonId)) return "grade2";
  if (findG4Lesson(lessonId)) return "grade4";
  return null;
}
