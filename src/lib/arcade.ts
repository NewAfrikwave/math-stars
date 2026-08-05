import type { Level } from "@/lib/types";

export const ARCADE_GAME_KEYS = ["star-sprint", "treasure-match", "rocket-builder"] as const;
export type ArcadeGameKey = (typeof ARCADE_GAME_KEYS)[number];

export interface ArcadeQuestion {
  id: string;
  prompt: string;
  choices: string[];
  answerIndex: number;
  helper?: string;
  visual?: string;
}

export interface PublicArcadeQuestion {
  id: string;
  prompt: string;
  choices: string[];
  helper?: string;
  visual?: string;
}

export interface ArcadeAnswerRecord {
  index: number;
  choiceIndex: number;
  correct: boolean;
}

export interface ArcadeCompanion {
  id: string;
  name: string;
  emoji: string;
  unlockCoins: number;
  description: string;
}

export interface ArcadeRunSummaryInput {
  gameKey: string;
  correctCount: number;
  total: number;
}

export interface ArcadeSkillSummary {
  gameKey: ArcadeGameKey;
  title: string;
  emoji: string;
  skill: string;
  plays: number;
  correctAnswers: number;
  totalAnswers: number;
  accuracy: number;
  bestScore: number;
}

export const ARCADE_COMPANIONS: ArcadeCompanion[] = [
  { id: "pip", name: "Pip Explorer", emoji: "🦊", unlockCoins: 0, description: "Your brave first arcade buddy." },
  { id: "luna", name: "Luna Owl", emoji: "🦉", unlockCoins: 50, description: "A calm clue-finder for tricky rounds." },
  { id: "nova", name: "Nova Cat", emoji: "🐱", unlockCoins: 120, description: "A quick-thinking treasure hunter." },
  { id: "orbit", name: "Orbit Bot", emoji: "🤖", unlockCoins: 250, description: "A cosmic math champion." },
];

export const ARCADE_GAMES = [
  {
    key: "star-sprint" as const,
    title: "Star Sprint",
    emoji: "🏃🏾‍♀️",
    description: "Answer fast and race Pip across the starlight track.",
    color: "from-rose-500 via-orange-400 to-amber-300",
  },
  {
    key: "treasure-match" as const,
    title: "Treasure Match",
    emoji: "🗺️",
    description: "Read the clue and open the chest with the matching answer.",
    color: "from-emerald-600 via-teal-500 to-cyan-300",
  },
  {
    key: "rocket-builder" as const,
    title: "Rocket Builder",
    emoji: "🚀",
    description: "Solve each mission to add another part to your rocket.",
    color: "from-indigo-700 via-violet-600 to-fuchsia-400",
  },
] as const;

export function isArcadeGameKey(value: unknown): value is ArcadeGameKey {
  return typeof value === "string" && (ARCADE_GAME_KEYS as readonly string[]).includes(value);
}

export function arcadeLevel(value: string): Level {
  return (["preschool", "grade1", "grade2", "grade3", "grade4"] as string[]).includes(value)
    ? value as Level
    : "grade3";
}

export function publicQuestion(question: ArcadeQuestion): PublicArcadeQuestion {
  const { answerIndex: _answerIndex, ...safe } = question;
  return safe;
}

export function companionForCoins(companionId: string, coins: number) {
  return ARCADE_COMPANIONS.find((companion) => companion.id === companionId && coins >= companion.unlockCoins)
    ?? ARCADE_COMPANIONS[0];
}

export function arcadeSkillForGame(gameKey: ArcadeGameKey, level: Level) {
  if (gameKey === "star-sprint") return level === "preschool" ? "Counting" : "Addition & subtraction";
  if (gameKey === "treasure-match") return level === "preschool" ? "Comparing numbers" : "Patterns & number sense";
  return level === "preschool" || level === "grade1" ? "Addition" : "Multiplication";
}

export function summarizeArcadeSkills(runs: ArcadeRunSummaryInput[], level: Level): ArcadeSkillSummary[] {
  return ARCADE_GAMES.map((game) => {
    const gameRuns = runs.filter((run) => run.gameKey === game.key);
    const correctAnswers = gameRuns.reduce(
      (sum, run) => sum + Math.min(Math.max(0, run.correctCount), Math.max(0, run.total)),
      0,
    );
    const totalAnswers = gameRuns.reduce((sum, run) => sum + Math.max(0, run.total), 0);
    return {
      gameKey: game.key,
      title: game.title,
      emoji: game.emoji,
      skill: arcadeSkillForGame(game.key, level),
      plays: gameRuns.length,
      correctAnswers,
      totalAnswers,
      accuracy: totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0,
      bestScore: gameRuns.reduce(
        (best, run) => Math.max(
          best,
          Math.round((Math.min(Math.max(0, run.correctCount), Math.max(0, run.total)) / Math.max(1, run.total)) * 100),
        ),
        0,
      ),
    };
  });
}

export function arcadeReward(correct: number, total: number, dailyBonusAvailable: boolean) {
  const safeTotal = Math.max(1, total);
  const score = Math.round((Math.max(0, Math.min(correct, safeTotal)) / safeTotal) * 100);
  const playCoins = correct * 2 + 5 + (correct === safeTotal ? 5 : 0);
  const dailyBonus = dailyBonusAvailable ? 10 : 0;
  return { score, playCoins, dailyBonus, totalCoins: playCoins + dailyBonus };
}

