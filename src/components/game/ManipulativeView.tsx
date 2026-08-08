"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Check, RotateCcw, PartyPopper } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { Mascot } from "@/components/game/Mascot";
import { Confetti } from "@/components/game/Confetti";
import { cn } from "@/lib/utils";

// A tactile drag-and-drop manipulative for the "equal groups" concept.
// The learner drags emoji counters into the correct number of baskets so
// that each basket holds the target count. Reinforces 3 × 4 = 12 visually.

interface Puzzle {
  groups: number;
  perGroup: number;
  emoji: string;
}

const EMOJIS = ["🍎", "🍪", "⭐", "🎈", "🌸", "🐠", "🐝", "🍇", "🍓", "🦋"];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makePuzzle(): Puzzle {
  return {
    groups: randInt(2, 5),
    perGroup: randInt(2, 5),
    emoji: pick(EMOJIS),
  };
}

function PoolCounter({ remaining, emoji }: { remaining: number; emoji: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: "pool" });
  if (remaining <= 0) return null;
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex h-16 w-16 select-none items-center justify-center rounded-2xl bg-amber-100 text-4xl shadow-sm transition-transform hover:scale-105 active:scale-95 dark:bg-amber-950/40",
        isDragging && "opacity-50"
      )}
      title="Drag me into a basket"
    >
      {emoji}
    </button>
  );
}

export function ManipulativeView({ lessonId }: { lessonId?: string }) {
  const setView = useGameStore((s) => s.setView);
  const target = lessonId ?? "mult-concept";

  const [puzzle, setPuzzle] = useState<Puzzle>(makePuzzle);
  const [baskets, setBaskets] = useState<number[]>(() => Array(puzzle.groups).fill(0));
  const [poolUsed, setPoolUsed] = useState(0);
  const [checked, setChecked] = useState(false);
  const [solved, setSolved] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [puzzleNum, setPuzzleNum] = useState(1);

  const totalNeeded = puzzle.groups * puzzle.perGroup;
  const remaining = totalNeeded - poolUsed;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const newPuzzle = () => {
    const p = makePuzzle();
    setPuzzle(p);
    setBaskets(Array(p.groups).fill(0));
    setPoolUsed(0);
    setChecked(false);
    setSolved(false);
    setPuzzleNum((n) => n + 1);
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { over, active } = e;
    if (!over) return;
    // source: "pool" (drag from pool) or a basket id (move between baskets)
    const source = String(active.id);
    const dest = String(over.id);
    if (source === dest) return;

    setBaskets((prev) => {
      const next = [...prev];
      if (source === "pool") {
        if (poolUsed >= totalNeeded) return prev;
        const di = Number(dest);
        next[di] = next[di] + 1;
        setPoolUsed((u) => u + 1);
      } else {
        const si = Number(source);
        const di = Number(dest);
        if (next[si] <= 0) return prev;
        next[si] -= 1;
        next[di] += 1;
      }
      return next;
    });
    setChecked(false);
  };

  const isCorrect = baskets.every((c) => c === puzzle.perGroup) && poolUsed === totalNeeded;

  const handleCheck = () => {
    setChecked(true);
    if (isCorrect) {
      setSolved(true);
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 2000);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6">
      <Confetti active={celebrate} />
      <div className="mb-5 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => setView({ name: "lesson", lessonId: target })} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <span className="text-2xl">🧮</span>
          <span className="hidden sm:inline">Build the Groups</span>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Puzzle {puzzleNum}
        </span>
      </div>

      <Card className="border-2 p-5 sm:p-7">
        <div className="mb-2 flex items-center gap-2">
          <Mascot size={32} />
          <h2 className="font-display text-lg font-bold sm:text-xl">
            Build {puzzle.groups} baskets with {puzzle.perGroup} {puzzle.emoji} in each.
          </h2>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">
          Drag the {puzzle.emoji} from the tray into the baskets so every basket has exactly {puzzle.perGroup}.
        </p>

        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          {/* Baskets */}
          <div className="mb-6 flex flex-wrap justify-center gap-3">
            {baskets.map((count, i) => {
              const tooMany = checked && count > puzzle.perGroup;
              const justRight = checked && count === puzzle.perGroup;
              return <Basket key={i} index={i} count={count} emoji={puzzle.emoji} target={puzzle.perGroup} tooMany={tooMany} justRight={justRight} />;
            })}
          </div>

          {/* Pool / tray */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/60 p-4 dark:bg-amber-950/20">
              {remaining > 0 ? (
                <PoolCounter remaining={remaining} emoji={puzzle.emoji} />
              ) : (
                <span className="text-sm font-medium text-muted-foreground">Tray is empty — all counters placed!</span>
              )}
              <div className="ml-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
                {remaining} left
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Tip: drag a counter back to another basket to move it.
            </p>
          </div>
        </DndContext>

        {/* Feedback */}
        {checked && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "mt-5 rounded-2xl p-4",
              solved ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200" : "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
            )}
          >
            <div className="flex items-center gap-2 font-display text-lg font-bold">
              {solved ? (
                <>
                  <PartyPopper className="h-5 w-5" /> You built {puzzle.groups} × {puzzle.perGroup} = {totalNeeded} {puzzle.emoji}!
                </>
              ) : (
                <>Almost! Each basket needs exactly {puzzle.perGroup}. Keep adjusting!</>
              )}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="mt-5 flex items-center justify-center gap-3">
          {!solved ? (
            <>
              <Button size="lg" onClick={handleCheck} disabled={poolUsed < totalNeeded} className="gap-2 px-7">
                <Check className="h-5 w-5" /> Check
              </Button>
              <Button variant="outline" onClick={() => { setBaskets(Array(puzzle.groups).fill(0)); setPoolUsed(0); setChecked(false); }} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
            </>
          ) : (
            <Button size="lg" onClick={newPuzzle} className="gap-2 px-7">
              <PartyPopper className="h-5 w-5" /> Next puzzle
            </Button>
          )}
        </div>
      </Card>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Manipulatives help you SEE the math. {puzzle.groups} baskets of {puzzle.perGroup} = {totalNeeded}!
      </p>
    </div>
  );
}

function Basket({
  index,
  count,
  emoji,
  target,
  tooMany,
  justRight,
}: {
  index: number;
  count: number;
  emoji: string;
  target: number;
  tooMany: boolean;
  justRight: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: index });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[120px] w-32 flex-col items-center rounded-2xl border-2 border-dashed p-2 transition-colors",
        isOver && "border-primary bg-primary/5",
        tooMany ? "border-rose-400 bg-rose-50 dark:bg-rose-950/20" : justRight ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20" : "border-amber-300 bg-amber-50/40 dark:bg-amber-950/10"
      )}
    >
      <div className="mb-1 text-xs font-bold text-amber-600 dark:text-amber-300">
        Basket {index + 1} · {count}/{target}
      </div>
      <div className="flex max-w-[110px] flex-wrap justify-center gap-0.5 text-2xl">
        {Array.from({ length: count }).map((_, i) => (
          <DraggableCounter key={i} id={index} emoji={emoji} />
        ))}
        {count === 0 && <span className="text-xs text-muted-foreground/60">drop here</span>}
      </div>
    </div>
  );
}

function DraggableCounter({ id, emoji }: { id: number; emoji: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <span
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn("cursor-grab select-none active:cursor-grabbing", isDragging && "opacity-40")}
    >
      {emoji}
    </span>
  );
}
