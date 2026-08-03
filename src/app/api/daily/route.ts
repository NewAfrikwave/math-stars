import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStudent, getProfileId } from "@/lib/student";

// POST /api/daily
// Body: { correct, total }
// Records today's daily challenge (one per calendar day) and updates the streak.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  const correctRaw = Math.floor(Number(body.correct ?? 0));
  const total = Math.max(1, Math.floor(Number(body.total ?? 1)));
  const correct = Math.min(total, Math.max(0, correctRaw));
  const score = Math.round((correct / total) * 100);

  const student = await getStudent(getProfileId(req));
  const today = new Date().toISOString().slice(0, 10);

  // upsert the daily row
  const existing = await db.dailyChallenge.findUnique({
    where: { studentId_dateKey: { studentId: student.id, dateKey: today } },
  });
  if (existing) {
    return NextResponse.json({ ok: true, alreadyDone: true, score: existing.score });
  }
  await db.dailyChallenge.create({
    data: { studentId: student.id, dateKey: today, score, correct, total },
  });

  // update streak: if lastPlayedAt was yesterday, +1; if today, keep; else reset to 1
  const now = new Date();
  const last = student.lastPlayedAt;
  let streak = student.streak;
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (!last || !sameDay(last, now)) {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (last && sameDay(last, yesterday)) {
      streak = streak + 1;
    } else {
      streak = 1;
    }
  }
  await db.student.update({
    where: { id: student.id },
    data: { streak, lastPlayedAt: now },
  });

  // Log activity event for the parent timeline.
  await db.activityEvent.create({
    data: {
      studentId: student.id,
      type: "daily",
      title: "Daily Challenge",
      emoji: "⚡",
      score,
      correct,
      total,
    },
  }).catch(() => {});

  return NextResponse.json({ ok: true, score, streak });
}

// GET /api/daily — returns recent daily challenge history
export async function GET(req: Request) {
  const student = await getStudent(getProfileId(req));
  const rows = await db.dailyChallenge.findMany({
    where: { studentId: student.id },
    orderBy: { dateKey: "desc" },
    take: 30,
  });
  return NextResponse.json({
    history: rows.map((r) => ({ dateKey: r.dateKey, score: r.score, correct: r.correct, total: r.total })),
  });
}
