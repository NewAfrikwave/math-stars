import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStudent, getProfileId, listStudents } from "@/lib/student";
import { ALL_LESSONS, CURRICULUM } from "@/lib/curriculum";
import { PRESCHOOL_CURRICULUM } from "@/lib/preschool";
import { GRADE1_CURRICULUM } from "@/lib/grade1";
import { GRADE2_CURRICULUM } from "@/lib/grade2";
import { GRADE4_CURRICULUM } from "@/lib/grade4";

const ALL_DOMAINS = [...CURRICULUM, ...PRESCHOOL_CURRICULUM, ...GRADE1_CURRICULUM, ...GRADE2_CURRICULUM, ...GRADE4_CURRICULUM];

// GET /api/parent?pin=XXXX
// Returns the full parent dashboard data if the PIN matches (or no PIN is set).
// Pass ?summary=1 to get a lightweight summary of ALL profiles (for the
// multi-child parent dashboard).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const pin = url.searchParams.get("pin") ?? "";
  const wantSummary = url.searchParams.get("summary") === "1";
  const profileId = getProfileId(req);
  const student = await getStudent(profileId);

  // Multi-profile summary for the parent dashboard.
  // Uses a global PIN check: if ANY profile has a PIN, it must match.
  if (wantSummary) {
    const all = await listStudents();
    // Find any profile that has a PIN set.
    const withPin = await db.student.findFirst({
      where: { NOT: { parentPin: null } },
      select: { id: true, parentPin: true },
    });
    if (withPin && withPin.parentPin && withPin.parentPin !== pin) {
      return NextResponse.json({ error: "wrong-pin", hasPin: true }, { status: 401 });
    }
    if (!withPin) {
      // No PIN set anywhere yet.
      return NextResponse.json({ profiles: [], hasPin: false });
    }
    const summaries = [];
    for (const p of all) {
      const rows = await db.lessonProgress.findMany({ where: { studentId: p.id } });
      const completed = rows.filter((r) => r.status === "completed");
      const avg =
        completed.length > 0
          ? Math.round(completed.reduce((s, r) => s + r.bestScore, 0) / completed.length)
          : 0;
      const domains: Record<string, { completed: number; total: number }> = {};
      for (const d of ALL_DOMAINS) {
        domains[d.id] = {
          completed: d.lessons.filter((l) => rows.find((r) => r.lessonId === l.id)?.status === "completed").length,
          total: d.lessons.length,
        };
      }
      summaries.push({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        level: p.level,
        totalStars: p.totalStars,
        streak: p.streak,
        completedLessons: completed.length,
        totalLessons: ALL_DOMAINS.reduce((s, d) => s + d.lessons.length, 0),
        avgScore: avg,
        domains,
      });
    }
    return NextResponse.json({ profiles: summaries });
  }

  const rows = await db.lessonProgress.findMany({
    where: { studentId: student.id },
    orderBy: { updatedAt: "desc" },
  });

  const lessons = rows.map((r) => {
    const found = ALL_DOMAINS.flatMap((d) => d.lessons).find((l) => l.id === r.lessonId);
    const domain = ALL_DOMAINS.find((d) => d.lessons.some((l) => l.id === r.lessonId));
    return {
      lessonId: r.lessonId,
      title: found?.title ?? r.lessonId,
      emoji: found?.emoji ?? "📘",
      domain: domain?.title ?? "",
      status: r.status,
      stars: r.stars,
      bestScore: r.bestScore,
      lastScore: r.lastScore,
      attempts: r.attempts,
      lastDifficulty: r.lastDifficulty,
      completedAt: r.completedAt?.toISOString() ?? null,
      lastPlayedAt: r.lastPlayedAt?.toISOString() ?? r.updatedAt.toISOString(),
    };
  });

  // daily challenge history (last 30)
  const daily = await db.dailyChallenge.findMany({
    where: { studentId: student.id },
    orderBy: { dateKey: "desc" },
    take: 30,
  });

  // aggregate stats
  const completed = rows.filter((r) => r.status === "completed");
  const totalStars = student.totalStars;
  const avgScore =
    completed.length > 0
      ? Math.round(completed.reduce((s, r) => s + r.bestScore, 0) / completed.length)
      : 0;
  const weakAreas = completed
    .filter((r) => r.bestScore < 70)
    .sort((a, b) => a.bestScore - b.bestScore)
    .slice(0, 5)
    .map((r) => ({
      lessonId: r.lessonId,
      title: ALL_DOMAINS.flatMap((d) => d.lessons).find((l) => l.id === r.lessonId)?.title ?? r.lessonId,
      bestScore: r.bestScore,
    }));

  // per-domain completion (both levels)
  const domainStats = ALL_DOMAINS.map((d) => {
    const domainRows = d.lessons.map((l) => rows.find((r) => r.lessonId === l.id));
    const done = domainRows.filter((r) => r?.status === "completed").length;
    const stars = domainRows.reduce((s, r) => s + (r?.stars ?? 0), 0);
    const avg =
      domainRows.filter((r) => r?.status === "completed").length > 0
        ? Math.round(
            domainRows.filter((r) => r?.status === "completed").reduce((s, r) => s + (r!.bestScore), 0) /
              domainRows.filter((r) => r?.status === "completed").length
          )
        : 0;
    return { id: d.id, title: d.title, emoji: d.emoji, completed: done, total: d.lessons.length, stars, avgScore: avg };
  });

  return NextResponse.json({
    hasPin: !!student.parentPin,
    studentName: student.name,
    streak: student.streak,
    totalStars,
    totalLessons: ALL_LESSONS.length + PRESCHOOL_CURRICULUM.reduce((s, d) => s + d.lessons.length, 0),
    completedLessons: completed.length,
    avgScore,
    weakAreas,
    domainStats,
    lessons,
    dailyHistory: daily.map((d) => ({ dateKey: d.dateKey, score: d.score, correct: d.correct, total: d.total })),
    totalAttempts: rows.reduce((s, r) => s + r.attempts, 0),
  });
}

// POST /api/parent
// Body: { action: "set-pin" | "verify-pin" | "clear-pin", pin?: string }
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.action !== "string") {
    return NextResponse.json({ error: "action required" }, { status: 400 });
  }
  const profileId = getProfileId(req);
  const student = await getStudent(profileId);

  if (body.action === "set-pin") {
    const pin = String(body.pin ?? "").trim();
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be 4 digits" }, { status: 400 });
    }
    // Set the PIN on ALL profiles so the global parent check works.
    await db.student.updateMany({ where: {}, data: { parentPin: pin } });
    return NextResponse.json({ ok: true, hasPin: true });
  }
  if (body.action === "clear-pin") {
    await db.student.updateMany({ where: {}, data: { parentPin: null } });
    return NextResponse.json({ ok: true, hasPin: false });
  }
  if (body.action === "verify-pin") {
    const pin = String(body.pin ?? "").trim();
    const withPin = await db.student.findFirst({
      where: { NOT: { parentPin: null } },
      select: { parentPin: true },
    });
    if (!withPin || !withPin.parentPin) return NextResponse.json({ ok: true, hasPin: false });
    if (withPin.parentPin !== pin) {
      return NextResponse.json({ error: "wrong-pin", hasPin: true }, { status: 401 });
    }
    return NextResponse.json({ ok: true, hasPin: true });
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
