import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { CURRICULUM } from "@/lib/curriculum";
import { PRESCHOOL_CURRICULUM } from "@/lib/preschool";
import { GRADE1_CURRICULUM } from "@/lib/grade1";
import { GRADE2_CURRICULUM } from "@/lib/grade2";
import { GRADE4_CURRICULUM } from "@/lib/grade4";
import { ARCADE_GAMES, arcadeReward, isArcadeGameKey, parseArcadeQuestions } from "@/lib/arcade";
import { consecutiveLearningStreak, saveProgressAttempt } from "@/lib/progress-save";
import type { OfflineEvent } from "@/lib/offline/types";
import type { Level } from "@/lib/types";

const LEVELS = new Set<Level>(["preschool", "grade1", "grade2", "grade3", "grade4"]);

export function validOfflineDate(value: string, now = new Date()) {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return null;
  const earliest = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
  const latest = new Date(now.getTime() + 10 * 60 * 1000);
  return parsed >= earliest && parsed <= latest ? parsed : null;
}

export async function processOfflineEvent(student: { id: string; level: string; arcadeCoins: number }, event: OfflineEvent) {
  if (event.profileId !== student.id) throw new OfflineSyncError(403, "Event belongs to another learner");
  const occurredAt = validOfflineDate(event.createdAt);
  if (!occurredAt) throw new OfflineSyncError(400, "Event date is outside the offline sync window");

  if (event.type === "lesson-complete") return syncLesson(student, event, occurredAt);
  if (event.type === "daily-complete") return syncDaily(student.id, event, occurredAt);
  if (event.type === "arcade-complete") return syncArcade(student, event, occurredAt);
  return syncProfileSettings(student, event);
}

async function syncLesson(student: { id: string; level: string }, event: Extract<OfflineEvent, { type: "lesson-complete" }>, occurredAt: Date) {
  const lesson = findLesson(event.payload.lessonId);
  if (!lesson || lesson.level !== student.level) throw new OfflineSyncError(403, "Lesson is not in this learner's grade");
  const total = Math.max(1, Math.floor(event.payload.total));
  const correct = Math.min(total, Math.max(0, Math.floor(event.payload.correct)));
  const score = Math.round((correct / total) * 100);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0;
  const result = await saveProgressAttempt({
    studentId: student.id,
    level: student.level,
    lessonId: lesson.id,
    title: lesson.title,
    emoji: lesson.emoji,
    correct,
    total,
    score,
    stars,
    difficulty: event.payload.difficulty === "easy" || event.payload.difficulty === "challenge" ? event.payload.difficulty : null,
    attemptId: event.payload.attemptId,
    occurredAt: middayForClientDate(occurredAt, event.payload.timezoneOffsetMinutes),
  });
  if (result.kind === "error") throw new OfflineSyncError(result.status, result.error);
  return { duplicate: result.kind === "duplicate" };
}

