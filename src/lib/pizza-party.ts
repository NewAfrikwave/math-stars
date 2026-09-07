import type { Level } from "@/lib/types";

/** Task information only. Placement answers are checked against the saved task. */
export interface PizzaChallenge {
  version: 1;
  mode: "share" | "fraction";
  slices: number;
  plates: number;
  numerator: number;
  denominator: number;
  secondNumerator: number;
  operation: "take" | "add" | "subtract";
}

export function validPizzaChallenge(value: unknown): value is PizzaChallenge {
  if (!value || typeof value !== "object") return false;
  const p = value as PizzaChallenge;
  if (p.version !== 1 || !["share", "fraction"].includes(p.mode)
    || !["take", "add", "subtract"].includes(p.operation)) return false;
  if (![p.slices, p.plates, p.numerator, p.denominator, p.secondNumerator].every(Number.isInteger)) return false;
  if (p.slices < 2 || p.slices > 12 || p.plates < 1 || p.plates > 4
    || p.denominator < 1 || p.denominator > 12 || p.numerator < 0 || p.secondNumerator < 0) return false;
  if (p.mode === "share") return p.plates >= 2 && p.slices % p.plates === 0;
  const target = pizzaTarget(p);
  return p.plates === 1 && p.numerator <= p.denominator && p.secondNumerator <= p.denominator
    && Number.isInteger(target) && target > 0 && target <= p.slices;
}

export function pizzaTarget(p: PizzaChallenge) {
  if (p.mode === "share") return p.slices / p.plates;
  const numerator = p.operation === "add" ? p.numerator + p.secondNumerator
    : p.operation === "subtract" ? p.numerator - p.secondNumerator : p.numerator;
  return p.slices * numerator / p.denominator;
}

export function validPizzaPlacements(p: PizzaChallenge, value: unknown): value is number[] {
  return Array.isArray(value) && value.length === p.slices
    && value.every((plate) => Number.isInteger(plate) && plate >= -1 && plate < p.plates);
}

export function pizzaPlateCounts(p: PizzaChallenge, placements: number[]) {
  return Array.from({ length: p.plates }, (_, plate) => placements.filter((value) => value === plate).length);
}

export function checkPizzaPlacements(p: PizzaChallenge, placements: unknown) {
  if (!validPizzaPlacements(p, placements)) return false;
  const counts = pizzaPlateCounts(p, placements);
  return counts.every((count) => count === pizzaTarget(p));
}

export function movePizzaSlice(p: PizzaChallenge, placements: number[], slice: number, plate: number) {
  if (!validPizzaPlacements(p, placements) || !Number.isInteger(slice) || slice < 0 || slice >= p.slices
    || !Number.isInteger(plate) || plate < -1 || plate >= p.plates) return placements;
  return placements.map((current, index) => index === slice ? plate : current);
}

export function pizzaExplanation(p: PizzaChallenge, correct: boolean) {
  const target = pizzaTarget(p);
  if (p.mode === "share") return correct
    ? `Fair sharing! All ${p.plates} friends have ${target} slices each.`
    : `Share all ${p.slices} slices equally: ${target} on each of the ${p.plates} plates.`;
  return correct ? `Order ready! You served ${target} of the ${p.slices} equal slices.`
    : `This order needs ${target} of the ${p.slices} equal slices on the plate.`;
}

export function makePizzaChallenge(level: Level, index: number, rng: () => number) {
  const pick = <T,>(items: T[]): T => items[Math.min(items.length - 1, Math.max(0, Math.floor(rng() * items.length)))];
  const base: PizzaChallenge = { version: 1, mode: "share", slices: 4, plates: 2, numerator: 1, denominator: 2, secondNumerator: 0, operation: "take" };
  if (level === "preschool") return { ...base, slices: pick([2, 4, 6]) };
  if (level === "grade1") {
    const plates = index % 2 === 0 ? 2 : 3;
    return { ...base, plates, slices: plates * pick([1, 2, 3]) };
  }
  if (level === "grade2" && index % 2 === 0) {
    const plates = pick([2, 3, 4]);
    return { ...base, plates, slices: plates * pick([2, 3]) };
  }
  if (level === "grade2") return { ...base, mode: "fraction" as const, plates: 1, slices: pick([4, 8, 12]), denominator: index % 4 === 1 ? 2 : 4 };
  if (level === "grade3") {
    const fractions = [[1, 2, 8], [1, 3, 6], [2, 3, 12], [3, 4, 8], [2, 4, 12], [5, 6, 12]];
    const [numerator, denominator, slices] = fractions[index % fractions.length];
    return { ...base, mode: "fraction" as const, plates: 1, numerator, denominator, slices };
  }
  const denominator = pick([4, 6, 8, 12]);
  const subtract = index % 2 === 1;
  return { ...base, mode: "fraction" as const, plates: 1, slices: denominator, denominator,
    numerator: subtract ? denominator - 1 : pick([1, 2]), secondNumerator: pick([1, 2]),
    operation: subtract ? "subtract" as const : "add" as const };
}

export function pizzaPrompt(p: PizzaChallenge) {
  if (p.mode === "share") return `Share all ${p.slices} pizza slices equally between ${p.plates} friends.`;
  if (p.operation === "take") return `Serve ${p.numerator}/${p.denominator} of this ${p.slices}-slice pizza.`;
  if (p.operation === "add") return `An order needs ${p.numerator}/${p.denominator} plus ${p.secondNumerator}/${p.denominator} of a pizza. Serve the total.`;
  return `There was ${p.numerator}/${p.denominator} of a pizza. A friend ate ${p.secondNumerator}/${p.denominator}. Serve what is left.`;
}

export function pizzaInstruction(p: PizzaChallenge) {
  return p.mode === "share" ? "Pick a slice, then a plate. Give everyone the same amount."
    : "Pick slices and put them on the order plate. Leave the rest on the board.";
}