export function parseArcadeQuestions(value: string): ArcadeQuestion[] | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 12) return null;
    const questions = parsed as ArcadeQuestion[];
    if (questions.some((question) =>
      !question || typeof question.id !== "string" || typeof question.prompt !== "string"
      || !Array.isArray(question.choices) || question.choices.length < 2 || question.choices.length > 6
      || !Number.isInteger(question.answerIndex) || question.answerIndex < 0 || question.answerIndex >= question.choices.length
    )) return null;
    return questions;
  } catch {
    return null;
  }
}

export function parseArcadeAnswers(value: string): ArcadeAnswerRecord[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is ArcadeAnswerRecord => {
      if (!item || typeof item !== "object") return false;
      const answer = item as ArcadeAnswerRecord;
      return Number.isInteger(answer.index) && Number.isInteger(answer.choiceIndex) && typeof answer.correct === "boolean";
    }) : [];
  } catch {
    return [];
  }
}

type Rng = () => number;

export function createArcadeQuestions(gameKey: ArcadeGameKey, level: Level, count = 8, rng: Rng = Math.random) {
  const safeCount = Math.max(5, Math.min(10, Math.floor(count)));
  return Array.from({ length: safeCount }, (_, index) => createQuestion(gameKey, level, index, rng));
}

function createQuestion(gameKey: ArcadeGameKey, level: Level, index: number, rng: Rng): ArcadeQuestion {
  if (level === "preschool") return preschoolQuestion(gameKey, index, rng);
  const ranges = level === "grade1"
    ? { max: 20, multiplier: 5 }
    : level === "grade2"
      ? { max: 100, multiplier: 10 }
      : level === "grade3"
        ? { max: 500, multiplier: 12 }
        : { max: 1000, multiplier: 15 };

  if (gameKey === "treasure-match") {
    const step = randomInt(2, level === "grade1" ? 5 : 12, rng);
    const start = randomInt(1, Math.max(4, Math.floor(ranges.max / 3)), rng);
    const answer = start + step * 3;
    return choiceQuestion(
      `${gameKey}-${index}`,
      `Which number continues the pattern: ${start}, ${start + step}, ${start + step * 2}, __?`,
      answer,
      rng,
      "Look for what changes each time.",
      "🔐  🔐  🔐  ✨",
    );
  }

  if (gameKey === "rocket-builder") {
    const factorA = randomInt(2, ranges.multiplier, rng);
    const factorB = randomInt(2, level === "grade1" ? 5 : 10, rng);
    if (level === "grade1") {
      const answer = factorA + factorB;
      return choiceQuestion(`${gameKey}-${index}`, `Fuel check: ${factorA} + ${factorB} = ?`, answer, rng, "Add the two fuel numbers.", "🚀 ⚙️");
    }
    const answer = factorA * factorB;
    return choiceQuestion(`${gameKey}-${index}`, `Engine code: ${factorA} × ${factorB} = ?`, answer, rng, "Think in equal groups.", "🚀 ⚙️");
  }

  const useSubtraction = index % 3 === 1;
  const a = randomInt(level === "grade1" ? 5 : 12, ranges.max, rng);
  const b = randomInt(1, Math.max(2, Math.min(a, Math.floor(ranges.max / 2))), rng);
  const answer = useSubtraction ? a - b : a + b;
  return choiceQuestion(
    `${gameKey}-${index}`,
    useSubtraction ? `Sprint gate: ${a} − ${b} = ?` : `Sprint gate: ${a} + ${b} = ?`,
    answer,
    rng,
    useSubtraction ? "Count back carefully." : "Break the numbers into friendly parts.",
    "⭐ ⭐ ⭐",
  );
}

function preschoolQuestion(gameKey: ArcadeGameKey, index: number, rng: Rng) {
  const a = randomInt(1, 5, rng);
  const b = randomInt(1, 4, rng);
  if (gameKey === "treasure-match") {
    const answer = Math.max(a, b);
    return choiceQuestion(`${gameKey}-${index}`, `Which number is bigger: ${a} or ${b}?`, answer, rng, "Point to each number and choose the bigger one.", "🧰 ✨ 🧰");
  }
  if (gameKey === "rocket-builder") {
    const answer = Math.min(10, a + b);
    return choiceQuestion(`${gameKey}-${index}`, `Put ${a} and ${b} stars together. How many?`, answer, rng, "Count every star once.", `${"⭐".repeat(a)} + ${"⭐".repeat(b)}`);
  }
  return choiceQuestion(`${gameKey}-${index}`, "How many stars do you see?", a, rng, "Touch each star while you count.", "⭐".repeat(a));
}

function choiceQuestion(id: string, prompt: string, answer: number, rng: Rng, helper?: string, visual?: string): ArcadeQuestion {
  const values = new Set<number>([answer]);
  const spread = Math.max(3, Math.ceil(Math.abs(answer) * 0.2));
  let attempts = 0;
  while (values.size < 4 && attempts < 20) {
    const offset = randomInt(-spread, spread, rng);
    values.add(Math.max(0, answer + (offset === 0 ? values.size : offset)));
    attempts += 1;
  }
  for (let distance = 1; values.size < 4; distance += 1) {
    values.add(answer + distance);
    if (values.size < 4) values.add(Math.max(0, answer - distance));
  }
  const choices = shuffle([...values].map(String), rng);
  return { id, prompt, choices, answerIndex: choices.indexOf(String(answer)), helper, visual };
}

function randomInt(min: number, max: number, rng: Rng) {
  const low = Math.ceil(Math.min(min, max));
  const high = Math.floor(Math.max(min, max));
  return Math.floor(rng() * (high - low + 1)) + low;
}

function shuffle<T>(items: T[], rng: Rng) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}
