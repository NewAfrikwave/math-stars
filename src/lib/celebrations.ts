const YOUNGER_PRAISE = [
  (name: string) => `Hooray, ${name}! You did it!`,
  (name: string) => `Good job, ${name}! Your math brain is growing!`,
  (name: string) => `Well done, ${name}! You found the answer!`,
  (name: string) => `Amazing work, ${name}! Keep shining!`,
] as const;

const OLDER_PRAISE = [
  (name: string) => `Well done, ${name}! Your careful thinking paid off!`,
  (name: string) => `Good job, ${name}! You found the pattern!`,
  (name: string) => `Excellent work, ${name}! That was strong math thinking!`,
  (name: string) => `Brilliant, ${name}! You solved it with confidence!`,
] as const;

export function celebrationName(studentName: string) {
  const firstName = studentName.trim().split(/\s+/)[0];
  return firstName && firstName.toLowerCase() !== "star" ? firstName : "Math Star";
}

export function correctAnswerPraise(
  youngerLearner: boolean,
  questionIndex: number,
  correctCount: number,
  studentName = "Math Star",
) {
  const phrases = youngerLearner ? YOUNGER_PRAISE : OLDER_PRAISE;
  const phrase = phrases[(questionIndex + correctCount) % phrases.length];
  return phrase(celebrationName(studentName));
}
