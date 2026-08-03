import type { Domain } from "@/lib/types";

// ============================================================================
// Math Stars — Full 3rd Grade Math Curriculum (US Common Core aligned)
// Covers all five CCSS domains for grade 3 across the school year.
// ============================================================================

export const CURRICULUM: Domain[] = [
  // ==========================================================================
  // DOMAIN 1 — Multiplication & Division (Operations & Algebraic Thinking)
  // ==========================================================================
  {
    id: "mult-div",
    title: "Multiplication & Division",
    emoji: "✖️",
    color: "from-rose-400 to-orange-400",
    description: "Equal groups, times tables, and sharing fairly.",
    lessons: [
      {
        id: "mult-concept",
        title: "Multiplication: Equal Groups",
        subtitle: "What does × really mean?",
        emoji: "🍎",
        practiceCount: 6,
        generator: "equal-groups",
        teach: [
          {
            kind: "text",
            text: "Multiplication is a fast way to add the SAME number again and again. If you have 3 baskets with 4 apples each, that's 3 groups of 4.",
          },
          {
            kind: "example",
            question: "3 groups of 4 apples = ?",
            answer: "3 × 4 = 12 apples",
            text: "We can write '3 groups of 4' as 3 × 4. And 4 + 4 + 4 = 12, so 3 × 4 = 12.",
          },
          {
            kind: "tip",
            text: "The × sign means 'groups of'. 3 × 4 reads as '3 groups of 4'.",
          },
        ],
      },
      {
        id: "mult-2-5-10",
        title: "Times Tables: 2, 5 & 10",
        subtitle: "The easiest facts to learn first.",
        emoji: "2️⃣",
        practiceCount: 8,
        generator: "mult-facts",
        params: { tables: [2, 5, 10] },
        teach: [
          {
            kind: "text",
            text: "The ×2 table is just doubling. 2 × 5 = 5 + 5 = 10. The ×10 table ends in a zero: 10 × 6 = 60. The ×5 table ends in 0 or 5.",
          },
          {
            kind: "example",
            question: "What is 5 × 6?",
            answer: "30",
            text: "Count by 5s six times: 5, 10, 15, 20, 25, 30. So 5 × 6 = 30.",
          },
          {
            kind: "tip",
            text: "Skip-counting is your friend! To find ×5, count by 5s. To find ×10, count by 10s.",
          },
        ],
      },
      {
        id: "mult-3-4",
        title: "Times Tables: 3 & 4",
        subtitle: "Building up your fact power.",
        emoji: "3️⃣",
        practiceCount: 8,
        generator: "mult-facts",
        params: { tables: [3, 4] },
        teach: [
          {
            kind: "text",
            text: "The ×3 table: count by 3s. The ×4 table is doubling twice: 4 × 5 = (2×5) + (2×5) = 10 + 10 = 20.",
          },
          {
            kind: "example",
            question: "What is 4 × 6?",
            answer: "24",
            text: "Double 6 to get 12, then double 12 to get 24. So 4 × 6 = 24.",
          },
        ],
      },
      {
        id: "mult-6-9",
        title: "Times Tables: 6, 7, 8 & 9",
        subtitle: "The trickier facts.",
        emoji: "7️⃣",
        practiceCount: 8,
        generator: "mult-facts",
        params: { tables: [6, 7, 8, 9] },
        teach: [
          {
            kind: "text",
            text: "The ×9 trick: hold up both hands. For 9 × 3, fold down your 3rd finger. Fingers to the left = tens (2), fingers to the right = ones (7). Answer: 27!",
          },
          {
            kind: "example",
            question: "What is 9 × 4?",
            answer: "36",
            text: "Using the hand trick: fold the 4th finger. 3 fingers left, 6 right → 36.",
          },
          {
            kind: "tip",
            text: "For ×6, think ×5 then add one more. 6 × 4 = (5 × 4) + 4 = 20 + 4 = 24.",
          },
        ],
      },
      {
        id: "mult-properties",
        title: "Properties of Multiplication",
        subtitle: "Commutative, associative & distributive.",
        emoji: "🔄",
        practiceCount: 6,
        generator: "mult-properties",
        teach: [
          {
            kind: "text",
            text: "Commutative: 3 × 4 = 4 × 3. You can swap the order! Associative: (2 × 3) × 4 = 2 × (3 × 4). Group them any way you like.",
          },
          {
            kind: "example",
            question: "Fill in: 5 × 6 = 6 × ?",
            answer: "5",
            text: "The commutative property says the order doesn't matter, so 5 × 6 = 6 × 5.",
          },
          {
            kind: "tip",
            text: "Distributive: 6 × 7 = 6 × (5 + 2) = (6×5) + (6×2) = 30 + 12 = 42. Break apart a hard fact into easy ones!",
          },
        ],
      },
      {
        id: "div-concept",
        title: "Division: Sharing Fairly",
        subtitle: "The opposite of multiplication.",
        emoji: "➗",
        practiceCount: 8,
        generator: "division-facts",
        params: { tables: [2, 5, 10] },
        teach: [
          {
            kind: "text",
            text: "Division splits a number into equal groups. 12 ÷ 3 means 'share 12 into 3 equal groups' — each group gets 4.",
          },
          {
            kind: "example",
            question: "12 ÷ 3 = ?",
            answer: "4",
            text: "Think: 3 times WHAT equals 12? 3 × 4 = 12, so 12 ÷ 3 = 4.",
          },
          {
            kind: "tip",
            text: "Every division fact is a multiplication fact in disguise! 20 ÷ 5 = 4 because 5 × 4 = 20.",
          },
        ],
      },
      {
        id: "div-facts",
        title: "Division Facts: 6, 7, 8 & 9",
        subtitle: "Trickier division using times tables.",
        emoji: "9️⃣",
        practiceCount: 8,
        generator: "division-facts",
        params: { tables: [6, 7, 8, 9] },
        teach: [
          {
            kind: "text",
            text: "To divide 56 ÷ 8, ask: 8 times WHAT = 56? Since 8 × 7 = 56, the answer is 7.",
          },
          {
            kind: "example",
            question: "63 ÷ 9 = ?",
            answer: "7",
            text: "9 × 7 = 63, so 63 ÷ 9 = 7.",
          },
        ],
      },
      {
        id: "word-problems-md",
        title: "Multiply & Divide Word Problems",
        subtitle: "Real stories, real math.",
        emoji: "📖",
        practiceCount: 6,
        generator: "word-problems-md",
        teach: [
          {
            kind: "text",
            text: "Words like 'each', 'groups of', 'in all' hint at multiplication. Words like 'share', 'split', 'equal groups' hint at division.",
          },
          {
            kind: "example",
            question: "5 boxes hold 6 pencils each. How many pencils in all?",
            answer: "30 pencils",
            text: "'5 boxes with 6 each' means 5 × 6 = 30 pencils.",
          },
        ],
      },
      {
        id: "two-step",
        title: "Two-Step Word Problems",
        subtitle: "Two operations, one problem!",
        emoji: "🪜",
        practiceCount: 5,
        generator: "two-step",
        teach: [
          {
            kind: "text",
            text: "Some problems need two steps. Read carefully, solve the first part, then use that answer for the second part.",
          },
          {
            kind: "example",
            question: "Mia buys 4 packs of 6 stickers. She gives 5 away. How many left?",
            answer: "19",
            text: "Step 1: 4 × 6 = 24 stickers. Step 2: 24 − 5 = 19 stickers left.",
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // DOMAIN 2 — Place Value & Big Numbers (Number & Operations in Base Ten)
  // ==========================================================================
  {
    id: "place-value",
    title: "Place Value & Big Numbers",
    emoji: "🔢",
    color: "from-violet-400 to-fuchsia-400",
    description: "Hundreds, thousands, rounding, and adding big numbers.",
    lessons: [
      {
        id: "place-value-basics",
        title: "Place Value to 10,000",
        subtitle: "Ones, tens, hundreds, thousands.",
        emoji: "🏛️",
        practiceCount: 7,
        generator: "place-value",
        teach: [
          {
            kind: "text",
            text: "Every digit has a job based on its place. In 3,482: the 3 means 3 thousands, the 4 means 4 hundreds, the 8 means 8 tens, the 2 means 2 ones.",
          },
          {
            kind: "example",
            question: "In 5,719, what place is the 7 in?",
            answer: "Hundreds place — it means 700",
            text: "From right to left: ones, tens, hundreds, thousands. The 7 is third from the right, so it's hundreds.",
          },
          {
            kind: "tip",
            text: "Read big numbers in groups of three: 4,286 is 'four thousand, two hundred eighty-six'.",
          },
        ],
      },
      {
        id: "rounding",
        title: "Rounding to 10 and 100",
        subtitle: "Friendly numbers that are easy to use.",
        emoji: "🎯",
        practiceCount: 8,
        generator: "rounding",
        teach: [
          {
            kind: "text",
            text: "Rounding makes numbers friendlier. To round to the nearest 10, look at the ones digit: 5 or more, round up; 4 or less, round down.",
          },
          {
            kind: "example",
            question: "Round 47 to the nearest 10.",
            answer: "50",
            text: "47 is between 40 and 50. The ones digit is 7 (5 or more), so round up to 50.",
          },
          {
            kind: "tip",
            text: "To round to the nearest 100, look at the TENS digit: 5 or more rounds up. 349 rounds to 300; 362 rounds to 400.",
          },
        ],
      },
      {
        id: "add-1000",
        title: "Adding Within 1,000",
        subtitle: "Stack it up and carry over.",
        emoji: "➕",
        practiceCount: 7,
        generator: "addition-1000",
        teach: [
          {
            kind: "text",
            text: "To add big numbers, line up the places (ones under ones, tens under tens). Add each column. If a column is 10 or more, carry the extra to the next column.",
          },
          {
            kind: "example",
            question: "248 + 135 = ?",
            answer: "383",
            text: "8+5=13 (write 3, carry 1). 4+3+1=8. 2+1=3. Answer: 383.",
          },
          {
            kind: "tip",
            text: "You can also break numbers apart! 248 + 135 = (200+100) + (40+30) + (8+5) = 300 + 70 + 13 = 383.",
          },
        ],
      },
      {
        id: "sub-1000",
        title: "Subtracting Within 1,000",
        subtitle: "Borrowing when you need more.",
        emoji: "➖",
        practiceCount: 7,
        generator: "subtraction-1000",
        teach: [
          {
            kind: "text",
            text: "Line up the places and subtract each column. If the top digit is too small, borrow 1 from the next column (that's worth 10 in this column).",
          },
          {
            kind: "example",
            question: "524 − 187 = ?",
            answer: "337",
            text: "4−7: borrow → 14−7=7. 1−8: borrow → 11−8=3. 4−1=3. Answer: 337.",
          },
        ],
      },
      {
        id: "mult-tens",
        title: "Multiply by Multiples of 10",
        subtitle: "30 × 4, 60 × 5, and friends.",
        emoji: "🔟",
        practiceCount: 7,
        generator: "mult-tens",
        teach: [
          {
            kind: "text",
            text: "To multiply 30 × 4, ignore the zero first: 3 × 4 = 12. Then put the zero back: 120. Easy!",
          },
          {
            kind: "example",
            question: "60 × 5 = ?",
            answer: "300",
            text: "6 × 5 = 30, then add the zero from 60 → 300.",
          },
          {
            kind: "tip",
            text: "For 40 × 50, multiply 4 × 5 = 20, then add BOTH zeros → 2,000.",
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // DOMAIN 3 — Fractions (Number & Operations - Fractions)
  // ==========================================================================
  {
    id: "fractions",
    title: "Fractions",
    emoji: "🍕",
    color: "from-amber-400 to-rose-400",
    description: "Parts of a whole, number lines, and comparing.",
    lessons: [
      {
        id: "frac-concept",
        title: "Fractions: Parts of a Whole",
        subtitle: "Equal slices of a pizza.",
        emoji: "🍕",
        practiceCount: 6,
        generator: "frac-concept",
        teach: [
          {
            kind: "text",
            text: "A fraction shows parts of a whole that's cut into EQUAL pieces. The bottom number (denominator) is how many equal pieces there are. The top number (numerator) is how many pieces you have.",
          },
          {
            kind: "example",
            question: "What fraction of the pizza is shaded (3 of 8 slices)?",
            answer: "3/8",
            text: "8 equal slices total (denominator), 3 are shaded (numerator) → 3/8.",
          },
          {
            kind: "tip",
            text: "Remember: pieces MUST be equal. If a pizza is cut unequally, it's not a fair fraction!",
          },
        ],
      },
      {
        id: "frac-numberline",
        title: "Fractions on a Number Line",
        subtitle: "Where do fractions live?",
        emoji: "📏",
        practiceCount: 6,
        generator: "frac-numberline",
        teach: [
          {
            kind: "text",
            text: "A number line from 0 to 1 can be split into equal parts. If we cut it into 4 equal parts, each part is 1/4. The marks are 1/4, 2/4, 3/4, and 4/4 (which equals 1).",
          },
          {
            kind: "example",
            question: "Where is 2/3 on a 0-to-1 number line?",
            answer: "The second mark when split into 3 equal parts",
            text: "Split the line into 3 equal parts. The marks are 1/3, 2/3, 3/3. So 2/3 is the second mark.",
          },
        ],
      },
      {
        id: "frac-equivalent",
        title: "Equivalent Fractions",
        subtitle: "Different looks, same amount.",
        emoji: "🟰",
        practiceCount: 6,
        generator: "frac-equivalent",
        teach: [
          {
            kind: "text",
            text: "Equivalent fractions are fractions that show the SAME amount even though the numbers are different. 1/2 = 2/4 = 4/8. They all mean 'half'.",
          },
          {
            kind: "example",
            question: "Fill in: 1/2 = ?/6",
            answer: "3",
            text: "To go from halves to sixths, multiply top and bottom by 3. 1×3 = 3, so 1/2 = 3/6.",
          },
          {
            kind: "tip",
            text: "Multiply or divide BOTH the top and bottom by the same number to make an equivalent fraction.",
          },
        ],
      },
      {
        id: "frac-compare",
        title: "Comparing Fractions",
        subtitle: "Which is bigger?",
        emoji: "⚖️",
        practiceCount: 6,
        generator: "frac-compare",
        teach: [
          {
            kind: "text",
            text: "Same denominator? Bigger numerator = bigger fraction (3/5 > 2/5). Same numerator? Bigger denominator = SMALLER fraction, because the pieces are smaller (1/4 > 1/8).",
          },
          {
            kind: "example",
            question: "Which is bigger: 2/3 or 2/5?",
            answer: "2/3",
            text: "Same numerator (2). Thirds are bigger pieces than fifths, so 2/3 > 2/5.",
          },
          {
            kind: "tip",
            text: "Picture pizzas! 2 slices of a pizza cut into 3 is more than 2 slices of a pizza cut into 5.",
          },
        ],
      },
      {
        id: "frac-whole",
        title: "Fractions Equal to Whole Numbers",
        subtitle: "When parts fill the whole.",
        emoji: "🥧",
        practiceCount: 5,
        generator: "frac-whole",
        teach: [
          {
            kind: "text",
            text: "When the numerator and denominator are the same, the fraction equals 1 whole. 4/4 = 1, 6/6 = 1. And 8/4 = 2 wholes!",
          },
          {
            kind: "example",
            question: "What whole number is 10/5 equal to?",
            answer: "2",
            text: "10 ÷ 5 = 2. So 10/5 = 2 wholes.",
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // DOMAIN 4 — Measurement & Data
  // ==========================================================================
  {
    id: "measurement",
    title: "Measurement & Data",
    emoji: "📏",
    color: "from-teal-400 to-emerald-400",
    description: "Time, mass, graphs, area, and perimeter.",
    lessons: [
      {
        id: "time-minute",
        title: "Telling Time to the Minute",
        subtitle: "Read the clock like a pro.",
        emoji: "🕐",
        practiceCount: 6,
        generator: "time-read",
        teach: [
          {
            kind: "text",
            text: "The short hand points to the hour. The long hand points to the minutes. Each big number on the clock is worth 5 minutes.",
          },
          {
            kind: "example",
            question: "If the short hand is past 3 and the long hand points at 7, what time is it?",
            answer: "3:35",
            text: "Hour hand past 3 → 3 o'clock. Minute hand at 7 → 7 × 5 = 35 minutes. So 3:35.",
          },
          {
            kind: "tip",
            text: "Count by 5s for each number the minute hand passes: 5, 10, 15, 20, 25, 30...",
          },
        ],
      },
      {
        id: "elapsed-time",
        title: "Elapsed Time",
        subtitle: "How long did that take?",
        emoji: "⏱️",
        practiceCount: 6,
        generator: "elapsed-time",
        teach: [
          {
            kind: "text",
            text: "Elapsed time is how much time passes from a start time to an end time. You can count up by hours, then by minutes.",
          },
          {
            kind: "example",
            question: "A movie starts at 3:15 and ends at 4:40. How long is it?",
            answer: "1 hour 25 minutes",
            text: "From 3:15 to 4:15 is 1 hour. From 4:15 to 4:40 is 25 minutes. Total: 1 hour 25 minutes.",
          },
          {
            kind: "tip",
            text: "Use a number line! Jump to the next hour first, then count the remaining minutes.",
          },
        ],
      },
      {
        id: "mass-volume",
        title: "Mass & Volume",
        subtitle: "Grams, kilograms, liters, and milliliters.",
        emoji: "⚖️",
        practiceCount: 6,
        generator: "mass-volume",
        teach: [
          {
            kind: "text",
            text: "Mass is how heavy something is (grams g, kilograms kg). 1,000 grams = 1 kilogram. Volume is how much space a liquid takes (milliliters mL, liters L). 1,000 mL = 1 L.",
          },
          {
            kind: "example",
            question: "A bottle holds 2,000 mL. How many liters is that?",
            answer: "2 liters",
            text: "1,000 mL = 1 L, so 2,000 mL = 2 L.",
          },
          {
            kind: "tip",
            text: "A paperclip is about 1 gram. A textbook is about 1 kilogram. A drop of water is about 1 milliliter.",
          },
        ],
      },
      {
        id: "graphs",
        title: "Picture & Bar Graphs",
        subtitle: "Read and make sense of data.",
        emoji: "📊",
        practiceCount: 6,
        generator: "graphs",
        teach: [
          {
            kind: "text",
            text: "A picture graph uses pictures or symbols to show data. A bar graph uses bars. The KEY tells you what each picture or bar is worth (like 'each 😺 = 2 cats').",
          },
          {
            kind: "example",
            question: "A picture graph has a key: 😺 = 2 cats. If there are 4 😺 symbols, how many cats?",
            answer: "8 cats",
            text: "4 symbols × 2 cats each = 8 cats total.",
          },
        ],
      },
      {
        id: "line-plots",
        title: "Line Plots & Length",
        subtitle: "Measuring to the half inch.",
        emoji: "📐",
        practiceCount: 5,
        generator: "line-plots",
        teach: [
          {
            kind: "text",
            text: "A line plot shows measurements as X's stacked above a number line. We can measure to the nearest half-inch or quarter-inch using a ruler.",
          },
          {
            kind: "example",
            question: "Pencils measure 4½ in, 5 in, 5 in, 4½ in. How many are 5 inches?",
            answer: "2 pencils",
            text: "Count the X's above 5 on the line plot — there are 2.",
          },
        ],
      },
      {
        id: "area-count",
        title: "Area: Counting Square Units",
        subtitle: "How much space does a shape cover?",
        emoji: "🟦",
        practiceCount: 6,
        generator: "area-count",
        teach: [
          {
            kind: "text",
            text: "Area is the amount of space inside a flat shape. We measure it in square units, like little squares. Count all the squares inside to find the area!",
          },
          {
            kind: "example",
            question: "A rectangle covered by 3 rows of 4 squares — what's its area?",
            answer: "12 square units",
            text: "Count them: 4 + 4 + 4 = 12, or just 3 × 4 = 12 square units.",
          },
        ],
      },
      {
        id: "area-mult",
        title: "Area = Length × Width",
        subtitle: "The fast way to find area.",
        emoji: "📐",
        practiceCount: 6,
        generator: "area-mult",
        teach: [
          {
            kind: "text",
            text: "For a rectangle, area = length × width. If a rectangle is 5 squares long and 3 squares wide, the area is 5 × 3 = 15 square units.",
          },
          {
            kind: "example",
            question: "A rectangle is 8 cm long and 4 cm wide. What is its area?",
            answer: "32 square cm",
            text: "Area = length × width = 8 × 4 = 32 square centimeters.",
          },
          {
            kind: "tip",
            text: "Area is always measured in SQUARE units: square cm, square inches, square units.",
          },
        ],
      },
      {
        id: "perimeter",
        title: "Perimeter of Shapes",
        subtitle: "The distance all the way around.",
        emoji: "🟧",
        practiceCount: 6,
        generator: "perimeter",
        teach: [
          {
            kind: "text",
            text: "Perimeter is the distance all the way around the OUTSIDE of a shape. Add up all the sides! For a rectangle: perimeter = length + width + length + width.",
          },
          {
            kind: "example",
            question: "A rectangle is 6 cm long and 4 cm wide. What's the perimeter?",
            answer: "20 cm",
            text: "6 + 4 + 6 + 4 = 20 cm. Or: (6 + 4) × 2 = 20 cm.",
          },
          {
            kind: "tip",
            text: "Perimeter is just plain units (cm, inches). Area is SQUARE units. Don't mix them up!",
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // DOMAIN 5 — Geometry
  // ==========================================================================
  {
    id: "geometry",
    title: "Geometry & Shapes",
    emoji: "🔷",
    color: "from-sky-400 to-cyan-400",
    description: "Sorting shapes and splitting them up.",
    lessons: [
      {
        id: "shape-categories",
        title: "Categories of Shapes",
        subtitle: "Triangles, quadrilaterals, polygons.",
        emoji: "🔺",
        practiceCount: 6,
        generator: "shape-categories",
        teach: [
          {
            kind: "text",
            text: "Shapes are sorted by their sides and angles. A triangle has 3 sides. A quadrilateral has 4 sides. A pentagon has 5, a hexagon has 6.",
          },
          {
            kind: "example",
            question: "How many sides does a hexagon have?",
            answer: "6 sides",
            text: "'Hex' means six, so a hexagon has 6 sides.",
          },
          {
            kind: "tip",
            text: "A polygon is a closed shape made of straight line segments — no curves, no gaps!",
          },
        ],
      },
      {
        id: "quadrilaterals",
        title: "Sorting Quadrilaterals",
        subtitle: "Squares, rectangles, rhombuses & more.",
        emoji: "⬜",
        practiceCount: 6,
        generator: "quadrilaterals",
        teach: [
          {
            kind: "text",
            text: "All 4-sided shapes are quadrilaterals. A rectangle has 4 right angles. A rhombus has 4 equal sides. A SQUARE is BOTH — 4 equal sides AND 4 right angles!",
          },
          {
            kind: "example",
            question: "A shape has 4 equal sides and 4 right angles. What is it?",
            answer: "A square",
            text: "4 equal sides = rhombus. 4 right angles = rectangle. Both = square!",
          },
          {
            kind: "tip",
            text: "A square is a special rectangle AND a special rhombus. Shapes can belong to more than one group.",
          },
        ],
      },
      {
        id: "partition-shapes",
        title: "Splitting Shapes into Fractions",
        subtitle: "Equal parts make fractions.",
        emoji: "🔹",
        practiceCount: 5,
        generator: "partition-shapes",
        teach: [
          {
            kind: "text",
            text: "We can cut shapes into equal parts to make fractions. Split a square into 4 equal parts → each part is 1/4 of the square.",
          },
          {
            kind: "example",
            question: "A circle is cut into 6 equal slices. What fraction is one slice?",
            answer: "1/6",
            text: "6 equal parts total, you have 1 → 1/6.",
          },
        ],
      },
    ],
  },
];

// Helper: flat list of all lessons with their domain
export interface FlatLesson {
  lessonId: string;
  domainId: string;
  index: number; // global order
}

export const ALL_LESSONS: FlatLesson[] = CURRICULUM.flatMap((domain) =>
  domain.lessons.map((lesson) => ({
    lessonId: lesson.id,
    domainId: domain.id,
    index: 0, // filled below
  }))
).map((fl, i) => ({ ...fl, index: i }));

export const TOTAL_LESSONS = ALL_LESSONS.length;

export function findLesson(lessonId: string) {
  for (const domain of CURRICULUM) {
    const lesson = domain.lessons.find((l) => l.id === lessonId);
    if (lesson) return { lesson, domain };
  }
  return null;
}

export function findDomain(domainId: string) {
  return CURRICULUM.find((d) => d.id === domainId) ?? null;
}

// Per-domain sequential unlock: a lesson's prerequisite is the previous lesson
// in the SAME domain. The first lesson of every domain has no prerequisite, so
// all five topics are explorable from the start while keeping a sensible order
// within each topic.
export function prerequisiteLessonId(lessonId: string): string | null {
  for (const domain of CURRICULUM) {
    const idx = domain.lessons.findIndex((l) => l.id === lessonId);
    if (idx === -1) continue;
    if (idx === 0) return null;
    return domain.lessons[idx - 1].id;
  }
  return null;
}

// A lesson is available if it has no prerequisite OR its prerequisite is completed.
export function isLessonAvailable(
  lessonId: string,
  isCompleted: (id: string) => boolean
): boolean {
  const prereq = prerequisiteLessonId(lessonId);
  if (prereq === null) return true;
  return isCompleted(prereq);
}
