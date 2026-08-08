"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, KeyRound, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { AdminView } from "@/components/game/AdminView";

type PortalStage = "checking" | "login" | "dashboard";

export function AdminPortal() {
  const [stage, setStage] = useState<PortalStage>("checking");
  const [hasAdminPin, setHasAdminPin] = useState(true);
  const [ownerCode, setOwnerCode] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/settings", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (cancelled) return;
        setHasAdminPin(Boolean(data.hasAdminPin));
        setStage(data.authenticated ? "dashboard" : "login");
      })
      .catch(() => {
        if (!cancelled) {
          setError("Admin access could not be checked. Please refresh and try again.");
          setStage("login");
        }
      });
    return () => { cancelled = true; };
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (hasAdminPin && !/^\d{4}$/.test(adminPin)) {
      setError("Enter your four-digit admin PIN.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const ownerResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: ownerCode }),
      });
      if (!ownerResponse.ok) {
        const data = await ownerResponse.json().catch(() => null);
        setError(ownerResponse.status === 429 ? "Too many attempts. Please wait and try again." : data?.error ?? "The owner access code is incorrect.");
        return;
      }

      if (hasAdminPin) {
        const adminResponse = await fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-pin": adminPin },
          body: JSON.stringify({ action: "verify-pin" }),
        });
        if (!adminResponse.ok) {
          await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
          setError(adminResponse.status === 429 ? "Too many PIN attempts. Please wait and try again." : "The admin PIN is incorrect.");
          return;
        }
      }

      setStage("dashboard");
    } catch {
      setError("Math Stars could not connect. Check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (stage === "dashboard") return <AdminView standalone />;

  if (stage === "checking") {
    return (
      <main id="main-content" className="flex min-h-screen items-center justify-center bg-[#f5f3ee] text-[#101936]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#6f46e8]" aria-label="Checking administrator access" />
          <p className="mt-3 text-sm font-semibold text-[#65708b]">Checking secure access…</p>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f3ee] px-5 py-12 text-[#101936]">
      <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,#e6dffc,transparent_68%)]" aria-hidden="true" />
      <div className="relative w-full max-w-md">
        <a href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#526078] transition hover:text-[#101936] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d9cffb]">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Math Stars
        </a>
        <form onSubmit={signIn} className="rounded-[30px] border border-[#ddd9d1] bg-white p-7 shadow-[0_24px_70px_rgba(16,25,54,.12)] sm:p-9" aria-labelledby="admin-login-title">
          <div className="flex items-center gap-4">
            <Image src="/brand/math-stars-icon-192.png" alt="" width={64} height={64} priority className="h-16 w-16 rounded-2xl" />
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#9a2450]">Private workspace</p>
              <h1 id="admin-login-title" className="mt-1 text-2xl font-black tracking-[-.03em]">Administrator sign in</h1>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-[#65708b]">Enter your administrator credentials to go directly to the Learning Observatory.</p>

          <div className="mt-7 grid gap-4">
            <label className="grid gap-2 text-sm font-bold">
              Owner access code
              <span className="relative">
                <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a8499]" aria-hidden="true" />
                <input type="password" autoComplete="current-password" value={ownerCode} onChange={(event) => setOwnerCode(event.target.value)} required autoFocus placeholder="Enter owner access code" className="h-[52px] w-full rounded-xl border border-[#d8d5ce] bg-[#fbfaf7] py-3 pl-11 pr-4 text-base font-normal outline-none transition focus:border-[#7a58ea] focus:ring-4 focus:ring-[#e7e1fb]" />
              </span>
            </label>
            {hasAdminPin && <label className="grid gap-2 text-sm font-bold">
              Four-digit admin PIN
              <span className="relative">
                <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a8499]" aria-hidden="true" />
                <input type="password" inputMode="numeric" autoComplete="current-password" value={adminPin} onChange={(event) => setAdminPin(event.target.value.replace(/\D/g, "").slice(0, 4))} required minLength={4} maxLength={4} placeholder="Enter admin PIN" className="h-[52px] w-full rounded-xl border border-[#d8d5ce] bg-[#fbfaf7] py-3 pl-11 pr-4 text-base font-normal outline-none transition focus:border-[#7a58ea] focus:ring-4 focus:ring-[#e7e1fb]" />
              </span>
            </label>}
          </div>

          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-[#b4234d]">{error}</p>}
          <button disabled={loading} className="mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#111f46] px-6 py-3 font-bold text-white shadow-lg shadow-[#111f46]/15 transition hover:bg-[#1b2e5e] disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-label="Signing in" /> : <><ShieldCheck className="h-5 w-5" aria-hidden="true" /> Open admin panel <ChevronRight className="h-4 w-4" aria-hidden="true" /></>}
          </button>
          {!hasAdminPin && <p className="mt-4 text-center text-xs font-semibold leading-5 text-[#65708b]">After your owner code is verified, you’ll create a private admin PIN.</p>}
        </form>
        <p className="mt-5 text-center text-xs font-semibold text-[#65708b]">This page is for Math Stars administrators only.</p>
      </div>
    </main>
  );
}
