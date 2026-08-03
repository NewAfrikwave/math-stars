import type { Problem, ProblemVisual, ShapeKind, Lesson, GenContext } from "@/lib/types";

// ---------------------------------------------------------------------------
// 2nd grade problem generators. Reuse the same Problem shape and answer types
// as the rest of the app so QuizRunner and AnswerInput work unchanged.
// Visuals use the existing renderer kinds (number-blocks, clock, fraction-pie,
// array, area-grid, shape, compare-rows).
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

let g2Counter = 0;
function nextId(lesson: string) {
  g2Counter += 1;
  return `${lesson}-${g2Counter}`;
}

const CUTE_EMOJIS = ["🍎", "⭐", "🍪", "🌸", "🐠", "🐝", "🍇", "🍓", "🦋", "🦊", "🐸", "🎈"];

// Build a multiple-choice option set with 3 distractors from a numeric pool.
function numChoices(correct: number, pool: number[], count = 4): { choices: string[]; correctIndex: number } {
  const wrong = shuffle(pool.filter((p) => p !== correct)).slice(0, count - 1);
  const choices = shuffle([correct, ...wrong]).map(String);
  return { choices, correctIndex: choices.indexOf(String(correct)) };
}

// Build a string-choice set with distractors from a pool.
function strChoices(correct: string, pool: string[], count = 4): { choices: string[]; correctIndex: number } {
  const wrong = shuffle(pool.filter((p) => p !== correct)).slice(0, count - 1);
  const choices = shuffle([correct, ...wrong]);
  return { choices, correctIndex: choices.indexOf(correct) };
}

function difficultyRange(ctx: GenContext | undefined, easy: [number, number], normal: [number, number], challenge: [number, number]): [number, number] {
  const d = ctx?.difficulty;
  if (d === "easy") return easy;
  if (d === "challenge") return challenge;
  return normal;
}

// ---------------------------------------------------------------------------
// g2-add-20: addition within 20
// ---------------------------------------------------------------------------
function genG2Add20(lesson: Lesson, ctx?: GenContext): Problem {
  const [lo, hi] = difficultyRange(ctx, [1, 10], [2, 20], [5, 20]);
  const useMc = Math.random() < 0.3;
  const a = randInt(lo, hi - 1);
  const b = randInt(1, Math.min(hi - a, hi));
  const sum = a + b;
  if (useMc) {
    const { choices, correctIndex } = numChoices(sum, [sum - 1, sum + 1, sum + 2, sum - 2, 20, 10]);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `What is ${a} + ${b}?`,
      answerType: "multiple-choice",
      choices,
      correctIndex,
      hint: `Start at ${a} and count up ${b} more.`,
      explanation: `${a} + ${b} = ${sum}.`,
    };
  }
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What is ${a} + ${b}?`,
    answerType: "number",
    answer: sum,
    hint: `Make a 10 if you can: ${a} + ${b}.`,
    explanation: `${a} + ${b} = ${sum}.`,
  };
}

// ---------------------------------------------------------------------------
// g2-sub-20: subtraction within 20
// ---------------------------------------------------------------------------
function genG2Sub20(lesson: Lesson, ctx?: GenContext): Problem {
  const [lo, hi] = difficultyRange(ctx, [3, 10], [5, 20], [10, 20]);
  const a = randInt(lo, hi);
  const b = randInt(1, a - 1);
  const diff = a - b;
  const useMc = Math.random() < 0.3;
  if (useMc) {
    const { choices, correctIndex } = numChoices(diff, [diff - 1, diff + 1, diff + 2, diff - 2, 0, 10]);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `What is ${a} − ${b}?`,
      answerType: "multiple-choice",
      choices,
      correctIndex,
      hint: `Think: ${b} plus what makes ${a}?`,
      explanation: `${a} − ${b} = ${diff}.`,
    };
  }
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What is ${a} − ${b}?`,
    answerType: "number",
    answer: diff,
    hint: `Count up from ${b} to ${a}.`,
    explanation: `${a} − ${b} = ${diff}.`,
  };
}

