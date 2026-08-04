import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pinFrom, verifyPin } from "@/lib/pin";
import { familyScope, requireActiveSession } from "@/lib/student";

async function authorized(req: Request) {
  const scope = familyScope(await requireActiveSession(req));
  const protectedProfile = await db.student.findFirst({
    where: { ...scope, NOT: { parentPin: null } },
    select: { parentPin: true },
  });
  return !!protectedProfile?.parentPin && verifyPin(pinFrom(req), protectedProfile.parentPin);
}

export async function GET(req: Request) {
  if (!(await authorized(req))) return NextResponse.json({ error: "wrong-pin" }, { status: 401 });
  const session = await requireActiveSession(req);
  const scope = familyScope(session);
  const familyStudents = await db.student.findMany({ where: scope, select: { id: true } });
  const studentIds = familyStudents.map((student) => student.id);
  const [students, progress, achievements, dailyChallenges, activityEvents, tutorMessages, rewardGoals] = await Promise.all([
    db.student.findMany({ where: scope, select: { id: true, name: true, avatar: true, level: true, totalStars: true, streak: true, soundOn: true, createdAt: true, updatedAt: true } }),
    db.lessonProgress.findMany({ where: { studentId: { in: studentIds } } }),
    db.achievement.findMany({ where: { studentId: { in: studentIds } } }),
    db.dailyChallenge.findMany({ where: { studentId: { in: studentIds } } }),
    db.activityEvent.findMany({ where: { studentId: { in: studentIds } } }),
    db.tutorMessage.findMany({ where: { studentId: { in: studentIds } } }),
    db.rewardGoal.findMany({ where: { studentId: { in: studentIds } } }),
  ]);
  const account = session.kind === "account" ? await db.familyAccount.findUnique({
    where: { id: session.familyId },
    select: { displayName: true, email: true, createdAt: true },
  }) : null;
  return NextResponse.json({ exportedAt: new Date().toISOString(), account, students, progress, achievements, dailyChallenges, activityEvents, tutorMessages, rewardGoals });
}

export async function DELETE(req: Request) {
  if (!(await authorized(req))) return NextResponse.json({ error: "wrong-pin" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (body?.confirmation !== "DELETE ALL FAMILY DATA") {
    return NextResponse.json({ error: "confirmation required" }, { status: 400 });
  }
  const scope = familyScope(await requireActiveSession(req));
  const familyStudents = await db.student.findMany({ where: scope, select: { id: true } });
  const studentIds = familyStudents.map((student) => student.id);
  await db.$transaction([
    db.rewardGoal.deleteMany({ where: { studentId: { in: studentIds } } }),
    db.tutorMessage.deleteMany({ where: { studentId: { in: studentIds } } }),
    db.activityEvent.deleteMany({ where: { studentId: { in: studentIds } } }),
    db.dailyChallenge.deleteMany({ where: { studentId: { in: studentIds } } }),
    db.achievement.deleteMany({ where: { studentId: { in: studentIds } } }),
    db.lessonProgress.deleteMany({ where: { studentId: { in: studentIds } } }),
    db.student.deleteMany({ where: scope }),
  ]);
  return NextResponse.json({ ok: true });
}
