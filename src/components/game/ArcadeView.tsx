"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Coins, Gamepad2, Loader2, Lock, RotateCcw, Sparkles, Trophy, Volume2, VolumeX } from "lucide-react";
import { ARCADE_GAMES, pizzaSlicesEarned, type ArcadeGameKey, type PublicArcadeQuestion } from "@/lib/arcade";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { SpeakButton } from "@/components/game/SpeakButton";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import { useTTS } from "@/hooks/use-tts";
import { arcadeFeedbackSpeech, arcadeQuestionSpeech, arcadeRoundSpeech } from "@/lib/arcade-voice";
import { profileFetch, useGameStore } from "@/store/useGameStore";

interface ArcadeRunState {
  attemptId: string;
  gameKey: ArcadeGameKey;
  nextIndex: number;
  correctCount: number;
  total: number;
  status: "active" | "completed";
  question: PublicArcadeQuestion | null;
  coinsEarned: number;
  dailyBonus: number;
  score?: number;
}

interface ArcadeOverview {
  coins: number;
  selectedCompanion: string;
  companions: Array<{ id: string; name: string; emoji: string; unlockCoins: number; description: string; unlocked: boolean }>;
  dailyBonusAvailable: boolean;
  totalWins: number;
  byGame: Record<ArcadeGameKey, { plays: number; bestScore: number; coins: number }>;
  activeRuns: ArcadeRunState[];
}

interface FeedbackState {
  correct: boolean;
  explanation: string;
  nextRun: ArcadeRunState;
  newCoinBalance?: number;
}