// ---------------------------------------------------------------------------
// g2-add-2digit: add two 2-digit numbers (with and without regrouping)
// ---------------------------------------------------------------------------
function genG2Add2Digit(lesson: Lesson, ctx?: GenContext): Problem {
  const regroup = Math.random() < 0.5;
  let a: number, b: number;
  if (regroup) {
    // ones sum >= 10
    const aOnes = randInt(3, 9);
    const bOnes = randInt(10 - aOnes, 9);
    a = randInt(1, 7) * 10 + aOnes;
    b = randInt(1, 9) * 10 + bOnes;
  } else {
    // ones sum < 10
    const aOnes = randInt(0, 4);
    const bOnes = randInt(0, 9 - aOnes - 1);
    a = randInt(1, 7) * 10 + aOnes;
    b = randInt(1, 9) * 10 + bOnes;
  }
  if (ctx?.difficulty === "easy") {
    // keep it small for easy mode
    a = Math.min(a, 40);
    b = Math.min(b, 30);
  }
  const sum = a + b;
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What is ${a} + ${b}?`,
    answerType: "number",
    answer: sum,
    hint: regroup
      ? `Add the ones first. If they make 10 or more, carry 1 to the tens.`
      : `Add the ones, then add the tens. No carrying needed.`,
    explanation: `${a} + ${b} = ${sum}.${regroup ? ` (The ones made 10+, so we regrouped.)` : ``}`,
  };
}

// ---------------------------------------------------------------------------
// g2-sub-2digit: subtract two 2-digit numbers (with and without borrowing)
// ---------------------------------------------------------------------------
function genG2Sub2Digit(lesson: Lesson, ctx?: GenContext): Problem {
  const borrow = Math.random() < 0.5;
  let a: number, b: number;
  if (borrow) {
    // top ones smaller than bottom ones
    const aOnes = randInt(0, 4);
    const bOnes = randInt(aOnes + 1, 9);
    const aTens = randInt(2, 8);
    const bTens = randInt(1, aTens - 1);
    a = aTens * 10 + aOnes;
    b = bTens * 10 + bOnes;
  } else {
    // top ones >= bottom ones
    const aOnes = randInt(3, 9);
    const bOnes = randInt(0, aOnes);
    const aTens = randInt(2, 8);
    const bTens = randInt(1, aTens);
    a = aTens * 10 + aOnes;
    b = bTens * 10 + bOnes;
  }
  if (ctx?.difficulty === "easy") {
    a = Math.min(a, 50);
    b = Math.min(b, 30);
  }
  const diff = a - b;
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What is ${a} − ${b}?`,
    answerType: "number",
    answer: diff,
    hint: borrow
      ? `Subtract the ones. If the top is too small, borrow 1 ten (10 ones) from the tens.`
      : `Subtract the ones, then the tens. No borrowing needed.`,
    explanation: `${a} − ${b} = ${diff}.${borrow ? ` (We borrowed 1 ten.)` : ``}`,
  };
}

// ---------------------------------------------------------------------------
// g2-word-add-sub: word problems within 100
// ---------------------------------------------------------------------------
function genG2WordAddSub(lesson: Lesson, ctx?: GenContext): Problem {
  const stories = [
    {
      op: "+" as const,
      who: pick(["Mia", "Tom", "Ava", "Leo", "Zoe", "Sam", "Nora"]),
      thing: pick(["stickers", "marbles", "cards", "crayons", "blocks"]),
      a: () => randInt(15, 49),
      b: () => randInt(15, 49),
      ask: "in all",
    },
    {
      op: "−" as const,
      who: pick(["Ben", "Ella", "Kai", "Ruby", "Max", "Lily"]),
      thing: pick(["stickers", "marbles", "cards", "crayons", "blocks"]),
      a: () => randInt(40, 90),
      b: () => randInt(10, 35),
      ask: "left",
    },
    {
      op: "−" as const,
      who: pick(["Jake", "Pia", "Cole", "Tess"]),
      thing: pick(["pencils", "books", "apples"]),
      a: () => randInt(30, 80),
      b: () => randInt(10, 29),
      ask: "more",
    },
  ];
  const s = pick(stories);
  const a = s.a();
  const b = s.b();
  const answer = s.op === "+" ? a + b : s.ask === "more" ? a - b : a - b;
  const prompt =
    s.op === "+"
      ? `${s.who} has ${a} ${s.thing} and gets ${b} more. How many does ${s.who} have in all?`
      : s.ask === "left"
      ? `${s.who} has ${a} ${s.thing}. ${s.who} gives away ${b}. How many are left?`
      : `${s.who} has ${a} ${s.thing}. A friend has ${b}. How many more does ${s.who} have?`;
  void ctx;
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    story: prompt,
    prompt: s.ask === "more" ? `How many MORE does ${s.who} have?` : `How many ${s.thing}?`,
    answerType: "number",
    answer,
    hint: s.op === "+" ? `'In all' means ADD: ${a} + ${b}.` : `'${s.ask === "left" ? "Left" : "More"}' means SUBTRACT: ${a} − ${b}.`,
    explanation: `${a} ${s.op} ${b} = ${answer}.`,
  };
}

