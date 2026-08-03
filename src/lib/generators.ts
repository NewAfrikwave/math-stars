import type { Problem, ProblemVisual, ShapeKind, Difficulty, GenContext } from "@/lib/types";
import type { Lesson } from "@/lib/types";
import { generatePreschoolProblems } from "@/lib/preschool-generators";
import { generateGrade1Problems } from "@/lib/grade1-generators";
import { generateGrade2Problems } from "@/lib/grade2-generators";
import { generateGrade4Problems } from "@/lib/grade4-generators";

// Re-export GenContext for callers that import it from here.
export type { GenContext } from "@/lib/types";

// Helpers to scale ranges by difficulty.
function rangeFor(
  base: { easy: [number, number]; normal: [number, number]; hard: [number, number] },
  difficulty?: Difficulty
): [number, number] {
  if (difficulty === "easy") return base.easy;
  if (difficulty === "challenge") return base.hard;
  return base.normal;
}

// ---------------------------------------------------------------------------
// Random helpers
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

// Build unique multiple-choice options around a correct numeric answer
function numericChoices(answer: number, count = 4): { choices: string[]; correctIndex: number } {
  const set = new Set<number>([answer]);
  let guard = 0;
  while (set.size < count && guard < 50) {
    guard++;
    const delta = pick([-3, -2, -1, 1, 2, 3, 4, 5, -5, -4]);
    const candidate = answer + delta;
    if (candidate >= 0) set.add(candidate);
  }
  while (set.size < count) set.add(answer + set.size * 7 + 11);
  const choices = shuffle([...set]).slice(0, count);
  return { choices: choices.map(String), correctIndex: choices.indexOf(answer) };
}

let problemCounter = 0;
function nextId(lessonId: string) {
  problemCounter += 1;
  return `${lessonId}-${problemCounter}`;
}

// EMOJI sets for equal-groups visuals
const ITEM_EMOJIS = ["🍎", "🍪", "⭐", "🎈", "🌸", "🐠", "🐝", "🍇", "🍓", "🦋"];

// ---------------------------------------------------------------------------
// Generator functions — each returns one Problem
// ---------------------------------------------------------------------------

function genEqualGroups(lesson: Lesson, ctx?: GenContext): Problem {
  const [gMin, gMax] = rangeFor({ easy: [2, 4], normal: [2, 6], hard: [3, 8] }, ctx?.difficulty);
  const [pMin, pMax] = rangeFor({ easy: [2, 4], normal: [2, 6], hard: [3, 9] }, ctx?.difficulty);
  const groups = randInt(gMin, gMax);
  const perGroup = randInt(pMin, pMax);
  const total = groups * perGroup;
  const emoji = pick(ITEM_EMOJIS);
  const visual: ProblemVisual = { kind: "equal-groups", groups, perGroup, emoji };
  // sometimes ask for total, sometimes ask for a factor
  if (Math.random() < 0.7) {
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `There are ${groups} baskets with ${perGroup} ${emoji} in each. How many ${emoji} in all?`,
      visual,
      answerType: "number",
      answer: total,
      unit: emoji,
      hint: `Add ${perGroup} together ${groups} times, or multiply ${groups} × ${perGroup}.`,
      explanation: `${groups} groups of ${perGroup} = ${groups} × ${perGroup} = ${total}.`,
    };
  }
  // ask for number of groups given total & per group (intro to division)
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `${total} ${emoji} are shared into baskets of ${perGroup}. How many baskets are there?`,
    visual,
    answerType: "number",
    answer: groups,
    unit: "baskets",
    hint: `Think: ${perGroup} times what equals ${total}?`,
    explanation: `${total} ÷ ${perGroup} = ${groups} baskets.`,
  };
}

function genMultFacts(lesson: Lesson, ctx?: GenContext): Problem {
  const tables = (lesson.params?.tables as number[]) ?? [2, 5, 10];
  const a = pick(tables);
  const [bMin, bMax] = rangeFor({ easy: [1, 5], normal: [1, 10], hard: [4, 12] }, ctx?.difficulty);
  const b = randInt(bMin, bMax);
  const answer = a * b;
  const variant = pick(["direct", "direct", "mc", "missing-factor", "reverse"]);
  if (variant === "direct") {
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `What is ${a} × ${b}?`,
      answerType: "number",
      answer,
      hint: `Skip-count by ${a}: ${Array.from({ length: b }, (_, i) => a * (i + 1)).join(", ")}.`,
      explanation: `${a} × ${b} = ${answer}.`,
    };
  }
  if (variant === "mc") {
    const { choices, correctIndex } = numericChoices(answer);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `What is ${a} × ${b}?`,
      answerType: "multiple-choice",
      choices,
      correctIndex,
      hint: `Count by ${a}s up to ${b} jumps.`,
      explanation: `${a} × ${b} = ${answer}.`,
    };
  }
  if (variant === "missing-factor") {
    // "a × ? = answer" → learner finds b
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `${a} × ? = ${answer}. What is the missing number?`,
      answerType: "number",
      answer: b,
      hint: `Think: ${a} times WHAT equals ${answer}?`,
      explanation: `${a} × ${b} = ${answer}, so the missing number is ${b}.`,
    };
  }
  // reverse: give the product, ask which fact makes it
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `Which fact equals ${answer}?`,
    answerType: "multiple-choice",
    choices: [`${a} × ${b}`, `${a + 1} × ${b}`, `${a} × ${b + 1}`, `${a - 1} × ${b}`],
    correctIndex: 0,
    hint: `Find the pair that multiplies to ${answer}.`,
    explanation: `${a} × ${b} = ${answer}.`,
  };
}

