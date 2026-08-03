"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Mic } from "lucide-react";
import type { MultipleChoiceProblem, NumberProblem, Problem, TrueFalseProblem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSpeechRecognition, parseSpokenNumber } from "@/hooks/use-speech-recognition";
import { useGameStore } from "@/store/useGameStore";

interface AnswerInputProps {
  problem: Problem;
  submitted: boolean;
  // called whenever the learner's current answer changes
  onAnswerChange: (answer: unknown) => void;
  // called when the learner presses Check. For choice-based inputs the chosen
  // value is passed directly to avoid stale-closure issues; for typed inputs
  // no argument is passed and the latest tracked answer is used.
  onSubmit: (answer?: unknown) => void;
  // when true (preschool), number inputs render as big tappable number buttons
  // instead of a keyboard text field — easier for little fingers.
  bigButtons?: boolean;
}

type TypedAnswerProps<T extends Problem> = Omit<AnswerInputProps, "problem"> & { problem: T };

export function AnswerInput({ problem, submitted, onAnswerChange, onSubmit, bigButtons }: AnswerInputProps) {
  switch (problem.answerType) {
    case "number":
      return bigButtons ? (
        <NumberPad problem={problem} submitted={submitted} onAnswerChange={onAnswerChange} onSubmit={onSubmit} />
      ) : (
        <NumberInput problem={problem} submitted={submitted} onAnswerChange={onAnswerChange} onSubmit={onSubmit} />
      );
    case "multiple-choice":
      return <MultipleChoice problem={problem} submitted={submitted} onAnswerChange={onAnswerChange} onSubmit={onSubmit} />;
    case "true-false":
      return <TrueFalse problem={problem} submitted={submitted} onAnswerChange={onAnswerChange} onSubmit={onSubmit} />;
    case "fraction":
      return <FractionInput problem={problem} submitted={submitted} onAnswerChange={onAnswerChange} onSubmit={onSubmit} />;
    case "time":
      return <TimeInput problem={problem} submitted={submitted} onAnswerChange={onAnswerChange} onSubmit={onSubmit} />;
    case "shape-classify":
    case "numberline":
    default:
      return null;
  }
}

// NOTE: The parent problem card is keyed by `problem.id`, so these sub-components
// remount fresh for each new question — no manual reset effects needed.

// ---------------------------------------------------------------------------
function NumberInput({ problem, submitted, onAnswerChange, onSubmit }: TypedAnswerProps<NumberProblem>) {
  const [val, setVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const voiceEnabled = useGameStore((s) => s.siteSettings?.voiceAnswersEnabled !== false);
  const { listening, start, stop, supported } = useSpeechRecognition({
    onResult: (transcript) => {
      const n = parseSpokenNumber(transcript);
      if (n !== null) {
        setVal(String(n));
        onAnswerChange(n);
      }
    },
  });

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
      <div className="relative">
        <Input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          placeholder="Type your answer"
          value={val}
          disabled={submitted}
          onChange={(e) => {
            setVal(e.target.value);
            onAnswerChange(e.target.value === "" ? null : Number(e.target.value));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && val !== "" && !submitted) onSubmit();
          }}
          className="h-14 w-44 text-center font-display text-2xl font-semibold"
        />
        {supported && voiceEnabled && (
          <button
            type="button"
            onClick={() => (listening ? stop() : start())}
            disabled={submitted}
            title={listening ? "Listening… tap to stop" : "Say your answer"}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full transition-colors",
              listening
                ? "bg-rose-500 text-white animate-pulse"
                : "bg-violet-100 text-violet-600 hover:bg-violet-200 dark:bg-violet-950/40 dark:text-violet-300"
            )}
            aria-label="Voice answer"
          >
            <Mic className="h-4 w-4" />
          </button>
        )}
      </div>
      {problem.unit && (
        <span className="text-base font-medium text-muted-foreground">{problem.unit}</span>
      )}
      <Button
        size="lg"
        onClick={onSubmit}
        disabled={submitted || val === ""}
        className="h-14 gap-2 px-7 text-base"
      >
        <Check className="h-5 w-5" /> Check
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Known color names → hex, for rendering visual swatches in preschool choices.
const COLOR_HEX: Record<string, string> = {
  red: "#ef4444", blue: "#3b82f6", yellow: "#eab308", green: "#22c55e",
  purple: "#a855f7", orange: "#f97316", pink: "#ec4899",
};

