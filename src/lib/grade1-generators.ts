import type { Problem, ProblemVisual, Lesson, GenContext } from "@/lib/types";

// ---------------------------------------------------------------------------
// 1st grade problem generators. Reuse the same Problem shape and answer types
// as preschool and grade-3 so the QuizRunner and AnswerInput work unchanged.
// Numbers stay age-appropriate: within 10 for early add/sub, within 20 for
// most other topics, and up to 120 for place value.
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

let g1Counter = 0;
function nextId(lesson: string) {
  g1Counter += 1;
  return `${lesson}-${g1Counter}`;
}

const CUTE_EMOJIS = ["🍎", "🎈", "⭐", "🍪", "🌸", "🐠", "🐝", "🍇", "🍓", "🦋", "🦊", "🐸"];
const KID_NAMES = ["Mia", "Leo", "Zoe", "Sam", "Ava", "Max", "Lily", "Noah", "Emma", "Eli"];

// Build N distractor choices for a string answer (default 3 total).
function choiceSet(correct: string, pool: string[], count = 3): { choices: string[]; correctIndex: number } {
  const wrong = shuffle(pool.filter((p) => p !== correct)).slice(0, count - 1);
  const choices = shuffle([correct, ...wrong]);
  return { choices, correctIndex: choices.indexOf(correct) };
}

// ---------------------------------------------------------------------------
// g1-add-to-10 — simple addition within 10 (visual: compare-rows)
// ---------------------------------------------------------------------------
function genG1AddTo10(lesson: Lesson): Problem {
  const a = randInt(1, 7);
  const b = randInt(1, 10 - a);
  const emoji = pick(CUTE_EMOJIS);
  const visual: ProblemVisual = { kind: "compare-rows", leftEmoji: emoji, leftCount: a, rightEmoji: emoji, rightCount: b };
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `${a} ${emoji} and ${b} more ${emoji}. How many altogether?`,
    visual,
    answerType: "number",
    answer: a + b,
    hint: `Count them all: start at ${a} and count up ${b} more.`,
    explanation: `${a} + ${b} = ${a + b}!`,
  };
}

// ---------------------------------------------------------------------------
// g1-sub-from-10 — subtraction within 10 (visual: count-row)
// ---------------------------------------------------------------------------
function genG1SubFrom10(lesson: Lesson): Problem {
  const a = randInt(5, 10);
  const b = randInt(1, a - 1);
  const emoji = pick(CUTE_EMOJIS);
  const visual: ProblemVisual = { kind: "count-row", emoji, count: a };
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `There are ${a} ${emoji}. You take away ${b}. How many are left?`,
    visual,
    answerType: "number",
    answer: a - b,
    hint: `Start at ${a} and count back ${b}: ${a}, ${a - 1}...`,
    explanation: `${a} − ${b} = ${a - b}!`,
  };
}

// ---------------------------------------------------------------------------
// g1-word-add — word problems within 10 (story + number answer)
// ---------------------------------------------------------------------------
const WORD_ADD_TEMPLATES: Array<(a: number, b: number, e: string, n: string) => string> = [
  (a, b, e, n) => `${n} has ${a} ${e}. A friend gives ${b} more. How many ${e} does ${n} have altogether?`,
  (a, b, e) => `There are ${a} ${e} on a tree. ${b} more ${e} land on the tree. How many ${e} are there in all?`,
  (a, b, e, n) => `${n} picks ${a} ${e}. Then ${n} picks ${b} more. How many ${e} does ${n} have now?`,
  (a, b, e, n) => `${n} sees ${a} ${e}. ${b} more ${e} hop over. How many ${e} does ${n} see in all?`,
];
const WORD_SUB_TEMPLATES: Array<(a: number, b: number, e: string, n: string) => string> = [
  (a, b, e, n) => `${n} has ${a} ${e}. A friend eats ${b} of them. How many ${e} are left?`,
  (a, b, e, n) => `There are ${a} ${e} in a basket. ${n} takes ${b} out. How many ${e} are left in the basket?`,
  (a, b, e, n) => `${n} bakes ${a} ${e} and gives ${b} away. How many ${e} does ${n} still have?`,
  (a, b, e, n) => `${n} finds ${a} ${e}. ${b} of them wiggle away. How many ${e} are left?`,
];

