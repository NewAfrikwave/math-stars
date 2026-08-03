import { afterEach, describe, expect, test } from "bun:test";
import { useGameStore } from "../src/store/useGameStore";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("profile deletion state", () => {
  test("returns to the picker and clears hydrated learner data when the active profile is deleted", async () => {
    globalThis.fetch = (async () => new Response(JSON.stringify({ ok: true }), { status: 200 })) as unknown as typeof fetch;
    useGameStore.setState({
      profiles: [
        { id: "active", name: "Fefe", avatar: "fox", level: "grade3", totalStars: 12, streak: 3 },
        { id: "other", name: "Brielle", avatar: "owl", level: "preschool", totalStars: 4, streak: 1 },
      ],
      currentProfileId: "active",
      studentName: "Fefe",
      level: "grade3",
      totalStars: 12,
      streak: 3,
      earnedAchievements: ["first-lesson"],
      dailyDoneDate: "2026-08-03",
      dailyScore: 100,
      view: { name: "parent" },
      hydrated: true,
    });

    const deleted = await useGameStore.getState().deleteProfile("active", "1234");
    const state = useGameStore.getState();

    expect(deleted).toBe(true);
    expect(state.profiles.map((profile) => profile.id)).toEqual(["other"]);
    expect(state.currentProfileId).toBeNull();
    expect(state.view).toEqual({ name: "landing" });
    expect(state.studentName).toBe("Star Learner");
    expect(state.level).toBeNull();
    expect(state.totalStars).toBe(0);
    expect(state.streak).toBe(0);
    expect(state.earnedAchievements).toEqual([]);
    expect(state.dailyDoneDate).toBeNull();
    expect(state.dailyScore).toBeNull();
  });

  test("keeps the active learner loaded when a different profile is deleted", async () => {
    globalThis.fetch = (async () => new Response(JSON.stringify({ ok: true }), { status: 200 })) as unknown as typeof fetch;
    useGameStore.setState({
      profiles: [
        { id: "active", name: "Fefe", avatar: "fox", level: "grade3", totalStars: 12, streak: 3 },
        { id: "other", name: "Brielle", avatar: "owl", level: "preschool", totalStars: 4, streak: 1 },
      ],
      currentProfileId: "active",
      studentName: "Fefe",
      level: "grade3",
      totalStars: 12,
      view: { name: "parent" },
    });

    const deleted = await useGameStore.getState().deleteProfile("other", "1234");
    const state = useGameStore.getState();

    expect(deleted).toBe(true);
    expect(state.profiles.map((profile) => profile.id)).toEqual(["active"]);
    expect(state.currentProfileId).toBe("active");
    expect(state.studentName).toBe("Fefe");
    expect(state.totalStars).toBe(12);
    expect(state.view).toEqual({ name: "parent" });
  });
});
