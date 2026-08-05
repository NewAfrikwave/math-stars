import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ALL_LESSONS, CURRICULUM, isLessonAvailable } from "@/lib/curriculum";
import { PRESCHOOL_CURRICULUM, PRESCHOOL_LESSON_IDS, psIsLessonAvailable } from "@/lib/preschool";
import { GRADE1_CURRICULUM, GRADE1_LESSON_IDS, isLessonAvailable as isG1LessonAvailable } from "@/lib/grade1";
import { GRADE2_CURRICULUM, GRADE2_LESSON_IDS, isLessonAvailable as isG2LessonAvailable } from "@/lib/grade2";
import { GRADE4_CURRICULUM, GRADE4_LESSON_IDS, isLessonAvailable as isG4LessonAvailable } from "@/lib/grade4";
import { ACHIEVEMENTS } from "@/lib/achievements";
import type { LessonStatus } from "@/lib/types";

interface SaveInput {
  studentId: string;
  level: string;
  lessonId: string;
  title: string;
  emoji: string;
  correct: number;
  total: number;
  score: number;
  stars: number;
  difficulty: "easy" | "challenge" | null;
  attemptId: string;
}

export function streakAfterCompletion(previous: number, lastCompletion: Date | null, today: Date) {
  const sameDay = !!lastCompletion
    && lastCompletion.getFullYear() === today.getFullYear()
    && lastCompletion.getMonth() === today.getMonth()
    && lastCompletion.getDate() === today.getDate();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const wasYesterday = !!lastCompletion
    && lastCompletion.getFullYear() === yesterday.getFullYear()
    && lastCompletion.getMonth() === yesterday.getMonth()
    && lastCompletion.getDate() === yesterday.getDate();
  if (sameDay) return Math.max(previous, 1);
  if (wasYesterday) return previous + 1;
  return 1;
}

export function latestCompletionDate(values: Array<Date | null | undefined>) {
  return values.reduce<Date | null>((latest, value) => {
    if (!value) return latest;
    return !latest || value.getTime() > latest.getTime() ? value : latest;
  }, null);
}

