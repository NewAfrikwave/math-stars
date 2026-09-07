// Run against an isolated LOCAL database/server only: bun scripts/qa-pizza-party.ts
import { strict as assert } from "node:assert";
import { checkPizzaPlacements, pizzaTarget } from "../src/lib/pizza-party";
import type { PublicArcadeQuestion } from "../src/lib/arcade";
import { arcadeReward, createArcadeQuestions } from "../src/lib/arcade";

const origin = "http://localhost:3050";
let cookie = "";
async function api(path: string, body?: unknown, profileId?: string) {
  const response = await fetch(`${origin}${path}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", Cookie: cookie, ...(profileId ? { "x-profile-id": profileId } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  return { status: response.status, data: await response.json() };
}
const credentials = { email: "pizza-qa@example.test", password: "LocalPizzaQA-only-2026!" };
await api("/api/auth/register", { ...credentials, displayName: "Local QA", acceptPrivacy: true });
assert.equal((await api("/api/auth/login", credentials)).status, 200);
const profiles = (await api("/api/profiles")).data.profiles as { id: string; name: string; level: string }[];
for (const level of ["preschool", "grade1", "grade2", "grade3", "grade4"] as const) {
  const name = `Pizza QA ${level}`;
  const profile = profiles.find((p) => p.name === name) ?? (await api("/api/profiles", { name, level, avatar: "fox" })).data;
  assert.ok(profile.id);
  await api("/api/settings", { soundOn: false }, profile.id);
  await api("/api/arcade", { action: "abandon", gameKey: "pizza-party" }, profile.id);
  let run = (await api("/api/arcade", { action: "start", gameKey: "pizza-party" }, profile.id)).data.run;
  const initialCoins = (await api("/api/arcade", undefined, profile.id)).data.coins;
  const resumed = (await api("/api/arcade", { action: "start", gameKey: "pizza-party" }, profile.id)).data.run;
  assert.deepEqual(resumed, run);
  let lastBody: unknown;
  while (run.status === "active") {
    const question = run.question as PublicArcadeQuestion;
    assert.ok(question.pizza);
    assert.ok(!("answerIndex" in question));
    const p = question.pizza;
    const placements = Array.from({ length: p.slices }, (_, index) => p.mode === "share" ? index % p.plates : index < pizzaTarget(p) ? 0 : -1);
    assert.equal(checkPizzaPlacements(p, placements), true);
    const invalid = await api("/api/arcade/answer", { attemptId: run.attemptId, questionIndex: run.nextIndex, pizzaPlacements: [-999] }, profile.id);
    assert.equal(invalid.status, 400);
    lastBody = { attemptId: run.attemptId, questionIndex: run.nextIndex, pizzaPlacements: placements };
    const saved = await api("/api/arcade/answer", lastBody, profile.id);
    assert.equal(saved.status, 200);
    assert.equal(saved.data.correct, true);
    const duplicate = await api("/api/arcade/answer", lastBody, profile.id);
    assert.equal(duplicate.data.duplicate, true);
    assert.equal(duplicate.data.run.nextIndex, saved.data.run.nextIndex);
    run = saved.data.run;
  }
  assert.equal(run.correctCount, run.total);
  await api("/api/arcade/answer", lastBody, profile.id);
  const overview = (await api("/api/arcade", undefined, profile.id)).data;
  assert.equal(overview.coins, initialCoins + run.coinsEarned);
  const offlineQuestions = createArcadeQuestions("pizza-party", level, 5, () => 0.5);
  const offlineAttempt = `offline-arcade-${crypto.randomUUID()}`;
  const offlineEvent = {
    eventId: `arcade:${offlineAttempt}`, profileId: profile.id, type: "arcade-complete", createdAt: new Date().toISOString(),
    payload: { attemptId: offlineAttempt, gameKey: "pizza-party", level, questions: offlineQuestions, timezoneOffsetMinutes: 0,
      answers: offlineQuestions.map((question, index) => {
        const p = question.pizza!;
        return { index, choiceIndex: question.answerIndex, correct: true, // deliberately false claims on question 0; server must recalculate
          pizzaPlacements: Array.from({ length: p.slices }, (_, slice) => index === 0 ? -1 : p.mode === "share" ? slice % p.plates : slice < pizzaTarget(p) ? 0 : -1) };
      }),
    },
  };
  const sync = await api("/api/offline/sync", { events: [offlineEvent] }, profile.id);
  assert.deepEqual(sync.data.acknowledged, [offlineEvent.eventId]);
  const duplicateSync = await api("/api/offline/sync", { events: [offlineEvent] }, profile.id);
  assert.deepEqual(duplicateSync.data.acknowledged, [offlineEvent.eventId]);
  const synced = (await api("/api/arcade", undefined, profile.id)).data;
  assert.equal(synced.coins, overview.coins + arcadeReward(4, 5, false).totalCoins);
  const wrongProfile = profiles.find((p) => p.id !== profile.id);
  if (wrongProfile) {
    assert.equal((await api("/api/arcade/answer", lastBody, wrongProfile.id)).status, 404);
    const denied = await api("/api/offline/sync", { events: [offlineEvent] }, wrongProfile.id);
    assert.equal(denied.data.rejected.length, 1);
  }
  console.log(`${level}: online scoring/resume/retries, offline scoring/reconciliation, profile isolation and exact coin balances passed`);
}
console.log("Local Pizza Party API matrix passed. Test profiles are available for browser QA.");
