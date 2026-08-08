import { ARCADE_COMPANIONS, ARCADE_GAMES, arcadeReward, createArcadeQuestions, publicQuestion, type ArcadeAnswerRecord, type ArcadeGameKey } from "@/lib/arcade";
import { deleteOfflineArcadeRun, deleteOfflineCheckpoint, enqueueOfflineEvent, loadOfflineArcadeRun, loadSnapshot, saveOfflineArcadeRun, saveOfflineCheckpoint, saveSnapshot } from "@/lib/offline/database";
import { requestBackgroundSync } from "@/lib/offline/sync-client";
import type { Level } from "@/lib/types";
import type { OfflineArcadeRun } from "@/lib/offline/types";

export interface OfflineRequestContext {
  profileId: string | null;
  level: Level | null;
  totalStars: number;
  streak: number;
  progress: Record<string, { status: string; stars: number }>;
}

interface CachedArcadeOverview {
  coins: number;
  selectedCompanion: string;
  companions: Array<{ id: string; name: string; emoji: string; unlockCoins: number; description: string; unlocked: boolean }>;
  dailyBonusAvailable: boolean;
  totalWins: number;
  byGame: Record<ArcadeGameKey, { plays: number; bestScore: number; coins: number }>;
  activeRuns: unknown[];
}

export async function offlineAwareFetch(url: string, options: RequestInit, context: OfflineRequestContext) {
  const method = (options.method ?? "GET").toUpperCase();
  const cacheKey = context.profileId ? `response:${context.profileId}:${method}:${url}` : `response:family:${method}:${url}`;
  if (typeof navigator === "undefined") return fetch(url, options);

  if (navigator.onLine) {
    try {
      const response = await fetch(url, options);
      if (!response.ok && (response.status === 408 || response.status === 429 || response.status >= 500)) throw new Error("Temporary network failure");
      if (method === "GET" && response.ok) {
        const clone = response.clone();
        clone.json().then((value) => saveSnapshot(cacheKey, value)).catch(() => {});
      }
      return response;
    } catch { /* use the durable local path */ }
  }

  if (method === "GET") {
    const cached = await loadSnapshot<unknown>(cacheKey);
    if (cached !== null) return jsonResponse(cached);
    if (url === "/api/arcade" && context.profileId) return jsonResponse(await offlineArcadeOverview(context.profileId));
  }
  if (!context.profileId) return jsonResponse({ error: "Choose a learner before working offline" }, 409);
  const body = parseBody(options.body);

  if (url === "/api/progress" && method === "POST") return offlineLessonCompletion(body, context);
  if (url === "/api/progress/checkpoint" && method === "POST") return offlineCheckpointSave(body, context.profileId);
  if (url === "/api/progress/checkpoint" && method === "DELETE") {
    await deleteOfflineCheckpoint(context.profileId, String(body.lessonId ?? ""));
    return jsonResponse({ ok: true, offline: true });
  }
  if (url === "/api/daily" && method === "POST") return offlineDailyCompletion(body, context);
  if (url === "/api/settings" && method === "POST") return offlineSettings(body, context.profileId);
  if (url === "/api/arcade" && method === "POST") return offlineArcadeAction(body, context);
  if (url === "/api/arcade/answer" && method === "POST") return offlineArcadeAnswer(body, context);

  return jsonResponse({ error: "This action needs a connection. Your downloaded lessons are still available." }, 503);
}

