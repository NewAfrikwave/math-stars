// Convert math-laden text into speech-friendly text so the TTS engine reads
// "5 × 5" as "five times five" instead of "five five" (skipping the symbol)
// or "five ex five".

const NUMBER_WORDS: Record<number, string> = {
  0: "zero", 1: "one", 2: "two", 3: "three", 4: "four", 5: "five",
  6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten",
  11: "eleven", 12: "twelve", 13: "thirteen", 14: "fourteen", 15: "fifteen",
  16: "sixteen", 17: "seventeen", 18: "eighteen", 19: "nineteen", 20: "twenty",
  30: "thirty", 40: "forty", 50: "fifty", 60: "sixty", 70: "seventy", 80: "eighty", 90: "ninety",
};

const TENS_WORDS: Record<number, string> = {
  2: "twenty", 3: "thirty", 4: "forty", 5: "fifty", 6: "sixty", 7: "seventy", 8: "eighty", 9: "ninety",
};

export function numberToWords(n: number): string {
  if (NUMBER_WORDS[n]) return NUMBER_WORDS[n];
  if (n < 100) {
    const tens = Math.floor(n / 10) * 10;
    const ones = n % 10;
    return ones ? `${TENS_WORDS[tens / 10]} ${NUMBER_WORDS[ones]}` : TENS_WORDS[tens / 10];
  }
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    return rest ? `${NUMBER_WORDS[h]} hundred ${numberToWords(rest)}` : `${NUMBER_WORDS[h]} hundred`;
  }
  return String(n);
}

// Denominator "ordinal-ish" words for common fraction denominators.
const DENOM_WORDS: Record<number, string> = {
  2: "half", 3: "third", 4: "fourth", 5: "fifth", 6: "sixth", 8: "eighth", 10: "tenth",
};

// Turn a prompt/story string into something a TTS engine reads naturally.
export function speakableText(text: string): string {
  let s = text;

  // Fractions first (before standalone number handling): "3/4" → "three fourths"
  s = s.replace(/(\d+)\s*\/\s*(\d+)/g, (_m, n, d) => {
    const num = Number(n);
    const den = Number(d);
    if (DENOM_WORDS[den]) {
      const plural = num > 1 ? `${DENOM_WORDS[den]}s` : DENOM_WORDS[den];
      return `${numberToWords(num)} ${plural}`;
    }
    return `${numberToWords(num)} over ${numberToWords(den)}`;
  });

  // Times: "3:45" → "three forty five" (clock reading)
  s = s.replace(/\b(\d{1,2}):(\d{2})\b/g, (_m, h, mm) => {
    const hour = Number(h);
    const minute = Number(mm);
    if (minute === 0) return `${numberToWords(hour)} o'clock`;
    if (minute < 10) return `${numberToWords(hour)} oh ${numberToWords(minute)}`;
    return `${numberToWords(hour)} ${numberToWords(minute)}`;
  });

  // Math symbols → words. Use the unicode minus (U+2212) we render in prompts;
  // leave ASCII hyphens alone so words like "twenty-one" stay intact.
  s = s.replace(/×/g, " times ");
  s = s.replace(/÷/g, " divided by ");
  s = s.replace(/-/g, " minus "); // unicode minus
  s = s.replace(/\+/g, " plus ");
  s = s.replace(/=/g, " equals ");
  s = s.replace(/≥/g, " is greater than or equal to ");
  s = s.replace(/≤/g, " is less than or equal to ");
  s = s.replace(/>/g, " is greater than ");
  s = s.replace(/</g, " is less than ");
  s = s.replace(/≠/g, " is not equal to ");

  // Big numbers with commas: "1,000" → "one thousand"
  s = s.replace(/\b(\d{1,3}(,\d{3})+)\b/g, (m) => numberToWords(Number(m.replace(/,/g, ""))));

  // Squeeze repeated whitespace from all the replacements.
  s = s.replace(/\s+/g, " ").trim();
  return s;
}
