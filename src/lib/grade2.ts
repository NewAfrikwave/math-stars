import type { Domain } from "@/lib/types";

// ============================================================================
// Math Stars — 2nd Grade Curriculum (US Common Core)
// Five domains covering addition/subtraction within 100, place value to 1000,
// money & data, time & measurement, and geometry & fractions. Builds directly
// on the preschool pattern (one generator key per lesson, per-domain
// sequential unlock).
// ============================================================================

export const GRADE2_CURRICULUM: Domain[] = [
  // ==========================================================================
  // DOMAIN 1 — Addition & Subtraction within 100
  // ==========================================================================
  {
    id: "g2-add-sub",
    title: "Addition & Subtraction",
    emoji: "➕",
    color: "from-rose-400 to-orange-400",
    description: "Add and subtract within 100.",
    lessons: [
      {
        id: "g2-add-20",
        title: "Add Within 20",
        subtitle: "Build fluency with sums to 20.",
        emoji: "🐝",
        practiceCount: 6,
        generator: "g2-add-20",
        teach: [
          {
            kind: "text",
            text: "In 2nd grade we get really fast at adding numbers up to 20. The trick is to memorize 'doubles' (like 6 + 6 = 12) and 'make a 10' (like 8 + 5 → 8 + 2 + 3 = 13).",
          },
          {
            kind: "example",
            question: "What is 7 + 8?",
            answer: "15",
            text: "Make a 10: 7 + 8 → 7 + 3 = 10, then add the 5 left over → 15.",
          },
          {
            kind: "tip",
            text: "If you know 7 + 8 = 15, then you also know 8 + 7 = 15. Addition is commutative — order doesn't matter!",
          },
        ],
      },
      {
        id: "g2-sub-20",
        title: "Subtract Within 20",
        subtitle: "Take away, count back, or count up.",
        emoji: "🎈",
        practiceCount: 6,
        generator: "g2-sub-20",
        teach: [
          {
            kind: "text",
            text: "Subtraction is the opposite of addition. To solve 14 − 9, you can count up from 9 to 14 (that's 5) or use the fact 9 + 5 = 14.",
          },
          {
            kind: "example",
            question: "What is 15 − 7?",
            answer: "8",
            text: "Think: 7 plus what makes 15? 7 + 8 = 15, so 15 − 7 = 8.",
          },
          {
            kind: "tip",
            text: "Related facts come in families: 7 + 8 = 15, 8 + 7 = 15, 15 − 7 = 8, 15 − 8 = 7. Learn one, get all four!",
          },
        ],
      },
      {
        id: "g2-add-2digit",
        title: "Add 2-Digit Numbers",
        subtitle: "Stack and add, sometimes regroup.",
        emoji: "🧱",
        practiceCount: 6,
        generator: "g2-add-2digit",
        teach: [
          {
            kind: "text",
            text: "To add two 2-digit numbers, line up the ones and the tens. Add the ones first. If the ones make 10 or more, regroup — trade 10 ones for 1 ten.",
          },
          {
            kind: "example",
            question: "What is 36 + 27?",
            answer: "63",
            text: "Ones: 6 + 7 = 13 → write 3, carry 1. Tens: 3 + 2 + 1 = 6. Answer: 63.",
          },
          {
            kind: "tip",
            text: "Always start with the ones place (right side). That way carries move left to the bigger place.",
          },
        ],
      },
      {
        id: "g2-sub-2digit",
        title: "Subtract 2-Digit Numbers",
        subtitle: "Stack and subtract, sometimes borrow.",
        emoji: "📏",
        practiceCount: 6,
        generator: "g2-sub-2digit",
        teach: [
          {
            kind: "text",
            text: "To subtract 2-digit numbers, line up the ones and tens. Subtract the ones first. If the top digit is too small, borrow 1 ten from the next place (10 ones).",
          },
          {
            kind: "example",
            question: "What is 52 − 18?",
            answer: "34",
            text: "Ones: 2 − 8 → borrow, 12 − 8 = 4. Tens: 4 − 1 = 3. Answer: 34.",
          },
          {
            kind: "tip",
            text: "Check your work by adding! 34 + 18 should equal 52.",
          },
        ],
      },
      {
        id: "g2-word-add-sub",
        title: "Word Problems within 100",
        subtitle: "Stories with adding and subtracting.",
        emoji: "📚",
        practiceCount: 5,
        generator: "g2-word-add-sub",
        teach: [
          {
            kind: "text",
            text: "Word problems tell a story. Read carefully — words like 'altogether,' 'in all,' and 'total' usually mean add. Words like 'left,' 'fewer,' and 'how many more' usually mean subtract.",
          },
          {
            kind: "example",
            question: "Mia has 24 stickers. She gets 18 more. How many does she have in all?",
            answer: "42",
            text: "'In all' means add: 24 + 18 = 42.",
          },
          {
            kind: "tip",
            text: "Draw a picture or write the equation before you solve. It helps you see which operation to use.",
          },
        ],
      },
      {
        id: "g2-mental-10",
        title: "Mental Math: +10 and −10",
        subtitle: "Add or subtract 10 in your head.",
        emoji: "🧠",
        practiceCount: 6,
        generator: "g2-mental-10",
        teach: [
          {
            kind: "text",
            text: "Adding 10 is easy — just bump the tens digit up by 1! 34 + 10 = 44. Subtracting 10 bumps the tens digit down: 67 − 10 = 57.",
          },
          {
            kind: "example",
            question: "What is 48 + 10?",
            answer: "58",
            text: "The ones digit (8) stays the same. The tens digit (4) goes up to 5. So 48 + 10 = 58.",
          },
          {
            kind: "tip",
            text: "You can also add 100 the same way: 48 + 100 = 148. The tens and ones stay, the hundreds digit appears.",
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // DOMAIN 2 — Place Value to 1000
  // ==========================================================================
  {
    id: "g2-place",
    title: "Place Value to 1000",
    emoji: "🔢",
    color: "from-indigo-400 to-blue-400",
    description: "Hundreds, tens, and ones.",
    lessons: [
      {
        id: "g2-hundreds",
        title: "Hundreds, Tens & Ones",
        subtitle: "Break a number into place values.",
        emoji: "🟦",
        practiceCount: 6,
        generator: "g2-hundreds",
        teach: [
          {
            kind: "text",
            text: "A 3-digit number has hundreds, tens, and ones. In 352, the 3 means 300, the 5 means 50, and the 2 means 2. We can show this with base-ten blocks: flats (100), rods (10), and units (1).",
          },
          {
            kind: "example",
            question: "How many tens are in 240?",
            answer: "24",
            text: "240 = 200 + 40. That's 24 tens (and 0 ones).",
          },
          {
            kind: "tip",
            text: "10 ones = 1 ten. 10 tens = 1 hundred. 10 hundreds = 1 thousand. Each place is 10 times the one to its right.",
          },
        ],
      },
      {
        id: "g2-read-1000",
        title: "Read & Write to 1000",
        subtitle: "Numbers as words and digits.",
        emoji: "✏️",
        practiceCount: 6,
        generator: "g2-read-1000",
        teach: [
          {
            kind: "text",
            text: "We can read numbers up to 1000. 365 is 'three hundred sixty-five.' 500 is 'five hundred.' 1000 is 'one thousand.'",
          },
          {
            kind: "example",
            question: "Write 'four hundred twenty-seven' as a number.",
            answer: "427",
            text: "Four hundred = 400, twenty = 20, seven = 7. 400 + 20 + 7 = 427.",
          },
          {
            kind: "tip",
            text: "The first digit tells you the hundreds. So 7__ always means at least 700.",
          },
        ],
      },
      {
        id: "g2-compare-3",
        title: "Compare 3-Digit Numbers",
        subtitle: "Greater than, less than, or equal.",
        emoji: "⚖️",
        practiceCount: 6,
        generator: "g2-compare-3",
        teach: [
          {
            kind: "text",
            text: "To compare 3-digit numbers, look at the hundreds first. The bigger hundreds digit wins. If they're the same, look at the tens. If those are the same, look at the ones.",
          },
          {
            kind: "example",
            question: "Which is greater: 458 or 472?",
            answer: "472",
            text: "Same hundreds (4). Compare tens: 5 vs 7. 7 is bigger, so 472 > 458.",
          },
          {
            kind: "tip",
            text: "The symbols: > means 'greater than' (the big mouth opens to the bigger number). < means 'less than.' = means 'equal.'",
          },
        ],
      },
      {
        id: "g2-100-more",
        title: "10 More, 10 Less, 100 More",
        subtitle: "Jump by tens and hundreds.",
        emoji: "🎯",
        practiceCount: 6,
        generator: "g2-100-more",
        teach: [
          {
            kind: "text",
            text: "Adding or subtracting 10 only changes the tens digit. Adding or subtracting 100 only changes the hundreds digit. The other digits stay the same!",
          },
          {
            kind: "example",
            question: "What is 100 more than 326?",
            answer: "426",
            text: "Only the hundreds digit changes: 3 → 4. So 326 + 100 = 426.",
          },
          {
            kind: "tip",
            text: "Use a hundreds chart to see the pattern: moving down one row adds 10. Moving right one square adds 1.",
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // DOMAIN 3 — Money & Data
  // ==========================================================================
  {
    id: "g2-money-data",
    title: "Money & Data",
    emoji: "💰",
    color: "from-emerald-400 to-green-400",
    description: "Count coins and read graphs.",
    lessons: [
      {
        id: "g2-money",
        title: "Count Coins to $1",
        subtitle: "Pennies, nickels, dimes, quarters.",
        emoji: "🪙",
        practiceCount: 6,
        generator: "g2-money",
        teach: [
          {
            kind: "text",
            text: "Each coin has a value: penny = 1¢, nickel = 5¢, dime = 10¢, quarter = 25¢. To count mixed coins, start with the biggest and skip-count.",
          },
          {
            kind: "example",
            question: "How much is 2 quarters + 1 dime + 1 nickel?",
            answer: "65¢",
            text: "25 + 25 = 50. + 10 = 60. + 5 = 65. So 65¢.",
          },
          {
            kind: "tip",
            text: "100 cents = 1 dollar. So if your coins add to 100¢, you have $1.00.",
          },
        ],
      },
      {
        id: "g2-money-word",
        title: "Money Word Problems",
        subtitle: "Buy things, make change.",
        emoji: "🛒",
        practiceCount: 5,
        generator: "g2-money-word",
        teach: [
          {
            kind: "text",
            text: "Money word problems use cents (¢) or dollars ($). If you buy something, you subtract the price from what you have. The answer is your change.",
          },
          {
            kind: "example",
            question: "You have 80¢. You buy an apple for 35¢. How much change do you get?",
            answer: "45¢",
            text: "80 − 35 = 45. You get 45¢ back.",
          },
          {
            kind: "tip",
            text: "Count up to make change: from 35¢, add 5 to make 40, add 10 to make 50, add 10 to make 60, add 10 to make 70, add 10 to make 80. That's 5 + 10 + 10 + 10 + 10 = 45¢.",
          },
        ],
      },
      {
        id: "g2-picture-graph",
        title: "Picture Graphs",
        subtitle: "Each picture stands for some votes.",
        emoji: "📊",
        practiceCount: 6,
        generator: "g2-picture-graph",
        teach: [
          {
            kind: "text",
            text: "A picture graph uses symbols or pictures to show data. The key tells you what each picture is worth — sometimes 1 picture = 1 vote, sometimes 1 picture = 2 votes.",
          },
          {
            kind: "example",
            question: "A picture graph shows 🔵🔵🔵 for Blue and 🔴🔴 for Red. If each symbol = 2 votes, how many votes did Blue get?",
            answer: "6",
            text: "3 symbols × 2 votes each = 6 votes for Blue.",
          },
          {
            kind: "tip",
            text: "Always check the key first! It tells you how much each picture is worth.",
          },
        ],
      },
      {
        id: "g2-bar-graph",
        title: "Bar Graphs",
        subtitle: "Bars show how tall each amount is.",
        emoji: "📈",
        practiceCount: 5,
        generator: "g2-bar-graph",
        teach: [
          {
            kind: "text",
            text: "A bar graph uses bars of different heights to show amounts. The taller the bar, the bigger the amount. Read the scale on the side to know the value.",
          },
          {
            kind: "example",
            question: "A bar graph shows: Pizza = 8, Tacos = 5. How many more picked Pizza than Tacos?",
            answer: "3",
            text: "8 − 5 = 3. Three more people picked Pizza.",
          },
          {
            kind: "tip",
            text: "'How many more' always means subtract. 'How many in all' always means add.",
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // DOMAIN 4 — Time & Measurement
  // ==========================================================================
  {
    id: "g2-time",
    title: "Time & Measurement",
    emoji: "🕐",
    color: "from-cyan-400 to-sky-400",
    description: "Clocks, length, inches, and centimeters.",
    lessons: [
      {
        id: "g2-time-5min",
        title: "Time to 5 Minutes",
        subtitle: "Read the clock in 5-minute steps.",
        emoji: "⏰",
        practiceCount: 6,
        generator: "g2-time-5min",
        teach: [
          {
            kind: "text",
            text: "The short hand points to the hour. The long hand points to the minutes. Each big number on the clock is 5 minutes: 1 = 5, 2 = 10, 3 = 15... all the way to 12 = 60 (or o'clock).",
          },
          {
            kind: "example",
            question: "What time is it when the hour hand is at 3 and the minute hand is at 6?",
            answer: "3:30",
            text: "Minute hand at 6 → 6 × 5 = 30 minutes. Hour hand at 3 → 3 o'clock. So 3:30.",
          },
          {
            kind: "tip",
            text: "Count by 5s around the clock: 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60.",
          },
        ],
      },
      {
        id: "g2-elapsed",
        title: "Elapsed Time",
        subtitle: "How long did it take?",
        emoji: "⏳",
        practiceCount: 5,
        generator: "g2-elapsed",
        teach: [
          {
            kind: "text",
            text: "Elapsed time is how much time passes from a start time to an end time. To find it, count the hours first, then the minutes.",
          },
          {
            kind: "example",
            question: "A movie starts at 3:00 and ends at 5:00. How long is the movie?",
            answer: "2 hours",
            text: "From 3 to 5 is 2 hours.",
          },
          {
            kind: "tip",
            text: "Draw a number line and jump by hours. Then jump the leftover minutes.",
          },
        ],
      },
      {
        id: "g2-length",
        title: "Measure Length",
        subtitle: "Inches, feet, centimeters, meters.",
        emoji: "📐",
        practiceCount: 6,
        generator: "g2-length",
        teach: [
          {
            kind: "text",
            text: "We measure length in inches (in), feet (ft), centimeters (cm), and meters (m). 12 inches = 1 foot. 100 centimeters = 1 meter. Smaller things use inches or cm; bigger things use feet or meters.",
          },
          {
            kind: "example",
            question: "A pencil is 7 inches long. A crayon is 4 inches long. How much longer is the pencil?",
            answer: "3 inches",
            text: "7 − 4 = 3. The pencil is 3 inches longer.",
          },
          {
            kind: "tip",
            text: "Always start measuring at the 0 mark on the ruler — not at the edge of the ruler!",
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // DOMAIN 5 — Geometry & Fractions
  // ==========================================================================
  {
    id: "g2-geometry",
    title: "Geometry & Fractions",
    emoji: "🔷",
    color: "from-violet-400 to-fuchsia-400",
    description: "Shapes, equal shares, and arrays.",
    lessons: [
      {
        id: "g2-shape-attrs",
        title: "Shape Attributes",
        subtitle: "Sides and angles of shapes.",
        emoji: "🔺",
        practiceCount: 6,
        generator: "g2-shape-attrs",
        teach: [
          {
            kind: "text",
            text: "Every shape has attributes: the number of sides, the number of angles (corners), and whether the sides are equal. A triangle has 3 sides and 3 angles. A quadrilateral has 4 sides and 4 angles. A pentagon has 5; a hexagon has 6.",
          },
          {
            kind: "example",
            question: "How many sides does a hexagon have?",
            answer: "6",
            text: "'Hex' means 6, so a hexagon has 6 sides and 6 angles.",
          },
          {
            kind: "tip",
            text: "Count the corners to count the angles — a polygon always has the same number of sides as angles.",
          },
        ],
      },
      {
        id: "g2-partition",
        title: "Partition Rectangles",
        subtitle: "Rows and columns make squares.",
        emoji: "▦",
        practiceCount: 6,
        generator: "g2-partition",
        teach: [
          {
            kind: "text",
            text: "A rectangle can be split into rows (going across) and columns (going down). If a rectangle has 3 rows and 4 columns, it has 3 × 4 = 12 small squares inside.",
          },
          {
            kind: "example",
            question: "A rectangle is cut into 2 rows and 5 columns. How many small squares is it divided into?",
            answer: "10",
            text: "2 rows × 5 columns = 10 squares.",
          },
          {
            kind: "tip",
            text: "Rows × Columns = Total squares. This is the same as multiplication, which you'll learn more about in 3rd grade!",
          },
        ],
      },
      {
        id: "g2-fractions",
        title: "Halves, Thirds & Fourths",
        subtitle: "Equal shares of a whole.",
        emoji: "🍕",
        practiceCount: 6,
        generator: "g2-fractions",
        teach: [
          {
            kind: "text",
            text: "A fraction is an equal share of a whole. Cut into 2 equal parts = halves. Cut into 3 equal parts = thirds. Cut into 4 equal parts = fourths (or quarters). Each part must be the same size!",
          },
          {
            kind: "example",
            question: "If a pizza is cut into 4 equal slices and you eat 1 slice, what fraction did you eat?",
            answer: "1/4",
            text: "You ate 1 out of 4 equal slices, so you ate one-fourth (1/4).",
          },
          {
            kind: "tip",
            text: "The bottom number (denominator) tells how many equal parts the whole is cut into. The top number (numerator) tells how many parts you have.",
          },
        ],
      },
      {
        id: "g2-arrays",
        title: "Arrays",
        subtitle: "Rows and columns show equal groups.",
        emoji: "🟪",
        practiceCount: 6,
        generator: "g2-arrays",
        teach: [
          {
            kind: "text",
            text: "An array is a neat arrangement of objects in rows and columns. Each row has the same number, and each column has the same number. Arrays help us see multiplication: 3 rows of 4 = 12 total.",
          },
          {
            kind: "example",
            question: "An array has 4 rows with 5 dots in each row. How many dots in all?",
            answer: "20",
            text: "4 rows × 5 dots = 20 dots in all.",
          },
          {
            kind: "tip",
            text: "Count by the row size: 5, 10, 15, 20. Skip-counting is faster than counting one by one!",
          },
        ],
      },
    ],
  },
];

export const GRADE2_LESSON_IDS = GRADE2_CURRICULUM.flatMap((d) =>
  d.lessons.map((l) => l.id)
);

export const GRADE2_TOTAL_LESSONS = GRADE2_LESSON_IDS.length;

// Per-domain sequential unlock for 2nd grade (mirrors the preschool helper).
export function prerequisiteLessonId(lessonId: string): string | null {
  for (const domain of GRADE2_CURRICULUM) {
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

export function findG2Lesson(lessonId: string) {
  for (const domain of GRADE2_CURRICULUM) {
    const lesson = domain.lessons.find((l) => l.id === lessonId);
    if (lesson) return { lesson, domain };
  }
  return null;
}

export function findG2Domain(domainId: string) {
  return GRADE2_CURRICULUM.find((d) => d.id === domainId) ?? null;
}