async function offlineLessonCompletion(body: Record<string, unknown>, context: OfflineRequestContext) {
  const lessonId = String(body.lessonId ?? "");
  const attemptId = String(body.attemptId ?? "");
  const total = Math.max(1, Math.floor(Number(body.total ?? 1)));
  const correct = Math.min(total, Math.max(0, Math.floor(Number(body.correct ?? 0))));
  if (!lessonId || !attemptId) return jsonResponse({ error: "Lesson attempt is incomplete" }, 400);
  const score = Math.round((correct / total) * 100);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0;
  const previous = context.progress[lessonId];
  const previousCounted = previous?.status === "completed" ? previous.stars : 0;
  const nextCounted = score >= 70 || previous?.status === "completed" ? Math.max(previous?.stars ?? 0, stars) : 0;
  const totalStars = context.totalStars + Math.max(0, nextCounted - previousCounted);
  const createdAt = new Date().toISOString();
  await enqueueOfflineEvent({
    eventId: `lesson:${attemptId}`,
    profileId: context.profileId!,
    type: "lesson-complete",
    createdAt,
    payload: { attemptId, lessonId, correct, total, timezoneOffsetMinutes: new Date().getTimezoneOffset(), ...(body.difficulty === "easy" || body.difficulty === "challenge" ? { difficulty: body.difficulty } : {}) },
  });
  await deleteOfflineCheckpoint(context.profileId!, lessonId);
  await requestBackgroundSync();
  return jsonResponse({ ok: true, offline: true, queued: true, lessonId, correct, total, score, sessionStars: stars, totalStars, streak: Math.max(1, context.streak), newlyEarned: [] });
}

async function offlineCheckpointSave(body: Record<string, unknown>, profileId: string) {
  const lessonId = String(body.lessonId ?? "");
  const attemptId = String(body.attemptId ?? "");
  if (!lessonId || !attemptId || !Array.isArray(body.problems)) return jsonResponse({ error: "Checkpoint is incomplete" }, 400);
  const updatedAt = new Date().toISOString();
  const checkpoint = await saveOfflineCheckpoint({
    profileId,
    lessonId,
    attemptId,
    ...(body.difficulty === "easy" || body.difficulty === "challenge" ? { difficulty: body.difficulty } : {}),
    problems: body.problems,
    nextIndex: Math.max(0, Math.floor(Number(body.nextIndex ?? 0))),
    correctCount: Math.max(0, Math.floor(Number(body.correctCount ?? 0))),
    total: body.problems.length,
    updatedAt,
  });
  return jsonResponse({ ...checkpoint, offline: true });
}

async function offlineDailyCompletion(body: Record<string, unknown>, context: OfflineRequestContext) {
  const total = Math.max(1, Math.floor(Number(body.total ?? 1)));
  const correct = Math.min(total, Math.max(0, Math.floor(Number(body.correct ?? 0))));
  const score = Math.round((correct / total) * 100);
  const createdAt = new Date().toISOString();
  const timezoneOffsetMinutes = new Date().getTimezoneOffset();
  const dateKey = localDateKey(new Date());
  await enqueueOfflineEvent({ eventId: `daily:${context.profileId}:${dateKey}`, profileId: context.profileId!, type: "daily-complete", createdAt, payload: { dateKey, correct, total, timezoneOffsetMinutes } });
  await requestBackgroundSync();
  return jsonResponse({ ok: true, offline: true, queued: true, score, correct, total, streak: Math.max(1, context.streak), dateKey, alreadyDone: false });
}

async function offlineSettings(body: Record<string, unknown>, profileId: string) {
  const createdAt = new Date().toISOString();
  await enqueueOfflineEvent({
    eventId: `settings:${profileId}:${crypto.randomUUID()}`,
    profileId,
    type: "profile-settings",
    createdAt,
    payload: {
      ...(typeof body.soundOn === "boolean" ? { soundOn: body.soundOn } : {}),
      ...(["preschool", "grade1", "grade2", "grade3", "grade4"].includes(String(body.level)) ? { level: body.level as Level } : {}),
    },
  });
  await requestBackgroundSync();
  return jsonResponse({ ok: true, offline: true, queued: true });
}