function genG1WordAdd(lesson: Lesson): Problem {
  const isAdd = Math.random() < 0.55;
  const emoji = pick(CUTE_EMOJIS);
  const name = pick(KID_NAMES);
  let a: number, b: number, answer: number, story: string;
  if (isAdd) {
    a = randInt(1, 7);
    b = randInt(1, 10 - a);
    answer = a + b;
    story = pick(WORD_ADD_TEMPLATES)(a, b, emoji, name);
  } else {
    a = randInt(4, 10);
    b = randInt(1, a - 1);
    answer = a - b;
    story = pick(WORD_SUB_TEMPLATES)(a, b, emoji, name);
  }
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: isAdd ? "How many altogether?" : "How many are left?",
    story,
    answerType: "number",
    answer,
    hint: isAdd
      ? `'Altogether' and 'in all' mean ADD. ${a} + ${b} = ?`
      : `'Left' means SUBTRACT. ${a} − ${b} = ?`,
    explanation: isAdd
      ? `${a} + ${b} = ${answer}!`
      : `${a} − ${b} = ${answer}!`,
  };
}

// ---------------------------------------------------------------------------
// g1-add-3 — add three single-digit numbers
// ---------------------------------------------------------------------------
function genG1Add3(lesson: Lesson): Problem {
  const a = randInt(1, 5);
  const b = randInt(1, 5);
  const c = randInt(1, 5);
  const sum = a + b + c;
  // Highlight pair-to-ten strategy when one pair sums to 10.
  let hint: string;
  let explanation: string;
  if (a + b === 10) {
    hint = `Look! ${a} + ${b} = 10. Then add ${c} more.`;
    explanation = `First ${a} + ${b} = 10, then 10 + ${c} = ${sum}!`;
  } else if (a + c === 10) {
    hint = `Try adding ${a} + ${c} first — they make 10!`;
    explanation = `First ${a} + ${c} = 10, then 10 + ${b} = ${sum}!`;
  } else if (b + c === 10) {
    hint = `Try adding ${b} + ${c} first — they make 10!`;
    explanation = `First ${b} + ${c} = 10, then 10 + ${a} = ${sum}!`;
  } else {
    hint = `Add the first two: ${a} + ${b} = ${a + b}. Then add ${c}.`;
    explanation = `${a} + ${b} = ${a + b}, and ${a + b} + ${c} = ${sum}!`;
  }
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `${a} + ${b} + ${c} = ?`,
    answerType: "number",
    answer: sum,
    hint,
    explanation,
  };
}

// ---------------------------------------------------------------------------
// g1-make-10 — "what makes 10?" missing addend
// ---------------------------------------------------------------------------
function genG1Make10(lesson: Lesson): Problem {
  const a = randInt(1, 9);
  const answer = 10 - a;
  const emoji = pick(CUTE_EMOJIS);
  const visual: ProblemVisual = { kind: "count-row", emoji, count: a };
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `You have ${a} ${emoji}. How many more do you need to make 10?`,
    visual,
    answerType: "number",
    answer,
    hint: `Count up from ${a} to 10: ${a + 1}, ${a + 2}... how many jumps?`,
    explanation: `${a} + ${answer} = 10!`,
  };
}

// ---------------------------------------------------------------------------
// g1-tens-ones — identify tens/ones in a 2-digit number (visual: number-blocks)
// ---------------------------------------------------------------------------
function genG1TensOnes(lesson: Lesson): Problem {
  const n = randInt(11, 99);
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const visual: ProblemVisual = { kind: "number-blocks", value: n };
  const askTens = Math.random() < 0.5;
  if (askTens) {
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `Look at the blocks for ${n}. How many TENS are there?`,
      visual,
      answerType: "number",
      answer: tens,
      hint: `Count the ten-sticks. The left digit of ${n} is the tens place.`,
      explanation: `${n} has ${tens} tens (that's ${tens * 10}) and ${ones} ones.`,
    };
  }
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `Look at the blocks for ${n}. How many ONES are there?`,
    visual,
    answerType: "number",
    answer: ones,
    hint: `Count the single blocks. The right digit of ${n} is the ones place.`,
    explanation: `${n} has ${tens} tens and ${ones} ones.`,
  };
}