async function syncDaily(studentId: string, event: Extract<OfflineEvent, { type: "daily-complete" }>, occurredAt: Date) {
  const expectedDateKey = dateKeyAtOffset(occurredAt, event.payload.timezoneOffsetMinutes);
  if (event.payload.dateKey !== expectedDateKey) throw new OfflineSyncError(400, "Daily challenge date does not match its completion time");
  const total = Math.max(1, Math.floor(event.payload.total));
  const correct = Math.min(total, Math.max(0, Math.floor(event.payload.correct)));
  const score = Math.round((correct / total) * 100);
  const storedCompletionTime = new Date(`${expectedDateKey}T12:00:00.000Z`);
  try {
    return await db.$transaction(async (tx) => {
      const existing = await tx.dailyChallenge.findUnique({ where: { studentId_dateKey: { studentId, dateKey: expectedDateKey } } });
      if (existing) return { duplicate: true };
      await tx.dailyChallenge.create({ data: { studentId, dateKey: expectedDateKey, score, correct, total, completedAt: storedCompletionTime } });
      await tx.activityEvent.create({ data: { studentId, attemptId: event.eventId, type: "daily", title: "Daily Challenge", emoji: "⚡", score, correct, total, createdAt: storedCompletionTime } });
      const [lessonDates, dailyDates] = await Promise.all([
        tx.lessonProgress.findMany({ where: { studentId, completedAt: { not: null } }, select: { completedAt: true } }),
        tx.dailyChallenge.findMany({ where: { studentId }, select: { completedAt: true } }),
      ]);
      const dates = [...lessonDates.map((row) => row.completedAt).filter((value): value is Date => Boolean(value)), ...dailyDates.map((row) => row.completedAt)];
      const lastCompletedAt = dates.reduce<Date | null>((latest, value) => !latest || value > latest ? value : latest, null);
      await tx.student.update({ where: { id: studentId }, data: { streak: consecutiveLearningStreak(dates), lastCompletedAt, lastPlayedAt: lastCompletedAt } });
      return { duplicate: false };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { duplicate: true };
    throw error;
  }
}

async function syncArcade(
  student: { id: string; level: string },
  event: Extract<OfflineEvent, { type: "arcade-complete" }>,
  occurredAt: Date,
) {
  if (!isArcadeGameKey(event.payload.gameKey) || !LEVELS.has(event.payload.level) || event.payload.level !== student.level) {
    throw new OfflineSyncError(400, "Arcade round does not match this learner");
  }
  const questions = parseArcadeQuestions(JSON.stringify(event.payload.questions));
  if (!questions || questions.length < 1) throw new OfflineSyncError(400, "Arcade questions are invalid");
  const answers = event.payload.answers
    .filter((answer) => Number.isInteger(answer.index) && Number.isInteger(answer.choiceIndex))
    .sort((a, b) => a.index - b.index);
  if (answers.length !== questions.length || answers.some((answer, index) => answer.index !== index)) {
    throw new OfflineSyncError(400, "Arcade round is incomplete");
  }
  const normalizedAnswers = answers.map((answer, index) => ({
    index,
    choiceIndex: answer.choiceIndex,
    correct: answer.choiceIndex === questions[index].answerIndex,
  }));
  const correctCount = normalizedAnswers.filter((answer) => answer.correct).length;
  const dateKey = dateKeyAtOffset(occurredAt, event.payload.timezoneOffsetMinutes);
  const offset = safeOffset(event.payload.timezoneOffsetMinutes);
  const start = new Date(`${dateKey}T00:00:00.000Z`);
  start.setUTCMinutes(start.getUTCMinutes() + offset);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const game = ARCADE_GAMES.find((item) => item.key === event.payload.gameKey);

  try {
    return await db.$transaction(async (tx) => {
      const existing = await tx.arcadeRun.findUnique({ where: { attemptId: event.payload.attemptId } });
      if (existing) return { duplicate: true };
      const bonusAlreadyAwarded = await tx.arcadeRun.count({ where: { studentId: student.id, dailyBonus: { gt: 0 }, completedAt: { gte: start, lt: end } } });
      const reward = arcadeReward(correctCount, questions.length, bonusAlreadyAwarded === 0);
      await tx.arcadeRun.create({
        data: {
          studentId: student.id,
          attemptId: event.payload.attemptId,
          gameKey: event.payload.gameKey,
          level: event.payload.level,
          questionsJson: JSON.stringify(questions),
          answersJson: JSON.stringify(normalizedAnswers),
          nextIndex: questions.length,
          correctCount,
          total: questions.length,
          status: "completed",
          coinsEarned: reward.totalCoins,
          dailyBonus: reward.dailyBonus,
          completedAt: occurredAt,
          createdAt: occurredAt,
        },
      });
      const currentStudent = await tx.student.findUniqueOrThrow({ where: { id: student.id } });
      const lastBonusDate = currentStudent.arcadeLastBonusDate && currentStudent.arcadeLastBonusDate > dateKey ? currentStudent.arcadeLastBonusDate : dateKey;
      await tx.student.update({ where: { id: student.id }, data: { arcadeCoins: { increment: reward.totalCoins }, arcadeLastBonusDate: reward.dailyBonus > 0 ? lastBonusDate : currentStudent.arcadeLastBonusDate, lastPlayedAt: occurredAt } });
      await tx.activityEvent.create({ data: { studentId: student.id, attemptId: event.payload.attemptId, type: "arcade", lessonId: event.payload.gameKey, title: game?.title ?? "Math Adventure Arcade", emoji: game?.emoji ?? "🎮", score: reward.score, correct: correctCount, total: questions.length, coins: reward.totalCoins, createdAt: occurredAt } });
      return { duplicate: false };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { duplicate: true };
    throw error;
  }
}

async function syncProfileSettings(student: { id: string; arcadeCoins: number }, event: Extract<OfflineEvent, { type: "profile-settings" }>) {
  const data: { soundOn?: boolean; level?: Level; arcadeCompanion?: string } = {};
  if (typeof event.payload.soundOn === "boolean") data.soundOn = event.payload.soundOn;
  if (event.payload.level && LEVELS.has(event.payload.level)) data.level = event.payload.level;
  if (event.payload.companionId) {
    const companion = (await import("@/lib/arcade")).ARCADE_COMPANIONS.find((item) => item.id === event.payload.companionId);
    if (!companion || student.arcadeCoins < companion.unlockCoins) throw new OfflineSyncError(403, "Arcade companion is still locked");
    data.arcadeCompanion = companion.id;
  }
  await db.student.update({ where: { id: student.id }, data });
  return { duplicate: false };
}

function findLesson(lessonId: string) {
  const groups = [
    { level: "preschool", curricula: PRESCHOOL_CURRICULUM },
    { level: "grade1", curricula: GRADE1_CURRICULUM },
    { level: "grade2", curricula: GRADE2_CURRICULUM },
    { level: "grade3", curricula: CURRICULUM },
    { level: "grade4", curricula: GRADE4_CURRICULUM },
  ];
  for (const group of groups) {
    const lesson = group.curricula.flatMap((domain) => domain.lessons).find((item) => item.id === lessonId);
    if (lesson) return { ...lesson, level: group.level };
  }
  return null;
}

function safeOffset(value: number) { return Number.isFinite(value) && Math.abs(value) <= 14 * 60 ? Math.round(value) : 0; }
function dateKeyAtOffset(date: Date, timezoneOffsetMinutes: number) {
  return new Date(date.getTime() - safeOffset(timezoneOffsetMinutes) * 60_000).toISOString().slice(0, 10);
}
function middayForClientDate(date: Date, timezoneOffsetMinutes: number) { return new Date(`${dateKeyAtOffset(date, timezoneOffsetMinutes)}T12:00:00.000Z`); }

export class OfflineSyncError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
