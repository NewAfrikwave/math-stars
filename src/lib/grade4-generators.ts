import type { Problem, ProblemVisual, Lesson, GenContext } from "@/lib/types";

// ---------------------------------------------------------------------------
// 4th grade problem generators. Same Problem shape and answer types as the
// other grade levels — QuizRunner and AnswerInput work unchanged. Numbers
// are kept age-appropriate (up to 4 digits for multiplication, fractions
// with denominators 2–12). Subtraction prompts use the unicode minus (−).
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

// Greatest common divisor — used for simplifying fractions and computing LCMs.
function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}
function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

let g4Counter = 0;
function nextId(lesson: string) {
  g4Counter += 1;
  return `${lesson}-${g4Counter}`;
}

// Build unique numeric multiple-choice distractors around the correct answer.
function numericChoices(answer: number, count = 4): { choices: string[]; correctIndex: number } {
  const set = new Set<number>([answer]);
  let guard = 0;
  while (set.size < count && guard < 50) {
    guard++;
    const delta = pick([-3, -2, -1, 1, 2, 3, 4, 5, -5, -4, 10, -10]);
    const candidate = answer + delta;
    if (candidate >= 0) set.add(candidate);
  }
  while (set.size < count) set.add(answer + set.size * 7 + 11);
  const arr = shuffle([...set]).slice(0, count);
  return { choices: arr.map(String), correctIndex: arr.indexOf(answer) };
}

// Build string multiple-choice options around a correct answer.
function choiceSet(correct: string, pool: string[], count = 4): { choices: string[]; correctIndex: number } {
  const uniquePool = [...new Set(pool.filter((p) => p !== correct))];
  const wrong = shuffle(uniquePool).slice(0, count - 1);
  const choices = shuffle([correct, ...wrong]);
  return { choices, correctIndex: choices.indexOf(correct) };
}

// Round to 2 decimals — keeps decimal/money answers free of float noise.
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// g4-mult-2x1: 2-digit × 1-digit multiplication
// ---------------------------------------------------------------------------
function genG4Mult2x1(lesson: Lesson, ctx?: GenContext): Problem {
  const easy = ctx?.difficulty === "easy";
  const challenge = ctx?.difficulty === "challenge";
  const a = easy ? randInt(11, 39) : challenge ? randInt(25, 99) : randInt(12, 89);
  const b = easy ? randInt(2, 5) : challenge ? randInt(4, 9) : randInt(2, 9);
  const product = a * b;
  const useMC = Math.random() < 0.3;
  const tensPart = Math.floor(a / 10) * 10;
  const onesPart = a % 10;
  if (useMC) {
    const { choices, correctIndex } = numericChoices(product);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `What is ${a} × ${b}?`,
      answerType: "multiple-choice",
      choices,
      correctIndex,
      hint: `Break it apart: ${tensPart} × ${b} and ${onesPart} × ${b}, then add.`,
      explanation: `${a} × ${b} = ${product}.`,
    };
  }
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What is ${a} × ${b}?`,
    answerType: "number",
    answer: product,
    hint: `${tensPart} × ${b} = ${tensPart * b}, and ${onesPart} × ${b} = ${onesPart * b}. Add them!`,
    explanation: `${a} × ${b} = ${tensPart * b + onesPart * b} = ${product}.`,
  };
}

// ---------------------------------------------------------------------------
// g4-mult-2x2: 2-digit × 2-digit multiplication
// ---------------------------------------------------------------------------
function genG4Mult2x2(lesson: Lesson, ctx?: GenContext): Problem {
  const easy = ctx?.difficulty === "easy";
  const challenge = ctx?.difficulty === "challenge";
  const a = easy ? randInt(11, 29) : challenge ? randInt(21, 99) : randInt(12, 49);
  const b = easy ? randInt(11, 19) : challenge ? randInt(21, 99) : randInt(11, 39);
  const product = a * b;
  const bTens = Math.floor(b / 10) * 10;
  const bOnes = b % 10;
  const useMC = Math.random() < 0.3;
  if (useMC) {
    const { choices, correctIndex } = numericChoices(product);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `What is ${a} × ${b}?`,
      answerType: "multiple-choice",
      choices,
      correctIndex,
      hint: `Split ${b} into ${bTens} and ${bOnes}. Multiply each part by ${a}, then add.`,
      explanation: `${a} × ${b} = ${product}.`,
    };
  }
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What is ${a} × ${b}?`,
    answerType: "number",
    answer: product,
    hint: `${a} × ${bTens} = ${a * bTens}, and ${a} × ${bOnes} = ${a * bOnes}. Add them!`,
    explanation: `${a} × ${b} = ${a * bTens + a * bOnes} = ${product}.`,
  };
}

