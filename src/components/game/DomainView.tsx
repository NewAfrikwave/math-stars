"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  Star,
  PlayCircle,
  RotateCcw,
  Zap,
} from "lucide-react";
import { findDomain } from "@/lib/curriculum";
import { findPsDomain } from "@/lib/preschool";
import { findG1Domain } from "@/lib/grade1";
import { findG2Domain } from "@/lib/grade2";
import { findG4Domain } from "@/lib/grade4";
import { useGameStore } from "@/store/useGameStore";
import { Mascot } from "@/components/game/Mascot";
import { cn } from "@/lib/utils";
import { FloatingSparkles, MascotMotion, ProgressTrail, springy, staggerContainer, staggerItem } from "@/components/game/MotionKit";

export function DomainView({ domainId }: { domainId: string }) {
  const domain = findDomain(domainId) ?? findPsDomain(domainId) ?? findG1Domain(domainId) ?? findG2Domain(domainId) ?? findG4Domain(domainId);
  const setView = useGameStore((s) => s.setView);
  const progress = useGameStore((s) => s.progress);

  if (!domain) {
    return (
      <div className="p-8 text-center">
        <p>Topic not found.</p>
        <Button onClick={() => setView({ name: "home" })} className="mt-4">Back home</Button>
      </div>
    );
  }

  const lessonsDone = domain.lessons.filter(
    (l) => progress[l.id]?.status === "completed"
  ).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6">
      <Button variant="ghost" size="sm" onClick={() => setView({ name: "home" })} className="mb-4 gap-1">
        <ArrowLeft className="h-4 w-4" /> All topics
      </Button>

      {/* Domain header */}
      <motion.div initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={springy} className={cn("relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-lg", domain.color)}>
        <FloatingSparkles className="opacity-60" />
        <motion.div aria-hidden="true" className="absolute -right-6 -top-6 text-[100px] opacity-20" animate={{ y: [0, -8, 0], rotate: [-3, 4, -3] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>{domain.emoji}</motion.div>
        <div className="relative flex items-center gap-4">
          <motion.div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/25 text-4xl backdrop-blur" animate={{ y: [0, -4, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }} whileHover={{ scale: 1.08, rotate: 8 }}>
            {domain.emoji}
          </motion.div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{domain.title}</h1>
            <p className="text-sm text-white/90">{domain.description}</p>
            <p className="mt-1 text-xs font-semibold text-white/80">
              {lessonsDone} of {domain.lessons.length} lessons complete
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/25"><ProgressTrail value={domain.lessons.length ? lessonsDone / domain.lessons.length * 100 : 0} className="h-full rounded-full bg-white" /></div>
          </div>
          {lessonsDone < domain.lessons.length && (
            <button
              onClick={() => setView({ name: "placement", domainId: domain.id })}
              className="hidden items-center gap-1.5 rounded-full bg-white/25 px-4 py-2 text-sm font-bold backdrop-blur transition-transform hover:scale-105 sm:flex"
              title="Already know this? Take a short test to skip ahead"
            >
              <Zap className="h-4 w-4" /> Test out
            </button>
          )}
        </div>
      </motion.div>

      {/* Mobile test-out button */}
      {lessonsDone < domain.lessons.length && (
        <button
          onClick={() => setView({ name: "placement", domainId: domain.id })}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/10 sm:hidden"
        >
          <Zap className="h-4 w-4" /> Already know this? Test out (3 questions)
        </button>
      )}

      {/* Lesson path */}
      <div className="relative mt-6">
        {/* vertical connector line */}
        <div className="absolute left-[27px] top-2 bottom-2 w-1 rounded bg-border" />
        <motion.div className="space-y-3" variants={staggerContainer} initial="hidden" animate="visible">
          {domain.lessons.map((lesson) => {
            const p = progress[lesson.id];
            const status = p?.status ?? "locked";
            const stars = p?.stars ?? 0;
            return (
              <motion.div
                key={lesson.id}
                variants={staggerItem}
              >
                <motion.button
                  disabled={status === "locked"}
                  onClick={() => setView({ name: "lesson", lessonId: lesson.id })}
                  className={cn(
                    "group relative flex w-full items-center gap-4 rounded-2xl border-2 bg-card p-4 text-left transition-all",
                    status === "locked"
                      ? "cursor-not-allowed border-border opacity-60"
                      : "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  )}
                  whileHover={status === "locked" ? undefined : { x: 5, y: -2, scale: 1.01 }}
                  whileTap={status === "locked" ? undefined : { scale: 0.985 }}
                >
                  {/* status node */}
                  <div
                    className={cn(
                      "relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl shadow-sm ring-4 ring-background",
                      status === "completed"
                        ? "bg-emerald-400 text-white"
                        : status === "locked"
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary text-primary-foreground"
                    )}
                  >
                    {status === "completed" ? (
                      <CheckCircle2 className="h-7 w-7" />
                    ) : status === "locked" ? (
                      <Lock className="h-5 w-5" />
                    ) : (
                      <PlayCircle className="h-7 w-7" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{lesson.emoji}</span>
                      <h3 className="truncate font-display text-base font-bold sm:text-lg">
                        {lesson.title}
                      </h3>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{lesson.subtitle}</p>
                  </div>

                  {/* stars / action */}
                  <div className="flex shrink-0 items-center gap-1">
                    {status === "completed" ? (
                      <>
                        {[0, 1, 2].map((s) => (
                          <Star
                            key={s}
                            className={cn(
                              "h-5 w-5",
                              s < stars
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/40"
                            )}
                          />
                        ))}
                      </>
                    ) : status === "locked" ? (
                      <span className="text-xs font-medium text-muted-foreground">Locked</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        Start <PlayCircle className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                </motion.button>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Mascot tip */}
      <Card className="mt-6 flex items-center gap-3 p-4">
        <MascotMotion mood="encourage"><Mascot size={48} /></MascotMotion>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Pip says:</span> Finish a lesson to unlock the next one!
          You can replay any lesson to earn more stars. ⭐
        </p>
      </Card>
    </div>
  );
}
