import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { familyScope, getStudentForRequest, listStudents, requireActiveSession } from "@/lib/student";
import { ALL_LESSONS, CURRICULUM } from "@/lib/curriculum";
import { PRESCHOOL_CURRICULUM } from "@/lib/preschool";
import { GRADE1_CURRICULUM } from "@/lib/grade1";
import { GRADE2_CURRICULUM } from "@/lib/grade2";
import { GRADE4_CURRICULUM } from "@/lib/grade4";
import { domainsForLevel } from "@/lib/rewards";
import { hashPin, pinFrom, verifyPin } from "@/lib/pin";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const ALL_DOMAINS = [...CURRICULUM, ...PRESCHOOL_CURRICULUM, ...GRADE1_CURRICULUM, ...GRADE2_CURRICULUM, ...GRADE4_CURRICULUM];

// GET /api/parent?pin=XXXX
// Returns the full parent dashboard data if the PIN matches (or no PIN is set).
// Pass ?summary=1 to get a lightweight summary of this family's profiles (for the
// multi-child parent dashboard).
export async function GET(req: Request) {
  const attempt = rateLimit(clientKey(req, "parent-dashboard"), 60, 15 * 60 * 1000);
  if (!attempt.allowed) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  const url = new URL(req.url);
  const pin = pinFrom(req);
  const wantSummary = url.searchParams.get("summary") === "1";
  const scope = familyScope(await requireActiveSession(req));

  // Multi-profile summary for the parent dashboard.
  // Uses one shared parent PIN across this family's profiles.
  if (wantSummary) {
    const all = await listStudents(req);
    // Find any profile that has a PIN set.
    const withPin = await db.student.findFirst({
      where: { ...scope, NOT: { parentPin: null } },
      select: { id: true, parentPin: true },
    });
    if (withPin && withPin.parentPin && !verifyPin(pin, withPin.parentPin)) {
      return NextResponse.json({ error: "wrong-pin", hasPin: true }, { status: 401 });
    }
    if (!withPin) {
      // No PIN set anywhere yet.
      return NextResponse.json({ profiles: [], hasPin: false });
    }
    const summaries: Array<{
      id: string; name: string; avatar: string; level: string; totalStars: number;
      streak: number; completedLessons: number; totalLessons: number; avgScore: number;
      domains: Record<string, { completed: number; total: number }>;
    }> = [];
    for (const p of all) {
      const profileDomains = domainsForLevel(p.level);
      const rows = await db.lessonProgress.findMany({ where: { studentId: p.id } });
      const completed = rows.filter((r) => r.status === "completed");
      const avg =
        completed.length > 0
          ? Math.round(completed.reduce((s, r) => s + r.bestScore, 0) / completed.length)
          : 0;
      const domains: Record<string, { completed: number; total: number }> = {};
      for (const d of profileDomains) {
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
        totalLessons: profileDomains.reduce((s, d) => s + d.lessons.length, 0),
        avgScore: avg,
        domains,
      });
    }
    return NextResponse.json({ profiles: summaries });
  }

  const student = await getStudentForRequest(req);

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
  const attempt = rateLimit(clientKey(req, "parent-pin"), 20, 15 * 60 * 1000);
  if (!attempt.allowed) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body.action !== "string") {
    return NextResponse.json({ error: "action required" }, { status: 400 });
  }
  const scope = familyScope(await requireActiveSession(req));

  if (body.action === "set-pin") {
    const pin = String(body.pin ?? "").trim();
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be 4 digits" }, { status: 400 });
    }
    // Set the PIN on every profile owned by this family.
    const existing = await db.student.findFirst({ where: { ...scope, NOT: { parentPin: null } }, select: { parentPin: true } });
    if (existing?.parentPin && !verifyPin(pinFrom(req), existing.parentPin)) {
      return NextResponse.json({ error: "wrong-pin", hasPin: true }, { status: 401 });
    }
    await db.student.updateMany({ where: scope, data: { parentPin: hashPin(pin) } });
    return NextResponse.json({ ok: true, hasPin: true });
  }
  if (body.action === "clear-pin") {
    const existing = await db.student.findFirst({ where: { ...scope, NOT: { parentPin: null } }, select: { parentPin: true } });
    if (existing?.parentPin && !verifyPin(pinFrom(req), existing.parentPin)) {
      return NextResponse.json({ error: "wrong-pin", hasPin: true }, { status: 401 });
    }
    await db.student.updateMany({ where: scope, data: { parentPin: null } });
    return NextResponse.json({ ok: true, hasPin: false });
  }
  if (body.action === "verify-pin") {
    const pin = String(body.pin ?? "").trim();
    const withPin = await db.student.findFirst({
      where: { ...scope, NOT: { parentPin: null } },
      select: { parentPin: true },
    });
    if (!withPin || !withPin.parentPin) return NextResponse.json({ ok: true, hasPin: false });
    if (!verifyPin(pin, withPin.parentPin)) {
      return NextResponse.json({ error: "wrong-pin", hasPin: true }, { status: 401 });
    }
    return NextResponse.json({ ok: true, hasPin: true });
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
