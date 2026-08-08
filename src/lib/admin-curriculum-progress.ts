type CurriculumDomain = {
  id: string;
  title: string;
  emoji: string;
  lessons: readonly { id: string }[];
};

type GradeDefinition = {
  level: string;
  curricula: readonly CurriculumDomain[];
};

type Learner = {
  id: string;
  level: string;
};

type CompletedLesson = {
  studentId: string;
  lessonId: string;
};

export function buildCurriculumDomainStats(
  gradeDefinitions: readonly GradeDefinition[],
  learners: readonly Learner[],
  completedLessons: readonly CompletedLesson[],
) {
  return gradeDefinitions.flatMap((grade) => {
    const gradeLearnerIds = new Set(
      learners.filter((learner) => learner.level === grade.level).map((learner) => learner.id),
    );

    return grade.curricula.map((domain) => {
      const domainLessonIds = new Set(domain.lessons.map((lesson) => lesson.id));
      const completed = completedLessons.filter(
        (progress) => gradeLearnerIds.has(progress.studentId) && domainLessonIds.has(progress.lessonId),
      ).length;

      return {
        id: domain.id,
        title: domain.title,
        emoji: domain.emoji,
        completed,
        total: domain.lessons.length * gradeLearnerIds.size,
      };
    });
  });
}
