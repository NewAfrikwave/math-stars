"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Blocks,
  Bot,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CirclePlay,
  Coins,
  Gamepad2,
  Gem,
  Headphones,
  LockKeyhole,
  Medal,
  MessageCircleQuestion,
  Printer,
  Rocket,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

const journeySteps = [
  {
    image: "/journey-learner.webp",
    title: "Choose their level",
    body: "Create a learner profile from Preschool through 4th Grade.",
  },
  {
    image: "/journey-activity.webp",
    title: "Follow a smart path",
    body: "Short lessons and practice meet each child where they are.",
  },
  {
    icon: Gamepad2,
    title: "Play in the Arcade",
    body: "Three real games turn grade-level practice into an adventure.",
  },
  {
    icon: Trophy,
    title: "Earn and unlock",
    body: "Coins, stars, badges, and companions celebrate steady effort.",
  },
  {
    image: "/journey-progress.webp",
    title: "See their growth",
    body: "Parents can follow skills, activity, streaks, and progress.",
  },
];

const arcadeGames = [
  {
    icon: Zap,
    title: "Star Sprint",
    body: "Answer quickly and race Pip across a starlight track.",
    tone: "rose",
    skill: "Speed + accuracy",
  },
  {
    icon: Gem,
    title: "Treasure Match",
    body: "Read each clue and unlock the chest with the matching answer.",
    tone: "emerald",
    skill: "Patterns + number sense",
  },
  {
    icon: Rocket,
    title: "Rocket Builder",
    body: "Solve each mission to build a rocket part by part.",
    tone: "violet",
    skill: "Operations + fluency",
  },
];

const gradeLevels = [
  { grade: "Preschool", ages: "Ages 3–5", skills: "Counting, shapes, patterns", color: "#de9b3b" },
  { grade: "1st Grade", ages: "Ages 6–7", skills: "Addition, subtraction, place value", color: "#c65a53" },
  { grade: "2nd Grade", ages: "Ages 7–8", skills: "Fluency, measurement, early groups", color: "#667f46" },
  { grade: "3rd Grade", ages: "Ages 8–9", skills: "Multiplication, division, fractions", color: "#765596" },
  { grade: "4th Grade", ages: "Ages 9–10", skills: "Multi-digit math, fractions, geometry", color: "#35747b" },
];

const tools = [
  { icon: CalendarDays, title: "Daily Challenge", body: "A fresh activity every day builds a healthy practice rhythm.", tone: "amber" },
  { icon: RotateCcw, title: "Smart Review", body: "Practice returns to the skills that deserve another look.", tone: "green" },
  { icon: MessageCircleQuestion, title: "Ask Pip Tutor", body: "Friendly hints help children think without giving the answer away.", tone: "sky" },
  { icon: Headphones, title: "Read-Aloud Help", body: "Questions and guidance can be spoken for younger learners.", tone: "rose" },
  { icon: Blocks, title: "Hands-on Tools", body: "Visual manipulatives make abstract ideas easier to understand.", tone: "violet" },
  { icon: Printer, title: "Printable Practice", body: "Keep learning going away from the screen with worksheets.", tone: "teal" },
];

const familyStories = [
  {
    quote: "She asks to do her daily challenge before breakfast. The games made practice feel like her own little adventure.",
    name: "Parent of a 2nd grader",
    detail: "Daily practice became something to look forward to",
  },
  {
    quote: "I can see what he worked on without hovering over every answer. We celebrate progress, not pressure.",
    name: "Parent of a 4th grader",
    detail: "Clear progress for the grown-up, independence for the child",
  },
  {
    quote: "Pip’s read-aloud help gives my preschooler the confidence to try on her own. That small win matters.",
    name: "Parent of a preschooler",
    detail: "Gentle support for an early learner",
  },
];

const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

