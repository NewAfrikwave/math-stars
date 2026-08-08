import type { Domain, Lesson, LessonProgressState } from "@/lib/types";

export interface NextMission {
  lesson: Lesson;
  domain: Domain;
  returning: boolean;
  gradeComplete: boolean;
}

export function chooseNextMission(
  curriculum: Domain[],
  progress: Record<string, LessonProgressState>,
  checkpointLessonId?: string,
): NextMission {
  const lessons = curriculum.flatMap((domain) =>
    domain.lessons.map((lesson) => ({ lesson, domain })),
  );

  // A saved practice set is the most precise source of "where you left off."
  // It also wins when the learner is replaying a lesson they already mastered;
  // mastery remains completed while the dashboard still resumes the replay.
  const checkpointLesson = checkpointLessonId
    ? lessons.find(({ lesson }) => lesson.id === checkpointLessonId)
    : undefined;
  if (checkpointLesson) return { ...checkpointLesson, returning: true, gradeComplete: false };

  // A partially completed mission always wins, even when another domain has
  // an earlier available lesson. This makes the first dashboard card a true
  // "continue where you left off" action.
  const inProgress = lessons.find(({ lesson }) => progress[lesson.id]?.status === "in-progress");
  if (inProgress) return { ...inProgress, returning: true, gradeComplete: false };

  const nextAvailable = lessons.find(({ lesson }) => {
    const state = progress[lesson.id];
    return !state || state.status === "available";
  });
  if (nextAvailable) return { ...nextAvailable, returning: false, gradeComplete: false };

  const gradeComplete = lessons.length > 0
    && lessons.every(({ lesson }) => progress[lesson.id]?.status === "completed");
  if (!gradeComplete) {
    return { lesson: curriculum[0].lessons[0], domain: curriculum[0], returning: false, gradeComplete: false };
  }

  const review = [...lessons].sort((left, right) => {
    const leftProgress = progress[left.lesson.id];
    const rightProgress = progress[right.lesson.id];
    const scoreDifference = (leftProgress?.bestScore ?? 0) - (rightProgress?.bestScore ?? 0);
    if (scoreDifference !== 0) return scoreDifference;
    const leftCompleted = leftProgress?.completedAt ? Date.parse(leftProgress.completedAt) : 0;
    const rightCompleted = rightProgress?.completedAt ? Date.parse(rightProgress.completedAt) : 0;
    if (leftCompleted !== rightCompleted) return leftCompleted - rightCompleted;
    return (leftProgress?.attempts ?? 0) - (rightProgress?.attempts ?? 0);
  })[0] ?? { lesson: curriculum[0].lessons[0], domain: curriculum[0] };

  return { ...review, returning: false, gradeComplete: true };
}
