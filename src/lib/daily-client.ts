export interface DailySaveResult {
  score: number;
  correct: number;
  total: number;
  streak: number;
  dateKey: string;
  alreadyDone: boolean;
}

export async function saveDailyChallenge(
  fetcher: (url: string, options: RequestInit) => Promise<Response>,
  correct: number,
  total: number,
): Promise<DailySaveResult> {
  const response = await fetcher("/api/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ correct, total }),
  });
  const data = await response.json().catch(() => null) as Partial<DailySaveResult> & { error?: string } | null;
  if (!response.ok || !data || typeof data.score !== "number" || typeof data.correct !== "number" || typeof data.total !== "number" || typeof data.streak !== "number" || typeof data.dateKey !== "string") {
    throw new Error(data?.error ?? "Your daily challenge could not be saved. Check your connection and try again.");
  }
  return {
    score: data.score,
    correct: data.correct,
    total: data.total,
    streak: data.streak,
    dateKey: data.dateKey,
    alreadyDone: data.alreadyDone === true,
  };
}