// ---------------------------------------------------------------------------
// g4-long-division: 3-digit ÷ 1-digit (no remainder)
// ---------------------------------------------------------------------------
function genG4LongDivision(lesson: Lesson, ctx?: GenContext): Problem {
  const easy = ctx?.difficulty === "easy";
  const challenge = ctx?.difficulty === "challenge";
  const divisor = easy ? randInt(2, 5) : challenge ? randInt(3, 9) : randInt(2, 9);
  const quotient = easy ? randInt(10, 30) : challenge ? randInt(20, 99) : randInt(12, 80);
  const dividend = divisor * quotient;
  const useMC = Math.random() < 0.3;
  if (useMC) {
    const { choices, correctIndex } = numericChoices(quotient);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `What is ${dividend} ÷ ${divisor}?`,
      answerType: "multiple-choice",
      choices,
      correctIndex,
      hint: `Use long division: Divide, Multiply, Subtract, Bring down.`,
      explanation: `${dividend} ÷ ${divisor} = ${quotient}. Check: ${quotient} × ${divisor} = ${dividend}.`,
    };
  }
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What is ${dividend} ÷ ${divisor}?`,
    answerType: "number",
    answer: quotient,
    hint: `${divisor} goes into ${Math.floor(dividend / 10)} how many times? Start there.`,
    explanation: `${dividend} ÷ ${divisor} = ${quotient}. Check: ${quotient} × ${divisor} = ${dividend}.`,
  };
}

// ---------------------------------------------------------------------------
// g4-division-remainder: division with remainders (MC for "q R r" form)
// ---------------------------------------------------------------------------
function genG4DivisionRemainder(lesson: Lesson, ctx?: GenContext): Problem {
  const easy = ctx?.difficulty === "easy";
  const challenge = ctx?.difficulty === "challenge";
  const divisor = easy ? randInt(2, 5) : challenge ? randInt(4, 9) : randInt(3, 9);
  const quotient = easy ? randInt(3, 8) : challenge ? randInt(5, 20) : randInt(4, 15);
  const remainder = randInt(1, divisor - 1);
  const dividend = divisor * quotient + remainder;
  const correct = `${quotient} R ${remainder}`;
  // Build unique distractors.
  const distractorSet = new Set<string>([correct]);
  const candidates = [
    `${quotient + 1} R ${remainder}`,
    `${quotient - 1} R ${remainder}`,
    `${quotient} R ${(remainder + 1) % divisor}`,
    `${quotient} R ${(remainder + divisor - 1) % divisor}`,
    `${quotient + 1} R 0`,
    `${quotient - 1} R ${divisor - 1}`,
    `${quotient + 2} R ${remainder}`,
  ];
  for (const c of candidates) {
    if (!distractorSet.has(c)) {
      distractorSet.add(c);
      if (distractorSet.size === 4) break;
    }
  }
  const choices = shuffle([...distractorSet]).slice(0, 4);
  const correctIndex = choices.indexOf(correct);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What is ${dividend} ÷ ${divisor}? (Pick the quotient and remainder.)`,
    answerType: "multiple-choice",
    choices,
    correctIndex,
    hint: `${divisor} × ${quotient} = ${divisor * quotient}, and ${dividend} − ${divisor * quotient} = ${remainder}.`,
    explanation: `${dividend} ÷ ${divisor} = ${correct}, because ${divisor} × ${quotient} = ${divisor * quotient} with ${remainder} left over.`,
  };
}

// ---------------------------------------------------------------------------
// g4-word-md: multi-step word problems (multiply/divide)
// ---------------------------------------------------------------------------
interface WordTemplate {
  prompt: string;
  answer: number;
  hint: string;
  explanation: string;
}
function genG4WordMD(lesson: Lesson, ctx?: GenContext): Problem {
  const templates: Array<() => WordTemplate> = [
    // multiply then subtract
    () => {
      const perBox = randInt(4, 8);
      const boxes = randInt(5, 15);
      const total = perBox * boxes;
      const sold = randInt(1, boxes - 1);
      const soldItems = sold * perBox;
      const remaining = total - soldItems;
      return {
        prompt: `A bakery packs ${perBox} muffins in each box. They baked ${boxes} boxes and sold ${sold} boxes. How many muffins are left?`,
        answer: remaining,
        hint: `First find the total muffins: ${boxes} × ${perBox} = ${total}. Then find how many were sold: ${sold} × ${perBox} = ${soldItems}. Subtract!`,
        explanation: `${boxes} × ${perBox} = ${total} muffins. ${sold} × ${perBox} = ${soldItems} sold. ${total} − ${soldItems} = ${remaining} muffins left.`,
      };
    },
    // multiply then divide
    () => {
      const groups = randInt(3, 6);
      const perGroup = randInt(5, 12);
      const total = groups * perGroup;
      const newGroupSize = randInt(3, 6);
      const newGroups = Math.floor(total / newGroupSize);
      return {
        prompt: `A farmer has ${groups} baskets with ${perGroup} apples each. She repacks them into bags of ${newGroupSize}. How many full bags can she make?`,
        answer: newGroups,
        hint: `First find the total apples: ${groups} × ${perGroup} = ${total}. Then divide by ${newGroupSize}.`,
        explanation: `${groups} × ${perGroup} = ${total} apples. ${total} ÷ ${newGroupSize} = ${newGroups} full bags.`,
      };
    },
    // add then multiply
    () => {
      const a = randInt(10, 30);
      const b = randInt(10, 30);
      const sum = a + b;
      const times = randInt(2, 5);
      const total = sum * times;
      return {
        prompt: `A store has ${a} red balloons and ${b} blue balloons. They sell ${times} times that many balloons in all. How many balloons did they sell?`,
        answer: total,
        hint: `First add: ${a} + ${b} = ${sum}. Then multiply by ${times}.`,
        explanation: `${a} + ${b} = ${sum} balloons. ${sum} × ${times} = ${total} sold.`,
      };
    },
    // multiply then multiply (two factors)
    () => {
      const shelves = randInt(3, 6);
      const rows = randInt(4, 8);
      const perRow = randInt(3, 6);
      const total = shelves * rows * perRow;
      return {
        prompt: `A library has ${shelves} bookshelves. Each shelf has ${rows} rows of books, with ${perRow} books in each row. How many books are there in all?`,
        answer: total,
        hint: `First find books per shelf: ${rows} × ${perRow} = ${rows * perRow}. Then multiply by ${shelves} shelves.`,
        explanation: `${rows} × ${perRow} = ${rows * perRow} books per shelf. ${rows * perRow} × ${shelves} = ${total} books total.`,
      };
    },
  ];
  const t = pick(templates)();
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: t.prompt,
    answerType: "number",
    answer: t.answer,
    hint: t.hint,
    explanation: t.explanation,
  };
}

