"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, RefreshCw, Star, Lock, PlayCircle } from "lucide-react";
import type { Problem } from "@/lib/types";
import { findLesson, CURRICULUM, ALL_LESSONS } from "@/lib/curriculum";
import { findPsLesson, PRESCHOOL_CURRICULUM, PRESCHOOL_LESSON_IDS } from "@/lib/preschool";
import { GRADE1_CURRICULUM, GRADE1_LESSON_IDS } from "@/lib/grade1";
import { GRADE2_CURRICULUM, GRADE2_LESSON_IDS } from "@/lib/grade2";
import { GRADE4_CURRICULUM, GRADE4_LESSON_IDS } from "@/lib/grade4";
import { generateProblems } from "@/lib/generators";
import { useGameStore, useProgressSignature, findLessonAny } from "@/store/useGameStore";
import { QuizRunner } from "@/components/game/QuizRunner";
import { Mascot } from "@/components/game/Mascot";
import { cn } from "@/lib/utils";

// Smart review queue: pulls questions from lessons the learner has struggled
// with (low best score) or started but not finished. Spaced practice keeps
// earlier topics fresh.
export function ReviewView() {
  const setView = useGameStore((s) => s.setView);
  const soundOn = useGameStore((s) => s.soundOn);
  const level = useGameStore((s) => s.level);
  const progress = useGameStore((s) => s.progress);
  const progressSig = useProgressSignature();

  const queue = useMemo(() => {
    void progressSig;
    const ids =
      level === "preschool" ? PRESCHOOL_LESSON_IDS :
      level === "grade1" ? GRADE1_LESSON_IDS :
      level === "grade2" ? GRADE2_LESSON_IDS :
      level === "grade4" ? GRADE4_LESSON_IDS :
      ALL_LESSONS.map((fl) => fl.lessonId);
    const needs: Array<{ lessonId: string; bestScore: number; stars: number }> = [];
    for (const id of ids) {
      const p = progress[id];
      if (!p) continue;
      if (p.status === "locked") continue;
      if (p.status === "completed" && p.bestScore >= 90) continue;
      needs.push({ lessonId: id, bestScore: p.bestScore, stars: p.stars });
    }
    needs.sort((a, b) => a.bestScore - b.bestScore || a.lessonId.localeCompare(b.lessonId));
    return needs;
  }, [progressSig, progress, level]);

  const [running, setRunning] = useState(false);
  const [problems, setProblems] = useState<Problem[]>([]);

  const buildReviewSet = (): Problem[] => {
    const lessons = queue.slice(0, 6);
    const out: Problem[] = [];
    for (const item of lessons) {
      const found = findLessonAny(item.lessonId);
      if (!found) continue;
      const n = lessons.length <= 3 ? 2 : 1;
      const ps = generateProblems(found.lesson, n);
      out.push(...ps);
    }
    return out;
  };

  const startReview = () => {
    const set = buildReviewSet();
    if (set.length === 0) return;
    setProblems(set);
    setRunning(true);
  };

  if (running) {
    return (
      <QuizRunner
        title="Smart Review"
        emoji="🔄"
        problems={problems}
        soundOn={soundOn}
        preschool={level === "preschool" || level === "grade1"}
        onExit={() => setRunning(false)}
        onFinish={({ correct, total }) => {
          // Record review as a light touch — don't create lesson results, just
          // go back to the review landing so the learner sees their updated queue.
          void correct;
          void total;
          setRunning(false);
        }}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6">
      <Button variant="ghost" size="sm" onClick={() => setView({ name: "home" })} className="mb-4 gap-1">
        <ArrowLeft className="h-4 w-4" /> Home
      </Button>

      <div className="rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-400 p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/25 text-4xl backdrop-blur">
            🔄
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Smart Review</h1>
            <p className="text-sm text-white/90">
              Practice the lessons that need a little extra love. Keeps your brain sharp!
            </p>
          </div>
        </div>
      </div>

      {queue.length === 0 ? (
        <Card className="mt-6 flex flex-col items-center gap-3 p-8 text-center">
          <Mascot size={64} className="animate-bob" />
          <p className="font-display text-lg font-bold">You're all caught up! 🎉</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Every lesson you've tried is mastered (90%+). Play new lessons or come back
            tomorrow for a daily challenge!
          </p>
          <Button onClick={() => setView({ name: "home" })} className="mt-2 gap-2">
            <PlayCircle className="h-4 w-4" /> Pick a new lesson
          </Button>
        </Card>
      ) : (
        <>
          <Card className="mt-6 flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <Mascot size={40} />
              <div>
                <p className="font-display font-bold">Ready to review {queue.length} lesson{queue.length > 1 ? "s" : ""}?</p>
                <p className="text-xs text-muted-foreground">
                  We'll mix questions from the lessons below.
                </p>
              </div>
            </div>
            <Button size="lg" onClick={startReview} className="gap-2">
              <RefreshCw className="h-5 w-5" /> Start review
            </Button>
          </Card>

          <div className="mt-5 space-y-2">
            {queue.map((item, i) => {
              const found = findLessonAny(item.lessonId);
              if (!found) return null;
              const domain = [...CURRICULUM, ...PRESCHOOL_CURRICULUM, ...GRADE1_CURRICULUM, ...GRADE2_CURRICULUM, ...GRADE4_CURRICULUM].find((d) => d.id === found.domain.id);
              return (
                <motion.div
                  key={item.lessonId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="flex items-center gap-3 p-3">
                    <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-xl", domain?.color)}>
                      {found.lesson.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display font-bold">{found.lesson.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{found.lesson.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.bestScore === 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                          <Lock className="h-3 w-3" /> Not finished
                        </span>
                      ) : (
                        <>
                          <span className="text-sm font-bold tabular-nums text-muted-foreground">{item.bestScore}%</span>
                          <div className="flex">
                            {[0, 1, 2].map((s) => (
                              <Star
                                key={s}
                                className={cn("h-4 w-4", s < item.stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
