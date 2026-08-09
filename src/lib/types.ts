// Shared type definitions for the Math Stars learning app

// The different ways a problem can be answered by the learner
export type AnswerType =
  | "number" // learner types a number
  | "multiple-choice" // learner picks one option
  | "true-false"
  | "fraction" // learner enters numerator/denominator
  | "shape-classify" // learner picks which category a shape belongs to
  | "time" // learner sets / reads a time (HH:MM)
  | "numberline"; // learner selects a point on a number line

export interface BaseProblem {
  id: string;
  lessonId: string;
  // The question shown to the learner
  prompt: string;
  // Optional word-problem context / story
  story?: string;
  // Visual helper attached to the question (rendered by the matching component)
  visual?: ProblemVisual;
  answerType: AnswerType;
  // Short hint shown if the learner is stuck
  hint?: string;
  // A friendly explanation shown after answering (correct or not)
  explanation?: string;
}

export interface NumberProblem extends BaseProblem {
  answerType: "number";
  answer: number;
  unit?: string; // e.g. "cm", "sq units", "minutes"
}

export interface MultipleChoiceProblem extends BaseProblem {
  answerType: "multiple-choice";
  choices: string[];
  correctIndex: number;
}

export interface TrueFalseProblem extends BaseProblem {
  answerType: "true-false";
  isTrue: boolean;
}

export interface FractionProblem extends BaseProblem {
  answerType: "fraction";
  numerator: number;
  denominator: number;
}

export interface ShapeClassifyProblem extends BaseProblem {
  answerType: "shape-classify";
  shape: ShapeKind;
  // category options the learner chooses among
  categories: string[];
  correctCategory: string;
}

export interface TimeProblem extends BaseProblem {
  answerType: "time";
  hour: number; // 1-12
  minute: number; // 0-59
  // whether the learner should read the clock (answer = shown time)
  // or set the clock to a target time
  mode: "read" | "set";
  targetHour?: number;
  targetMinute?: number;
}

export interface NumberLineProblem extends BaseProblem {
  answerType: "numberline";
  start: number;
  end: number;
  // fraction to place: numerator/denominator within [start, end]
  numerator: number;
  denominator: number;
  ticks: number; // number of equal subdivisions shown
}

export type Problem =
  | NumberProblem
  | MultipleChoiceProblem
  | TrueFalseProblem
  | FractionProblem
  | ShapeClassifyProblem
  | TimeProblem
  | NumberLineProblem;

// Visual payloads rendered by dedicated components
export type ProblemVisual =
  | { kind: "equal-groups"; groups: number; perGroup: number; emoji: string; label?: string }
  | { kind: "sharing-baskets"; total: number; perGroup: number; emoji: string; label?: string }
  | { kind: "array"; rows: number; cols: number; emoji: string }
  | { kind: "fraction-pie"; numerator: number; denominator: number; fillStyle?: "solid" | "none" }
  | { kind: "fraction-bar"; numerator: number; denominator: number }
  | { kind: "clock"; hour: number; minute: number }
  | { kind: "area-grid"; rows: number; cols: number; shaded?: boolean }
  | { kind: "perimeter"; width: number; height: number; unit?: string }
  | { kind: "shape"; shape: ShapeKind }
  | { kind: "number-line"; start: number; end: number; numerator: number; denominator: number; ticks: number }
  | { kind: "number-blocks"; value: number }
  | { kind: "count-row"; emoji: string; count: number }
  | { kind: "compare-rows"; leftEmoji: string; leftCount: number; rightEmoji: string; rightCount: number }
  | { kind: "pattern"; items: PatternItem[]; missingIndex: number }
  | { kind: "color-shape"; shape: ShapeKind; color: string }
  | { kind: "number-card"; value: number }
  | { kind: "size-shapes"; shapes: Array<{ shape: ShapeKind; color: string; size: number }> };

export type ShapeKind =
  | "square"
  | "rectangle"
  | "rhombus"
  | "parallelogram"
  | "trapezoid"
  | "triangle"
  | "pentagon"
  | "hexagon"
  | "circle"
  | "quadrilateral";

// An item in a pattern visual: either a colored shape or an emoji.
export type PatternItem =
  | { type: "emoji"; value: string }
  | { type: "shape"; shape: ShapeKind; color: string };

// Curriculum definition -------------------------------------------------

export interface Lesson {
  id: string;
  title: string;
  subtitle: string; // one-line description
  emoji: string;
  // Teaching content shown before practice begins
  teach: TeachBlock[];
  // Number of practice problems in a session
  practiceCount: number;
  // generator key handled by the generator factory
  generator: string;
  // optional generator params
  params?: Record<string, unknown>;
}

export interface TeachBlock {
  kind: "text" | "example" | "tip" | "visual";
  text?: string;
  visual?: ProblemVisual;
  // for example blocks
  question?: string;
  answer?: string;
}

export interface Domain {
  id: string;
  title: string;
  emoji: string;
  color: string; // tailwind gradient classes for the card
  description: string;
  lessons: Lesson[];
}

// Progress / state -----------------------------------------------------

export type LessonStatus = "locked" | "available" | "in-progress" | "completed";

export interface LessonProgressState {
  lessonId: string;
  status: LessonStatus;
  stars: number; // 0-3
  bestScore: number; // 0-100 percent
  attempts: number;
  lastScore: number;
  completedAt: string | null;
  lastPlayedAt?: string | null;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  emoji: string;
  // predicate evaluated against full progress + total stars
  check: (ctx: AchievementContext) => boolean;
}

export interface AchievementContext {
  totalStars: number;
  completedCount: number;
  domainCompletion: Record<string, number>; // domainId -> completed lesson count
  perfectLessons: number; // lessons with 3 stars
  streak: number;
}

export type Difficulty = "easy" | "challenge";

export interface LessonCheckpointState {
  lessonId: string;
  attemptId: string;
  difficulty?: Difficulty;
  problems: Problem[];
  nextIndex: number;
  correctCount: number;
  total: number;
  updatedAt: string;
}

// Context passed to problem generators (difficulty scaling, etc.).
export interface GenContext {
  difficulty?: Difficulty;
}

export type Level = "preschool" | "grade1" | "grade2" | "grade3" | "grade4";

export type GameView =
  | { name: "landing" }
  | { name: "home" }
  | { name: "times-tables" }
  | { name: "arcade" }
  | { name: "domain"; domainId: string }
  | { name: "lesson"; lessonId: string }
  | { name: "practice"; lessonId: string; difficulty?: Difficulty }
  | { name: "results"; lessonId: string; score: number; stars: number; correct: number; total: number }
  | { name: "achievements" }
  | { name: "tutor"; lessonId?: string }
  | { name: "review" }
  | { name: "daily" }
  | { name: "worksheet"; lessonId?: string }
  | { name: "manipulative"; lessonId?: string }
  | { name: "parent" }
  | { name: "placement"; domainId: string }
  | { name: "donations" }
  | { name: "offline" }
  | { name: "admin" };