export function ArcadeView() {
  const setView = useGameStore((state) => state.setView);
  const setReward = useGameStore((state) => state.setReward);
  const studentName = useGameStore((state) => state.studentName);
  const level = useGameStore((state) => state.level);
  const soundOn = useGameStore((state) => state.soundOn);
  const setSoundOn = useGameStore((state) => state.setSoundOn);
  const siteSettings = useGameStore((state) => state.siteSettings);
  const [overview, setOverview] = useState<ArcadeOverview | null>(null);
  const [run, setRun] = useState<ArcadeRunState | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [busy, setBusy] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const feedbackActionRef = useRef<HTMLButtonElement>(null);
  const feedbackReturnFocusRef = useRef<HTMLButtonElement | null>(null);
  const { speak, speakImmediately, stop } = useTTS();
  const { playCorrect, playWrong } = useSoundEffects(soundOn && siteSettings?.soundEffectsEnabled !== false);

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setError(null);
    try {
      const response = await profileFetch("/api/arcade");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load the arcade");
      setOverview(data as ArcadeOverview);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load the arcade");
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadOverview(), 0);
    return () => window.clearTimeout(timer);
  }, [loadOverview]);

  const activeGame = useMemo(() => ARCADE_GAMES.find((game) => game.key === run?.gameKey), [run?.gameKey]);
  const companion = overview?.companions.find((item) => item.id === overview.selectedCompanion) ?? overview?.companions[0];
  const questionSpeech = useMemo(() => run?.question ? arcadeQuestionSpeech(run.question) : "", [run?.question]);

  useEffect(() => {
    if (!soundOn || !run?.question || feedback) return;
    const timer = window.setTimeout(() => {
      if (navigator.onLine) speak(questionSpeech, { speed: level === "preschool" ? 0.82 : 0.92 });
      else speakImmediately(questionSpeech, { speed: level === "preschool" ? 0.82 : 0.92 });
    }, 450);
    return () => {
      window.clearTimeout(timer);
      stop();
    };
  }, [feedback, level, questionSpeech, run?.question, soundOn, speak, speakImmediately, stop]);

  useEffect(() => {
    if (!feedback || !soundOn || !run) return;
    if (feedback.correct) playCorrect();
    else playWrong();
    speakImmediately(arcadeFeedbackSpeech({
      correct: feedback.correct,
      explanation: feedback.explanation,
      youngerLearner: level === "preschool" || level === "grade1",
      questionIndex: run.nextIndex,
      correctCount: run.correctCount,
      studentName,
    }), { speed: level === "preschool" ? 0.84 : 0.94 });
  }, [feedback, level, playCorrect, playWrong, run, soundOn, speakImmediately, studentName]);

  useEffect(() => {
    if (!soundOn || run?.status !== "completed") return;
    const timer = window.setTimeout(() => speakImmediately(
      arcadeRoundSpeech(studentName, run.correctCount, run.total, run.coinsEarned),
      { speed: level === "preschool" ? 0.86 : 0.96 },
    ), 250);
    return () => window.clearTimeout(timer);
  }, [level, run?.correctCount, run?.coinsEarned, run?.status, run?.total, soundOn, speakImmediately, studentName]);

  const startGame = async (gameKey: ArcadeGameKey, restart = false) => {
    setBusy(true);
    setError(null);
    try {
      if (restart) {
        await profileFetch("/api/arcade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "abandon", gameKey }),
        });
      }
      const response = await profileFetch("/api/arcade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", gameKey }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not start this game");
      setRun(data.run as ArcadeRunState);
      setFeedback(null);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Could not start this game");
    }
    setBusy(false);
  };

  const answer = async (choiceIndex: number, trigger: HTMLButtonElement) => {
    if (!run || !run.question || busy || feedback) return;
    feedbackReturnFocusRef.current = trigger;
    setBusy(true);
    setError(null);
    try {
      const response = await profileFetch("/api/arcade/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: run.attemptId, questionIndex: run.nextIndex, choiceIndex }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Your answer was not saved");
      if (data.reward) setReward(data.reward);
      if (data.duplicate && data.run) {
        if (typeof data.coins === "number") {
          setOverview((current) => current ? { ...current, coins: data.coins } : current);
        }
        setRun(data.run as ArcadeRunState);
        setFeedback(null);
        if (data.run.status === "completed") await loadOverview();
        return;
      }
      setFeedback({
        correct: Boolean(data.correct),
        explanation: data.explanation ?? "Your place is saved.",
        nextRun: data.run as ArcadeRunState,
        newCoinBalance: typeof data.coins === "number" ? data.coins : undefined,
      });
    } catch (answerError) {
      setError(answerError instanceof Error ? answerError.message : "Your answer was not saved");
    } finally {
      setBusy(false);
    }
  };

  const continueAfterFeedback = async () => {
    if (!feedback) return;
    const nextRun = feedback.nextRun;
    if (typeof feedback.newCoinBalance === "number") {
      setOverview((current) => current ? { ...current, coins: feedback.newCoinBalance! } : current);
    }
    setRun(nextRun);
    setFeedback(null);
    if (nextRun.status === "completed") await loadOverview();
  };

  const selectCompanion = async (companionId: string) => {
    setBusy(true);
    const response = await profileFetch("/api/arcade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "select-companion", companionId }),
    });
    if (response.ok) setOverview((current) => current ? { ...current, selectedCompanion: companionId } : current);
    setBusy(false);
  };

  if (!overview) {
    if (overviewLoading) {
      return <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 bg-[#120b2f] text-white"><Loader2 className="h-10 w-10 animate-spin text-amber-300" /><p className="font-display font-bold">Opening the arcade…</p></div>;
    }
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-[#120b2f] px-4 text-center text-white">
        <div className="text-6xl" aria-hidden="true">🛠️</div>
        <h1 className="font-display text-3xl font-black">The arcade could not open</h1>
        <p className="max-w-md font-bold text-violet-200" role="alert">{error ?? "Please check your connection and try again."}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={loadOverview} className="min-h-12 rounded-2xl bg-amber-300 px-6 font-display font-black text-[#321b5e]">Try again</button>
          <button onClick={() => setView({ name: "home" })} className="min-h-12 rounded-2xl border-2 border-white/30 bg-white/10 px-6 font-display font-black">Back home</button>
        </div>
      </div>
    );
  }

  if (run?.status === "completed") {
    const totalCoins = feedback?.newCoinBalance ?? overview.coins;
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top,#5632a8_0%,#1b1245_48%,#0d0922_100%)] px-4 py-8 text-white">
        <div className="mx-auto max-w-xl rounded-[36px] border-4 border-amber-300 bg-white/10 p-7 text-center shadow-2xl backdrop-blur">
          <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} className="text-8xl">🏆</motion.div>
          <h1 data-arcade-focus-target tabIndex={-1} className="mt-3 font-display text-4xl font-black outline-none">Round complete!</h1>
          <p className="mt-2 text-lg font-bold text-violet-100">{studentName}, you got {run.correctCount} of {run.total} correct.</p>
          <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-3">
            <ResultChip label="Score" value={`${run.score ?? Math.round((run.correctCount / run.total) * 100)}%`} emoji="🎯" />
            <ResultChip label="Coins earned" value={`+${run.coinsEarned}`} emoji="🪙" />
          </div>
          {run.dailyBonus > 0 && <p className="mt-4 rounded-2xl bg-amber-300 px-4 py-3 font-display font-black text-amber-950">✨ Daily play bonus: +{run.dailyBonus} coins</p>}
          <p className="mt-4 text-sm font-bold text-violet-200">Coin balance: {totalCoins}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button onClick={() => startGame(run.gameKey, true)} disabled={busy} className="min-h-14 rounded-2xl bg-amber-300 px-5 font-display text-lg font-black text-[#301c62] shadow-[0_5px_0_#b87810] active:translate-y-1 active:shadow-none">Play again</button>
            <button onClick={() => { setRun(null); loadOverview(); }} className="min-h-14 rounded-2xl border-2 border-white/40 bg-white/10 px-5 font-display text-lg font-black">Choose a game</button>
          </div>
        </div>
      </div>
    );
  }

  if (run && activeGame) {
    const progress = Math.round((run.nextIndex / Math.max(1, run.total)) * 100);
    return (
      <div className={`relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br ${activeGame.color} px-3 py-5 text-white sm:px-6`}>
        <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="relative mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => setRun(null)} className="flex min-h-11 items-center gap-2 rounded-full bg-black/25 px-4 font-display font-black backdrop-blur"><ArrowLeft className="h-5 w-5" /> Arcade</button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { if (soundOn) stop(); setSoundOn(!soundOn); }}
                className="flex min-h-11 items-center gap-2 rounded-full bg-black/25 px-3 font-display text-sm font-black backdrop-blur"
                aria-label={soundOn ? "Turn Arcade voice off" : "Turn Arcade voice on"}
                aria-pressed={soundOn}
              >
                {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                <span className="hidden sm:inline">Voice {soundOn ? "on" : "off"}</span>
              </button>
              <div className="rounded-full bg-black/25 px-4 py-2 font-display font-black backdrop-blur">{companion?.emoji} {companion?.name}</div>
            </div>
          </div>
          <div className="mt-4 rounded-[30px] border-4 border-white/50 bg-[#171238]/88 p-5 shadow-2xl backdrop-blur sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-sm font-black uppercase tracking-[0.16em] text-amber-200">{activeGame.title}</p><p className="font-display text-2xl font-black">Question {run.nextIndex + 1} of {run.total}</p></div>
              <button onClick={() => startGame(run.gameKey, true)} disabled={busy} title="Restart round" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10"><RotateCcw className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 h-4 overflow-hidden rounded-full border-2 border-white/30 bg-black/25"><motion.div animate={{ width: `${progress}%` }} className="h-full rounded-full bg-amber-300" /></div>

            <GameStage gameKey={run.gameKey} completed={run.nextIndex} total={run.total} companionEmoji={companion?.emoji ?? "🦊"} />

            <AnimatePresence mode="wait">
              {run.question && <motion.div key={run.question.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="mt-5">
                {run.question.visual && <div className="mb-4 text-center text-4xl tracking-[0.25em]" aria-hidden="true">{run.question.visual}</div>}
                <h1 data-arcade-focus-target tabIndex={-1} className="text-center font-display text-2xl font-black leading-tight outline-none sm:text-4xl">{run.question.prompt}</h1>
                {run.question.helper && <p className="mt-2 text-center text-sm font-bold text-violet-200">{run.question.helper}</p>}
                <div className="mt-4 flex justify-center">
                  {soundOn ? (
                    <SpeakButton
                      text={questionSpeech}
                      label="Hear question"
                      size="lg"
                      variant="solid"
                      speed={level === "preschool" ? 0.82 : 0.92}
                      className="border-2 border-white/30 bg-emerald-600 px-5 shadow-lg hover:bg-emerald-500"
                    />
                  ) : (
                    <button type="button" onClick={() => setSoundOn(true)} className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-5 font-display font-black">
                      <VolumeX className="h-5 w-5" /> Turn voice on
                    </button>
                  )}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {run.question.choices.map((choice, index) => (
                    <motion.button key={`${run.question?.id}-${choice}`} whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }} onClick={(event) => answer(index, event.currentTarget)} disabled={busy || Boolean(feedback)} className="min-h-20 rounded-2xl border-4 border-white/30 bg-white px-4 font-display text-3xl font-black text-[#30205d] shadow-[0_6px_0_rgba(30,18,72,0.55)] disabled:opacity-60">{choice}</motion.button>
                  ))}
                </div>
              </motion.div>}
            </AnimatePresence>
            {error && <p className="mt-4 rounded-xl bg-rose-950/70 p-3 text-center font-bold" role="alert">{error}</p>}
            {busy && <p className="mt-4 flex items-center justify-center gap-2 font-bold"><Loader2 className="h-5 w-5 animate-spin" /> Saving your place…</p>}
          </div>
        </div>

        <Dialog open={Boolean(feedback)}>
          {feedback && (
            <DialogContent
              showCloseButton={false}
              className={`max-w-md rounded-[30px] border-4 p-6 text-center text-white shadow-2xl ${feedback.correct ? "border-emerald-300 bg-emerald-950" : "border-amber-300 bg-[#3f235f]"}`}
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                feedbackActionRef.current?.focus();
              }}
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                const returnTarget = feedbackReturnFocusRef.current;
                if (returnTarget?.isConnected) returnTarget.focus();
                else document.querySelector<HTMLElement>("[data-arcade-focus-target]")?.focus();
                feedbackReturnFocusRef.current = null;
              }}
              onEscapeKeyDown={(event) => event.preventDefault()}
              onPointerDownOutside={(event) => event.preventDefault()}
            >
              <div className="text-6xl" aria-hidden="true">{feedback.correct ? "🌟" : "💪"}</div>
              <DialogTitle className="mt-2 font-display text-3xl font-black">{feedback.correct ? "You got it!" : "Good try!"}</DialogTitle>
              <DialogDescription className="mt-2 font-bold text-white/85">{feedback.explanation}</DialogDescription>
              <button ref={feedbackActionRef} onClick={continueAfterFeedback} className="mt-2 min-h-14 w-full rounded-2xl bg-amber-300 font-display text-lg font-black text-[#321b5e] shadow-[0_5px_0_#a56713] active:translate-y-1 active:shadow-none">
                {feedback.nextRun.status === "completed" ? "See my coins" : "Next challenge"}
              </button>
            </DialogContent>
          )}
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top,#5b35a5_0%,#20144c_45%,#0d0922_100%)] px-4 pb-16 pt-5 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => setView({ name: "home" })} className="flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-4 font-display font-black"><ArrowLeft className="h-5 w-5" /> Home</button>
          <div className="flex gap-2"><StatPill icon={<Coins className="h-5 w-5" />} value={overview.coins} label="coins" /><StatPill icon={<Trophy className="h-5 w-5" />} value={overview.totalWins} label="rounds" /></div>
        </div>
        <div className="mt-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] border-4 border-amber-300 bg-fuchsia-500 text-4xl shadow-[0_8px_0_#6e2b89]"><Gamepad2 className="h-11 w-11" /></div>
          <h1 className="mt-4 font-display text-4xl font-black sm:text-6xl">Math Adventure Arcade</h1>
          <p className="mx-auto mt-2 max-w-2xl text-lg font-bold text-violet-200">Six games, fresh challenges for {studentName}&apos;s grade, and a saved place after every answer.</p>
          {overview.dailyBonusAvailable && <div className="mx-auto mt-4 w-fit rounded-full border-2 border-amber-300 bg-amber-300/15 px-5 py-2 font-display font-black text-amber-200"><Sparkles className="mr-2 inline h-5 w-5" /> First finished round today earns 10 bonus coins</div>}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {ARCADE_GAMES.map((game) => {
            const active = overview.activeRuns.find((item) => item.gameKey === game.key);
            const stats = overview.byGame[game.key];
            return (
              <motion.button key={game.key} whileHover={{ y: -7, rotate: -0.4 }} whileTap={{ scale: 0.98 }} onClick={() => startGame(game.key)} disabled={busy} className={`relative overflow-hidden rounded-[30px] border-4 border-white/30 bg-gradient-to-br ${game.color} p-5 text-left shadow-[0_12px_0_rgba(4,2,18,0.5)]`}>
                <div className="absolute -right-5 -top-7 text-9xl opacity-25">{game.emoji}</div>
                <div className="relative text-6xl">{game.emoji}</div>
                <h2 className="relative mt-4 font-display text-3xl font-black">{game.title}</h2>
                <p className="relative mt-1 min-h-12 font-bold text-white/90">{game.description}</p>
                <div className="relative mt-4 flex items-center justify-between rounded-2xl bg-black/20 p-3 text-sm font-black">
                  <span>{stats?.plays ?? 0} plays · best {stats?.bestScore ?? 0}%</span>
                  <span className="rounded-full bg-white px-3 py-1 text-[#392264]">{active ? `Resume ${active.nextIndex + 1}/${active.total}` : "Play"}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        <section className="mt-10 rounded-[30px] border-2 border-white/15 bg-white/8 p-5 backdrop-blur">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-2xl font-black">Arcade companions</h2><p className="text-sm font-bold text-violet-200">Earn coins to unlock a new buddy, then tap to choose one.</p></div><span className="text-4xl">{companion?.emoji}</span></div>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {overview.companions.map((item) => (
              <button key={item.id} onClick={() => item.unlocked && selectCompanion(item.id)} disabled={busy || !item.unlocked} className={`relative rounded-2xl border-2 p-4 text-left transition ${overview.selectedCompanion === item.id ? "border-amber-300 bg-amber-300/15" : "border-white/15 bg-black/15"} disabled:opacity-65`}>
                <div className="text-5xl grayscale-0">{item.unlocked ? item.emoji : "🔒"}</div>
                <p className="mt-2 font-display text-lg font-black">{item.name}</p>
                <p className="text-xs font-bold text-violet-200">{item.unlocked ? item.description : `${item.unlockCoins - overview.coins} more coins`}</p>
                {overview.selectedCompanion === item.id && <span className="absolute right-3 top-3 rounded-full bg-amber-300 p-1 text-[#392264]"><Check className="h-4 w-4" /></span>}
                {!item.unlocked && <Lock className="absolute right-3 top-3 h-4 w-4" />}
              </button>
            ))}
          </div>
        </section>
        {error && <p className="mt-5 rounded-2xl bg-rose-950/70 p-4 text-center font-bold" role="alert">{error}</p>}
      </div>
    </div>
  );
}

