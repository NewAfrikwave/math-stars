export const ORCHARD_GROUPS = 3;
export const ORCHARD_EACH = 4;
export const ORCHARD_TOTAL = ORCHARD_GROUPS * ORCHARD_EACH;

export function validOrchardCounts(value: unknown): value is number[] {
  return Array.isArray(value) && value.length === ORCHARD_GROUPS
    && value.every((n) => Number.isInteger(n) && n >= 0 && n <= ORCHARD_TOTAL)
    && value.reduce((sum, n) => sum + n, 0) <= ORCHARD_TOTAL;
}

export function moveOrchardApple(counts: number[], basket: number, change: 1 | -1) {
  if (!validOrchardCounts(counts) || !Number.isInteger(basket) || basket < 0 || basket >= ORCHARD_GROUPS) return counts;
  const next = counts.map((n, i) => i === basket ? n + change : n);
  return validOrchardCounts(next) ? next : counts;
}

export function orchardDemonstration(step: number) {
  const safe = Number.isFinite(step) ? Math.max(0, Math.min(ORCHARD_TOTAL, Math.floor(step))) : 0;
  return Array.from({ length: ORCHARD_GROUPS }, (_, i) => Math.min(ORCHARD_EACH, Math.max(0, safe - i * ORCHARD_EACH)));
}

export function orchardIsEqual(counts: number[]) {
  return validOrchardCounts(counts) && counts.every((n) => n === ORCHARD_EACH);
}

export function orchardFeedback(counts: number[]) {
  if (orchardIsEqual(counts)) return "You built equal groups! 4 + 4 + 4 = 12. Three groups of four is 3 × 4 = 12 apples.";
  return "Not quite yet. Each basket needs 4 apples. Move an apple back from a fuller basket, or add one to a basket that needs more.";
}

// A different problem from the demonstration: no displayed total before checking.
export const ORCHARD_SOLO = { groups: 4, each: 2 } as const;
export function checkOrchardSolo(answer: string) {
  return /^\d+$/.test(answer.trim()) && Number(answer.trim()) === ORCHARD_SOLO.groups * ORCHARD_SOLO.each;
}
