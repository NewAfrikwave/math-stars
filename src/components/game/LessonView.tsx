"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  PlayCircle,
  Lightbulb,
  BookOpen,
  CheckCircle2,
  Star,
  RotateCcw,
  Printer,
} from "lucide-react";
import type { TeachBlock, Difficulty } from "@/lib/types";
import { findLessonAny } from "@/store/useGameStore";
import { useGameStore } from "@/store/useGameStore";
import { ProblemVisualRenderer } from "@/components/visuals/ProblemVisualRenderer";
import { Mascot } from "@/components/game/Mascot";
import { cn } from "@/lib/utils";

export function LessonView({ lessonId }: { lessonId: string }) {
  const found = findLessonAny(lessonId);
  const setView = useGameStore((s) => s.setView);
  const progress = useGameStore((s) => s.progress);
  const level = useGameStore((s) => s.level);
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>(undefined);

  if (!found) {
    return (
      <div className="p-8 text-center">
        <p>Lesson not found.</p>
        <Button onClick={() => setView({ name: "home" })} className="mt-4">Back home</Button>
      </div>
    );
  }

  const { lesson, domain } = found;
  const p = progress[lessonId];
  const status = p?.status ?? "available";
  const stars = p?.stars ?? 0;
  const bestScore = p?.bestScore ?? 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6">
      <Button variant="ghost" size="sm" onClick={() => setView({ name: "domain", domainId: domain.id })} className="mb-4 gap-1">
        <ArrowLeft className="h-4 w-4" /> {domain.title}
      </Button>

      {/* Lesson header */}
      <div className={cn("relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-lg", domain.color)}>
        <div className="absolute -right-4 -top-4 text-[90px] opacity-20">{lesson.emoji}</div>
        <div className="relative flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/25 text-4xl backdrop-blur">
            {lesson.emoji}
          </div>
          <div className="flex-1">
            <Badge className="mb-1 bg-white/25 text-white hover:bg-white/25">{domain.emoji} {domain.title}</Badge>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{lesson.title}</h1>
            <p className="text-sm text-white/90">{lesson.subtitle}</p>
          </div>
        </div>
        {status === "completed" && (
          <div className="relative mt-3 flex items-center gap-3">
            <div className="flex">
              {[0, 1, 2].map((s) => (
                <Star key={s} className={cn("h-5 w-5", s < stars ? "fill-amber-300 text-amber-300" : "text-white/40")} />
              ))}
            </div>
            <span className="text-xs font-semibold text-white/90">Best score: {bestScore}%</span>
          </div>
        )}
      </div>

      {/* Teaching content */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold">Let's learn!</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView({ name: "tutor", lessonId })}
            className="gap-1.5"
          >
            <Mascot size={20} /> Ask Pip about this
          </Button>
        </div>
        <div className="space-y-3">
          {lesson.teach.map((block, i) => (
            <TeachBlockView key={i} block={block} index={i} />
          ))}
        </div>
      </section>

      {/* Start practice */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky bottom-20 z-20 mt-7"
      >
        <Card className="border-2 border-primary/30 bg-card p-4 shadow-lg">
          {/* Difficulty selector — grade-3 only (preschool stays simple) */}
          {level !== "preschool" && level !== "grade1" && (
            <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Mode:</span>
              {([
                { v: undefined, label: "Normal", emoji: "🎯" },
                { v: "easy" as const, label: "Easy", emoji: "🌱" },
                { v: "challenge" as const, label: "Challenge", emoji: "🔥" },
              ]).map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setDifficulty(opt.v)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-bold transition-all",
                    difficulty === opt.v
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  )}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <Mascot size={44} />
              <div>
                <p className="font-display font-bold">
                  {status === "completed" ? "Play again for more stars!" : "Ready to try it?"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lesson.practiceCount} questions • earn up to 3 ⭐
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {lessonId === "mult-concept" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setView({ name: "manipulative", lessonId })}
                  className="gap-1"
                >
                  🧮 Build it
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView({ name: "worksheet", lessonId })}
                className="gap-1"
              >
                <Printer className="h-4 w-4" /> Worksheet
              </Button>
              {status === "completed" && (
                <Button variant="outline" size="sm" onClick={() => setView({ name: "domain", domainId: domain.id })} className="gap-1">
                  <RotateCcw className="h-4 w-4" /> Back
                </Button>
              )}
              <Button
                size="lg"
                onClick={() => setView({ name: "practice", lessonId, difficulty })}
                className="gap-2 px-7"
              >
                <PlayCircle className="h-5 w-5" />
                {status === "completed" ? "Practice again" : "Start practice"}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

function TeachBlockView({ block, index }: { block: TeachBlock; index: number }) {
  const motionProps = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: index * 0.06 },
  };

  if (block.kind === "text") {
    return (
      <motion.div {...motionProps}>
        <Card className="p-4">
          <p className="text-[15px] leading-relaxed">{block.text}</p>
        </Card>
      </motion.div>
    );
  }
  if (block.kind === "tip") {
    return (
      <motion.div {...motionProps}>
        <div className="flex items-start gap-3 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-100">{block.text}</p>
        </div>
      </motion.div>
    );
  }
  if (block.kind === "example") {
    return (
      <motion.div {...motionProps}>
        <Card className="overflow-hidden border-2 border-emerald-200 dark:border-emerald-900">
          <div className="bg-emerald-50 px-4 py-2 dark:bg-emerald-950/30">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Example</p>
          </div>
          <div className="p-4">
            <p className="font-display text-lg font-semibold">{block.question}</p>
            <div className="mt-2 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <p className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400">{block.answer}</p>
            </div>
            {block.text && <p className="mt-2 text-sm text-muted-foreground">{block.text}</p>}
          </div>
        </Card>
      </motion.div>
    );
  }
  // visual
  if (block.visual) {
    return (
      <motion.div {...motionProps}>
        <Card className="flex flex-col items-center gap-3 p-4">
          {block.text && <p className="text-sm font-medium text-muted-foreground">{block.text}</p>}
          <ProblemVisualRenderer visual={block.visual} />
        </Card>
      </motion.div>
    );
  }
  return null;
}
