import type { Domain } from "@/lib/types";

// ============================================================================
// Math Stars — Preschool Curriculum (ages 3–5, Pre-K)
// Five playful domains covering counting, shapes, patterns, comparing, and
// a gentle first look at adding. Every lesson uses big visuals and very
// simple language, with read-aloud on every question.
// ============================================================================

export const PRESCHOOL_CURRICULUM: Domain[] = [
  // ==========================================================================
  // DOMAIN 1 — Counting & Numbers
  // ==========================================================================
  {
    id: "ps-counting",
    title: "Counting & Numbers",
    emoji: "🔢",
    color: "from-rose-400 to-pink-400",
    description: "Count, find, and order numbers.",
    lessons: [
      {
        id: "ps-count-1-5",
        title: "Count to 5",
        subtitle: "How many fingers? How many apples?",
        emoji: "🍎",
        practiceCount: 5,
        generator: "ps-count-objects",
        params: { max: 5 },
        teach: [
          {
            kind: "text",
            text: "Let's count together! When we count, we say one number for each thing. Touch each apple as you count: 1, 2, 3, 4, 5!",
          },
          {
            kind: "example",
            question: "How many apples are here? 🍎🍎🍎",
            answer: "3",
            text: "Point to each apple and count: 1... 2... 3! There are 3 apples.",
          },
          {
            kind: "tip",
            text: "Always count slowly and point to each thing. The last number you say is how many there are!",
          },
        ],
      },
      {
        id: "ps-count-1-10",
        title: "Count to 10",
        subtitle: "Bigger groups, same idea.",
        emoji: "🎈",
        practiceCount: 6,
        generator: "ps-count-objects",
        params: { max: 10 },
        teach: [
          {
            kind: "text",
            text: "Now let's count up to 10! 1, 2, 3, 4, 5, 6, 7, 8, 9, 10. Count each thing one at a time.",
          },
          {
            kind: "example",
            question: "How many balloons? 🎈🎈🎈🎈🎈🎈",
            answer: "6",
            text: "Touch each balloon and count: 1, 2, 3, 4, 5, 6. Six balloons!",
          },
        ],
      },
      {
        id: "ps-find-number",
        title: "Find the Number",
        subtitle: "Match a number to its name.",
        emoji: "🔍",
        practiceCount: 6,
        generator: "ps-find-number",
        teach: [
          {
            kind: "text",
            text: "Numbers have names and shapes. The number 5 looks like this: 5. Can you find the number I ask for?",
          },
          {
            kind: "example",
            question: "Which one is the number 3?",
            answer: "3",
            text: "Look for the shape that looks like 3. There it is!",
          },
        ],
      },
      {
        id: "ps-what-next",
        title: "What Comes Next?",
        subtitle: "Counting in order.",
        emoji: "➡️",
        practiceCount: 6,
        generator: "ps-what-next",
        teach: [
          {
            kind: "text",
            text: "When we count, numbers go in order: 1, 2, 3, 4, 5... After 3 comes 4. After 5 comes 6.",
          },
          {
            kind: "example",
            question: "What number comes after 4?",
            answer: "5",
            text: "Count up: 1, 2, 3, 4... the next one is 5!",
          },
          {
            kind: "tip",
            text: "Sing the counting song: 1, 2, 3, 4, 5... once you catch a fish alive!",
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // DOMAIN 2 — Shapes & Colors
  // ==========================================================================
  {
    id: "ps-shapes-colors",
    title: "Shapes & Colors",
    emoji: "🎨",
    color: "from-amber-400 to-orange-400",
    description: "Circles, squares, triangles, and rainbow fun.",
    lessons: [
      {
        id: "ps-shapes",
        title: "Shapes All Around",
        subtitle: "Circle, square, triangle, rectangle.",
        emoji: "⭕",
        practiceCount: 6,
        generator: "ps-shape-id",
        teach: [
          {
            kind: "text",
            text: "A circle is round like a ball. A square has 4 equal sides like a box. A triangle has 3 sides like a slice of pizza. A rectangle is like a door.",
          },
          {
            kind: "example",
            question: "Which shape is round with no corners?",
            answer: "Circle",
            text: "A circle is perfectly round. It has no straight sides!",
          },
          {
            kind: "tip",
            text: "Look around your room — can you find a circle? A square? Shapes are everywhere!",
          },
        ],
      },
      {
        id: "ps-colors",
        title: "Color Fun",
        subtitle: "Red, blue, yellow, and green.",
        emoji: "🌈",
        practiceCount: 6,
        generator: "ps-color-id",
        teach: [
          {
            kind: "text",
            text: "Colors are everywhere! A strawberry is red. The sky is blue. The sun is yellow. Grass is green.",
          },
          {
            kind: "example",
            question: "Which one is red?",
            answer: "The red one",
            text: "Red looks like a strawberry or a fire truck. Find the red shape!",
          },
        ],
      },
      {
        id: "ps-match-shape",
        title: "Match the Shape",
        subtitle: "Find the one that looks the same.",
        emoji: "🔳",
        practiceCount: 5,
        generator: "ps-match-shape",
        teach: [
          {
            kind: "text",
            text: "Some shapes look the same. When two things look alike, we say they match. Can you find the matching shape?",
          },
          {
            kind: "example",
            question: "Which one matches the triangle?",
            answer: "The triangle",
            text: "A triangle matches a triangle — both have 3 sides!",
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // DOMAIN 3 — Patterns
  // ==========================================================================
  {
    id: "ps-patterns",
    title: "Patterns",
    emoji: "🔴",
    color: "from-violet-400 to-purple-400",
    description: "What comes next in the row?",
    lessons: [
      {
        id: "ps-ab-pattern",
        title: "Color Patterns",
        subtitle: "Red, blue, red, blue...",
        emoji: "🔵",
        practiceCount: 6,
        generator: "ps-pattern-ab",
        teach: [
          {
            kind: "text",
            text: "A pattern repeats! Red, blue, red, blue... What do you think comes next? It goes back and forth!",
          },
          {
            kind: "example",
            question: "🔴 🔵 🔴 🔵 🔴 ... what comes next?",
            answer: "🔵 (blue)",
            text: "The pattern is red, blue, red, blue, red... so BLUE comes next!",
          },
          {
            kind: "tip",
            text: "Say the pattern out loud: red, blue, red, blue... it helps you hear what's next!",
          },
        ],
      },
      {
        id: "ps-abc-pattern",
        title: "Shape Patterns",
        subtitle: "Three things in a row.",
        emoji: "🔺",
        practiceCount: 6,
        generator: "ps-pattern-abc",
        teach: [
          {
            kind: "text",
            text: "Some patterns have three things that repeat: circle, square, triangle, circle, square, triangle...",
          },
          {
            kind: "example",
            question: "⭕ 🔲 🔺 ⭕ 🔲 ... what comes next?",
            answer: "🔺 (triangle)",
            text: "The pattern is circle, square, triangle, repeating. After square comes triangle!",
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // DOMAIN 4 — Comparing
  // ==========================================================================
  {
    id: "ps-comparing",
    title: "Comparing",
    emoji: "⚖️",
    color: "from-teal-400 to-cyan-400",
    description: "More, less, big, small, same, different.",
    lessons: [
      {
        id: "ps-more-less",
        title: "More or Less",
        subtitle: "Which group has more?",
        emoji: "🍎",
        practiceCount: 6,
        generator: "ps-more-less",
        teach: [
          {
            kind: "text",
            text: "When one group has extra, it has MORE. When one group has fewer, it has LESS. Count both and compare!",
          },
          {
            kind: "example",
            question: "Which has more — 5 apples or 2 apples?",
            answer: "5 apples",
            text: "5 is bigger than 2, so 5 apples is MORE.",
          },
        ],
      },
      {
        id: "ps-big-small",
        title: "Big and Small",
        subtitle: "Which one is bigger?",
        emoji: "🐘",
        practiceCount: 5,
        generator: "ps-big-small",
        teach: [
          {
            kind: "text",
            text: "Some things are BIG, like an elephant. Some things are SMALL, like a mouse. Look at the sizes!",
          },
          {
            kind: "example",
            question: "Which is bigger — an elephant or a mouse?",
            answer: "Elephant",
            text: "An elephant is much bigger than a mouse!",
          },
        ],
      },
      {
        id: "ps-same-different",
        title: "Same or Different",
        subtitle: "Which one doesn't match?",
        emoji: "🔍",
        practiceCount: 5,
        generator: "ps-same-different",
        teach: [
          {
            kind: "text",
            text: "When things look alike, they are the SAME. When one is odd, it is DIFFERENT. Find the one that's different!",
          },
          {
            kind: "example",
            question: "🔴 🔴 🔵 🔴 — which is different?",
            answer: "🔵 (the blue one)",
            text: "Three are red and one is blue. The blue one is DIFFERENT!",
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // DOMAIN 5 — First Math
  // ==========================================================================
  {
    id: "ps-first-math",
    title: "First Math",
    emoji: "✨",
    color: "from-fuchsia-400 to-pink-400",
    description: "One more, adding, and sorting.",
    lessons: [
      {
        id: "ps-one-more",
        title: "One More",
        subtitle: "Add just one more!",
        emoji: "➕",
        practiceCount: 6,
        generator: "ps-one-more",
        teach: [
          {
            kind: "text",
            text: "If you have 3 cookies and get 1 more, you have 4! Adding one more is just counting up by one.",
          },
          {
            kind: "example",
            question: "You have 4 stars ⭐⭐⭐⭐. Add 1 more. How many now?",
            answer: "5",
            text: "Count up one: 4... 5! Now you have 5 stars.",
          },
        ],
      },
      {
        id: "ps-add-5",
        title: "Adding within 5",
        subtitle: "Put two groups together.",
        emoji: "🍪",
        practiceCount: 6,
        generator: "ps-add-5",
        teach: [
          {
            kind: "text",
            text: "Adding means putting groups together. 2 cookies and 2 more cookies = 4 cookies! Count them all.",
          },
          {
            kind: "example",
            question: "2 apples + 3 apples = ?",
            answer: "5",
            text: "Count: 1, 2... 3, 4, 5. Two plus three is five!",
          },
          {
            kind: "tip",
            text: "Use your fingers! Hold up 2 fingers on one hand and 3 on the other. Count them all.",
          },
        ],
      },
      {
        id: "ps-sorting",
        title: "Sorting",
        subtitle: "Which one belongs?",
        emoji: "🗃️",
        practiceCount: 5,
        generator: "ps-sorting",
        teach: [
          {
            kind: "text",
            text: "Sorting means putting things in groups that are the same. All the circles together, all the squares together!",
          },
          {
            kind: "example",
            question: "Which one belongs with the circles?",
            answer: "The circle",
            text: "Circles go with circles. Find the round one!",
          },
        ],
      },
    ],
  },
];

export const PRESCHOOL_LESSON_IDS = PRESCHOOL_CURRICULUM.flatMap((d) =>
  d.lessons.map((l) => l.id)
);

export const PRESCHOOL_TOTAL_LESSONS = PRESCHOOL_LESSON_IDS.length;

// Per-domain sequential unlock for preschool (mirrors the grade-3 helper).
export function psPrerequisiteLessonId(lessonId: string): string | null {
  for (const domain of PRESCHOOL_CURRICULUM) {
    const idx = domain.lessons.findIndex((l) => l.id === lessonId);
    if (idx === -1) continue;
    if (idx === 0) return null;
    return domain.lessons[idx - 1].id;
  }
  return null;
}

export function psIsLessonAvailable(
  lessonId: string,
  isCompleted: (id: string) => boolean
): boolean {
  const prereq = psPrerequisiteLessonId(lessonId);
  if (prereq === null) return true;
  return isCompleted(prereq);
}

export function findPsLesson(lessonId: string) {
  for (const domain of PRESCHOOL_CURRICULUM) {
    const lesson = domain.lessons.find((l) => l.id === lessonId);
    if (lesson) return { lesson, domain };
  }
  return null;
}

export function findPsDomain(domainId: string) {
  return PRESCHOOL_CURRICULUM.find((d) => d.id === domainId) ?? null;
}