// ---------------------------------------------------------------------------
// g1-count-120 — counting forward to 120
// ---------------------------------------------------------------------------
function genG1Count120(lesson: Lesson): Problem {
  const variant = pick(["after", "before", "fill"]);
  if (variant === "after") {
    const n = randInt(1, 119);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `What number comes right after ${n}?`,
      answerType: "number",
      answer: n + 1,
      hint: `Count up by 1 from ${n}.`,
      explanation: `After ${n} comes ${n + 1}!`,
    };
  }
  if (variant === "before") {
    const n = randInt(2, 120);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `What number comes right before ${n}?`,
      answerType: "number",
      answer: n - 1,
      hint: `Count back by 1 from ${n}.`,
      explanation: `Before ${n} comes ${n - 1}!`,
    };
  }
  // fill in the gap: n, n+1, n+2, ?, n+4
  const n = randInt(1, 116);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `Fill in the missing number: ${n}, ${n + 1}, ${n + 2}, ?, ${n + 4}`,
    answerType: "number",
    answer: n + 3,
    hint: `Each number is 1 more than the last. What's between ${n + 2} and ${n + 4}?`,
    explanation: `The pattern counts up by 1: the missing number is ${n + 3}!`,
  };
}

// ---------------------------------------------------------------------------
// g1-compare-num — compare 2-digit numbers (greater/less MC)
// ---------------------------------------------------------------------------
function genG1CompareNum(lesson: Lesson): Problem {
  const askGreater = Math.random() < 0.5;
  const a = randInt(10, 99);
  let b = randInt(10, 99);
  while (b === a) b = randInt(10, 99);
  const correct = askGreater ? Math.max(a, b) : Math.min(a, b);
  const other = askGreater ? Math.min(a, b) : Math.max(a, b);
  // 3 choices: correct + other + a far distractor
  let distractor = randInt(10, 99);
  while (distractor === a || distractor === b) distractor = randInt(10, 99);
  const { choices, correctIndex } = choiceSet(
    String(correct),
    [String(other), String(distractor)],
    3
  );
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `Which number is ${askGreater ? "GREATER" : "LESS"}: ${a} or ${b}?`,
    answerType: "multiple-choice",
    choices,
    correctIndex,
    hint: askGreater
      ? `Look at the tens digit first. Bigger tens = bigger number.`
      : `Look at the tens digit first. Smaller tens = smaller number.`,
    explanation: `${correct} is ${askGreater ? "greater" : "less"} than ${other}!`,
  };
}

