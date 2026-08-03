"use client";

import { FormEvent, useState } from "react";
import { LockKeyhole, Loader2 } from "lucide-react";

export function AccessGate({ authenticated, children }: { authenticated: boolean; children: React.ReactNode }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (authenticated) return <>{children}</>;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setLoading(false);
    if (response.ok) window.location.reload();
    else setError(response.status === 429 ? "Too many attempts. Please wait and try again." : "That access code is not correct.");
  }

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-sky-50 p-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl" aria-labelledby="family-login-title">
        <LockKeyhole className="mx-auto mb-4 h-12 w-12 text-primary" aria-hidden="true" />
        <h1 id="family-login-title" className="text-center font-display text-3xl font-bold">Math Stars</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">Enter your family access code to continue.</p>
        <label htmlFor="family-code" className="mt-6 block text-sm font-semibold">Family access code</label>
        <input id="family-code" type="password" autoComplete="current-password" value={code} onChange={(e) => setCode(e.target.value)} required className="mt-2 h-12 w-full rounded-xl border px-4 text-base" />
        {error && <p role="alert" className="mt-3 text-sm font-medium text-destructive">{error}</p>}
        <button disabled={loading} className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-60">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-label="Signing in" /> : "Enter Math Stars"}
        </button>
        <p className="mt-5 text-center text-xs text-muted-foreground">A parent or guardian manages this private family space.</p>
      </form>
    </main>
  );
}
