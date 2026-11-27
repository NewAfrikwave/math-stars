export const discoveries = {
  workshop: {title: "Pip’s Trading Workshop", sticker: "Shell trader", icon: "🧰"},
  reef: {title: "Coral Reef Detectives", sticker: "Reef detective", icon: "🪸"},
} as const;
export type Discovery = keyof typeof discoveries;
export const units = [100, 10, 1] as const;
export type Unit = (typeof units)[number];
export type Blocks = Record<Unit, number>;
export const split = (n: number): Blocks => ({100: Math.floor(n/100), 10: Math.floor(n/10)%10, 1: n%10});
export const worth = (blocks: Blocks) => blocks[100]*100 + blocks[10]*10 + blocks[1];
export function exchange(blocks: Blocks, unit: 10 | 100): Blocks {
  if (!blocks[unit]) return blocks;
  const smaller = unit === 100 ? 10 : 1;
  return {...blocks, [unit]:blocks[unit]-1, [smaller]:blocks[smaller]+10};
}
export function shellOrder(level: string, fresh: boolean) {
  if (level === "preschool") return fresh ? [6,3] as const : [5,2] as const;
  if (!fresh) return [32,17] as const;
  return level === "grade3" || level === "grade4" ? [768,291] as const : [41,16] as const;
}
