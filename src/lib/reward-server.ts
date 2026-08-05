import { db } from "@/lib/db";
import { rewardMission } from "@/lib/rewards";

export async function getCurrentRewardMission(studentId: string) {
  const student = await db.student.findUniqueOrThrow({ where: { id: studentId } });
  const reward = await db.rewardGoal.findUnique({ where: { currentKey: studentId } });
  if (!reward) return null;
  const [rows, arcadeWins] = await Promise.all([
    db.lessonProgress.findMany({
      where: { studentId, status: "completed" },
      select: { lessonId: true },
    }),
    db.arcadeRun.count({ where: { studentId, status: "completed" } }),
  ]);
  const mission = rewardMission(reward, {
    totalStars: student.totalStars,
    completedLessonIds: rows.map((row) => row.lessonId),
    level: student.level,
    arcadeCoins: student.arcadeCoins,
    arcadeWins,
  });
  if (reward.status === "active" && mission.status === "earned") {
    const earnedAt = new Date();
    await db.rewardGoal.update({
      where: { id: reward.id },
      data: { status: "earned", earnedAt },
    });
    return { ...mission, status: "earned" as const, earnedAt: earnedAt.toISOString() };
  }
  return mission;
}
