import type { Domain } from "@/lib/types";

// ============================================================================
// Math Stars — 1st Grade Curriculum (US Common Core, ages 6–7)
// Five domains covering addition & subtraction within 20, place value to 120,
// measurement & data, geometry with early fractions, and number logic
// (number lines, missing addends, balanced thinking, and patterns).
// ============================================================================

export const GRADE1_CURRICULUM: Domain[] = [
  // ==========================================================================
  // DOMAIN 1 — Addition & Subtraction within 20
  // ==========================================================================
  {
    id: "g1-add-sub",
    title: "Addition & Subtraction",
    emoji: "➕",
    color: "from-rose-400 to-orange-400",
    description: "Add and subtract within 20, make 10, and solve word problems.",
    lessons: [
      {
        id: "g1-add-to-10",
        title: "Adding within 10",
        subtitle: "Put two groups together and count.",
        emoji: "🍎",
        practiceCount: 6,
        generator: "g1-add-to-10",
        params: { max: 10 },
        teach: [
          {
            kind: "text",
            text: "Adding means putting groups together. If you have 3 apples 🍎🍎🍎 and a friend gives you 2 more 🍎🍎, you count them all: 1, 2, 3... 4, 5. So 3 + 2 = 5!",
          },
          {
            kind: "example",
            question: "4 + 3 = ?",
            answer: "7",
            text: "Start at 4 and count up 3 more: 5, 6, 7. So 4 + 3 = 7!",
          },
          {
            kind: "tip",
            text: "You can use your fingers, count out loud, or draw dots to help you add.",
          },
        ],
      },
      {
        id: "g1-sub-from-10",
        title: "Subtracting within 10",
        subtitle: "Take some away and see what's left.",
        emoji: "🍪",
        practiceCount: 6,
        generator: "g1-sub-from-10",
        params: { max: 10 },
        teach: [
          {
            kind: "text",
            text: "Subtracting means taking away. If you have 8 cookies 🍪🍪🍪🍪🍪🍪🍪🍪 and you eat 3, you cross out 3 and count what's left: 5. So 8 − 3 = 5!",
          },
          {
            kind: "example",
            question: "7 − 2 = ?",
            answer: "5",
            text: "Start at 7 and count back 2: 6, 5. So 7 − 2 = 5!",
          },
          {
            kind: "tip",
            text: "Counting backward is just like counting forward — but going down! 7, 6, 5...",
          },
        ],
      },
      {
        id: "g1-word-add",
        title: "Word Problems within 10",
        subtitle: "Stories that use adding and subtracting.",
        emoji: "📖",
        practiceCount: 6,
        generator: "g1-word-add",
        teach: [
          {
            kind: "text",
            text: "A word problem tells a little story, then asks a math question. Listen for words like 'more', 'altogether', or 'in all' — they usually mean ADD. Words like 'left', 'ate', or 'gave away' usually mean SUBTRACT.",
          },
          {
            kind: "example",
            question: "Mia has 4 🐠 fish. She gets 3 more. How many fish does Mia have altogether?",
            answer: "7",
            text: "'Altogether' means add: 4 + 3 = 7. Mia has 7 fish!",
          },
          {
            kind: "tip",
            text: "Picture the story in your head. Draw the items if it helps you count!",
          },
        ],
      },
      {
        id: "g1-add-3",
        title: "Add Three Numbers",
        subtitle: "Stack up three small groups.",
        emoji: "🎯",
        practiceCount: 6,
        generator: "g1-add-3",
        teach: [
          {
            kind: "text",
            text: "Sometimes we add three numbers together! The trick: look for two numbers that make 10 first. 3 + 7 = 10, then 10 + 2 = 12. Easy!",
          },
          {
            kind: "example",
            question: "2 + 4 + 3 = ?",
            answer: "9",
            text: "Add the first two: 2 + 4 = 6. Then add the third: 6 + 3 = 9. So 2 + 4 + 3 = 9!",
          },
          {
            kind: "tip",
            text: "You can add in any order. Try the easiest pair first — like numbers that make 10.",
          },
        ],
      },
      {
        id: "g1-make-10",
        title: "Make 10",
        subtitle: "What number makes ten?",
        emoji: "🔟",
        practiceCount: 6,
        generator: "g1-make-10",
        teach: [
          {
            kind: "text",
            text: "Pairs that add to 10 are best friends! 1+9, 2+8, 3+7, 4+6, 5+5. If you know one friend, you know the other.",
          },
          {
            kind: "example",
            question: "6 + ? = 10",
            answer: "4",
            text: "Think: 6 and what make 10? Count up from 6: 7, 8, 9, 10 — that's 4 more. So 6 + 4 = 10!",
          },
          {
            kind: "tip",
            text: "Use your fingers! Hold up 6 fingers, then count how many more you need to make 10.",
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // DOMAIN 2 — Place Value & Numbers to 120
  // ==========================================================================
  {
    id: "g1-place",
    title: "Place Value to 120",
    emoji: "💯",
    color: "from-amber-400 to-yellow-400",
    description: "Tens and ones, count to 120, compare, and 10 more/10 less.",
    lessons: [
      {
        id: "g1-tens-ones",
        title: "Tens and Ones",
        subtitle: "Two-digit numbers are made of tens and ones.",
        emoji: "🧱",
        practiceCount: 6,
        generator: "g1-tens-ones",
        teach: [
          {
            kind: "text",
            text: "Every two-digit number is made of TENS and ONES. In 24, the '2' means 2 tens (twenty) and the '4' means 4 ones. So 24 = 20 + 4!",
          },
          {
            kind: "example",
            question: "How many tens are in 36?",
            answer: "3",
            text: "The left digit is the tens place. In 36, the '3' is in the tens place, so there are 3 tens (or 30).",
          },
          {
            kind: "tip",
            text: "Think of tens as sticks of 10 blocks and ones as single blocks. 36 = 3 sticks + 6 single blocks.",
          },
        ],
      },
      {
        id: "g1-count-120",
        title: "Counting to 120",
        subtitle: "Count forward from any number.",
        emoji: "🔢",
        practiceCount: 6,
        generator: "g1-count-120",
        teach: [
          {
            kind: "text",
            text: "We can count all the way to 120! After 99 comes 100. After 109 comes 110. After 119 comes 120. The pattern keeps going up by 1.",
          },
          {
            kind: "example",
            question: "What number comes right after 47?",
            answer: "48",
            text: "Count up by 1: 47... 48! The ones digit goes up by one.",
          },
          {
            kind: "tip",
            text: "When the ones digit is a 9, the next number bumps the tens digit up. 49 → 50, 59 → 60, 99 → 100!",
          },
        ],
      },
      {
        id: "g1-compare-num",
        title: "Compare Numbers",
        subtitle: "Which is greater? Which is less?",
        emoji: "⚖️",
        practiceCount: 6,
        generator: "g1-compare-num",
        teach: [
          {
            kind: "text",
            text: "To compare two numbers, look at the TENS first. More tens = bigger number. If the tens are the same, look at the ones.",
          },
          {
            kind: "example",
            question: "Which is greater: 42 or 47?",
            answer: "47",
            text: "Both have 4 tens. Compare the ones: 7 is bigger than 2. So 47 > 42.",
          },
          {
            kind: "tip",
            text: "The symbol > opens toward the bigger number. 5 > 3 means 5 is greater than 3.",
          },
        ],
      },
      {
        id: "g1-ten-more",
        title: "10 More, 10 Less",
        subtitle: "Jump up or down by ten.",
        emoji: "🪜",
        practiceCount: 6,
        generator: "g1-ten-more",
        teach: [
          {
            kind: "text",
            text: "Adding 10 means jumping up one row on a hundreds chart — only the tens digit changes! 23 + 10 = 33. Subtracting 10 means jumping down: 23 − 10 = 13.",
          },
          {
            kind: "example",
            question: "What is 10 more than 45?",
            answer: "55",
            text: "Add 1 to the tens digit: 45 → 55. The ones digit stays the same!",
          },
          {
            kind: "tip",
            text: "Picture a hundreds chart. Moving down a square adds 10. Moving up subtracts 10.",
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // DOMAIN 3 — Measurement & Data
  // ==========================================================================
  {
    id: "g1-measure",
    title: "Measurement & Data",
    emoji: "📏",
    color: "from-emerald-400 to-teal-400",
    description: "Length, telling time, money, and simple data.",
    lessons: [
      {
        id: "g1-length",
        title: "Longer or Shorter",
        subtitle: "Compare how long things are.",
        emoji: "📐",
        practiceCount: 6,
        generator: "g1-length",
        teach: [
          {
            kind: "text",
            text: "We can compare lengths! A pencil is SHORTER than a ruler. A school bus is LONGER than a bicycle. Line things up at the same starting line to compare.",
          },
          {
            kind: "example",
            question: "Which is longer: a pencil or a school bus?",
            answer: "School bus",
            text: "A school bus is much longer than a pencil!",
          },
          {
            kind: "tip",
            text: "To compare two objects, line them up side by side with their bottoms even — then see which sticks out farther.",
          },
        ],
      },
      {
        id: "g1-time-hour",
        title: "Time to the Hour",
        subtitle: "Read o'clock times on a clock.",
        emoji: "🕐",
        practiceCount: 6,
        generator: "g1-time-hour",
        teach: [
          {
            kind: "text",
            text: "A clock has a short hour hand and a long minute hand. When the minute hand points straight up at the 12, the time is 'o'clock'. The hour hand tells us which hour!",
          },
          {
            kind: "example",
            question: "The hour hand points at 3 and the minute hand points at 12. What time is it?",
            answer: "3:00",
            text: "Hour = 3, minutes = 0. So it's 3 o'clock, or 3:00!",
          },
          {
            kind: "tip",
            text: "On the hour, the minute hand is always at the top (the 12). Just read where the short hour hand points!",
          },
        ],
      },
      {
        id: "g1-time-half",
        title: "Time to the Half Hour",
        subtitle: "Read half-past times on a clock.",
        emoji: "🕜",
        practiceCount: 6,
        generator: "g1-time-half",
        teach: [
          {
            kind: "text",
            text: "When the minute hand points straight down at the 6, it's 'half past' the hour. The hour hand moves halfway between two numbers. Half past 3 is 3:30.",
          },
          {
            kind: "example",
            question: "The hour hand is halfway between 4 and 5, and the minute hand points at 6. What time is it?",
            answer: "4:30",
            text: "Hour = 4, minutes = 30. So it's half past 4, or 4:30!",
          },
          {
            kind: "tip",
            text: "30 minutes is half of an hour. That's why we say 'half past'!",
          },
        ],
      },
      {
        id: "g1-money",
        title: "Counting Coins",
        subtitle: "Pennies, nickels, and dimes.",
        emoji: "🪙",
        practiceCount: 6,
        generator: "g1-money",
        teach: [
          {
            kind: "text",
            text: "A PENNY is worth 1¢. A NICKEL is worth 5¢ (same as 5 pennies). A DIME is worth 10¢ (same as 10 pennies). Dimes are smallest but worth the most!",
          },
          {
            kind: "example",
            question: "You have 2 dimes and 3 pennies. How many cents is that?",
            answer: "23",
            text: "2 dimes = 20¢. 3 pennies = 3¢. 20 + 3 = 23¢!",
          },
          {
            kind: "tip",
            text: "Count the biggest coins first (dimes), then nickels, then pennies. Add them up like adding numbers!",
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // DOMAIN 4 — Geometry
  // ==========================================================================
  {
    id: "g1-geometry",
    title: "Geometry & Fractions",
    emoji: "🔷",
    color: "from-sky-400 to-indigo-400",
    description: "Solid 3D shapes and equal shares (halves and fourths).",
    lessons: [
      {
        id: "g1-shapes-3d",
        title: "Solid Shapes",
        subtitle: "Sphere, cube, cone, and cylinder.",
        emoji: "🧊",
        practiceCount: 6,
        generator: "g1-shapes-3d",
        teach: [
          {
            kind: "text",
            text: "Some shapes are flat (like a circle), but some are SOLID — they pop out! A SPHERE is round like a ball. A CUBE has 6 square faces like a dice. A CONE has a point like an ice cream cone. A CYLINDER has two circles like a can.",
          },
          {
            kind: "example",
            question: "What solid shape is a soccer ball?",
            answer: "Sphere",
            text: "A soccer ball is round all the way around — that's a sphere!",
          },
          {
            kind: "tip",
            text: "Look around your home: a dice is a cube, a can of beans is a cylinder, a party hat is a cone, a ball is a sphere!",
          },
        ],
      },
      {
        id: "g1-halves",
        title: "Halves and Fourths",
        subtitle: "Cut shapes into equal shares.",
        emoji: "🍕",
        practiceCount: 6,
        generator: "g1-halves",
        teach: [
          {
            kind: "text",
            text: "When we share a shape fairly, we cut it into EQUAL parts. Cutting into 2 equal parts makes HALVES. Cutting into 4 equal parts makes FOURTHS (or quarters).",
          },
          {
            kind: "example",
            question: "A pizza is cut into 2 equal slices. What are the slices called?",
            answer: "Halves",
            text: "Two equal parts = halves! Each slice is one-half of the pizza.",
          },
          {
            kind: "tip",
            text: "Make sure all parts are the SAME size — that's what 'equal' means. Otherwise it's not fair sharing!",
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // DOMAIN 5 — Number Logic
  // ==========================================================================
  {
    id: "g1-logic",
    title: "Number Logic",
    emoji: "🧩",
    color: "from-fuchsia-400 to-purple-400",
    description: "Number lines, missing addends, and patterns.",
    lessons: [
      {
        id: "g1-number-line",
        title: "Number Line to 20",
        subtitle: "Find numbers on a number line.",
        emoji: "➖",
        practiceCount: 6,
        generator: "g1-number-line",
        teach: [
          {
            kind: "text",
            text: "A number line is like a ruler for numbers. Numbers get bigger as you move right and smaller as you move left. Each mark is one more than the last.",
          },
          {
            kind: "example",
            question: "A dot is 7 marks after 0 on a number line. What number is it?",
            answer: "7",
            text: "Count the jumps from 0: 1, 2, 3, 4, 5, 6, 7. The dot is at 7!",
          },
          {
            kind: "tip",
            text: "Start at 0 and count each tick mark one by one until you reach the dot.",
          },
        ],
      },
      {
        id: "g1-missing-addend",
        title: "Missing Addends",
        subtitle: "Find the hidden number.",
        emoji: "❓",
        practiceCount: 6,
        generator: "g1-missing-addend",
        teach: [
          {
            kind: "text",
            text: "Sometimes one number hides! Like 5 + ? = 8. To find it, think: 'How do I get from 5 to 8?' Count up: 6, 7, 8 — that's 3 jumps. So 5 + 3 = 8!",
          },
          {
            kind: "example",
            question: "4 + ? = 9",
            answer: "5",
            text: "Count up from 4 to 9: 5, 6, 7, 8, 9 — that's 5 jumps. So 4 + 5 = 9!",
          },
          {
            kind: "tip",
            text: "Use your fingers! Start at the smaller number and raise a finger for each count up to the bigger number.",
          },
        ],
      },
      {
        id: "g1-patterns",
        title: "Number Patterns",
        subtitle: "Count by 2s, 5s, and 10s.",
        emoji: "🌀",
        practiceCount: 6,
        generator: "g1-patterns",
        teach: [
          {
            kind: "text",
            text: "Numbers can make patterns! Count by 2s: 2, 4, 6, 8, 10. Count by 5s: 5, 10, 15, 20, 25. Count by 10s: 10, 20, 30, 40, 50. Each pattern skips the same amount.",
          },
          {
            kind: "example",
            question: "What comes next: 2, 4, 6, 8, ?",
            answer: "10",
            text: "Count by 2s: each number is 2 more. After 8 comes 10!",
          },
          {
            kind: "tip",
            text: "Look at the gap between the first two numbers — that tells you how much to skip by!",
          },
        ],
      },
    ],
  },
];

export const GRADE1_LESSON_IDS = GRADE1_CURRICULUM.flatMap((d) =>
  d.lessons.map((l) => l.id)
);

export const GRADE1_TOTAL_LESSONS = GRADE1_LESSON_IDS.length;

// Per-domain sequential unlock for 1st grade (mirrors the preschool helper).
export function prerequisiteLessonId(lessonId: string): string | null {
  for (const domain of GRADE1_CURRICULUM) {
    const idx = domain.lessons.findIndex((l) => l.id === lessonId);
    if (idx === -1) continue;
    if (idx === 0) return null;
    return domain.lessons[idx - 1].id;
  }
  return null;
}

export function isLessonAvailable(
  lessonId: string,
  isCompleted: (id: string) => boolean
): boolean {
  const prereq = prerequisiteLessonId(lessonId);
  if (prereq === null) return true;
  return isCompleted(prereq);
}

export function findG1Lesson(lessonId: string) {
  for (const domain of GRADE1_CURRICULUM) {
    const lesson = domain.lessons.find((l) => l.id === lessonId);
    if (lesson) return { lesson, domain };
  }
  return null;
}

export function findG1Domain(domainId: string) {
  return GRADE1_CURRICULUM.find((d) => d.id === domainId) ?? null;
}
