"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  BarChart3,
  Blocks,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  Loader2,
  LockKeyhole,
  Mail,
  Medal,
  MessageCircleQuestion,
  Printer,
  RotateCcw,
  ShieldCheck,
  Star,
  Target,
  UserPlus,
} from "lucide-react";

const journeySteps = [
  {
    image: "/journey-learner.webp",
    title: "Choose a learner",
    body: "Create or select a learner profile for preschool through 4th grade.",
  },
  {
    image: "/journey-activity.webp",
    title: "Do a quick activity",
    body: "Try a short practice activity that meets them where they are.",
  },
  {
    image: "/journey-progress.webp",
    title: "Earn stars and see progress",
    body: "Build confidence with badges, read-aloud help, and progress you can see.",
  },
];

const featureList = [
  { icon: CalendarDays, title: "Daily Challenge", body: "A fresh activity each day to build strong habits." },
  { icon: RotateCcw, title: "Smart Review", body: "Practice that focuses on skills that need more attention." },
  { icon: MessageCircleQuestion, title: "Ask Pip Tutor", body: "Friendly hints and guided help when a learner gets stuck." },
  { icon: Printer, title: "Printable Worksheets", body: "Ready-to-print practice for learning away from the screen." },
  { icon: Blocks, title: "Hands-on Manipulatives", body: "Visual tools that make big ideas easier to understand." },
  { icon: Medal, title: "Badges and Stars", body: "Celebrate effort, practice streaks, and completed lessons." },
  { icon: ChartNoAxesCombined, title: "Parent Progress", body: "See learner activity, skill growth, and where to help." },
];