// ---------------------------------------------------------------------------
// g4-equiv-frac: equivalent fractions (with visual)
// ---------------------------------------------------------------------------
function genG4EquivFrac(lesson: Lesson, ctx?: GenContext): Problem {
  const denominators = [2, 3, 4, 5, 6, 8];
  const d = pick(denominators);
  const n = randInt(1, d - 1);
  const factor = pick([2, 3, 4]);
  const correctN = n * factor;
  const correctD = d * factor;
  const correct = `${correctN}/${correctD}`;
  const visual: ProblemVisual = { kind: "fraction-pie", numerator: n, denominator: d };
  // Build unique distractors.
  const distractorSet = new Set<string>([correct]);
  const candidates = [
    `${n + 1}/${d + 1}`,
    `${n * factor}/${d}`,
    `${n}/${d * factor}`,
    `${n * factor + 1}/${correctD}`,
    `${n * (factor + 1)}/${d * (factor + 1)}`,
    `${correctN}/${correctD + 1}`,
  ];
  for (const c of candidates) {
    if (!distractorSet.has(c)) {
      distractorSet.add(c);
      if (distractorSet.size === 4) break;
    }
  }
  const choices = shuffle([...distractorSet]).slice(0, 4);
  const correctIndex = choices.indexOf(correct);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `Which fraction is equivalent to ${n}/${d}?`,
    visual,
    answerType: "multiple-choice",
    choices,
    correctIndex,
    hint: `Multiply both top and bottom by the same number. Try × ${factor}.`,
    explanation: `${n}/${d} × ${factor}/${factor} = ${correctN}/${correctD}. Both are the same amount!`,
  };
}

// ---------------------------------------------------------------------------
// g4-compare-frac: compare fractions with unlike denominators
// ---------------------------------------------------------------------------
function compareFractions(n1: number, d1: number, n2: number, d2: number): string {
  const left = n1 * d2;
  const right = n2 * d1;
  if (left > right) return ">";
  if (left < right) return "<";
  return "=";
}
function genG4CompareFrac(lesson: Lesson, ctx?: GenContext): Problem {
  const denominators = [2, 3, 4, 5, 6, 8, 10];
  let d1 = pick(denominators);
  let d2 = pick(denominators);
  while (d2 === d1) d2 = pick(denominators);
  const n1 = randInt(1, d1 - 1);
  const n2 = randInt(1, d2 - 1);
  const correct = compareFractions(n1, d1, n2, d2);
  const useVisual = Math.random() < 0.5;
  const visual: ProblemVisual | undefined = useVisual
    ? { kind: "fraction-bar", numerator: n1, denominator: d1 }
    : undefined;
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `Compare: ${n1}/${d1} ___ ${n2}/${d2} (pick <, =, or >)`,
    visual,
    answerType: "multiple-choice",
    choices: ["<", "=", ">"],
    correctIndex: correct === "<" ? 0 : correct === "=" ? 1 : 2,
    hint: `Find a common denominator. The LCM of ${d1} and ${d2} is ${lcm(d1, d2)}.`,
    explanation: `Cross-multiply: ${n1}×${d2} = ${n1 * d2}, ${n2}×${d1} = ${n2 * d1}. Since ${n1 * d2} ${correct} ${n2 * d1}, ${n1}/${d1} ${correct} ${n2}/${d2}.`,
  };
}

// ---------------------------------------------------------------------------
// g4-add-frac: add/subtract fractions with like denominators
// ---------------------------------------------------------------------------
function genG4AddFrac(lesson: Lesson, ctx?: GenContext): Problem {
  const isSub = Math.random() < 0.4;
  const d = pick([4, 5, 6, 8, 10, 12]);
  const half = Math.floor((d - 1) / 2);
  let a = randInt(1, half);
  let b = randInt(1, half);
  if (isSub) {
    if (a === b) b = b === 1 ? 2 : 1;
    if (a < b) [a, b] = [b, a];
  }
  const resultNRaw = isSub ? a - b : a + b;
  const g = gcd(resultNRaw, d);
  const resultN = resultNRaw / g;
  const resultD = d / g;
  const op = isSub ? "−" : "+";
  const visual: ProblemVisual = { kind: "fraction-bar", numerator: a, denominator: d };
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What is ${a}/${d} ${op} ${b}/${d}? (Simplify your answer if possible.)`,
    visual,
    answerType: "fraction",
    numerator: resultN,
    denominator: resultD,
    hint: `Same denominator — just ${isSub ? "subtract" : "add"} the tops: ${a} ${op} ${b} = ${resultNRaw}. Keep the ${d}!`,
    explanation: `${a}/${d} ${op} ${b}/${d} = ${resultNRaw}/${d}${g > 1 ? ` = ${resultN}/${resultD} (simplified)` : ""}.`,
  };
}

// ---------------------------------------------------------------------------
// g4-mult-frac: fraction × whole number
// ---------------------------------------------------------------------------
function genG4MultFrac(lesson: Lesson, ctx?: GenContext): Problem {
  const d = pick([2, 3, 4, 5, 6, 8]);
  const n = randInt(1, d - 1);
  const w = randInt(2, 6);
  const resultNRaw = n * w;
  const g = gcd(resultNRaw, d);
  const resultN = resultNRaw / g;
  const resultD = d / g;
  const visual: ProblemVisual = { kind: "fraction-bar", numerator: n, denominator: d };
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What is ${w} × ${n}/${d}? (Simplify your answer if possible.)`,
    visual,
    answerType: "fraction",
    numerator: resultN,
    denominator: resultD,
    hint: `Multiply the whole number by the top: ${w} × ${n} = ${resultNRaw}. The denominator stays ${d}.`,
    explanation: `${w} × ${n}/${d} = ${resultNRaw}/${d}${g > 1 ? ` = ${resultN}/${resultD} (simplified)` : ""}.`,
  };
}

