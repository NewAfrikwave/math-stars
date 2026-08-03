"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  LockKeyhole,
  Plus,
  Sparkles,
  Star,
  Volume2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Level } from "@/lib/types";
import { useGameStore, type ProfileSummary } from "@/store/useGameStore";
import { cn } from "@/lib/utils";

const levelOptions: Array<{ value: Level; label: string; ages: string }> = [
  { value: "preschool", label: "Preschool", ages: "Ages 3–5" },
  { value: "grade1", label: "1st Grade", ages: "Ages 6–7" },
  { value: "grade2", label: "2nd Grade", ages: "Ages 7–8" },
  { value: "grade3", label: "3rd Grade", ages: "Ages 8–9" },
  { value: "grade4", label: "4th Grade", ages: "Ages 9–10" },
];

function levelLabel(level: Level) {
  return levelOptions.find((option) => option.value === level)?.label ?? "3rd Grade";
}

function formatLastPlayed(value?: string | null) {
  if (!value) return null;
  const played = new Date(value);
  if (Number.isNaN(played.getTime())) return null;
  const days = Math.floor((Date.now() - played.getTime()) / 86_400_000);
  if (days <= 0) return "Played today";
  if (days === 1) return "Played yesterday";
  if (days < 7) return `Played ${days} days ago`;
  return `Played ${played.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

export function LandingView() {
  const profiles = useGameStore((state) => state.profiles);
  const setCurrentProfile = useGameStore((state) => state.setCurrentProfile);
  const setView = useGameStore((state) => state.setView);
  const createProfile = useGameStore((state) => state.createProfile);

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [level, setLevel] = useState<Level>("grade3");
  const [avatar, setAvatar] = useState<"fox" | "owl">("fox");
  const [creating, setCreating] = useState(false);
  const orderedProfiles = useMemo(
    () => [...profiles].sort((a, b) => {
      const bTime = b.lastPlayedAt ? new Date(b.lastPlayedAt).getTime() : 0;
      const aTime = a.lastPlayedAt ? new Date(a.lastPlayedAt).getTime() : 0;
      return bTime - aTime;
    }),
    [profiles]
  );

  const pick = (id: string) => setCurrentProfile(id);

  const openParentArea = () => {
    const profileId = orderedProfiles[0]?.id;
    if (profileId) setCurrentProfile(profileId);
    setView({ name: "parent" });
  };

  const readPrompt = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const names = profiles.map((profile) => profile.name).join(" or ");
    window.speechSynthesis.speak(
      new SpeechSynthesisUtterance(
        names ? `Choose your adventure. Who is learning today? ${names}.` : "Choose your adventure. Add a learner to begin."
      )
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    const profile = await createProfile(name.trim(), level, avatar);
    setCreating(false);
    if (!profile) return;
    setName("");
    setAvatar("fox");
    setAdding(false);
    setCurrentProfile(profile.id);
  };

  return (
    <main id="main-content" className="relative min-h-screen overflow-x-hidden bg-[#ead4a6] text-[#2d351f]">
      <Image
        src="/character-doorways-bg.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="fixed inset-0 object-cover object-center"
      />
      <div className="fixed inset-0 bg-[#3c2815]/5" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-4 pb-6 pt-4 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2.5 rounded-2xl bg-[#fff8e8]/90 px-3 py-2 shadow-sm backdrop-blur-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d94b4b] text-white">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-display text-xl font-bold text-[#b7253d] sm:text-2xl">Math Stars</span>
          </div>
          <button
            type="button"
            onClick={openParentArea}
            disabled={profiles.length === 0}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#6f5a34]/25 bg-[#fff8e8]/90 px-4 text-sm font-bold text-[#344026] shadow-sm backdrop-blur-sm transition hover:bg-white focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
            Parent area
          </button>
        </header>

        <section className="mx-auto mt-3 w-full max-w-5xl text-center sm:mt-1">
          <h1 className="font-display text-4xl font-bold leading-none text-[#2c4a2f] drop-shadow-[0_1px_0_rgba(255,255,255,0.85)] sm:text-5xl lg:text-6xl">
            Choose your adventure
          </h1>
          <p className="mt-2 font-display text-lg font-semibold text-[#5f4728] sm:text-2xl">Who&apos;s learning today?</p>
        </section>

        {orderedProfiles.length > 0 ? (
          <section aria-label="Learner profiles" className="mx-auto mt-4 grid w-full max-w-[940px] flex-1 content-center gap-4 pb-3 sm:grid-cols-2 sm:gap-10 lg:mt-2 lg:gap-20">
            <AnimatePresence initial={false}>
              {orderedProfiles.map((profile, index) => (
                <ProfileDoor
                  key={profile.id}
                  profile={profile}
                  index={index}
                  isLastPlayed={index === 0}
                  onPick={() => pick(profile.id)}
                />
              ))}
            </AnimatePresence>
          </section>
        ) : (
          <section className="mx-auto my-auto w-full max-w-md rounded-[2rem] border border-white/60 bg-[#fff8e8]/95 p-8 text-center shadow-2xl backdrop-blur">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e7b94b]/20 text-[#8b641b]">
              <Star className="h-8 w-8" aria-hidden="true" />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold">Your first adventure starts here</h2>
            <p className="mt-2 text-sm leading-6 text-[#6b5a43]">Create a learner profile so Math Stars can save the right grade and progress.</p>
            <Button onClick={() => setAdding(true)} className="mt-5 gap-2 bg-[#a92f43] hover:bg-[#8f2638]">
              <Plus className="h-4 w-4" /> Add a learner
            </Button>
          </section>
        )}

        {profiles.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 pb-1">
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-[#334b2b]/20 bg-[#fff8e8]/95 px-5 font-display text-base font-bold text-[#344026] shadow-md transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none"
            >
              <Plus className="h-5 w-5" aria-hidden="true" /> Add learner
            </button>
            <button
              type="button"
              onClick={readPrompt}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-[#334b2b]/20 bg-[#fff8e8]/95 px-5 text-sm font-bold text-[#344026] shadow-md transition hover:bg-white focus-visible:outline-none"
            >
              <Volume2 className="h-4 w-4" aria-hidden="true" /> Read aloud
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#26190e]/65 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => { if (event.target === event.currentTarget) setAdding(false); }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="new-learner-title"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="relative w-full max-w-xl rounded-[2rem] border border-[#ead6aa] bg-[#fffaf0] p-6 shadow-2xl sm:p-8"
            >
              <button type="button" onClick={() => setAdding(false)} className="absolute right-5 top-5 rounded-full p-2 text-stone-500 hover:bg-stone-100" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b52e46]">New explorer</p>
              <h2 id="new-learner-title" className="mt-2 font-display text-3xl font-bold text-[#2c4a2f]">Add a learner</h2>
              <p className="mt-1 text-sm text-stone-600">Choose the grade that fits best. You can change it later.</p>
              <label htmlFor="learner-name" className="mt-6 block text-sm font-bold">Learner name</label>
              <Input
                id="learner-name"
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") handleCreate(); }}
                placeholder="What should we call them?"
                maxLength={30}
                className="mt-2 h-12 bg-white"
              />
              <fieldset className="mt-5">
                <legend className="text-sm font-bold">Choose a character</legend>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {([
                    { value: "fox" as const, label: "Fox explorer", src: "/learner-fox.webp" },
                    { value: "owl" as const, label: "Owl explorer", src: "/learner-owl.webp" },
                  ]).map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => setAvatar(option.value)}
                      aria-pressed={avatar === option.value}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition",
                        avatar === option.value ? "border-[#a92f43] bg-rose-50 shadow-sm" : "border-stone-200 bg-white hover:border-stone-300"
                      )}
                    >
                      <Image src={option.src} alt="" width={72} height={72} className="h-14 w-14 rounded-full object-cover" />
                      <span className="font-display text-sm font-bold">{option.label}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="mt-5">
                <legend className="text-sm font-bold">Grade level</legend>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {levelOptions.map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => setLevel(option.value)}
                      aria-pressed={level === option.value}
                      className={cn(
                        "rounded-xl border-2 p-3 text-left transition",
                        level === option.value ? "border-[#a92f43] bg-rose-50" : "border-stone-200 bg-white hover:border-stone-300"
                      )}
                    >
                      <span className="block font-display text-sm font-bold">{option.label}</span>
                      <span className="text-xs text-stone-500">{option.ages}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => setAdding(false)} className="h-11 flex-1">Cancel</Button>
                <Button onClick={handleCreate} disabled={!name.trim() || creating} className="h-11 flex-1 bg-[#a92f43] hover:bg-[#8f2638]">
                  {creating ? "Creating…" : "Create profile"}
                </Button>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function ProfileDoor({ profile, index, isLastPlayed, onPick }: { profile: ProfileSummary; index: number; isLastPlayed: boolean; onPick: () => void }) {
  const isForest = profile.avatar !== "owl";
  const playedLabel = formatLastPlayed(profile.lastPlayedAt);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: index * 0.06 }}
      className={cn(
        "relative mx-auto flex min-h-[430px] w-full max-w-[390px] flex-col items-center justify-center overflow-hidden rounded-t-[9rem] rounded-b-[2rem] border-2 p-5 text-center shadow-[0_20px_55px_rgba(34,23,13,0.28)] backdrop-blur-[2px] sm:min-h-[500px]",
        isForest ? "border-[#d8b85b] bg-[#fff3cd]/86 text-[#31432a]" : "border-[#a69acf] bg-[#eee9ff]/88 text-[#342c59]"
      )}
    >
      {isLastPlayed && (
        <span className={cn("absolute top-5 rounded-full px-3 py-1 text-xs font-bold shadow-sm", isForest ? "bg-[#4f6a2f] text-white" : "bg-[#5b477f] text-white")}>
          Last played
        </span>
      )}
      <Image
        src={isForest ? "/learner-fox.webp" : "/learner-owl.webp"}
        alt=""
        width={520}
        height={520}
        className={cn("mt-8 h-28 w-28 rounded-full border-4 object-cover shadow-lg sm:h-36 sm:w-36", isForest ? "border-[#d8b85b]" : "border-[#8c78bb]")}
      />
      <h2 className="mt-4 max-w-full truncate font-display text-3xl font-bold sm:text-4xl">{profile.name}</h2>
      <p className="mt-1 font-display text-lg font-semibold">{levelLabel(profile.level)}</p>
      <p className="mt-2 flex items-center justify-center gap-2 text-sm font-semibold">
        <Star className="h-4 w-4 fill-[#e9a82c] text-[#b77b13]" aria-hidden="true" />
        {profile.totalStars} {profile.totalStars === 1 ? "star" : "stars"}
        <span aria-hidden="true">·</span>
        {profile.totalStars === 0 ? "New journey" : `${profile.streak} day streak`}
      </p>
      {playedLabel && <p className="mt-2 text-xs font-semibold opacity-75">{playedLabel}</p>}
      <button
        type="button"
        onClick={onPick}
        className={cn(
          "mt-5 inline-flex h-12 min-w-48 items-center justify-center gap-2 rounded-full px-7 font-display text-lg font-bold text-white shadow-lg transition hover:-translate-y-0.5 focus-visible:outline-none",
          isForest ? "bg-[#526c2e] hover:bg-[#405623]" : "bg-[#66498f] hover:bg-[#513a73]"
        )}
        aria-label={`${isLastPlayed ? "Continue as" : "Start as"} ${profile.name}`}
      >
        {isLastPlayed ? "Continue" : "Start"}
        <ArrowRight className="h-5 w-5" aria-hidden="true" />
      </button>
    </motion.article>
  );
}
