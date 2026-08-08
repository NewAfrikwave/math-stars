import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";
import { ALL_LESSONS, CURRICULUM } from "@/lib/curriculum";
import { PRESCHOOL_CURRICULUM, PRESCHOOL_LESSON_IDS } from "@/lib/preschool";
import { GRADE1_CURRICULUM, GRADE1_LESSON_IDS } from "@/lib/grade1";
import { GRADE2_CURRICULUM, GRADE2_LESSON_IDS } from "@/lib/grade2";
import { GRADE4_CURRICULUM, GRADE4_LESSON_IDS } from "@/lib/grade4";

const gradeDefinitions = [
  { level: "preschool", label: "Preschool", curricula: PRESCHOOL_CURRICULUM, lessonIds: PRESCHOOL_LESSON_IDS },
  { level: "grade1", label: "Grade 1", curricula: GRADE1_CURRICULUM, lessonIds: GRADE1_LESSON_IDS },
  { level: "grade2", label: "Grade 2", curricula: GRADE2_CURRICULUM, lessonIds: GRADE2_LESSON_IDS },
  { level: "grade3", label: "Grade 3", curricula: CURRICULUM, lessonIds: ALL_LESSONS.map((lesson) => lesson.lessonId) },
  { level: "grade4", label: "Grade 4", curricula: GRADE4_CURRICULUM, lessonIds: GRADE4_LESSON_IDS },
] as const;