// ---------------------------------------------------------------------------
// g1-ten-more — 10 more / 10 less than a 2-digit number
// ---------------------------------------------------------------------------
function genG1TenMore(lesson: Lesson): Problem {
  const askMore = Math.random() < 0.5;
  // keep within 10–99 so the result stays in range
  const n = askMore ? randInt(10, 89) : randInt(20, 99);
  const answer = askMore ? n + 10 : n - 10;
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What is 10 ${askMore ? "more" : "less"} than ${n}?`,
    answerType: "number",
    answer,
    hint: askMore
      ? `Add 1 to the tens digit of ${n}. The ones digit stays the same.`
      : `Subtract 1 from the tens digit of ${n}. The ones digit stays the same.`,
    explanation: `${n} ${askMore ? "+ 10" : "− 10"} = ${answer}!`,
  };
}

// ---------------------------------------------------------------------------
// g1-length — compare lengths (longer/shorter MC)
// ---------------------------------------------------------------------------
const LENGTH_PAIRS: Array<{ a: string; b: string; aLonger: boolean }> = [
  { a: "pencil", b: "school bus", aLonger: false },
  { a: "ruler", b: " crayon", aLonger: true },
  { a: "snake", b: "ant", aLonger: true },
  { a: "giraffe", b: "mouse", aLonger: true },
  { a: "spaghetti noodle", b: "grape", aLonger: true },
  { a: "whale", b: "goldfish", aLonger: true },
  { a: "thumb", b: "arm", aLonger: false },
  { a: "shoe", b: " soccer field", aLonger: false },
  { a: "book", b: "paperclip", aLonger: true },
  { a: "caterpillar", b: "elephant", aLonger: false },
];

function genG1Length(lesson: Lesson): Problem {
  const variant = pick(["word", "visual"]);
  if (variant === "visual") {
    const leftSize = randInt(50, 110);
    let rightSize = randInt(50, 110);
    while (rightSize === leftSize) rightSize = randInt(50, 110);
    const askLonger = Math.random() < 0.5;
    const visual: ProblemVisual = {
      kind: "size-shapes",
      shapes: [
        { shape: "rectangle", color: "#3b82f6", size: leftSize },
        { shape: "rectangle", color: "#ef4444", size: rightSize },
      ],
    };
    const leftLonger = leftSize > rightSize;
    const correct = askLonger ? (leftLonger ? "Left" : "Right") : (leftLonger ? "Right" : "Left");
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `Which bar is ${askLonger ? "LONGER" : "SHORTER"}?`,
      visual,
      answerType: "multiple-choice",
      choices: ["Left", "Right"],
      correctIndex: correct === "Left" ? 0 : 1,
      hint: askLonger
        ? `Longer means the bigger bar. Which one stretches out farther?`
        : `Shorter means the smaller bar. Which one is smaller?`,
      explanation: `The ${askLonger ? "longer" : "shorter"} bar is on the ${correct === "Left" ? "left" : "right"}!`,
    };
  }
  const pair = pick(LENGTH_PAIRS);
  const askLonger = Math.random() < 0.5;
  const correct = askLonger
    ? (pair.aLonger ? pair.a : pair.b)
    : (pair.aLonger ? pair.b : pair.a);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `Which is ${askLonger ? "LONGER" : "SHORTER"}: a ${pair.a.trim()} or a ${pair.b.trim()}?`,
    answerType: "multiple-choice",
    choices: [pair.a.trim(), pair.b.trim()],
    correctIndex: correct === pair.a.trim() ? 0 : 1,
    hint: `Picture each one in your head. Which one stretches out ${askLonger ? "farther" : "less"}?`,
    explanation: `A ${correct} is ${askLonger ? "longer" : "shorter"} than a ${correct === pair.a.trim() ? pair.b.trim() : pair.a.trim()}!`,
  };
}

// ---------------------------------------------------------------------------
// g1-time-hour — tell time to the hour (visual: clock)
// ---------------------------------------------------------------------------
function genG1TimeHour(lesson: Lesson): Problem {
  const hour = randInt(1, 12);
  const minute = 0;
  const visual: ProblemVisual = { kind: "clock", hour, minute };
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What time is it on the clock?`,
    visual,
    answerType: "time",
    hour,
    minute,
    mode: "read",
    hint: `The long minute hand points at the 12 — that means 'o'clock'. The short hour hand points at the hour.`,
    explanation: `It's ${hour}:${minute.toString().padStart(2, "0")} — that's ${hour} o'clock!`,
  };
}