// ---------------------------------------------------------------------------
// g4-mixed-numbers: improper fraction → mixed number (MC)
// ---------------------------------------------------------------------------
function genG4MixedNumbers(lesson: Lesson, ctx?: GenContext): Problem {
  const d = pick([2, 3, 4, 5, 6, 8]);
  const whole = randInt(1, 4);
  const remainder = randInt(1, d - 1);
  const improperN = whole * d + remainder;
  const correct = `${whole} ${remainder}/${d}`;
  const visual: ProblemVisual = { kind: "fraction-pie", numerator: improperN, denominator: d };
  // Build unique distractors.
  const distractorSet = new Set<string>([correct]);
  const candidates = [
    `${whole + 1} ${remainder}/${d}`,
    `${whole} ${remainder + 1}/${d}`,
    `${whole} ${d - remainder}/${d}`,
    `${whole + 1} 0/${d}`,
    `${whole - 1 > 0 ? whole - 1 : whole + 2} ${remainder}/${d}`,
    `${improperN}/${d}`,
    `${whole + 1} ${d - remainder}/${d}`,
  ];
  for (const c of candidates) {
    if (!distractorSet.has(c)) {
      distractorSet.add(c);
      if (distractorSet.size === 4) break;
    }
  }
  const choices = shuffle([...distractorSet]).slice(0, 4);
  const correctIndex = choices.indexOf(correct);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `Write the improper fraction ${improperN}/${d} as a mixed number.`,
    visual,
    answerType: "multiple-choice",
    choices,
    correctIndex,
    hint: `Divide ${improperN} by ${d}. ${improperN} ÷ ${d} = ${whole} remainder ${remainder}.`,
    explanation: `${improperN} ÷ ${d} = ${whole} R ${remainder}, so ${improperN}/${d} = ${correct}.`,
  };
}

// ---------------------------------------------------------------------------
// g4-decimal-place: decimal place value (tenths, hundredths)
// ---------------------------------------------------------------------------
function genG4DecimalPlace(lesson: Lesson, ctx?: GenContext): Problem {
  const wholePart = randInt(1, 9);
  const tenths = randInt(1, 9);
  const hundredths = randInt(0, 9);
  const decimal = `${wholePart}.${tenths}${hundredths}`;
  const askTenths = Math.random() < 0.5;
  const correct = askTenths ? tenths : hundredths;
  const placeName = askTenths ? "tenths" : "hundredths";
  const useMC = Math.random() < 0.5;
  if (useMC) {
    const { choices, correctIndex } = numericChoices(correct);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `In the number ${decimal}, what digit is in the ${placeName} place?`,
      answerType: "multiple-choice",
      choices,
      correctIndex,
      hint: `The first digit after the decimal point is tenths, the second is hundredths.`,
      explanation: `In ${decimal}, the digit ${correct} is in the ${placeName} place.`,
    };
  }
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `In the number ${decimal}, what digit is in the ${placeName} place?`,
    answerType: "number",
    answer: correct,
    hint: `The first digit after the decimal point is tenths, the second is hundredths.`,
    explanation: `In ${decimal}, the digit ${correct} is in the ${placeName} place.`,
  };
}

// ---------------------------------------------------------------------------
// g4-compare-dec: compare decimals
// ---------------------------------------------------------------------------
function genG4CompareDec(lesson: Lesson, ctx?: GenContext): Problem {
  const allowEqual = Math.random() < 0.2;
  const a = randInt(10, 99) / 100;
  let b: number;
  if (allowEqual) {
    b = a;
  } else {
    b = randInt(10, 99) / 100;
    let guard = 0;
    while (b === a && guard < 20) {
      guard++;
      b = randInt(10, 99) / 100;
    }
  }
  const aStr = a.toFixed(2);
  const bStr = b.toFixed(2);
  const correct = a > b ? ">" : a < b ? "<" : "=";
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `Compare: ${aStr} ___ ${bStr}`,
    answerType: "multiple-choice",
    choices: ["<", "=", ">"],
    correctIndex: correct === "<" ? 0 : correct === "=" ? 1 : 2,
    hint: `Both have 2 decimal places. Compare the tenths digit first, then hundredths.`,
    explanation: `${aStr} and ${bStr} — ${correct === "=" ? "they are equal" : `${a > b ? aStr : bStr} is bigger`}, so ${aStr} ${correct} ${bStr}.`,
  };
}

