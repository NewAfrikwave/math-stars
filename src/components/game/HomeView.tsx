"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Trophy,
  Flame,
  Sparkles,
  ChevronRight,
  Award,
  Bot,
  Lock,
  CheckCircle2,
  PlayCircle,
} from "lucide-react";
import { CURRICULUM } from "@/lib/curriculum";
import { PRESCHOOL_CURRICULUM } from "@/lib/preschool";
import { GRADE1_CURRICULUM } from "@/lib/grade1";
import { GRADE2_CURRICULUM } from "@/lib/grade2";
import { GRADE4_CURRICULUM } from "@/lib/grade4";
import { useGameStore, useOverallProgress } from "@/store/useGameStore";
import { Mascot } from "@/components/game/Mascot";
import { cn } from "@/lib/utils";

export function HomeView() {
  const setView = useGameStore((s) => s.setView);
  const level = useGameStore((s) => s.level);
  const siteSettings = useGameStore((s) => s.siteSettings);
  const studentName = useGameStore((s) => s.studentName);
  const totalStars = useGameStore((s) => s.totalStars);
  const streak = useGameStore((s) => s.streak);
  const earnedAchievements = useGameStore((s) => s.earnedAchievements);
  const progress = useGameStore((s) => s.progress);
  const overall = useOverallProgress();
  const dailyDoneDate = useGameStore((s) => s.dailyDoneDate);
  const dailyScore = useGameStore((s) => s.dailyScore);
  const today = new Date().toISOString().slice(0, 10);
  const dailyDone = dailyDoneDate === today;

  const curriculum =
    level === "preschool" ? PRESCHOOL_CURRICULUM :
    level === "grade1" ? GRADE1_CURRICULUM :
    level === "grade2" ? GRADE2_CURRICULUM :
    level === "grade4" ? GRADE4_CURRICULUM :
    CURRICULUM;

  // find the next lesson to play (first available or in-progress, not completed-first)
  const nextLesson = (() => {
    for (const domain of curriculum) {
      for (const lesson of domain.lessons) {
        const p = progress[lesson.id];
        if (p && p.status !== "completed" && p.status !== "locked") {
          return { lesson, domain };
        }
      }
    }
    return null;
  })();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-400 via-orange-400 to-amber-300 p-6 text-white shadow-lg sm:p-8"
      >
        <div className="absolute -right-8 -top-8 text-[120px] opacity-20">✨</div>
        <div className="absolute -bottom-10 right-24 text-[90px] opacity-20">🌟</div>
        <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Mascot size={72} className="animate-bob drop-shadow" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-white/90">
                Welcome back,
              </p>
              <h1 className="font-display text-3xl font-bold sm:text-4xl">{studentName}! 🎉</h1>
              <p className="mt-1 max-w-md text-sm text-white/90">
                {level === "preschool"
                  ? "Let's play and learn math! Count, find shapes, and have fun."
                  : level === "grade1"
                  ? "Let's grow your math brain! Add, subtract, and explore."
                  : level === "grade2"
                  ? "Ready for bigger numbers? Let's keep learning!"
                  : level === "grade4"
                  ? "Let's tackle advanced math — multiplication, fractions, decimals!"
                  : "Let's power up your 3rd grade math brain. Pick a topic or jump back in where you left off."}
              </p>
            </div>
          </div>
          {nextLesson && (
            <Button
              size="lg"
              onClick={() => setView({ name: "lesson", lessonId: nextLesson.lesson.id })}
              className="gap-2 bg-white text-rose-600 shadow-md hover:bg-white/90"
            >
              <PlayCircle className="h-5 w-5" />
              Continue: {nextLesson.lesson.title}
            </Button>
          )}
        </div>
      </motion.section>

      {/* Stat row */}
      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Star className="h-5 w-5 text-amber-500" />} label="Stars" value={totalStars} tint="amber" />
        <StatCard icon={<Flame className="h-5 w-5 text-orange-500" />} label="Day streak" value={streak} tint="orange" />
        <StatCard icon={<Trophy className="h-5 w-5 text-rose-500" />} label="Badges" value={earnedAchievements.length} tint="rose" />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          label="Lessons done"
          value={`${overall.completed}/${overall.total}`}
          tint="emerald"
        />
      </section>

      {/* Overall progress */}
      <section className="mt-5">
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">School year progress</h2>
            <span className="text-sm font-semibold text-muted-foreground">{overall.percent}%</span>
          </div>
          <Progress value={overall.percent} className="h-3" />
        </Card>
      </section>

      {/* Quick actions */}
      <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {siteSettings?.dailyChallengeEnabled !== false && (
          <QuickAction emoji="⚡" tint="fuchsia" title="Daily Challenge" desc={dailyDone ? `Done today: ${dailyScore}%` : "5 mixed questions — keep your streak!"} onClick={() => setView({ name: "daily" })} />
        )}
        <QuickAction emoji="🔄" tint="emerald" title="Smart Review" desc="Practice the lessons that need love." onClick={() => setView({ name: "review" })} />
        {siteSettings?.aiTutorEnabled !== false && (
          <QuickAction emoji="🦊" tint="violet" title="Ask Pip the Tutor" desc="Stuck? Chat with your AI math buddy." onClick={() => setView({ name: "tutor" })} />
        )}
        {siteSettings?.worksheetsEnabled !== false && (
          <QuickAction emoji="🖨️" tint="sky" title="Printable Worksheets" desc="Take math offline with an answer key." onClick={() => setView({ name: "worksheet" })} />
        )}
        {level !== "preschool" && siteSettings?.manipulativesEnabled !== false && (
          <QuickAction emoji="🧮" tint="amber" title="Build the Groups" desc="Drag counters to see multiplication." onClick={() => setView({ name: "manipulative", lessonId: "mult-concept" })} />
        )}
        <QuickAction emoji="🏅" tint="amber" title="My Badges" desc={`${earnedAchievements.length} earned — tap to see them!`} onClick={() => setView({ name: "achievements" })} />
      </section>

      {/* Donate banner */}
      <section className="mt-3">
        <button
          onClick={() => setView({ name: "donations" })}
          className="group flex w-full items-center gap-3 rounded-2xl border-2 border-rose-200 bg-rose-50/60 px-4 py-3 text-left transition-colors hover:bg-rose-50 dark:border-rose-900 dark:bg-rose-950/20"
        >
          <span className="text-2xl">💛</span>
          <div className="flex-1">
            <p className="font-display text-sm font-bold text-rose-700 dark:text-rose-300">Keep Math Stars free</p>
            <p className="text-xs text-muted-foreground">Donate via Cash App or Zelle — every bit helps!</p>
          </div>
          <ChevronRight className="h-5 w-5 text-rose-400 transition-transform group-hover:translate-x-1" />
        </button>
      </section>

      {/* Parent link */}
      <section className="mt-3">
        <button
          onClick={() => setView({ name: "parent" })}
          className="group flex w-full items-center justify-between rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-2.5 text-left transition-colors hover:bg-muted"
        >
          <span className="text-xs text-muted-foreground">
            🔒 <span className="font-semibold">For Grown-ups</span> — track progress & see where to help
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </button>
      </section>

      {/* Topic map */}
      <section className="mt-7">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-bold">Choose your math adventure</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {curriculum.map((domain, i) => {
            const lessonsDone = domain.lessons.filter(
              (l) => progress[l.id]?.status === "completed"
            ).length;
            const domainStars = domain.lessons.reduce(
              (sum, l) => sum + (progress[l.id]?.stars ?? 0),
              0
            );
            const pct = Math.round((lessonsDone / domain.lessons.length) * 100);
            return (
              <motion.button
                key={domain.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setView({ name: "domain", domainId: domain.id })}
                className="group relative overflow-hidden rounded-3xl border-2 border-border bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", domain.color)} />
                <div className="flex items-start justify-between">
                  <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl shadow-sm", domain.color)}>
                    {domain.emoji}
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    {domainStars}
                  </div>
                </div>
                <h3 className="mt-3 font-display text-lg font-bold leading-tight">{domain.title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{domain.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Progress value={pct} className="h-2 flex-1" />
                  <span className="text-xs font-semibold text-muted-foreground">
                    {lessonsDone}/{domain.lessons.length}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {domain.lessons.slice(0, 4).map((l) => {
                    const p = progress[l.id];
                    return (
                      <span
                        key={l.id}
                        title={l.title}
                        className={cn(
                          "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs",
                          p?.status === "completed"
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : p?.status === "available" || p?.status === "in-progress"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        {p?.status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : p?.status === "locked" ? (
                          <Lock className="h-3 w-3" />
                        ) : (
                          l.emoji
                        )}
                      </span>
                    );
                  })}
                  {domain.lessons.length > 4 && (
                    <span className="inline-flex h-7 items-center px-1.5 text-xs font-semibold text-muted-foreground">
                      +{domain.lessons.length - 4}
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tint: "amber" | "orange" | "rose" | "emerald";
}) {
  const tints: Record<string, string> = {
    amber: "bg-amber-50 dark:bg-amber-950/30",
    orange: "bg-orange-50 dark:bg-orange-950/30",
    rose: "bg-rose-50 dark:bg-rose-950/30",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30",
  };
  return (
    <Card className={cn("flex items-center gap-3 p-3", tints[tint])}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 dark:bg-white/10">
        {icon}
      </div>
      <div>
        <p className="font-display text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}

function QuickAction({
  emoji,
  tint,
  title,
  desc,
  onClick,
}: {
  emoji: string;
  tint: "amber" | "violet" | "emerald" | "sky" | "fuchsia";
  title: string;
  desc: string;
  onClick: () => void;
}) {
  const tints: Record<string, string> = {
    amber: "bg-amber-100 dark:bg-amber-950/40 hover:border-amber-300",
    violet: "bg-violet-100 dark:bg-violet-950/40 hover:border-violet-300",
    emerald: "bg-emerald-100 dark:bg-emerald-950/40 hover:border-emerald-300",
    sky: "bg-sky-100 dark:bg-sky-950/40 hover:border-sky-300",
    fuchsia: "bg-fuchsia-100 dark:bg-fuchsia-950/40 hover:border-fuchsia-300",
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border-2 border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-2xl", tints[tint])}>
        {emoji}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display font-bold">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{desc}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
    </button>
  );
}