const allCurricula = gradeDefinitions.flatMap((grade) => grade.curricula);
const allLessonMetadata = allCurricula.flatMap((domain) => domain.lessons);

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "admin-session-required" }, { status: 401 });

  const url = new URL(req.url);
  const requestedDays = Number(url.searchParams.get("days") ?? 14);
  const days = requestedDays === 7 || requestedDays === 30 ? requestedDays : 14;
  const now = new Date();
  const rangeStart = new Date(now);
  rangeStart.setHours(0, 0, 0, 0);
  rangeStart.setDate(rangeStart.getDate() - (days - 1));
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [allStudents, accounts, devices, allProgress, recentEvents, tutorMessagesToday] = await Promise.all([
    db.student.findMany({ select: { id: true, familyId: true, level: true, createdAt: true, lastPlayedAt: true } }),
    db.familyAccount.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        displayName: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        lastActiveAt: true,
        _count: { select: { students: true, devices: true } },
      },
    }),
    db.accountDevice.findMany({
      orderBy: { lastSeenAt: "desc" },
      include: { family: { select: { displayName: true, email: true } } },
    }),
    db.lessonProgress.findMany(),
    db.activityEvent.findMany({
      where: { createdAt: { gte: rangeStart } },
      select: { studentId: true, lessonId: true, type: true, score: true, createdAt: true },
    }),
    db.tutorMessage.count({ where: { createdAt: { gte: todayStart } } }),
  ]);

  const legacyExists = allStudents.some((student) => student.familyId === null);
  const totalFamilies = accounts.length + (legacyExists ? 1 : 0);
  const completed = allProgress.filter((progress) => progress.status === "completed");
  const avgScore = completed.length
    ? Math.round(completed.reduce((sum, progress) => sum + progress.bestScore, 0) / completed.length)
    : 0;

  const activeNow = new Set(devices.filter((device) => device.lastSeenAt >= fiveMinutesAgo).map((device) => device.scopeKey)).size;
  const active24h = new Set(devices.filter((device) => device.lastSeenAt >= oneDayAgo).map((device) => device.scopeKey)).size;
  const activeFamilies7 = new Set(devices.filter((device) => device.lastSeenAt >= sevenDaysAgo).map((device) => device.scopeKey)).size;
  const activeLearners = allStudents.filter((student) => student.lastPlayedAt && student.lastPlayedAt >= rangeStart).length;
  const inactiveLearners = allStudents.filter((student) => !student.lastPlayedAt || student.lastPlayedAt < sevenDaysAgo).length;

  const deviceMix = groupCount(devices.map((device) => device.deviceType));
  const platformMix = groupCount(devices.map((device) => device.platform));

  const dateKeys = Array.from({ length: days }, (_, index) => {
    const date = new Date(rangeStart);
    date.setDate(rangeStart.getDate() + index);
    return localDateKey(date);
  });
  const signupByDay = new Map(dateKeys.map((date) => [date, 0]));
  for (const account of accounts) {
    const key = localDateKey(account.createdAt);
    if (signupByDay.has(key)) signupByDay.set(key, (signupByDay.get(key) ?? 0) + 1);
  }

  const activityByDay = new Map(dateKeys.map((date) => [date, { count: 0, lessons: 0, arcade: 0, scores: [] as number[] }]));
  for (const event of recentEvents) {
    const key = localDateKey(event.createdAt);
    const day = activityByDay.get(key);
    if (!day) continue;
    day.count += 1;
    if (event.type === "lesson") day.lessons += 1;
    if (event.type === "arcade") day.arcade += 1;
    if (event.score > 0) day.scores.push(event.score);
  }

  const gradeStats = gradeDefinitions.map((grade) => {
    const students = allStudents.filter((student) => student.level === grade.level);
    const studentIds = new Set(students.map((student) => student.id));
    const progress = completed.filter((item) => studentIds.has(item.studentId) && grade.lessonIds.includes(item.lessonId as never));
    const domainResults = grade.curricula.map((domain) => {
      const lessonIds = new Set(domain.lessons.map((lesson) => lesson.id));
      const rows = progress.filter((item) => lessonIds.has(item.lessonId));
      return {
        title: domain.title,
        completions: rows.length,
        avgScore: rows.length ? Math.round(rows.reduce((sum, item) => sum + item.bestScore, 0) / rows.length) : 0,
      };
    });
    const strongest = [...domainResults].sort((a, b) => b.avgScore - a.avgScore || b.completions - a.completions)[0];
    const needsPractice = domainResults.filter((domain) => domain.completions > 0).sort((a, b) => a.avgScore - b.avgScore)[0]
      ?? domainResults.sort((a, b) => a.completions - b.completions)[0];
    return {
      level: grade.level,
      label: grade.label,
      learners: students.length,
      activeLearners: students.filter((student) => student.lastPlayedAt && student.lastPlayedAt >= rangeStart).length,
      lessonsCompleted: progress.length,
      avgScore: progress.length ? Math.round(progress.reduce((sum, item) => sum + item.bestScore, 0) / progress.length) : 0,
      strongestDomain: strongest?.completions ? strongest.title : "—",
      needsPractice: needsPractice ? needsPractice.title : "—",
    };
  });

  const lessonAttempts: Record<string, number> = {};
  const lessonScores: Record<string, number[]> = {};
  for (const progress of allProgress) {
    if (progress.attempts <= 0) continue;
    lessonAttempts[progress.lessonId] = (lessonAttempts[progress.lessonId] ?? 0) + progress.attempts;
    if (progress.bestScore > 0) (lessonScores[progress.lessonId] ??= []).push(progress.bestScore);
  }
  const popularLessons = Object.entries(lessonAttempts)
    .map(([lessonId, attempts]) => {
      const metadata = allLessonMetadata.find((lesson) => lesson.id === lessonId);
      const scores = lessonScores[lessonId] ?? [];
      return {
        lessonId,
        title: metadata?.title ?? lessonId,
        emoji: metadata?.emoji ?? "",
        attempts,
        avgScore: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0,
        completions: completed.filter((progress) => progress.lessonId === lessonId).length,
      };
    })
    .sort((left, right) => right.attempts - left.attempts)
    .slice(0, 10);

  const domainStats = allCurricula.map((domain) => {
    const lessonIds = new Set(domain.lessons.map((lesson) => lesson.id));
    const rows = completed.filter((progress) => lessonIds.has(progress.lessonId));
    return { id: domain.id, title: domain.title, emoji: domain.emoji, completed: rows.length, total: domain.lessons.length * Math.max(1, allStudents.length) };
  });

  const lessonsToday = recentEvents.filter((event) => event.type === "lesson" && event.createdAt >= todayStart).length;
  const arcadeToday = recentEvents.filter((event) => event.type === "arcade" && event.createdAt >= todayStart).length;

  return NextResponse.json({
    totalLearners: allStudents.length,
    totalFamilies,
    activeNow,
    active24h,
    activeFamilies7,
    newFamilies7: accounts.filter((account) => account.createdAt >= rangeStart).length,
    totalDevices: devices.length,
    installedDevices: devices.filter((device) => device.installed).length,
    deviceMix,
    platformMix,
    activeLearners,
    inactiveLearners,
    avgScore,
    totalLessonsCompleted: completed.length,
    lessonsToday,
    arcadeToday,
    tutorMessagesToday,
    popularLessons,
    gradeStats,
    domainStats,
    signupByDay: [...signupByDay].map(([date, count]) => ({ date, count })),
    activityByDay: [...activityByDay].map(([date, day]) => ({
      date,
      count: day.count,
      lessons: day.lessons,
      arcade: day.arcade,
      avgScore: day.scores.length ? Math.round(day.scores.reduce((sum, score) => sum + score, 0) / day.scores.length) : 0,
    })),
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
  });
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function groupCount(values: string[]) {
  return Object.entries(values.reduce<Record<string, number>>((result, value) => {
    result[value] = (result[value] ?? 0) + 1;
    return result;
  }, {})).map(([name, count]) => ({ name, count }));
}
