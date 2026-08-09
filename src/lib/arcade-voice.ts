import { celebrationName, correctAnswerPraise } from "@/lib/celebrations";
import type { PublicArcadeQuestion } from "@/lib/arcade";

const RETRY_ENCOURAGEMENT = [
  "Good try. Take another look and keep going.",
  "Nice effort. Every try helps your math brain grow.",
  "You are still learning. Let’s use the clue and try the next one.",
  "That one was tricky. You can do the next challenge.",
] as const;

export function arcadeQuestionSpeech(question: Pick<PublicArcadeQuestion, "prompt" | "helper" | "choices">) {
  const choices = question.choices.map(String).filter(Boolean);
  const choiceText = choices.length > 1
    ? `Your choices are ${choices.slice(0, -1).join(", ")}, or ${choices.at(-1)}.`
    : choices.length === 1
      ? `Your choice is ${choices[0]}.`
      : "";
  return [question.prompt, question.helper, choiceText].filter(Boolean).join(" ");
}

export function arcadeFeedbackSpeech(input: {
  correct: boolean;
  explanation?: string | null;
  youngerLearner: boolean;
  questionIndex: number;
  correctCount: number;
  studentName: string;
}) {
  const message = input.correct
    ? correctAnswerPraise(input.youngerLearner, input.questionIndex, input.correctCount, input.studentName)
    : `${celebrationName(input.studentName)}, ${RETRY_ENCOURAGEMENT[input.questionIndex % RETRY_ENCOURAGEMENT.length]}`;
  return [message, input.explanation].filter(Boolean).join(" ");
}

export function arcadeRoundSpeech(studentName: string, correct: number, total: number, coinsEarned: number) {
  const name = celebrationName(studentName);
  return `Round complete, ${name}! You answered ${correct} out of ${total} correctly and earned ${coinsEarned} coins. Keep shining!`;
}