async function offlineArcadeAction(body: Record<string, unknown>, context: OfflineRequestContext) {
  const gameKey = body.gameKey as ArcadeGameKey;
  if (!context.level || !["star-sprint", "treasure-match", "rocket-builder"].includes(gameKey)) return jsonResponse({ error: "Choose an arcade game" }, 400);
  if (body.action === "abandon") {
    await deleteOfflineArcadeRun(context.profileId!, gameKey);
    await updateArcadeOverview(context.profileId!, (overview) => ({ ...overview, activeRuns: overview.activeRuns.filter((item) => (item as { gameKey?: string }).gameKey !== gameKey) }));
    return jsonResponse({ ok: true, offline: true });
  }
  if (body.action === "select-companion") {
    const createdAt = new Date().toISOString();
    await enqueueOfflineEvent({ eventId: `companion:${context.profileId}:${crypto.randomUUID()}`, profileId: context.profileId!, type: "profile-settings", createdAt, payload: { companionId: String(body.companionId ?? "") } });
    await updateArcadeOverview(context.profileId!, (overview) => ({ ...overview, selectedCompanion: String(body.companionId ?? overview.selectedCompanion) }));
    await requestBackgroundSync();
    return jsonResponse({ ok: true, offline: true, selectedCompanion: body.companionId });
  }
  if (body.action !== "start") return jsonResponse({ error: "Unknown arcade action" }, 400);
  const existing = await loadOfflineArcadeRun(context.profileId!, gameKey);
  const run = existing?.status === "active" ? existing : {
    key: `${context.profileId}:${gameKey}`,
    profileId: context.profileId!,
    attemptId: `offline-arcade-${crypto.randomUUID()}`,
    gameKey,
    level: context.level,
    questions: createArcadeQuestions(gameKey, context.level),
    answers: [] as ArcadeAnswerRecord[],
    nextIndex: 0,
    correctCount: 0,
    status: "active" as const,
    coinsEarned: 0,
    dailyBonus: 0,
    updatedAt: new Date().toISOString(),
  };
  await saveOfflineArcadeRun(run);
  const publicRun = publicArcadeRun(run);
  await updateArcadeOverview(context.profileId!, (overview) => ({ ...overview, activeRuns: [...overview.activeRuns.filter((item) => (item as { gameKey?: string }).gameKey !== gameKey), publicRun] }));
  return jsonResponse({ run: publicRun, resumed: Boolean(existing), offline: true });
}

async function offlineArcadeAnswer(body: Record<string, unknown>, context: OfflineRequestContext) {
  const runs = ["star-sprint", "treasure-match", "rocket-builder"] as ArcadeGameKey[];
  let run: OfflineArcadeRun | null = null;
  for (const gameKey of runs) {
    const candidate = await loadOfflineArcadeRun(context.profileId!, gameKey);
    if (candidate?.attemptId === body.attemptId) { run = candidate; break; }
  }
  if (!run || run.status !== "active") return jsonResponse({ error: "Offline arcade round not found" }, 404);
  const questionIndex = Math.floor(Number(body.questionIndex));
  const choiceIndex = Math.floor(Number(body.choiceIndex));
  if (questionIndex !== run.nextIndex) return jsonResponse({ error: "Answer the current question first" }, 409);
  const question = run.questions[questionIndex];
  if (!question || choiceIndex < 0 || choiceIndex >= question.choices.length) return jsonResponse({ error: "Choose an answer" }, 400);
  const correct = choiceIndex === question.answerIndex;
  const answer = { index: questionIndex, choiceIndex, correct };
  const nextIndex = questionIndex + 1;
  const correctCount = run.correctCount + (correct ? 1 : 0);
  const completed = nextIndex >= run.questions.length;
  const currentOverview = completed ? await offlineArcadeOverview(context.profileId!) : null;
  const reward = completed ? arcadeReward(correctCount, run.questions.length, currentOverview?.dailyBonusAvailable ?? false) : null;
  run = { ...run, answers: [...run.answers, answer], nextIndex, correctCount, status: completed ? "completed" : "active", coinsEarned: reward?.totalCoins ?? 0, dailyBonus: reward?.dailyBonus ?? 0, updatedAt: new Date().toISOString() };
  await saveOfflineArcadeRun(run);
  let coinBalance: number | undefined;
  if (completed) {
    await enqueueOfflineEvent({ eventId: `arcade:${run.attemptId}`, profileId: run.profileId, type: "arcade-complete", createdAt: run.updatedAt, payload: { attemptId: run.attemptId, gameKey: run.gameKey, level: run.level, questions: run.questions, answers: run.answers, timezoneOffsetMinutes: new Date().getTimezoneOffset() } });
    await requestBackgroundSync();
    const overview = await updateArcadeOverview(context.profileId!, (current) => {
      const gameStats = current.byGame[run!.gameKey] ?? { plays: 0, bestScore: 0, coins: 0 };
      const score = Math.round((run!.correctCount / Math.max(1, run!.questions.length)) * 100);
      return {
        ...current,
        coins: current.coins + run!.coinsEarned,
        totalWins: current.totalWins + 1,
        dailyBonusAvailable: false,
        activeRuns: current.activeRuns.filter((item) => (item as { gameKey?: string }).gameKey !== run!.gameKey),
        byGame: { ...current.byGame, [run!.gameKey]: { plays: gameStats.plays + 1, bestScore: Math.max(gameStats.bestScore, score), coins: gameStats.coins + run!.coinsEarned } },
        companions: current.companions.map((companion) => ({ ...companion, unlocked: current.coins + run!.coinsEarned >= companion.unlockCoins })),
      };
    });
    coinBalance = overview.coins;
  } else {
    const publicRun = publicArcadeRun(run);
    await updateArcadeOverview(context.profileId!, (overview) => ({ ...overview, activeRuns: [...overview.activeRuns.filter((item) => (item as { gameKey?: string }).gameKey !== run!.gameKey), publicRun] }));
  }
  return jsonResponse({
    offline: true,
    correct,
    explanation: correct ? "Great move! Saved on this device." : `Good try. The answer was ${question.choices[question.answerIndex]}.`,
    run: publicArcadeRun(run),
    ...(completed ? { coins: coinBalance } : {}),
  });
}

