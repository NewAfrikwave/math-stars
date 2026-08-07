"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Blocks,
  BookOpen,
  CalendarDays,
  Check,
  Coins,
  Headphones,
  LockKeyhole,
  Medal,
  MessageCircleQuestion,
  Printer,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

const journeySteps = [
  { image: "/journey-daily-mission-v2.webp", title: "Daily Mission", body: "A short activity built just for today." },
  { image: "/journey-activity.webp", title: "Adventure Map", body: "Explore lessons and build skills." },
  { image: "/pip-tutor-storybook-v2.webp", title: "Arcade", body: "Play games that bring math to life." },
  { image: "/pip-explorer.webp", title: "Ask Pip", body: "Get hints and help from Pip Tutor." },
  { image: "/journey-progress.webp", title: "Rewards", body: "Earn coins and stars. See your progress." },
];

const arcadeGames = [
  {
    image: "/arcade-rocket-builder-v2.webp",
    title: "Rocket Builder",
    body: "Build rockets by solving math problems.",
    skills: "Addition, Subtraction, Place Value",
  },
  {
    image: "/arcade-treasure-hunt-v2.webp",
    title: "Treasure Hunt",
    body: "Solve problems to find hidden treasure.",
    skills: "Word Problems, Multiplication, Fractions",
  },
  {
    image: "/arcade-math-race-v2.webp",
    title: "Math Race",
    body: "Race to the finish with quick math!",
    skills: "Fact Fluency, Speed, Accuracy",
  },
];

const gradeLevels = [
  {
    image: "/learner-fox.webp",
    title: "Preschool–Kindergarten",
    body: "Build rock-solid foundations with playful math problems.",
    skills: "Counting, Shapes, Patterns, Comparing",
  },
  {
    image: "/learner-owl.webp",
    title: "Grades 1–2",
    body: "Strengthen the basics and think with confidence.",
    skills: "Addition, Subtraction, Place Value, Word Problems",
  },
  {
    image: "/pip-explorer.webp",
    title: "Grades 3–4",
    body: "Deepen understanding and solve real-world problems.",
    skills: "Multiplication, Division, Fractions, Multi-step Problems",
  },
];

const toolkit = [
  { icon: BookOpen, title: "Lessons", body: "Clear, step-by-step lessons that build real understanding." },
  { icon: CalendarDays, title: "Daily Challenge", body: "A new activity every day to build strong habits." },
  { icon: Target, title: "Times Table Lab", body: "Fun practice for faster, stronger fact fluency." },
  { icon: Printer, title: "Worksheets", body: "Printable and interactive practice options." },
  { icon: Blocks, title: "Manipulatives", body: "Visual tools to explore and solve problems." },
  { icon: Headphones, title: "Read-Aloud Help", body: "Read lessons out loud and get extra support." },
  { icon: MessageCircleQuestion, title: "Ask Pip Tutor", body: "Friendly hints and guided help when they need it." },
];

const rewards = [
  { icon: Coins, title: "Earn Coins", body: "Earn coins by completing lessons and games." },
  { icon: Medal, title: "Collect Badges", body: "Unlock badges for skills, effort, and achievements." },
  { icon: CalendarDays, title: "Daily Bonuses", body: "Come back each day for special bonuses and streaks." },
  { image: "/pip-explorer.webp", title: "Unlock Friends", body: "Unlock Pip outfits, robot helpers, and fun companions." },
  { icon: Trophy, title: "Parent Goals", body: "Set reward goals and celebrate milestones." },
];

const stories = [
  {
    quote: "She asks to do her daily mission before breakfast. Math practice finally feels like her own adventure.",
    name: "Parent of a 2nd grader",
  },
  {
    quote: "The parent view shows me where he is growing without taking away his independence.",
    name: "Parent of a 4th grader",
  },
  {
    quote: "Read-aloud support helps my preschooler try on her own. That confidence has been wonderful to watch.",
    name: "Parent of a preschooler",
  },
];

const reveal = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0 },
};

