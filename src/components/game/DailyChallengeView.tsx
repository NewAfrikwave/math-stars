"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, CalendarDays, Flame, Trophy, PlayCircle, CheckCircle2 } from "lucide-react";
import type { Problem } from "@/lib/types";
import { findLesson, CURRICULUM, ALL_LESSONS } from "@/lib/curriculum";
import { findPsLesson, PRESCHOOL_LESSON_IDS } from "@/lib/preschool";
import { GRADE1_LESSON_IDS } from "@/lib/grade1";
import { GRADE2_LESSON_IDS } from "@/lib/grade2";
import { GRADE4_LESSON_IDS } from "@/lib/grade4";
import { generateProblems } from "@/lib/generators";
import { useGameStore, findLessonAny, profileFetch } from "@/store/useGameStore";
import { QuizRunner } from "@/components/game/QuizRunner";
import { Mascot } from "@/components/game/Mascot";
import { Confetti } from "@/components/game/Confetti";
import { cn } from "@/lib/utils";

// Daily challenge: 5 mixed questions drawn from completed lessons.
// One attempt per calendar day. Feeds the streak and badges.
export function DailyChallengeView() {
  const setView = useGameStore((s) => s.setView);
  const soundOn = useGameStore((s) => s.soundOn);
  const level = useGameStore((s) => s.level);
  const progress = useGameStore((s) => s.progress);
  const dailyDoneDate = useGameStore((s) => s.dailyDoneDate);
  const dailyScore = useGameStore((s) => s.dailyScore);
  const recordDailyResult = useGameStore((s) => s.recordDailyResult);
  const streak = useGameStore((s) => s.streak);

  const today = new Date().toISOString().slice(0, 10);
  const doneToday = dailyDoneDate === today;

  const [running, setRunning] = useState(false);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [justFinished, setJustFinished] = useState<{ score: number; correct: number; total: number } | null>(null);

  // Build a 5-question mixed set from completed lessons (fallback: any available).
  const buildDailySet = (): Problem[] => {
    const ids =
      level === "preschool" ? PRESCHOOL_LESSON_IDS :
      level === "grade1" ? GRADE1_LESSON_IDS :
      level === "grade2" ? GRADE2_LESSON_IDS :
      level === "grade4" ? GRADE4_LESSON_IDS :
      ALL_LESSONS.map((fl) => fl.lessonId);
    const completed = ids.filter((id) => progress[id]?.status === "completed");
    const pool = completed.length >= 3 ? completed : ids.filter((id) => progress[id]?.status !== "locked");
    const chosen = [...pool].sort(() => Math.random() - 0.5).slice(0, 5);
    const out: Problem[] = [];
    for (const id of chosen) {
      const found = findLessonAny(id);
      if (!found) continue;
      out.push(generateProblems(found.lesson, 1)[0]);
    }
    return out;
  };

  const startDaily = () => {
    const set = buildDailySet();
    if (set.length === 0) return;
    setProblems(set);
    setRunning(true);
  };

  if (running) {
    return (
      <QuizRunner
        title="Daily Challenge"
        emoji="⚡"
        problems={problems}
        soundOn={soundOn}
        preschool={level === "preschool" || level === "grade1"}
        onExit={() => setRunning(false)}
        onFinish={({ correct, total }) => {
          const { score } = recordDailyResult(correct, total);
          // persist to server
          profileFetch("/api/daily", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correct, total }),
          }).catch(() => {});
          setJustFinished({ score, correct, total });
          setRunning(false);
        }}
      />
    );
  }

  // Just-finished celebration screen
  if (justFinished) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 pb-28 pt-10 text-center">
        <Confetti active={justFinished.score >= 60} />
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Mascot size={80} className="mx-auto animate-bob" />
          <h1 className="mt-2 font-display text-3xl font-bold">Daily Challenge Done!</h1>
          <p className="mt-1 text-muted-foreground">{justFinished.correct} of {justFinished.total} correct</p>
          <p className="mt-4 font-display text-5xl font-bold tabular-nums">{justFinished.score}%</p>
          <p className="mt-3 font-display text-lg font-semibold text-primary">
            {justFinished.score >= 80 ? "Fantastic work! Your streak grows! 🔥" : justFinished.score >= 50 ? "Nice job! Come back tomorrow! ⭐" : "Keep practicing — you've got this! 💪"}
          </p>
        </motion.div>
        <div className="mt-6 grid gap-3">
          <Button size="lg" onClick={() => setView({ name: "home" })} className="gap-2">
            <CheckCircle2 className="h-5 w-5" /> Back to home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-6">
      <Button variant="ghost" size="sm" onClick={() => setView({ name: "home" })} className="mb-4 gap-1">
        <ArrowLeft className="h-4 w-4" /> Home
      </Button>

      <div className="rounded-3xl bg-gradient-to-br from-fuchsia-500 to-rose-500 p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/25 text-4xl backdrop-blur">
            ⚡
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Daily Challenge</h1>
            <p className="text-sm text-white/90">5 mixed questions from everything you've learned. One try per day!</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4 rounded-2xl bg-white/15 px-4 py-3">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            <span className="font-display text-lg font-bold">{streak} day streak</span>
          </div>
          <div className="h-6 w-px bg-white/30" />
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-5 w-5" />
            {doneToday ? `Today: ${dailyScore}%` : "Not done today yet"}
          </div>
        </div>
      </div>

      {doneToday ? (
        <Card className="mt-6 flex flex-col items-center gap-3 p-8 text-center">
          <span className="text-5xl">✅</span>
          <p className="font-display text-xl font-bold">You did today's challenge!</p>
          <p className="text-sm text-muted-foreground">
            You scored {dailyScore}%. Come back tomorrow for a fresh set. Streak: {streak} 🔥
          </p>
          <Button variant="outline" onClick={() => setView({ name: "home" })} className="mt-2">
            Back to home
          </Button>
        </Card>
      ) : (
        <Card className="mt-6 flex flex-col items-center gap-3 p-8 text-center">
          <Mascot size={56} className="animate-bob" />
          <p className="font-display text-lg font-bold">Ready for today's challenge?</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            5 questions from across your topics. A great way to keep everything fresh!
          </p>
          <Button size="lg" onClick={startDaily} className="mt-2 gap-2">
            <PlayCircle className="h-5 w-5" /> Start today's challenge
          </Button>
        </Card>
      )}

      <Card className="mt-4 flex items-center gap-3 p-4">
        <Trophy className="h-8 w-8 shrink-0 text-amber-500" />
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Tip:</span> Do the daily challenge every day to grow your streak. Missing a day resets it to zero!
        </p>
      </Card>
    </div>
  );
}
