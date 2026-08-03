"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Lock,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { cn } from "@/lib/utils";

interface ProfileSummaryData {
  id: string;
  name: string;
  avatar: string;
  level: string;
  totalStars: number;
  streak: number;
  completedLessons: number;
  totalLessons: number;
  avgScore: number;
  domains: Record<string, { completed: number; total: number }>;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  emoji: string;
  score: number;
  correct: number;
  total: number;
  stars: number;
  createdAt: string;
}

export function ParentView() {
  const setView = useGameStore((s) => s.setView);
  const [stage, setStage] = useState<"loading" | "pin" | "dashboard" | "setup">("loading");
  const [pinInput, setPinInput] = useState("");
  const [profiles, setProfiles] = useState<ProfileSummaryData[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // First, check whether a PIN is set (via the summary endpoint).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/parent?summary=1")
      .then((r) => (r.status === 401 ? { error: "wrong-pin", hasPin: true } : r.json()))
      .then((d) => {
        if (cancelled || !d) return;
        if (d.error === "wrong-pin" || d.hasPin) setStage("pin");
        else setStage("setup");
      })
      .catch(() => setStage("setup"));
    return () => {
      cancelled = true;
    };
  }, []);

  const loadSummary = async (pin: string) => {
    const res = await fetch("/api/parent?summary=1", { headers: { "x-parent-pin": pin } });
    if (res.status === 401) return null;
    const d = await res.json();
    if (d.error) return null;
    return (d.profiles ?? []) as ProfileSummaryData[];
  };

  const loadActivity = async (profileId: string) => {
    try {
      const res = await fetch("/api/activity?limit=20", {
        headers: { "x-profile-id": profileId },
      });
      const d = await res.json();
      setActivity((d.events ?? []) as ActivityItem[]);
    } catch {
      setActivity([]);
    }
  };

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const verifyPin = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await loadSummary(pinInput);
      if (list === null) {
        setError("That's not the right PIN. Try again!");
        setLoading(false);
        return;
      }
      setProfiles(list);
      if (list[0]) {
        setSelectedProfileId(list[0].id);
        loadActivity(list[0].id);
      }
      setStage("dashboard");
    } catch {
      setError("Something went wrong. Try again.");
    }
    setLoading(false);
  };

  const setPin = async () => {
    if (!/^\d{4}$/.test(pinInput)) {
      setError("Pick a 4-digit PIN.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/parent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-parent-pin": pinInput },
      body: JSON.stringify({ action: "set-pin", pin: pinInput }),
    });
    const d = await res.json();
    if (d.ok) {
      const list = await loadSummary(pinInput);
      setProfiles(list ?? []);
      if (list?.[0]) {
        setSelectedProfileId(list[0].id);
        loadActivity(list[0].id);
      }
      setStage("dashboard");
    } else {
      setError(d.error ?? "Could not set PIN");
    }
    setLoading(false);
  };

  const pickProfileActivity = (id: string) => {
    setSelectedProfileId(id);
    loadActivity(id);
  };

  // ----- PIN entry / setup screens -----
  if (stage === "loading") {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (stage === "pin" || stage === "setup") {
    const isSetup = stage === "setup";
    return (
      <div className="mx-auto w-full max-w-md px-4 pb-28 pt-10">
        <Button variant="ghost" size="sm" onClick={() => setView({ name: "home" })} className="mb-4 gap-1">
          <ArrowLeft className="h-4 w-4" /> Home
        </Button>
        <Card className="p-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-950/40">
            {isSetup ? <ShieldCheck className="h-8 w-8 text-violet-600" /> : <Lock className="h-8 w-8 text-violet-600" />}
          </div>
          <h1 className="font-display text-2xl font-bold">For Grown-ups</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSetup
              ? "Set a 4-digit PIN so only you can see the progress dashboard."
              : "Enter your PIN to see how your learner is doing."}
          </p>
          <div className="mt-5 flex flex-col items-center gap-3">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="• • • •"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
              onKeyDown={(e) => {
                if (e.key === "Enter") (isSetup ? setPin : verifyPin)();
              }}
              className="h-14 w-40 text-center font-display text-2xl font-bold tracking-[0.5em]"
            />
            {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
            <Button
              size="lg"
              onClick={isSetup ? setPin : verifyPin}
              disabled={loading || pinInput.length !== 4}
              className="gap-2 px-8"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
              {isSetup ? "Set PIN & enter" : "Unlock"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ----- Dashboard (multi-profile) -----
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-28 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setView({ name: "home" })} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Home
        </Button>
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
          🔒 Parent view
        </span>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-500 p-6 text-white shadow-lg">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">All Learners</h1>
        <p className="text-sm text-white/90">
          {profiles.length} {profiles.length === 1 ? "child" : "children"} · progress at a glance
        </p>
      </div>

      {profiles.length === 0 ? (
        <Card className="mt-6 p-6 text-center text-sm text-muted-foreground">
          No learner profiles yet. Add one from the home screen!
        </Card>
      ) : (
        <div className="mt-5 space-y-4">
          {profiles.map((p) => {
            const pct = p.totalLessons > 0 ? Math.round((p.completedLessons / p.totalLessons) * 100) : 0;
            const isPs = p.level === "preschool";
            return (
              <Card key={p.id} className="overflow-hidden p-0">
                <div className={cn("flex items-center gap-3 p-4", isPs ? "bg-rose-50 dark:bg-rose-950/20" : "bg-violet-50 dark:bg-violet-950/20")}>
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl text-2xl", isPs ? "bg-rose-200 dark:bg-rose-900/50" : "bg-violet-200 dark:bg-violet-900/50")}>
                    {isPs ? "🧸" : "🎓"}
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-lg font-bold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {isPs ? "Preschool" : "3rd Grade"} · {p.completedLessons}/{p.totalLessons} lessons
                    </p>
                  </div>
                  <div className="flex gap-3 text-center">
                    <div>
                      <p className="font-display text-lg font-bold text-amber-500">{p.totalStars}</p>
                      <p className="text-[10px] text-muted-foreground">stars</p>
                    </div>
                    <div>
                      <p className="font-display text-lg font-bold text-orange-500">{p.streak}</p>
                      <p className="text-[10px] text-muted-foreground">streak</p>
                    </div>
                    <div>
                      <p className="font-display text-lg font-bold text-emerald-500">{p.avgScore}%</p>
                      <p className="text-[10px] text-muted-foreground">avg</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground">Completion</span>
                    <span className="font-bold">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  {/* Domain breakdown bars */}
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {Object.entries(p.domains).map(([id, d]) => {
                      const dpct = d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0;
                      return (
                        <div key={id} className="rounded-lg bg-muted/50 p-2">
                          <div className="mb-1 flex items-center justify-between text-[10px]">
                            <span className="font-semibold text-muted-foreground">{id}</span>
                            <span className="font-bold">{d.completed}/{d.total}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${dpct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Activity timeline */}
      <Card className="mt-6 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display font-bold">Recent activity</h2>
          {profiles.length > 1 && (
            <select
              value={selectedProfileId ?? ""}
              onChange={(e) => pickProfileActivity(e.target.value)}
              className="rounded-lg border border-border bg-card px-2 py-1 text-xs font-semibold"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>
        {activity.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No activity yet. Encourage your learner to try a lesson!
          </p>
        ) : (
          <div className="nice-scroll max-h-80 space-y-2 overflow-y-auto">
            {activity.map((a) => {
              const dt = new Date(a.createdAt);
              const now = new Date();
              const sameDay = dt.toDateString() === now.toDateString();
              const time = sameDay
                ? dt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                : dt.toLocaleDateString([], { month: "short", day: "numeric" });
              const isGood = a.score >= 70;
              return (
                <div key={a.id} className="flex items-center gap-3 rounded-xl bg-muted/40 p-2.5">
                  <span className="text-2xl">{a.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.type === "daily" ? "Daily challenge" : a.type === "placement" ? "Placement test" : "Lesson"} · {a.correct}/{a.total} correct
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-display font-bold", isGood ? "text-emerald-600" : "text-amber-600")}>{a.score}%</p>
                    <p className="text-[10px] text-muted-foreground">{time}</p>
                  </div>
                  {a.stars > 0 && (
                    <span className="text-amber-400">{"★".repeat(a.stars)}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Tip: encourage daily practice and the Smart Review to grow mastery over time.
      </p>

      <Card className="mt-6 p-4">
        <h2 className="font-display font-bold">Family data & privacy</h2>
        <p className="mt-1 text-sm text-muted-foreground">Download a copy of the family's learning records or permanently erase them.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" onClick={async () => {
            const response = await fetch("/api/family-data", { headers: { "x-parent-pin": pinInput } });
            if (!response.ok) return setError("Unable to export family data.");
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url; link.download = `math-stars-family-data-${new Date().toISOString().slice(0, 10)}.json`; link.click();
            URL.revokeObjectURL(url);
          }}>Download family data</Button>
          <Button variant="destructive" onClick={async () => {
            const confirmation = prompt('Type "DELETE ALL FAMILY DATA" to permanently erase every learner profile and record.');
            if (confirmation !== "DELETE ALL FAMILY DATA") return;
            const response = await fetch("/api/family-data", {
              method: "DELETE",
              headers: { "Content-Type": "application/json", "x-parent-pin": pinInput },
              body: JSON.stringify({ confirmation }),
            });
            if (response.ok) window.location.reload(); else setError("Family data was not deleted.");
          }}>Delete all family data</Button>
          <a href="/privacy" className="inline-flex h-10 items-center px-3 text-sm font-semibold text-primary underline">Privacy details</a>
        </div>
      </Card>

      {/* Admin access (for the site owner) */}
      <div className="mt-4 text-center">
        <button
          onClick={() => setView({ name: "admin" })}
          className="text-xs font-semibold text-muted-foreground/60 underline hover:text-muted-foreground"
        >
          🛡️ Admin Panel
        </button>
      </div>
    </div>
  );
}