// ---------------------------------------------------------------------------
// g1-time-half — tell time to the half hour (visual: clock)
// ---------------------------------------------------------------------------
function genG1TimeHalf(lesson: Lesson): Problem {
  const hour = randInt(1, 12);
  const minute = 30;
  const visual: ProblemVisual = { kind: "clock", hour, minute };
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What time is it on the clock?`,
    visual,
    answerType: "time",
    hour,
    minute,
    mode: "read",
    hint: `The long minute hand points at the 6 — that means 'half past'. The short hour hand is between two numbers; pick the one it just passed.`,
    explanation: `It's ${hour}:${minute} — that's half past ${hour}!`,
  };
}

// ---------------------------------------------------------------------------
// g1-money — count coins (pennies, nickels, dimes)
// ---------------------------------------------------------------------------
function genG1Money(lesson: Lesson): Problem {
  const dimes = randInt(0, 3);
  const nickels = randInt(0, 2);
  const pennies = randInt(0, 4);
  // ensure at least one coin and a non-trivial total
  if (dimes + nickels + pennies === 0) {
    return genG1Money(lesson);
  }
  const total = dimes * 10 + nickels * 5 + pennies;
  const parts: string[] = [];
  if (dimes > 0) parts.push(`${dimes} dime${dimes > 1 ? "s" : ""}`);
  if (nickels > 0) parts.push(`${nickels} nickel${nickels > 1 ? "s" : ""}`);
  if (pennies > 0) parts.push(`${pennies} penn${pennies > 1 ? "ies" : "y"}`);
  const list = parts.join(", ");
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `You have ${list}. How many cents is that altogether?`,
    answerType: "number",
    answer: total,
    unit: "¢",
    hint: `A dime is 10¢, a nickel is 5¢, a penny is 1¢. Add the biggest coins first.`,
    explanation: `${dimes > 0 ? `${dimes * 10}¢ ` : ""}${nickels > 0 ? `+ ${nickels * 5}¢ ` : ""}${pennies > 0 ? `+ ${pennies}¢ ` : ""}= ${total}¢!`,
  };
}

// ---------------------------------------------------------------------------
// g1-shapes-3d — identify 3D shapes (sphere, cube, cone, cylinder)
// ---------------------------------------------------------------------------
type Shape3D = "Sphere" | "Cube" | "Cone" | "Cylinder";
const SHAPES_3D: Array<{ name: Shape3D; emoji: string; clue: string }> = [
  { name: "Sphere", emoji: "⚽", clue: "a soccer ball" },
  { name: "Sphere", emoji: "🌍", clue: "a globe" },
  { name: "Cube", emoji: "🎲", clue: "a dice" },
  { name: "Cube", emoji: "📦", clue: "a moving box" },
  { name: "Cone", emoji: "🍦", clue: "an ice cream cone" },
  { name: "Cone", emoji: "🎉", clue: "a party hat" },
  { name: "Cylinder", emoji: "🥫", clue: "a can of soup" },
  { name: "Cylinder", emoji: "🪣", clue: "a bucket" },
];

function genG1Shapes3d(lesson: Lesson): Problem {
  const item = pick(SHAPES_3D);
  const pool = ["Sphere", "Cube", "Cone", "Cylinder"];
  const { choices, correctIndex } = choiceSet(item.name, pool, 4);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `${item.emoji}  What solid shape is ${item.clue}?`,
    answerType: "multiple-choice",
    choices,
    correctIndex,
    hint: `Sphere = round like a ball. Cube = 6 square sides. Cone = pointy top. Cylinder = can shape.`,
    explanation: `${item.emoji} A ${item.name.toLowerCase()} is the shape of ${item.clue}!`,
  };
}

// ---------------------------------------------------------------------------
// g1-halves — identify halves vs fourths (visual: fraction-pie)
// ---------------------------------------------------------------------------
function genG1Halves(lesson: Lesson): Problem {
  const denominator = pick([2, 4]);
  const numerator = 1;
  const visual: ProblemVisual = { kind: "fraction-pie", numerator, denominator };
  const correctName = denominator === 2 ? "Halves" : "Fourths";
  const pool = ["Halves", "Fourths", "Thirds"];
  const { choices, correctIndex } = choiceSet(correctName, pool, 3);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `The shape is cut into ${denominator} equal parts. What are the parts called?`,
    visual,
    answerType: "multiple-choice",
    choices,
    correctIndex,
    hint: `2 equal parts = halves. 4 equal parts = fourths. Count the slices!`,
    explanation: `${denominator} equal parts means the shape is cut into ${correctName.toLowerCase()}. Each piece is one-${denominator === 2 ? "half" : "fourth"}!`,
  };
}

// ---------------------------------------------------------------------------
// g1-number-line — find a number on a number line to 20 (visual: number-line)
// ---------------------------------------------------------------------------
function genG1NumberLine(lesson: Lesson): Problem {
  const target = randInt(3, 19);
  const visual: ProblemVisual = {
    kind: "number-line",
    start: 0,
    end: 20,
    numerator: target,
    denominator: 1,
    ticks: 20,
  };
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What number is at the dot on the number line?`,
    visual,
    answerType: "number",
    answer: target,
    hint: `Start at 0 on the left and count the tick marks one by one until you reach the dot.`,
    explanation: `The dot is ${target} marks from 0, so it's at ${target}!`,
  };
}

