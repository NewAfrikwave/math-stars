"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpenCheck,
  Calculator,
  Check,
  ChevronRight,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Square,
  Star,
  Volume2,
  X,
} from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { Confetti } from "@/components/game/Confetti";
import { StickerBurst } from "@/components/game/StickerBurst";
import { AnimatedNumber, FloatingSparkles, springy } from "@/components/game/MotionKit";
import { useTTS } from "@/hooks/use-tts";

const TABLES = Array.from({ length: 11 }, (_, index) => index + 2);
const FACTORS = Array.from({ length: 12 }, (_, index) => index + 1);

function makeQuestion(table: number, previous = 0) {
  let factor = Math.floor(Math.random() * 12) + 1;
  if (factor === previous) factor = factor === 12 ? 1 : factor + 1;
  return factor;
}

export function TimesTableView() {
  const setView = useGameStore((s) => s.setView);
  const studentName = useGameStore((s) => s.studentName);
  const [selected, setSelected] = useState(2);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [factor, setFactor] = useState(() => makeQuestion(2));
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "retry" | null>(null);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState(0);
  const { speakImmediately, speaking, stop } = useTTS();

  const products = useMemo(() => FACTORS.map((factorValue) => selected * factorValue), [selected]);
  const tableSpeech = useMemo(
    () => FACTORS.map((factorValue) => `${selected} times ${factorValue} is ${selected * factorValue}`).join(". "),
    [selected],
  );

  useEffect(() => () => stop(), [stop]);

  const toggleTableSpeech = () => {
    if (speaking) stop();
    else speakImmediately(tableSpeech, { speed: 0.86 });
  };

  const submitAnswer = (event: FormEvent) => {
    event.preventDefault();
    if (Number(answer) === selected * factor) {
      setFeedback("correct");
      setScore((value) => value + 1);
      setQuestions((value) => value + 1);
      window.setTimeout(() => {
        setFactor((value) => makeQuestion(selected, value));
        setAnswer("");
        setFeedback(null);
      }, 850);
    } else {
      setFeedback("retry");
      setQuestions((value) => value + 1);
    }
  };

  const selectTable = (table: number) => {
    stop();
    setSelected(table);
    setFactor(makeQuestion(table));
    setAnswer("");
    setFeedback(null);
  };

  const openPractice = () => {
    stop();
    setPracticeOpen(true);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#3d2415] text-[#2d2318]">
      <Image src="/explorer-study-bg.webp" alt="A cozy explorer study" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-[#271304]/20" />
      <FloatingSparkles className="z-[1] opacity-70" tone="cream" />
      <Confetti active={feedback === "correct"} />
      <StickerBurst active={feedback === "correct"} />

      <header className="relative z-20 border-b border-[#ad9455]/50 bg-[#142d1d]/95 text-[#fff7d5] shadow-lg">
        <div className="mx-auto flex min-h-[78px] max-w-[1280px] items-center justify-between gap-3 px-4 sm:px-7">
          <button onClick={() => { stop(); setView({ name: "home" }); }} className="flex min-h-11 items-center gap-2 rounded-full px-3 font-display font-black hover:bg-[#2b462e] focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#f2c457]"><ArrowLeft className="h-5 w-5" />Back home</button>
          <div className="text-center"><p className="font-display text-xl font-black sm:text-2xl">Times Table Lab</p><p className="hidden text-xs font-bold text-[#e1ca84] sm:block">Every table from 2× through 12×</p></div>
          <motion.div key={score} initial={{ scale: 0.82 }} animate={{ scale: 1 }} transition={springy} className="flex items-center gap-2 rounded-full border border-[#b49a58]/50 bg-[#2b462e] px-4 py-2 font-display font-black"><Star className="h-5 w-5 fill-[#f8c53d] text-[#f8c53d]" /><AnimatedNumber value={score} /></motion.div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1240px] px-3 pb-8 pt-5 sm:px-6 sm:pt-7">
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border-[5px] border-[#68421f] bg-[#f6e3b7]/95 p-4 shadow-[0_18px_45px_rgba(30,13,3,0.45)] sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-sm font-black uppercase tracking-[0.14em] text-[#9a302c]">Welcome to the lab, {studentName}</p><h1 className="mt-1 font-display text-3xl font-black text-[#24482d] sm:text-4xl">Choose a table to explore</h1><p className="mt-1 max-w-2xl font-semibold text-[#6c573a]">Spot patterns, hear every fact out loud, then test your speed in a quick practice round.</p></div>
            <div className="flex gap-2">
              <button onClick={toggleTableSpeech} aria-label={speaking ? "Stop reading the times table" : `Read the ${selected} times table aloud`} aria-pressed={speaking} className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-[#31573a] bg-[#fff7df] px-4 font-display font-black text-[#31573a] hover:bg-[#ebddba]">
                {speaking ? <Square className="h-5 w-5 fill-current" /> : <Volume2 className="h-5 w-5" />}
                {speaking ? "Stop reading" : "Read aloud"}
              </button>
              <button onClick={openPractice} className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-[#7a2328] bg-[#aa2f34] px-5 font-display font-black text-white shadow-[0_4px_0_#6d2023] active:translate-y-1 active:shadow-none"><Sparkles className="h-5 w-5" />Practice</button>
            </div>
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-2 nice-scroll" aria-label="Choose a times table">
            {TABLES.map((table) => <motion.button key={table} whileHover={{ y: -4, scale: 1.04 }} whileTap={{ scale: 0.92 }} animate={selected === table ? { y: -3, scale: 1.06 } : { y: 0, scale: 1 }} transition={springy} onClick={() => selectTable(table)} className={`relative flex h-14 min-w-14 items-center justify-center overflow-hidden rounded-2xl border-2 font-display text-lg font-black focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#24482d] ${selected === table ? "border-[#24482d] bg-[#315f3a] text-white shadow-md" : "border-[#c49d5d] bg-[#fff5d8] text-[#654a2b]"}`} aria-pressed={selected === table}>{selected === table && <motion.span layoutId="table-glow" className="absolute inset-0 bg-white/10" />}<span className="relative">{table}×</span></motion.button>)}
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="overflow-hidden rounded-[24px] border-2 border-[#bd9855] bg-[#fff8e5] shadow-inner">
              <div className="grid grid-cols-2 gap-px bg-[#d8be88] sm:grid-cols-3 lg:grid-cols-4">
                {FACTORS.map((factorValue, index) => (
                  <motion.button key={factorValue} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.025 }} onClick={() => { stop(); setFactor(factorValue); setPracticeOpen(true); setAnswer(""); setFeedback(null); }} className="group min-h-[88px] bg-[#fff8e5] p-3 text-center transition-colors hover:bg-[#f1e0b7] focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#315f3a] sm:min-h-[105px]">
                    <span className="block text-xs font-black uppercase tracking-wide text-[#9a302c]">Fact {index + 1}</span>
                    <span className="mt-1 block font-display text-2xl font-black text-[#2d4e31] sm:text-3xl">{selected} × {factorValue}</span>
                    <span className="block font-display text-xl font-black text-[#9a302c]">= {products[index]}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-[22px] border-2 border-[#bb9556] bg-[#fff4d2] p-5">
                <div className="flex items-center gap-2 text-[#835321]"><Lightbulb className="h-6 w-6" /><h2 className="font-display text-xl font-black">Pattern clue</h2></div>
                <p className="mt-3 font-semibold leading-relaxed text-[#59482f]">Count forward by {selected}. Each answer is exactly {selected} more than the one before it.</p>
                <div className="mt-4 flex flex-wrap gap-2">{products.slice(0, 6).map((product) => <span key={product} className="rounded-full bg-[#e7cf97] px-3 py-1 font-display font-black text-[#31573a]">{product}</span>)}</div>
              </div>
              <div className="rounded-[22px] border-2 border-[#8d7aae] bg-[#ece4f5] p-5">
                <BookOpenCheck className="h-7 w-7 text-[#5e487e]" />
                <h2 className="mt-2 font-display text-xl font-black text-[#4c386c]">Try it your way</h2>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-[#5d5270]">Tap any fact to practice it, or press Practice for a surprise question from the {selected}× table.</p>
                <button onClick={openPractice} className="mt-4 flex w-full min-h-12 items-center justify-center gap-2 rounded-full bg-[#69518c] px-4 font-display font-black text-white">Start {selected}× practice<ChevronRight className="h-5 w-5" /></button>
              </div>
            </aside>
          </div>
        </motion.section>
      </main>

      <AnimatePresence>
        {practiceOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#160b04]/70 p-4" role="dialog" aria-modal="true" aria-labelledby="practice-title">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="relative w-full max-w-lg rounded-[30px] border-[5px] border-[#6d4824] bg-[#fff0c9] p-6 text-center shadow-2xl sm:p-8">
              <button onClick={() => setPracticeOpen(false)} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#ead4a3] hover:bg-[#dec48c]" aria-label="Close practice"><X /></button>
              <p className="text-sm font-black uppercase tracking-[0.14em] text-[#8f2c2d]">Quick practice</p>
              <h2 id="practice-title" className="mt-2 font-display text-4xl font-black text-[#254b2f]">What is {selected} × {factor}?</h2>
              <form onSubmit={submitAnswer} className="mt-6">
                <label htmlFor="table-answer" className="sr-only">Your answer</label>
                <input id="table-answer" autoFocus inputMode="numeric" type="number" value={answer} onChange={(event) => { setAnswer(event.target.value); setFeedback(null); }} className="h-20 w-full rounded-2xl border-4 border-[#c59b54] bg-white text-center font-display text-4xl font-black text-[#31573a] outline-none focus:border-[#31573a]" placeholder="?" />
                <button type="submit" disabled={!answer} className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#aa2f34] px-5 font-display text-lg font-black text-white shadow-[0_5px_0_#6d2023] disabled:opacity-50">Check my answer<Check className="h-5 w-5" /></button>
              </form>
              <AnimatePresence mode="wait">
                {feedback === "correct" && <motion.div key="correct" initial={{ opacity: 0, scale: 0.7, rotate: -3 }} animate={{ opacity: 1, scale: [0.7, 1.08, 1], rotate: 0 }} transition={springy} className="mt-5 rounded-2xl bg-[#dcebd1] p-4 font-display text-xl font-black text-[#2e6234]"><Check className="mr-2 inline h-6 w-6" />Brilliant! {selected} × {factor} = {selected * factor}</motion.div>}
                {feedback === "retry" && <motion.div key="retry" initial={{ opacity: 0 }} animate={{ opacity: 1, x: [0, -8, 8, -5, 5, 0] }} transition={{ duration: 0.45 }} className="mt-5 rounded-2xl bg-[#f4dccb] p-4 font-display text-lg font-black text-[#8b322d]"><RotateCcw className="mr-2 inline h-5 w-5" />Almost. Count by {selected}s and try again.</motion.div>}
              </AnimatePresence>
              <p className="mt-4 text-sm font-bold text-[#776040]">Score: {score} correct from {questions} tries</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
