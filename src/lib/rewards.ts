import type { RewardGoal } from "@prisma/client";
import { CURRICULUM } from "@/lib/curriculum";
import { PRESCHOOL_CURRICULUM } from "@/lib/preschool";
import { GRADE1_CURRICULUM } from "@/lib/grade1";
import { GRADE2_CURRICULUM } from "@/lib/grade2";
import { GRADE4_CURRICULUM } from "@/lib/grade4";

export type RewardTargetType = "lessons" | "stars" | "topic" | "arcade-wins" | "coins";

export interface RewardMission {
  id: string;
  title: string;
  emoji: string;
  description: string | null;
  targetType: RewardTargetType;
  targetValue: number;
  currentValue: number;
  remaining: number;
  percent: number;
  domainId: string | null;
  domainTitle: string | null;
  status: "active" | "earned" | "claimed" | "archived";
  earnedAt: string | null;
}

export const REWARD_PRESETS = [
  { emoji: "🍟", title: "McDonald’s trip" },
  { emoji: "🧸", title: "Choose a toy" },
  { emoji: "🎬", title: "Family movie night" },
  { emoji: "🍦", title: "Ice cream treat" },
  { emoji: "🎮", title: "Extra game time" },
] as const;

const curriculaByLevel = {
  preschool: PRESCHOOL_CURRICULUM,
  grade1: GRADE1_CURRICULUM,
  grade2: GRADE2_CURRICULUM,
  grade3: CURRICULUM,
  grade4: GRADE4_CURRICULUM,
};

export function domainsForLevel(level: string) {
  return curriculaByLevel[level as keyof typeof curriculaByLevel] ?? CURRICULUM;
}

export function topicGoalBaseline(domainLessonIds: string[], completedLessonIds: Iterable<string>) {
  const completed = new Set(completedLessonIds);
  const startValue = domainLessonIds.filter((lessonId) => completed.has(lessonId)).length;
  const targetValue = domainLessonIds.length - startValue;
  return targetValue > 0 ? { startValue, targetValue } : null;
}

export function rewardMission(
  reward: RewardGoal,
  input: { totalStars: number; completedLessonIds: string[]; level: string; arcadeCoins?: number; arcadeWins?: number },
): RewardMission {
  const completed = new Set(input.completedLessonIds);
  const domain = reward.domainId
    ? domainsForLevel(input.level).find((item) => item.id === reward.domainId)
    : null;

  let currentValue = 0;
  let targetValue = Math.max(1, reward.targetValue);
  if (reward.targetType === "stars") {
    currentValue = Math.max(0, input.totalStars - reward.startValue);
  } else if (reward.targetType === "coins") {
    currentValue = Math.max(0, (input.arcadeCoins ?? 0) - reward.startValue);
  } else if (reward.targetType === "arcade-wins") {
    currentValue = Math.max(0, (input.arcadeWins ?? 0) - reward.startValue);
  } else if (reward.targetType === "topic" && domain) {
    const completedInDomain = domain.lessons.filter((lesson) => completed.has(lesson.id)).length;
    currentValue = Math.max(0, completedInDomain - reward.startValue);
  } else {
    currentValue = Math.max(0, completed.size - reward.startValue);
  }

  const reached = currentValue >= targetValue;
  const status = reward.status === "active" && reached ? "earned" : reward.status;
  return {
    id: reward.id,
    title: reward.title,
    emoji: reward.emoji,
    description: reward.description,
    targetType: reward.targetType as RewardTargetType,
    targetValue,
    currentValue: Math.min(currentValue, targetValue),
    remaining: Math.max(0, targetValue - currentValue),
    percent: Math.min(100, Math.round((currentValue / targetValue) * 100)),
    domainId: reward.domainId,
    domainTitle: domain?.title ?? null,
    status: status as RewardMission["status"],
    earnedAt: reward.earnedAt?.toISOString() ?? null,
  };
}
