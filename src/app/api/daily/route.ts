import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStudentForRequest } from "@/lib/student";
import { latestCompletionDate, streakAfterCompletion } from "@/lib/progress-save";
import { Prisma } from "@prisma/client";

// POST /api/daily
// Records today's daily challenge and advances the same successful-activity
// clock used by lesson completions.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  const correctRaw = Math.floor(Number(body.correct ?? 0));
  const total = Math.max(1, Math.floor(Number(body.total ?? 1)));
  const correct = Math.min(total, Math.max(0, correctRaw));
  const score = Math.round((correct / total) * 100);
  const requestedStudent = await getStudentForRequest(req);
  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10);

  let result;
  try {
    result = await db.$transaction(async (tx) => {
    const existing = await tx.dailyChallenge.findUnique({
      where: { studentId_dateKey: { studentId: requestedStudent.id, dateKey } },
    });
    if (existing) return { alreadyDone: true as const, score: existing.score, streak: requestedStudent.streak };

    const student = await tx.student.findUniqueOrThrow({ where: { id: requestedStudent.id } });
    const [latestLesson, latestDaily] = await Promise.all([
      tx.lessonProgress.findFirst({
        where: { studentId: student.id, completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
        select: { completedAt: true },
      }),
      tx.dailyChallenge.findFirst({
        where: { studentId: student.id },
        orderBy: { completedAt: "desc" },
        select: { completedAt: true },
      }),
    ]);
    const legacyCompletion = latestCompletionDate([latestLesson?.completedAt, latestDaily?.completedAt]);
    const lastCompletion = student.lastCompletedAt ?? legacyCompletion;
    const streak = streakAfterCompletion(student.streak, lastCompletion, now);

    await tx.dailyChallenge.create({
      data: { studentId: student.id, dateKey, score, correct, total, completedAt: now },
    });
    await tx.student.update({
      where: { id: student.id },
      data: { streak, lastPlayedAt: now, lastCompletedAt: now },
    });
    await tx.activityEvent.create({
      data: { studentId: student.id, type: "daily", title: "Daily Challenge", emoji: "⚡", score, correct, total },
    });
    return { alreadyDone: false as const, score, streak };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await db.dailyChallenge.findUnique({
        where: { studentId_dateKey: { studentId: requestedStudent.id, dateKey } },
      });
      if (existing) return NextResponse.json({ ok: true, alreadyDone: true, score: existing.score, streak: requestedStudent.streak });
    }
    throw error;
  }

  return NextResponse.json({ ok: true, ...result });
}

export async function GET(req: Request) {
  const student = await getStudentForRequest(req);
  const rows = await db.dailyChallenge.findMany({
    where: { studentId: student.id },
    orderBy: { dateKey: "desc" },
    take: 30,
  });
  return NextResponse.json({
    history: rows.map((row) => ({ dateKey: row.dateKey, score: row.score, correct: row.correct, total: row.total })),
  });
}