// ---------------------------------------------------------------------------
// g2-mental-10: mentally add/subtract 10 from a 2-digit number
// ---------------------------------------------------------------------------
function genG2Mental10(lesson: Lesson, ctx?: GenContext): Problem {
  const [lo, hi] = difficultyRange(ctx, [11, 50], [12, 90], [15, 99]);
  const add = Math.random() < 0.5;
  const n = randInt(lo, hi);
  const useMc = Math.random() < 0.4;
  if (add) {
    const answer = n + 10;
    if (useMc) {
      const { choices, correctIndex } = numChoices(answer, [answer - 10, answer + 10, answer - 1, answer + 1, n]);
      return {
        id: nextId(lesson.id),
        lessonId: lesson.id,
        prompt: `What is 10 more than ${n}?`,
        answerType: "multiple-choice",
        choices,
        correctIndex,
        hint: `Just bump the tens digit up by 1.`,
        explanation: `10 more than ${n} is ${answer}.`,
      };
    }
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `What is 10 more than ${n}?`,
      answerType: "number",
      answer,
      hint: `The ones digit stays the same. Add 1 to the tens.`,
      explanation: `${n} + 10 = ${answer}.`,
    };
  }
  // subtract 10 — make sure n >= 21 so tens digit stays positive
  const start = Math.max(lo, 21);
  const m = randInt(start, hi);
  const answer = m - 10;
  if (useMc) {
    const { choices, correctIndex } = numChoices(answer, [answer - 10, answer + 10, answer - 1, answer + 1, m]);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `What is 10 less than ${m}?`,
      answerType: "multiple-choice",
      choices,
      correctIndex,
      hint: `Just bump the tens digit down by 1.`,
      explanation: `10 less than ${m} is ${answer}.`,
    };
  }
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What is 10 less than ${m}?`,
    answerType: "number",
    answer,
    hint: `The ones digit stays the same. Subtract 1 from the tens.`,
    explanation: `${m} − 10 = ${answer}.`,
  };
}

// ---------------------------------------------------------------------------
// g2-hundreds: identify hundreds/tens/ones (visual: number-blocks)
// ---------------------------------------------------------------------------
function genG2Hundreds(lesson: Lesson, ctx?: GenContext): Problem {
  const [lo, hi] = difficultyRange(ctx, [100, 200], [100, 500], [100, 999]);
  const type = pick(["blocks-to-number", "how-many-tens", "expanded", "which-digit"]);
  const value = randInt(lo, hi);
  if (type === "blocks-to-number") {
    const visual: ProblemVisual = { kind: "number-blocks", value };
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `What number is shown by the base-ten blocks?`,
      visual,
      answerType: "number",
      answer: value,
      hint: `Count flats (100s), rods (10s), and units (1s).`,
      explanation: `That's ${value}.`,
    };
  }
  if (type === "how-many-tens") {
    // Pick a multiple of 10 so the answer is clean
    const v = randInt(10, 99) * 10;
    const tens = Math.floor(v / 10);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `How many tens are in ${v}?`,
      answerType: "number",
      answer: tens,
      hint: `Divide by 10. ${v} ÷ 10 = ?`,
      explanation: `${v} = ${tens} tens (and 0 ones).`,
    };
  }
  if (type === "expanded") {
    const h = Math.floor(value / 100) * 100;
    const t = Math.floor((value % 100) / 10) * 10;
    const o = value % 10;
    const expanded = `${h} + ${t} + ${o}`;
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `${expanded} = ?`,
      answerType: "number",
      answer: value,
      hint: `Add the hundreds, tens, and ones.`,
      explanation: `${expanded} = ${value}.`,
    };
  }
  // which-digit: ask what place a digit is in
  const places = [
    { name: "ones", mul: 1, label: "ones" },
    { name: "tens", mul: 10, label: "tens" },
    { name: "hundreds", mul: 100, label: "hundreds" },
  ];
  const place = pick(places);
  const digit = Math.floor(value / place.mul) % 10;
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `In the number ${value}, what digit is in the ${place.label} place?`,
    answerType: "number",
    answer: digit,
    hint: `${place.label} place is ${place.label === "ones" ? "the rightmost digit" : place.label === "tens" ? "the middle digit" : "the leftmost digit"}.`,
    explanation: `In ${value}, the ${place.label} digit is ${digit}.`,
  };
}

// ---------------------------------------------------------------------------
// g2-read-1000: write/identify numbers to 1000
// ---------------------------------------------------------------------------
function genG2Read1000(lesson: Lesson, ctx?: GenContext): Problem {
  const [lo, hi] = difficultyRange(ctx, [100, 300], [100, 700], [200, 999]);
  const value = randInt(lo, hi);
  const type = pick(["words-to-number", "number-to-words", "which-is-bigger-hundreds"]);
  if (type === "words-to-number") {
    const words = numberToWords(value);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `Write this number using digits: "${words}"`,
      answerType: "number",
      answer: value,
      hint: `Hundreds digit first, then tens, then ones.`,
      explanation: `"${words}" is ${value}.`,
    };
  }
  if (type === "number-to-words") {
    const words = numberToWords(value);
    const distractors = shuffle(
      [value - 10, value + 10, value + 100, value - 100, value + 1].map(numberToWords)
    ).slice(0, 3);
    const { choices, correctIndex } = strChoices(words, distractors);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `How do you read the number ${value}?`,
      answerType: "multiple-choice",
      choices,
      correctIndex,
      hint: `Say the hundreds digit, then "hundred," then the rest.`,
      explanation: `${value} is "${words}".`,
    };
  }
  // which-is-bigger-hundreds: MC of which number has 3 hundreds, 4 hundreds, etc.
  const targetHundreds = randInt(2, 9);
  const correct = targetHundreds * 100 + randInt(0, 9) * 10 + randInt(0, 9);
  const pool = [correct];
  while (pool.length < 4) {
    const cand = randInt(100, 999);
    if (Math.floor(cand / 100) !== targetHundreds) pool.push(cand);
  }
  const { choices, correctIndex } = numChoices(correct, pool);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `Which number has ${targetHundreds} hundreds?`,
    answerType: "multiple-choice",
    choices,
    correctIndex,
    hint: `Look at the first digit — it tells you the hundreds.`,
    explanation: `${correct} starts with ${targetHundreds}, so it has ${targetHundreds} hundreds.`,
  };
}

