import type { Problem, ProblemVisual, ShapeKind, PatternItem, Lesson, GenContext } from "@/lib/types";

// ---------------------------------------------------------------------------
// Preschool problem generators. Reuse the same Problem shape and answer types
// as grade-3 so the QuizRunner and AnswerInput work unchanged. Visuals are
// big, bright, and simple.
// ---------------------------------------------------------------------------

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let psCounter = 0;
function nextId(lesson: string) {
  psCounter += 1;
  return `${lesson}-${psCounter}`;
}

const CUTE_EMOJIS = ["🍎", "🎈", "⭐", "🍪", "🌸", "🐠", "🐝", "🍇", "🍓", "🦋", "🦊", "🐸"];
const COLORS: Record<string, string> = {
  red: "#ef4444",
  blue: "#3b82f6",
  yellow: "#eab308",
  green: "#22c55e",
  purple: "#a855f7",
  orange: "#f97316",
};
const COLOR_NAMES = Object.keys(COLORS);
const SHAPES: ShapeKind[] = ["circle", "square", "triangle", "rectangle"];
const SHAPE_NAMES: Record<ShapeKind, string> = {
  circle: "Circle",
  square: "Square",
  triangle: "Triangle",
  rectangle: "Rectangle",
  rhombus: "Rhombus",
  parallelogram: "Parallelogram",
  trapezoid: "Trapezoid",
  pentagon: "Pentagon",
  hexagon: "Hexagon",
  quadrilateral: "Quadrilateral",
};

// Build 3 distractor choices for a string answer
function choiceSet(correct: string, pool: string[], count = 3): { choices: string[]; correctIndex: number } {
  const wrong = shuffle(pool.filter((p) => p !== correct)).slice(0, count - 1);
  const choices = shuffle([correct, ...wrong]);
  return { choices, correctIndex: choices.indexOf(correct) };
}

// ---------------------------------------------------------------------------
// Counting objects
// ---------------------------------------------------------------------------
function genPsCountObjects(lesson: Lesson): Problem {
  const max = (lesson.params?.max as number) ?? 10;
  const count = randInt(1, Math.min(max, 10));
  const emoji = pick(CUTE_EMOJIS);
  const visual: ProblemVisual = { kind: "count-row", emoji, count };
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `How many ${emoji} do you see? Count them!`,
    visual,
    answerType: "number",
    answer: count,
    hint: `Point to each one and count: 1, 2, 3...`,
    explanation: `There are ${count} ${emoji}!`,
  };
}

// ---------------------------------------------------------------------------
// Find the number (multiple choice of digits)
// ---------------------------------------------------------------------------
function genPsFindNumber(lesson: Lesson): Problem {
  const target = randInt(1, 10);
  const visual: ProblemVisual = { kind: "number-card", value: target };
  const distractors = new Set<number>([target]);
  while (distractors.size < 3) {
    const d = randInt(1, 10);
    if (d !== target) distractors.add(d);
  }
  const choices = shuffle([...distractors]).map(String);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `Which number is this?`,
    visual,
    answerType: "multiple-choice",
    choices,
    correctIndex: choices.indexOf(String(target)),
    hint: `Look at the shape of the number.`,
    explanation: `That's the number ${target}!`,
  };
}

