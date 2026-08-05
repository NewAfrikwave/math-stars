import type { Domain, Lesson, LessonProgressState } from "@/lib/types";

export interface NextMission {
  lesson: Lesson;
  domain: Domain;
  returning: boolean;
}

export function chooseNextMission(
  curriculum: Domain[],
  progress: Record<string, LessonProgressState>,
): NextMission {
  const lessons = curriculum.flatMap((domain) =>
    domain.lessons.map((lesson) => ({ lesson, domain })),
  );

  // A partially completed mission always wins, even when another domain has
  // an earlier available lesson. This makes the first dashboard card a true
  // "continue where you left off" action.
  const inProgress = lessons.find(({ lesson }) => progress[lesson.id]?.status === "in-progress");
  if (inProgress) return { ...inProgress, returning: true };

  const nextAvailable = lessons.find(({ lesson }) => {
    const state = progress[lesson.id];
    return !state || state.status === "available";
  });
  if (nextAvailable) return { ...nextAvailable, returning: false };

  return { lesson: curriculum[0].lessons[0], domain: curriculum[0], returning: false };
}
