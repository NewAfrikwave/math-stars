import type { Problem } from "@/lib/types";

/**
 * Choice controls submit their selected value immediately. Typed controls are
 * submitted by a button, and React passes that button's click event to a bare
 * event handler. Never let that event replace the learner's typed answer.
 */
export function resolveSubmittedAnswer(
  problem: Problem,
  currentAnswer: unknown,
  immediateAnswer?: unknown,
) {
  if (
    (problem.answerType === "multiple-choice" || problem.answerType === "true-false") &&
    immediateAnswer !== undefined
  ) {
    return immediateAnswer;
  }
  return currentAnswer;
}