async function offlineArcadeOverview(profileId: string): Promise<CachedArcadeOverview> {
  const cached = await loadSnapshot<CachedArcadeOverview>(arcadeCacheKey(profileId));
  if (cached) return cached;
  const activeRuns: CachedArcadeOverview["activeRuns"] = [];
  for (const game of ARCADE_GAMES) {
    const run = await loadOfflineArcadeRun(profileId, game.key);
    if (run?.status === "active") activeRuns.push(publicArcadeRun(run));
  }
  return {
    coins: 0,
    selectedCompanion: "pip",
    companions: ARCADE_COMPANIONS.map((companion) => ({ ...companion, unlocked: companion.unlockCoins === 0 })),
    dailyBonusAvailable: true,
    totalWins: 0,
    byGame: Object.fromEntries(ARCADE_GAMES.map((game) => [game.key, { plays: 0, bestScore: 0, coins: 0 }])) as CachedArcadeOverview["byGame"],
    activeRuns,
  };
}

async function updateArcadeOverview(profileId: string, update: (overview: CachedArcadeOverview) => CachedArcadeOverview) {
  const next = update(await offlineArcadeOverview(profileId));
  await saveSnapshot(arcadeCacheKey(profileId), next);
  return next;
}

function arcadeCacheKey(profileId: string) { return `response:${profileId}:GET:/api/arcade`; }

function publicArcadeRun(run: OfflineArcadeRun | null) {
  if (!run) return null;
  return {
    attemptId: run.attemptId,
    gameKey: run.gameKey,
    nextIndex: run.nextIndex,
    correctCount: run.correctCount,
    total: run.questions.length,
    status: run.status,
    question: run.status === "active" && run.questions[run.nextIndex] ? publicQuestion(run.questions[run.nextIndex]) : null,
    coinsEarned: run.coinsEarned,
    dailyBonus: run.dailyBonus,
    score: run.status === "completed" ? Math.round((run.correctCount / Math.max(1, run.questions.length)) * 100) : undefined,
  };
}

function parseBody(body: BodyInit | null | undefined): Record<string, unknown> {
  if (typeof body !== "string") return {};
  try { return JSON.parse(body) as Record<string, unknown>; } catch { return {}; }
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json", "x-math-stars-offline": "1" } });
}