// Render a visual chip for a choice if it's a color or shape name (preschool).
function ChoiceVisual({ choice }: { choice: string }) {
  const lower = choice.toLowerCase();
  if (COLOR_HEX[lower]) {
    return (
      <span
        className="inline-block h-8 w-8 rounded-full border-2 border-white shadow-sm"
        style={{ backgroundColor: COLOR_HEX[lower] }}
      />
    );
  }
  if (lower === "circle") return <span className="text-3xl">⭕</span>;
  if (lower === "square") return <span className="text-3xl">⬜</span>;
  if (lower === "triangle") return <span className="text-3xl">🔺</span>;
  if (lower === "rectangle") return <span className="text-3xl">▭</span>;
  return null;
}

function MultipleChoice({ problem, submitted, onAnswerChange, onSubmit }: TypedAnswerProps<MultipleChoiceProblem>) {
  const [selected, setSelected] = useState<number | null>(null);
  const hasVisual = problem.choices.some((c) => {
    const l = c.toLowerCase();
    return COLOR_HEX[l] || ["circle", "square", "triangle", "rectangle"].includes(l);
  });

  return (
    <div className="grid w-full max-w-xl gap-3 sm:grid-cols-2">
      {problem.choices.map((choice, i) => {
        const isCorrect = i === problem.correctIndex;
        const isSelected = selected === i;
        return (
          <button
            key={i}
            disabled={submitted}
            onClick={() => {
              setSelected(i);
              onAnswerChange(i);
              if (!submitted) {
                onSubmit(i);
              }
            }}
            className={cn(
              "flex items-center gap-3 rounded-2xl border-2 px-5 py-4 text-left font-display text-lg font-semibold transition-all",
              "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
              !submitted && "bg-card hover:border-primary/50",
              submitted && isCorrect && "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
              submitted && isSelected && !isCorrect && "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
              submitted && !isCorrect && !isSelected && "opacity-60",
            )}
          >
            {hasVisual ? (
              <ChoiceVisual choice={choice} />
            ) : (
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm">
                {String.fromCharCode(65 + i)}
              </span>
            )}
            <span>{choice}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
function TrueFalse({ problem, submitted, onAnswerChange, onSubmit }: TypedAnswerProps<TrueFalseProblem>) {
  const [selected, setSelected] = useState<boolean | null>(null);

  return (
    <div className="flex gap-3">
      {[true, false].map((v) => (
        <button
          key={String(v)}
          disabled={submitted}
          onClick={() => {
            setSelected(v);
            onAnswerChange(v);
            if (!submitted) onSubmit(v);
          }}
          className={cn(
            "rounded-2xl border-2 px-8 py-4 font-display text-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md",
            !submitted && "bg-card hover:border-primary/50",
            submitted && v === problem.isTrue && "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
            submitted && selected === v && v !== problem.isTrue && "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
          )}
        >
          {v ? "✅ True" : "❌ False"}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
function FractionInput({ problem, submitted, onAnswerChange, onSubmit }: AnswerInputProps) {
  const [num, setNum] = useState("");
  const [den, setDen] = useState("");

  const commit = (n: string, d: string) => {
    if (n === "" || d === "") onAnswerChange(null);
    else onAnswerChange({ numerator: Number(n), denominator: Number(d) });
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-col items-center">
        <Input
          type="number"
          inputMode="numeric"
          placeholder="top"
          value={num}
          disabled={submitted}
          onChange={(e) => {
            setNum(e.target.value);
            commit(e.target.value, den);
          }}
          className="h-12 w-28 text-center font-display text-xl font-semibold"
        />
        <div className="my-1 h-1 w-28 rounded bg-foreground/60" />
        <Input
          type="number"
          inputMode="numeric"
          placeholder="bottom"
          value={den}
          disabled={submitted}
          onChange={(e) => {
            setDen(e.target.value);
            commit(num, e.target.value);
          }}
          className="h-12 w-28 text-center font-display text-xl font-semibold"
        />
      </div>
      <Button size="lg" onClick={onSubmit} disabled={submitted || num === "" || den === ""} className="h-12 gap-2 px-7">
        <Check className="h-5 w-5" /> Check
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
function TimeInput({ problem, submitted, onAnswerChange, onSubmit }: AnswerInputProps) {
  const [hh, setHh] = useState("");
  const [mm, setMm] = useState("");

  const commit = (h: string, m: string) => {
    if (h === "" || m === "") onAnswerChange(null);
    else onAnswerChange(`${h}:${m}`);
  };

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
      <div className="flex items-center gap-1 rounded-2xl border-2 border-border bg-card px-3 py-2">
        <Input
          type="number"
          inputMode="numeric"
          placeholder="H"
          value={hh}
          disabled={submitted}
          max={12}
          onChange={(e) => {
            setHh(e.target.value);
            commit(e.target.value, mm);
          }}
          className="h-12 w-16 border-0 p-0 text-center font-display text-2xl font-bold focus-visible:ring-0"
        />
        <span className="font-display text-2xl font-bold">:</span>
        <Input
          type="number"
          inputMode="numeric"
          placeholder="MM"
          value={mm}
          disabled={submitted}
          max={59}
          onChange={(e) => {
            setMm(e.target.value);
            commit(hh, e.target.value);
          }}
          className="h-12 w-20 border-0 p-0 text-center font-display text-2xl font-bold focus-visible:ring-0"
        />
      </div>
      <Button size="lg" onClick={onSubmit} disabled={submitted || hh === "" || mm === ""} className="h-14 gap-2 px-7">
        <Check className="h-5 w-5" /> Check
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Big tappable number pad for preschoolers — no keyboard needed.
function NumberPad({ problem, submitted, onAnswerChange, onSubmit }: TypedAnswerProps<NumberProblem>) {
  const [val, setVal] = useState("");
  useEffect(() => {
    // focus not needed for buttons
  }, []);

  const tap = (digit: string) => {
    if (submitted) return;
    const next = (val + digit).slice(0, 2); // max 2 digits (preschool counts to 10)
    setVal(next);
    onAnswerChange(next === "" ? null : Number(next));
  };
  const clear = () => {
    setVal("");
    onAnswerChange(null);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Display */}
      <div className="flex items-center gap-2">
        <div className="flex h-16 w-28 items-center justify-center rounded-2xl border-2 border-border bg-card font-display text-4xl font-bold">
          {val || <span className="text-muted-foreground/40">?</span>}
        </div>
        {problem.unit && (
          <span className="text-base font-medium text-muted-foreground">{problem.unit}</span>
        )}
      </div>
      {/* Number grid 1-10 */}
      <div className="grid grid-cols-5 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map((d) => (
          <button
            key={d}
            disabled={submitted}
            onClick={() => tap(d)}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-rose-200 bg-rose-50 font-display text-2xl font-bold text-rose-700 transition-all hover:-translate-y-0.5 hover:bg-rose-100 active:translate-y-0 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300",
              submitted && "opacity-60"
            )}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={clear} disabled={submitted} className="gap-1">
          Clear
        </Button>
        <Button size="lg" onClick={() => onSubmit()} disabled={submitted || val === ""} className="gap-2 px-7">
          <Check className="h-5 w-5" /> Check
        </Button>
      </div>
    </div>
  );
}
