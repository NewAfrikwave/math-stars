"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  ChevronRight,
  Flame,
  Gift,
  Heart,
  Home,
  LockKeyhole,
  LogOut,
  Map,
  Medal,
  Menu,
  MoreHorizontal,
  Printer,
  RefreshCcw,
  Settings,
  ShieldQuestion,
  Sparkles,
  Star,
  Trophy,
  UserRoundCog,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { CURRICULUM } from "@/lib/curriculum";
import { PRESCHOOL_CURRICULUM } from "@/lib/preschool";
import { GRADE1_CURRICULUM } from "@/lib/grade1";
import { GRADE2_CURRICULUM } from "@/lib/grade2";
import { GRADE4_CURRICULUM } from "@/lib/grade4";
import { useGameStore, useOverallProgress } from "@/store/useGameStore";
import { AnimatedNumber, FloatingSparkles, MascotMotion, ProgressTrail, springy, staggerContainer, staggerItem } from "@/components/game/MotionKit";
import { chooseNextMission } from "@/lib/next-mission";

const journeyIcons = [Calculator, BookOpen, Sparkles, Map, Medal];

function gradeLabel(level: ReturnType<typeof useGameStore.getState>["level"]) {
  if (level === "preschool") return "Preschool";
  if (level === "grade1") return "1st Grade";
  if (level === "grade2") return "2nd Grade";
  if (level === "grade4") return "4th Grade";
  return "3rd Grade";
}

