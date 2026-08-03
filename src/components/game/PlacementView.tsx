"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Zap, CheckCircle2, Unlock, Trophy } from "lucide-react";
import type { Problem } from "@/lib/types";
import { CURRICULUM } from "@/lib/curriculum";
import { PRESCHOOL_CURRICULUM, findPsDomain } from "@/lib/preschool";
import { GRADE1_CURRICULUM, findG1Domain } from "@/lib/grade1";
import { GRADE2_CURRICULUM, findG2Domain } from "@/lib/grade2";
import { GRADE4_CURRICULUM, findG4Domain } from "@/lib/grade4";
import { generateProblems } from "@/lib/generators";
import { useGameStore, profileFetch } from "@/store/useGameStore";
import { QuizRunner } from "@/components/game/QuizRunner";
import { Confetti } from "@/components/game/Confetti";
import { Mascot } from "@/components/game/Mascot";
import { cn } from "@/lib/utils";

// A short placement quiz: 3 mixed questions from a domain. If the learner
// scores 2/3 or better, all lessons in that domain unlock so she can skip
// ahead instead of slogging through easy ones she already knows.
export function PlacementView({ domainId }: { domainId: string }) {
  const setView = useGameStore((s) => s.setView);
  const soundOn = useGameStore((s) => s.soundOn);
  const level = useGameStore((s) => s.level);

  const domain = CURRICULUM.find((d) => d.id === domainId) ?? findPsDomain(domainId) ?? findG1Domain(domainId) ?? findG2Domain(domainId) ?? findG4Domain(domainId);
  const isPs = !!findPsDomain(domainId);

  // Generate 3 questions, one from 3 different lessons in the domain.
  const [problems] = useState<Problem[]>(() => {
    if (!domain) return [];
    const lessons = [...domain.lessons].sort(() => Math.random() - 0.5).slice(0, 3);
    const out: Problem[] = [];
    for (const lesson of lessons) {
      out.push(generateProblems(lesson, 1)[0]);
    }
    return out;
  });

  const [running, setRunning] = useState(true);
  const [result, setResult] = useState<{ passed: boolean; score: number; correct: number; total: number; message: string } | null>(null);

  if (!domain) {
    return (
      <div className="p-8 text-center">
        <p>Topic not found.</p>
        <Button onClick={() => setView({ name: "home" })} className="mt-4">Home</Button>
      </div>
    );
  }

  if (running) {
    return (
      <QuizRunner
        title={`${domain.title} placement`}
        emoji="⚡"
        problems={problems}
        soundOn={soundOn}
        preschool={isPs || level === "preschool" || level === "grade1"}
        onExit={() => setView({ name: "domain", domainId })}
        onFinish={async ({ correct, total }) => {
          const score = Math.round((correct / total) * 100);
          // Submit to server
          try {
            const res = await profileFetch("/api/placement", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ domainId, correct, total }),
            });
            const d = await res.json();
            setResult({
              passed: d.passed ?? score >= 67,
              score,
              correct,
              total,
              message: d.message ?? "",
            });
          } catch {
            setResult({ passed: score >= 67, score, correct, total, message: "" });
          }
          setRunning(false);
        }}
      />
    );
  }

  // Result screen
  const r = result!;
  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-28 pt-10 text-center">
      <Confetti active={r.passed} />
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Mascot size={80} className="mx-auto animate-bob" />
        <h1 className="mt-2 font-display text-3xl font-bold">
          {r.passed ? "You placed out! 🎉" : "Good try! 💪"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {r.correct} of {r.total} correct · {r.score}%
        </p>
        <p className="mt-4 font-display text-lg font-semibold text-primary">{r.message}</p>
      </motion.div>

      {r.passed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Card className="flex items-center gap-3 border-2 border-emerald-300 bg-emerald-50 p-4 dark:bg-emerald-950/20">
            <Unlock className="h-8 w-8 shrink-0 text-emerald-500" />
            <p className="text-left text-sm">
              All lessons in <span className="font-bold">{domain.title}</span> are unlocked!
              Jump to any one you like.
            </p>
          </Card>
        </motion.div>
      )}

      <div className="mt-6 grid gap-3">
        <Button size="lg" onClick={() => setView({ name: "domain", domainId })} className="gap-2">
          <CheckCircle2 className="h-5 w-5" /> Back to {domain.title}
        </Button>
        <Button variant="ghost" onClick={() => setView({ name: "home" })}>Home</Button>
      </div>
    </div>
  );
}

// keep imports referenced
void Zap;
void Trophy;
void useMemo;