// ---------------------------------------------------------------------------
// g1-missing-addend — missing addend within 10
// ---------------------------------------------------------------------------
function genG1MissingAddend(lesson: Lesson): Problem {
  const a = randInt(1, 8);
  const total = randInt(a + 1, 10);
  const answer = total - a;
  const emoji = pick(CUTE_EMOJIS);
  const visual: ProblemVisual = { kind: "count-row", emoji, count: a };
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `${a} + ? = ${total}. What is the missing number?`,
    visual,
    answerType: "number",
    answer,
    hint: `Start at ${a} and count up to ${total}: ${a + 1}, ${a + 2}... how many jumps?`,
    explanation: `Count up from ${a} to ${total}: that's ${answer} jumps. So ${a} + ${answer} = ${total}!`,
  };
}

// ---------------------------------------------------------------------------
// g1-patterns — number patterns (count by 2s, 5s, 10s)
// ---------------------------------------------------------------------------
function genG1Patterns(lesson: Lesson): Problem {
  const skip = pick([2, 5, 10]);
  // pick a start that keeps all numbers <= 100 and shows 5 numbers
  const maxStart = skip === 2 ? 12 : skip === 5 ? 20 : 40;
  const start = pick([0, skip, randInt(0, maxStart)]);
  // make sure start is a "natural" beginning (multiple of skip when starting at 0)
  const s = start % skip === 0 ? start : 0;
  const variant = pick(["next", "missing"]);
  if (variant === "next") {
    // show 4 numbers, ask for the 5th
    const n0 = s;
    const n1 = s + skip;
    const n2 = s + skip * 2;
    const n3 = s + skip * 3;
    const answer = s + skip * 4;
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `What comes next: ${n0}, ${n1}, ${n2}, ${n3}, ?`,
      answerType: "number",
      answer,
      hint: `Each number is ${skip} more than the last. Add ${skip} to ${n3}.`,
      explanation: `Counting by ${skip}s: after ${n3} comes ${answer}!`,
    };
  }
  // missing middle: n0, n1, n2, ?, n4
  const n0 = s;
  const n1 = s + skip;
  const n2 = s + skip * 2;
  const missing = s + skip * 3;
  const n4 = s + skip * 4;
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `Fill in the missing number: ${n0}, ${n1}, ${n2}, ?, ${n4}`,
    answerType: "number",
    answer: missing,
    hint: `The pattern counts by ${skip}s. What's between ${n2} and ${n4}?`,
    explanation: `Counting by ${skip}s: the missing number is ${missing}!`,
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------
const G1_GENERATORS: Record<string, (lesson: Lesson, ctx?: GenContext) => Problem> = {
  "g1-add-to-10": genG1AddTo10,
  "g1-sub-from-10": genG1SubFrom10,
  "g1-word-add": genG1WordAdd,
  "g1-add-3": genG1Add3,
  "g1-make-10": genG1Make10,
  "g1-tens-ones": genG1TensOnes,
  "g1-count-120": genG1Count120,
  "g1-compare-num": genG1CompareNum,
  "g1-ten-more": genG1TenMore,
  "g1-length": genG1Length,
  "g1-time-hour": genG1TimeHour,
  "g1-time-half": genG1TimeHalf,
  "g1-money": genG1Money,
  "g1-shapes-3d": genG1Shapes3d,
  "g1-halves": genG1Halves,
  "g1-number-line": genG1NumberLine,
  "g1-missing-addend": genG1MissingAddend,
  "g1-patterns": genG1Patterns,
};

export function generateGrade1Problems(
  lesson: Lesson,
  count: number,
  ctx?: GenContext
): Problem[] {
  const gen = G1_GENERATORS[lesson.generator];
  if (!gen) {
    throw new Error(`No grade-1 generator for lesson "${lesson.id}" (${lesson.generator})`);
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
