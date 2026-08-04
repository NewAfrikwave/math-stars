import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStudentForRequest, toProgressMap } from "@/lib/student";
import { ALL_LESSONS, CURRICULUM, isLessonAvailable } from "@/lib/curriculum";
import { PRESCHOOL_CURRICULUM, PRESCHOOL_LESSON_IDS, psIsLessonAvailable } from "@/lib/preschool";
import { GRADE1_CURRICULUM, GRADE1_LESSON_IDS, isLessonAvailable as isG1LessonAvailable } from "@/lib/grade1";
import { GRADE2_CURRICULUM, GRADE2_LESSON_IDS, isLessonAvailable as isG2LessonAvailable } from "@/lib/grade2";
import { GRADE4_CURRICULUM, GRADE4_LESSON_IDS, isLessonAvailable as isG4LessonAvailable } from "@/lib/grade4";
import type { LessonProgressState, LessonStatus, Level } from "@/lib/types";
import { getCurrentRewardMission } from "@/lib/reward-server";

// GET /api/state — load the learner's full saved state.
// On first run this creates the default student and seeds availability
// for the first lesson so the learner can begin immediately.
export async function GET(req: Request) {
  const student = await getStudentForRequest(req);

  const rows = await db.lessonProgress.findMany({
    where: { studentId: student.id },
  });

  const progress = toProgressMap(rows);

  // Ensure every lesson has an entry; availability is per-domain (first lesson
  // of each domain is open; later lessons unlock when their prerequisite is done).
  const isCompleted = (id: string) => progress[id]?.status === "completed";
  const computed: Record<string, LessonProgressState> = {};
  // grade-3
  for (const fl of ALL_LESSONS) {
    const existing = progress[fl.lessonId];
    if (existing) {
      computed[fl.lessonId] = existing;
    } else {
      const available = isLessonAvailable(fl.lessonId, isCompleted);
      computed[fl.lessonId] = {
        lessonId: fl.lessonId,
        status: available ? ("available" as LessonStatus) : ("locked" as LessonStatus),
        stars: 0,
        bestScore: 0,
        attempts: 0,
        lastScore: 0,
        completedAt: null,
      };
    }
  }
  // preschool
  for (const id of PRESCHOOL_LESSON_IDS) {
    const existing = progress[id];
    if (existing) {
      computed[id] = existing;
    } else {
      const available = psIsLessonAvailable(id, isCompleted);
      computed[id] = {
        lessonId: id,
        status: available ? ("available" as LessonStatus) : ("locked" as LessonStatus),
        stars: 0, bestScore: 0, attempts: 0, lastScore: 0, completedAt: null,
      };
    }
  }
  // grade 1
  for (const id of GRADE1_LESSON_IDS) {
    const existing = progress[id];
    if (existing) { computed[id] = existing; }
    else {
      const available = isG1LessonAvailable(id, isCompleted);
      computed[id] = { lessonId: id, status: available ? ("available" as LessonStatus) : ("locked" as LessonStatus), stars: 0, bestScore: 0, attempts: 0, lastScore: 0, completedAt: null };
    }
  }
  // grade 2
  for (const id of GRADE2_LESSON_IDS) {
    const existing = progress[id];
    if (existing) { computed[id] = existing; }
    else {
      const available = isG2LessonAvailable(id, isCompleted);
      computed[id] = { lessonId: id, status: available ? ("available" as LessonStatus) : ("locked" as LessonStatus), stars: 0, bestScore: 0, attempts: 0, lastScore: 0, completedAt: null };
    }
  }
  // grade 4
  for (const id of GRADE4_LESSON_IDS) {
    const existing = progress[id];
    if (existing) { computed[id] = existing; }
    else {
      const available = isG4LessonAvailable(id, isCompleted);
      computed[id] = { lessonId: id, status: available ? ("available" as LessonStatus) : ("locked" as LessonStatus), stars: 0, bestScore: 0, attempts: 0, lastScore: 0, completedAt: null };
    }
  }

  const achievements = await db.achievement.findMany({
    where: { studentId: student.id },
    select: { achievementId: true },
  });

  // today's daily challenge, if any
  const today = new Date().toISOString().slice(0, 10);
  const todayDaily = await db.dailyChallenge.findUnique({
    where: { studentId_dateKey: { studentId: student.id, dateKey: today } },
  });

  const level: Level | null =
    student.level === "preschool" || student.level === "grade1" || student.level === "grade2" || student.level === "grade3" || student.level === "grade4"
      ? student.level
      : null;

  const reward = await getCurrentRewardMission(student.id);

  return NextResponse.json({
    studentName: student.name,
    level,
    totalStars: student.totalStars,
    streak: student.streak,
    soundOn: student.soundOn,
    progress: computed,
    earnedAchievements: achievements.map((a) => a.achievementId),
    dailyDoneDate: todayDaily?.dateKey ?? null,
    dailyScore: todayDaily?.score ?? null,
    reward,
    domainCount: CURRICULUM.length + PRESCHOOL_CURRICULUM.length + GRADE1_CURRICULUM.length + GRADE2_CURRICULUM.length + GRADE4_CURRICULUM.length,
    lessonCount: ALL_LESSONS.length + PRESCHOOL_LESSON_IDS.length + GRADE1_LESSON_IDS.length + GRADE2_LESSON_IDS.length + GRADE4_LESSON_IDS.length,
  });
}
