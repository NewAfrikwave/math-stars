"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Star,
  Home,
  PlayCircle,
  ChevronRight,
  Sparkles,
  Award,
  Gift,
} from "lucide-react";
import { findLesson, CURRICULUM, ALL_LESSONS } from "@/lib/curriculum";
import { findPsLesson, PRESCHOOL_LESSON_IDS } from "@/lib/preschool";
import { GRADE1_LESSON_IDS, findG1Lesson } from "@/lib/grade1";
import { GRADE2_LESSON_IDS, findG2Lesson } from "@/lib/grade2";
import { GRADE4_LESSON_IDS, findG4Lesson } from "@/lib/grade4";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { useGameStore } from "@/store/useGameStore";
import { Confetti } from "@/components/game/Confetti";
import { StickerBurst } from "@/components/game/StickerBurst";
import { Mascot } from "@/components/game/Mascot";
import { cn } from "@/lib/utils";
import { AnimatedNumber, FloatingSparkles, MascotMotion, springy } from "@/components/game/MotionKit";

export function ResultsView({
  lessonId,
  score,
  stars,
  correct,
  total,
}: {
  lessonId: string;
  score: number;
  stars: number;
  correct: number;
  total: number;
}) {
  const found = findLesson(lessonId) ?? findPsLesson(lessonId) ?? findG1Lesson(lessonId) ?? findG2Lesson(lessonId) ?? findG4Lesson(lessonId);
  const setView = useGameStore((s) => s.setView);
  const lastEarned = useGameStore((s) => s.lastEarnedAchievements);
  const reward = useGameStore((s) => s.reward);
  const [showConfetti, setShowConfetti] = useState(score >= 70);

  useEffect(() => {
    if (!showConfetti) return;
    const t = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(t);
  }, [showConfetti]);

  // find the next lesson in the same level's order
  const orderedIds =
    lessonId.startsWith("ps-") ? PRESCHOOL_LESSON_IDS :
    lessonId.startsWith("g1-") ? GRADE1_LESSON_IDS :
    lessonId.startsWith("g2-") ? GRADE2_LESSON_IDS :
    lessonId.startsWith("g4-") ? GRADE4_LESSON_IDS :
    ALL_LESSONS.map((fl) => fl.lessonId);
  const curIdx = orderedIds.indexOf(lessonId);
  const nextId = curIdx >= 0 && curIdx < orderedIds.length - 1 ? orderedIds[curIdx + 1] : null;
  const nextLesson = nextId ? (findLesson(nextId) ?? findPsLesson(nextId) ?? findG1Lesson(nextId) ?? findG2Lesson(nextId) ?? findG4Lesson(nextId)) : null;
  const nextDomain = nextLesson?.domain ?? found?.domain;

  const earnedDetails = lastEarned
    .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
    .filter(Boolean);

  if (!found) {
    return (
      <div className="p-8 text-center">
        <Button onClick={() => setView({ name: "home" })}>Back home</Button>
      </div>
    );
  }

  const message =
    score >= 90
      ? "Outstanding! You're a math superstar! 🌟"
      : score >= 70
        ? "Great job! You're getting it! 🎉"
        : score >= 50
          ? "Good effort! A little more practice and you'll nail it. 💪"
          : "Keep going! Every try makes your brain stronger. 🌱";

  return (
    <div className="relative mx-auto w-full max-w-2xl overflow-hidden px-4 pb-28 pt-6">
      <Confetti active={showConfetti} />
      <StickerBurst active={showConfetti} />
      <FloatingSparkles tone="rainbow" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <MascotMotion mood={score >= 70 ? "celebrate" : "encourage"}><Mascot size={80} className="mx-auto" /></MascotMotion>
        <h1 className="mt-2 font-display text-3xl font-bold">{score >= 70 ? "Lesson Complete!" : "Practice Saved!"}</h1>
        <p className="mt-1 text-muted-foreground">{found.lesson.title}</p>
      </motion.div>

      {/* Score card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springy, delay: 0.15 }}
      >
        <Card className="mt-5 p-6 text-center">
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((s) => (
              <motion.div
                key={s}
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3 + s * 0.18, type: "spring", stiffness: 200 }}
              >
                <Star
                  className={cn(
                    "h-14 w-14 drop-shadow",
                    s < stars
                      ? "fill-amber-400 text-amber-400"
                      : "fill-muted text-muted-foreground/40"
                  )}
                />
              </motion.div>
            ))}
          </div>
          <p className="mt-4 font-display text-5xl font-bold tabular-nums"><AnimatedNumber value={score} suffix="%" /></p>
          <p className="mt-1 text-sm text-muted-foreground">
            You got <span className="font-bold text-foreground">{correct}</span> out of{" "}
            <span className="font-bold text-foreground">{total}</span> correct
          </p>
          <p className="mt-3 font-display text-lg font-semibold text-primary">{message}</p>
        </Card>
      </motion.div>

      {/* Newly earned achievements */}
      {earnedDetails.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-5"
        >
          <Card className="border-2 border-amber-300 bg-amber-50 p-5 dark:bg-amber-950/20">
            <div className="mb-2 flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <h2 className="font-display text-lg font-bold">New badges!</h2>
            </div>
            <div className="space-y-2">
              {earnedDetails.map((a) => (
                <motion.div
                  key={a!.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm dark:bg-card"
                >
                  <span className="text-3xl">{a!.emoji}</span>
                  <div>
                    <p className="font-display font-bold">{a!.title}</p>
                    <p className="text-xs text-muted-foreground">{a!.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {reward?.status === "earned" && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...springy, delay: 0.5 }} className="mt-5">
          <Card className="border-2 border-fuchsia-300 bg-gradient-to-br from-fuchsia-50 to-amber-50 p-5 dark:from-fuchsia-950/30 dark:to-amber-950/20">
            <div className="flex items-center gap-4">
              <span className="text-5xl" aria-hidden="true">{reward.emoji}</span>
              <div>
                <p className="flex items-center gap-2 font-display text-lg font-bold text-fuchsia-800 dark:text-fuchsia-200"><Gift className="h-5 w-5" /> Reward unlocked!</p>
                <p className="font-display text-2xl font-bold">{reward.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">You reached your goal. Show your grown-up so you can celebrate together!</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Actions */}
      <div className="mt-6 grid gap-3">
        {score >= 70 && nextLesson && nextDomain && (
          <Button
            size="lg"
            onClick={() => setView({ name: "lesson", lessonId: nextLesson.lesson.id })}
            className="gap-2"
          >
            <PlayCircle className="h-5 w-5" />
            Next lesson: {nextLesson.lesson.title}
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => setView({ name: "practice", lessonId })} className="gap-2">
            <Sparkles className="h-4 w-4" /> Try again
          </Button>
          <Button variant="outline" onClick={() => setView({ name: "domain", domainId: found.domain.id })} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Topic map
          </Button>
        </div>
        <Button variant="ghost" onClick={() => setView({ name: "home" })} className="gap-2">
          <Home className="h-4 w-4" /> Back to home
        </Button>
      </div>
    </div>
  );
}
