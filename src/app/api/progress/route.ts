import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStudentForRequest } from "@/lib/student";
import { ALL_LESSONS, CURRICULUM, findLesson, isLessonAvailable } from "@/lib/curriculum";
import { PRESCHOOL_CURRICULUM, PRESCHOOL_LESSON_IDS, psIsLessonAvailable, findPsLesson } from "@/lib/preschool";
import { GRADE1_CURRICULUM, GRADE1_LESSON_IDS, isLessonAvailable as isG1LessonAvailable, findG1Lesson } from "@/lib/grade1";
import { GRADE2_CURRICULUM, GRADE2_LESSON_IDS, isLessonAvailable as isG2LessonAvailable, findG2Lesson } from "@/lib/grade2";
import { GRADE4_CURRICULUM, GRADE4_LESSON_IDS, isLessonAvailable as isG4LessonAvailable, findG4Lesson } from "@/lib/grade4";
import { ACHIEVEMENTS } from "@/lib/achievements";
import type { LessonStatus } from "@/lib/types";
import { getCurrentRewardMission } from "@/lib/reward-server";

// POST /api/progress
// Body: { lessonId, correct, total }
// Records a practice session result, recomputes availability, awards stars
// and achievements, and returns the outcome.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.lessonId !== "string") {
    return NextResponse.json({ error: "lessonId is required" }, { status: 400 });
  }
  const { lessonId } = body as { lessonId: string };
  const correctRaw = Math.floor(Number(body.correct ?? 0));
  const total = Math.max(1, Math.floor(Number(body.total ?? 1)));
  const correct = Math.min(total, Math.max(0, correctRaw));
  const score = Math.round((correct / total) * 100);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0;
  const difficulty =
    body.difficulty === "easy" || body.difficulty === "challenge" ? body.difficulty : null;

  const student = await getStudentForRequest(req);
  const profileId = student.id;
  const foundLesson = findLessonAny(lessonId);
  if (!foundLesson) return NextResponse.json({ error: "unknown lesson" }, { status: 400 });
  const allowedLevel = foundLesson.level === student.level;
  if (!allowedLevel) return NextResponse.json({ error: "lesson is not in this learner's grade" }, { status: 403 });

  // upsert the lesson progress row
  const existing = await db.lessonProgress.findUnique({
    where: { studentId_lessonId: { studentId: student.id, lessonId } },
  });
  const currentRows = await db.lessonProgress.findMany({ where: { studentId: student.id } });
  const completedBefore = (id: string) => currentRows.some((row) => row.lessonId === id && row.status === "completed");
  const availableByRules = student.level === "preschool" ? psIsLessonAvailable(lessonId, completedBefore)
    : student.level === "grade1" ? isG1LessonAvailable(lessonId, completedBefore)
    : student.level === "grade2" ? isG2LessonAvailable(lessonId, completedBefore)
    : student.level === "grade4" ? isG4LessonAvailable(lessonId, completedBefore)
    : isLessonAvailable(lessonId, completedBefore);
  if (existing?.status === "locked" || (!existing && !availableByRules)) {
    return NextResponse.json({ error: "lesson is locked" }, { status: 403 });
  }

  const wasCompleted = existing?.status === "completed";
  const passed = score >= 70;
  const nextStatus: LessonStatus = wasCompleted || passed ? "completed" : "in-progress";
  const newBest = Math.max(existing?.bestScore ?? 0, score);
  const newStars = Math.max(existing?.stars ?? 0, stars);

  const row = await db.lessonProgress.upsert({
    where: { studentId_lessonId: { studentId: student.id, lessonId } },
    create: {
      studentId: student.id,
      lessonId,
      status: nextStatus,
      stars: newStars,
      bestScore: newBest,
      attempts: 1,
      lastScore: score,
      lastDifficulty: difficulty,
      completedAt: passed ? new Date() : null,
      lastPlayedAt: new Date(),
    },
    update: {
      status: nextStatus,
      stars: newStars,
      bestScore: newBest,
      attempts: (existing?.attempts ?? 0) + 1,
      lastScore: score,
      lastDifficulty: difficulty ?? existing?.lastDifficulty ?? null,
      completedAt: wasCompleted ? existing?.completedAt : passed ? new Date() : null,
      lastPlayedAt: new Date(),
    },
  });

  // Recompute availability for all lessons using per-domain prerequisites.
  const allRows = await db.lessonProgress.findMany({
    where: { studentId: student.id },
  });
  const byLesson = new Map(allRows.map((r) => [r.lessonId, r]));
  const isCompletedDb = (id: string) => byLesson.get(id)?.status === "completed";
  for (const fl of ALL_LESSONS) {
    const r = byLesson.get(fl.lessonId);
    if (r && r.status === "completed") continue;
    if (isLessonAvailable(fl.lessonId, isCompletedDb) && (!r || r.status === "locked")) {
      const nextStatus: LessonStatus = "available";
      if (!r) {
        await db.lessonProgress.create({
          data: { studentId: student.id, lessonId: fl.lessonId, status: nextStatus, stars: 0, bestScore: 0, attempts: 0, lastScore: 0 },
        });
      } else if (r.status !== nextStatus) {
        await db.lessonProgress.update({ where: { id: r.id }, data: { status: nextStatus } });
      }
    }
  }
  // preschool, grade1, grade2, grade4
  const allGradeIds = [
    ...PRESCHOOL_LESSON_IDS.map((id) => ({ id, fn: psIsLessonAvailable })),
    ...GRADE1_LESSON_IDS.map((id) => ({ id, fn: isG1LessonAvailable })),
    ...GRADE2_LESSON_IDS.map((id) => ({ id, fn: isG2LessonAvailable })),
    ...GRADE4_LESSON_IDS.map((id) => ({ id, fn: isG4LessonAvailable })),
  ];
  for (const { id, fn } of allGradeIds) {
    const r = byLesson.get(id);
    if (r && r.status === "completed") continue;
    if (fn(id, isCompletedDb) && (!r || r.status === "locked")) {
      const nextStatus: LessonStatus = "available";
      if (!r) {
        await db.lessonProgress.create({
          data: { studentId: student.id, lessonId: id, status: nextStatus, stars: 0, bestScore: 0, attempts: 0, lastScore: 0 },
        });
      } else if (r.status !== nextStatus) {
        await db.lessonProgress.update({ where: { id: r.id }, data: { status: nextStatus } });
      }
    }
  }

  // recompute total stars from DB
  const freshRows = await db.lessonProgress.findMany({
    where: { studentId: student.id },
  });
  const totalStars = freshRows
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + r.stars, 0);

  // streak: bump if this is a new completion today
  const today = new Date();
  const last = student.lastPlayedAt;
  let streak = student.streak;
  if (!wasCompleted && passed) {
    const sameDay =
      last &&
      last.getFullYear() === today.getFullYear() &&
      last.getMonth() === today.getMonth() &&
      last.getDate() === today.getDate();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const wasYesterday =
      last &&
      last.getFullYear() === yesterday.getFullYear() &&
      last.getMonth() === yesterday.getMonth() &&
      last.getDate() === yesterday.getDate();
    if (sameDay) {
      streak = Math.max(streak, 1);
    } else if (wasYesterday) {
      streak = streak + 1;
    } else {
      streak = 1;
    }
  }

  await db.student.update({
    where: { id: student.id },
    data: { totalStars, streak, lastPlayedAt: today },
  });

  // achievements
  const completedCount = freshRows.filter((r) => r.status === "completed").length;
  const perfectLessons = freshRows.filter(
    (r) => r.status === "completed" && r.stars >= 3
  ).length;
  const domainCompletion: Record<string, number> = {};
  const allDomains = [...CURRICULUM, ...PRESCHOOL_CURRICULUM, ...GRADE1_CURRICULUM, ...GRADE2_CURRICULUM, ...GRADE4_CURRICULUM];
  for (const domain of allDomains) {
    domainCompletion[domain.id] = domain.lessons.filter(
      (l) => freshRows.find((r) => r.lessonId === l.id)?.status === "completed"
    ).length;
  }
  const ctx = {
    totalStars,
    completedCount,
    domainCompletion,
    perfectLessons,
    streak,
  };
  const alreadyEarned = new Set(
    (await db.achievement.findMany({ where: { studentId: student.id } })).map(
      (a) => a.achievementId
    )
  );
  const newlyEarned: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (!alreadyEarned.has(a.id) && a.check(ctx)) {
      await db.achievement.create({
        data: { studentId: student.id, achievementId: a.id },
      });
      newlyEarned.push(a.id);
    }
  }

  // Log an activity event for the parent timeline.
  const lessonMeta = foundLesson.lesson;
  await db.activityEvent.create({
    data: {
      studentId: student.id,
      type: "lesson",
      lessonId,
      title: lessonMeta?.title ?? lessonId,
      emoji: lessonMeta?.emoji ?? "📘",
      score,
      correct,
      total,
      stars: newStars,
    },
  }).catch(() => {});

  const reward = await getCurrentRewardMission(student.id);

  return NextResponse.json({
    ok: true,
    lessonId,
    stars: newStars,
    sessionStars: stars,
    score,
    bestScore: newBest,
    attempts: row.attempts,
    totalStars,
    streak,
    newlyEarned,
    reward,
    passed,
  });
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
    const lesson = group.domains.flatMap((d) => d.lessons).find((l) => l.id === lessonId);
    if (lesson) return { level: group.level, lesson };
  }
  return null;
}