export async function saveProgressAttempt(input: SaveInput) {
  try {
    return await db.$transaction(async (tx) => {
      const priorAttempt = await tx.activityEvent.findUnique({ where: { attemptId: input.attemptId } });
      if (priorAttempt) {
        return priorAttempt.studentId === input.studentId
          ? { kind: "duplicate" as const, event: priorAttempt }
          : { kind: "error" as const, status: 409, error: "attempt id already used" };
      }

      const student = await tx.student.findUniqueOrThrow({ where: { id: input.studentId } });
      const existing = await tx.lessonProgress.findUnique({
        where: { studentId_lessonId: { studentId: input.studentId, lessonId: input.lessonId } },
      });
      const currentRows = await tx.lessonProgress.findMany({ where: { studentId: input.studentId } });
      const latestDaily = await tx.dailyChallenge.findFirst({
        where: { studentId: input.studentId },
        orderBy: { completedAt: "desc" },
        select: { completedAt: true },
      });
      const completedBefore = (id: string) => currentRows.some((row) => row.lessonId === id && row.status === "completed");
      const availableByRules = input.level === "preschool" ? psIsLessonAvailable(input.lessonId, completedBefore)
        : input.level === "grade1" ? isG1LessonAvailable(input.lessonId, completedBefore)
        : input.level === "grade2" ? isG2LessonAvailable(input.lessonId, completedBefore)
        : input.level === "grade4" ? isG4LessonAvailable(input.lessonId, completedBefore)
        : isLessonAvailable(input.lessonId, completedBefore);
      if (existing?.status === "locked" || (!existing && !availableByRules)) {
        return { kind: "error" as const, status: 403, error: "lesson is locked" };
      }

      const now = new Date();
      const passed = input.score >= 70;
      const wasCompleted = existing?.status === "completed";
      const nextStatus: LessonStatus = wasCompleted || passed ? "completed" : "in-progress";
      const newBest = Math.max(existing?.bestScore ?? 0, input.score);
      const newStars = Math.max(existing?.stars ?? 0, input.stars);
      const row = await tx.lessonProgress.upsert({
        where: { studentId_lessonId: { studentId: input.studentId, lessonId: input.lessonId } },
        create: {
          studentId: input.studentId, lessonId: input.lessonId, status: nextStatus,
          stars: newStars, bestScore: newBest, attempts: 1, lastScore: input.score,
          lastDifficulty: input.difficulty, completedAt: passed ? now : null, lastPlayedAt: now,
        },
        update: {
          status: nextStatus, stars: newStars, bestScore: newBest, attempts: { increment: 1 },
          lastScore: input.score, lastDifficulty: input.difficulty ?? existing?.lastDifficulty ?? null,
          completedAt: wasCompleted ? existing?.completedAt : passed ? now : null, lastPlayedAt: now,
        },
      });

      const rowsAfterAttempt = await tx.lessonProgress.findMany({ where: { studentId: input.studentId } });
      const byLesson = new Map(rowsAfterAttempt.map((progress) => [progress.lessonId, progress]));
      const isCompletedDb = (id: string) => byLesson.get(id)?.status === "completed";
      const unlock = async (lessonId: string, available: boolean) => {
        const progress = byLesson.get(lessonId);
        if (!available || progress?.status === "completed" || (progress && progress.status !== "locked")) return;
        if (progress) {
          await tx.lessonProgress.update({ where: { id: progress.id }, data: { status: "available" } });
        } else {
          await tx.lessonProgress.create({ data: { studentId: input.studentId, lessonId, status: "available" } });
        }
      };
      for (const item of ALL_LESSONS) await unlock(item.lessonId, isLessonAvailable(item.lessonId, isCompletedDb));
      for (const id of PRESCHOOL_LESSON_IDS) await unlock(id, psIsLessonAvailable(id, isCompletedDb));
      for (const id of GRADE1_LESSON_IDS) await unlock(id, isG1LessonAvailable(id, isCompletedDb));
      for (const id of GRADE2_LESSON_IDS) await unlock(id, isG2LessonAvailable(id, isCompletedDb));
      for (const id of GRADE4_LESSON_IDS) await unlock(id, isG4LessonAvailable(id, isCompletedDb));

      const freshRows = await tx.lessonProgress.findMany({ where: { studentId: input.studentId } });
      const totalStars = freshRows.filter((progress) => progress.status === "completed").reduce((sum, progress) => sum + progress.stars, 0);
      // Existing Railway learners have no lastCompletedAt yet. Backfill from
      // successful persisted work only, never from lastPlayedAt (which also
      // includes failed practice attempts).
      const legacyCompletion = latestCompletionDate([
        ...currentRows.map((progress) => progress.completedAt),
        latestDaily?.completedAt,
      ]);
      const lastCompletion = student.lastCompletedAt ?? legacyCompletion;
      const streak = !wasCompleted && passed
        ? streakAfterCompletion(student.streak, lastCompletion, now)
        : student.streak;
      await tx.student.update({
        where: { id: input.studentId },
        data: {
          totalStars,
          streak,
          lastPlayedAt: now,
          lastCompletedAt: !wasCompleted && passed ? now : lastCompletion,
        },
      });

      const completedCount = freshRows.filter((progress) => progress.status === "completed").length;
      const perfectLessons = freshRows.filter((progress) => progress.status === "completed" && progress.stars >= 3).length;
      const domainCompletion: Record<string, number> = {};
      for (const domain of [...CURRICULUM, ...PRESCHOOL_CURRICULUM, ...GRADE1_CURRICULUM, ...GRADE2_CURRICULUM, ...GRADE4_CURRICULUM]) {
        domainCompletion[domain.id] = domain.lessons.filter((lesson) => freshRows.some((progress) => progress.lessonId === lesson.id && progress.status === "completed")).length;
      }
      const context = { totalStars, completedCount, domainCompletion, perfectLessons, streak };
      const alreadyEarned = new Set((await tx.achievement.findMany({ where: { studentId: input.studentId } })).map((achievement) => achievement.achievementId));
      const newlyEarned: string[] = [];
      for (const achievement of ACHIEVEMENTS) {
        if (!alreadyEarned.has(achievement.id) && achievement.check(context)) {
          await tx.achievement.upsert({
            where: { studentId_achievementId: { studentId: input.studentId, achievementId: achievement.id } },
            create: { studentId: input.studentId, achievementId: achievement.id },
            update: {},
          });
          newlyEarned.push(achievement.id);
        }
      }

      const event = await tx.activityEvent.create({
        data: {
          studentId: input.studentId, attemptId: input.attemptId, type: "lesson", lessonId: input.lessonId,
          title: input.title, emoji: input.emoji, score: input.score, correct: input.correct,
          total: input.total, stars: input.stars,
          earnedAchievementIds: newlyEarned.length > 0 ? JSON.stringify(newlyEarned) : null,
        },
      });
      await tx.lessonCheckpoint.deleteMany({
        where: { studentId: input.studentId, lessonId: input.lessonId, attemptId: input.attemptId },
      });
      return { kind: "saved" as const, event, row, passed, newBest, newStars, totalStars, streak, newlyEarned };
    }, { maxWait: 5_000, timeout: 20_000 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034", "P1008"].includes(error.code)) {
      for (let retry = 0; retry < 3; retry += 1) {
        const event = await db.activityEvent.findUnique({ where: { attemptId: input.attemptId } });
        if (event && event.studentId === input.studentId) return { kind: "duplicate" as const, event };
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    }
    throw error;
  }
}