function numberToWords(n: number): string {
  if (n === 1000) return "one thousand";
  const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  const teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tensWords = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  let restWords = "";
  if (rest < 10) restWords = ones[rest];
  else if (rest < 20) restWords = teens[rest - 10];
  else restWords = `${tensWords[Math.floor(rest / 10)]}${rest % 10 === 0 ? "" : "-" + ones[rest % 10]}`;
  if (h === 0) return restWords || "zero";
  if (rest === 0) return `${ones[h]} hundred`;
  return `${ones[h]} hundred ${restWords}`;
}

// ---------------------------------------------------------------------------
// g2-compare-3: compare 3-digit numbers (MC: greater/less/equal)
// ---------------------------------------------------------------------------
function genG2Compare3(lesson: Lesson, ctx?: GenContext): Problem {
  const [lo, hi] = difficultyRange(ctx, [100, 300], [100, 600], [100, 999]);
  const a = randInt(lo, hi);
  const equal = Math.random() < 0.2;
  const b = equal ? a : randInt(lo, hi);
  let correct: string;
  if (a > b) correct = "Greater than (>)";
  else if (a < b) correct = "Less than (<)";
  else correct = "Equal (=)";
  const { choices, correctIndex } = strChoices(correct, ["Greater than (>)", "Less than (<)", "Equal (=)"]);
  void ctx;
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `Compare: ${a} ___ ${b}. Which symbol makes it true?`,
    answerType: "multiple-choice",
    choices,
    correctIndex,
    hint: `Compare hundreds first, then tens, then ones.`,
    explanation: `${a} ${correct.split(" ")[0]} ${b}.`,
  };
}

// ---------------------------------------------------------------------------
// g2-100-more: 100 more / 100 less (and 10 more / 10 less for variety)
// ---------------------------------------------------------------------------
function genG2OneHundredMore(lesson: Lesson, ctx?: GenContext): Problem {
  const [lo, hi] = difficultyRange(ctx, [100, 400], [100, 800], [100, 899]);
  const n = randInt(lo, hi);
  const variant = pick(["100-more", "100-less", "10-more", "10-less"]);
  let answer: number, prompt: string, hint: string;
  if (variant === "100-more") {
    answer = n + 100;
    prompt = `What is 100 more than ${n}?`;
    hint = `Only the hundreds digit changes.`;
  } else if (variant === "100-less") {
    answer = n - 100;
    prompt = `What is 100 less than ${n}?`;
    hint = `Subtract 1 from the hundreds digit.`;
  } else if (variant === "10-more") {
    answer = n + 10;
    prompt = `What is 10 more than ${n}?`;
    hint = `Only the tens digit changes.`;
  } else {
    answer = n - 10;
    prompt = `What is 10 less than ${n}?`;
    hint = `Subtract 1 from the tens digit.`;
  }
  void ctx;
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt,
    answerType: "number",
    answer,
    hint,
    explanation: `The answer is ${answer}.`,
  };
}

// ---------------------------------------------------------------------------
// g2-money: count coins to make amounts under $1
// ---------------------------------------------------------------------------
const COIN_VALUES: Record<string, number> = { penny: 1, nickel: 5, dime: 10, quarter: 25 };
function genG2Money(lesson: Lesson, ctx?: GenContext): Problem {
  const type = pick(["count-mixed", "count-same", "which-coins"]);
  void ctx;
  if (type === "count-same") {
    const coin = pick(["dime", "nickel", "quarter", "penny"]);
    const count = randInt(2, 6);
    const total = count * COIN_VALUES[coin];
    const coinPlural = coin + (count === 1 ? "" : "s");
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      story: `You have ${count} ${coinPlural}.`,
      prompt: `How many cents is that?`,
      answerType: "number",
      answer: total,
      unit: "¢",
      hint: `Each ${coin} = ${COIN_VALUES[coin]}¢. ${count} × ${COIN_VALUES[coin]} = ?`,
      explanation: `${count} × ${COIN_VALUES[coin]}¢ = ${total}¢.`,
    };
  }
  if (type === "count-mixed") {
    // Build a small set of coins totaling < 100
    let total = 0;
    const coins: string[] = [];
    const picks = ["quarter", "dime", "dime", "nickel", "penny", "penny", "penny", "quarter", "dime", "nickel"];
    const shuffled = shuffle(picks);
    for (const c of shuffled) {
      if (total + COIN_VALUES[c] >= 100) break;
      total += COIN_VALUES[c];
      coins.push(c);
    }
    if (coins.length < 2) {
      coins.push("dime");
      total += 10;
    }
    const coinList = coins.map((c) => `${COIN_VALUES[c]}¢`).join(", ");
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      story: `You have these coins: ${coins.join(", ")} (values: ${coinList}).`,
      prompt: `How many cents do you have in all?`,
      answerType: "number",
      answer: total,
      unit: "¢",
      hint: `Start with the biggest coin and add.`,
      explanation: `${coinList} added up = ${total}¢.`,
    };
  }
  // which-coins: ask how many of one coin makes a target
  const coin = pick(["dime", "nickel", "quarter"]);
  const target = pick([COIN_VALUES[coin] * 2, COIN_VALUES[coin] * 3, COIN_VALUES[coin] * 4]);
  const count = target / COIN_VALUES[coin];
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `How many ${coin}s make ${target}¢?`,
    answerType: "number",
    answer: count,
    hint: `Each ${coin} = ${COIN_VALUES[coin]}¢. ${target} ÷ ${COIN_VALUES[coin]} = ?`,
    explanation: `${count} ${coin}s × ${COIN_VALUES[coin]}¢ = ${target}¢.`,
  };
}