// ---------------------------------------------------------------------------
// What comes next (counting order)
// ---------------------------------------------------------------------------
function genPsWhatNext(lesson: Lesson): Problem {
  const type = pick(["after", "between"]);
  if (type === "after") {
    const n = randInt(1, 9);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `What number comes right after ${n}?`,
      answerType: "number",
      answer: n + 1,
      hint: `Count up: 1, 2, 3... what's after ${n}?`,
      explanation: `After ${n} comes ${n + 1}!`,
    };
  }
  // between
  const a = randInt(1, 8);
  const b = a + 2;
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What number goes between ${a} and ${b}?`,
    answerType: "number",
    answer: a + 1,
    hint: `Count: ${a}... what... ${b}?`,
    explanation: `Between ${a} and ${b} is ${a + 1}!`,
  };
}

// ---------------------------------------------------------------------------
// Shape identification
// ---------------------------------------------------------------------------
function genPsShapeId(lesson: Lesson): Problem {
  const shape = pick(SHAPES);
  const visual: ProblemVisual = { kind: "shape", shape };
  const prompts: Record<ShapeKind, string> = {
    circle: "Which shape is perfectly round?",
    square: "Which shape has 4 equal sides?",
    triangle: "Which shape has 3 sides?",
    rectangle: "Which shape looks like a door (4 sides, 2 long and 2 short)?",
    rhombus: "",
    parallelogram: "",
    trapezoid: "",
    pentagon: "",
    hexagon: "",
    quadrilateral: "",
  };
  const pool = SHAPES.map((s) => SHAPE_NAMES[s]);
  const { choices, correctIndex } = choiceSet(SHAPE_NAMES[shape], pool);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: prompts[shape],
    visual,
    answerType: "multiple-choice",
    choices,
    correctIndex,
    hint: `Count the sides! Circle has 0, triangle has 3, square and rectangle have 4.`,
    explanation: `That's a ${SHAPE_NAMES[shape]}!`,
  };
}

// ---------------------------------------------------------------------------
// Color identification
// ---------------------------------------------------------------------------
function genPsColorId(lesson: Lesson): Problem {
  const colorName = pick(COLOR_NAMES);
  const visual: ProblemVisual = { kind: "color-shape", shape: "circle", color: COLORS[colorName] };
  const { choices, correctIndex } = choiceSet(
    colorName.charAt(0).toUpperCase() + colorName.slice(1),
    COLOR_NAMES.map((c) => c.charAt(0).toUpperCase() + c.slice(1))
  );
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What color is this shape?`,
    visual,
    answerType: "multiple-choice",
    choices,
    correctIndex,
    hint: `The shape is filled with a color. What color is it?`,
    explanation: `That's ${colorName}!`,
  };
}

// ---------------------------------------------------------------------------
// Match the shape — show a shape, pick the matching one from choices
// ---------------------------------------------------------------------------
function genPsMatchShape(lesson: Lesson): Problem {
  const shape = pick(SHAPES);
  const visual: ProblemVisual = { kind: "shape", shape };
  const pool = SHAPES.map((s) => SHAPE_NAMES[s]);
  const { choices, correctIndex } = choiceSet(SHAPE_NAMES[shape], pool);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `Find the shape that matches this one.`,
    visual,
    answerType: "multiple-choice",
    choices,
    correctIndex,
    hint: `Look for the same shape.`,
    explanation: `That's also a ${SHAPE_NAMES[shape]}!`,
  };
}

// ---------------------------------------------------------------------------
// Patterns — AB (2-item repeat)
// ---------------------------------------------------------------------------
function genPsPatternAB(lesson: Lesson): Problem {
  const a = pick(COLOR_NAMES.slice(0, 4));
  let b = pick(COLOR_NAMES.slice(0, 4));
  while (b === a) b = pick(COLOR_NAMES.slice(0, 4));
  const colorA = COLORS[a];
  const colorB = COLORS[b];
  // build a pattern of 6 items with the last one missing
  const items: PatternItem[] = [];
  for (let i = 0; i < 5; i++) {
    items.push({ type: "shape", shape: "circle", color: i % 2 === 0 ? colorA : colorB });
  }
  // the missing one (index 5) should be colorA (since index 5 % 2 == 1... wait 5%2=1 → colorB)
  const missingColor = 5 % 2 === 0 ? colorA : colorB;
  const missingName = missingColor === colorA ? a : b;
  const visual: ProblemVisual = { kind: "pattern", items, missingIndex: 5 };
  const pool = [a, b].map((c) => c.charAt(0).toUpperCase() + c.slice(1));
  const distractors = COLOR_NAMES.filter((c) => c !== a && c !== b).slice(0, 2).map((c) => c.charAt(0).toUpperCase() + c.slice(1));
  const choices = shuffle([missingName.charAt(0).toUpperCase() + missingName.slice(1), ...distractors.slice(0, 2)]);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What color comes next in the pattern?`,
    visual,
    answerType: "multiple-choice",
    choices,
    correctIndex: choices.indexOf(missingName.charAt(0).toUpperCase() + missingName.slice(1)),
    hint: `Say the colors out loud: ${a}, ${b}, ${a}, ${b}... what's next?`,
    explanation: `The pattern is ${a}, ${b}, ${a}, ${b}... so ${missingName} comes next!`,
  };
}