export function PublicLanding() {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const worldY = useTransform(scrollY, [0, 720], [0, reduceMotion ? 0 : 48]);
  const [storyIndex, setStoryIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => setStoryIndex((current) => (current + 1) % stories.length), 6000);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  return (
    <div className="storybook-landing">
      <section id="adventure" className="reference-hero relative isolate overflow-hidden">
        <motion.div className="reference-hero__world" style={{ y: worldY }} aria-hidden="true" />
        <div className="relative z-10 mx-auto grid min-h-[610px] max-w-[1280px] items-center px-5 py-14 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:py-20">
          <div className="reference-hero__copy relative z-20 max-w-xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a302c]">Free <span className="mx-2 text-[#c7a35c]">•</span> Preschool–4th Grade</p>
            <h1 className="mt-5 font-display text-[2.7rem] font-black leading-[1.03] tracking-[-0.035em] text-[#24352a] sm:text-6xl lg:text-[4.25rem]">
              Big math adventures.
              <span className="mt-1 block text-[#ad4944]">Small confident steps.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base font-medium leading-7 text-[#665846] sm:text-lg">
              Practice, play, and grow through lessons and games that meet every learner at their level.
            </p>
            <div className="mt-7 flex flex-col items-start gap-2">
              <a href="/signin?mode=register" className="landing-primary-button relative inline-flex min-h-12 items-center justify-center rounded-full bg-[#ad4b43] px-7 font-display font-black text-white shadow-[0_7px_18px_rgba(110,42,35,.22)] transition hover:-translate-y-1 hover:bg-[#9c3e38] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#e8bd55] active:translate-y-0">
                Start a free adventure
              </a>
              <a href="/signin" className="inline-flex min-h-11 items-center gap-2 px-3 font-display text-sm font-black text-[#9a302c] transition hover:translate-x-1 hover:text-[#732220]">
                Family sign in <span aria-hidden="true">›</span>
              </a>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[#6d6655]" aria-label="Family promises">
              <li className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[#6d8b57]" /> Private family space</li>
              <li className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-[#6d8b57]" /> No ads</li>
              <li className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-[#6d8b57]" /> Made for young learners</li>
            </ul>
          </div>

          <div className="pointer-events-none relative hidden h-full min-h-[520px] lg:block" aria-hidden="true">
            <div className="hero-character hero-character--fox absolute -bottom-10 left-40 z-30 w-36">
              <Image src="/pip-explorer.webp" alt="" width={900} height={1350} className="h-auto w-full drop-shadow-[0_18px_18px_rgba(61,45,27,.2)]" />
            </div>
            <div className="hero-character hero-character--robot absolute -bottom-5 left-0 z-30 w-28">
              <Image src="/pip-tutor-storybook-v2.webp" alt="" width={1254} height={1254} unoptimized className="h-auto w-full drop-shadow-[0_14px_18px_rgba(40,61,74,.2)]" />
            </div>
          </div>
        </div>
      </section>

      <section id="journey" className="reference-section relative px-5 pb-14 pt-8 sm:px-8 sm:pb-20">
        <SectionHeading title="Choose your path" body="Every stop on the path helps your learner grow." />
        <ol className="reference-path relative mx-auto mt-9 grid max-w-6xl grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-5">
          {journeySteps.map((step, index) => (
            <motion.li
              key={step.title}
              variants={reveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.45 }}
              transition={{ delay: index * 0.08, duration: 0.48 }}
              className="reference-path__step relative z-10 text-center"
            >
              <span className="absolute left-[calc(50%+24px)] top-0 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-[#a9443f] text-xs font-black text-white shadow-md">{index + 1}</span>
              <span className="mx-auto flex h-[82px] w-[82px] items-center justify-center overflow-hidden rounded-[28px] border-4 border-[#fffaf0] bg-[#f3e5c7] shadow-[0_9px_20px_rgba(91,65,30,.18)] transition duration-300 group-hover:-translate-y-1">
                <Image src={step.image} alt="" width={320} height={320} className="h-full w-full object-cover" />
              </span>
              <h3 className="mt-3 font-display text-base font-black text-[#352d23]">{step.title}</h3>
              <p className="mx-auto mt-1 max-w-[160px] text-xs leading-5 text-[#6f604c]">{step.body}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      <section id="arcade" className="reference-arcade relative overflow-hidden px-5 py-14 sm:px-8 sm:py-20">
        <div className="reference-arcade__landscape" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl">
          <SectionHeading title={<>Step into the Math <span className="text-[#6f3fa0]">Adventure Arcade</span></>} body="Turn practice into play with three exciting worlds." />
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {arcadeGames.map((game, index) => (
              <motion.article
                key={game.title}
                variants={reveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.35 }}
                transition={{ delay: index * 0.12, duration: 0.55 }}
                whileHover={reduceMotion ? undefined : { y: -9, rotate: index === 1 ? 0 : index === 0 ? -0.8 : 0.8 }}
                className="reference-game-card group relative min-h-[250px] overflow-hidden rounded-[22px] border-4 border-[#efe1bc] bg-[#2d315a] shadow-[0_16px_28px_rgba(51,43,52,.22)]"
              >
                <Image src={game.image} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
                <div className="reference-game-card__shade" aria-hidden="true" />
                <div className="relative z-10 flex min-h-[250px] flex-col justify-end p-5 text-white">
                  <p className="font-display text-2xl font-black drop-shadow-md">{game.title}</p>
                  <p className="mt-1 text-sm font-semibold leading-5 text-white/95">{game.body}</p>
                  <p className="mt-3 text-xs font-bold text-[#f4d56a]"><span className="text-white">Skills:</span> {game.skills}</p>
                </div>
                <span className="absolute right-4 top-4 z-10 text-[#f7d863] transition duration-300 group-hover:rotate-12 group-hover:scale-125" aria-hidden="true"><Sparkles className="h-6 w-6" /></span>
              </motion.article>
            ))}
          </div>
          <div className="mt-8 text-center">
            <a href="/signin?mode=register" className="inline-flex min-h-11 items-center rounded-full bg-[#ad4b43] px-7 font-display text-sm font-black text-white shadow-md transition hover:-translate-y-1 hover:bg-[#973c37]">Explore the Arcade</a>
          </div>
        </div>
      </section>

      <section id="levels" className="reference-levels relative px-5 py-14 sm:px-8 sm:py-20">
        <div className="relative mx-auto max-w-6xl">
          <SectionHeading title="Learning that grows with your child" body="Grade-matched content for every stage." />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {gradeLevels.map((level, index) => (
              <motion.article
                key={level.title}
                variants={reveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="grade-reference-card grid grid-cols-[92px_1fr] items-center gap-4 rounded-2xl border border-[#d8c59e] bg-[#fffaf0]/95 p-4 shadow-[0_10px_26px_rgba(91,65,30,.1)]"
              >
                <Image src={level.image} alt="" width={220} height={220} className="h-[88px] w-[88px] rounded-xl object-cover object-top" />
                <div>
                  <h3 className="font-display text-base font-black text-[#342d25]">{level.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#6f604c]">{level.body}</p>
                  <p className="mt-2 text-[11px] font-bold leading-4 text-[#604c86]"><span className="text-[#ad4b43]">Skills:</span> {level.skills}</p>
                </div>
              </motion.article>
            ))}
          </div>
          <p className="mt-6 text-center text-xs font-semibold text-[#766650]">Choose a path that fits your learner. You can change anytime.</p>
          <div className="mt-4 text-center"><a href="/signin?mode=register" className="inline-flex min-h-10 items-center rounded-full bg-[#ad4b43] px-7 font-display text-sm font-black text-white shadow-md transition hover:-translate-y-1">Find my child&apos;s level</a></div>
        </div>
      </section>

      <section id="toolkit" className="reference-section px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeading title="A complete learning world" body="Everything your learner needs to practice, play, and grow." />
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-7">
            {toolkit.map(({ icon: Icon, title, body }, index) => (
              <motion.article
                key={title}
                variants={reveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.35 }}
                transition={{ delay: index * 0.055, duration: 0.45 }}
                className="toolkit-reference-card text-center"
              >
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0e3c4] text-[#826338] shadow-[0_8px_16px_rgba(95,69,36,.13)] transition duration-300 hover:-translate-y-1 hover:rotate-[-3deg]">
                  <Icon className="h-8 w-8" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <h3 className="mt-3 font-display text-sm font-black text-[#342d25]">{title}</h3>
                <p className="mx-auto mt-1 max-w-[145px] text-[11px] leading-4 text-[#6f604c]">{body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="rewards" className="reference-rewards px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl rounded-[34px] border border-[#e5d3a5] bg-[#fffaf0]/85 px-5 py-10 shadow-[inset_0_1px_0_white,0_16px_36px_rgba(98,70,31,.08)] sm:px-8">
          <SectionHeading title="Coins become confidence" body="Motivation that&apos;s fun—and meaningful." />
          <div className="mt-9 grid grid-cols-2 gap-4 md:grid-cols-5">
            {rewards.map(({ icon: Icon, image, title, body }, index) => (
              <motion.article
                key={title}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.86 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 140 }}
                className="reward-reference-card relative text-center"
              >
                <motion.span
                  animate={reduceMotion ? undefined : { y: [0, -7, 0], rotate: index % 2 ? [-2, 3, -2] : [2, -3, 2] }}
                  transition={{ duration: 3.2 + index * 0.35, repeat: Infinity, ease: "easeInOut" }}
                  className="mx-auto flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-full bg-[#f4e2ab] text-[#bd8b27] shadow-[0_10px_22px_rgba(133,91,26,.18)]"
                >
                  {image ? <Image src={image} alt="" width={180} height={180} className="h-full w-full object-cover object-top" /> : Icon ? <Icon className="h-9 w-9" strokeWidth={1.7} aria-hidden="true" /> : null}
                </motion.span>
                <h3 className="mt-3 font-display text-sm font-black text-[#342d25]">{title}</h3>
                <p className="mx-auto mt-1 max-w-[150px] text-[11px] leading-4 text-[#6f604c]">{body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="parents" className="reference-parent px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a9443f]">For parents</p>
            <h2 className="mt-3 max-w-lg font-display text-4xl font-black leading-tight text-[#29392d] sm:text-5xl">See the learning behind every adventure.</h2>
            <p className="mt-5 max-w-xl leading-7 text-[#665846]">Follow daily activity, skill growth, Arcade play, rewards, and the areas where a little encouragement can help most.</p>
            <ul className="mt-6 grid gap-3 text-sm font-bold text-[#4d4a3c] sm:grid-cols-2">
              <li className="inline-flex items-center gap-2"><Check className="h-5 w-5 text-[#668355]" /> Progress by skill</li>
              <li className="inline-flex items-center gap-2"><Check className="h-5 w-5 text-[#668355]" /> Streak and activity history</li>
              <li className="inline-flex items-center gap-2"><Check className="h-5 w-5 text-[#668355]" /> Arcade rounds and coins</li>
              <li className="inline-flex items-center gap-2"><Check className="h-5 w-5 text-[#668355]" /> Custom reward goals</li>
            </ul>
          </motion.div>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 30, rotateX: 4 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.65 }}
            className="parent-reference-dashboard rounded-[30px] border border-[#d9c8a7] bg-[#fffdf6] p-5 shadow-[0_24px_54px_rgba(66,55,32,.16)] sm:p-7"
          >
            <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#9d6d30]">This week</p><h3 className="mt-1 font-display text-2xl font-black text-[#2d4835]">Feodora&apos;s progress</h3></div><BarChart3 className="h-8 w-8 text-[#ad4b43]" /></div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <DashboardMetric value="24" label="Stars" icon={Star} />
              <DashboardMetric value="3" label="Arcade wins" icon={Trophy} />
              <DashboardMetric value="5" label="Day streak" icon={CalendarDays} />
            </div>
            <div className="mt-6 space-y-4">
              <ProgressRow label="Addition & subtraction" value={88} color="#6f8e58" />
              <ProgressRow label="Place value" value={72} color="#c4933a" />
              <ProgressRow label="Word problems" value={61} color="#a64e48" />
            </div>
          </motion.div>
        </div>
      </section>

      <section id="families" className="reference-stories px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e6d29d] text-[#9b7527]"><Star className="h-7 w-7" fill="currentColor" /></div>
          <h2 className="mt-5 font-display text-3xl font-black text-[#2d3b30] sm:text-4xl">Made for real family moments</h2>
          <div className="relative mt-8 min-h-[165px]">
            <AnimatePresence mode="sync">
              <motion.figure key={storyIndex} initial={reduceMotion ? false : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: -24 }} transition={{ duration: 0.4 }} className="absolute inset-0">
                <blockquote className="font-display text-xl font-bold leading-8 text-[#5b4c3c] sm:text-2xl">“{stories[storyIndex].quote}”</blockquote>
                <figcaption className="mt-4 text-sm font-black text-[#a9443f]">{stories[storyIndex].name}</figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>
          <div className="mt-4 flex justify-center gap-2" aria-label="Choose a family story">
            {stories.map((story, index) => <button key={story.name} type="button" onClick={() => setStoryIndex(index)} className={`h-3 w-3 rounded-full transition ${storyIndex === index ? "bg-[#a9443f] scale-125" : "bg-[#cdbb92] hover:bg-[#a99468]"}`} aria-label={`Show story ${index + 1}`} aria-current={storyIndex === index ? "true" : undefined} />)}
          </div>
        </div>
      </section>

      <section id="start" className="reference-final relative overflow-hidden px-5 py-16 sm:px-8 sm:py-24">
        <div className="relative z-10 mx-auto grid max-w-5xl items-center gap-8 text-center md:grid-cols-[150px_1fr_150px] md:text-left">
          <motion.div animate={reduceMotion ? undefined : { y: [0, -9, 0], rotate: [-1, 1, -1] }} transition={{ duration: 4, repeat: Infinity }} className="mx-auto w-28 md:w-36"><Image src="/pip-explorer.webp" alt="Pip the Math Stars fox" width={900} height={1350} className="h-auto w-full" /></motion.div>
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#9a302c]">Free for families</p>
            <h2 className="mt-3 font-display text-4xl font-black leading-tight text-[#2b3d31] sm:text-5xl">Ready for your child&apos;s next adventure?</h2>
            <p className="mx-auto mt-4 max-w-xl leading-7 text-[#665846] md:mx-0">Create a private family space and begin at the level that feels right today.</p>
            <a href="/signin?mode=register" className="mt-7 inline-flex min-h-12 items-center rounded-full bg-[#ad4b43] px-8 font-display font-black text-white shadow-lg transition hover:-translate-y-1 hover:bg-[#973c37]">Start a free adventure</a>
          </div>
          <motion.div animate={reduceMotion ? undefined : { y: [0, -8, 0], rotate: [1, -1, 1] }} transition={{ duration: 3.6, repeat: Infinity }} className="mx-auto w-28 md:w-32"><Image src="/pip-tutor-storybook-v2.webp" alt="Pip Tutor robot" width={1254} height={1254} unoptimized className="h-auto w-full drop-shadow-lg" /></motion.div>
        </div>
      </section>

      <footer className="border-t border-[#d2bf96] bg-[#f4e8cd] px-5 py-9 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
          <Image src="/brand/math-stars-logo.png" alt="Math Stars" width={1400} height={360} unoptimized className="h-11 w-auto" />
          <p className="text-xs font-semibold text-[#72634f]">Learn. Practice. Shine. Preschool through 4th Grade.</p>
          <nav className="flex gap-5 text-xs font-bold text-[#654f3b]" aria-label="Footer"><a href="#adventure">Adventure</a><a href="#arcade">Games</a><a href="#parents">For Parents</a><a href="/privacy">Privacy</a></nav>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ title, body }: { title: React.ReactNode; body: string }) {
  return <div className="mx-auto max-w-3xl text-center"><h2 className="font-display text-3xl font-black leading-tight text-[#2d352d] sm:text-4xl">{title}</h2><p className="mt-2 text-sm font-medium text-[#73624d] sm:text-base">{body}</p></div>;
}

function DashboardMetric({ value, label, icon: Icon }: { value: string; label: string; icon: typeof Star }) {
  return <div className="rounded-2xl bg-[#f4ead2] p-3 text-center"><Icon className="mx-auto h-5 w-5 text-[#ae7830]" /><p className="mt-1 font-display text-2xl font-black text-[#2f4937]">{value}</p><p className="text-[11px] font-bold text-[#77654e]">{label}</p></div>;
}

function ProgressRow({ label, value, color }: { label: string; value: number; color: string }) {
  return <div><div className="mb-1.5 flex justify-between text-xs font-bold text-[#5e513f]"><span>{label}</span><span>{value}%</span></div><div className="h-2.5 overflow-hidden rounded-full bg-[#e8dcc3]"><motion.div initial={{ width: 0 }} whileInView={{ width: `${value}%` }} viewport={{ once: true }} transition={{ duration: 0.9, ease: "easeOut" }} className="h-full rounded-full" style={{ backgroundColor: color }} /></div></div>;
}