function genMultProperties(lesson: Lesson, ctx?: GenContext): Problem {
  const type = pick(["commutative", "associative", "distributive", "zero-one"]);
  if (type === "commutative") {
    const a = randInt(2, 9);
    const b = randInt(2, 9);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `Fill in the missing number: ${a} × ${b} = ${b} × ?`,
      answerType: "number",
      answer: a,
      hint: "The commutative property says you can swap the order.",
      explanation: `Multiplication can be swapped: ${a} × ${b} = ${b} × ${a}.`,
    };
  }
  if (type === "associative") {
    const a = randInt(2, 4);
    const b = randInt(2, 4);
    const c = randInt(2, 4);
    const left = (a * b) * c;
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `(${a} × ${b}) × ${c} = ?`,
      answerType: "number",
      answer: left,
      hint: `First find ${a} × ${b}, then multiply by ${c}.`,
      explanation: `(${a} × ${b}) = ${a * b}, then ${a * b} × ${c} = ${left}.`,
    };
  }
  if (type === "distributive") {
    const a = randInt(4, 9);
    const split = randInt(2, 4);
    const b = split;
    const c = randInt(1, 3);
    const answer = a * (b + c);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `Use the distributive property: ${a} × (${b} + ${c}) = ?`,
      answerType: "number",
      answer,
      hint: `${a} × ${b} = ${a * b}, ${a} × ${c} = ${a * c}. Add them!`,
      explanation: `${a} × ${b} + ${a} × ${c} = ${a * b} + ${a * c} = ${answer}.`,
    };
  }
  // zero/one identity
  const a = randInt(3, 9);
  const mult = pick([0, 1]);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What is ${a} × ${mult}?`,
    answerType: "number",
    answer: a * mult,
    hint: mult === 0 ? "Anything times 0 is 0." : "Anything times 1 is itself.",
    explanation: `${a} × ${mult} = ${a * mult}.`,
  };
}

function genDivisionFacts(lesson: Lesson, ctx?: GenContext): Problem {
  const tables = (lesson.params?.tables as number[]) ?? [2, 5, 10];
  const divisor = pick(tables);
  const [qMin, qMax] = rangeFor({ easy: [1, 5], normal: [1, 10], hard: [4, 12] }, ctx?.difficulty);
  const quotient = randInt(qMin, qMax);
  const dividend = divisor * quotient;
  const variant = pick(["direct", "direct", "mc", "find-divisor", "word"]);
  if (variant === "direct") {
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `What is ${dividend} ÷ ${divisor}?`,
      answerType: "number",
      answer: quotient,
      hint: `Think: ${divisor} times WHAT equals ${dividend}?`,
      explanation: `${divisor} × ${quotient} = ${dividend}, so ${dividend} ÷ ${divisor} = ${quotient}.`,
    };
  }
  if (variant === "mc") {
    const { choices, correctIndex } = numericChoices(quotient);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `What is ${dividend} ÷ ${divisor}?`,
      answerType: "multiple-choice",
      choices,
      correctIndex,
      hint: `Ask: ${divisor} × ? = ${dividend}`,
      explanation: `${dividend} ÷ ${divisor} = ${quotient}.`,
    };
  }
  if (variant === "find-divisor") {
    // "? ÷ divisor = quotient" → find the dividend
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `? ÷ ${divisor} = ${quotient}. What is the missing number?`,
      answerType: "number",
      answer: dividend,
      hint: `Think: ${divisor} × ${quotient} = ?`,
      explanation: `${divisor} × ${quotient} = ${dividend}, so ${dividend} ÷ ${divisor} = ${quotient}.`,
    };
  }
  // word form
  const item = pick(["cookies", "stickers", "pencils", "marbles"]);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    story: `${dividend} ${item} are shared equally into ${divisor} bags.`,
    prompt: `How many ${item} are in each bag?`,
    answerType: "number",
    answer: quotient,
    unit: item,
    hint: `Divide: ${dividend} ÷ ${divisor}.`,
    explanation: `${dividend} ÷ ${divisor} = ${quotient} ${item} per bag.`,
  };
}

function genWordProblemsMD(lesson: Lesson, ctx?: GenContext): Problem {
  const templates = [
    () => {
      const boxes = randInt(3, 8);
      const each = randInt(3, 9);
      const item = pick(["pencils", "stickers", "cookies", "marbles", "cards"]);
      return {
        story: `Liam has ${boxes} boxes. Each box holds ${each} ${item}.`,
        prompt: `How many ${item} does Liam have in all?`,
        answer: boxes * each,
        unit: item,
        hint: "Groups of → multiply.",
        explanation: `${boxes} × ${each} = ${boxes * each} ${item}.`,
      };
    },
    () => {
      const total = (pick([2, 3, 4, 5, 6, 8, 9, 10])) * randInt(2, 9);
      const groups = pick([2, 3, 4, 5, 6, 8, 9, 10]);
      const item = pick(["stickers", "apples", "seashells", "crayons"]);
      const each = total / groups;
      return {
        story: `Mia has ${total} ${item} and shares them equally among ${groups} friends.`,
        prompt: `How many ${item} does each friend get?`,
        answer: each,
        unit: item,
        hint: "Share equally → divide.",
        explanation: `${total} ÷ ${groups} = ${each} ${item} each.`,
      };
    },
    () => {
      const rows = randInt(3, 7);
      const cols = randInt(3, 7);
      return {
        story: `A garden has ${rows} rows of sunflowers with ${cols} sunflowers in each row.`,
        prompt: `How many sunflowers are there?`,
        answer: rows * cols,
        unit: "sunflowers",
        hint: "Rows × columns.",
        explanation: `${rows} × ${cols} = ${rows * cols} sunflowers.`,
      };
    },
  ];
  const t = pick(templates)();
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    story: t.story,
    prompt: t.prompt,
    answerType: "number",
    answer: t.answer,
    unit: t.unit,
    hint: t.hint,
    explanation: t.explanation,
  };
}

function genTwoStep(lesson: Lesson, ctx?: GenContext): Problem {
  const type = pick(["mult-sub", "mult-add", "add-mult", "div-add"]);
  if (type === "mult-sub") {
    const packs = randInt(3, 6);
    const each = randInt(4, 8);
    const give = randInt(3, packs * each - 2);
    const total = packs * each;
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      story: `Zoe buys ${packs} packs of ${each} stickers. She gives ${give} stickers to a friend.`,
      prompt: `How many stickers does Zoe have left?`,
      answerType: "number",
      answer: total - give,
      unit: "stickers",
      hint: `First find the total: ${packs} × ${each}. Then subtract ${give}.`,
      explanation: `${packs} × ${each} = ${total}, then ${total} − ${give} = ${total - give}.`,
    };
  }
  if (type === "mult-add") {
    const packs = randInt(3, 6);
    const each = randInt(3, 7);
    const extra = randInt(2, 8);
    const total = packs * each + extra;
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      story: `A store has ${packs} shelves with ${each} toy cars each. They get ${extra} more cars today.`,
      prompt: `How many toy cars are there now?`,
      answerType: "number",
      answer: total,
      unit: "cars",
      hint: `First ${packs} × ${each}, then add ${extra}.`,
      explanation: `${packs} × ${each} = ${packs * each}, plus ${extra} = ${total}.`,
    };
  }
  if (type === "div-add") {
    const total = pick([12, 16, 18, 20, 24]);
    const groups = pick([2, 3, 4, 6]);
    const each = total / groups;
    const extra = randInt(2, 6);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      story: `Sam shares ${total} candies equally among ${groups} bags, then puts in ${extra} more candies in each bag.`,
      prompt: `How many candies are in each bag now?`,
      answerType: "number",
      answer: each + extra,
      unit: "candies",
      hint: `First ${total} ÷ ${groups}, then add ${extra}.`,
      explanation: `${total} ÷ ${groups} = ${each}, plus ${extra} = ${each + extra}.`,
    };
  }
  // add-mult
  const a = randInt(15, 40);
  const b = randInt(10, 30);
  const times = randInt(2, 5);
  const sum = a + b;
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    story: `A bakery made ${a} muffins in the morning and ${b} in the afternoon. They sell them in boxes of ${times}.`,
    prompt: `How many boxes can they fill?`,
    answerType: "number",
    answer: Math.floor(sum / times),
    unit: "boxes",
    hint: `First add ${a} + ${b}, then divide by ${times}.`,
    explanation: `${a} + ${b} = ${sum}, then ${sum} ÷ ${times} = ${Math.floor(sum / times)} boxes (remainder left over).`,
  };
}

function genPlaceValue(lesson: Lesson, ctx?: GenContext): Problem {
  const type = pick(["identify", "value", "expanded", "which-digit"]);
  const thousands = randInt(1, 9);
  const hundreds = randInt(0, 9);
  const tens = randInt(0, 9);
  const ones = randInt(0, 9);
  const number = thousands * 1000 + hundreds * 100 + tens * 10 + ones;
  if (type === "identify") {
    const places = [
      { name: "ones", digit: ones },
      { name: "tens", digit: tens },
      { name: "hundreds", digit: hundreds },
      { name: "thousands", digit: thousands },
    ];
    const chosen = pick(places);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `In the number ${number.toLocaleString()}, what digit is in the ${chosen.name} place?`,
      answerType: "number",
      answer: chosen.digit,
      hint: `Count from the right: ones, tens, hundreds, thousands.`,
      explanation: `In ${number.toLocaleString()}, the ${chosen.name} place is ${chosen.digit}.`,
    };
  }
  if (type === "value") {
    const options = [
      { name: "thousands", value: thousands * 1000 },
      { name: "hundreds", value: hundreds * 100 },
      { name: "tens", value: tens * 10 },
      { name: "ones", value: ones },
    ];
    const chosen = pick(options.filter((o) => o.value > 0));
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `What is the value of the ${chosen.name} digit in ${number.toLocaleString()}?`,
      answerType: "number",
      answer: chosen.value,
      hint: `Multiply the digit by its place value (1, 10, 100, or 1000).`,
      explanation: `The ${chosen.name} digit means ${chosen.value}.`,
    };
  }
  if (type === "expanded") {
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `Write ${number.toLocaleString()} as just the hundreds digit times 100 (enter the value of the hundreds place).`,
      answerType: "number",
      answer: hundreds * 100,
      hint: `The hundreds digit is ${hundreds}, so it's worth ${hundreds} × 100.`,
      explanation: `The hundreds digit ${hundreds} = ${hundreds * 100}.`,
    };
  }
  // which-digit
  const target = pick([thousands, hundreds, tens, ones]);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `In ${number.toLocaleString()}, which digit is in the tens place?`,
    answerType: "number",
    answer: tens,
    hint: `Tens is the second digit from the right.`,
    explanation: `The tens digit of ${number.toLocaleString()} is ${tens}.`,
  };
}