export function PublicLanding() {
  const reducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const mapY = useTransform(scrollY, [0, 720], [0, reducedMotion ? 0 : 74]);
  const pipY = useTransform(scrollY, [0, 650], [0, reducedMotion ? 0 : -54]);
  const [storyIndex, setStoryIndex] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => {
      setStoryIndex((current) => (current + 1) % familyStories.length);
    }, 6200);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  return (
    <>
      <section id="top" className="landing-hero relative isolate overflow-hidden px-5 pb-14 pt-10 sm:px-8 sm:pb-20 lg:pt-14">
        <div className="landing-paper-grain" aria-hidden="true" />
        <div className="landing-stars" aria-hidden="true">
          {[12, 27, 44, 63, 78, 91].map((left, index) => (
            <motion.span
              key={left}
              className="landing-star"
              style={{ left: `${left}%`, top: `${14 + (index % 3) * 19}%` }}
              animate={reducedMotion ? undefined : { y: [0, -16, 0], rotate: [0, 14, 0], opacity: [0.25, 0.9, 0.25] }}
              transition={{ duration: 3.8 + index * 0.45, repeat: Infinity, delay: index * 0.35 }}
            >
              <Star className="h-full w-full" fill="currentColor" />
            </motion.span>
          ))}
        </div>

        <div className="relative z-10 mx-auto max-w-6xl text-center">
          <motion.p
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#d5b269]/55 bg-[#fff9e9]/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#7e2c2d] shadow-sm backdrop-blur"
          >
            <Sparkles className="h-4 w-4 text-[#c9952f]" aria-hidden="true" />
            Free math adventures · Preschool through 4th Grade
          </motion.p>
          <motion.h1
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.65 }}
            className="mx-auto mt-5 max-w-5xl font-display text-[2.65rem] font-black leading-[0.98] tracking-[-0.035em] text-[#24482d] sm:text-6xl lg:text-[5.35rem]"
          >
            Big math adventures.
            <span className="mt-1 block text-[#9a302c]">Small confident steps.</span>
          </motion.h1>
          <motion.p
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.65 }}
            className="mx-auto mt-5 max-w-2xl text-base font-medium leading-7 text-[#6b5a43] sm:text-lg"
          >
            One welcoming world for lessons, practice, real math games, rewards, and parent-visible progress, built to grow with every learner.
          </motion.p>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.65 }}
            className="relative z-20 mx-auto mt-7 flex max-w-xl flex-col justify-center gap-3 sm:flex-row"
          >
            <a href="/signin?mode=register" className="landing-primary-button group inline-flex min-h-13 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#9a302c] px-6 py-3.5 font-display font-black text-white shadow-[0_7px_0_#68201e,0_14px_30px_rgba(91,33,27,0.18)] transition hover:-translate-y-1 hover:bg-[#a63832] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#e7b94f] active:translate-y-1 active:shadow-none">
              <UserPlus className="h-5 w-5" aria-hidden="true" /> Start the adventure
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </a>
            <a href="#arcade" className="inline-flex min-h-13 flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-[#315b3b] bg-[#fffaf0]/92 px-6 py-3.5 font-display font-black text-[#315b3b] shadow-[0_6px_0_#d8c7a1] transition hover:-translate-y-1 hover:bg-white focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#e7b94f] active:translate-y-1 active:shadow-none">
              <CirclePlay className="h-5 w-5" aria-hidden="true" /> Explore what&apos;s inside
            </a>
          </motion.div>

          <div className="relative mx-auto mt-5 max-w-[1180px] sm:mt-2">
            <motion.div style={{ y: mapY }} className="relative z-10">
              <Image
                src="/storybook-adventure-map.webp"
                alt="A storybook map with paths to play and learn, practice and grow, and celebrate progress"
                width={1716}
                height={916}
                priority
                className="w-full object-contain mix-blend-multiply drop-shadow-[0_24px_22px_rgba(95,67,26,0.13)]"
              />
            </motion.div>
            <motion.div
              style={{ y: pipY }}
              animate={reducedMotion ? undefined : { rotate: [-1, 1.5, -1] }}
              transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute -bottom-4 -left-4 z-20 hidden w-[15%] min-w-28 sm:block lg:-left-10"
            >
              <Image src="/pip-explorer.webp" alt="" width={900} height={1350} className="h-auto w-full drop-shadow-[0_16px_16px_rgba(71,40,13,0.24)]" />
            </motion.div>
          </div>

          <motion.div
            variants={reveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.55 }}
            className="relative z-20 mx-auto -mt-2 grid max-w-3xl grid-cols-3 gap-2 rounded-[1.4rem] border border-[#d8c39a] bg-[#fffaf0]/94 p-3 shadow-[0_18px_45px_rgba(78,50,20,0.14)] backdrop-blur sm:gap-4 sm:p-4"
          >
            <HeroStat icon={Gamepad2} value="3" label="Arcade games" />
            <HeroStat icon={Medal} value="4" label="Companions" />
            <HeroStat icon={Users} value="5" label="Grade levels" />
          </motion.div>
        </div>
      </section>

      <section id="journey" className="landing-section relative overflow-hidden border-y border-[#dcc99e] bg-[#f3e6c9] px-5 py-16 sm:px-8 sm:py-24">
        <div className="landing-paper-grain" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl">
          <SectionHeading eyebrow="A journey made for growing minds" title="Five small steps. One big adventure." body="Children always know what to do next, while the learning quietly adapts behind the scenes." />
          <ol className="journey-line relative mt-12 grid gap-7 md:grid-cols-5 md:gap-4">
            {journeySteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.li
                  key={step.title}
                  variants={reveal}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.45 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="journey-step relative rounded-[1.6rem] border border-[#d9c294] bg-[#fff9e9] p-5 text-center shadow-[0_12px_28px_rgba(96,65,26,0.1)]"
                >
                  <span className="absolute -right-1.5 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#9a302c] font-display text-sm font-black text-white shadow-md">{index + 1}</span>
                  <span className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.35rem] border-2 border-white bg-[#ecddbd] text-[#315b3b] shadow-[0_7px_16px_rgba(86,57,24,0.13)]">
                    {step.image ? <Image src={step.image} alt="" width={320} height={320} className="h-full w-full object-cover" /> : Icon ? <Icon className="h-9 w-9" aria-hidden="true" /> : null}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-black text-[#2a4c32]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-5 text-[#6f5a3d]">{step.body}</p>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </section>

      <section id="arcade" className="arcade-landing relative isolate overflow-hidden bg-[#1f193c] px-5 py-16 text-white sm:px-8 sm:py-24">
        <Image src="/character-doorways-bg.webp" alt="" fill sizes="100vw" className="absolute inset-0 -z-20 object-cover object-center opacity-35" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(21,14,47,.82),rgba(30,17,57,.91))]" />
        <div className="arcade-portal-glow" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl">
          <SectionHeading eyebrow="The Math Adventure Arcade" title="Three games. Their grade. A new reason to practice." body="Every round uses questions from the learner’s saved level, remembers each answer, and picks up on any device." dark />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {arcadeGames.map((game, index) => {
              const Icon = game.icon;
              return (
                <motion.article
                  key={game.title}
                  initial={reducedMotion ? false : { opacity: 0, y: 36, rotate: index === 1 ? 0 : index === 0 ? -1.5 : 1.5 }}
                  whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: index * 0.1, duration: 0.55 }}
                  whileHover={reducedMotion ? undefined : { y: -10, rotate: index === 1 ? 0 : index === 0 ? -0.7 : 0.7 }}
                  className={`arcade-game-card arcade-game-card--${game.tone} group relative overflow-hidden rounded-[2rem] border-2 border-white/25 p-6 shadow-[0_18px_0_rgba(7,4,24,0.42),0_30px_55px_rgba(0,0,0,0.25)]`}
                >
                  <div className="arcade-game-shine" aria-hidden="true" />
                  <span className="relative flex h-16 w-16 items-center justify-center rounded-[1.35rem] border-2 border-white/35 bg-white/15 shadow-inner backdrop-blur">
                    <Icon className="h-8 w-8" aria-hidden="true" />
                  </span>
                  <p className="relative mt-8 text-xs font-black uppercase tracking-[0.16em] text-white/75">{game.skill}</p>
                  <h3 className="relative mt-2 font-display text-3xl font-black">{game.title}</h3>
                  <p className="relative mt-3 min-h-14 font-semibold leading-6 text-white/85">{game.body}</p>
                  <span className="relative mt-7 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-display text-sm font-black text-[#30214f] shadow-lg">
                    Play after sign in <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </motion.article>
              );
            })}
          </div>
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            className="mx-auto mt-12 flex max-w-3xl flex-col items-center justify-between gap-5 rounded-[1.8rem] border border-amber-200/30 bg-black/20 p-5 text-center backdrop-blur sm:flex-row sm:text-left"
          >
            <div className="flex items-center gap-4">
              <motion.span animate={reducedMotion ? undefined : { rotate: [0, -8, 8, 0], scale: [1, 1.08, 1.08, 1] }} transition={{ duration: 4, repeat: Infinity }} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-300 text-[#3b244f]">
                <Coins className="h-7 w-7" aria-hidden="true" />
              </motion.span>
              <div><p className="font-display text-xl font-black">Coins unlock new Arcade companions</p><p className="mt-1 text-sm font-semibold text-violet-200">Daily bonuses reward consistency, and completed rounds only award once.</p></div>
            </div>
            <a href="/signin?mode=register" className="shrink-0 rounded-xl bg-amber-300 px-5 py-3 font-display font-black text-[#34214d] transition hover:-translate-y-1 hover:bg-amber-200">Start free</a>
          </motion.div>
        </div>
      </section>

      <section id="levels" className="landing-section relative overflow-hidden bg-[#fffaf0] px-5 py-16 sm:px-8 sm:py-24">
        <div className="landing-paper-grain" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl">
          <SectionHeading eyebrow="Learning that grows with them" title="The right challenge at every grade." body="The same welcoming world changes its questions, skills, and support for each learner profile." />
          <div className="grade-path relative mt-12 grid gap-4 md:grid-cols-5">
            {gradeLevels.map((level, index) => (
              <motion.article
                key={level.grade}
                initial={reducedMotion ? false : { opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                whileHover={reducedMotion ? undefined : { y: -7 }}
                className="grade-card relative overflow-hidden rounded-[1.6rem] border bg-white p-5 shadow-[0_12px_28px_rgba(88,58,24,0.09)]"
                style={{ borderColor: `${level.color}55` }}
              >
                <span className="absolute inset-x-0 top-0 h-2" style={{ backgroundColor: level.color }} />
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl font-display text-lg font-black text-white" style={{ backgroundColor: level.color }}>{index + 1}</span>
                <h3 className="mt-5 font-display text-xl font-black text-[#2b4b32]">{level.grade}</h3>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: level.color }}>{level.ages}</p>
                <p className="mt-3 text-sm leading-5 text-[#6b5a43]">{level.skills}</p>
              </motion.article>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-center text-sm font-semibold leading-6 text-[#6b5a43]">Two children can open the same game and receive completely different questions, each matched to the grade saved in their own profile.</p>
        </div>
      </section>

      <section id="toolkit" className="landing-section border-y border-[#d7c89f] bg-[#e9efe0] px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="A complete learning toolkit" title="More than lessons. More ways to understand." body="Every child learns differently, so Math Stars offers several paths into the same important idea." />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <motion.article
                  key={tool.title}
                  variants={reveal}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ delay: (index % 3) * 0.08, duration: 0.48 }}
                  className={`toolkit-card toolkit-card--${tool.tone} group rounded-[1.65rem] border bg-[#fffdf7] p-6 shadow-[0_12px_28px_rgba(66,84,48,0.08)] transition hover:-translate-y-1.5 hover:shadow-[0_18px_34px_rgba(66,84,48,0.14)]`}
                >
                  <span className="toolkit-icon flex h-13 w-13 items-center justify-center rounded-2xl"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                  <h3 className="mt-5 font-display text-xl font-black text-[#294a31]">{tool.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6b5a43]">{tool.body}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="rewards" className="landing-section relative overflow-hidden bg-[#fff7e8] px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.55 }}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9a302c]">Rewards with a purpose</p>
            <h2 className="mt-3 font-display text-4xl font-black leading-tight text-[#26482f] sm:text-5xl">Celebrate the effort that builds confidence.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#6b5a43]">Stars, badges, streaks, coins, and companions make progress visible. Parents can also set family rewards tied to learning goals.</p>
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {["Coins for completed Arcade rounds", "Badges for new milestones", "Companions to unlock and choose", "Parent rewards tied to goals"].map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-2xl border border-[#e3d1a8] bg-white/75 p-4 text-sm font-bold text-[#4f493b]"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#315b3b] text-white"><Check className="h-3.5 w-3.5" /></span>{item}</li>
              ))}
            </ul>
          </motion.div>
          <div className="relative min-h-[460px]">
            <motion.div animate={reducedMotion ? undefined : { y: [0, -10, 0], rotate: [-1, 1, -1] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-0 left-0 z-20 w-[45%] max-w-[250px]">
              <Image src="/pip-explorer.webp" alt="Pip the fox, the first Arcade companion" width={900} height={1350} className="h-auto w-full drop-shadow-[0_20px_18px_rgba(72,44,17,0.22)]" />
            </motion.div>
            <motion.div initial={reducedMotion ? false : { opacity: 0, x: 35 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.35 }} className="absolute right-0 top-0 w-[72%] rounded-[2rem] border border-[#d9c69d] bg-white p-5 shadow-[0_24px_55px_rgba(86,54,23,0.16)] sm:p-7">
              <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-[#9a302c]">Companion collection</p><h3 className="mt-1 font-display text-2xl font-black text-[#2a4b31]">Keep exploring</h3></div><motion.span animate={reducedMotion ? undefined : { rotate: [0, 10, -10, 0] }} transition={{ duration: 3.4, repeat: Infinity }} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8d66d] text-[#654315]"><Coins className="h-6 w-6" /></motion.span></div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <CompanionCard image="/pip-tutor.webp" name="Pip Explorer" coins="Ready" />
                <CompanionCard image="/learner-owl.webp" name="Luna Owl" coins="50 coins" />
                <CompanionCard icon={Sparkles} name="Nova Cat" coins="120 coins" />
                <CompanionCard icon={Bot} name="Orbit Bot" coins="250 coins" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="parents" className="landing-section bg-[#2b5135] px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.83fr_1.3fr] lg:items-center">
          <motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.55 }}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f0c45d]">For the grown-ups</p>
            <h2 className="mt-3 font-display text-4xl font-black leading-tight sm:text-5xl">See the learning behind the play.</h2>
            <p className="mt-5 max-w-lg text-base font-medium leading-7 text-[#e4eedf]">A simple parent view shows what each child practiced, where they are improving, and what may need a little more attention.</p>
            <ul className="mt-7 space-y-3">
              {["Lesson, challenge, and Arcade activity", "Skill accuracy and best game scores", "Stars, coins, badges, and practice streaks", "Reward goals for learning wins"].map((item) => <li key={item} className="flex items-center gap-3 font-bold text-[#f6f2e8]"><Check className="h-5 w-5 text-[#f0c45d]" />{item}</li>)}
            </ul>
          </motion.div>
          <motion.div initial={reducedMotion ? false : { opacity: 0, y: 35, rotateX: 4 }} whileInView={{ opacity: 1, y: 0, rotateX: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.7 }} className="parent-dashboard rounded-[2rem] border border-white/20 bg-[#fffaf0] p-3 text-[#342719] shadow-[0_30px_70px_rgba(7,24,12,0.35)] sm:p-5">
            <div className="overflow-hidden rounded-[1.45rem] border border-[#dfd2b6] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eadfc9] bg-[#fffaf0] px-5 py-4">
                <Image src="/brand/math-stars-logo.png" alt="Math Stars" width={1400} height={360} className="h-9 w-auto" />
                <span className="rounded-full bg-[#e5eddc] px-3 py-1 text-xs font-black text-[#315b3b]">Avery · 2nd Grade</span>
              </div>
              <div className="grid gap-5 p-5 sm:p-7">
                <div className="grid grid-cols-3 gap-3">
                  <DashboardStat value={23} suffix="" label="stars this week" icon={Star} />
                  <DashboardStat value={4} suffix="" label="badges earned" icon={Medal} />
                  <DashboardStat value={7} suffix=" days" label="practice streak" icon={BarChart3} />
                </div>
                <div className="rounded-2xl border border-[#e8ddc5] bg-[#fffaf0] p-5">
                  <div className="flex items-center justify-between gap-3"><div><p className="font-display text-lg font-black text-[#2f5036]">Skill progress</p><p className="text-xs font-semibold text-[#806e54]">Last 7 days</p></div><span className="rounded-full bg-[#f4dfac] px-3 py-1 text-xs font-black text-[#775722]">6 activities</span></div>
                  <div className="mt-5 space-y-4">
                    <SkillBar label="Place value" value={88} color="#577d4e" />
                    <SkillBar label="Addition & subtraction" value={76} color="#be5b50" />
                    <SkillBar label="Arcade number sense" value={82} color="#735292" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#d8e6cd] bg-[#eff6e9] p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-[#577d4e]">Growing strong</p><p className="mt-2 font-display font-black">Place value within 100</p></div>
                  <div className="rounded-2xl border border-[#ead5ae] bg-[#fff4dc] p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-[#a46924]">Try next</p><p className="mt-2 font-display font-black">Subtracting across a ten</p></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="safety" className="landing-section bg-[#fffaf0] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <motion.article variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }} className="rounded-[2rem] border border-[#dccaa4] bg-[#f4e6c7] p-7 sm:p-9">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#315b3b] text-white"><ShieldCheck className="h-7 w-7" /></span>
            <h2 className="mt-6 font-display text-3xl font-black text-[#294a31]">A private family learning space.</h2>
            <p className="mt-3 max-w-2xl leading-7 text-[#6b5a43]">Parents manage the account. Each child gets an individual learner profile, and Math Stars does not use advertising trackers or sell personal information.</p>
            <a href="/privacy" className="mt-6 inline-flex items-center gap-2 font-display font-black text-[#9a302c] hover:underline">Read the family privacy details <ArrowRight className="h-4 w-4" /></a>
          </motion.article>
          <motion.article variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }} transition={{ delay: 0.08 }} className="rounded-[2rem] border border-[#d8c8aa] bg-white p-7 shadow-[0_16px_38px_rgba(78,55,27,0.08)] sm:p-9">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4dfac] text-[#7d5b20]"><Target className="h-7 w-7" /></span>
            <h2 className="mt-6 font-display text-3xl font-black text-[#294a31]">Calm by design.</h2>
            <p className="mt-3 leading-7 text-[#6b5a43]">Short activities, encouraging feedback, optional read-aloud support, and motion that respects the device’s reduced-motion setting.</p>
          </motion.article>
        </div>
      </section>

      <section id="families" className="landing-section border-y border-[#dac79f] bg-[#f2e4c6] px-5 py-16 sm:px-8 sm:py-22">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9a302c]">Why families come back</p>
          <h2 className="mt-3 font-display text-4xl font-black text-[#294a31] sm:text-5xl">Confidence shows up one small win at a time.</h2>
          <div className="relative mt-10 min-h-[280px] overflow-hidden rounded-[2rem] border border-[#d8c295] bg-[#fffaf0] p-7 shadow-[0_18px_45px_rgba(85,56,22,0.12)] sm:p-10">
            <AnimatePresence mode="wait">
              <motion.figure key={storyIndex} initial={reducedMotion ? false : { opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={reducedMotion ? undefined : { opacity: 0, x: -30 }} transition={{ duration: 0.42 }}>
                <div className="flex justify-center gap-1 text-[#d8a634]" aria-label="5 out of 5 stars">{Array.from({ length: 5 }, (_, index) => <Star key={index} className="h-5 w-5" fill="currentColor" />)}</div>
                <blockquote className="mx-auto mt-6 max-w-3xl font-display text-2xl font-bold leading-relaxed text-[#3d4933] sm:text-3xl">“{familyStories[storyIndex].quote}”</blockquote>
                <figcaption className="mt-6"><p className="font-black text-[#9a302c]">{familyStories[storyIndex].name}</p><p className="mt-1 text-sm text-[#756249]">{familyStories[storyIndex].detail}</p></figcaption>
              </motion.figure>
            </AnimatePresence>
            <div className="mt-7 flex items-center justify-center gap-3">
              <button type="button" aria-label="Previous family story" onClick={() => setStoryIndex((storyIndex - 1 + familyStories.length) % familyStories.length)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d2bd8f] bg-white text-[#315b3b] transition hover:-translate-y-0.5 hover:shadow-md"><ChevronLeft className="h-5 w-5" /></button>
              {familyStories.map((story, index) => <button key={story.name} type="button" aria-label={`Show story ${index + 1}`} aria-pressed={storyIndex === index} onClick={() => setStoryIndex(index)} className={`h-2.5 rounded-full transition-all ${storyIndex === index ? "w-8 bg-[#9a302c]" : "w-2.5 bg-[#cbb78e] hover:bg-[#9d895f]"}`} />)}
              <button type="button" aria-label="Next family story" onClick={() => setStoryIndex((storyIndex + 1) % familyStories.length)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d2bd8f] bg-white text-[#315b3b] transition hover:-translate-y-0.5 hover:shadow-md"><ChevronRight className="h-5 w-5" /></button>
            </div>
          </div>
        </div>
      </section>

      <section id="start" className="final-adventure relative isolate overflow-hidden bg-[#24472e] px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="absolute inset-0 -z-20 bg-[url('/explorer-study-bg.webp')] bg-cover bg-center opacity-28" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(25,55,34,.97),rgba(35,72,45,.83),rgba(35,64,43,.93))]" />
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_.7fr] lg:items-center">
          <motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.55 }}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f0c45d]">Ready when your family is</p>
            <h2 className="mt-3 max-w-3xl font-display text-4xl font-black leading-[1.03] sm:text-6xl">Their next math adventure can start today.</h2>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-7 text-[#e1ecdd]">Create one free parent-managed space, add each learner, and let Math Stars meet them at their own level.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="/signin?mode=register" className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-[#f0c45d] px-7 py-3.5 font-display font-black text-[#2d4932] shadow-[0_7px_0_#9d7320] transition hover:-translate-y-1 hover:bg-[#f7d274] active:translate-y-1 active:shadow-none"><UserPlus className="h-5 w-5" /> Create a free family account <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></a>
              <a href="/signin" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl border-2 border-white/40 bg-white/10 px-7 py-3.5 font-display font-black backdrop-blur transition hover:-translate-y-1 hover:bg-white/16"><LockKeyhole className="h-5 w-5" /> Family sign in</a>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm font-bold text-[#dce9d7]"><ShieldCheck className="h-5 w-5 text-[#f0c45d]" /> Free for families · Parent managed · No ads</p>
          </motion.div>
          <div className="relative mx-auto h-[380px] w-full max-w-[430px]">
            <motion.div animate={reducedMotion ? undefined : { y: [0, -12, 0], rotate: [-1.5, 1, -1.5] }} transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-0 left-0 z-10 w-[60%]"><Image src="/pip-explorer.webp" alt="Pip the fox welcoming families to Math Stars" width={900} height={1350} className="h-auto w-full drop-shadow-[0_22px_20px_rgba(0,0,0,0.3)]" /></motion.div>
            <motion.div animate={reducedMotion ? undefined : { y: [0, -8, 0], rotate: [1.5, -1, 1.5] }} transition={{ duration: 4.8, repeat: Infinity, delay: 0.4, ease: "easeInOut" }} className="absolute bottom-2 right-0 w-[53%]"><Image src="/learner-owl.webp" alt="Luna the owl, an unlockable Math Stars companion" width={520} height={520} className="h-auto w-full rounded-full drop-shadow-[0_20px_20px_rgba(0,0,0,0.28)]" /></motion.div>
            {[{ x: "12%", y: "4%" }, { x: "64%", y: "7%" }, { x: "79%", y: "43%" }].map((position, index) => <motion.span key={position.x} className="absolute text-[#f6cd63]" style={{ left: position.x, top: position.y }} animate={reducedMotion ? undefined : { scale: [0.8, 1.18, 0.8], rotate: [0, 18, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2.7 + index * 0.5, repeat: Infinity, delay: index * 0.4 }}><Star className="h-7 w-7" fill="currentColor" /></motion.span>)}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#cdb889] bg-[#172f1f] px-5 py-10 text-[#e5eddf] sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-[1fr_auto_auto] sm:items-center">
          <div><Image src="/brand/math-stars-logo.png" alt="Math Stars" width={1400} height={360} className="h-12 w-auto brightness-0 invert" /><p className="mt-3 max-w-sm text-sm leading-6 text-[#bfcdbb]">Small steps, bright futures, and a calmer way to grow in math.</p></div>
          <nav aria-label="Footer" className="grid gap-2 text-sm font-bold"><a href="#journey" className="hover:text-[#f0c45d]">The journey</a><a href="#arcade" className="hover:text-[#f0c45d]">Arcade</a><a href="#parents" className="hover:text-[#f0c45d]">For parents</a></nav>
          <nav aria-label="Legal" className="grid gap-2 text-sm font-bold"><a href="/privacy" className="hover:text-[#f0c45d]">Privacy</a><a href="/signin" className="hover:text-[#f0c45d]">Family sign in</a><a href="/signin?mode=register" className="hover:text-[#f0c45d]">Create account</a></nav>
        </div>
        <div className="mx-auto mt-8 max-w-6xl border-t border-white/10 pt-6 text-xs text-[#91a68f]">© {new Date().getFullYear()} Math Stars. Built for growing minds and the grown-ups cheering them on.</div>
      </footer>
    </>
  );
}

function SectionHeading({ eyebrow, title, body, dark = false }: { eyebrow: string; title: string; body: string; dark?: boolean }) {
  return (
    <motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.45 }} transition={{ duration: 0.55 }} className="mx-auto max-w-3xl text-center">
      <p className={`text-xs font-black uppercase tracking-[0.2em] ${dark ? "text-amber-300" : "text-[#9a302c]"}`}>{eyebrow}</p>
      <h2 className={`mt-3 font-display text-4xl font-black leading-tight sm:text-5xl ${dark ? "text-white" : "text-[#294a31]"}`}>{title}</h2>
      <p className={`mx-auto mt-4 max-w-2xl text-base leading-7 ${dark ? "font-semibold text-violet-100" : "text-[#6b5a43]"}`}>{body}</p>
    </motion.div>
  );
}

