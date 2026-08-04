"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Boxes,
  CheckCircle2,
  Lightbulb,
  PlayCircle,
  Printer,
  RotateCcw,
  Sparkles,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SpeakButton } from "@/components/game/SpeakButton";
import { ProblemVisualRenderer } from "@/components/visuals/ProblemVisualRenderer";
import type { Difficulty, TeachBlock } from "@/lib/types";
import { cn } from "@/lib/utils";
import { findLessonAny, useGameStore } from "@/store/useGameStore";
import { FloatingSparkles, MascotMotion, springy, staggerContainer, staggerItem } from "@/components/game/MotionKit";

export function LessonView({ lessonId }: { lessonId: string }) {
  const found = findLessonAny(lessonId);
  const setView = useGameStore((state) => state.setView);
  const progress = useGameStore((state) => state.progress);
  const level = useGameStore((state) => state.level);
  const siteSettings = useGameStore((state) => state.siteSettings);
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>();

  if (!found) {
    return (
      <div className="p-8 text-center">
        <p>Lesson not found.</p>
        <Button onClick={() => setView({ name: "home" })} className="mt-4">Back home</Button>
      </div>
    );
  }

  const { lesson, domain } = found;
  const lessonProgress = progress[lessonId];
  const status = lessonProgress?.status ?? "available";
  const stars = lessonProgress?.stars ?? 0;
  const bestScore = lessonProgress?.bestScore ?? 0;
  const fullLessonText = [
    lesson.title,
    lesson.subtitle,
    ...lesson.teach.flatMap((block) => [block.text, block.question, block.answer]).filter(Boolean),
  ].join(". ");

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[#fffdf8] pb-28 dark:bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView({ name: "domain", domainId: domain.id })} className="gap-1.5 rounded-full">
            <ArrowLeft className="h-4 w-4" /> {domain.title}
          </Button>
          {status === "completed" && (
            <div className="flex items-center gap-3 rounded-full border bg-white px-4 py-2 shadow-sm dark:bg-card">
              <div className="flex" aria-label={`${stars} out of 3 stars`}>
                {[0, 1, 2].map((star) => (
                  <Star key={star} className={cn("h-4 w-4", star < stars ? "fill-amber-400 text-amber-400" : "text-stone-300")} />
                ))}
              </div>
              <span className="text-xs font-bold text-muted-foreground">Best score {bestScore}%</span>
            </div>
          )}
        </div>

        <motion.section initial={{ opacity: 0, y: 18, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={springy} className="overflow-hidden rounded-[30px] border border-[#eadfce] bg-white shadow-[0_18px_55px_rgba(83,61,35,0.09)] dark:bg-card">
          <div className="relative overflow-hidden border-b border-[#eadfce] bg-[#f5f0e6] px-6 py-6 sm:px-8">
            <FloatingSparkles className="opacity-40" />
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <motion.div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-4xl shadow-sm" aria-hidden="true" animate={{ y: [0, -4, 0], rotate: [0, -3, 3, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}>
                  {lesson.emoji}
                </motion.div>
                <div>
                  <Badge className="mb-1.5 bg-[#dfead7] text-[#285f3b] hover:bg-[#dfead7]">{domain.title}</Badge>
                  <h1 className="font-display text-2xl font-bold text-[#285f3b] sm:text-4xl dark:text-emerald-300">{lesson.title}</h1>
                  <p className="mt-1 text-sm text-muted-foreground sm:text-base">{lesson.subtitle}</p>
                </div>
              </div>
              <SpeakButton
                text={fullLessonText}
                label="Read lesson aloud"
                size="lg"
                variant="solid"
                speed={level === "preschool" || level === "grade1" ? 0.82 : 0.92}
                className="justify-center bg-[#285f3b] hover:bg-[#1f4d30]"
              />
            </div>
          </div>

          <div className="lg:grid lg:grid-cols-[0.82fr_1.55fr]">
            <aside className="border-b border-[#eadfce] bg-[#fffaf2] p-6 dark:bg-muted/20 lg:border-b-0 lg:border-r lg:p-8">
              <div className="flex items-center gap-2 text-[#b35b3d]">
                <BookOpen className="h-5 w-5" />
                <p className="font-display text-lg font-bold">Today’s learning path</p>
              </div>
              <motion.ol className="mt-6 space-y-6" variants={staggerContainer} initial="hidden" animate="visible">
                {lesson.teach.map((block, index) => (
                  <motion.li key={index} variants={staggerItem} className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dfead7] font-display text-sm font-bold text-[#285f3b]">{index + 1}</span>
                    <div>
                      <p className="font-display font-bold text-[#285f3b] dark:text-emerald-300">{blockTitle(block)}</p>
                      <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{blockSummary(block)}</p>
                    </div>
                  </motion.li>
                ))}
              </motion.ol>

              <div className="mt-8 rounded-3xl border border-[#e7dbc9] bg-white p-4 dark:bg-card">
                <div className="flex items-center gap-3">
                  <MascotMotion mood="encourage"><div className="relative h-20 w-16 shrink-0 overflow-hidden">
                    <Image src="/pip-explorer.webp" alt="Pip the math guide" fill sizes="64px" className="object-contain object-top" />
                  </div></MascotMotion>
                  <div>
                    <p className="font-display font-bold text-[#285f3b] dark:text-emerald-300">Pip’s study tip</p>
                    <p className="mt-1 text-sm text-muted-foreground">Say each step out loud. Explaining math helps it stick.</p>
                  </div>
                </div>
                {siteSettings?.aiTutorEnabled !== false && (
                  <Button variant="outline" size="sm" onClick={() => setView({ name: "tutor", lessonId })} className="mt-3 w-full rounded-full border-[#285f3b]/30 text-[#285f3b]">
                    Ask Pip about this lesson
                  </Button>
                )}
              </div>
            </aside>

            <div className="space-y-4 p-5 sm:p-7 lg:p-9">
              {lesson.teach.map((block, index) => (
                <TeachBlockView key={index} block={block} index={index} />
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-[28px] border border-[#eadfce] bg-white p-5 shadow-lg dark:bg-card sm:p-6"
        >
          {level !== "preschool" && level !== "grade1" && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">Choose a mode</span>
              {([
                { value: undefined, label: "Normal" },
                { value: "easy" as const, label: "Easy" },
                { value: "challenge" as const, label: "Challenge" },
              ]).map((option) => (
                <button
                  key={option.label}
                  onClick={() => setDifficulty(option.value)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-xs font-bold transition-colors",
                    difficulty === option.value
                      ? "border-[#285f3b] bg-[#285f3b] text-white"
                      : "border-[#e5ddcf] bg-[#fffdf8] text-muted-foreground hover:border-[#285f3b]/40",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-xl font-bold text-[#285f3b] dark:text-emerald-300">
                {status === "completed" ? "Ready to grow your score?" : "Ready to solve it yourself?"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{lesson.practiceCount} questions with hints, visuals, and read-aloud support.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {lessonId === "mult-concept" && siteSettings?.manipulativesEnabled !== false && (
                <Button variant="outline" onClick={() => setView({ name: "manipulative", lessonId })} className="gap-2 rounded-full">
                  <Boxes className="h-4 w-4" /> Build it
                </Button>
              )}
              {siteSettings?.worksheetsEnabled !== false && (
                <Button variant="outline" onClick={() => setView({ name: "worksheet", lessonId })} className="gap-2 rounded-full">
                  <Printer className="h-4 w-4" /> Worksheet
                </Button>
              )}
              {status === "completed" && (
                <Button variant="outline" onClick={() => setView({ name: "domain", domainId: domain.id })} className="gap-2 rounded-full">
                  <RotateCcw className="h-4 w-4" /> Back
                </Button>
              )}
              <Button size="lg" onClick={() => setView({ name: "practice", lessonId, difficulty })} className="gap-2 rounded-full bg-[#285f3b] px-7 hover:bg-[#1f4d30]">
                <PlayCircle className="h-5 w-5" /> {status === "completed" ? "Practice again" : "Start practice"}
              </Button>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function TeachBlockView({ block, index }: { block: TeachBlock; index: number }) {
  const text = [block.text, block.question, block.answer].filter(Boolean).join(". ");
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springy, delay: index * 0.07 }}
      whileHover={{ y: -2 }}
      className={cn(
        "rounded-3xl border p-5 sm:p-6",
        block.kind === "tip" ? "border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20" : "border-[#e8dfd2] bg-[#fffdf8] dark:bg-background/30",
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {block.kind === "tip" ? <Lightbulb className="h-5 w-5 text-amber-500" /> : block.kind === "example" ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Sparkles className="h-5 w-5 text-[#b35b3d]" />}
          <h2 className="font-display text-lg font-bold">{blockTitle(block)}</h2>
        </div>
        {text && <SpeakButton text={text} label={`Read ${blockTitle(block).toLowerCase()}`} size="sm" />}
      </div>

      {block.text && <p className="text-[15px] leading-7 text-foreground/80">{block.text}</p>}
      {block.kind === "example" && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4 dark:border-emerald-900 dark:bg-card">
          <p className="font-display text-lg font-bold">{block.question}</p>
          <p className="mt-2 flex items-center gap-2 font-display text-lg font-bold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5" /> {block.answer}
          </p>
        </div>
      )}
      {block.visual && (
        <div className="mt-4 flex min-h-[180px] items-center justify-center rounded-2xl border border-[#e5ddcf] bg-white p-4 dark:bg-card">
          <ProblemVisualRenderer visual={block.visual} />
        </div>
      )}
    </motion.article>
  );
}

function blockTitle(block: TeachBlock) {
  if (block.kind === "example") return "See an example";
  if (block.kind === "tip") return "Remember this";
  if (block.kind === "visual") return "See the math";
  return "Learn the idea";
}

function blockSummary(block: TeachBlock) {
  return block.text || block.question || "Use the picture to make the math easier to understand.";
}