// ---------------------------------------------------------------------------
// g4-add-dec: add/subtract decimals
// ---------------------------------------------------------------------------
function genG4AddDec(lesson: Lesson, ctx?: GenContext): Problem {
  const isSub = Math.random() < 0.4;
  const easy = ctx?.difficulty === "easy";
  const challenge = ctx?.difficulty === "challenge";
  const decimals = easy ? 1 : challenge ? 2 : Math.random() < 0.5 ? 1 : 2;
  const factor = decimals === 1 ? 10 : 100;
  let a = randInt(11, easy ? 50 : 99) / factor;
  let b = randInt(11, easy ? 50 : 99) / factor;
  if (isSub && b > a) [a, b] = [b, a];
  const result = round2(isSub ? a - b : a + b);
  const op = isSub ? "−" : "+";
  const aStr = a.toFixed(decimals);
  const bStr = b.toFixed(decimals);
  const resultStr = result.toFixed(decimals);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What is ${aStr} ${op} ${bStr}?`,
    answerType: "number",
    answer: result,
    hint: `Line up the decimal points! Add zeros if needed so both have ${decimals} decimal ${decimals === 1 ? "place" : "places"}.`,
    explanation: `${aStr} ${op} ${bStr} = ${resultStr}.`,
  };
}

// ---------------------------------------------------------------------------
// g4-frac-dec: convert fractions to decimals (MC)
// ---------------------------------------------------------------------------
const COMMON_FRAC_DEC: Array<{ n: number; d: number; dec: string }> = [
  { n: 1, d: 2, dec: "0.5" },
  { n: 1, d: 4, dec: "0.25" },
  { n: 3, d: 4, dec: "0.75" },
  { n: 1, d: 5, dec: "0.2" },
  { n: 2, d: 5, dec: "0.4" },
  { n: 3, d: 5, dec: "0.6" },
  { n: 4, d: 5, dec: "0.8" },
  { n: 1, d: 10, dec: "0.1" },
  { n: 3, d: 10, dec: "0.3" },
  { n: 7, d: 10, dec: "0.7" },
  { n: 1, d: 20, dec: "0.05" },
  { n: 1, d: 25, dec: "0.04" },
];
function genG4FracDec(lesson: Lesson, ctx?: GenContext): Problem {
  const item = pick(COMMON_FRAC_DEC);
  const correct = item.dec;
  const distractorSet = new Set<string>([correct]);
  for (const other of shuffle(COMMON_FRAC_DEC)) {
    if (other.dec !== correct) {
      distractorSet.add(other.dec);
      if (distractorSet.size === 4) break;
    }
  }
  // Near-miss fallback if pool too small.
  if (distractorSet.size < 4) {
    const near = round2(parseFloat(correct) + 0.1).toFixed(2);
    if (!distractorSet.has(near)) distractorSet.add(near);
  }
  const choices = shuffle([...distractorSet]).slice(0, 4);
  const correctIndex = choices.indexOf(correct);
  const visual: ProblemVisual = { kind: "fraction-bar", numerator: item.n, denominator: item.d };
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What is ${item.n}/${item.d} as a decimal?`,
    visual,
    answerType: "multiple-choice",
    choices,
    correctIndex,
    hint: `Divide the top by the bottom: ${item.n} ÷ ${item.d}.`,
    explanation: `${item.n} ÷ ${item.d} = ${correct}, so ${item.n}/${item.d} = ${correct}.`,
  };
}

// ---------------------------------------------------------------------------
// g4-money-dec: money word problems with decimals
// ---------------------------------------------------------------------------
interface MoneyTemplate {
  prompt: string;
  answer: number;
  hint: string;
  explanation: string;
}
function genG4MoneyDec(lesson: Lesson, ctx?: GenContext): Problem {
  const templates: Array<() => MoneyTemplate> = [
    // buy N items at $X each
    () => {
      const qty = randInt(2, 6);
      const price = pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.75]);
      const total = round2(qty * price);
      const item = pick(["apples", "pencils", "stickers", "cookies", "erasers", "bananas"]);
      return {
        prompt: `You buy ${qty} ${item} at $${price.toFixed(2)} each. How much do they cost in dollars?`,
        answer: total,
        hint: `Multiply ${qty} × $${price.toFixed(2)} = ?`,
        explanation: `${qty} × $${price.toFixed(2)} = $${total.toFixed(2)}.`,
      };
    },
    // total cost of two items
    () => {
      const p1 = pick([0.5, 0.75, 1.25, 1.5, 2.25, 0.99]);
      const p2 = pick([0.5, 0.75, 1.25, 1.5, 2.25, 0.99]);
      const total = round2(p1 + p2);
      const items = ["a notebook", "a pencil", "an eraser", "a marker", "a ruler"];
      const i1 = pick(items);
      let i2 = pick(items);
      while (i2 === i1) i2 = pick(items);
      return {
        prompt: `You buy ${i1} for $${p1.toFixed(2)} and ${i2} for $${p2.toFixed(2)}. How much in total (in dollars)?`,
        answer: total,
        hint: `Add: $${p1.toFixed(2)} + $${p2.toFixed(2)} = ?`,
        explanation: `$${p1.toFixed(2)} + $${p2.toFixed(2)} = $${total.toFixed(2)}.`,
      };
    },
    // change from $5 or $10
    () => {
      const paid = pick([5, 10]);
      const cost = paid === 5 ? randInt(100, 450) / 100 : randInt(200, 900) / 100;
      const change = round2(paid - cost);
      const item = pick(["a toy", "a book", "a snack", "a drink", "a puzzle"]);
      return {
        prompt: `You buy ${item} for $${cost.toFixed(2)} and pay with $${paid}. How much change do you get (in dollars)?`,
        answer: change,
        hint: `Subtract: $${paid} − $${cost.toFixed(2)} = ?`,
        explanation: `$${paid} − $${cost.toFixed(2)} = $${change.toFixed(2)}.`,
      };
    },
  ];
  const t = pick(templates)();
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: t.prompt,
    answerType: "number",
    answer: t.answer,
    unit: "dollars",
    hint: t.hint,
    explanation: t.explanation,
  };
}

// ---------------------------------------------------------------------------
// g4-area-perim: area and perimeter of rectangles (visual)
// ---------------------------------------------------------------------------
function genG4AreaPerim(lesson: Lesson, ctx?: GenContext): Problem {
  const askArea = Math.random() < 0.5;
  const w = randInt(3, 12);
  const h = randInt(3, 12);
  const visual: ProblemVisual = askArea
    ? { kind: "area-grid", rows: h, cols: w, shaded: false }
    : { kind: "perimeter", width: w, height: h, unit: "units" };
  const answer = askArea ? w * h : 2 * (w + h);
  const unit = askArea ? "sq units" : "units";
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `What is the ${askArea ? "area" : "perimeter"} of this rectangle? (${askArea ? "length × width" : "add all sides"})`,
    visual,
    answerType: "number",
    answer,
    unit,
    hint: askArea
      ? `Area = length × width = ${w} × ${h}.`
      : `Perimeter = 2 × (length + width) = 2 × (${w} + ${h}).`,
    explanation: askArea
      ? `Area = ${w} × ${h} = ${answer} ${unit}.`
      : `Perimeter = ${w} + ${h} + ${w} + ${h} = ${answer} ${unit}.`,
  };
}