function genRounding(lesson: Lesson, ctx?: GenContext): Problem {
  const toNearest = pick([10, 100]);
  let number: number;
  if (toNearest === 10) {
    number = randInt(11, 999);
    const rounded = Math.round(number / 10) * 10;
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `Round ${number} to the nearest 10.`,
      answerType: "number",
      answer: rounded,
      hint: `Look at the ones digit. 5 or more, round up; 4 or less, round down.`,
      explanation: `The ones digit is ${number % 10}. ${number % 10 >= 5 ? "That's 5+, so round up" : "That's 4 or less, so round down"} to ${rounded}.`,
    };
  }
  number = randInt(101, 9999);
  const rounded = Math.round(number / 100) * 100;
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `Round ${number.toLocaleString()} to the nearest 100.`,
    answerType: "number",
    answer: rounded,
    hint: `Look at the TENS digit. 5 or more rounds the hundreds up.`,
    explanation: `The tens digit is ${Math.floor(number / 10) % 10}. ${Math.floor(number / 10) % 10 >= 5 ? "5+, round up" : "4 or less, round down"} → ${rounded.toLocaleString()}.`,
  };
}

function genAddition1000(lesson: Lesson, ctx?: GenContext): Problem {
  const [aMin, aMax] = rangeFor({ easy: [50, 300], normal: [120, 600], hard: [300, 900] }, ctx?.difficulty);
  const [bMin, bMax] = rangeFor({ easy: [50, 300], normal: [120, 600], hard: [300, 900] }, ctx?.difficulty);
  const a = randInt(aMin, aMax);
  const b = randInt(bMin, bMax);
  const sum = a + b;
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What is ${a} + ${b}?`,
    answerType: "number",
    answer: sum,
    hint: `Line up the places. Add ones, then tens, then hundreds. Carry if needed!`,
    explanation: `${a} + ${b} = ${sum}.`,
  };
}

function genSubtraction1000(lesson: Lesson, ctx?: GenContext): Problem {
  const [aMin, aMax] = rangeFor({ easy: [100, 500], normal: [300, 980], hard: [500, 9999] }, ctx?.difficulty);
  const a = randInt(aMin, aMax);
  const b = randInt(Math.max(50, Math.floor(a * 0.2)), a - 20);
  const diff = a - b;
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What is ${a} − ${b}?`,
    answerType: "number",
    answer: diff,
    hint: `Line up the places. Borrow from the next column if the top digit is smaller.`,
    explanation: `${a} − ${b} = ${diff}.`,
  };
}