// ---------------------------------------------------------------------------
// g2-money-word: word problems with money
// ---------------------------------------------------------------------------
function genG2MoneyWord(lesson: Lesson, ctx?: GenContext): Problem {
  const type = pick(["change", "total-cost", "afford"]);
  void ctx;
  if (type === "change") {
    const have = pick([50, 75, 80, 100]);
    const price = randInt(15, Math.min(have - 5, 60));
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      story: `You have ${have}¢. You buy a snack for ${price}¢.`,
      prompt: `How much change do you get back?`,
      answerType: "number",
      answer: have - price,
      unit: "¢",
      hint: `Subtract the price from what you have: ${have} − ${price}.`,
      explanation: `${have}¢ − ${price}¢ = ${have - price}¢.`,
    };
  }
  if (type === "total-cost") {
    const a = randInt(10, 45);
    const b = randInt(10, 45);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      story: `A pencil costs ${a}¢ and an eraser costs ${b}¢. You buy one of each.`,
      prompt: `How much do you pay in all?`,
      answerType: "number",
      answer: a + b,
      unit: "¢",
      hint: `'In all' means add: ${a} + ${b}.`,
      explanation: `${a}¢ + ${b}¢ = ${a + b}¢.`,
    };
  }
  // afford
  const have = pick([50, 75, 100]);
  const price = randInt(20, have + 30);
  const afford = price <= have;
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    story: `You have ${have}¢. A toy costs ${price}¢.`,
    prompt: `Do you have enough money to buy the toy?`,
    answerType: "multiple-choice",
    choices: ["Yes", "No"],
    correctIndex: afford ? 0 : 1,
    hint: `Compare: is ${have} at least ${price}?`,
    explanation: afford
      ? `${have}¢ ≥ ${price}¢, so yes — you can buy it.`
      : `${have}¢ < ${price}¢, so no — you need ${price - have}¢ more.`,
  };
}

// ---------------------------------------------------------------------------
// g2-picture-graph: read picture graphs
// ---------------------------------------------------------------------------
function genG2PictureGraph(lesson: Lesson, ctx?: GenContext): Problem {
  const categories = pick([
    ["🍎", "🍌", "🍇", "🍊"],
    ["🐶", "🐱", "🐟", "🐦"],
    ["⚽", "🏀", "🎾", "🏈"],
  ]);
  const labels = pick([
    ["Apples", "Bananas", "Grapes", "Oranges"],
    ["Dogs", "Cats", "Fish", "Birds"],
    ["Soccer", "Basketball", "Tennis", "Football"],
  ]);
  const per = pick([1, 2]);
  const counts = categories.map(() => randInt(1, 5));
  const type = pick(["count-one", "compare", "total"]);
  void ctx;
  if (type === "count-one") {
    const idx = randInt(0, categories.length - 1);
    const symbolRow = categories[idx].repeat(counts[idx]);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      story: `Picture graph (each symbol = ${per}): ${labels.map((l, i) => `${l}: ${categories[i].repeat(counts[i])}`).join(", ")}.`,
      prompt: `How many votes did ${labels[idx]} get?`,
      answerType: "number",
      answer: counts[idx] * per,
      hint: `Count the ${categories[idx]} symbols (${counts[idx]}), then multiply by ${per}.`,
      explanation: `${counts[idx]} symbols × ${per} = ${counts[idx] * per} votes.`,
    };
  }
  if (type === "compare") {
    const [i, j] = [randInt(0, 3), randInt(0, 3)];
    const vi = counts[i] * per;
    const vj = counts[j] * per;
    const more = vi > vj ? labels[i] : vi < vj ? labels[j] : "Tie";
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      story: `Picture graph (each symbol = ${per}): ${labels.map((l, k) => `${l}: ${categories[k].repeat(counts[k])}`).join(", ")}.`,
      prompt: `Which got more votes — ${labels[i]} or ${labels[j]}?`,
      answerType: "multiple-choice",
      choices: [labels[i], labels[j], "Tie"],
      correctIndex: more === labels[i] ? 0 : more === labels[j] ? 1 : 2,
      hint: `More symbols means more votes.`,
      explanation: `${labels[i]} = ${vi}, ${labels[j]} = ${vj}. ${more === "Tie" ? "It's a tie!" : `${more} got more.`}`,
    };
  }
  // total
  const total = counts.reduce((sum, c) => sum + c * per, 0);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    story: `Picture graph (each symbol = ${per}): ${labels.map((l, k) => `${l}: ${categories[k].repeat(counts[k])}`).join(", ")}.`,
    prompt: `How many votes were cast in all?`,
    answerType: "number",
    answer: total,
    hint: `Add up all the votes: each category's symbols × ${per}.`,
    explanation: `${counts.map((c) => c * per).join(" + ")} = ${total} votes in all.`,
  };
}

