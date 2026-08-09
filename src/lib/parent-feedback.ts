export const FEEDBACK_CATEGORIES = ["bug", "suggestion", "general"] as const;
export const FEEDBACK_AREAS = ["voice-audio", "arcade", "lessons", "offline", "parent-dashboard", "account", "other"] as const;
export const FEEDBACK_STATUSES = ["new", "reviewing", "resolved"] as const;

export type FeedbackCategory = typeof FEEDBACK_CATEGORIES[number];
export type FeedbackArea = typeof FEEDBACK_AREAS[number];
export type FeedbackStatus = typeof FEEDBACK_STATUSES[number];

const ARCADE_GAME_KEYS = new Set([
  "star-sprint",
  "treasure-match",
  "rocket-builder",
  "bubble-pop",
  "shape-safari",
  "pizza-party",
]);
const LEVELS = new Set(["preschool", "grade1", "grade2", "grade3", "grade4"]);

export function parseParentFeedback(body: unknown) {
  if (!body || typeof body !== "object") return { error: "Feedback details are required." } as const;
  const value = body as Record<string, unknown>;
  const category = typeof value.category === "string" && FEEDBACK_CATEGORIES.includes(value.category as FeedbackCategory)
    ? value.category as FeedbackCategory
    : null;
  const area = typeof value.area === "string" && FEEDBACK_AREAS.includes(value.area as FeedbackArea)
    ? value.area as FeedbackArea
    : null;
  const message = typeof value.message === "string" ? value.message.trim() : "";
  if (!category) return { error: "Choose Bug report, Suggestion, or General feedback." } as const;
  if (!area) return { error: "Choose the part of Math Stars this is about." } as const;
  if (message.length < 10) return { error: "Please share a little more detail so we can understand it." } as const;
  if (message.length > 2_000) return { error: "Feedback must be 2,000 characters or fewer." } as const;

  const gameKey = area === "arcade" && typeof value.gameKey === "string" && ARCADE_GAME_KEYS.has(value.gameKey)
    ? value.gameKey
    : null;
  const learnerLevel = typeof value.learnerLevel === "string" && LEVELS.has(value.learnerLevel)
    ? value.learnerLevel
    : null;
  const pagePath = typeof value.pagePath === "string" && value.pagePath.startsWith("/")
    ? value.pagePath.slice(0, 120)
    : "/";

  return {
    data: {
      category,
      area,
      gameKey,
      learnerLevel,
      pagePath,
      message,
      contactAllowed: value.contactAllowed === true,
    },
  } as const;
}

export function feedbackStatus(value: unknown): FeedbackStatus | null {
  return typeof value === "string" && FEEDBACK_STATUSES.includes(value as FeedbackStatus)
    ? value as FeedbackStatus
    : null;
}