// ---------------------------------------------------------------------------
// g4-angles: classify angles as acute/right/obtuse
// ---------------------------------------------------------------------------
function genG4Angles(lesson: Lesson, ctx?: GenContext): Problem {
  const type = pick(["acute", "right", "obtuse"]);
  let degrees: number;
  if (type === "acute") degrees = randInt(10, 89);
  else if (type === "right") degrees = 90;
  else degrees = randInt(91, 170);
  const correct = type.charAt(0).toUpperCase() + type.slice(1);
  const { choices, correctIndex } = choiceSet(correct, ["Acute", "Right", "Obtuse"], 3);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `An angle that measures ${degrees}° is what type?`,
    answerType: "multiple-choice",
    choices,
    correctIndex,
    hint: `Less than 90° = acute, exactly 90° = right, more than 90° (but less than 180°) = obtuse.`,
    explanation: `${degrees}° ${degrees < 90 ? "is less than 90°" : degrees === 90 ? "is exactly 90°" : "is more than 90°"}, so it's ${correct}.`,
  };
}

// ---------------------------------------------------------------------------
// g4-convert: convert measurements (m to cm, ft to in, etc.)
// ---------------------------------------------------------------------------
interface Conversion {
  from: string;
  to: string;
  factor: number;
  maxVal: number;
}
const CONVERSIONS: Conversion[] = [
  { from: "m", to: "cm", factor: 100, maxVal: 10 },
  { from: "m", to: "mm", factor: 1000, maxVal: 5 },
  { from: "km", to: "m", factor: 1000, maxVal: 5 },
  { from: "cm", to: "mm", factor: 10, maxVal: 20 },
  { from: "ft", to: "in", factor: 12, maxVal: 6 },
  { from: "yd", to: "ft", factor: 3, maxVal: 8 },
  { from: "lb", to: "oz", factor: 16, maxVal: 5 },
];
function genG4Convert(lesson: Lesson, ctx?: GenContext): Problem {
  const c = pick(CONVERSIONS);
  const value = randInt(2, c.maxVal);
  const answer = value * c.factor;
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `How many ${c.to} are in ${value} ${c.from}?`,
    answerType: "number",
    answer,
    unit: c.to,
    hint: `1 ${c.from} = ${c.factor} ${c.to}. Multiply!`,
    explanation: `${value} ${c.from} × ${c.factor} = ${answer} ${c.to}.`,
  };
}

// ---------------------------------------------------------------------------
// g4-classify-shapes: classify triangles/quadrilaterals (MC)
// ---------------------------------------------------------------------------
interface ShapeQuestion {
  question: string;
  answer: string;
  pool: string[];
}
const SHAPE_CLASSIFICATIONS: ShapeQuestion[] = [
  { question: "A triangle with all three sides equal is called what?", answer: "Equilateral", pool: ["Equilateral", "Isosceles", "Scalene", "Right"] },
  { question: "A triangle with two sides equal is called what?", answer: "Isosceles", pool: ["Equilateral", "Isosceles", "Scalene", "Right"] },
  { question: "A triangle with no sides equal is called what?", answer: "Scalene", pool: ["Equilateral", "Isosceles", "Scalene", "Right"] },
  { question: "A triangle with one 90° angle is called what?", answer: "Right", pool: ["Acute", "Right", "Obtuse", "Equilateral"] },
  { question: "A triangle with one angle greater than 90° is called what?", answer: "Obtuse", pool: ["Acute", "Right", "Obtuse", "Equilateral"] },
  { question: "A quadrilateral with 4 right angles and 4 equal sides is a what?", answer: "Square", pool: ["Square", "Rectangle", "Rhombus", "Trapezoid"] },
  { question: "A quadrilateral with 4 right angles (sides may differ) is a what?", answer: "Rectangle", pool: ["Square", "Rectangle", "Rhombus", "Trapezoid"] },
  { question: "A quadrilateral with 4 equal sides (no right angles) is a what?", answer: "Rhombus", pool: ["Square", "Rectangle", "Rhombus", "Trapezoid"] },
  { question: "A quadrilateral with exactly one pair of parallel sides is a what?", answer: "Trapezoid", pool: ["Square", "Parallelogram", "Rhombus", "Trapezoid"] },
  { question: "A quadrilateral with two pairs of parallel sides (no right angles) is a what?", answer: "Parallelogram", pool: ["Square", "Parallelogram", "Trapezoid", "Rectangle"] },
];
function shapeExplanation(name: string): string {
  const map: Record<string, string> = {
    Equilateral: "all 3 sides equal (and all angles 60°)",
    Isosceles: "at least 2 sides equal",
    Scalene: "no sides equal",
    Right: "one 90° angle",
    Acute: "all angles less than 90°",
    Obtuse: "one angle greater than 90°",
    Square: "4 right angles and 4 equal sides",
    Rectangle: "4 right angles (opposite sides equal)",
    Rhombus: "4 equal sides (no right angles)",
    Trapezoid: "exactly one pair of parallel sides",
    Parallelogram: "two pairs of parallel sides (no right angles)",
  };
  return map[name] ?? "";
}
function genG4ClassifyShapes(lesson: Lesson, ctx?: GenContext): Problem {
  const item = pick(SHAPE_CLASSIFICATIONS);
  const { choices, correctIndex } = choiceSet(item.answer, item.pool);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: item.question,
    answerType: "multiple-choice",
    choices,
    correctIndex,
    hint: `Think about sides (equal or not) and angles (right, acute, obtuse).`,
    explanation: `${item.answer}: ${shapeExplanation(item.answer)}.`,
  };
}