// ---------------------------------------------------------------------------
// g2-bar-graph: read bar graphs
// ---------------------------------------------------------------------------
function genG2BarGraph(lesson: Lesson, ctx?: GenContext): Problem {
  const cats = pick([
    ["Pizza", "Tacos", "Burgers", "Salad"],
    ["Mon", "Tue", "Wed", "Thu"],
    ["Red", "Blue", "Green", "Yellow"],
  ]);
  const values = cats.map(() => randInt(2, 10));
  const type = pick(["read-one", "how-many-more", "total"]);
  void ctx;
  const story = `Bar graph shows: ${cats.map((c, i) => `${c} = ${values[i]}`).join(", ")}.`;
  if (type === "read-one") {
    const idx = randInt(0, cats.length - 1);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      story,
      prompt: `How many votes did ${cats[idx]} get?`,
      answerType: "number",
      answer: values[idx],
      hint: `Look at the bar for ${cats[idx]} and read the scale.`,
      explanation: `${cats[idx]} = ${values[idx]}.`,
    };
  }
  if (type === "how-many-more") {
    const [i, j] = [randInt(0, 3), randInt(0, 3)];
    const diff = Math.abs(values[i] - values[j]);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      story,
      prompt: `How many MORE votes did ${values[i] >= values[j] ? cats[i] : cats[j]} get than ${values[i] >= values[j] ? cats[j] : cats[i]}?`,
      answerType: "number",
      answer: diff,
      hint: `'How many more' means subtract the smaller from the bigger.`,
      explanation: `${Math.max(values[i], values[j])} − ${Math.min(values[i], values[j])} = ${diff}.`,
    };
  }
  const total = values.reduce((s, v) => s + v, 0);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    story,
    prompt: `How many votes were cast in all?`,
    answerType: "number",
    answer: total,
    hint: `Add all four bar values together.`,
    explanation: `${values.join(" + ")} = ${total}.`,
  };
}

// ---------------------------------------------------------------------------
// g2-time-5min: tell time to 5 minutes (visual: clock)
// ---------------------------------------------------------------------------
function genG2Time5Min(lesson: Lesson, ctx?: GenContext): Problem {
  void ctx;
  const hour = randInt(1, 12);
  const minute = pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
  const visual: ProblemVisual = { kind: "clock", hour, minute };
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What time is shown on the clock? (Enter as H:MM, like 3:30)`,
    visual,
    answerType: "time",
    hour,
    minute,
    mode: "read",
    hint: `Short hand = hour. Long hand = minutes (count by 5s).`,
    explanation: `Hour hand at ${hour}, minute hand at ${minute} → ${hour}:${String(minute).padStart(2, "0")}.`,
  };
}

// ---------------------------------------------------------------------------
// g2-elapsed: simple elapsed time (hours)
// ---------------------------------------------------------------------------
function genG2Elapsed(lesson: Lesson, ctx?: GenContext): Problem {
  void ctx;
  const type = pick(["whole-hours", "half-hours"]);
  if (type === "whole-hours") {
    const startH = randInt(1, 9);
    const dur = randInt(1, 4);
    const endH = startH + dur;
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      story: `A show starts at ${startH}:00 and ends at ${endH}:00.`,
      prompt: `How many hours long is the show?`,
      answerType: "number",
      answer: dur,
      unit: "hours",
      hint: `Count from ${startH} to ${endH} on a number line.`,
      explanation: `${endH} − ${startH} = ${dur} hours.`,
    };
  }
  // half-hours
  const startH = randInt(1, 10);
  const dur = pick([1, 2]);
  const endH = startH + dur;
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    story: `A activity starts at ${startH}:30 and ends at ${endH}:30.`,
    prompt: `How many hours long is the activity?`,
    answerType: "number",
    answer: dur,
    unit: "hours",
    hint: `Both times end in :30, so just compare the hours.`,
    explanation: `From ${startH}:30 to ${endH}:30 is ${dur} hour${dur === 1 ? "" : "s"}.`,
  };
}

// ---------------------------------------------------------------------------
// g2-length: measure/compare lengths
// ---------------------------------------------------------------------------
function genG2Length(lesson: Lesson, ctx?: GenContext): Problem {
  const type = pick(["compare", "convert-ft-in", "convert-m-cm", "how-many-more"]);
  void ctx;
  if (type === "compare") {
    const a = randInt(3, 12);
    const b = randInt(2, 12);
    const unit = pick(["inches", "cm"]);
    const longer = Math.max(a, b);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      story: `A pencil is ${a} ${unit} long. A crayon is ${b} ${unit} long.`,
      prompt: `How much longer is the ${a >= b ? "pencil" : "crayon"}?`,
      answerType: "number",
      answer: Math.abs(a - b),
      unit,
      hint: `Subtract the smaller from the bigger.`,
      explanation: `${Math.max(a, b)} − ${Math.min(a, b)} = ${Math.abs(a - b)} ${unit}.`,
    };
  }
  if (type === "convert-ft-in") {
    const ft = randInt(1, 5);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `${ft} feet = how many inches? (1 foot = 12 inches)`,
      answerType: "number",
      answer: ft * 12,
      unit: "inches",
      hint: `Multiply by 12: ${ft} × 12.`,
      explanation: `${ft} × 12 = ${ft * 12} inches.`,
    };
  }
  if (type === "convert-m-cm") {
    const m = randInt(1, 4);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `${m} meters = how many centimeters? (1 meter = 100 cm)`,
      answerType: "number",
      answer: m * 100,
      unit: "cm",
      hint: `Multiply by 100: ${m} × 100.`,
      explanation: `${m} × 100 = ${m * 100} cm.`,
    };
  }
  // how-many-more (story subtraction with mixed units)
  const a = randInt(10, 30);
  const b = randInt(5, a - 1);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    story: `A ribbon is ${a} inches long. You cut off ${b} inches.`,
    prompt: `How many inches of ribbon are left?`,
    answerType: "number",
    answer: a - b,
    unit: "inches",
    hint: `Subtract: ${a} − ${b}.`,
    explanation: `${a} − ${b} = ${a - b} inches.`,
  };
}

// ---------------------------------------------------------------------------
// g2-shape-attrs: identify shape attributes (sides/angles)
// ---------------------------------------------------------------------------
const G2_SHAPES: { shape: ShapeKind; sides: number; angles: number; name: string }[] = [
  { shape: "triangle", sides: 3, angles: 3, name: "Triangle" },
  { shape: "square", sides: 4, angles: 4, name: "Square" },
  { shape: "rectangle", sides: 4, angles: 4, name: "Rectangle" },
  { shape: "pentagon", sides: 5, angles: 5, name: "Pentagon" },
  { shape: "hexagon", sides: 6, angles: 6, name: "Hexagon" },
];
function genG2ShapeAttrs(lesson: Lesson, ctx?: GenContext): Problem {
  void ctx;
  const s = pick(G2_SHAPES);
  const visual: ProblemVisual = { kind: "shape", shape: s.shape };
  const type = pick(["count-sides", "identify", "count-angles"]);
  if (type === "count-sides") {
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `How many sides does this shape have?`,
      visual,
      answerType: "number",
      answer: s.sides,
      hint: `Count the straight edges.`,
      explanation: `A ${s.name} has ${s.sides} sides.`,
    };
  }
  if (type === "count-angles") {
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `How many angles (corners) does this shape have?`,
      visual,
      answerType: "number",
      answer: s.angles,
      hint: `Count the corners.`,
      explanation: `A ${s.name} has ${s.angles} angles.`,
    };
  }
  // identify
  const { choices, correctIndex } = strChoices(
    s.name,
    G2_SHAPES.map((x) => x.name)
  );
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What is the name of this shape?`,
    visual,
    answerType: "multiple-choice",
    choices,
    correctIndex,
    hint: `Count the sides: 3 = triangle, 4 = quadrilateral, 5 = pentagon, 6 = hexagon.`,
    explanation: `This shape has ${s.sides} sides, so it's a ${s.name}.`,
  };
}

