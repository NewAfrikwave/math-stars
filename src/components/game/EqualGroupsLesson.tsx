"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Pause, Play, RotateCcw, Volume2, Square } from "lucide-react";
import { OrchardScene } from "@/components/game/OrchardScene";
import { Confetti } from "@/components/game/Confetti";
import { useTTS } from "@/hooks/use-tts";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import { useGameStore } from "@/store/useGameStore";
import { ORCHARD_TOTAL, ORCHARD_SOLO, checkOrchardSolo, moveOrchardApple, orchardDemonstration, orchardFeedback, orchardIsEqual } from "@/lib/equal-groups-lesson";

const STEPS = ["Watch Pip", "Build it", "Solve it"] as const;
const control = "min-h-11 rounded-full border border-[#bcc8ad] bg-white px-4 py-2 text-sm font-bold focus-visible:outline-4 focus-visible:outline-[#a74032] disabled:opacity-45";

export function EqualGroupsLesson({ onPractice }: { onPractice: () => void }) {
  const soundOn = useGameStore((state) => state.soundOn);
  const soundEffects = useGameStore((state) => state.siteSettings?.soundEffectsEnabled !== false);
  const { playCorrect } = useSoundEffects(soundOn && soundEffects);
  const { speakImmediately, stop, speaking, loading } = useTTS();
  const reducedMotion = Boolean(useReducedMotion());
  const [stage, setStage] = useState(0);
  const [demoStep, setDemoStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [counts, setCounts] = useState([0, 0, 0]);
  const [holding, setHolding] = useState(false);
  const [history, setHistory] = useState<number[][]>([]);
  const [simple, setSimple] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [built, setBuilt] = useState(false);
  const [answer, setAnswer] = useState("");
  const [solved, setSolved] = useState(false);
  const [hint, setHint] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const pickButton = useRef<HTMLButtonElement>(null);
  const checkButton = useRef<HTMLButtonElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const focusAfterMove = useRef(false);
  const shownCounts = stage === 0 ? orchardDemonstration(demoStep) : counts;
  const total = shownCounts.reduce((sum, n) => sum + n, 0);
  useEffect(() => {
    if (!focusAfterMove.current) return;
    focusAfterMove.current = false;
    const full = counts.reduce((sum, n) => sum + n, 0) === ORCHARD_TOTAL;
    (full ? checkButton.current : pickButton.current)?.focus({ preventScroll: true });
  }, [counts]);
  useEffect(() => {
    if (built || solved) nextButton.current?.focus({ preventScroll: true });
  }, [built, solved]);
  const instructions = stage === 0
    ? "Watch Pip put 4 apples in each of 3 baskets. Each basket is one group. Press Next apple to go at your own pace."
    : stage === 1 ? "Your turn! Make 3 equal groups with 4 apples in every basket. Pick up an apple, then choose a basket."
      : `Now try without the picture: ${ORCHARD_SOLO.groups} baskets have ${ORCHARD_SOLO.each} apples each. How many apples are there altogether?`;

  // Narration never survives a stage change, mute, or leaving the lesson.
  useEffect(() => { stop(); return () => stop(); }, [stage, soundOn, stop]);
  useEffect(() => {
    if (!playing || stage !== 0 || demoStep >= ORCHARD_TOTAL) return;
    const timer = window.setTimeout(() => setDemoStep((n) => Math.min(ORCHARD_TOTAL, n + 1)), 850);
    return () => window.clearTimeout(timer);
  }, [playing, stage, demoStep]);
  useEffect(() => {
    const pause = () => { if (document.hidden) { setPlaying(false); stop(); } };
    document.addEventListener("visibilitychange", pause);
    return () => document.removeEventListener("visibilitychange", pause);
  }, [stop]);
  useEffect(() => {
    if (!celebrate) return;
    const timer = window.setTimeout(() => setCelebrate(false), 2600);
    return () => window.clearTimeout(timer);
  }, [celebrate]);
  const moveTo = (next: number) => {
    stop(); setPlaying(false); setHolding(false); setFeedback(""); setCelebrate(false); setStage(next);
    window.requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
  };
  const praise = (text: string) => {
    setCelebrate(true); playCorrect();
    if (soundOn) speakImmediately(text);
  };
  const pick = () => {
    if (stage !== 1 || built || total >= ORCHARD_TOTAL) return;
    setHolding(true); setFeedback("Apple picked up. Choose a basket.");
  };
  const change = (basket: number, amount: 1 | -1) => {
    if (stage !== 1 || built || (amount === 1 && !holding)) return;
    const next = moveOrchardApple(counts, basket, amount);
    if (next === counts) return;
    focusAfterMove.current = true;
    setHistory((previous) => [...previous, counts]); setCounts(next); setHolding(false);
    setFeedback(`Basket ${basket + 1} now has ${next[basket]} ${next[basket] === 1 ? "apple" : "apples"}.`);
  };
  const resetBuild = () => { stop(); setCounts([0, 0, 0]); setHistory([]); setHolding(false); setBuilt(false); setFeedback(""); setCelebrate(false); };

  return <section aria-label="Pip’s hands-on Equal Groups lesson" className="mb-6 overflow-hidden rounded-[30px] border-2 border-[#aebe9c] bg-[#fffaf0] text-[#2d4938] shadow-xl">
    <Confetti active={celebrate} />
    <div className="flex flex-wrap items-center justify-between gap-3 bg-[#2d513d] px-5 py-4 text-[#fff6da] sm:px-7">
      <div><p className="text-xs font-black uppercase tracking-[.2em] text-[#ead39b]">A hands-on math adventure</p><h2 className="font-display text-2xl font-bold sm:text-3xl">Pip’s Orchard</h2></div>
      <span className="rounded-full border border-[#baceaa]/60 px-3 py-2 text-xs font-bold">Equal groups · Grade 3 pilot</span>
    </div>
    <nav aria-label="Lesson activity steps" className="grid grid-cols-3 gap-2 border-b border-[#dce1d0] p-3 sm:px-7">
      {STEPS.map((label, index) => <button key={label} type="button" onClick={() => moveTo(index)} aria-current={stage === index ? "step" : undefined}
        className={`min-h-12 rounded-2xl px-2 py-3 font-display text-sm font-bold focus-visible:outline-4 focus-visible:outline-[#a74032] sm:text-base ${stage === index ? "bg-[#e5bb66] text-[#3a341e]" : "bg-[#eaf0e1]"}`}>{index + 1}. {label}</button>)}
    </nav>
    <div className="space-y-5 p-4 sm:p-7">
      <div className="flex items-center gap-4">
        <Image src="/pip-explorer.webp" alt="Pip" width={66} height={88} className="h-22 w-16 shrink-0 object-contain" />
        <div><h3 ref={heading} tabIndex={-1} className="font-display text-xl font-bold outline-none sm:text-2xl">{stage === 0 ? "Same amount. Every basket." : stage === 1 ? "Pack a picnic for three friends" : "You’re the problem solver now"}</h3>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed sm:text-base">{instructions}</p></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={control} disabled={!soundOn} onClick={() => { if (speaking || loading) stop(); else speakImmediately(instructions); }}>
          {speaking || loading ? <Square className="mr-2 inline h-4 w-4" /> : <Volume2 className="mr-2 inline h-4 w-4" />}{speaking || loading ? "Stop reading" : "Hear Pip"}</button>
        {!soundOn && <span className="self-center text-xs">Sound is off in your learner settings.</span>}
        {stage < 2 && <button type="button" className={control} aria-pressed={simple} onClick={() => setSimple(!simple)}>{simple ? "Show 3D" : "Simple view"}</button>}
      </div>
      {stage < 2 ? <>
        {!simple && <OrchardScene counts={shownCounts} holding={holding} interactive={stage === 1 && !built} reducedMotion={reducedMotion} onPick={pick} onPlace={(basket) => change(basket, 1)} />}
        {stage === 0 ? <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={control} disabled={demoStep >= ORCHARD_TOTAL} onClick={() => setPlaying(!playing)}>{playing && demoStep < ORCHARD_TOTAL ? <Pause className="mr-2 inline h-4 w-4" /> : <Play className="mr-2 inline h-4 w-4" />}{playing && demoStep < ORCHARD_TOTAL ? "Pause demonstration" : "Play demonstration"}</button>
          <button type="button" className={control} disabled={demoStep >= ORCHARD_TOTAL} onClick={() => { setPlaying(false); setDemoStep((n) => Math.min(ORCHARD_TOTAL, n + 1)); }}>Next apple</button>
          <button type="button" className={control} onClick={() => { stop(); setPlaying(false); setDemoStep(0); }}>Replay</button>
          <span role="status" className="text-sm font-bold">{demoStep === ORCHARD_TOTAL ? "4 + 4 + 4 = 12. That’s 3 × 4!" : `${demoStep} ${demoStep === 1 ? "apple" : "apples"} placed. Watch a group grow to 4.`}</span>
        </div> : <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#ecf0e2] p-4">
          <button ref={pickButton} type="button" className={control} disabled={built || total >= ORCHARD_TOTAL} aria-pressed={holding} onClick={pick}>🍎 {holding ? "Holding an apple · choose a basket" : "Pick up an apple"}</button>
          <span className="text-sm font-bold">{ORCHARD_TOTAL - total} apples on the tray</span>
        </div>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {shownCounts.map((count, basket) => <div key={basket} className="rounded-2xl border-2 border-[#d6c19a] bg-white p-4 text-center">
            <p className="font-display text-lg font-bold">Basket {basket + 1}</p><p className="my-2 text-sm font-bold">{count} {count === 1 ? "apple" : "apples"}</p>
            {simple && <div aria-hidden="true" className="mb-3 grid min-h-8 grid-cols-4 gap-1 text-xl">{Array.from({ length: count }, (_, i) => <span key={i}>🍎</span>)}</div>}
            {stage === 1 && <div className="flex flex-wrap justify-center gap-2">
              <button type="button" className={control} disabled={!holding || built || total >= ORCHARD_TOTAL} aria-label={`Put apple in basket ${basket + 1}`} onClick={() => change(basket, 1)}>Add apple</button>
              <button type="button" className={control} disabled={!count || built} aria-label={`Take apple out of basket ${basket + 1}`} onClick={() => change(basket, -1)}>Take out</button>
            </div>}
          </div>)}
        </div>
        <div className="rounded-2xl bg-[#f3e5c4] p-4 text-center font-display text-lg font-bold" aria-label="Your groups as addition">{shownCounts.join(" + ")} = {total} {total === 1 ? "apple" : "apples"}</div>
        {stage === 1 && <div className="flex flex-wrap gap-2">
          <button type="button" className={control} disabled={built || !history.length} onClick={() => { setCounts(history[history.length - 1]); setHistory(history.slice(0, -1)); setHolding(false); setFeedback("Last move undone."); }}>Undo</button>
          <button type="button" className={control} onClick={resetBuild}><RotateCcw className="mr-2 inline h-4 w-4" />Start over</button>
          <button ref={checkButton} type="button" className={`${control} !bg-[#2d513d] text-white`} disabled={built} onClick={() => {
            const correct = orchardIsEqual(counts); const text = orchardFeedback(counts); setFeedback(text);
            if (correct) { setBuilt(true); setHolding(false); praise(text); }
          }}><Check className="mr-2 inline h-4 w-4" />Check my groups</button>
        </div>}
      </> : <form onSubmit={(event) => {
        event.preventDefault(); if (solved) return;
        if (checkOrchardSolo(answer)) { setSolved(true); setFeedback("You got it! 4 groups of 2 is 8 apples. You used multiplication on your own!"); praise("You got it! Four groups of two is eight apples. Wonderful thinking!"); }
        else setFeedback("Keep going. Add 2 once for each of the 4 baskets. You can change your answer and try again.");
      }} className="space-y-4 rounded-3xl border-2 border-[#c7d3b6] bg-white p-5 sm:p-7">
        <p className="font-display text-2xl font-bold">{ORCHARD_SOLO.groups} groups of {ORCHARD_SOLO.each} = ?</p>
        <label className="block font-bold" htmlFor="orchard-solo-answer">How many apples altogether?</label>
        <div className="flex flex-wrap gap-3">
          <input id="orchard-solo-answer" inputMode="numeric" autoComplete="off" maxLength={3} value={answer} disabled={solved} onChange={(event) => { setAnswer(event.target.value); setFeedback(""); }} className="min-h-12 w-32 rounded-2xl border-2 border-[#b4c3a1] p-3 text-center text-xl focus-visible:outline-4 focus-visible:outline-[#a74032]" />
          <button type="submit" disabled={solved || !answer.trim()} className={`${control} !bg-[#2d513d] text-white`}>Check answer</button>
          {!solved && <button type="button" className={control} aria-expanded={hint} onClick={() => setHint(!hint)}>Pip’s hint</button>}
        </div>
        {hint && !solved && <p className="rounded-2xl bg-amber-50 p-4">One 2 for every basket: 2 + 2 + 2 + 2. What is the total?</p>}
        {solved && <button type="button" className={control} onClick={() => { setSolved(false); setAnswer(""); setFeedback(""); setHint(false); setCelebrate(false); stop(); }}>Try this step again</button>}
      </form>}
      <p role="status" aria-live="polite" className={`rounded-2xl p-3 text-sm font-semibold ${feedback ? "bg-[#e5efdc]" : "sr-only"}`}>{feedback}</p>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#dce1d0] pt-5">
        <p className="max-w-md text-xs leading-relaxed">This is a learning warm-up. Stars and saved lesson progress come from your practice questions. You can revisit any step.</p>
        {stage < 2 ? <button ref={nextButton} type="button" className={`${control} !bg-[#a74032] text-white`} onClick={() => moveTo(stage + 1)}>{stage === 0 ? "Now I’ll build it" : "Try on my own"}<ArrowRight className="ml-2 inline h-4 w-4" /></button>
          : <button ref={nextButton} type="button" className={`${control} !bg-[#a74032] text-white`} onClick={() => { stop(); onPractice(); }}>Continue to saved practice<ArrowRight className="ml-2 inline h-4 w-4" /></button>}
      </div>
    </div>
  </section>;
}
