import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStudentForRequest } from "@/lib/student";
import {
  ARCADE_COMPANIONS,
  ARCADE_GAMES,
  arcadeLevel,
  companionForCoins,
  createArcadeQuestions,
  isArcadeGameKey,
  parseArcadeQuestions,
  publicQuestion,
} from "@/lib/arcade";
import { clientKey, rateLimit } from "@/lib/rate-limit";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function runPayload(run: {
  attemptId: string; gameKey: string; nextIndex: number; correctCount: number; total: number;
  status: string; questionsJson: string; coinsEarned: number; dailyBonus: number; completedAt: Date | null;
}) {
  const questions = parseArcadeQuestions(run.questionsJson);
  const question = questions && run.nextIndex < questions.length ? publicQuestion(questions[run.nextIndex]) : null;
  return {
    attemptId: run.attemptId,
    gameKey: run.gameKey,
    nextIndex: run.nextIndex,
    correctCount: run.correctCount,
    total: run.total,
    status: run.status,
    question,
    coinsEarned: run.coinsEarned,
    dailyBonus: run.dailyBonus,
    completedAt: run.completedAt?.toISOString() ?? null,
  };
}

export async function GET(req: Request) {
  const student = await getStudentForRequest(req);
  const [activeRuns, completedRuns, recentRuns] = await Promise.all([
    db.arcadeRun.findMany({ where: { studentId: student.id, status: "active" }, orderBy: { updatedAt: "desc" } }),
    db.arcadeRun.findMany({ where: { studentId: student.id, status: "completed" }, select: { gameKey: true, correctCount: true, total: true, coinsEarned: true } }),
    db.arcadeRun.findMany({ where: { studentId: student.id, status: "completed" }, orderBy: { completedAt: "desc" }, take: 5 }),
  ]);

  const byGame = Object.fromEntries(ARCADE_GAMES.map((game) => {
    const runs = completedRuns.filter((run) => run.gameKey === game.key);
    const bestScore = runs.reduce((best, run) => Math.max(best, Math.round((run.correctCount / Math.max(1, run.total)) * 100)), 0);
    return [game.key, { plays: runs.length, bestScore, coins: runs.reduce((sum, run) => sum + run.coinsEarned, 0) }];
  }));
  const selected = companionForCoins(student.arcadeCompanion, student.arcadeCoins);

  return NextResponse.json({
    coins: student.arcadeCoins,
    selectedCompanion: selected.id,
    companions: ARCADE_COMPANIONS.map((companion) => ({ ...companion, unlocked: student.arcadeCoins >= companion.unlockCoins })),
    dailyBonusAvailable: student.arcadeLastBonusDate !== todayKey(),
    totalWins: completedRuns.length,
    byGame,
    activeRuns: activeRuns.map(runPayload),
    recentRuns: recentRuns.map(runPayload),
  });
}

export async function POST(req: Request) {
  const attempt = rateLimit(clientKey(req, "arcade-change"), 90, 15 * 60 * 1000);
  if (!attempt.allowed) return NextResponse.json({ error: "Too many arcade requests" }, { status: 429 });
  const body = await req.json().catch(() => null) as { action?: unknown; gameKey?: unknown; companionId?: unknown } | null;
  if (!body || typeof body.action !== "string") return NextResponse.json({ error: "Action required" }, { status: 400 });
  const student = await getStudentForRequest(req);

  if (body.action === "select-companion") {
    const companion = ARCADE_COMPANIONS.find((item) => item.id === body.companionId);
    if (!companion) return NextResponse.json({ error: "Unknown companion" }, { status: 400 });
    if (student.arcadeCoins < companion.unlockCoins) return NextResponse.json({ error: "This companion is still locked" }, { status: 403 });
    await db.student.update({ where: { id: student.id }, data: { arcadeCompanion: companion.id } });
    return NextResponse.json({ ok: true, selectedCompanion: companion.id });
  }

  if (body.action === "abandon") {
    if (!isArcadeGameKey(body.gameKey)) return NextResponse.json({ error: "Choose an arcade game" }, { status: 400 });
    await db.arcadeRun.updateMany({
      where: { studentId: student.id, activeKey: `${student.id}:${body.gameKey}`, status: "active" },
      data: { status: "abandoned", activeKey: null },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action !== "start" || !isArcadeGameKey(body.gameKey)) {
    return NextResponse.json({ error: "Choose an arcade game" }, { status: 400 });
  }

  const activeKey = `${student.id}:${body.gameKey}`;
  const existing = await db.arcadeRun.findUnique({ where: { activeKey } });
  if (existing) return NextResponse.json({ run: runPayload(existing), resumed: true });

  const level = arcadeLevel(student.level);
  const questions = createArcadeQuestions(body.gameKey, level);
  try {
    const run = await db.arcadeRun.create({
      data: {
        studentId: student.id,
        attemptId: `arcade_${crypto.randomUUID()}`,
        gameKey: body.gameKey,
        activeKey,
        level,
        questionsJson: JSON.stringify(questions),
        total: questions.length,
      },
    });
    return NextResponse.json({ run: runPayload(run), resumed: false });
  } catch {
    const raced = await db.arcadeRun.findUnique({ where: { activeKey } });
    if (!raced) return NextResponse.json({ error: "Could not start this round" }, { status: 500 });
    return NextResponse.json({ run: runPayload(raced), resumed: true });
  }
}
