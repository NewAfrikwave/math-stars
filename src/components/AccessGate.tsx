"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  ChevronRight,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { PublicLanding } from "@/components/PublicLanding";
import { clearOfflineDeviceData } from "@/lib/offline/database";

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
  const adminPage = pathname === "/admin";

  useEffect(() => {
    if (staleSession) {
      fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      clearOfflineDeviceData().catch(() => {});
    }
  }, [staleSession]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (signInPage && new URLSearchParams(window.location.search).get("mode") === "register") {
        setMode("register");
      }
    }, 0);
    return () => window.clearTimeout(timer);
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

  const publicUtilityPage = pathname === "/privacy" || pathname === "/support" || pathname === "/transparency" || pathname === "/offline";
  if (authenticated || adminPage || publicUtilityPage) return <>{children}</>;

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
              unoptimized
              className="h-12 w-auto sm:h-14"
            />
          </a>

          {!signInPage && <nav className="hidden items-center gap-9 text-sm font-bold lg:flex" aria-label="Landing page">
            <a href="#adventure" className="transition-colors hover:text-rose-600">Adventure</a>
            <a href="#arcade" className="transition-colors hover:text-rose-600">Games</a>
            <a href="#parents" className="transition-colors hover:text-rose-600">For Parents</a>
            <a href="/privacy" className="transition-colors hover:text-rose-600">Privacy</a>
          </nav>}

          <a href={signInPage ? "/" : "/signin"} className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-rose-500 px-5 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50">
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
            <span>{signInPage ? "Back home" : "Family sign in"}</span>
          </a>
        </div>
      </header>

      {!signInPage ? <PublicLanding /> : <section id="top" className="relative flex min-h-[calc(100vh-5rem)] items-center bg-gradient-to-b from-[#fffaf0] to-rose-50/50 px-5 pb-12 pt-8 sm:px-8 sm:pt-10">
        <div className="mx-auto w-full max-w-6xl text-center">
          <>
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
                <>
                  <label className="grid gap-1.5 text-sm font-bold">
                    Family access code
                    <input id="family-code" type="password" autoComplete="current-password" value={code} onChange={(event) => setCode(event.target.value)} required placeholder="Enter the existing code" className="h-12 rounded-xl border border-stone-200 bg-[#fffdf8] px-4 text-base font-normal outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100" />
                  </label>
                </>
              )}
            </div>
            <button
              disabled={loading}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-7 font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-label="Signing in" /> : <>{mode === "register" ? "Create my free account" : "Enter Math Stars"} <ChevronRight className="h-4 w-4" aria-hidden="true" /></>}
            </button>
            {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}
            <div className="mt-4 flex flex-col items-center gap-2 border-t border-stone-100 pt-4 text-center">
              <button type="button" onClick={() => { setMode(mode === "legacy" ? "signin" : "legacy"); setError(""); }} className="text-xs font-semibold text-stone-500 underline hover:text-stone-700">
                {mode === "legacy" ? "Back to email sign in" : "Use the existing family access code"}
              </button>
              <a href="/admin" className="text-xs font-semibold text-rose-600 underline hover:text-rose-700">Administrator sign in</a>
            </div>
          </form>
          <p id="family-code-help" className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-stone-500">
            <ShieldCheck className="h-4 w-4 text-rose-500" aria-hidden="true" />
            A parent or guardian manages this private family space.
          </p>
          </>
        </div>
      </section>}
    </main>
  );
}
