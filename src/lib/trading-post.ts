import type { Journal } from "./explorer";

export const postSteps = ["counter", "order", "reading", "evidence"] as const;
export type PostStep = (typeof postSteps)[number];
const levels = ["preschool", "grade1", "grade2", "grade3", "grade4"];

export function postLesson(level: string) {
  const early = level === "preschool" || level === "grade1";
  const small = level === "preschool";
  return {
    early, steps: early ? postSteps.slice(0, 3) : postSteps,
    start: early ? small ? 5 : 9 : 52, give: early ? small ? 2 : 4 : 18,
    fresh: early ? small ? 4 : 8 : level === "grade4" ? 143 : 43,
    freshGive: early ? small ? 2 : 5 : 17,
  };
}

export const postGuides = ["count", "trade", "blend", "note"] as const;
export type PostGuide = (typeof postGuides)[number];

export function postGuide(early: boolean, step: PostStep): PostGuide {
  if (step === "counter" || step === "order") return early ? "count" : "trade";
  return early ? "blend" : "note";
}

export function needsPostGuide(entries: Journal, guide: PostGuide) {
  if (entries["post-guide/" + guide]) return false;
  // Children with saved Trading Post work may have visited before introductions existed.
  return !Object.values(entries).some(({key}) => {
    const [area, , level, step] = key.split("/");
    if (area !== "post" || !levels.includes(level)) return false;
    const lesson = postLesson(level);
    return lesson.steps.some(s => s === step && postGuide(lesson.early, s) === guide);
  });
}

export const postPrefix = (day: string, level: string) => "post/" + day + "/" + level + "/";

export function validPostEntry(level: string, step: string, value: string) {
  return levels.includes(level) && postLesson(level).steps.some(s => s === step)
    && (step === "counter" ? value === "guided" : ["hint", "helped", "solo"].includes(value));
}

export function postTakeaway(entries: Journal, since: string) {
  const order = Object.values(entries).filter(e => {
    const [area, day, , step] = e.key.split("/");
    return area === "post" && day >= since && step === "order" && e.value !== "hint";
  }).sort((a, b) => b.at - a.at)[0];
  if (!order) return null;
  const [, day, level] = order.key.split("/");
  if (!entries[postPrefix(day, level) + "counter"]) return null;
  const lesson = postLesson(level);
  return (lesson.early ? "Counted out shells with Pip" : "Traded one ten for ten ones with Pip")
    + ", then solved " + lesson.fresh + " − " + lesson.freshGive
    + (order.value === "solo" ? " independently." : " with a clue.");
}