// ---------------------------------------------------------------------------
// Patterns — ABC (3-item repeat)
// ---------------------------------------------------------------------------
function genPsPatternABC(lesson: Lesson): Problem {
  const chosen = shuffle(SHAPES).slice(0, 3) as ShapeKind[];
  const items: PatternItem[] = [];
  for (let i = 0; i < 5; i++) {
    items.push({ type: "shape", shape: chosen[i % 3], color: "#6366f1" });
  }
  // missing index 5 → shape chosen[5 % 3] = chosen[2]
  const missingShape = chosen[5 % 3];
  const missingName = SHAPE_NAMES[missingShape];
  const visual: ProblemVisual = { kind: "pattern", items, missingIndex: 5 };
  const distractors = SHAPES.filter((s) => !chosen.includes(s)).slice(0, 2).map((s) => SHAPE_NAMES[s]);
  const choices = shuffle([missingName, ...distractors]);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What shape comes next in the pattern?`,
    visual,
    answerType: "multiple-choice",
    choices,
    correctIndex: choices.indexOf(missingName),
    hint: `The pattern repeats: ${chosen.map((s) => SHAPE_NAMES[s]).join(", ")}...`,
    explanation: `The pattern repeats, so ${missingName} comes next!`,
  };
}

// ---------------------------------------------------------------------------
// More or less
// ---------------------------------------------------------------------------
function genPsMoreLess(lesson: Lesson): Problem {
  const leftEmoji = pick(CUTE_EMOJIS);
  let rightEmoji = pick(CUTE_EMOJIS);
  while (rightEmoji === leftEmoji) rightEmoji = pick(CUTE_EMOJIS);
  const leftCount = randInt(1, 8);
  let rightCount = randInt(1, 8);
  while (rightCount === leftCount) rightCount = randInt(1, 8);
  const visual: ProblemVisual = { kind: "compare-rows", leftEmoji, leftCount, rightEmoji, rightCount };
  const askMore = Math.random() < 0.5;
  const answer = askMore ? (leftCount > rightCount ? "Left" : "Right") : (leftCount < rightCount ? "Left" : "Right");
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `Which side has ${askMore ? "MORE" : "FEWER"}?`,
    visual,
    answerType: "multiple-choice",
    choices: ["Left", "Right"],
    correctIndex: answer === "Left" ? 0 : 1,
    hint: `Count each side. ${askMore ? "MORE means the bigger number." : "FEWER means the smaller number."}`,
    explanation: `Left has ${leftCount}, right has ${rightCount}. ${askMore ? "More" : "Fewer"} is the ${askMore ? "bigger" : "smaller"} group — ${answer}!`,
  };
}

// ---------------------------------------------------------------------------
// Big and small
// ---------------------------------------------------------------------------
function genPsBigSmall(lesson: Lesson): Problem {
  const askBig = Math.random() < 0.5;
  const s1 = pick(SHAPES);
  let s2 = pick(SHAPES);
  while (s2 === s1) s2 = pick(SHAPES);
  const c1 = pick(COLOR_NAMES);
  let c2 = pick(COLOR_NAMES);
  while (c2 === c1) c2 = pick(COLOR_NAMES);
  const size1 = randInt(40, 70);
  const size2 = randInt(40, 70);
  // ensure different
  const big = Math.max(size1, size2);
  const small = Math.min(size1, size2);
  const shapes = [
    { shape: s1, color: COLORS[c1], size: size1 },
    { shape: s2, color: COLORS[c2], size: size2 },
  ];
  const visual: ProblemVisual = { kind: "size-shapes", shapes };
  const biggerIndex = size1 > size2 ? 0 : 1;
  const correct = askBig ? biggerIndex : 1 - biggerIndex;
  void big; void small;
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `Which shape is ${askBig ? "BIGGER" : "SMALLER"}?`,
    visual,
    answerType: "multiple-choice",
    choices: ["Left", "Right"],
    correctIndex: correct,
    hint: `Look at the sizes. ${askBig ? "Find the bigger one." : "Find the smaller one."}`,
    explanation: `The ${askBig ? "bigger" : "smaller"} shape is on the ${correct === 0 ? "left" : "right"}!`,
  };
}

// ---------------------------------------------------------------------------
// Same or different
// ---------------------------------------------------------------------------
function genPsSameDifferent(lesson: Lesson): Problem {
  const type = pick(["color", "shape"]);
  if (type === "color") {
    const main = pick(COLOR_NAMES.slice(0, 4));
    let diff = pick(COLOR_NAMES.slice(0, 4));
    while (diff === main) diff = pick(COLOR_NAMES.slice(0, 4));
    const items: PatternItem[] = [];
    const positions = [0, 1, 2, 3];
    const diffPos = pick(positions);
    for (let i = 0; i < 4; i++) {
      items.push({ type: "shape", shape: "circle", color: i === diffPos ? COLORS[diff] : COLORS[main] });
    }
    const visual: ProblemVisual = { kind: "pattern", items, missingIndex: -1 };
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `Which circle is DIFFERENT from the others?`,
      visual,
      answerType: "multiple-choice",
      choices: ["1st", "2nd", "3rd", "4th"],
      correctIndex: diffPos,
      hint: `Look for the one that's a different color.`,
      explanation: `The ${diffPos + 1}${ordinal(diffPos + 1)} circle is ${diff}, but the rest are ${main}!`,
    };
  }
  // shape
  const mainShape = pick(SHAPES);
  let diffShape = pick(SHAPES);
  while (diffShape === mainShape) diffShape = pick(SHAPES);
  const items: PatternItem[] = [];
  const diffPos = randInt(0, 3);
  for (let i = 0; i < 4; i++) {
    items.push({ type: "shape", shape: i === diffPos ? diffShape : mainShape, color: "#6366f1" });
  }
  const visual: ProblemVisual = { kind: "pattern", items, missingIndex: -1 };
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `Which shape is DIFFERENT from the others?`,
    visual,
    answerType: "multiple-choice",
    choices: ["1st", "2nd", "3rd", "4th"],
    correctIndex: diffPos,
    hint: `Look for the one with a different shape.`,
    explanation: `The ${diffPos + 1}${ordinal(diffPos + 1)} is a ${SHAPE_NAMES[diffShape]}, but the rest are ${SHAPE_NAMES[mainShape]}!`,
  };
}