function genMultTens(lesson: Lesson, ctx?: GenContext): Problem {
  const multiple = pick([10, 20, 30, 40, 50, 60, 70, 80, 90]);
  const [oMin, oMax] = rangeFor({ easy: [2, 6], normal: [2, 9], hard: [4, 12] }, ctx?.difficulty);
  const other = randInt(oMin, oMax);
  const answer = multiple * other;
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What is ${multiple} × ${other}?`,
    answerType: "number",
    answer,
    hint: `Multiply ${multiple / 10} × ${other} = ${(multiple / 10) * other}, then add a zero.`,
    explanation: `${multiple / 10} × ${other} = ${(multiple / 10) * other}, add the zero → ${answer}.`,
  };
}

function genFracConcept(lesson: Lesson, ctx?: GenContext): Problem {
  const denominator = pick([2, 3, 4, 6, 8]);
  const numerator = randInt(1, denominator - 1);
  const visual: ProblemVisual = { kind: "fraction-pie", numerator, denominator, fillStyle: "solid" };
  if (Math.random() < 0.6) {
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `What fraction of the shape is shaded?`,
      visual,
      answerType: "fraction",
      numerator,
      denominator,
      hint: `Bottom = total equal parts. Top = shaded parts.`,
      explanation: `${numerator} out of ${denominator} equal parts are shaded → ${numerator}/${denominator}.`,
    };
  }
  // ask numerator given denominator
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `The shape is cut into ${denominator} equal parts. How many parts are shaded? (enter the top number of the fraction)`,
    visual,
    answerType: "number",
    answer: numerator,
    hint: `Count the shaded slices.`,
    explanation: `${numerator} parts are shaded.`,
  };
}

function genFracNumberline(lesson: Lesson, ctx?: GenContext): Problem {
  const denominator = pick([2, 3, 4, 6]);
  const numerator = randInt(1, denominator - 1);
  const visual: ProblemVisual = {
    kind: "number-line",
    start: 0,
    end: 1,
    numerator,
    denominator,
    ticks: denominator,
  };
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `Which fraction is shown by the dot on the number line?`,
    visual,
    answerType: "fraction",
    numerator,
    denominator,
    hint: `Count how many equal parts the line is split into, then which mark the dot is on.`,
    explanation: `The line is split into ${denominator} parts. The dot is on mark ${numerator}, so it's ${numerator}/${denominator}.`,
  };
}

