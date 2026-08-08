import type { Domain, LessonProgressState, Level } from "@/lib/types";
import { CURRICULUM } from "@/lib/curriculum";
import { PRESCHOOL_CURRICULUM } from "@/lib/preschool";
import { GRADE1_CURRICULUM } from "@/lib/grade1";
import { GRADE2_CURRICULUM } from "@/lib/grade2";
import { GRADE4_CURRICULUM } from "@/lib/grade4";

export interface DomainMastery {
  domainId: string;
  title: string;
  emoji: string;
  score: number;
  band: "Starting" | "Growing" | "Secure" | "Mastered";
  completed: number;
  total: number;
  nextLessonId: string | null;
  recommendation: string;
}

export function buildMasteryMap(level: Level | null, progress: Record<string, LessonProgressState>) {
  return curriculumForLevel(level).map((domain) => masteryForDomain(domain, progress));
}

export function recommendedMission(level: Level | null, progress: Record<string, LessonProgressState>) {
  const domains = buildMasteryMap(level, progress);
  return [...domains]
    .filter((domain) => domain.nextLessonId)
    .sort((a, b) => a.score - b.score || a.completed - b.completed)[0] ?? domains[0] ?? null;
}

function masteryForDomain(domain: Domain, progress: Record<string, LessonProgressState>): DomainMastery {
  const rows = domain.lessons.map((lesson) => progress[lesson.id]).filter(Boolean);
  const completed = rows.filter((row) => row.status === "completed");
  const completion = domain.lessons.length ? completed.length / domain.lessons.length : 0;
  const accuracy = completed.length ? completed.reduce((sum, row) => sum + row.bestScore, 0) / completed.length / 100 : 0;
  const independence = rows.length ? rows.reduce((sum, row) => sum + Math.min(1, row.bestScore / Math.max(70, row.attempts * 20)), 0) / rows.length : 0;
  const score = Math.round((completion * .55 + accuracy * .35 + independence * .10) * 100);
  const nextLesson = domain.lessons.find((lesson) => progress[lesson.id]?.status === "in-progress")
    ?? domain.lessons.find((lesson) => progress[lesson.id]?.status === "available")
    ?? [...domain.lessons].sort((a, b) => (progress[a.id]?.bestScore ?? 101) - (progress[b.id]?.bestScore ?? 101))[0]
    ?? null;
  const band = score >= 90 ? "Mastered" : score >= 70 ? "Secure" : score >= 35 ? "Growing" : "Starting";
  const recommendation = completed.length === domain.lessons.length
    ? `Review ${nextLesson?.title ?? domain.title} to keep the skill strong.`
    : completed.length === 0
      ? `Begin with ${nextLesson?.title ?? domain.title}.`
      : `Continue with ${nextLesson?.title ?? domain.title}.`;
  return { domainId: domain.id, title: domain.title, emoji: domain.emoji, score, band, completed: completed.length, total: domain.lessons.length, nextLessonId: nextLesson?.id ?? null, recommendation };
}

function curriculumForLevel(level: Level | null): Domain[] {
  if (level === "preschool") return PRESCHOOL_CURRICULUM;
  if (level === "grade1") return GRADE1_CURRICULUM;
  if (level === "grade2") return GRADE2_CURRICULUM;
  if (level === "grade4") return GRADE4_CURRICULUM;
  return CURRICULUM;
}