function GameStage({ gameKey, completed, total, companionEmoji }: { gameKey: ArcadeGameKey; completed: number; total: number; companionEmoji: string }) {
  if (gameKey === "star-sprint") {
    return <div className="mt-5 rounded-2xl bg-white/10 p-4"><div className="flex justify-between text-3xl"><motion.span animate={{ x: `${Math.min(100, (completed / total) * 100)}%` }} className="inline-block">{companionEmoji}</motion.span><span>🏁</span></div><div className="mt-1 border-t-4 border-dashed border-amber-200/60" /></div>;
  }
  if (gameKey === "treasure-match") {
    return <div className="mt-5 flex justify-center gap-2 text-3xl">{Array.from({ length: total }, (_, index) => <motion.span key={index} animate={index < completed ? { scale: [1, 1.2, 1] } : {}}>{index < completed ? "💎" : "🧰"}</motion.span>)}</div>;
  }
  if (gameKey === "rocket-builder") {
    return <div className="mt-5 flex min-h-28 items-end justify-center text-6xl"><motion.span animate={{ y: completed === total - 1 ? [0, -4, 0] : 0 }}>{completed < 2 ? "⚙️" : completed < 5 ? "🚀" : "🚀🔥"}</motion.span><span className="ml-3 text-3xl">{companionEmoji}</span></div>;
  }
  if (gameKey === "bubble-pop") {
    return <div className="mt-5 flex min-h-28 flex-wrap items-center justify-center gap-3 text-4xl">{Array.from({ length: Math.min(total, 8) }, (_, index) => <motion.span key={index} animate={index < completed ? { scale: [1, 1.35, 0], opacity: [1, 1, 0.25] } : { y: [0, -5, 0] }} transition={index < completed ? { duration: 0.45 } : { duration: 1.8, repeat: Infinity, delay: index * 0.12 }}>{index < completed ? "✨" : "🫧"}</motion.span>)}</div>;
  }
  if (gameKey === "shape-safari") {
    const trail = ["🔺", "🟨", "⬡", "▭"];
    return <div className="mt-5 rounded-2xl bg-emerald-950/25 p-4"><div className="flex items-center justify-between text-4xl"><span>{companionEmoji}</span>{trail.map((shape, index) => <motion.span key={shape} animate={completed > index * (total / trail.length) ? { scale: [1, 1.25, 1] } : { opacity: 0.45 }}>{shape}</motion.span>)}<span>🦁</span></div><div className="mt-2 border-t-4 border-dotted border-yellow-200/60" /></div>;
  }
  const slices = pizzaSlicesEarned(completed, total);
  return <div className="mt-5 flex min-h-28 items-center justify-center gap-4"><motion.span animate={{ rotate: completed ? [0, 4, -4, 0] : 0 }} className="text-7xl" aria-label={`${slices} pizza slices earned`}>🍕</motion.span><div className="grid grid-cols-4 gap-1 text-2xl">{Array.from({ length: 8 }, (_, index) => <span key={index} className={index < slices ? "opacity-100" : "opacity-25"}>◢</span>)}</div><span className="text-3xl">{companionEmoji}</span></div>;
}

function StatPill({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2"><span className="text-amber-300">{icon}</span><span className="font-display text-lg font-black">{value}</span><span className="text-xs font-bold text-violet-200">{label}</span></div>;
}

function ResultChip({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return <div className="rounded-2xl bg-white/10 p-4"><div className="text-3xl">{emoji}</div><p className="mt-1 font-display text-2xl font-black">{value}</p><p className="text-xs font-bold text-violet-200">{label}</p></div>;
}
