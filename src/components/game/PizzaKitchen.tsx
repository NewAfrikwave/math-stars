"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Check, ChefHat, Hand, RotateCcw, Undo2, UtensilsCrossed } from "lucide-react";
import { PizzaScene } from "@/components/game/PizzaScene";
import { SpeakButton } from "@/components/game/SpeakButton";
import { movePizzaSlice, pizzaInstruction, pizzaPlateCounts, pizzaPrompt, type PizzaChallenge } from "@/lib/pizza-party";

export interface PizzaKitchenProps {
  challenge: PizzaChallenge;
  busy: boolean;
  soundOn: boolean;
  feedback: { correct: boolean; explanation: string } | null;
  finalQuestion: boolean;
  onSubmit: (placements: number[], trigger: HTMLButtonElement) => void;
  onContinue: () => void;
}

export function PizzaKitchen({ challenge, busy, soundOn, feedback, finalQuestion, onSubmit, onContinue }: PizzaKitchenProps) {
  const [placements, setPlacements] = useState<number[]>(() => Array(challenge.slices).fill(-1));
  const [selected, setSelected] = useState<number | null>(null);
  const [history, setHistory] = useState<number[][]>([]);
  const [simple, setSimple] = useState(false);
  const [announcement, setAnnouncement] = useState("Choose a slice to start cooking.");
  const nextButton = useRef<HTMLButtonElement>(null);
  const orderHeading = useRef<HTMLHeadingElement>(null);
  const sliceButtons = useRef<Array<HTMLButtonElement | null>>([]);
  const focusAfterMove = useRef<number | null>(null);
  const reducedMotion = Boolean(useReducedMotion());
  const disabled = busy || Boolean(feedback);
  const counts = pizzaPlateCounts(challenge, placements);
  const remaining = placements.filter((plate) => plate === -1).length;
  useEffect(() => { if (feedback) nextButton.current?.focus(); }, [feedback]);
  useEffect(() => { orderHeading.current?.focus(); }, []);
  useEffect(() => {
    if (focusAfterMove.current !== null) {
      sliceButtons.current[focusAfterMove.current]?.focus({ preventScroll: true });
      focusAfterMove.current = null;
    }
  }, [placements]);

  const pick = (slice: number) => {
    if (disabled) return;
    setSelected(slice);
    setAnnouncement(`Slice ${slice + 1} picked up. Choose a plate or return it to the board.`);
  };
  const place = (plate: number, draggedSlice?: number) => {
    const slice = draggedSlice ?? selected;
    if (disabled || slice === null || placements[slice] === plate) return;
    setHistory((previous) => [...previous, placements]);
    const next = movePizzaSlice(challenge, placements, slice, plate);
    const nextUnserved = next.findIndex((value) => value < 0);
    focusAfterMove.current = nextUnserved < 0 ? slice : nextUnserved;
    setPlacements(next);
    setSelected(null);
    setAnnouncement(`Slice ${slice + 1} ${plate < 0 ? "returned to the board" : `served on plate ${plate + 1}`}.`);
  };
  const reset = () => {
    if (disabled) return;
    setHistory((previous) => [...previous, placements]);
    setPlacements(Array(challenge.slices).fill(-1)); setSelected(null);
    setAnnouncement("All slices are back on the board. Try a new arrangement.");
  };

  return <section className="mt-5 overflow-hidden rounded-[28px] border-2 border-[#c5aa76] bg-[#fff9e9] text-[#2d402f]" aria-label="Interactive Pizza Party">
    <div className="flex items-center justify-between gap-3 bg-[#315c45] px-4 py-3 text-[#fff7dd] sm:px-6">
      <span className="flex items-center gap-2 font-display text-lg font-black"><ChefHat className="h-6 w-6" /> Pip’s Pizza Kitchen</span>
      <button type="button" aria-pressed={simple} onClick={() => setSimple(!simple)} className="min-h-11 rounded-full border border-white/50 px-3 text-xs font-bold focus-visible:outline-4 focus-visible:outline-amber-300">{simple ? "Show 3D" : "Simple view"}</button>
    </div>
    <div className="space-y-4 p-3 sm:p-5">
      <div className="rounded-2xl border border-[#e7d4ae] bg-white p-4">
        <p className="text-xs font-black uppercase tracking-[.14em] text-[#9c4934]">Your pizza order</p>
        <h1 ref={orderHeading} data-arcade-focus-target tabIndex={-1} className="mt-2 font-display text-2xl font-black leading-tight outline-none sm:text-3xl">{pizzaPrompt(challenge)}</h1>
        <p className="mt-2 text-sm font-semibold">{pizzaInstruction(challenge)}</p>
        {soundOn && <SpeakButton text={`${pizzaPrompt(challenge)} ${pizzaInstruction(challenge)}`} label="Hear my order" variant="solid" size="lg" className="mt-3 bg-[#315c45] text-white" />}
      </div>

      <div className={simple ? "" : "grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)]"}>
      {!simple && <PizzaScene challenge={challenge} placements={placements} selected={selected} disabled={disabled} reducedMotion={reducedMotion} onPick={pick} onPlace={place} />}
      <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold">
        <span className="flex items-center gap-2"><Hand className="h-4 w-4" /> {selected === null ? "Pick a slice, then choose its plate" : `Holding slice ${selected + 1} · Choose a plate`}</span>
        <span className="rounded-full bg-[#e9eddd] px-3 py-1">{remaining} on the board</span>
      </div>
      <fieldset disabled={disabled}>
        <legend className="mb-2 text-xs font-bold uppercase tracking-wider">Slices · tap or use Tab and Enter</legend>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-4">
          {placements.map((plate, slice) => <button ref={(element) => { sliceButtons.current[slice] = element; }} key={slice} type="button" onClick={() => pick(slice)} aria-pressed={selected === slice}
            aria-label={`Slice ${slice + 1}, ${plate < 0 ? "on board" : `on plate ${plate + 1}`}`}
            className={`min-h-14 rounded-xl border-2 px-1 py-2 font-display font-black transition-colors focus-visible:outline-4 focus-visible:outline-[#9c4934] disabled:opacity-60 ${selected === slice ? "border-[#315c45] bg-[#315c45] text-white" : "border-[#d5b16c] bg-[#ffedba] text-[#6b421d]"}`}>
            {slice + 1}<span className="block text-[10px] font-sans font-bold">{plate < 0 ? "BOARD" : `PLATE ${plate + 1}`}</span>
          </button>)}
        </div>
      </fieldset>
      <fieldset disabled={disabled || selected === null}>
        <legend className="mb-2 text-xs font-bold uppercase tracking-wider">Serve your slice</legend>
        <div className="grid grid-cols-2 gap-2">
          {counts.map((count, plate) => <button key={plate} type="button" onClick={() => place(plate)} aria-label={`Serve to plate ${plate + 1}, ${count} slices`}
            className="min-h-20 rounded-2xl border-2 border-[#8ba58a] bg-[#edf2e2] p-3 text-center focus-visible:outline-4 focus-visible:outline-[#9c4934] disabled:opacity-65">
            <span className="flex items-center justify-center gap-2 font-display font-black"><UtensilsCrossed className="h-4 w-4" /> {challenge.mode === "share" ? `Friend ${plate + 1}` : "Order plate"}</span>
            <span className="mt-1 block text-sm font-bold">{count} {count === 1 ? "slice" : "slices"}{challenge.mode === "fraction" && ` · ${count}/${challenge.slices}`}</span>
          </button>)}
          <button type="button" onClick={() => place(-1)} className="min-h-20 rounded-2xl border-2 border-dashed border-[#b89464] p-3 text-sm font-bold focus-visible:outline-4 focus-visible:outline-[#9c4934] disabled:opacity-65">Return to board</button>
        </div>
      </fieldset>
      </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>

      {feedback ? <div className={`rounded-2xl border-2 p-4 ${feedback.correct ? "border-emerald-500 bg-emerald-50" : "border-amber-500 bg-amber-50"}`}>
        <h2 className="font-display text-2xl font-black">{feedback.correct ? "Order ready, chef!" : "Let’s learn from this order"}</h2>
        <p className="mt-2 font-semibold">{feedback.explanation}</p>
        <button ref={nextButton} type="button" onClick={onContinue} className="mt-3 min-h-12 rounded-full bg-[#315c45] px-6 font-display font-black text-white focus-visible:outline-4 focus-visible:outline-[#9c4934]">{finalQuestion ? "See my coins" : "Next order"}</button>
      </div> : <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e7d4ae] pt-4">
        <div className="flex gap-2">
          <button type="button" disabled={disabled || history.length === 0} onClick={() => {
            setPlacements(history[history.length - 1]); setHistory(history.slice(0, -1)); setSelected(null); setAnnouncement("Last move undone.");
          }} className="flex min-h-12 items-center gap-1 rounded-xl border border-[#b89464] px-3 text-sm font-bold disabled:opacity-45"><Undo2 className="h-4 w-4" /> Undo</button>
          <button type="button" disabled={disabled || remaining === challenge.slices} onClick={reset} className="flex min-h-12 items-center gap-1 rounded-xl border border-[#b89464] px-3 text-sm font-bold disabled:opacity-45"><RotateCcw className="h-4 w-4" /> Start over</button>
        </div>
        <button type="button" disabled={disabled || remaining === challenge.slices} onClick={(event) => onSubmit(placements, event.currentTarget)} className="flex min-h-14 items-center gap-2 rounded-full bg-[#aa4435] px-6 font-display text-lg font-black text-white shadow-[0_4px_0_#6d3026] focus-visible:outline-4 focus-visible:outline-[#315c45] disabled:opacity-50"><Check className="h-5 w-5" /> {busy ? "Saving order…" : "Serve my order"}</button>
      </div>}
    </div>
  </section>;
}