function genFracEquivalent(lesson: Lesson, ctx?: GenContext): Problem {
  const baseDen = pick([2, 3, 4]);
  const baseNum = randInt(1, baseDen - 1);
  const factor = randInt(2, 4);
  const newDen = baseDen * factor;
  const newNum = baseNum * factor;
  // ask for the missing numerator: baseNum/baseDen = ?/newDen
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `Fill in the missing number to make the fractions equal: ${baseNum}/${baseDen} = ?/${newDen}`,
    answerType: "number",
    answer: newNum,
    hint: `What did we multiply the bottom by? ${baseDen} × ${factor} = ${newDen}. Do the same to the top.`,
    explanation: `${baseDen} × ${factor} = ${newDen}, so ${baseNum} × ${factor} = ${newNum}. ${baseNum}/${baseDen} = ${newNum}/${newDen}.`,
  };
}

function genFracCompare(lesson: Lesson, ctx?: GenContext): Problem {
  const type = pick(["same-den", "same-num"]);
  if (type === "same-den") {
    const den = pick([4, 5, 6, 8]);
    const nums = shuffle([randInt(1, den - 1), randInt(1, den - 1)]);
    if (nums[0] === nums[1]) nums[0] = nums[0] === 1 ? 2 : 1;
    const bigger = nums[0] > nums[1] ? 0 : 1;
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `Which is bigger: ${nums[0]}/${den} or ${nums[1]}/${den}?`,
      answerType: "multiple-choice",
      choices: [`${nums[0]}/${den}`, `${nums[1]}/${den}`, "They are equal"],
      correctIndex: bigger,
      hint: "Same bottom number? The bigger top number is the bigger fraction.",
      explanation: `Both have denominator ${den}, so ${nums[bigger]}/${den} is bigger.`,
    };
  }
  const num = randInt(1, 4);
  const dens = shuffle([pick([3, 4, 5]), pick([6, 8, 10])]);
  const bigger = dens[0] < dens[1] ? 0 : 1;
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `Which is bigger: ${num}/${dens[0]} or ${num}/${dens[1]}?`,
    answerType: "multiple-choice",
    choices: [`${num}/${dens[0]}`, `${num}/${dens[1]}`, "They are equal"],
    correctIndex: bigger,
    hint: "Same top number? Smaller bottom number = BIGGER pieces.",
    explanation: `Same numerator (${num}); ${dens[bigger]} makes bigger pieces, so ${num}/${dens[bigger]} is bigger.`,
  };
}

function genFracWhole(lesson: Lesson, ctx?: GenContext): Problem {
  const den = pick([2, 3, 4, 5, 6, 8]);
  const wholes = randInt(1, 4);
  const num = den * wholes;
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What whole number is ${num}/${den} equal to?`,
    answerType: "number",
    answer: wholes,
    hint: `Divide the top by the bottom: ${num} ÷ ${den}.`,
    explanation: `${num} ÷ ${den} = ${wholes}, so ${num}/${den} = ${wholes}.`,
  };
}

function genTimeRead(lesson: Lesson, ctx?: GenContext): Problem {
  const hour = randInt(1, 12);
  const minute = pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
  const visual: ProblemVisual = { kind: "clock", hour, minute };
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What time is shown on the clock? (Enter as H:MM, like 3:45)`,
    visual,
    answerType: "time",
    hour,
    minute,
    mode: "read",
    hint: `Short hand = hour. Long hand = minutes (count by 5s).`,
    explanation: `Hour hand past ${hour}, minute hand at ${minute} → ${hour}:${String(minute).padStart(2, "0")}.`,
  };
}