// ---------------------------------------------------------------------------
// g2-partition: partition rectangles into rows/columns (visual: area-grid)
// ---------------------------------------------------------------------------
function genG2Partition(lesson: Lesson, ctx?: GenContext): Problem {
  void ctx;
  const rows = randInt(2, 5);
  const cols = randInt(2, 5);
  const visual: ProblemVisual = { kind: "area-grid", rows, cols, shaded: false };
  const type = pick(["total-squares", "how-many-rows", "how-many-cols"]);
  if (type === "total-squares") {
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `A rectangle is partitioned into ${rows} rows and ${cols} columns. How many small squares is it divided into?`,
      visual,
      answerType: "number",
      answer: rows * cols,
      hint: `Rows × Columns = Total. ${rows} × ${cols} = ?`,
      explanation: `${rows} rows × ${cols} columns = ${rows * cols} squares.`,
    };
  }
  if (type === "how-many-rows") {
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `Look at the partitioned rectangle. How many ROWS does it have?`,
      visual,
      answerType: "number",
      answer: rows,
      hint: `Rows go across (left to right). Count them.`,
      explanation: `There are ${rows} rows.`,
    };
  }
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `Look at the partitioned rectangle. How many COLUMNS does it have?`,
    visual,
    answerType: "number",
    answer: cols,
    hint: `Columns go up and down. Count them.`,
    explanation: `There are ${cols} columns.`,
  };
}