function ordinal(n: number): string {
  if (n === 1) return "st";
  if (n === 2) return "nd";
  if (n === 3) return "rd";
  return "th";
}

// ---------------------------------------------------------------------------
// One more
// ---------------------------------------------------------------------------
function genPsOneMore(lesson: Lesson): Problem {
  const n = randInt(1, 9);
  const emoji = pick(CUTE_EMOJIS);
  const visual: ProblemVisual = { kind: "count-row", emoji, count: n };
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `You have ${n} ${emoji}. Add ONE more. How many now?`,
    visual,
    answerType: "number",
    answer: n + 1,
    hint: `Count up one more: ${n}... then what?`,
    explanation: `${n} and one more is ${n + 1}!`,
  };
}

// ---------------------------------------------------------------------------
// Adding within 5
// ---------------------------------------------------------------------------
function genPsAdd5(lesson: Lesson): Problem {
  const a = randInt(1, 4);
  const b = randInt(1, 5 - a);
  const emoji = pick(CUTE_EMOJIS);
  const visual: ProblemVisual = { kind: "compare-rows", leftEmoji: emoji, leftCount: a, rightEmoji: emoji, rightCount: b };
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `${a} ${emoji} and ${b} more ${emoji}. How many altogether?`,
    visual,
    answerType: "number",
    answer: a + b,
    hint: `Count them all: ${a}... then keep counting!`,
    explanation: `${a} + ${b} = ${a + b}!`,
  };
}

