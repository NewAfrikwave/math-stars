"use client";

import { useState } from "react";
import type { Problem, Difficulty } from "@/lib/types";
import { findLessonAny } from "@/store/useGameStore";
import { generateProblems } from "@/lib/generators";
import { useGameStore, profileFetch } from "@/store/useGameStore";
import { QuizRunner } from "@/components/game/QuizRunner";
import { Mascot } from "@/components/game/Mascot";
import { cn } from "@/lib/utils";
import type { RewardMission } from "@/lib/rewards";

export function PracticeSession({
  lessonId,
  difficulty,
}: {
  lessonId: string;
  difficulty?: Difficulty;
}) {
  const found = findLessonAny(lessonId);
  const setView = useGameStore((s) => s.setView);
  const recordResult = useGameStore((s) => s.recordResult);
  const soundOn = useGameStore((s) => s.soundOn);

  const [problems] = useState<Problem[]>(() =>
    found
      ? generateProblems(found.lesson, found.lesson.practiceCount, { difficulty })
      : []
  );

  if (!found || problems.length === 0) {
    return (
      <div className="p-8 text-center">
        <p>Could not load practice.</p>
        <button
          onClick={() => setView({ name: "home" })}
          className="mt-4 rounded-xl bg-primary px-5 py-2 font-semibold text-primary-foreground"
        >
          Back home
        </button>
      </div>
    );
  }

  const difficultyLabel = difficulty === "easy" ? " · Easy" : difficulty === "challenge" ? " · Challenge" : "";

  return (
    <div className="relative">
      {/* Floating Ask Pip + difficulty badge */}
      <div className="pointer-events-none fixed right-4 top-20 z-30 flex flex-col items-end gap-2">
        <button
          onClick={() => setView({ name: "tutor", lessonId })}
          title="Ask Pip for help"
          className={cn(
            "pointer-events-auto flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-700 shadow-md transition-transform hover:scale-105 dark:bg-violet-950/40 dark:text-violet-300"
          )}
        >
          <Mascot size={18} /> Ask Pip
        </button>
        {difficulty && (
          <span
            className={cn(
              "pointer-events-auto rounded-full px-3 py-1 text-xs font-bold shadow-sm",
              difficulty === "easy"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
            )}
          >
            {difficulty === "easy" ? "🌱 Easy mode" : "🔥 Challenge"}
          </span>
        )}
      </div>

      <QuizRunner
        title={`${found.lesson.title}${difficultyLabel}`}
        emoji={found.lesson.emoji}
        problems={problems}
        soundOn={soundOn}
        preschool={lessonId.startsWith("ps-") || lessonId.startsWith("g1-")}
        onExit={() => setView({ name: "lesson", lessonId })}
        onFinish={async ({ correct, total }) => {
          const response = await profileFetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lessonId, correct, total, difficulty }),
          });
          const saved = await response.json().catch(() => null) as {
            error?: string;
            sessionStars?: number;
            score?: number;
            totalStars?: number;
            streak?: number;
            newlyEarned?: string[];
            reward?: RewardMission | null;
          } | null;
          if (!response.ok || !saved || typeof saved.totalStars !== "number") {
            throw new Error(saved?.error ?? "Your progress could not be saved. Check your connection and try again.");
          }
          const { stars, score } = recordResult(lessonId, correct, total, {
            totalStars: saved.totalStars,
            streak: saved.streak ?? 0,
            newlyEarned: saved.newlyEarned ?? [],
            reward: saved.reward ?? null,
          });
          setView({
            name: "results",
            lessonId,
            score: saved.score ?? score,
            stars: saved.sessionStars ?? stars,
            correct,
            total,
          });
        }}
      />
    </div>
  );
}
