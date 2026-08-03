import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";
import { ALL_LESSONS, CURRICULUM } from "@/lib/curriculum";
import { PRESCHOOL_CURRICULUM, PRESCHOOL_LESSON_IDS } from "@/lib/preschool";
import { GRADE1_CURRICULUM, GRADE1_LESSON_IDS } from "@/lib/grade1";
import { GRADE2_CURRICULUM, GRADE2_LESSON_IDS } from "@/lib/grade2";
import { GRADE4_CURRICULUM, GRADE4_LESSON_IDS } from "@/lib/grade4";

// GET /api/admin/analytics?pin=XXXX — aggregated usage stats across ALL profiles.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const pin = url.searchParams.get("pin") ?? "";
  const settings = await getSiteSettings();
  if (settings.adminPin && settings.adminPin !== pin) {
    return NextResponse.json({ error: "wrong-pin", hasAdminPin: true }, { status: 401 });
  }

  const allStudents = await db.student.findMany({ select: { id: true, createdAt: true, lastPlayedAt: true } });
  const totalLearners = allStudents.length;

  // Active learners (played in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const activeLearners = allStudents.filter(
    (s) => s.lastPlayedAt && s.lastPlayedAt >= sevenDaysAgo
  ).length;

  // Total activity events
  const totalEvents = await db.activityEvent.count();

  // Events in the last 7 / 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const events7 = await db.activityEvent.count({ where: { createdAt: { gte: sevenDaysAgo } } });
  const events30 = await db.activityEvent.count({ where: { createdAt: { gte: thirtyDaysAgo } } });

  // Lesson completion stats
  const allProgress = await db.lessonProgress.findMany();
  const completed = allProgress.filter((p) => p.status === "completed");
  const avgScore = completed.length > 0
    ? Math.round(completed.reduce((s, p) => s + p.bestScore, 0) / completed.length)
    : 0;
  const totalStars = allStudents.reduce((s, st) => {
    void st;
    return s;
  }, 0); // placeholder; we'll sum from progress
  const starsFromProgress = completed.reduce((s, p) => s + p.stars, 0);

  // Most-played lessons (by attempts)
  const lessonAttempts: Record<string, number> = {};
  const lessonScores: Record<string, number[]> = {};
  for (const p of allProgress) {
    if (p.attempts > 0) {
      lessonAttempts[p.lessonId] = (lessonAttempts[p.lessonId] ?? 0) + p.attempts;
      if (p.bestScore > 0) {
        if (!lessonScores[p.lessonId]) lessonScores[p.lessonId] = [];
        lessonScores[p.lessonId].push(p.bestScore);
      }
    }
  }
  const allLessons = [...CURRICULUM.flatMap((d) => d.lessons), ...PRESCHOOL_CURRICULUM.flatMap((d) => d.lessons), ...GRADE1_CURRICULUM.flatMap((d) => d.lessons), ...GRADE2_CURRICULUM.flatMap((d) => d.lessons), ...GRADE4_CURRICULUM.flatMap((d) => d.lessons)];
  const popularLessons = Object.entries(lessonAttempts)
    .map(([id, attempts]) => {
      const meta = allLessons.find((l) => l.id === id);
      const scores = lessonScores[id] ?? [];
      const avg = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;
      return {
        lessonId: id,
        title: meta?.title ?? id,
        emoji: meta?.emoji ?? "📘",
        attempts,
        avgScore: avg,
        completions: completed.filter((p) => p.lessonId === id).length,
      };
    })
    .sort((a, b) => b.attempts - a.attempts)
    .slice(0, 10);

  // Daily challenge stats
  const dailyTotal = await db.dailyChallenge.count();
  const daily7 = await db.dailyChallenge.count({ where: { completedAt: { gte: sevenDaysAgo } } });

  // Tutor message count
  const tutorMessages = await db.tutorMessage.count();

  // Domain completion across all learners
  const domainStats = [...CURRICULUM, ...PRESCHOOL_CURRICULUM].map((d) => {
    const done = d.lessons.filter((l) =>
      allProgress.find((p) => p.lessonId === l.id && p.status === "completed")
    ).length;
    return { id: d.id, title: d.title, emoji: d.emoji, completed: done, total: d.lessons.length };
  });

  // Activity by day (last 14 days) for a sparkline
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const recentEvents = await db.activityEvent.findMany({
    where: { createdAt: { gte: fourteenDaysAgo } },
    select: { createdAt: true, type: true },
  });
  const byDay: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    byDay[d.toISOString().slice(0, 10)] = 0;
  }
  for (const e of recentEvents) {
    const key = e.createdAt.toISOString().slice(0, 10);
    if (byDay[key] !== undefined) byDay[key]++;
  }

  return NextResponse.json({
    totalLearners,
    activeLearners,
    totalEvents,
    events7,
    events30,
    avgScore,
    totalStars: starsFromProgress,
    totalLessonsCompleted: completed.length,
    totalLessonsAvailable: ALL_LESSONS.length + PRESCHOOL_LESSON_IDS.length + GRADE1_LESSON_IDS.length + GRADE2_LESSON_IDS.length + GRADE4_LESSON_IDS.length,
    popularLessons,
    dailyTotal,
    daily7,
    tutorMessages,
    domainStats,
    activityByDay: Object.entries(byDay).map(([date, count]) => ({ date, count })),
  });
}