export function AccessGate({ authenticated, staleSession = false, children }: { authenticated: boolean; staleSession?: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mode, setMode] = useState<"signin" | "register" | "legacy">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const signInPage = pathname === "/signin";

  useEffect(() => {
    if (staleSession) fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  }, [staleSession]);

  useEffect(() => {
    if (signInPage && new URLSearchParams(window.location.search).get("mode") === "register") {
      setMode("register");
    }
  }, [signInPage]);

  useEffect(() => {
    if (authenticated && signInPage) window.location.replace("/");
  }, [authenticated, signInPage]);

  if (authenticated && signInPage) {
    return (
      <main id="main-content" className="flex min-h-screen items-center justify-center bg-[#fffaf0] px-5 text-[#351d10]">
        <div className="text-center">
          <Image src="/brand/math-stars-logo.png" alt="Math Stars" width={1400} height={360} priority className="mx-auto h-16 w-auto" />
          <p className="mt-6 inline-flex items-center gap-2 font-semibold text-stone-600">
            <Loader2 className="h-5 w-5 animate-spin text-rose-600" aria-hidden="true" />
            Opening your learning space…
          </p>
        </div>
      </main>
    );
  }

  if (authenticated || pathname === "/privacy") return <>{children}</>;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    if (mode === "register" && password !== confirmPassword) {
      setError("The passwords do not match.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(mode === "register" ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "legacy" ? { code } : { displayName, email, password, acceptPrivacy }),
      });
      if (response.ok) {
        window.location.reload();
        return;
      }
      const data = await response.json().catch(() => null);
      setError(response.status === 429 ? "Too many attempts. Please wait and try again." : data?.error ?? "We could not sign you in.");
    } catch {
      setError("We could not connect. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main id="main-content" className="min-h-screen overflow-hidden bg-[#fffaf0] text-[#351d10]">
      <header className="relative z-20 border-b border-rose-100/70 bg-[#fffaf0]/95 backdrop-blur">
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href="/" className="flex items-center" aria-label="Math Stars home">
            <Image
              src="/brand/math-stars-logo.png"
              alt="Math Stars"
              width={1400}
              height={360}
              priority
              className="h-12 w-auto sm:h-14"
            />
          </a>

          {!signInPage && <nav className="hidden items-center gap-8 text-sm font-semibold lg:flex" aria-label="Landing page">
            <a href="#adventure" className="transition-colors hover:text-rose-600">The adventure</a>
            <a href="#parents" className="transition-colors hover:text-rose-600">For parents</a>
            <a href="/privacy" className="transition-colors hover:text-rose-600">Privacy</a>
          </nav>}

          <a href={signInPage ? "/" : "/signin"} className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-rose-500 px-4 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50">
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
            <span>{signInPage ? "Back home" : "Family sign in"}</span>
          </a>
        </div>
      </header>

      <section id="top" className={`relative px-5 pb-12 pt-8 sm:px-8 sm:pt-10 ${signInPage ? "flex min-h-[calc(100vh-5rem)] items-center bg-gradient-to-b from-[#fffaf0] to-rose-50/50" : ""}`}>
        <div className="mx-auto w-full max-w-6xl text-center">
          {!signInPage && <>
          <p className="font-display text-3xl font-bold text-rose-600 sm:text-4xl lg:text-5xl">Choose Your Adventure.</p>
          <h1 className="mx-auto mt-2 max-w-5xl font-display text-3xl font-bold leading-[1.06] tracking-tight sm:text-4xl lg:text-5xl">
            A calm, encouraging math journey for every young learner.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">
            Preschool through 4th grade. Play, practice, and grow with confidence in a private space made for your family.
          </p>

          <div className="relative mx-auto mt-2 max-w-[1120px]">
            <Image
              src="/storybook-adventure-map.webp"
              alt="Three storybook math paths leading to play, practice, and progress"
              width={1716}
              height={916}
              priority
              className="max-h-[480px] w-full object-contain mix-blend-multiply"
            />
          </div>

          <div className="relative z-10 mx-auto -mt-2 flex max-w-xl flex-col justify-center gap-3 sm:flex-row">
            <a href="/signin" className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 font-bold text-white shadow-md transition hover:bg-rose-700">
              <LockKeyhole className="h-5 w-5" aria-hidden="true" /> Sign in
            </a>
            <a href="/signin?mode=register" className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-rose-500 bg-white px-6 font-bold text-rose-600 transition hover:bg-rose-50">
              <UserPlus className="h-5 w-5" aria-hidden="true" /> Create account
            </a>
          </div>
          </>}

          {signInPage && <>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-600">Private family access</p>
          <h1 className="mx-auto mt-2 max-w-2xl font-display text-3xl font-bold sm:text-4xl">Welcome to your family’s learning space</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-stone-600 sm:text-base">Sign in, create a parent account, or use the existing family access code.</p>
          <form
            id="family-access"
            onSubmit={submit}
            className="relative z-10 mx-auto mt-7 max-w-2xl rounded-3xl border border-rose-100 bg-white p-5 text-left shadow-[0_18px_55px_rgba(74,38,21,0.13)] sm:p-7"
            aria-labelledby="family-login-title"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                {mode === "register" ? <UserPlus className="h-6 w-6" aria-hidden="true" /> : <LockKeyhole className="h-6 w-6" aria-hidden="true" />}
              </span>
              <div>
                <h2 id="family-login-title" className="font-display text-lg font-bold">
                  {mode === "register" ? "Create your free family account" : mode === "legacy" ? "Existing family code" : "Welcome back"}
                </h2>
                <p className="mt-0.5 text-xs leading-5 text-stone-500">
                  {mode === "register" ? "One private space for the grown-up and every learner." : "Sign in to your family’s private learning space."}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 rounded-xl bg-stone-100 p-1">
              <button type="button" onClick={() => { setMode("signin"); setError(""); }} className={`rounded-lg px-3 py-2 text-sm font-bold transition ${mode === "signin" ? "bg-white text-rose-600 shadow-sm" : "text-stone-500"}`}>Sign in</button>
              <button type="button" onClick={() => { setMode("register"); setError(""); }} className={`rounded-lg px-3 py-2 text-sm font-bold transition ${mode === "register" ? "bg-white text-rose-600 shadow-sm" : "text-stone-500"}`}>Create account</button>
            </div>

            <div className="mt-5 grid gap-3">
              {mode === "register" && (
                <label className="grid gap-1.5 text-sm font-bold">
                  Parent or guardian name
                  <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" required minLength={2} placeholder="Your name" className="h-12 rounded-xl border border-stone-200 bg-[#fffdf8] px-4 text-base font-normal outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100" />
                </label>
              )}
              {mode !== "legacy" ? (
                <>
                  <label className="grid gap-1.5 text-sm font-bold">
                    Email address
                    <span className="relative">
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
                      <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required placeholder="parent@example.com" className="h-12 w-full rounded-xl border border-stone-200 bg-[#fffdf8] pl-11 pr-4 text-base font-normal outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100" />
                    </span>
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold">
                    Password
                    <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "register" ? "new-password" : "current-password"} required minLength={mode === "register" ? 10 : undefined} placeholder={mode === "register" ? "10+ characters, including a number" : "Enter your password"} className="h-12 rounded-xl border border-stone-200 bg-[#fffdf8] px-4 text-base font-normal outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100" />
                  </label>
                  {mode === "register" && (
                    <>
                      <label className="grid gap-1.5 text-sm font-bold">
                        Confirm password
                        <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required minLength={10} placeholder="Type the password again" className="h-12 rounded-xl border border-stone-200 bg-[#fffdf8] px-4 text-base font-normal outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100" />
                      </label>
                      <label className="flex items-start gap-2 rounded-xl bg-stone-50 p-3 text-xs font-medium leading-5 text-stone-600">
                        <input type="checkbox" checked={acceptPrivacy} onChange={(event) => setAcceptPrivacy(event.target.checked)} required className="mt-1 h-4 w-4 accent-rose-600" />
                        <span>I am a parent or guardian and agree to the <a href="/privacy" className="font-bold text-rose-600 underline">family privacy notice</a>.</span>
                      </label>
                    </>
                  )}
                </>
              ) : (
                <label className="grid gap-1.5 text-sm font-bold">
                  Family access code
                  <input id="family-code" type="password" autoComplete="current-password" value={code} onChange={(event) => setCode(event.target.value)} required placeholder="Enter the existing code" className="h-12 rounded-xl border border-stone-200 bg-[#fffdf8] px-4 text-base font-normal outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100" />
                </label>
              )}
            </div>
            <button
              disabled={loading}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-7 font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-label="Signing in" /> : <>{mode === "register" ? "Create my free account" : "Enter Math Stars"} <ChevronRight className="h-4 w-4" aria-hidden="true" /></>}
            </button>
            {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}
            <div className="mt-4 border-t border-stone-100 pt-4 text-center">
              <button type="button" onClick={() => { setMode(mode === "legacy" ? "signin" : "legacy"); setError(""); }} className="text-xs font-semibold text-stone-500 underline hover:text-stone-700">
                {mode === "legacy" ? "Back to email sign in" : "Use the existing family access code"}
              </button>
            </div>
          </form>
          <p id="family-code-help" className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-stone-500">
            <ShieldCheck className="h-4 w-4 text-rose-500" aria-hidden="true" />
            A parent or guardian manages this private family space.
          </p>
          </>}
        </div>
      </section>

      {!signInPage && <>
      <section id="adventure" className="border-y border-amber-100 bg-[#fff7e8] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-600">A simple daily rhythm</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">How the journey works</h2>
          </div>
          <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {journeySteps.map((step, index) => {
              return (
                <li key={step.title} className="relative text-center">
                  {index < journeySteps.length - 1 && <span className="absolute left-[64%] top-11 hidden w-[72%] border-t-2 border-dashed border-amber-300 md:block" aria-hidden="true" />}
                  <span className="relative z-10 mx-auto block h-24 w-24 rounded-full bg-white shadow-sm">
                    <Image src={step.image} alt="" width={320} height={320} className="h-full w-full rounded-full object-cover" />
                    <span className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 font-display text-sm font-bold text-white">{index + 1}</span>
                  </span>
                  <h3 className="mt-5 font-display text-xl font-bold text-rose-600">{step.title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-stone-600">{step.body}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section id="parents" className="bg-gradient-to-b from-rose-50/60 to-[#fffaf0] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.82fr_1.45fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-600">Everything in one calm space</p>
            <h2 className="mt-3 font-display text-4xl font-bold">Inside Math Stars</h2>
            <p className="mt-3 max-w-md text-base leading-7 text-stone-600">Helpful practice for children, useful visibility for parents, and encouragement built into every step.</p>
            <ul className="mt-8 space-y-5">
              {featureList.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li key={feature.title} className="flex gap-4">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                    <div>
                      <h3 className="font-display text-base font-bold">{feature.title}</h3>
                      <p className="mt-0.5 text-sm leading-5 text-stone-600">{feature.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-[2rem] border border-rose-100 bg-white p-3 shadow-[0_22px_70px_rgba(89,44,28,0.12)] sm:p-5">
            <div className="overflow-hidden rounded-[1.4rem] border border-stone-200 bg-[#fffdf8]">
              <div className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4">
                <Image
                  src="/brand/math-stars-logo.png"
                  alt="Math Stars"
                  width={1400}
                  height={360}
                  className="h-9 w-auto"
                />
                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">Avery · 2nd Grade</span>
              </div>
              <div className="p-5 sm:p-7">
                <h3 className="font-display text-2xl font-bold">Ready for your next adventure?</h3>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <PreviewCard icon={CalendarDays} title="Daily Challenge" body="Add and subtract tens and ones" accent="amber" />
                  <PreviewCard icon={Target} title="Smart Review" body="Review place value within 100" accent="green" />
                </div>
                <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4">
                  <div className="flex items-start gap-3">
                    <Image src="/pip-tutor.webp" alt="Pip, the friendly Math Stars tutor" width={420} height={420} className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
                    <div className="flex-1">
                      <p className="font-display font-bold">Ask Pip Tutor</p>
                      <p className="mt-1 text-sm text-stone-600">Friendly hints and read-aloud help are ready when a learner needs them.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <MiniTool icon={Printer} title="Worksheets" body="Print and practice offline" />
                  <MiniTool icon={Blocks} title="Manipulatives" body="Explore with visual tools" />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-stone-200 pt-5">
                  <PreviewStat icon={Star} value="23" label="stars this week" />
                  <PreviewStat icon={Medal} value="4" label="badges earned" />
                  <PreviewStat icon={BarChart3} value="7 days" label="practice streak" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-rose-100 bg-white px-5 py-9 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><LockKeyhole className="h-5 w-5" /></span>
            <div><p className="font-display font-bold">A safe, private space for your family.</p><p className="text-sm text-stone-500">Parent-managed access. Individual learner profiles.</p></div>
          </div>
          <a href="/privacy" className="text-sm font-bold text-rose-600 hover:text-rose-700">Read the privacy details <ChevronRight className="inline h-4 w-4" /></a>
        </div>
      </footer>
      </>}
    </main>
  );
}

function PreviewCard({ icon: Icon, title, body, accent }: { icon: typeof CalendarDays; title: string; body: string; accent: "amber" | "green" }) {
  return (
    <div className={accent === "amber" ? "rounded-2xl border border-amber-200 bg-amber-50 p-4" : "rounded-2xl border border-emerald-200 bg-emerald-50 p-4"}>
      <Icon className={accent === "amber" ? "h-7 w-7 text-amber-600" : "h-7 w-7 text-emerald-600"} aria-hidden="true" />
      <h4 className="mt-3 font-display font-bold">{title}</h4>
      <p className="mt-1 text-sm leading-5 text-stone-600">{body}</p>
      <span className="mt-4 inline-flex rounded-full bg-rose-600 px-4 py-1.5 text-xs font-bold text-white">Start</span>
    </div>
  );
}

function MiniTool({ icon: Icon, title, body }: { icon: typeof Printer; title: string; body: string }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4"><Icon className="h-7 w-7 text-rose-500" /><div><p className="font-display font-bold">{title}</p><p className="text-xs text-stone-500">{body}</p></div></div>;
}

function PreviewStat({ icon: Icon, value, label }: { icon: typeof Star; value: string; label: string }) {
  return <div className="text-center"><Icon className="mx-auto h-5 w-5 text-amber-500" /><p className="mt-1 font-display text-lg font-bold">{value}</p><p className="text-[11px] text-stone-500">{label}</p></div>;
}
