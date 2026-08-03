import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pinFrom, verifyPin } from "@/lib/pin";

async function authorized(req: Request) {
  const protectedProfile = await db.student.findFirst({
    where: { NOT: { parentPin: null } },
    select: { parentPin: true },
  });
  return !!protectedProfile?.parentPin && verifyPin(pinFrom(req), protectedProfile.parentPin);
}

export async function GET(req: Request) {
  if (!(await authorized(req))) return NextResponse.json({ error: "wrong-pin" }, { status: 401 });
  const [students, progress, achievements, dailyChallenges, activityEvents, tutorMessages] = await Promise.all([
    db.student.findMany({ select: { id: true, name: true, avatar: true, level: true, totalStars: true, streak: true, soundOn: true, createdAt: true, updatedAt: true } }),
    db.lessonProgress.findMany(), db.achievement.findMany(), db.dailyChallenge.findMany(),
    db.activityEvent.findMany(), db.tutorMessage.findMany(),
  ]);
  return NextResponse.json({ exportedAt: new Date().toISOString(), students, progress, achievements, dailyChallenges, activityEvents, tutorMessages });
}

export async function DELETE(req: Request) {
  if (!(await authorized(req))) return NextResponse.json({ error: "wrong-pin" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (body?.confirmation !== "DELETE ALL FAMILY DATA") {
    return NextResponse.json({ error: "confirmation required" }, { status: 400 });
  }
  await db.$transaction([
    db.tutorMessage.deleteMany(), db.activityEvent.deleteMany(), db.dailyChallenge.deleteMany(),
    db.achievement.deleteMany(), db.lessonProgress.deleteMany(), db.student.deleteMany(),
  ]);
  return NextResponse.json({ ok: true });
}