// ---------------------------------------------------------------------------
// g4-symmetry: identify lines of symmetry
// ---------------------------------------------------------------------------
const SYMMETRY_QUESTIONS: Array<{ shape: string; lines: number; emoji: string }> = [
  { shape: "square", lines: 4, emoji: "⬜" },
  { shape: "rectangle", lines: 2, emoji: "▭" },
  { shape: "equilateral triangle", lines: 3, emoji: "🔺" },
  { shape: "isosceles triangle", lines: 1, emoji: "🔺" },
  { shape: "scalene triangle", lines: 0, emoji: "🔺" },
  { shape: "regular pentagon", lines: 5, emoji: "⬠" },
  { shape: "regular hexagon", lines: 6, emoji: "⬡" },
  { shape: "heart", lines: 1, emoji: "❤️" },
  { shape: "letter A", lines: 1, emoji: "🅰" },
  { shape: "letter H", lines: 2, emoji: "🅷" },
  { shape: "letter X", lines: 2, emoji: "🅧" },
  { shape: "letter Z", lines: 0, emoji: "🅩" },
];
function genG4Symmetry(lesson: Lesson, ctx?: GenContext): Problem {
  const item = pick(SYMMETRY_QUESTIONS);
  const useMC = Math.random() < 0.4;
  const prompt = `How many lines of symmetry does a ${item.shape} have? ${item.emoji}`;
  const hint = `Imagine folding the shape in half — how many ways match perfectly?`;
  const explanation = `A ${item.shape} has ${item.lines} line${item.lines === 1 ? "" : "s"} of symmetry.`;
  if (useMC) {
    const { choices, correctIndex } = numericChoices(item.lines);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt,
      answerType: "multiple-choice",
      choices,
      correctIndex,
      hint,
      explanation,
    };
  }
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt,
    answerType: "number",
    answer: item.lines,
    hint,
    explanation,
  };
}

// ---------------------------------------------------------------------------
// g4-line-plots: line plots with fractions
// ---------------------------------------------------------------------------
function genG4LinePlots(lesson: Lesson, ctx?: GenContext): Problem {
  const fractions = [
    { label: "1/4", value: 0.25 },
    { label: "1/2", value: 0.5 },
    { label: "3/4", value: 0.75 },
    { label: "1", value: 1 },
  ];
  const counts: Record<string, number> = {};
  for (const f of fractions) {
    counts[f.label] = randInt(1, 5);
  }
  const totalCount = fractions.reduce((sum, f) => sum + counts[f.label], 0);
  // Find most common (and check for ties).
  let maxCount = 0;
  for (const f of fractions) {
    if (counts[f.label] > maxCount) maxCount = counts[f.label];
  }
  const maxLabels = fractions.filter((f) => counts[f.label] === maxCount).map((f) => f.label);
  const hasTie = maxLabels.length > 1;

  const description = `A line plot shows the lengths of pencils: ${counts["1/4"]} at 1/4 inch, ${counts["1/2"]} at 1/2 inch, ${counts["3/4"]} at 3/4 inch, and ${counts["1"]} at 1 inch.`;

  let questionType = pick(["total", "most", "longest"]);
  if (questionType === "most" && hasTie) {
    questionType = "total"; // avoid ambiguity
  }

  if (questionType === "total") {
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `${description} How many pencils were measured in all?`,
      answerType: "number",
      answer: totalCount,
      hint: `Add up all the X's: ${counts["1/4"]} + ${counts["1/2"]} + ${counts["3/4"]} + ${counts["1"]}.`,
      explanation: `Total pencils = ${counts["1/4"]} + ${counts["1/2"]} + ${counts["3/4"]} + ${counts["1"]} = ${totalCount}.`,
    };
  }
  if (questionType === "most") {
    const correctLabel = maxLabels[0];
    const correctStr = `${correctLabel} inch`;
    const choices = fractions.map((f) => `${f.label} inch`);
    const correctIndex = choices.indexOf(correctStr);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `${description} Which length was most common?`,
      answerType: "multiple-choice",
      choices,
      correctIndex,
      hint: `Look for the tallest stack of X's.`,
      explanation: `${correctLabel} inch has the most X's (${maxCount}), so it's the most common length.`,
    };
  }
  // longest
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `${description} What was the longest pencil length?`,
    answerType: "multiple-choice",
    choices: fractions.map((f) => `${f.label} inch`),
    correctIndex: 3,
    hint: `The longest pencil has the biggest length.`,
    explanation: `1 inch is the biggest length on the line plot, so the longest pencil is 1 inch.`,
  };
}

