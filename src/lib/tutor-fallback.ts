export function tutorFallback(
  message: string,
  lesson?: { title: string; subtitle?: string },
) {
  const clean = message.toLowerCase().replace(/,/g, " ");
  const multiplication = clean.match(/\b(\d{1,2})\s*(?:x|×|times|multiplied by)\s*(\d{1,2})\b/);
  if (multiplication) {
    const left = Number(multiplication[1]);
    const right = Number(multiplication[2]);
    return `${left} × ${right} means ${left} equal groups of ${right}. Count by ${right}, ${left} times. You can try ${Array.from({ length: left }, (_, index) => right * (index + 1)).join(", ")}. What number did you reach? 🌟`;
  }

  const table = clean.match(/\b(\d{1,2})(?:\s*times|\s*x|×)\s*table\b/);
  if (table) {
    const value = Math.min(12, Math.max(2, Number(table[1])));
    return `Let’s practice the ${value} times table. Start by skip-counting: ${Array.from({ length: 6 }, (_, index) => value * (index + 1)).join(", ")}. What comes next?`;
  }

  if (/fraction|numerator|denominator/.test(clean)) {
    return "Think of a pizza cut into equal slices. The bottom number tells how many equal slices there are. The top number tells how many slices you have. What numbers do you see in your fraction? 🍕";
  }

  if (/group|basket|multiplication|multiply/.test(clean) || /equal groups/i.test(lesson?.title ?? "")) {
    return "Let’s use equal groups. Count how many groups you see, then count how many objects are in each group. You can skip-count by the number in each group. What numbers did you find?";
  }

  if (lesson) {
    return `I can still help with ${lesson.title}. ${lesson.subtitle ?? "Look at the example one small step at a time."} Tell me which part feels confusing, and we’ll solve it together.`;
  }

  return "I’m ready to help. Tell me the numbers in the problem and whether you are adding, subtracting, multiplying, dividing, or working with shapes or fractions.";
}
