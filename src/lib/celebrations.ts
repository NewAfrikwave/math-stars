const YOUNGER_PRAISE = [
  "Hooray! You got it!",
  "Great job, math star!",
  "Amazing work!",
  "You did it!",
] as const;

const OLDER_PRAISE = [
  "Excellent thinking!",
  "Math star! You got it!",
  "Brilliant work!",
  "You nailed it!",
] as const;

export function correctAnswerPraise(youngerLearner: boolean, questionIndex: number, correctCount: number) {
  const phrases = youngerLearner ? YOUNGER_PRAISE : OLDER_PRAISE;
  return phrases[(questionIndex + correctCount) % phrases.length];
}
