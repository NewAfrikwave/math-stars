"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Lock } from "lucide-react";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { useGameStore, useOverallProgress } from "@/store/useGameStore";
import { cn } from "@/lib/utils";

export function AchievementsView() {
  const setView = useGameStore((s) => s.setView);
  const earned = useGameStore((s) => s.earnedAchievements);
  const totalStars = useGameStore((s) => s.totalStars);
  const overall = useOverallProgress();
  const earnedSet = new Set(earned);
  const earnedCount = ACHIEVEMENTS.filter((a) => earnedSet.has(a.id)).length;
  const pct = Math.round((earnedCount / ACHIEVEMENTS.length) * 100);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-28 pt-6">
      <Button variant="ghost" size="sm" onClick={() => setView({ name: "home" })} className="mb-4 gap-1">
        <ArrowLeft className="h-4 w-4" /> Home
      </Button>

      <div className="rounded-3xl bg-gradient-to-br from-amber-400 to-orange-400 p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-5xl">🏅</span>
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">My Badges</h1>
            <p className="text-sm text-white/90">
              You've earned {earnedCount} of {ACHIEVEMENTS.length} badges and {totalStars} ⭐ stars!
            </p>
          </div>
        </div>
        <div className="mt-3">
          <Progress value={pct} className="h-2 bg-white/30" />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map((a, i) => {
          const isEarned = earnedSet.has(a.id);
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card
                className={cn(
                  "flex h-full items-center gap-3 p-4 transition-all",
                  isEarned
                    ? "border-2 border-amber-300 bg-amber-50/50 dark:bg-amber-950/20"
                    : "opacity-70 grayscale"
                )}
              >
                <div
                  className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl",
                    isEarned ? "bg-amber-100 dark:bg-amber-900/50" : "bg-muted"
                  )}
                >
                  {isEarned ? a.emoji : <Lock className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="min-w-0">
                  <p className="font-display font-bold leading-tight">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="mt-6 p-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Keep learning!</span> You've completed{" "}
          {overall.completed} of {overall.total} lessons. Play more to unlock new badges. 🌟
        </p>
      </Card>
    </div>
  );
}