export function HomeView() {
  const setView = useGameStore((s) => s.setView);
  const level = useGameStore((s) => s.level);
  const studentName = useGameStore((s) => s.studentName);
  const totalStars = useGameStore((s) => s.totalStars);
  const streak = useGameStore((s) => s.streak);
  const reward = useGameStore((s) => s.reward);
  const activeCheckpoint = useGameStore((s) => s.activeCheckpoint);
  const progress = useGameStore((s) => s.progress);
  const profiles = useGameStore((s) => s.profiles);
  const currentProfileId = useGameStore((s) => s.currentProfileId);
  const soundOn = useGameStore((s) => s.soundOn);
  const setSoundOn = useGameStore((s) => s.setSoundOn);
  const setCurrentProfile = useGameStore((s) => s.setCurrentProfile);
  const overall = useOverallProgress();
  const [moreOpen, setMoreOpen] = useState(false);

  const curriculum =
    level === "preschool" ? PRESCHOOL_CURRICULUM
    : level === "grade1" ? GRADE1_CURRICULUM
    : level === "grade2" ? GRADE2_CURRICULUM
    : level === "grade4" ? GRADE4_CURRICULUM
    : CURRICULUM;

  const nextMission = chooseNextMission(curriculum, progress, activeCheckpoint?.lessonId);

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";
  const activeProfile = profiles.find((profile) => profile.id === currentProfileId);
  const activeAvatar = activeProfile?.avatar === "owl" ? "owl" : "fox";
  const missionTitle = nextMission.lesson.title;
  const missionDescription = nextMission.lesson.subtitle;
  const canResumeExactQuestion = activeCheckpoint?.lessonId === nextMission.lesson.id;
  const missionProgressLabel = canResumeExactQuestion
    ? activeCheckpoint.nextIndex >= activeCheckpoint.total
      ? "Your answers are safely saved. Your results are ready."
      : `Question ${activeCheckpoint.nextIndex + 1} of ${activeCheckpoint.total} is ready`
    : missionDescription;

  const scrollToJourney = () => document.getElementById("journey-board")?.scrollIntoView({ behavior: "smooth", block: "center" });
  const returnToWelcomePage = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <div className="explorer-home relative min-h-[100svh] overflow-hidden bg-[#3d2415] text-[#2d2318]">
      <Image src="/explorer-study-bg.webp" alt="A cozy explorer study filled with books and a map" fill priority sizes="100vw" className="object-cover object-center" />
      <div className="absolute inset-0 bg-[#2b1808]/10" />
      <FloatingSparkles className="z-[1] opacity-70" tone="cream" />

      <header className="relative z-30 border-b border-[#ad9455]/50 bg-[#142d1d]/95 text-[#fff7d5] shadow-lg">
        <div className="mx-auto flex h-[86px] w-full max-w-[1440px] items-center justify-between px-4 sm:px-8">
          <button onClick={() => setView({ name: "home" })} className="group flex items-center gap-3 rounded-2xl text-left focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#f2c457]">
            <span className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-[#d5af4d] bg-[#f1d792] shadow-md transition-transform group-hover:scale-105 sm:h-16 sm:w-16">
              <Image
                src={`/learner-${activeAvatar}.webp`}
                alt={`${studentName}'s ${activeAvatar} avatar`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </span>
            <span>
              <span className="block font-display text-2xl font-black leading-none sm:text-3xl">{studentName}</span>
              <span className="mt-1 block text-xs font-bold uppercase tracking-[0.12em] text-[#e1ca84] sm:text-sm">{gradeLabel(level)}</span>
            </span>
          </button>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex h-11 items-center gap-2 rounded-full border border-[#b49a58]/50 bg-[#2b462e] px-4 font-display text-lg font-black shadow-inner sm:h-12 sm:px-6">
              <Star className="h-6 w-6 fill-[#f8c53d] text-[#f8c53d]" aria-hidden="true" />
              <AnimatedNumber value={totalStars} /><span className="sr-only">stars</span>
            </div>
            <button onClick={() => setSoundOn(!soundOn)} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#b49a58]/50 bg-[#2b462e] shadow-md transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#f2c457] sm:h-12 sm:w-12" aria-label={soundOn ? "Turn sound off" : "Turn sound on"}>
              {soundOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
            </button>
            <button onClick={() => setMoreOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#b49a58]/50 bg-[#2b462e] shadow-md transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#f2c457] sm:h-12 sm:w-12" aria-label="Open more options">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-[1280px] gap-5 px-3 pb-32 pt-5 sm:px-6 lg:grid-cols-[minmax(0,3fr)_minmax(270px,1fr)] lg:pb-28 lg:pt-7">
        <motion.section variants={staggerContainer} initial="hidden" animate="visible" className="relative rounded-[28px] border-[5px] border-[#68421f] bg-[#f5dfad]/95 p-3 shadow-[0_18px_40px_rgba(30,13,3,0.42)] sm:p-7 lg:min-h-[670px]">
          <div className="pointer-events-none absolute inset-2 rounded-[20px] border border-[#aa7b36]/60" />
          <motion.div variants={staggerItem} className="relative z-10 text-center">
            <h1 className="font-display text-3xl font-black text-[#24482d] sm:text-5xl">{greeting}, {studentName}</h1>
            <p className="mx-auto mt-3 w-fit rounded-full bg-[#9e2f2b] px-6 py-2 font-display text-sm font-black uppercase tracking-[0.12em] text-[#fff5d5] shadow-md sm:text-base">
              {nextMission.returning ? "Continue your mission" : "Your first mission"}
            </p>
          </motion.div>

          <motion.div variants={staggerItem} whileHover={{ y: -3 }} className="relative z-10 mt-5 grid items-center gap-4 rounded-2xl border-2 border-[#c79d4d] bg-[#fff4d2]/80 p-4 shadow-inner sm:grid-cols-[190px_1fr] sm:p-5 lg:pr-[210px]">
            <Image src="/equal-groups-baskets.webp" alt="Two baskets with three apples in each basket" width={760} height={507} className="mx-auto h-auto w-full max-w-[220px] drop-shadow-md" />
            <div className="text-center sm:text-left">
              <p className="font-display text-2xl font-black text-[#8f2429] sm:text-3xl">{missionTitle}</p>
              <p className="mx-auto mt-2 max-w-sm text-base font-semibold leading-snug text-[#3d3224] sm:mx-0 sm:text-lg">{missionProgressLabel}</p>
              <button onClick={() => setView(canResumeExactQuestion
                ? { name: "practice", lessonId: nextMission.lesson.id, difficulty: activeCheckpoint.difficulty }
                : { name: "lesson", lessonId: nextMission.lesson.id })} className="mt-5 inline-flex min-h-14 items-center justify-center gap-3 rounded-full border-2 border-[#7a2328] bg-[#aa2f34] px-7 font-display text-lg font-black text-white shadow-[0_5px_0_#6d2023] transition-transform hover:-translate-y-0.5 active:translate-y-1 active:shadow-none focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#24482d]">
                {nextMission.returning ? "Continue mission" : "Begin mission"}<ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </motion.div>

          <motion.div variants={staggerContainer} className="relative z-10 mt-4 grid gap-3 lg:pr-[210px]">
            {reward ? (
              <motion.div
                variants={staggerItem}
                className={`rounded-2xl border-2 p-4 shadow-sm ${reward.status === "earned" ? "border-[#e0a929] bg-[#fff0a6]" : "border-[#9b6ab2] bg-[#f4e5ff]"}`}
                role="status"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/75 text-3xl shadow-sm" aria-hidden="true">{reward.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-display text-sm font-black uppercase tracking-[0.1em] text-[#674076]"><Gift className="h-4 w-4" /> My reward mission</p>
                    <p className="mt-0.5 font-display text-xl font-black text-[#38233f]">{reward.title}</p>
                    <p className="text-sm font-bold text-[#68516e]">
                      {reward.status === "earned"
                        ? "You earned it! Show a grown-up to celebrate."
                        : reward.targetType === "topic"
                          ? `${reward.currentValue} of ${reward.targetValue} ${reward.domainTitle ?? "topic"} lessons complete`
                          : `${reward.currentValue} of ${reward.targetValue} ${reward.targetType} earned`}
                    </p>
                  </div>
                  <span className="font-display text-xl font-black text-[#674076]">{reward.percent}%</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full border border-[#b993c8] bg-white/70">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${reward.percent}%` }} className="h-full rounded-full bg-gradient-to-r from-[#8f5aa4] to-[#e1a82d]" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                variants={staggerItem}
                className="rounded-2xl border-2 border-dashed border-[#9b6ab2] bg-[#f4e5ff]/90 p-4 shadow-sm"
                role="status"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/75 text-[#765184] shadow-sm" aria-hidden="true"><Gift className="h-7 w-7" /></span>
                  <div>
                    <p className="font-display text-sm font-black uppercase tracking-[0.1em] text-[#674076]">My reward mission</p>
                    <p className="mt-0.5 font-display text-lg font-black text-[#38233f]">No reward set for {studentName} yet</p>
                    <p className="text-sm font-bold text-[#68516e]">A grown-up can choose one in the Parent area.</p>
                  </div>
                </div>
              </motion.div>
            )}
            <MissionLink icon={<Flame className="h-7 w-7" />} title="Warm-up: Daily Challenge" subtitle="Kickstart your brain with five quick questions." onClick={() => setView({ name: "daily" })} tone="red" />
            <MissionLink icon={<Calculator className="h-7 w-7" />} title="Explore: Times Table Lab, 2× to 12×" subtitle="Build speed and confidence with every table." onClick={() => setView({ name: "times-tables" })} tone="purple" />
          </motion.div>

          <MascotMotion className="pointer-events-none absolute bottom-0 right-0 z-20 hidden w-[285px] lg:block">
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ ...springy, delay: 0.25 }}>
            <Image src="/pip-explorer.webp" alt="Pip the fox points toward your first mission" width={900} height={1350} className="h-auto w-full drop-shadow-[0_18px_16px_rgba(48,20,4,0.35)]" />
          </motion.div>
          </MascotMotion>
        </motion.section>

        <motion.aside id="journey-board" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} className="rounded-[24px] border-[4px] border-[#795027] bg-[#f4dfb4]/95 p-5 shadow-[0_18px_40px_rgba(30,13,3,0.4)] lg:min-h-[670px]">
          <div className="mx-auto -mt-2 w-fit rounded-lg bg-[#284a2e] px-7 py-2 font-display text-xl font-black text-[#fff1c8] shadow-md">Your journey</div>
          <div className="mt-5 text-center">
            <Medal className="mx-auto h-14 w-14 text-[#a36a20]" />
            <p className="mt-1 font-display text-2xl font-black">{overall.completed === 0 ? "New explorer" : `${overall.percent}% explored`}</p>
            <p className="mt-2 font-bold">{overall.completed} of {overall.total} lessons</p>
            <div className="mt-3 h-3 overflow-hidden rounded-full border border-[#bd9855] bg-[#ead2a2]">
              <ProgressTrail value={overall.percent} className="h-full rounded-full bg-[#3f6a3c]" />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {curriculum.slice(0, 5).map((domain, index) => {
              const Icon = journeyIcons[index];
              const done = domain.lessons.filter((lesson) => progress[lesson.id]?.status === "completed").length;
              return (
                <motion.button key={domain.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ ...springy, delay: 0.2 + index * 0.07 }} whileHover={{ x: 5, scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => setView({ name: "domain", domainId: domain.id })} className="group flex w-full items-center gap-3 rounded-2xl border border-transparent p-2 text-left transition-colors hover:border-[#b7924e] hover:bg-[#fff2cd] focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#2a5132]">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 shadow-sm ${index === 0 ? "border-[#bc6b35] bg-[#e6a260] text-[#6c301f]" : index === 1 ? "border-[#7462a5] bg-[#a99cd2] text-[#3e315f]" : index === 2 ? "border-[#b38c3a] bg-[#e4c66d] text-[#664c18]" : index === 3 ? "border-[#3a8b7d] bg-[#6dc4b0] text-[#1f554c]" : "border-[#5674a8] bg-[#84a7d8] text-[#2c4269]"}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-lg font-black">{domain.title.replace(" & Division", "").replace(" & Big Numbers", "").replace(" & Data", "").replace(" & Shapes", "")}</span>
                    <span className="text-xs font-bold text-[#735d3e]">{done}/{domain.lessons.length} complete</span>
                  </span>
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </motion.button>
              );
            })}
          </div>
        </motion.aside>
      </main>

      <nav aria-label="Learner navigation" className="fixed inset-x-2 bottom-2 z-40 mx-auto grid max-w-[1160px] grid-cols-5 rounded-[28px] border-2 border-[#c8a968] bg-[#fff2cf]/95 p-2 shadow-[0_10px_35px_rgba(40,17,4,0.45)] backdrop-blur-sm sm:inset-x-6 sm:bottom-5">
        <NavButton active icon={<Home />} label="Home" onClick={() => setView({ name: "home" })} />
        <NavButton icon={<Map />} label="Adventure Map" onClick={scrollToJourney} />
        <NavButton icon={<Calculator />} label="Times Tables" onClick={() => setView({ name: "times-tables" })} />
        <NavButton icon={<ShieldQuestion />} label="Ask Pip" onClick={() => setView({ name: "tutor" })} />
        <NavButton icon={<MoreHorizontal />} label="More" onClick={() => setMoreOpen(true)} />
      </nav>

      <AnimatePresence>{moreOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#150b05]/65 p-3 sm:items-center" role="dialog" aria-modal="true" aria-label="More options">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg rounded-[28px] border-4 border-[#70471f] bg-[#fff0c9] p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div><p className="font-display text-2xl font-black text-[#24482d]">Explorer kit</p><p className="text-sm font-semibold text-[#725c3d]">More ways to learn and manage the app.</p></div>
              <button onClick={() => setMoreOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ead6a8] hover:bg-[#ddc48f]" aria-label="Close more options"><X /></button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <MoreButton icon={<Trophy />} label="My badges" onClick={() => setView({ name: "achievements" })} />
              <MoreButton icon={<Printer />} label="Worksheets" onClick={() => setView({ name: "worksheet" })} />
              <MoreButton icon={<UserRoundCog />} label="Grown-ups" onClick={() => setView({ name: "parent" })} />
              <MoreButton icon={<Heart />} label="Keep it free" onClick={() => setView({ name: "donations" })} />
              <MoreButton icon={<Settings />} label="Install app" onClick={() => window.dispatchEvent(new Event("mathstars-open-install"))} />
              <MoreButton icon={<RefreshCcw />} label="Switch learner" onClick={() => { setCurrentProfile(null); setView({ name: "landing" }); }} />
            </div>
            <button
              onClick={returnToWelcomePage}
              className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#9e2f2b] bg-[#fff7df] px-4 font-display font-black text-[#8f2429] transition-colors hover:bg-[#f8dfca] focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#24482d]"
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
              Back to welcome page
            </button>
            <a href="/privacy" className="mt-4 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-[#6e5737] hover:bg-[#ead6a8]"><LockKeyhole className="h-4 w-4" />Privacy for families</a>
          </motion.div>
        </div>
      )}</AnimatePresence>
    </div>
  );
}

function MissionLink({ icon, title, subtitle, onClick, tone }: { icon: React.ReactNode; title: string; subtitle: string; onClick: () => void; tone: "red" | "purple" }) {
  return (
    <motion.button variants={staggerItem} whileHover={{ y: -4, scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={onClick} className="group flex min-h-[72px] w-full items-center gap-4 rounded-2xl border border-[#caa568] bg-[#fff4d4]/90 p-3 text-left shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#24482d]">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 text-white shadow-sm ${tone === "red" ? "border-[#9b4538] bg-[#c65a42]" : "border-[#5b477d] bg-[#8066a5]"}`}>{icon}</span>
      <span className="min-w-0 flex-1"><span className="block font-display text-lg font-black text-[#24482d]">{title}</span><span className="block text-sm font-semibold text-[#725d40]">{subtitle}</span></span>
      <ChevronRight className="h-6 w-6 shrink-0 transition-transform group-hover:translate-x-1" />
    </motion.button>
  );
}

function NavButton({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl px-2 font-display text-[11px] font-black transition-colors focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#24482d] sm:text-base ${active ? "bg-[#f0d89e] text-[#31563a]" : "text-[#634c2e] hover:bg-[#f3dfae]"}`}><span className="[&>svg]:h-6 [&>svg]:w-6">{icon}</span><span className="hidden sm:inline">{label}</span><span className="sr-only sm:hidden">{label}</span></button>;
}

function MoreButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button onClick={onClick} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-[#d2b274] bg-[#fff7df] p-3 font-display font-black text-[#31543a] transition-transform hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#24482d]"><span className="[&>svg]:h-6 [&>svg]:w-6">{icon}</span>{label}</button>;
}
