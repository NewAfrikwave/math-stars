export type AnalyticsDevice = {
  familyId: string | null;
  scopeKey: string;
  installed: boolean;
};

export type AnalyticsActivityEvent = {
  type: string;
  score: number;
  createdAt: Date;
};

export type AnalyticsGradeStat = {
  learners: number;
  activeLearners: number;
  lessonsCompleted: number;
  avgScore: number;
};

export function countInstalledFamilies(devices: readonly AnalyticsDevice[], legacyExists: boolean) {
  const installedScopes = new Set<string>();

  for (const device of devices) {
    if (!device.installed) continue;
    if (device.familyId) installedScopes.add(`family:${device.familyId}`);
    else if (legacyExists && device.scopeKey === "legacy") installedScopes.add("legacy");
  }

  return installedScopes.size;
}

export function buildActivitySeries(dateKeys: readonly string[], events: readonly AnalyticsActivityEvent[]) {
  const days = new Map(dateKeys.map((date) => [date, { count: 0, lessons: 0, arcade: 0, scores: [] as number[] }]));

  for (const event of events) {
    const day = days.get(localDateKey(event.createdAt));
    if (!day) continue;
    day.count += 1;
    if (event.type === "lesson") {
      day.lessons += 1;
      if (event.score > 0) day.scores.push(event.score);
    }
    if (event.type === "arcade") day.arcade += 1;
  }

  return [...days].map(([date, day]) => ({
    date,
    count: day.count,
    lessons: day.lessons,
    arcade: day.arcade,
    avgScore: day.scores.length
      ? Math.round(day.scores.reduce((sum, score) => sum + score, 0) / day.scores.length)
      : 0,
  }));
}

export function summarizeGradeStats(grades: readonly AnalyticsGradeStat[]) {
  return grades.reduce(
    (result, grade) => ({
      learners: result.learners + grade.learners,
      activeLearners: result.activeLearners + grade.activeLearners,
      lessons: result.lessons + grade.lessonsCompleted,
      weightedScore: result.weightedScore + grade.avgScore * grade.lessonsCompleted,
    }),
    { learners: 0, activeLearners: 0, lessons: 0, weightedScore: 0 },
  );
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
