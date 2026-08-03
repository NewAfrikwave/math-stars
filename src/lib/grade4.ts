import type { Domain } from "@/lib/types";

// ============================================================================
// Math Stars — 4th Grade Curriculum (ages 9–10)
// Five domains covering multi-digit multiplication & division, fractions,
// decimals, measurement & data, and geometry — aligned to US Common Core.
// ============================================================================

export const GRADE4_CURRICULUM: Domain[] = [
  // ==========================================================================
  // DOMAIN 1 — Multi-Digit Multiplication & Division
  // ==========================================================================
  {
    id: "g4-mult-div",
    title: "Multiplication & Division",
    emoji: "✖️",
    color: "from-indigo-400 to-violet-500",
    description: "Bigger numbers: 2-digit factors and long division.",
    lessons: [
      {
        id: "g4-mult-2x1",
        title: "2-Digit × 1-Digit",
        subtitle: "Multiply a 2-digit number by a single digit.",
        emoji: "🔢",
        practiceCount: 5,
        generator: "g4-mult-2x1",
        teach: [
          {
            kind: "text",
            text: "To multiply a 2-digit number by a 1-digit number, break it into tens and ones. For 34 × 6: think 30 × 6 = 180 and 4 × 6 = 24, then add: 180 + 24 = 204.",
          },
          {
            kind: "example",
            question: "What is 23 × 4?",
            answer: "92",
            text: "Break it apart: 20 × 4 = 80 and 3 × 4 = 12. Add them: 80 + 12 = 92.",
          },
          {
            kind: "tip",
            text: "You can also stack it: multiply the ones first, then the tens. Don't forget to carry over when a column is 10 or more!",
          },
        ],
      },
      {
        id: "g4-mult-2x2",
        title: "2-Digit × 2-Digit",
        subtitle: "Bigger multiplication with the area model.",
        emoji: "📦",
        practiceCount: 5,
        generator: "g4-mult-2x2",
        teach: [
          {
            kind: "text",
            text: "To multiply two 2-digit numbers, use the area model. For 24 × 13: split into 20 + 4 and 10 + 3. Multiply each pair: 20×10 = 200, 20×3 = 60, 4×10 = 40, 4×3 = 12. Add them up: 200 + 60 + 40 + 12 = 312.",
          },
          {
            kind: "example",
            question: "What is 31 × 12?",
            answer: "372",
            text: "31 × 10 = 310, and 31 × 2 = 62. Add: 310 + 62 = 372.",
          },
          {
            kind: "tip",
            text: "Stack and multiply step by step: first multiply by the ones digit, then by the tens digit (shifted one place left), then add.",
          },
        ],
      },
      {
        id: "g4-long-division",
        title: "Long Division",
        subtitle: "Divide 3-digit numbers by 1-digit.",
        emoji: "➗",
        practiceCount: 5,
        generator: "g4-long-division",
        teach: [
          {
            kind: "text",
            text: "Long division uses the steps: Divide, Multiply, Subtract, Bring down. For 144 ÷ 6: 14 ÷ 6 = 2 (write 2, 2×6 = 12, 14 − 12 = 2), bring down the 4 to make 24, 24 ÷ 6 = 4. Answer: 24.",
          },
          {
            kind: "example",
            question: "What is 156 ÷ 4?",
            answer: "39",
            text: "15 ÷ 4 = 3 (12), 15 − 12 = 3, bring down 6 → 36 ÷ 4 = 9. So 156 ÷ 4 = 39.",
          },
          {
            kind: "tip",
            text: "Check your answer: quotient × divisor should equal the dividend. 39 × 4 = 156. ✓",
          },
        ],
      },
      {
        id: "g4-division-remainder",
        title: "Division with Remainders",
        subtitle: "When numbers don't divide evenly.",
        emoji: "🍭",
        practiceCount: 5,
        generator: "g4-division-remainder",
        teach: [
          {
            kind: "text",
            text: "Sometimes a number doesn't divide evenly. The leftover is the remainder. 17 ÷ 5 = 3 R 2, because 5 × 3 = 15, and 17 − 15 = 2 left over.",
          },
          {
            kind: "example",
            question: "What is 23 ÷ 4?",
            answer: "5 R 3",
            text: "4 × 5 = 20, and 23 − 20 = 3. So 23 ÷ 4 = 5 R 3.",
          },
          {
            kind: "tip",
            text: "The remainder is always smaller than the divisor. If it's not, you can divide one more time!",
          },
        ],
      },
      {
        id: "g4-word-md",
        title: "Multi-Step Word Problems",
        subtitle: "Multiply, then divide — sometimes both!",
        emoji: "🧩",
        practiceCount: 5,
        generator: "g4-word-md",
        teach: [
          {
            kind: "text",
            text: "Some word problems need more than one step. Read carefully: figure out what to do first, then what to do next. Often you multiply first, then add, subtract, or divide.",
          },
          {
            kind: "example",
            question: "A baker packs 6 muffins in each box. He baked 144 muffins and sold 4 boxes. How many muffins are left?",
            answer: "120",
            text: "First find how many boxes: 144 ÷ 6 = 24 boxes. Then how many he sold: 4 × 6 = 24 muffins. Finally, 144 − 24 = 120 muffins left.",
          },
          {
            kind: "tip",
            text: "Underline the numbers and circle the question. Draw a picture if it helps!",
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // DOMAIN 2 — Fractions
  // ==========================================================================
  {
    id: "g4-fractions",
    title: "Fractions",
    emoji: "🍕",
    color: "from-amber-400 to-orange-500",
    description: "Equivalent, compare, add, and multiply fractions.",
    lessons: [
      {
        id: "g4-equiv-frac",
        title: "Equivalent Fractions",
        subtitle: "Same amount, different numbers.",
        emoji: "🥧",
        practiceCount: 5,
        generator: "g4-equiv-frac",
        teach: [
          {
            kind: "text",
            text: "Equivalent fractions look different but show the same amount. Multiply or divide both the top and bottom by the same number: 1/2 = 2/4 = 3/6 = 4/8.",
          },
          {
            kind: "example",
            question: "What fraction is equivalent to 2/3?",
            answer: "4/6",
            text: "Multiply top and bottom by 2: 2×2 = 4, 3×2 = 6. So 2/3 = 4/6.",
          },
          {
            kind: "tip",
            text: "Whatever you do to the top, do to the bottom — that keeps the fraction the same value!",
          },
        ],
      },
      {
        id: "g4-compare-frac",
        title: "Comparing Fractions",
        subtitle: "Which is bigger? Use common denominators.",
        emoji: "⚖️",
        practiceCount: 5,
        generator: "g4-compare-frac",
        teach: [
          {
            kind: "text",
            text: "To compare fractions with different denominators, find a common denominator. To compare 1/3 and 1/4, change them to 4/12 and 3/12. Now you can see 1/3 is bigger!",
          },
          {
            kind: "example",
            question: "Which is greater: 2/3 or 3/4?",
            answer: "3/4",
            text: "Common denominator is 12. 2/3 = 8/12 and 3/4 = 9/12. Since 9 > 8, 3/4 is greater.",
          },
          {
            kind: "tip",
            text: "If the numerators are the same (like 1/3 and 1/4), the smaller denominator wins — 1/3 is bigger than 1/4.",
          },
        ],
      },
      {
        id: "g4-add-frac",
        title: "Add & Subtract Fractions",
        subtitle: "Same denominator — just add the tops!",
        emoji: "➕",
        practiceCount: 6,
        generator: "g4-add-frac",
        teach: [
          {
            kind: "text",
            text: "When fractions have the same denominator, just add or subtract the top numbers (numerators). The bottom number (denominator) stays the same. 2/5 + 1/5 = 3/5.",
          },
          {
            kind: "example",
            question: "What is 3/8 + 2/8?",
            answer: "5/8",
            text: "Same denominator: add the tops. 3 + 2 = 5, denominator stays 8. Answer: 5/8.",
          },
          {
            kind: "tip",
            text: "Don't add the denominators! They tell you what size the pieces are — they stay the same.",
          },
        ],
      },
      {
        id: "g4-mult-frac",
        title: "Fraction × Whole Number",
        subtitle: "Repeated addition of a fraction.",
        emoji: "✖️",
        practiceCount: 5,
        generator: "g4-mult-frac",
        teach: [
          {
            kind: "text",
            text: "To multiply a fraction by a whole number, multiply the whole number by the top (numerator). The denominator stays the same. 3 × 2/5 = 6/5.",
          },
          {
            kind: "example",
            question: "What is 4 × 1/3?",
            answer: "4/3",
            text: "Multiply 4 by the numerator 1: 4 × 1 = 4. Denominator stays 3. Answer: 4/3 (which is 1 1/3).",
          },
          {
            kind: "tip",
            text: "You can think of it as adding the fraction that many times: 4 × 1/3 = 1/3 + 1/3 + 1/3 + 1/3 = 4/3.",
          },
        ],
      },
      {
        id: "g4-mixed-numbers",
        title: "Mixed Numbers",
        subtitle: "Improper fractions ↔ mixed numbers.",
        emoji: "🔢",
        practiceCount: 5,
        generator: "g4-mixed-numbers",
        teach: [
          {
            kind: "text",
            text: "An improper fraction has a bigger top than bottom, like 7/3. A mixed number uses whole numbers and fractions, like 2 1/3. To convert 7/3: divide 7 by 3 = 2 remainder 1, so 7/3 = 2 1/3.",
          },
          {
            kind: "example",
            question: "Write 11/4 as a mixed number.",
            answer: "2 3/4",
            text: "11 ÷ 4 = 2 (with remainder 3). So 11/4 = 2 3/4.",
          },
          {
            kind: "tip",
            text: "Divide the top by the bottom — the quotient is the whole number, the remainder is the new top, and the denominator stays the same.",
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // DOMAIN 3 — Decimals
  // ==========================================================================
  {
    id: "g4-decimals",
    title: "Decimals",
    emoji: "🔢",
    color: "from-emerald-400 to-teal-500",
    description: "Tenths, hundredths, and money math.",
    lessons: [
      {
        id: "g4-decimal-place",
        title: "Decimal Place Value",
        subtitle: "Tenths and hundredths.",
        emoji: "📍",
        practiceCount: 5,
        generator: "g4-decimal-place",
        teach: [
          {
            kind: "text",
            text: "Decimals extend our place value system to the right of the decimal point. The first place is tenths (1/10), the second is hundredths (1/100). In 3.47, the 4 is in the tenths place and the 7 is in the hundredths place.",
          },
          {
            kind: "example",
            question: "In the number 5.82, what digit is in the tenths place?",
            answer: "8",
            text: "The first digit after the decimal point is the tenths place. In 5.82, that's the 8.",
          },
          {
            kind: "tip",
            text: "Read the decimal like money: 3.47 = three dollars and forty-seven cents = 3 ones, 4 tenths, 7 hundredths.",
          },
        ],
      },
      {
        id: "g4-compare-dec",
        title: "Compare Decimals",
        subtitle: "Which is bigger? Line up the points!",
        emoji: "⚖️",
        practiceCount: 5,
        generator: "g4-compare-dec",
        teach: [
          {
            kind: "text",
            text: "To compare decimals, line up the decimal points and compare digit by digit from left to right. 0.6 is bigger than 0.45 because 6 tenths is more than 4 tenths.",
          },
          {
            kind: "example",
            question: "Which is greater: 0.7 or 0.68?",
            answer: "0.7",
            text: "0.7 = 0.70, and 70 hundredths is more than 68 hundredths. So 0.7 > 0.68.",
          },
          {
            kind: "tip",
            text: "Add a zero to the end to make them the same length: 0.7 becomes 0.70 so you can compare with 0.68 easily.",
          },
        ],
      },
      {
        id: "g4-add-dec",
        title: "Add & Subtract Decimals",
        subtitle: "Line up the decimal points!",
        emoji: "➕",
        practiceCount: 5,
        generator: "g4-add-dec",
        teach: [
          {
            kind: "text",
            text: "To add or subtract decimals, line up the decimal points. Then add or subtract as usual. 3.4 + 1.2 = 4.6. Make sure each number has the same number of digits by adding zeros if needed.",
          },
          {
            kind: "example",
            question: "What is 5.8 − 2.3?",
            answer: "3.5",
            text: "Line up the decimals: 5.8 − 2.3 = 3.5. Subtract the tenths: 8 − 3 = 5. Subtract the ones: 5 − 2 = 3.",
          },
          {
            kind: "tip",
            text: "Always line up the decimal points — that keeps the place values aligned correctly!",
          },
        ],
      },
      {
        id: "g4-frac-dec",
        title: "Fractions to Decimals",
        subtitle: "1/2 = 0.5, 1/4 = 0.25 — easy!",
        emoji: "🔄",
        practiceCount: 5,
        generator: "g4-frac-dec",
        teach: [
          {
            kind: "text",
            text: "Some fractions turn into decimals easily. 1/2 = 0.5, 1/4 = 0.25, 3/4 = 0.75, 1/10 = 0.1, 1/100 = 0.01. To convert, divide the top by the bottom: 3 ÷ 4 = 0.75.",
          },
          {
            kind: "example",
            question: "What is 1/2 as a decimal?",
            answer: "0.5",
            text: "1 ÷ 2 = 0.5. Half of 1 is 0.5.",
          },
          {
            kind: "tip",
            text: "Memorize the common ones: 1/2 = 0.5, 1/4 = 0.25, 3/4 = 0.75, 1/5 = 0.2, 1/10 = 0.1.",
          },
        ],
      },
      {
        id: "g4-money-dec",
        title: "Money Word Problems",
        subtitle: "Shopping with decimals.",
        emoji: "💲",
        practiceCount: 5,
        generator: "g4-money-dec",
        teach: [
          {
            kind: "text",
            text: "Money is a great way to practice decimals. $3.50 means 3 dollars and 50 cents. To find the total cost of several items, multiply or add. To find change, subtract.",
          },
          {
            kind: "example",
            question: "You buy 3 apples at $0.40 each. How much do they cost in dollars?",
            answer: "1.20",
            text: "3 × $0.40 = $1.20. Multiply 3 × 40 cents = 120 cents = $1.20.",
          },
          {
            kind: "tip",
            text: "Think of money as decimals: $0.40 × 3 = $1.20. Or use cents: 40 × 3 = 120 cents = $1.20.",
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // DOMAIN 4 — Measurement & Data
  // ==========================================================================
  {
    id: "g4-measure",
    title: "Measurement & Data",
    emoji: "📏",
    color: "from-sky-400 to-cyan-500",
    description: "Area, perimeter, angles, and conversions.",
    lessons: [
      {
        id: "g4-area-perim",
        title: "Area & Perimeter",
        subtitle: "Inside space and around the edge.",
        emoji: "🔲",
        practiceCount: 6,
        generator: "g4-area-perim",
        teach: [
          {
            kind: "text",
            text: "Perimeter is the distance around a shape — add up all the sides. Area is the space inside — for a rectangle, multiply length × width. A 4 by 3 rectangle has perimeter 4 + 3 + 4 + 3 = 14 and area 4 × 3 = 12.",
          },
          {
            kind: "example",
            question: "A rectangle is 6 cm long and 4 cm wide. What is the area?",
            answer: "24",
            text: "Area = length × width = 6 × 4 = 24 square cm.",
          },
          {
            kind: "tip",
            text: "Perimeter = add the sides. Area = multiply length × width. Don't forget units: perimeter uses 'cm', area uses 'sq cm'!",
          },
        ],
      },
      {
        id: "g4-angles",
        title: "Angle Types",
        subtitle: "Acute, right, and obtuse angles.",
        emoji: "📐",
        practiceCount: 5,
        generator: "g4-angles",
        teach: [
          {
            kind: "text",
            text: "An angle is formed where two lines meet. Angles are measured in degrees (°). Acute angles are less than 90°, right angles are exactly 90° (like a corner), and obtuse angles are more than 90° but less than 180°.",
          },
          {
            kind: "example",
            question: "An angle of 45° is what type?",
            answer: "Acute",
            text: "45° is less than 90°, so it's an acute angle.",
          },
          {
            kind: "tip",
            text: "Think 'a is for acute (small)' and 'o is for obtuse (open wide)'. Right angles make a perfect L shape.",
          },
        ],
      },
      {
        id: "g4-convert",
        title: "Convert Measurements",
        subtitle: "Meters to cm, feet to inches.",
        emoji: "🔁",
        practiceCount: 5,
        generator: "g4-convert",
        teach: [
          {
            kind: "text",
            text: "To convert between units, multiply or divide. 1 meter = 100 centimeters, so 3 m = 300 cm. 1 foot = 12 inches, so 2 ft = 24 in. Going to a smaller unit → multiply. Going to a bigger unit → divide.",
          },
          {
            kind: "example",
            question: "How many centimeters are in 4 meters?",
            answer: "400",
            text: "1 meter = 100 cm, so 4 × 100 = 400 cm.",
          },
          {
            kind: "tip",
            text: "Remember: 1 m = 100 cm, 1 km = 1000 m, 1 ft = 12 in, 1 yd = 3 ft, 1 lb = 16 oz.",
          },
        ],
      },
      {
        id: "g4-line-plots",
        title: "Line Plots with Fractions",
        subtitle: "Read data on a fraction line plot.",
        emoji: "📊",
        practiceCount: 5,
        generator: "g4-line-plots",
        teach: [
          {
            kind: "text",
            text: "A line plot shows data with X's above a number line. Each X is one piece of data. When the data are fractions, the line plot uses fractions like 1/4, 1/2, 3/4. Count the X's to answer questions.",
          },
          {
            kind: "example",
            question: "A line plot shows 3 X's at 1/2 and 2 X's at 1/4. How many pieces of data are there?",
            answer: "5",
            text: "Count all the X's: 3 + 2 = 5 total pieces of data.",
          },
          {
            kind: "tip",
            text: "Each X is one measurement. To find the total, count all the X's. To find the most common, look for the tallest stack.",
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // DOMAIN 5 — Geometry
  // ==========================================================================
  {
    id: "g4-geometry",
    title: "Geometry",
    emoji: "🔺",
    color: "from-rose-400 to-pink-500",
    description: "Lines, angles, shapes, and symmetry.",
    lessons: [
      {
        id: "g4-points-lines",
        title: "Points, Lines & Angles",
        subtitle: "The building blocks of geometry.",
        emoji: "📏",
        practiceCount: 5,
        generator: "g4-points-lines",
        teach: [
          {
            kind: "text",
            text: "A point is a single spot. A line goes on forever in both directions. A ray starts at a point and goes on forever in one direction. A line segment has two endpoints. Two lines that never meet are parallel. Two lines that cross at a right angle are perpendicular.",
          },
          {
            kind: "example",
            question: "What has two endpoints and a fixed length?",
            answer: "Line segment",
            text: "A line segment has two endpoints — it doesn't go on forever like a line or ray.",
          },
          {
            kind: "tip",
            text: "Think: a line is endless (↔), a ray has a starting point (→), and a segment has two stops (•—•).",
          },
        ],
      },
      {
        id: "g4-classify-shapes",
        title: "Classify Shapes",
        subtitle: "Triangles and quadrilaterals.",
        emoji: "🔷",
        practiceCount: 6,
        generator: "g4-classify-shapes",
        teach: [
          {
            kind: "text",
            text: "Triangles are sorted by sides: equilateral (all equal), isosceles (two equal), scalene (none equal). They're also sorted by angles: acute (all < 90°), right (one 90°), obtuse (one > 90°). Quadrilaterals include squares, rectangles, parallelograms, rhombuses, and trapezoids.",
          },
          {
            kind: "example",
            question: "A triangle with all three sides the same length is called what?",
            answer: "Equilateral",
            text: "All sides equal → equilateral. All angles are also 60°.",
          },
          {
            kind: "tip",
            text: "A square is a special rectangle (4 right angles AND 4 equal sides). A rectangle is a special parallelogram. A parallelogram has two pairs of parallel sides.",
          },
        ],
      },
      {
        id: "g4-symmetry",
        title: "Lines of Symmetry",
        subtitle: "Fold it in half — do the sides match?",
        emoji: "🦋",
        practiceCount: 5,
        generator: "g4-symmetry",
        teach: [
          {
            kind: "text",
            text: "A line of symmetry divides a shape into two mirror-image halves. If you fold the shape on the line, the two sides match perfectly. A square has 4 lines of symmetry, a rectangle has 2, a circle has many, and some shapes (like a scalene triangle) have 0.",
          },
          {
            kind: "example",
            question: "How many lines of symmetry does a square have?",
            answer: "4",
            text: "A square has 4 lines of symmetry: 2 diagonals and 2 through the middle of opposite sides.",
          },
          {
            kind: "tip",
            text: "Imagine folding the shape on the line. If both halves match exactly, it's a line of symmetry!",
          },
        ],
      },
      {
        id: "g4-coordinate-planes",
        title: "Coordinate Planes",
        subtitle: "Find points with (x, y) pairs.",
        emoji: "🗺️",
        practiceCount: 5,
        generator: "g4-coordinate-planes",
        teach: [
          {
            kind: "text",
            text: "A coordinate plane has two number lines that cross: the x-axis (horizontal) and y-axis (vertical). A point is described by an (x, y) pair. To find point (3, 2): start at the origin (0,0), go right 3, then up 2.",
          },
          {
            kind: "example",
            question: "What are the coordinates of a point that is 4 right and 1 up from the origin?",
            answer: "(4, 1)",
            text: "Right is x, up is y. So 4 right and 1 up = (4, 1).",
          },
          {
            kind: "tip",
            text: "Remember 'over then up' — x comes first (left/right), y comes second (up/down). Think 'run before you jump'!",
          },
        ],
      },
    ],
  },
];

export const GRADE4_LESSON_IDS = GRADE4_CURRICULUM.flatMap((d) =>
  d.lessons.map((l) => l.id)
);

export const GRADE4_TOTAL_LESSONS = GRADE4_LESSON_IDS.length;

// Per-domain sequential unlock for grade 4 (mirrors the preschool helper).
export function prerequisiteLessonId(lessonId: string): string | null {
  for (const domain of GRADE4_CURRICULUM) {
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

export function findG4Lesson(lessonId: string) {
  for (const domain of GRADE4_CURRICULUM) {
    const lesson = domain.lessons.find((l) => l.id === lessonId);
    if (lesson) return { lesson, domain };
  }
  return null;
}

export function findG4Domain(domainId: string) {
  return GRADE4_CURRICULUM.find((d) => d.id === domainId) ?? null;
}