function genElapsedTime(lesson: Lesson, ctx?: GenContext): Problem {
  const startH = randInt(1, 11);
  const startM = pick([0, 15, 30, 45]);
  const durH = randInt(1, 2);
  const durM = pick([0, 15, 30, 45]);
  let totalMin = startH * 60 + startM + durH * 60 + durM;
  totalMin = totalMin % (12 * 60);
  const endH = Math.floor(totalMin / 60) || 12;
  const endM = totalMin % 60;
  const fmt = (h: number, m: number) => `${h}:${String(m).padStart(2, "0")}`;
  // ask for total minutes
  const totalElapsed = durH * 60 + durM;
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    story: `An activity starts at ${fmt(startH, startM)} and ends at ${fmt(endH, endM)}.`,
    prompt: `How many minutes long is the activity?`,
    answerType: "number",
    answer: totalElapsed,
    unit: "minutes",
    hint: `Count the hours and minutes in between. ${durH} hour = ${durH * 60} minutes.`,
    explanation: `From ${fmt(startH, startM)} to ${fmt(endH, endM)} is ${durH} hour ${durM} min = ${totalElapsed} minutes.`,
  };
}

function genMassVolume(lesson: Lesson, ctx?: GenContext): Problem {
  const type = pick(["kg-g", "l-ml", "word-mass", "word-vol"]);
  if (type === "kg-g") {
    const kg = randInt(1, 9);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `How many grams are in ${kg} kg?`,
      answerType: "number",
      answer: kg * 1000,
      unit: "g",
      hint: `1 kg = 1,000 g.`,
      explanation: `${kg} × 1,000 = ${kg * 1000} g.`,
    };
  }
  if (type === "l-ml") {
    const l = randInt(1, 9);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `How many milliliters are in ${l} L?`,
      answerType: "number",
      answer: l * 1000,
      unit: "mL",
      hint: `1 L = 1,000 mL.`,
      explanation: `${l} × 1,000 = ${l * 1000} mL.`,
    };
  }
  if (type === "word-mass") {
    const each = pick([100, 150, 200, 250]);
    const count = randInt(3, 6);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      story: `Each apple weighs ${each} grams. A bag has ${count} apples.`,
      prompt: `What is the total mass in grams?`,
      answerType: "number",
      answer: each * count,
      unit: "g",
      hint: `Multiply ${each} × ${count}.`,
      explanation: `${each} × ${count} = ${each * count} g.`,
    };
  }
  const each = pick([100, 150, 200, 250]);
  const count = randInt(3, 6);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    story: `Each cup holds ${each} mL. Sam pours ${count} cups into a pitcher.`,
    prompt: `How many milliliters are in the pitcher?`,
    answerType: "number",
    answer: each * count,
    unit: "mL",
    hint: `Multiply ${each} × ${count}.`,
    explanation: `${each} × ${count} = ${each * count} mL.`,
  };
}

function genGraphs(lesson: Lesson, ctx?: GenContext): Problem {
  const type = pick(["picture-count", "picture-compare", "bar-read"]);
  const categories = pick([
    ["Dogs", "Cats", "Fish", "Birds"],
    ["Pizza", "Tacos", "Burgers", "Salad"],
    ["Red", "Blue", "Green", "Yellow"],
  ]);
  const values = categories.map(() => randInt(1, 6));
  const per = pick([1, 2]);
  if (type === "picture-count") {
    const idx = randInt(0, categories.length - 1);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      story: `A picture graph shows favorite ${categories.map((c) => c.toLowerCase()).join(", ")}. The key says each symbol = ${per}. ${categories[idx]} has ${values[idx]} symbols.`,
      prompt: `How many votes did ${categories[idx]} get?`,
      answerType: "number",
      answer: values[idx] * per,
      hint: `Multiply the number of symbols by what each symbol is worth.`,
      explanation: `${values[idx]} symbols × ${per} = ${values[idx] * per} votes for ${categories[idx]}.`,
    };
  }
  if (type === "picture-compare") {
    const [i, j] = [randInt(0, categories.length - 1), randInt(0, categories.length - 1)];
    const moreIdx = values[i] > values[j] ? i : j;
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      story: `Picture graph key: each symbol = ${per}. ${categories[i]} = ${values[i]} symbols, ${categories[j]} = ${values[j]} symbols.`,
      prompt: `Which got MORE votes: ${categories[i]} or ${categories[j]}?`,
      answerType: "multiple-choice",
      choices: [categories[i], categories[j], "Tie"],
      correctIndex: values[i] === values[j] ? 2 : moreIdx,
      hint: `More symbols = more votes.`,
      explanation: `${categories[moreIdx]} has ${values[moreIdx]} symbols (${values[moreIdx] * per} votes), which is more.`,
    };
  }
  // bar-read
  const idx = randInt(0, categories.length - 1);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    story: `A bar graph shows: ${categories.map((c, i) => `${c}=${values[i] * per}`).join(", ")}.`,
    prompt: `How many votes did ${categories[idx]} get?`,
    answerType: "number",
    answer: values[idx] * per,
    hint: `Look at the height of the ${categories[idx]} bar.`,
    explanation: `The ${categories[idx]} bar reaches ${values[idx] * per}.`,
  };
}

