import { describe, expect, test } from "bun:test";
import { saveDailyChallenge } from "../src/lib/daily-client";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("daily challenge persistence", () => {
  test("uses the confirmed server streak when a four-day streak becomes five", async () => {
    const fetcher = async () => jsonResponse({
      ok: true,
      score: 80,
      correct: 4,
      total: 5,
      streak: 5,
      dateKey: "2026-08-04",
      alreadyDone: false,
    });

    const saved = await saveDailyChallenge(fetcher, 4, 5);

    expect(saved).toEqual({ score: 80, correct: 4, total: 5, streak: 5, dateKey: "2026-08-04", alreadyDone: false });
  });

  test("rejects a failed save so the quiz can keep its answers for retry", async () => {
    const fetcher = async () => jsonResponse({ error: "Database unavailable" }, 503);

    await expect(saveDailyChallenge(fetcher, 4, 5)).rejects.toThrow("Database unavailable");
  });

  test("reconciles an idempotent retry from the persisted daily result", async () => {
    const fetcher = async () => jsonResponse({
      ok: true,
      score: 60,
      correct: 3,
      total: 5,
      streak: 7,
      dateKey: "2026-08-04",
      alreadyDone: true,
    });

    const saved = await saveDailyChallenge(fetcher, 5, 5);

    expect(saved).toEqual({ score: 60, correct: 3, total: 5, streak: 7, dateKey: "2026-08-04", alreadyDone: true });
  });
});
