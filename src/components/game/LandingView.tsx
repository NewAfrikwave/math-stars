"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mascot } from "@/components/game/Mascot";
import { FloatingShapes } from "@/components/game/FloatingShapes";
import { Sparkles, Plus, ArrowRight, Trash2, UserPlus } from "lucide-react";
import type { Level } from "@/lib/types";
import { useGameStore } from "@/store/useGameStore";
import { cn } from "@/lib/utils";

// The landing page is now a profile picker: shows existing learners and lets
// a grown-up add a new one. Each profile has its own level, stars, and progress.
export function LandingView() {
  const profiles = useGameStore((s) => s.profiles);
  const setCurrentProfile = useGameStore((s) => s.setCurrentProfile);
  const createProfile = useGameStore((s) => s.createProfile);
  const deleteProfile = useGameStore((s) => s.deleteProfile);

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [level, setLevel] = useState<Level>("preschool");
  const [creating, setCreating] = useState(false);

  const pick = (id: string) => setCurrentProfile(id);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    const p = await createProfile(name.trim(), level);
    setCreating(false);
    if (p) {
      setName("");
      setAdding(false);
      setCurrentProfile(p.id);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-rose-100 via-amber-50 to-sky-100 dark:from-rose-950/40 dark:via-amber-950/30 dark:to-sky-950/40">
      <FloatingShapes count={18} />

      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        className="absolute inset-x-0 top-0 h-1.5 origin-left bg-gradient-to-r from-rose-400 via-amber-400 to-sky-400"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 py-12">
        {/* Mascot + title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col items-center text-center"
        >
          <motion.div
            animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="mb-3"
          >
            <Mascot size={88} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 150 }}
            className="font-display text-5xl font-bold tracking-tight text-rose-600 sm:text-6xl"
          >
            Math Stars
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-2 max-w-md text-base text-muted-foreground sm:text-lg"
          >
            Who's learning today? Pick your name to start! ✨
          </motion.p>
        </motion.div>

        {/* Profile cards */}
        <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
          <AnimatePresence>
            {profiles.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => pick(p.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") pick(p.id); }}
                className={cn(
                  "group relative overflow-hidden rounded-3xl p-6 text-left text-white shadow-xl",
                  p.level === "preschool" ? "bg-gradient-to-br from-rose-400 via-pink-400 to-fuchsia-400"
                  : p.level === "grade1" ? "bg-gradient-to-br from-amber-400 to-orange-400"
                  : p.level === "grade2" ? "bg-gradient-to-br from-teal-400 to-emerald-400"
                  : p.level === "grade4" ? "bg-gradient-to-br from-sky-400 to-cyan-400"
                  : "bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/25 text-4xl backdrop-blur">
                    {p.level === "preschool" ? "🧸" : p.level === "grade1" ? "1️⃣" : p.level === "grade2" ? "2️⃣" : p.level === "grade4" ? "4️⃣" : "🎓"}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display text-2xl font-bold">{p.name}</h2>
                    <p className="text-sm font-medium text-white/90">
                      {p.level === "preschool" ? "Preschool · Ages 3–5"
                      : p.level === "grade1" ? "1st Grade · Ages 6–7"
                      : p.level === "grade2" ? "2nd Grade · Ages 7–8"
                      : p.level === "grade4" ? "4th Grade · Ages 9–10"
                      : "3rd Grade · Ages 8–9"}
                    </p>
                    <p className="mt-1 text-xs text-white/80">
                      ⭐ {p.totalStars} stars · 🔥 {p.streak} day streak
                    </p>
                  </div>
                  <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete ${p.name}'s profile and all progress? This cannot be undone.`)) {
                      deleteProfile(p.id);
                    }
                  }}
                  className="absolute right-2 top-2 rounded-full bg-white/20 p-1.5 text-white opacity-0 transition-opacity hover:bg-white/40 group-hover:opacity-100"
                  title="Delete profile"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add new learner card */}
          {!adding ? (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setAdding(true)}
              className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-3xl border-4 border-dashed border-rose-300 bg-white/50 p-6 text-rose-500 backdrop-blur transition-colors hover:bg-white/70"
            >
              <UserPlus className="h-10 w-10" />
              <span className="font-display text-lg font-bold">Add a learner</span>
              <span className="text-xs text-muted-foreground">New profile</span>
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl border-2 border-rose-200 bg-white p-5 shadow-xl"
            >
              <h3 className="mb-3 font-display text-lg font-bold">New learner</h3>
              <Input
                autoFocus
                placeholder="What's their name?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
                className="mb-3 h-12"
              />
              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {([
                  { v: "preschool", emoji: "🧸", label: "Preschool", ages: "Ages 3–5" },
                  { v: "grade1", emoji: "1️⃣", label: "1st Grade", ages: "Ages 6–7" },
                  { v: "grade2", emoji: "2️⃣", label: "2nd Grade", ages: "Ages 7–8" },
                  { v: "grade3", emoji: "🎓", label: "3rd Grade", ages: "Ages 8–9" },
                  { v: "grade4", emoji: "4️⃣", label: "4th Grade", ages: "Ages 9–10" },
                ] as Array<{ v: Level; emoji: string; label: string; ages: string }>).map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => setLevel(opt.v)}
                    className={cn(
                      "rounded-xl border-2 p-3 text-left transition-all",
                      level === opt.v
                        ? "border-primary bg-primary/5"
                        : "border-border hover:opacity-80"
                    )}
                  >
                    <div className="text-2xl">{opt.emoji}</div>
                    <div className="font-display text-sm font-bold">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.ages}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setAdding(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!name.trim() || creating} className="flex-1 gap-1">
                  <Plus className="h-4 w-4" /> {creating ? "Creating…" : "Create"}
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {profiles.length === 0 && !adding && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center text-sm text-muted-foreground"
          >
            Tap "Add a learner" to create the first profile!
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-muted-foreground"
        >
          <Badge icon="🔊" label="Read-aloud" />
          <Badge icon="🦊" label="AI Tutor" />
          <Badge icon="🏆" label="Badges" />
          <Badge icon="📊" label="Parent dashboard" />
        </motion.div>

        {/* Parent actions: install + donate */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-3"
        >
          <LandingAction
            onClick={() => window.open("https://cash.app/$mathstars", "_blank")}
            emoji="💛"
            label="Donate"
            sub="Keep it free"
            tint="rose"
          />
          <span className="text-xs text-muted-foreground">
            Free forever for families • Made with 💛
          </span>
        </motion.div>
      </div>
    </div>
  );
}

function LandingAction({
  onClick,
  emoji,
  label,
  sub,
  tint,
}: {
  onClick: () => void;
  emoji: string;
  label: string;
  sub: string;
  tint: "rose" | "violet";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow-sm transition-transform hover:scale-105",
        tint === "rose"
          ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
          : "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
      )}
    >
      <span className="text-base">{emoji}</span>
      {label}
      <span className="text-xs font-normal opacity-70">· {sub}</span>
    </button>
  );
}

function Badge({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 shadow-sm backdrop-blur dark:bg-white/10">
      <span>{icon}</span>
      {label}
    </span>
  );
}

// keep import used
void Sparkles;