function genLinePlots(lesson: Lesson, ctx?: GenContext): Problem {
  const lengths = Array.from({ length: 8 }, () => pick([3, 3.5, 4, 4.5, 5, 5.5]));
  const target = pick([3, 3.5, 4, 4.5, 5, 5.5]);
  const count = lengths.filter((l) => l === target).length;
  const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : `${n}`);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    story: `8 pencils were measured to the nearest half-inch: ${lengths.map(fmt).map((l) => `${l}"`).join(", ")}.`,
    prompt: `How many pencils are ${fmt(target)} inches long?`,
    answerType: "number",
    answer: count,
    unit: "pencils",
    hint: `Count only the pencils that measure ${fmt(target)} inches.`,
    explanation: `Counting the ${fmt(target)}-inch pencils: there are ${count}.`,
  };
}

function genAreaCount(lesson: Lesson, ctx?: GenContext): Problem {
  const rows = randInt(2, 6);
  const cols = randInt(2, 6);
  const visual: ProblemVisual = { kind: "area-grid", rows, cols, shaded: true };
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `Count the square units inside the shape. What is its area?`,
    visual,
    answerType: "number",
    answer: rows * cols,
    unit: "square units",
    hint: `There are ${rows} rows and ${cols} columns. Count them or multiply!`,
    explanation: `${rows} rows × ${cols} columns = ${rows * cols} square units.`,
  };
}

function genAreaMult(lesson: Lesson, ctx?: GenContext): Problem {
  const length = randInt(3, 12);
  const width = randInt(2, 9);
  const unit = pick(["cm", "in", "m", "units"]);
  const visual: ProblemVisual = { kind: "area-grid", rows: width, cols: length, shaded: true };
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `A rectangle is ${length} ${unit} long and ${width} ${unit} wide. What is its area?`,
    visual,
    answerType: "number",
    answer: length * width,
    unit: `square ${unit}`,
    hint: `Area = length × width.`,
    explanation: `${length} × ${width} = ${length * width} square ${unit}.`,
  };
}

function genPerimeter(lesson: Lesson, ctx?: GenContext): Problem {
  const length = randInt(3, 12);
  const width = randInt(2, 9);
  const unit = pick(["cm", "in", "m", "units"]);
  const visual: ProblemVisual = { kind: "perimeter", width, height: length, unit };
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `A rectangle is ${length} ${unit} long and ${width} ${unit} wide. What is its perimeter?`,
    visual,
    answerType: "number",
    answer: 2 * (length + width),
    unit,
    hint: `Perimeter = all sides added: ${length} + ${width} + ${length} + ${width}.`,
    explanation: `${length} + ${width} + ${length} + ${width} = ${2 * (length + width)} ${unit}.`,
  };
}

function genShapeCategories(lesson: Lesson, ctx?: GenContext): Problem {
  const shapes: Record<string, number> = {
    triangle: 3,
    quadrilateral: 4,
    pentagon: 5,
    hexagon: 6,
  };
  const [shape, sides] = pick(Object.entries(shapes)) as [ShapeKind, number];
  const visual: ProblemVisual = { kind: "shape", shape };
  if (Math.random() < 0.5) {
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `How many sides does this shape have?`,
      visual,
      answerType: "number",
      answer: sides,
      hint: `Count the straight edges.`,
      explanation: `A ${shape} has ${sides} sides.`,
    };
  }
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What kind of shape is this?`,
    visual,
    answerType: "multiple-choice",
    choices: ["Triangle (3)", "Quadrilateral (4)", "Pentagon (5)", "Hexagon (6)"],
    correctIndex: ["triangle", "quadrilateral", "pentagon", "hexagon"].indexOf(shape),
    hint: `Count the sides, then match.`,
    explanation: `${sides} sides = ${shape}.`,
  };
}

function genQuadrilaterals(lesson: Lesson, ctx?: GenContext): Problem {
  const defs = [
    { shape: "square" as ShapeKind, desc: "4 equal sides and 4 right angles", answer: "Square" },
    { shape: "rectangle" as ShapeKind, desc: "4 sides with 4 right angles (not all sides equal)", answer: "Rectangle" },
    { shape: "rhombus" as ShapeKind, desc: "4 equal sides (angles are not right angles)", answer: "Rhombus" },
    { shape: "parallelogram" as ShapeKind, desc: "2 pairs of parallel sides (no right angles, sides not all equal)", answer: "Parallelogram" },
    { shape: "trapezoid" as ShapeKind, desc: "exactly 1 pair of parallel sides", answer: "Trapezoid" },
  ];
  const d = pick(defs);
  const visual: ProblemVisual = { kind: "shape", shape: d.shape };
  const pool = ["Square", "Rectangle", "Rhombus", "Trapezoid", "Parallelogram"];
  const wrong = shuffle(pool.filter((p) => p !== d.answer)).slice(0, 3);
  const choices = shuffle([d.answer, ...wrong]);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `A shape has ${d.desc}. What is the best name for it?`,
    visual,
    answerType: "multiple-choice",
    choices,
    correctIndex: choices.indexOf(d.answer),
    hint: `Think about sides AND angles.`,
    explanation: `${d.desc} → that's a ${d.answer}.`,
  };
}

