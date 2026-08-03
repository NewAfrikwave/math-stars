"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Lightbulb,
  PartyPopper,
  Heart,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type { Problem } from "@/lib/types";
import { checkAnswer } from "@/lib/generators";
import { AnswerInput } from "@/components/game/AnswerInput";
import { ProblemVisualRenderer } from "@/components/visuals/ProblemVisualRenderer";
import { Confetti } from "@/components/game/Confetti";
import { StickerBurst } from "@/components/game/StickerBurst";
import { SpeakButton } from "@/components/game/SpeakButton";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import { useTTS } from "@/hooks/use-tts";
import { useGameStore } from "@/store/useGameStore";
import { cn } from "@/lib/utils";

export interface QuizRunnerProps {
  title: string;
  emoji: string;
  problems: Problem[];
  onExit: () => void;
  /** Called when the learner finishes the set. Returns next-view info. */
  onFinish: (result: { correct: number; total: number }) => void;
  /** Optional: read-aloud the question text for each problem. */
  soundOn?: boolean;
  /** Preschool mode: big number-pad input + auto-read questions. */
  preschool?: boolean;
}

// A reusable quiz runner used by Practice, Review, and Daily Challenge so they
// share the same delightful UX (visuals, feedback, confetti, read-aloud).
export function QuizRunner({
  title,
  emoji,
  problems,
  onExit,
  onFinish,
  soundOn = true,
  preschool = false,
}: QuizRunnerProps) {
  const [index, setIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState<unknown>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const siteSettings = useGameStore((s) => s.siteSettings);
  const sfx = useSoundEffects(soundOn && siteSettings?.soundEffectsEnabled !== false);
  const { speak } = useTTS();

  // Auto-read the question for preschoolers when it appears.
  // (Defined before the early return so hooks run unconditionally.)
  const problem = problems[index];
  useEffect(() => {
    if (!preschool || !soundOn || !problem) return;
    const text = [problem.story, problem.prompt].filter(Boolean).join(" ");
    const t = setTimeout(() => speak(text), 400);
    return () => clearTimeout(t);
  }, [problem?.id, preschool, soundOn, speak, problem]);

  if (problems.length === 0) {
    return (
      <div className="p-8 text-center">
        <p>No questions available yet.</p>
        <Button onClick={onExit} className="mt-4">Go back</Button>
      </div>
    );
  }

  const isLast = index === problems.length - 1;

  const handleSubmit = (override?: unknown) => {
    if (submitted) return;
    const answer = override !== undefined ? override : currentAnswer;
    if (answer === null || answer === "" || answer === undefined) return;
    const ok = checkAnswer(problem, answer);
    setSubmitted(true);
    if (ok) {
      setCorrectCount((c) => c + 1);
      setCelebrate(true);
      sfx.playCorrect();
      setTimeout(() => setCelebrate(false), 1500);
    } else {
      sfx.playWrong();
    }
  };

  const handleNext = () => {
    if (isLast) {
      onFinish({ correct: correctCount, total: problems.length });
      return;
    }
    setIndex((i) => i + 1);
    setCurrentAnswer(null);
    setSubmitted(false);
    setShowHint(false);
  };

  const isCorrect = submitted && checkAnswer(problem, currentAnswer);
  const progressValue = ((index + (submitted ? 1 : 0)) / problems.length) * 100;

  // Build the full read-aloud text for the current problem.
  const unit = problem.answerType === "number" ? problem.unit : undefined;
  const speakText = [problem.story, problem.prompt, unit ? `(answer in ${unit})` : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-32 pt-6">
      <Confetti active={celebrate} />
      <StickerBurst active={celebrate} />

      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onExit} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Exit
        </Button>
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <span className="text-2xl">{emoji}</span>
          <span className="hidden sm:inline">{title}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-sm font-bold text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
          <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
          {correctCount}/{problems.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <Progress value={progressValue} className="h-3" />
        <p className="mt-1 text-center text-xs font-medium text-muted-foreground">
          Question {index + 1} of {problems.length}
        </p>
      </div>

      {/* Problem card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={problem.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          <Card
            className={cn(
              "border-2 p-5 shadow-sm sm:p-7",
              submitted && isCorrect && "border-emerald-400",
              submitted && !isCorrect && "border-rose-400",
            )}
          >
            {problem.story && (
              <div className="mb-3 flex items-start justify-between gap-2 rounded-xl bg-muted/60 p-3">
                <p className="text-sm font-medium italic text-muted-foreground">{problem.story}</p>
                {soundOn && (
                  <SpeakButton
                    text={problem.story}
                    size="sm"
                    label=""
                    className="shrink-0"
                  />
                )}
              </div>
            )}
            <div className="mb-4 flex items-start justify-between gap-2">
              <h2 className="font-display text-xl font-bold leading-snug sm:text-2xl">
                {problem.prompt}
              </h2>
              {soundOn && !problem.story && (
                <SpeakButton text={speakText} size="sm" className="shrink-0" />
              )}
            </div>

            {problem.visual && (
              <div className="mb-5 flex justify-center">
                <ProblemVisualRenderer visual={problem.visual} />
              </div>
            )}

            <div className="mt-2">
              <AnswerInput
                problem={problem}
                submitted={submitted}
                onAnswerChange={setCurrentAnswer}
                onSubmit={handleSubmit}
                bigButtons={preschool}
              />
            </div>

            {/* Hint */}
            {!submitted && problem.hint && (
              <div className="mt-4">
                {showHint ? (
                  <div className="animate-pop-in flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <span>{problem.hint}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowHint(true)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 hover:underline"
                  >
                    <Lightbulb className="h-4 w-4" /> Need a hint?
                  </button>
                )}
              </div>
            )}

            {/* Feedback */}
            <AnimatePresence>
              {submitted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "mt-5 rounded-2xl p-4",
                    isCorrect
                      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                      : "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
                  )}
                >
                  <div className="flex items-center gap-2 font-display text-lg font-bold">
                    {isCorrect ? (
                      <>
                        <PartyPopper className="h-5 w-5" /> Yes! That's right!
                      </>
                    ) : (
                      <>
                        <Heart className="h-5 w-5" /> Not quite — but that's how we learn!
                      </>
                    )}
                  </div>
                  {problem.explanation && (
                    <p className="mt-1 text-sm">
                      {!isCorrect && (
                        <span className="font-semibold">
                          Correct answer: {formatAnswer(problem)}.{" "}
                        </span>
                      )}
                      {problem.explanation}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Footer actions */}
      <div className="mt-5 flex items-center justify-center gap-3">
        {!submitted ? (
          <span className="text-sm text-muted-foreground">Pick or type your answer, then press Check ✓</span>
        ) : (
          <Button size="lg" onClick={handleNext} className="gap-2 px-8">
            {isLast ? (
              <>
                <Sparkles className="h-5 w-5" /> See my results
              </>
            ) : (
              <>
                Next question <ChevronRight className="h-5 w-5" />
              </>
            )}
          </Button>
        )}
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={() => {
            setIndex(0);
            setCurrentAnswer(null);
            setSubmitted(false);
            setShowHint(false);
            setCorrectCount(0);
          }}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" /> Restart this set
        </button>
      </div>
    </div>
  );
}

function formatAnswer(problem: Problem): string {
  switch (problem.answerType) {
    case "number":
      return `${problem.answer}${problem.unit ? ` ${problem.unit}` : ""}`;
    case "multiple-choice":
      return problem.choices[problem.correctIndex];
    case "true-false":
      return problem.isTrue ? "True" : "False";
    case "fraction":
      return `${problem.numerator}/${problem.denominator}`;
    case "time":
      return `${problem.hour}:${String(problem.minute).padStart(2, "0")}`;
    case "numberline":
      return `${problem.numerator}/${problem.denominator}`;
    case "shape-classify":
      return problem.correctCategory;
    default:
      return "";
  }
}