function HeroStat({ icon: Icon, value, label }: { icon: typeof Gamepad2; value: string; label: string }) {
  return <div className="flex flex-col items-center justify-center gap-1 border-r border-[#ddc99e] px-1 last:border-r-0 sm:flex-row sm:gap-3 sm:px-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e6efdE] text-[#315b3b]"><Icon className="h-5 w-5" /></span><div className="text-center sm:text-left"><p className="font-display text-lg font-black leading-none text-[#2b4d33]">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a674c] sm:text-xs">{label}</p></div></div>;
}

function CompanionCard({ image, icon: Icon, name, coins }: { image?: string; icon?: typeof Bot; name: string; coins: string }) {
  return <div className="rounded-2xl border border-[#e5d8be] bg-[#fffaf0] p-3 text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[#ece4d1] text-[#6c4b8d]">{image ? <Image src={image} alt="" width={520} height={520} className="h-full w-full object-cover" /> : Icon ? <Icon className="h-8 w-8" /> : null}</span><p className="mt-2 font-display text-sm font-black text-[#2d4d34]">{name}</p><p className="mt-1 text-[11px] font-bold text-[#9a302c]">{coins}</p></div>;
}

function DashboardStat({ value, suffix, label, icon: Icon }: { value: number; suffix: string; label: string; icon: typeof Star }) {
  return <div className="rounded-2xl border border-[#e8dec9] bg-[#fffaf0] p-3 text-center"><Icon className="mx-auto h-5 w-5 text-[#d5a132]" /><p className="mt-2 font-display text-lg font-black text-[#2d4d34]"><CountUp value={value} />{suffix}</p><p className="mt-1 text-[10px] font-bold leading-4 text-[#806f56] sm:text-xs">{label}</p></div>;
}

function SkillBar({ label, value, color }: { label: string; value: number; color: string }) {
  return <div><div className="flex items-center justify-between gap-3 text-xs font-bold"><span>{label}</span><span>{value}%</span></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#e7decb]"><motion.span initial={{ width: 0 }} whileInView={{ width: `${value}%` }} viewport={{ once: true }} transition={{ duration: 1, ease: "easeOut" }} className="block h-full rounded-full" style={{ backgroundColor: color }} /></div></div>;
}

function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.8 });
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || reducedMotion) return;
    const started = performance.now();
    const duration = 850;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reducedMotion, value]);

  return <span ref={ref}>{reducedMotion ? value : display}</span>;
}
