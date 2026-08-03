import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";
import { ALL_LESSONS, CURRICULUM, isLessonAvailable } from "@/lib/curriculum";
import { PRESCHOOL_CURRICULUM, PRESCHOOL_LESSON_IDS, psIsLessonAvailable } from "@/lib/preschool";
import { GRADE1_CURRICULUM, GRADE1_LESSON_IDS, isLessonAvailable as isG1LessonAvailable } from "@/lib/grade1";
import { GRADE2_CURRICULUM, GRADE2_LESSON_IDS, isLessonAvailable as isG2LessonAvailable } from "@/lib/grade2";
import { GRADE4_CURRICULUM, GRADE4_LESSON_IDS, isLessonAvailable as isG4LessonAvailable } from "@/lib/grade4";
import { pinFrom, verifyPin } from "@/lib/pin";

// GET /api/admin/users?pin=XXXX — list all profiles with full details.
export async function GET(req: Request) {
  const pin = pinFrom(req);
  const settings = await getSiteSettings();
  if (!settings.adminPin || !verifyPin(pin, settings.adminPin)) {
    return NextResponse.json({ error: "wrong-pin", hasAdminPin: true }, { status: 401 });
  }

  const students = await db.student.findMany({
    orderBy: { createdAt: "asc" },
  });
  const progress = await db.lessonProgress.findMany();
  const events = await db.activityEvent.findMany();

  const users = students.map((s) => {
    const sProgress = progress.filter((p) => p.studentId === s.id);
    const sEvents = events.filter((e) => e.studentId === s.id);
    const completed = sProgress.filter((p) => p.status === "completed").length;
    const totalStars = sProgress
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.stars, 0);
    const avgScore = completed > 0
      ? Math.round(sProgress.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.bestScore, 0) / completed)
      : 0;
    return {
      id: s.id,
      name: s.name,
      avatar: s.avatar,
      level: s.level,
      totalStars,
      streak: s.streak,
      completedLessons: completed,
      totalLessons: ALL_LESSONS.length + PRESCHOOL_LESSON_IDS.length + GRADE1_LESSON_IDS.length + GRADE2_LESSON_IDS.length + GRADE4_LESSON_IDS.length,
      avgScore,
      lastPlayedAt: s.lastPlayedAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
      eventCount: sEvents.length,
      hasParentPin: !!s.parentPin,
    };
  });

  return NextResponse.json({ users });
}

// POST /api/admin/users?pin=XXXX — manage a profile.
// Body: { action: "reset"|"delete"|"change-level"|"rename", profileId, level?, name? }
export async function POST(req: Request) {
  const pin = pinFrom(req);
  const settings = await getSiteSettings();
  if (!settings.adminPin || !verifyPin(pin, settings.adminPin)) {
    return NextResponse.json({ error: "wrong-pin", hasAdminPin: true }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.profileId !== "string") {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }
  const { profileId, action } = body as { profileId: string; action: string };

  if (action === "reset") {
    // Delete all progress for this profile, re-seed availability.
    await db.lessonProgress.deleteMany({ where: { studentId: profileId } });
    await db.achievement.deleteMany({ where: { studentId: profileId } });
    await db.activityEvent.deleteMany({ where: { studentId: profileId } });
    await db.dailyChallenge.deleteMany({ where: { studentId: profileId } });
    await db.tutorMessage.deleteMany({ where: { studentId: profileId } });
    await db.student.update({
      where: { id: profileId },
      data: { totalStars: 0, streak: 0, lastPlayedAt: null },
    });
    // re-seed availability
    const isCompleted = () => false;
    for (const fl of ALL_LESSONS) {
      const available = isLessonAvailable(fl.lessonId, isCompleted);
      await db.lessonProgress.create({
        data: {
          studentId: profileId,
          lessonId: fl.lessonId,
          status: available ? "available" : "locked",
          stars: 0, bestScore: 0, attempts: 0, lastScore: 0,
        },
      });
    }
    for (const id of PRESCHOOL_LESSON_IDS) {
      const available = psIsLessonAvailable(id, isCompleted);
      await db.lessonProgress.create({
        data: { studentId: profileId, lessonId: id, status: available ? "available" : "locked", stars: 0, bestScore: 0, attempts: 0, lastScore: 0 },
      });
    }
    for (const id of GRADE1_LESSON_IDS) {
      const available = isG1LessonAvailable(id, isCompleted);
      await db.lessonProgress.create({
        data: { studentId: profileId, lessonId: id, status: available ? "available" : "locked", stars: 0, bestScore: 0, attempts: 0, lastScore: 0 },
      });
    }
    for (const id of GRADE2_LESSON_IDS) {
      const available = isG2LessonAvailable(id, isCompleted);
      await db.lessonProgress.create({
        data: { studentId: profileId, lessonId: id, status: available ? "available" : "locked", stars: 0, bestScore: 0, attempts: 0, lastScore: 0 },
      });
    }
    for (const id of GRADE4_LESSON_IDS) {
      const available = isG4LessonAvailable(id, isCompleted);
      await db.lessonProgress.create({
        data: { studentId: profileId, lessonId: id, status: available ? "available" : "locked", stars: 0, bestScore: 0, attempts: 0, lastScore: 0 },
      });
    }
    return NextResponse.json({ ok: true, message: "Progress reset" });
  }

  if (action === "delete") {
    await db.student.delete({ where: { id: profileId } });
    return NextResponse.json({ ok: true, message: "Profile deleted" });
  }

  if (action === "change-level") {
    const allowed = ["preschool", "grade1", "grade2", "grade3", "grade4"];
    const level = allowed.includes(body.level) ? body.level : "grade3";
    await db.student.update({ where: { id: profileId }, data: { level } });
    return NextResponse.json({ ok: true, message: `Level changed to ${level}` });
  }

  if (action === "rename") {
    const name = String(body.name ?? "").trim().slice(0, 30);
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
    await db.student.update({ where: { id: profileId }, data: { name } });
    return NextResponse.json({ ok: true, message: `Renamed to ${name}` });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