function genPartitionShapes(lesson: Lesson, ctx?: GenContext): Problem {
  const parts = pick([2, 3, 4, 6, 8]);
  const shaded = randInt(1, parts - 1);
  const visual: ProblemVisual = { kind: "fraction-pie", numerator: shaded, denominator: parts, fillStyle: "solid" };
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `A shape is cut into ${parts} equal parts and ${shaded} are shaded. What fraction is shaded?`,
    visual,
    answerType: "fraction",
    numerator: shaded,
    denominator: parts,
    hint: `Top = shaded parts, bottom = total equal parts.`,
    explanation: `${shaded} of ${parts} equal parts = ${shaded}/${parts}.`,
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

const GENERATORS: Record<string, (lesson: Lesson, ctx?: GenContext) => Problem> = {
  "equal-groups": genEqualGroups,
  "mult-facts": genMultFacts,
  "mult-properties": genMultProperties,
  "division-facts": genDivisionFacts,
  "word-problems-md": genWordProblemsMD,
  "two-step": genTwoStep,
  "place-value": genPlaceValue,
  rounding: genRounding,
  "addition-1000": genAddition1000,
  "subtraction-1000": genSubtraction1000,
  "mult-tens": genMultTens,
  "frac-concept": genFracConcept,
  "frac-numberline": genFracNumberline,
  "frac-equivalent": genFracEquivalent,
  "frac-compare": genFracCompare,
  "frac-whole": genFracWhole,
  "time-read": genTimeRead,
  "elapsed-time": genElapsedTime,
  "mass-volume": genMassVolume,
  graphs: genGraphs,
  "line-plots": genLinePlots,
  "area-count": genAreaCount,
  "area-mult": genAreaMult,
  perimeter: genPerimeter,
  "shape-categories": genShapeCategories,
  quadrilaterals: genQuadrilaterals,
  "partition-shapes": genPartitionShapes,
};

export function generateProblems(
  lesson: Lesson,
  count: number,
  ctx?: GenContext
): Problem[] {
  // Preschool lessons (id starts with "ps-") use their own generator factory.
  if (lesson.id.startsWith("ps-")) {
    return generatePreschoolProblems(lesson, count, ctx);
  }
  // 1st grade lessons
  if (lesson.id.startsWith("g1-")) {
    return generateGrade1Problems(lesson, count, ctx);
  }
  // 2nd grade lessons
  if (lesson.id.startsWith("g2-")) {
    return generateGrade2Problems(lesson, count, ctx);
  }
  // 4th grade lessons
  if (lesson.id.startsWith("g4-")) {
    return generateGrade4Problems(lesson, count, ctx);
  }
  const gen = GENERATORS[lesson.generator];
  if (!gen) {
    throw new Error(`No generator registered for lesson "${lesson.id}" (generator: ${lesson.generator})`);
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

// Check whether a learner's answer is correct for a problem
export function checkAnswer(problem: Problem, answer: unknown): boolean {
  switch (problem.answerType) {
    case "number": {
      const n = Number(answer);
      return Number.isFinite(n) && Math.abs(n - problem.answer) < 1e-9;
    }
    case "multiple-choice":
      return Number(answer) === problem.correctIndex;
    case "true-false":
      return Boolean(answer) === problem.isTrue;
    case "fraction": {
      if (typeof answer !== "object" || answer === null) return false;
      const { numerator, denominator } = answer as { numerator: number; denominator: number };
      return numerator === problem.numerator && denominator === problem.denominator;
    }
    case "shape-classify":
      return String(answer) === problem.correctCategory;
    case "time": {
      // accept "H:MM" or matching hour/minute object
      if (typeof answer === "string") {
        const m = answer.trim().match(/^(\d{1,2})[:](\d{2})$/);
        if (!m) return false;
        const h = Number(m[1]);
        const min = Number(m[2]);
        return h === problem.hour && min === problem.minute;
      }
      if (typeof answer === "object" && answer !== null) {
        const { hour, minute } = answer as { hour: number; minute: number };
        return hour === problem.hour && minute === problem.minute;
      }
      return false;
    }
    case "numberline": {
      // answer is the chosen tick index (1-based from start)
      const n = Number(answer);
      return Number.isFinite(n) && n === problem.numerator;
    }
    default:
      return false;
  }
}
