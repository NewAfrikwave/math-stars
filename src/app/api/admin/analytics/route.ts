import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";
import { ALL_LESSONS, CURRICULUM } from "@/lib/curriculum";
import { PRESCHOOL_CURRICULUM, PRESCHOOL_LESSON_IDS } from "@/lib/preschool";
import { GRADE1_CURRICULUM, GRADE1_LESSON_IDS } from "@/lib/grade1";
import { GRADE2_CURRICULUM, GRADE2_LESSON_IDS } from "@/lib/grade2";
import { GRADE4_CURRICULUM, GRADE4_LESSON_IDS } from "@/lib/grade4";

// GET /api/admin/analytics — site-wide account, device, and learning metrics.
export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "admin-session-required" }, { status: 401 });

  const [allStudents, accounts, devices] = await Promise.all([
    db.student.findMany({ select: { id: true, familyId: true, createdAt: true, lastPlayedAt: true } }),
    db.familyAccount.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, email: true, displayName: true, status: true,
        createdAt: true, lastLoginAt: true, lastActiveAt: true,
        _count: { select: { students: true, devices: true } },
      },
    }),
    db.accountDevice.findMany({
      orderBy: { lastSeenAt: "desc" },
      include: { family: { select: { displayName: true, email: true } } },
    }),
  ]);
  const totalLearners = allStudents.length;

  const now = Date.now();
  const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const legacyExists = allStudents.some((student) => student.familyId === null);
  const totalFamilies = accounts.length + (legacyExists ? 1 : 0);
  const activeNow = new Set(
    devices.filter((device) => device.lastSeenAt >= fiveMinutesAgo).map((device) => device.scopeKey)
  ).size;
  const active24h = new Set(
    devices.filter((device) => device.lastSeenAt >= oneDayAgo).map((device) => device.scopeKey)
  ).size;
  const activeFamilies7 = new Set(
    devices.filter((device) => device.lastSeenAt >= sevenDaysAgo).map((device) => device.scopeKey)
  ).size;
  const newFamilies7 = accounts.filter((account) => account.createdAt >= sevenDaysAgo).length;
  const installedDevices = devices.filter((device) => device.installed).length;

  const deviceMix = Object.entries(devices.reduce<Record<string, number>>((result, device) => {
    result[device.deviceType] = (result[device.deviceType] ?? 0) + 1;
    return result;
  }, {})).map(([name, count]) => ({ name, count }));
  const platformMix = Object.entries(devices.reduce<Record<string, number>>((result, device) => {
    result[device.platform] = (result[device.platform] ?? 0) + 1;
    return result;
  }, {})).map(([name, count]) => ({ name, count }));
  const signupDays: Record<string, number> = {};
  for (let index = 13; index >= 0; index -= 1) {
    const date = new Date(now - index * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    signupDays[date] = 0;
  }
  for (const account of accounts) {
    const date = account.createdAt.toISOString().slice(0, 10);
    if (signupDays[date] !== undefined) signupDays[date] += 1;
  }

  // Active learners (played in last 7 days)
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
    totalFamilies,
    activeNow,
    active24h,
    activeFamilies7,
    newFamilies7,
    totalDevices: devices.length,
    installedDevices,
    deviceMix,
    platformMix,
    signupByDay: Object.entries(signupDays).map(([date, count]) => ({ date, count })),
    recentFamilies: accounts.slice(0, 12).map((account) => ({
      id: account.id,
      displayName: account.displayName,
      email: account.email,
      status: account.status,
      learners: account._count.students,
      devices: account._count.devices,
      createdAt: account.createdAt.toISOString(),
      lastLoginAt: account.lastLoginAt?.toISOString() ?? null,
      lastActiveAt: account.lastActiveAt?.toISOString() ?? null,
    })),
    recentDevices: devices.slice(0, 20).map((device) => ({
      id: device.id,
      familyName: device.family?.displayName ?? "Legacy family access",
      familyEmail: device.family?.email ?? null,
      deviceType: device.deviceType,
      platform: device.platform,
      browser: device.browser,
      launchMode: device.launchMode,
      installed: device.installed,
      firstSeenAt: device.firstSeenAt.toISOString(),
      lastSeenAt: device.lastSeenAt.toISOString(),
      visitCount: device.visitCount,
    })),
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