// ---------------------------------------------------------------------------
// g2-fractions: identify halves/thirds/fourths (visual: fraction-pie)
// ---------------------------------------------------------------------------
function genG2Fractions(lesson: Lesson, ctx?: GenContext): Problem {
  void ctx;
  const denom = pick([2, 3, 4]);
  const numer = randInt(1, denom);
  const visual: ProblemVisual = { kind: "fraction-pie", numerator: numer, denominator: denom };
  const type = pick(["name", "shaded-fraction", "how-many-parts"]);
  const nameMap: Record<number, string> = {
    2: "halves",
    3: "thirds",
    4: "fourths",
  };
  // Full names for every (numer, denom) combination 2nd graders see.
  const fractionNames: Record<string, string> = {
    "1-2": "one half",
    "2-2": "two halves",
    "1-3": "one third",
    "2-3": "two thirds",
    "3-3": "three thirds",
    "1-4": "one fourth",
    "2-4": "two fourths",
    "3-4": "three fourths",
    "4-4": "four fourths",
  };
  if (type === "name") {
    const correct = fractionNames[`${numer}-${denom}`];
    const pool = ["one half", "one third", "one fourth", "two halves", "two thirds", "two fourths", "three fourths", "three thirds"];
    const { choices, correctIndex } = strChoices(correct, pool);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `What fraction of the circle is shaded?`,
      visual,
      answerType: "multiple-choice",
      choices,
      correctIndex,
      hint: `Count the equal parts (bottom number), then count the shaded parts (top number).`,
      explanation: `${numer} out of ${denom} equal parts is shaded — that's ${correct}.`,
    };
  }
  if (type === "shaded-fraction") {
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `What fraction of the circle is shaded? (Enter as numerator/denominator)`,
      visual,
      answerType: "fraction",
      numerator: numer,
      denominator: denom,
      hint: `Top = shaded parts. Bottom = total equal parts.`,
      explanation: `${numer}/${denom} of the circle is shaded.`,
    };
  }
  // how-many-parts
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `The circle is cut into ${denom} equal parts. What do we call those parts?`,
    visual,
    answerType: "multiple-choice",
    choices: ["halves", "thirds", "fourths", "fifths"],
    correctIndex: ["halves", "thirds", "fourths", "fifths"].indexOf(nameMap[denom]),
    hint: `2 parts = halves, 3 parts = thirds, 4 parts = fourths.`,
    explanation: `Cut into ${denom} equal parts = ${nameMap[denom]}.`,
  };
}

// ---------------------------------------------------------------------------
// g2-arrays: arrays (rows x cols = total) (visual: array)
// ---------------------------------------------------------------------------
function genG2Arrays(lesson: Lesson, ctx?: GenContext): Problem {
  void ctx;
  const rows = randInt(2, 5);
  const cols = randInt(2, 5);
  const emoji = pick(CUTE_EMOJIS);
  const visual: ProblemVisual = { kind: "array", rows, cols, emoji };
  const type = pick(["total", "skip-count", "how-many-rows"]);
  if (type === "total") {
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `An array has ${rows} rows with ${cols} ${emoji} in each row. How many ${emoji} are there in all?`,
      visual,
      answerType: "number",
      answer: rows * cols,
      hint: `Rows × Columns = Total. ${rows} × ${cols} = ?`,
      explanation: `${rows} rows × ${cols} = ${rows * cols} ${emoji} in all.`,
    };
  }
  if (type === "skip-count") {
    // Ask learner to skip count the rows
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `Count by ${cols}s to find the total: ${Array.from({ length: rows }, (_, i) => (i + 1) * cols).join(", ")}, ___?`,
      visual,
      answerType: "number",
      answer: rows * cols,
      hint: `Keep skip-counting by ${cols}.`,
      explanation: `${Array.from({ length: rows }, (_, i) => (i + 1) * cols).join(", ")} = ${rows * cols}.`,
    };
  }
  // how-many-rows: give total and cols, ask for rows
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `An array has ${cols} in each row and ${rows * cols} in all. How many rows are there?`,
    visual,
    answerType: "number",
    answer: rows,
    hint: `Total ÷ per row = rows. ${rows * cols} ÷ ${cols} = ?`,
    explanation: `${rows * cols} ÷ ${cols} = ${rows} rows.`,
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------
const G2_GENERATORS: Record<string, (lesson: Lesson, ctx?: GenContext) => Problem> = {
  "g2-add-20": genG2Add20,
  "g2-sub-20": genG2Sub20,
  "g2-add-2digit": genG2Add2Digit,
  "g2-sub-2digit": genG2Sub2Digit,
  "g2-word-add-sub": genG2WordAddSub,
  "g2-mental-10": genG2Mental10,
  "g2-hundreds": genG2Hundreds,
  "g2-read-1000": genG2Read1000,
  "g2-compare-3": genG2Compare3,
  "g2-100-more": genG2OneHundredMore,
  "g2-money": genG2Money,
  "g2-money-word": genG2MoneyWord,
  "g2-picture-graph": genG2PictureGraph,
  "g2-bar-graph": genG2BarGraph,
  "g2-time-5min": genG2Time5Min,
  "g2-elapsed": genG2Elapsed,
  "g2-length": genG2Length,
  "g2-shape-attrs": genG2ShapeAttrs,
  "g2-partition": genG2Partition,
  "g2-fractions": genG2Fractions,
  "g2-arrays": genG2Arrays,
};

export function generateGrade2Problems(
  lesson: Lesson,
  count: number,
  ctx?: GenContext
): Problem[] {
  const gen = G2_GENERATORS[lesson.generator];
  if (!gen) {
    throw new Error(`No 2nd-grade generator for lesson "${lesson.id}" (${lesson.generator})`);
  }
  const problems: Problem[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (problems.length < count && guard < count * 20) {
    guard++;
    const p = gen(lesson, ctx);
    const sig = `${p.answerType}:${p.prompt}:${p.story ?? ""}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    problems.push(p);
  }
  while (problems.length < count) problems.push(gen(lesson, ctx));
  return problems;
}