// ---------------------------------------------------------------------------
// Sorting — which belongs in the group
// ---------------------------------------------------------------------------
function genPsSorting(lesson: Lesson): Problem {
  const type = pick(["shape", "color"]);
  if (type === "shape") {
    const groupShape = pick(SHAPES);
    let other = pick(SHAPES);
    while (other === groupShape) other = pick(SHAPES);
    const { choices, correctIndex } = choiceSet(SHAPE_NAMES[groupShape], [SHAPE_NAMES[groupShape], SHAPE_NAMES[other], SHAPE_NAMES[other]]);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `All the shapes in this group are ${SHAPE_NAMES[groupShape]}s. Which one belongs?`,
      answerType: "multiple-choice",
      choices,
      correctIndex,
      hint: `Pick the ${SHAPE_NAMES[groupShape]}!`,
      explanation: `A ${SHAPE_NAMES[groupShape]} belongs with the other ${SHAPE_NAMES[groupShape]}s!`,
    };
  }
  const groupColor = pick(COLOR_NAMES.slice(0, 4));
  let other = pick(COLOR_NAMES.slice(0, 4));
  while (other === groupColor) other = pick(COLOR_NAMES.slice(0, 4));
  const gc = groupColor.charAt(0).toUpperCase() + groupColor.slice(1);
  const oc = other.charAt(0).toUpperCase() + other.slice(1);
  const { choices, correctIndex } = choiceSet(gc, [gc, oc, oc]);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `All the shapes in this group are ${groupColor}. Which one belongs?`,
    answerType: "multiple-choice",
    choices,
    correctIndex,
    hint: `Pick the ${groupColor} one!`,
    explanation: `The ${groupColor} shape belongs with the other ${groupColor} ones!`,
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------
const PS_GENERATORS: Record<string, (lesson: Lesson, ctx?: GenContext) => Problem> = {
  "ps-count-objects": genPsCountObjects,
  "ps-find-number": genPsFindNumber,
  "ps-what-next": genPsWhatNext,
  "ps-shape-id": genPsShapeId,
  "ps-color-id": genPsColorId,
  "ps-match-shape": genPsMatchShape,
  "ps-pattern-ab": genPsPatternAB,
  "ps-pattern-abc": genPsPatternABC,
  "ps-more-less": genPsMoreLess,
  "ps-big-small": genPsBigSmall,
  "ps-same-different": genPsSameDifferent,
  "ps-one-more": genPsOneMore,
  "ps-add-5": genPsAdd5,
  "ps-sorting": genPsSorting,
};

export function generatePreschoolProblems(
  lesson: Lesson,
  count: number,
  ctx?: GenContext
): Problem[] {
  const gen = PS_GENERATORS[lesson.generator];
  if (!gen) {
    throw new Error(`No preschool generator for lesson "${lesson.id}" (${lesson.generator})`);
  }
  const problems: Problem[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (problems.length < count && guard < count * 20) {
    guard++;
    const p = gen(lesson, ctx);
    const sig = `${p.answerType}:${p.prompt}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    problems.push(p);
  }
  while (problems.length < count) problems.push(gen(lesson, ctx));
  return problems;
}