// ---------------------------------------------------------------------------
// g4-points-lines: points, lines, rays, segments, parallel/perpendicular
// ---------------------------------------------------------------------------
interface PointsLinesQuestion {
  question: string;
  answer: string;
  pool: string[];
}
const POINTS_LINES_QUESTIONS: PointsLinesQuestion[] = [
  { question: "What has two endpoints and a fixed length?", answer: "Line segment", pool: ["Line", "Ray", "Line segment", "Point"] },
  { question: "What goes on forever in both directions?", answer: "Line", pool: ["Line", "Ray", "Line segment", "Point"] },
  { question: "What starts at one point and goes on forever in one direction?", answer: "Ray", pool: ["Line", "Ray", "Line segment", "Point"] },
  { question: "What is a single spot in space (no size)?", answer: "Point", pool: ["Line", "Ray", "Line segment", "Point"] },
  { question: "Two lines that never meet are called what?", answer: "Parallel", pool: ["Parallel", "Perpendicular", "Intersecting", "Adjacent"] },
  { question: "Two lines that meet at a right angle are called what?", answer: "Perpendicular", pool: ["Parallel", "Perpendicular", "Intersecting", "Adjacent"] },
  { question: "Two lines that cross at any angle are called what?", answer: "Intersecting", pool: ["Parallel", "Perpendicular", "Intersecting", "Adjacent"] },
  { question: "How many degrees is a right angle?", answer: "90°", pool: ["45°", "90°", "180°", "360°"] },
  { question: "How many degrees is a straight angle?", answer: "180°", pool: ["90°", "180°", "270°", "360°"] },
  { question: "How many degrees in a full turn (a circle)?", answer: "360°", pool: ["90°", "180°", "270°", "360°"] },
];
function pointsLinesExplanation(answer: string): string {
  const map: Record<string, string> = {
    Line: "A line goes on forever in both directions.",
    Ray: "A ray has one endpoint and extends forever in one direction.",
    "Line segment": "A line segment has two endpoints and a fixed length.",
    Point: "A point is a single spot in space with no size.",
    Parallel: "Parallel lines never meet — they stay the same distance apart.",
    Perpendicular: "Perpendicular lines meet at a 90° angle.",
    Intersecting: "Intersecting lines cross at a point.",
    "90°": "A right angle is 90 degrees.",
    "180°": "A straight line makes a 180° angle.",
    "360°": "A full circle is 360 degrees.",
  };
  return map[answer] ?? "";
}
function genG4PointsLines(lesson: Lesson, ctx?: GenContext): Problem {
  const item = pick(POINTS_LINES_QUESTIONS);
  const { choices, correctIndex } = choiceSet(item.answer, item.pool);
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: item.question,
    answerType: "multiple-choice",
    choices,
    correctIndex,
    hint: `Think about the basic geometry terms: point, line, ray, segment, parallel, perpendicular.`,
    explanation: `${item.answer}. ${pointsLinesExplanation(item.answer)}`,
  };
}

// ---------------------------------------------------------------------------
// g4-coordinate-planes: identify coordinates
// ---------------------------------------------------------------------------
function genG4CoordinatePlanes(lesson: Lesson, ctx?: GenContext): Problem {
  const x = randInt(1, 8);
  const y = randInt(1, 8);
  if (Math.random() < 0.5) {
    // Multiple choice: which point is at (x, y)?
    const correct = `(${x}, ${y})`;
    const distractorSet = new Set<string>([correct]);
    const candidates = [
      `(${y}, ${x})`,
      `(${x + 1}, ${y})`,
      `(${x}, ${y + 1})`,
      `${x - 1 > 0 ? `(${x - 1}, ${y})` : `(${x + 2}, ${y})`}`,
      `${y - 1 > 0 ? `(${x}, ${y - 1})` : `(${x}, ${y + 2})`}`,
    ];
    for (const c of candidates) {
      if (!distractorSet.has(c)) {
        distractorSet.add(c);
        if (distractorSet.size === 4) break;
      }
    }
    const choices = shuffle([...distractorSet]).slice(0, 4);
    const correctIndex = choices.indexOf(correct);
    return {
      id: nextId(lesson.id),
      lessonId: lesson.id,
      prompt: `A point is ${x} spaces right and ${y} spaces up from the origin. What are its coordinates?`,
      answerType: "multiple-choice",
      choices,
      correctIndex,
      hint: `Coordinates are (x, y) — right first, then up.`,
      explanation: `Right is x, up is y. So the point is at (${x}, ${y}).`,
    };
  }
  // Number answer: x or y coordinate of a given point.
  const askX = Math.random() < 0.5;
  return {
    id: nextId(lesson.id),
    lessonId: lesson.id,
    prompt: `A point is at (${x}, ${y}). What is its ${askX ? "x-coordinate" : "y-coordinate"}?`,
    answerType: "number",
    answer: askX ? x : y,
    hint: `The x-coordinate is the first number, the y-coordinate is the second.`,
    explanation: `In (${x}, ${y}), the ${askX ? "x-coordinate" : "y-coordinate"} is ${askX ? x : y}.`,
  };
}

// ---------------------------------------------------------------------------
// Factory — maps generator keys to functions.
// ---------------------------------------------------------------------------
const G4_GENERATORS: Record<string, (lesson: Lesson, ctx?: GenContext) => Problem> = {
  "g4-mult-2x1": genG4Mult2x1,
  "g4-mult-2x2": genG4Mult2x2,
  "g4-long-division": genG4LongDivision,
  "g4-division-remainder": genG4DivisionRemainder,
  "g4-word-md": genG4WordMD,
  "g4-equiv-frac": genG4EquivFrac,
  "g4-compare-frac": genG4CompareFrac,
  "g4-add-frac": genG4AddFrac,
  "g4-mult-frac": genG4MultFrac,
  "g4-mixed-numbers": genG4MixedNumbers,
  "g4-decimal-place": genG4DecimalPlace,
  "g4-compare-dec": genG4CompareDec,
  "g4-add-dec": genG4AddDec,
  "g4-frac-dec": genG4FracDec,
  "g4-money-dec": genG4MoneyDec,
  "g4-area-perim": genG4AreaPerim,
  "g4-angles": genG4Angles,
  "g4-convert": genG4Convert,
  "g4-classify-shapes": genG4ClassifyShapes,
  "g4-symmetry": genG4Symmetry,
  "g4-line-plots": genG4LinePlots,
  "g4-points-lines": genG4PointsLines,
  "g4-coordinate-planes": genG4CoordinatePlanes,
};

export function generateGrade4Problems(
  lesson: Lesson,
  count: number,
  ctx?: GenContext
): Problem[] {
  const gen = G4_GENERATORS[lesson.generator];
  if (!gen) {
    throw new Error(`No grade-4 generator for lesson "${lesson.id}" (${lesson.generator})`);
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
