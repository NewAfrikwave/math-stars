"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Heart,
  Lightbulb,
  Loader2,
  Mic2,
  PartyPopper,
  RotateCcw,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import { AnimatedNumber, springy, staggerContainer, staggerItem } from "@/components/game/MotionKit";
import { correctAnswerPraise } from "@/lib/celebrations";
import { resolveSubmittedAnswer } from "@/lib/answer-submit";
import { pipCelebrationMotion } from "@/lib/celebration-motion";

export interface QuizRunnerProps {
  title: string;
  emoji: string;
  problems: Problem[];
  onExit: () => void;
  onFinish: (result: { correct: number; total: number }) => void | Promise<void>;
  soundOn?: boolean;
  preschool?: boolean;
}

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
  const correctCountRef = useRef(0);
  const [showHint, setShowHint] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [praiseText, setPraiseText] = useState("");
  const siteSettings = useGameStore((s) => s.siteSettings);
  const studentName = useGameStore((s) => s.studentName);
  const sfx = useSoundEffects(soundOn && siteSettings?.soundEffectsEnabled !== false);
  const { speak, speakImmediately, stop } = useTTS();
  const reducedMotion = useReducedMotion();
  const pipMotion = pipCelebrationMotion(Boolean(reducedMotion));

  const problem = problems[index];
  useEffect(() => {
    if (!preschool || !soundOn || !problem) return;
    const text = [problem.story, problem.prompt].filter(Boolean).join(" ");
    const timer = window.setTimeout(() => speak(text), 500);
    return () => {
      window.clearTimeout(timer);
      stop();
    };
  }, [problem?.id, preschool, soundOn, speak, stop, problem]);

  if (problems.length === 0) {
    return (
      <div className="p-8 text-center">
        <p>No questions available yet.</p>
        <Button onClick={onExit} className="mt-4">Go back</Button>
      </div>
    );
  }

  const isLast = index === problems.length - 1;
  const isCorrect = submitted && checkAnswer(problem, currentAnswer);
  const progressValue = ((index + (submitted ? 1 : 0)) / problems.length) * 100;
  const unit = problem.answerType === "number" ? problem.unit : undefined;
  const speakText = [problem.story, problem.prompt, unit ? `Answer in ${unit}.` : ""]
    .filter(Boolean)
    .join(" ");
  const steps = getLearningSteps(problem, preschool);

  const handleSubmit = (override?: unknown) => {
    if (submitted) return;
    const answer = resolveSubmittedAnswer(problem, currentAnswer, override);
    if (answer === null || answer === "" || answer === undefined) return;
    const ok = checkAnswer(problem, answer);
    setSubmitted(true);
    if (ok) {
      const praise = correctAnswerPraise(preschool, index, correctCountRef.current, studentName);
      correctCountRef.current += 1;
      setCorrectCount(correctCountRef.current);
      setPraiseText(praise);
      setCelebrate(true);
      sfx.playCorrect();
      if (soundOn) {
        speakImmediately(praise, { speed: preschool ? 0.86 : 0.96 });
      }
      window.setTimeout(() => setCelebrate(false), 2800);
    } else {
      setPraiseText("");
      sfx.playWrong();
    }
  };

  const handleNext = async () => {
    if (isLast) {
      if (finishing) return;
      setFinishing(true);
      setFinishError(null);
      try {
        await onFinish({ correct: correctCountRef.current, total: problems.length });
      } catch (error) {
        setFinishError(error instanceof Error ? error.message : "Your progress could not be saved. Please try again.");
        setFinishing(false);
      }
      return;
    }
    setIndex((value) => value + 1);
    setCurrentAnswer(null);
    setSubmitted(false);
    setShowHint(false);
    setPraiseText("");
  };

  const restart = () => {
    stop();
    setIndex(0);
    setCurrentAnswer(null);
    setSubmitted(false);
    setShowHint(false);
    setCorrectCount(0);
    correctCountRef.current = 0;
    setPraiseText("");
    setCelebrate(false);
    setFinishing(false);
    setFinishError(null);
    // Force every answer control to remount, including when question 1 is
    // already visible. Typed, spoken, and selected answers must all clear.
    setSessionKey((value) => value + 1);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[#fffdf8] pb-24 dark:bg-background">
      <Confetti active={celebrate} />
      <StickerBurst active={celebrate} />

      <div className="border-b border-[#eadfce] bg-white/95 dark:bg-card">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-4 sm:px-6">
          <Button variant="ghost" size="sm" onClick={onExit} className="gap-1.5 rounded-full">
            <ArrowLeft className="h-4 w-4" /> Exit
          </Button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate font-display text-sm font-bold text-[#245637] sm:text-lg">
              <span aria-hidden="true" className="mr-2">{emoji}</span>{title}
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl border border-[#eee2d2] bg-white px-3 py-2 shadow-sm dark:bg-card">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            <motion.span key={correctCount} initial={{ scale: 0.65, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={springy} className="font-display font-bold tabular-nums"><AnimatedNumber value={correctCount} /></motion.span>
          </div>
          <div className="hidden w-48 sm:block">
            <div className="mb-1 flex justify-between text-xs font-semibold text-muted-foreground">
              <span>Question {index + 1} of {problems.length}</span>
              <span>{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} className="h-2.5" />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="mb-5 sm:hidden">
          <div className="mb-1 flex justify-between text-xs font-semibold text-muted-foreground">
            <span>Question {index + 1} of {problems.length}</span>
            <span>{Math.round(progressValue)}%</span>
          </div>
          <Progress value={progressValue} className="h-2.5" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${sessionKey}-${problem.id}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={springy}
            className="overflow-hidden rounded-[28px] border border-[#eadfce] bg-white shadow-[0_18px_55px_rgba(83,61,35,0.09)] dark:bg-card lg:grid lg:min-h-[610px] lg:grid-cols-[0.86fr_1.5fr]"
          >
            <section className="border-b border-[#eadfce] bg-[#fffaf2] p-6 dark:bg-muted/20 lg:border-b-0 lg:border-r lg:p-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#b35b3d]">Your question</p>
              <h1 className={cn(
                "font-display font-bold leading-[1.16] text-[#292018]",
                preschool ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl",
                "dark:text-foreground",
              )}>
                {[problem.story, problem.prompt].filter(Boolean).join(" ")}
              </h1>

              {soundOn && (
                <div className="mt-6">
                  <SpeakButton
                    text={speakText}
                    label="Read aloud"
                    size="lg"
                    variant="solid"
                    speed={preschool ? 0.82 : 0.92}
                    className="w-full justify-center bg-[#285f3b] py-3.5 hover:bg-[#1f4d30]"
                  />
                  <p className="mt-2 text-center text-xs text-muted-foreground">Tap again to stop</p>
                </div>
              )}

              <motion.ol variants={staggerContainer} initial="hidden" animate="visible" className="mt-8 space-y-5">
                {steps.map((step, stepIndex) => (
                  <motion.li variants={staggerItem} key={step.title} className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dfead7] font-display text-sm font-bold text-[#285f3b]">
                      {stepIndex + 1}
                    </span>
                    <div>
                      <p className="font-display text-lg font-bold text-[#285f3b] dark:text-emerald-300">{step.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                    </div>
                  </motion.li>
                ))}
              </motion.ol>
            </section>

            <section className="flex min-w-0 flex-col p-5 sm:p-7 lg:p-9">
              {problem.visual && (
                <div className="flex min-h-[230px] flex-1 items-center justify-center rounded-3xl border border-[#e5ddcf] bg-[#fffdf8] p-4 dark:bg-background/30 sm:p-6">
                  <ProblemVisualRenderer visual={problem.visual} />
                </div>
              )}

              <div className={cn("mx-auto w-full", problem.visual ? "mt-6" : "my-auto max-w-2xl")}>
                <p className="mb-3 text-center font-display text-lg font-bold">
                  {getAnswerPrompt(problem)}
                </p>
                <AnswerInput
                  problem={problem}
                  submitted={submitted}
                  onAnswerChange={setCurrentAnswer}
                  onSubmit={handleSubmit}
                  bigButtons={preschool}
                />
              </div>

              <AnimatePresence>
                {submitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="status"
                    className={cn(
                      "mt-5 overflow-hidden rounded-2xl border p-4",
                      isCorrect
                        ? "border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 via-amber-50 to-rose-50 text-emerald-950 shadow-lg dark:border-emerald-800 dark:from-emerald-950/50 dark:via-amber-950/30 dark:to-rose-950/30 dark:text-emerald-100"
                        : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100",
                    )}
                  >
                    {isCorrect ? (
                      <div className="flex items-center gap-4">
                        <motion.div
                          animate={pipMotion.animate}
                          transition={pipMotion.transition}
                          className="relative h-24 w-20 shrink-0 sm:h-28 sm:w-24"
                        >
                          <Image src="/pip-explorer.webp" alt="Pip cheers for your correct answer" fill sizes="96px" className="object-contain object-top drop-shadow-md" />
                        </motion.div>
                        <div>
                          <p className="flex items-start gap-2 font-display text-xl font-black leading-tight text-emerald-800 dark:text-emerald-200 sm:text-2xl">
                            <PartyPopper className="mt-0.5 h-7 w-7 shrink-0 text-rose-500" /> {praiseText || "You got it!"}
                          </p>
                          <p className="mt-1 font-display text-lg font-black text-[#8f3b55] dark:text-rose-200">Pip is celebrating your smart work!</p>
                          <p className="mt-1 text-sm font-semibold leading-relaxed">{problem.explanation}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 font-display text-lg font-bold">
                          <Heart className="h-5 w-5" /> Good try. Let’s learn from it.
                        </div>
                        <p className="mt-1 text-sm leading-relaxed">
                          <span className="font-bold">The answer is {formatAnswer(problem)}. </span>
                          {problem.explanation}
                        </p>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                {!submitted && problem.hint ? (
                  showHint ? (
                    <div className="flex flex-1 items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <span>{problem.hint}</span>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={() => setShowHint(true)} className="gap-2 rounded-full border-amber-300 text-amber-800">
                      <Lightbulb className="h-4 w-4" /> Show me a hint
                    </Button>
                  )
                ) : <span />}

                {submitted && (
                  <Button size="lg" onClick={handleNext} disabled={finishing} className="ml-auto gap-2 rounded-full bg-[#285f3b] px-7 hover:bg-[#1f4d30]">
                    {finishing ? <><Loader2 className="h-5 w-5 animate-spin" /> Saving your progress…</>
                      : isLast ? <><Sparkles className="h-5 w-5" /> Save and see results</>
                      : <>Next question <ChevronRight className="h-5 w-5" /></>}
                  </Button>
                )}
              </div>
              {finishError && (
                <div role="alert" className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
                  <p>We have not marked this lesson complete yet.</p>
                  <p className="mt-1 font-normal">{finishError}</p>
                  <p className="mt-1 font-normal">Your answers are still here. Tap “Save and see results” to try again.</p>
                </div>
              )}
            </section>
          </motion.div>
        </AnimatePresence>

        <div className="mt-5 flex flex-col gap-3 rounded-3xl border border-[#eadfce] bg-white p-4 shadow-sm dark:bg-card sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-14 shrink-0 overflow-hidden">
              <Image src="/pip-explorer.webp" alt="Pip the math guide" fill sizes="56px" className="object-contain object-top" />
            </div>
            <div>
              <p className="font-display font-bold text-[#285f3b] dark:text-emerald-300">Pip is here to help</p>
              <p className="text-sm text-muted-foreground">Take your time. Look, say it, then solve it.</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
              <Mic2 className="h-4 w-4" /> Voice ready
            </div>
            <button onClick={restart} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
              <RotateCcw className="h-3.5 w-3.5" /> Restart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getLearningSteps(problem: Problem, preschool: boolean) {
  if (problem.visual?.kind === "sharing-baskets") {
    return [
      { title: "See what you know", text: `Start with ${problem.visual.total} ${problem.visual.label ?? "items"}. Each basket holds ${problem.visual.perGroup}.` },
      { title: "Share equally", text: `Make baskets with ${problem.visual.perGroup} in each until every item has a place.` },
      { title: "Count the baskets", text: "The number of equal baskets you made is the answer." },
    ];
  }
  if (problem.visual?.kind === "equal-groups") {
    return [
      { title: "See it", text: "Look at each real basket and count the objects inside." },
      { title: "Say it", text: `Say “${problem.visual.groups} groups of ${problem.visual.perGroup}.”` },
      { title: "Solve it", text: "Find how many objects there are altogether." },
    ];
  }
  if (problem.lessonId === "g4-equiv-frac") {
    return [
      { title: "Keep the same value", text: "Equivalent fractions name the same amount of the whole." },
      { title: "Scale both parts", text: "Multiply the numerator and denominator by the same number." },
      { title: "Check the match", text: "Choose the fraction whose top and bottom changed by that same factor." },
    ];
  }
  if (problem.lessonId === "g4-compare-frac") {
    return [
      { title: "Notice the denominators", text: "The fractions have different-sized parts, so compare them on equal terms." },
      { title: "Make a fair comparison", text: "Use a common denominator or cross-multiply." },
      { title: "Choose the symbol", text: "Pick <, =, or > to show how the first fraction compares with the second." },
    ];
  }
  if (problem.lessonId === "g4-add-frac") {
    return [
      { title: "Check the operation", text: "Look for the plus or minus sign. The denominators already match." },
      { title: "Work with the numerators", text: "Add or subtract the top numbers and keep the denominator." },
      { title: "Simplify", text: "Reduce the result if the numerator and denominator share a factor." },
    ];
  }
  if (problem.lessonId === "g4-mult-frac") {
    return [
      { title: "Read the groups", text: "A whole number times a fraction means repeated equal fractional groups." },
      { title: "Multiply the top", text: "Multiply the whole number by the numerator. Keep the denominator." },
      { title: "Simplify", text: "Reduce the fraction or write an equivalent mixed number when needed." },
    ];
  }
  if (problem.lessonId === "g4-mixed-numbers") {
    return [
      { title: "Find the wholes", text: "Divide the numerator by the denominator." },
      { title: "Use the remainder", text: "The quotient is the whole number. Put the remainder over the original denominator." },
      { title: "Check", text: "Multiply the whole by the denominator, then add the remainder to recover the numerator." },
    ];
  }
  if (problem.lessonId === "g4-frac-dec") {
    return [
      { title: "Read the fraction", text: "The fraction bar means numerator divided by denominator." },
      { title: "Divide", text: "Divide the top number by the bottom number." },
      { title: "Match the decimal", text: "Choose the decimal that names the same amount as the shaded model." },
    ];
  }
  if (problem.visual?.kind === "fraction-pie" || problem.visual?.kind === "fraction-bar") {
    return [
      { title: "See the parts", text: "Count all of the equal parts in the whole." },
      { title: "Find the shaded parts", text: "Count only the parts that are filled in." },
      { title: "Name the fraction", text: "Put shaded parts over total equal parts." },
    ];
  }
  if (problem.visual?.kind === "clock") {
    return [
      { title: "Find the hour", text: "Look first at the short hand." },
      { title: "Count the minutes", text: "Use the long hand and count by fives." },
      { title: "Say the time", text: "Put the hour and minutes together." },
    ];
  }
  return preschool
    ? [
        { title: "Listen", text: "Tap Read aloud and listen to the whole question." },
        { title: "Look", text: "Point to the numbers or shapes you need." },
        { title: "Choose", text: "Pick the answer that makes sense." },
      ]
    : [
        { title: "Understand", text: "Read the question and find what it is asking." },
        { title: "Make a plan", text: "Use the picture, numbers, or a math fact." },
        { title: "Solve and check", text: "Choose your answer, then check your thinking." },
      ];
}

function getAnswerPrompt(problem: Problem) {
  if (problem.answerType === "multiple-choice" || problem.answerType === "true-false") return "Choose the best answer";
  if (problem.answerType === "fraction") return "Write the fraction";
  if (problem.answerType === "time") return "What time is shown?";
  if (problem.answerType === "number" && problem.unit) return `What is your answer in ${problem.unit}?`;
  return "What is your answer?";
}

function formatAnswer(problem: Problem): string {
  switch (problem.answerType) {
    case "number": return `${problem.answer}${problem.unit ? ` ${problem.unit}` : ""}`;
    case "multiple-choice": return problem.choices[problem.correctIndex];
    case "true-false": return problem.isTrue ? "True" : "False";
    case "fraction": return `${problem.numerator}/${problem.denominator}`;
    case "time": return `${problem.hour}:${String(problem.minute).padStart(2, "0")}`;
    case "numberline": return `${problem.numerator}/${problem.denominator}`;
    case "shape-classify": return problem.correctCategory;
    default: return "";
  }
}
