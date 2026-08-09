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
  Trash2,
  Gift,
  CheckCircle2,
} from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { hasOfflineParentReport, sealOfflineParentReport, unlockOfflineParentReport } from "@/lib/offline/parent-vault";
import { clearOfflineDeviceData, loadSnapshot, saveSnapshot } from "@/lib/offline/database";
import { cn } from "@/lib/utils";
import { domainsForLevel, REWARD_PRESETS, type RewardMission, type RewardTargetType } from "@/lib/rewards";
import { ParentFeedbackCard } from "@/components/game/ParentFeedbackCard";

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
  arcadeCoins: number;
  arcadeWins: number;
  arcadeBestScore: number;
  arcadeSkills: Array<{
    gameKey: string;
    title: string;
    emoji: string;
    skill: string;
    plays: number;
    correctAnswers: number;
    totalAnswers: number;
    accuracy: number;
    bestScore: number;
  }>;
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
  coins: number;
  createdAt: string;
}

function parentGradeLabel(level: string) {
  if (level === "preschool") return "Preschool";
  if (level === "grade1") return "1st Grade";
  if (level === "grade2") return "2nd Grade";
  if (level === "grade4") return "4th Grade";
  return "3rd Grade";
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit, timeoutMs = 15_000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

export function ParentView() {
  const setView = useGameStore((s) => s.setView);
  const deleteProfile = useGameStore((s) => s.deleteProfile);
  const currentProfileId = useGameStore((s) => s.currentProfileId);
  const setActiveReward = useGameStore((s) => s.setReward);
  const [stage, setStage] = useState<"loading" | "pin" | "dashboard" | "setup">("loading");
  const [pinInput, setPinInput] = useState("");
  const [profiles, setProfiles] = useState<ProfileSummaryData[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [siteOwner, setSiteOwner] = useState(false);
  const [familyAccount, setFamilyAccount] = useState(false);
  const [reward, setReward] = useState<RewardMission | null>(null);
  const [rewardLoading, setRewardLoading] = useState(false);
  const [rewardTitle, setRewardTitle] = useState<string>(REWARD_PRESETS[0].title);
  const [rewardEmoji, setRewardEmoji] = useState(REWARD_PRESETS[0].emoji as string);
  const [rewardDescription, setRewardDescription] = useState("");
  const [rewardTarget, setRewardTarget] = useState<RewardTargetType>("lessons");
  const [rewardTargetValue, setRewardTargetValue] = useState(5);
  const [rewardDomainId, setRewardDomainId] = useState("");

  // First, check whether a PIN is set (via the summary endpoint).
  useEffect(() => {
    let cancelled = false;
    const refreshAccountCapability = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;
        setSiteOwner(data.accountType === "legacy");
        setFamilyAccount(data.accountType === "family");
      } catch {
        // An offline dashboard can still open from its encrypted cached report.
      }
    };

    void refreshAccountCapability();
    window.addEventListener("online", refreshAccountCapability);
    return () => {
      cancelled = true;
      window.removeEventListener("online", refreshAccountCapability);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!navigator.onLine) {
      hasOfflineParentReport().then((available) => { if (!cancelled) setStage(available ? "pin" : "setup"); }).catch(() => setStage("setup"));
      return () => { cancelled = true; };
    }
    fetch("/api/parent?summary=1")
      .then((r) => (r.status === 401 ? { error: "wrong-pin", hasPin: true } : r.json()))
      .then((d) => {
        if (cancelled || !d) return;
        if (d.error === "wrong-pin" || d.hasPin) setStage("pin");
        else setStage("setup");
      })
      .catch(() => { hasOfflineParentReport().then((available) => setStage(available ? "pin" : "setup")).catch(() => setStage("setup")); });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadSummary = async (pin: string) => {
    if (!navigator.onLine) return unlockOfflineParentReport<ProfileSummaryData[]>(pin);
    try {
      const res = await fetchWithTimeout("/api/parent?summary=1", { headers: { "x-parent-pin": pin } });
      if (res.status === 401) return null;
      const d = await res.json();
      if (!res.ok || d.error) return null;
      const profiles = (d.profiles ?? []) as ProfileSummaryData[];
      void sealOfflineParentReport(pin, profiles).catch(() => {});
      return profiles;
    } catch {
      return unlockOfflineParentReport<ProfileSummaryData[]>(pin);
    }
  };

  const loadActivity = async (profileId: string) => {
    try {
      const res = await fetch("/api/activity?limit=20", {
        headers: { "x-profile-id": profileId },
      });
      const d = await res.json();
      setActivity((d.events ?? []) as ActivityItem[]);
      await saveSnapshot(`parent-activity:${profileId}`, d.events ?? []).catch(() => {});
    } catch {
      setActivity(await loadSnapshot<ActivityItem[]>(`parent-activity:${profileId}`).catch(() => null) ?? []);
    }
  };

  const loadReward = async (profileId: string) => {
    try {
      const res = await fetch("/api/rewards", { headers: { "x-profile-id": profileId } });
      const data = await res.json();
      setReward(data.reward ?? null);
      await saveSnapshot(`parent-reward:${profileId}`, data.reward ?? null).catch(() => {});
    } catch {
      setReward(await loadSnapshot<RewardMission | null>(`parent-reward:${profileId}`).catch(() => null));
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
        loadReward(list[0].id);
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
    try {
      const res = await fetchWithTimeout("/api/parent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-parent-pin": pinInput },
        body: JSON.stringify({ action: "set-pin", pin: pinInput }),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok || !d?.ok) {
        setError(d?.error ?? "Could not set PIN. Please try again.");
        return;
      }

      const list = await loadSummary(pinInput);
      if (list === null) {
        setError("Your PIN was saved, but the dashboard could not load. Tap Set PIN & enter again.");
        return;
      }
      setProfiles(list);
      if (list[0]) {
        setSelectedProfileId(list[0].id);
        void loadActivity(list[0].id);
        void loadReward(list[0].id);
      }
      setStage("dashboard");
    } catch (requestError) {
      setError(requestError instanceof DOMException && requestError.name === "AbortError"
        ? "The request took too long. Please check your connection and try again."
        : "Could not set PIN. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const pickProfileActivity = (id: string) => {
    setSelectedProfileId(id);
    setRewardDomainId("");
    loadActivity(id);
    loadReward(id);
  };

  const saveReward = async () => {
    if (!selectedProfileId || !rewardTitle.trim()) return;
    const selected = profiles.find((profile) => profile.id === selectedProfileId);
    const defaultDomainId = domainsForLevel(selected?.level ?? "grade3")[0]?.id ?? "";
    setRewardLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-profile-id": selectedProfileId, "x-parent-pin": pinInput },
        body: JSON.stringify({
          action: "create",
          title: rewardTitle,
          emoji: rewardEmoji,
          description: rewardDescription,
          targetType: rewardTarget,
          targetValue: rewardTargetValue,
          domainId: rewardDomainId || defaultDomainId,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save reward");
      setReward(data.reward ?? null);
      if (selectedProfileId === currentProfileId) setActiveReward(data.reward ?? null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save reward");
    }
    setRewardLoading(false);
  };

  const closeReward = async (action: "claim" | "archive") => {
    if (!selectedProfileId || !reward) return;
    setRewardLoading(true);
    const response = await fetch("/api/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-profile-id": selectedProfileId, "x-parent-pin": pinInput },
      body: JSON.stringify({ action, rewardId: reward.id }),
    });
    if (response.ok) {
      setReward(null);
      if (selectedProfileId === currentProfileId) setActiveReward(null);
    }
    else setError("Could not update this reward. Please try again.");
    setRewardLoading(false);
  };

  const removeProfile = async (profile: ProfileSummaryData) => {
    const confirmation = window.prompt(
      `Deleting ${profile.name} permanently removes their lessons, stars, arcade coins, tutor history, and activity. Type DELETE ${profile.name} to continue.`
    );
    if (confirmation !== `DELETE ${profile.name}`) return;
    setDeletingId(profile.id);
    setError(null);
    const deleted = await deleteProfile(profile.id, pinInput);
    if (!deleted) {
      setError(`Could not delete ${profile.name}. Please unlock the parent area again and retry.`);
      setDeletingId(null);
      return;
    }
    const remaining = profiles.filter((item) => item.id !== profile.id);
    setProfiles(remaining);
    if (selectedProfileId === profile.id) {
      const nextId = remaining[0]?.id ?? null;
      setSelectedProfileId(nextId);
      if (nextId) loadActivity(nextId);
      else setActivity([]);
      if (nextId) loadReward(nextId);
      else setReward(null);
    }
    setDeletingId(null);
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
            const isSelected = selectedProfileId === p.id;
            return (
              <Card key={p.id} className={cn("overflow-hidden p-0 transition", isSelected && "ring-4 ring-fuchsia-400 ring-offset-2")}>
                <div className={cn("flex items-center gap-3 p-4", isPs ? "bg-rose-50 dark:bg-rose-950/20" : "bg-violet-50 dark:bg-violet-950/20")}>
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl text-2xl", isPs ? "bg-rose-200 dark:bg-rose-900/50" : "bg-violet-200 dark:bg-violet-900/50")}>
                    {isPs ? "🧸" : "🎓"}
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-lg font-bold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {parentGradeLabel(p.level)} · {p.completedLessons}/{p.totalLessons} lessons
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
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-fuchsia-200 bg-fuchsia-50 p-3 text-xs font-bold text-fuchsia-900 dark:border-fuchsia-900 dark:bg-fuchsia-950/30 dark:text-fuchsia-200">
                    <span className="text-lg" aria-hidden="true">🎮</span>
                    <span>{p.arcadeWins} arcade rounds</span>
                    <span aria-hidden="true">·</span>
                    <span>{p.arcadeCoins} coins</span>
                    <span aria-hidden="true">·</span>
                    <span>best {p.arcadeBestScore}%</span>
                  </div>
                  <div className="mt-3 rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold">Arcade skill report</p>
                      <p className="text-[10px] text-muted-foreground">Accuracy across finished rounds</p>
                    </div>
                    {p.arcadeWins === 0 ? (
                      <p className="mt-2 text-xs text-muted-foreground">No finished arcade rounds yet. Skill results will appear here after the first game.</p>
                    ) : (
                      <div className="mt-2 grid gap-2 sm:grid-cols-3">
                        {(p.arcadeSkills ?? []).filter((skill) => skill.plays > 0).map((skill) => (
                          <div key={skill.gameKey} className="rounded-lg bg-muted/50 p-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-xs font-bold"><span aria-hidden="true">{skill.emoji}</span> {skill.skill}</p>
                                <p className="text-[10px] text-muted-foreground">{skill.title} · {skill.plays} {skill.plays === 1 ? "round" : "rounds"}</p>
                              </div>
                              <span className={cn("text-sm font-black", skill.accuracy >= 80 ? "text-emerald-600" : skill.accuracy >= 60 ? "text-amber-600" : "text-rose-600")}>{skill.accuracy}%</span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-fuchsia-500" style={{ width: `${skill.accuracy}%` }} />
                            </div>
                            <p className="mt-1 text-[10px] text-muted-foreground">{skill.correctAnswers}/{skill.totalAnswers} correct · best {skill.bestScore}%</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                    <Button
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => pickProfileActivity(p.id)}
                      aria-pressed={isSelected}
                      className="gap-1.5"
                    >
                      <Gift className="h-4 w-4" />
                      {isSelected ? `Managing ${p.name}` : `Manage ${p.name}'s reward`}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeProfile(p)}
                      disabled={deletingId === p.id}
                      className="gap-1.5"
                    >
                      {deletingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Delete {p.name}&apos;s profile
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {selectedProfileId && (() => {
        const selected = profiles.find((profile) => profile.id === selectedProfileId);
        const domains = domainsForLevel(selected?.level ?? "grade3");
        const selectedDomain = rewardDomainId || domains[0]?.id || "";
        return (
          <Card className="mt-6 overflow-hidden p-0">
            <div className="bg-gradient-to-r from-fuchsia-600 to-amber-500 p-5 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20"><Gift className="h-7 w-7" /></span>
                <div>
                  <h2 className="font-display text-xl font-bold">Real-world rewards</h2>
                  <p className="text-sm text-white/90">Managing {selected?.name ?? "your learner"} · {parentGradeLabel(selected?.level ?? "grade3")}</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              {reward ? (
                <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/30">
                  <div className="flex items-start gap-3">
                    <span className="text-4xl" aria-hidden="true">{reward.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-bold">{reward.title}</p>
                      {reward.description && <p className="text-sm text-muted-foreground">{reward.description}</p>}
                      <p className="mt-1 text-sm font-semibold">
                        {reward.status === "earned" ? "Goal complete. This reward is ready!" : `${reward.currentValue} of ${reward.targetValue} ${reward.targetType === "topic" ? "topic lessons" : reward.targetType}`}
                      </p>
                    </div>
                    {reward.status === "earned" && <CheckCircle2 className="h-7 w-7 text-emerald-600" />}
                  </div>
                  <Progress value={reward.percent} className="mt-3 h-3" />
                  <div className="mt-4 flex flex-wrap gap-2">
                    {reward.status === "earned" && <Button onClick={() => closeReward("claim")} disabled={rewardLoading}>Mark reward given</Button>}
                    <Button variant="outline" onClick={() => closeReward("archive")} disabled={rewardLoading}>Replace this reward</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <p className="mb-2 text-sm font-bold">Choose a reward</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {REWARD_PRESETS.map((preset) => (
                        <button key={preset.title} type="button" onClick={() => { setRewardTitle(preset.title); setRewardEmoji(preset.emoji); }} className={cn("rounded-xl border p-3 text-left text-sm font-semibold transition-colors", rewardTitle === preset.title ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" : "border-border hover:bg-muted/50")}>
                          <span className="mr-2 text-xl">{preset.emoji}</span>{preset.title}
                        </button>
                      ))}
                      <button type="button" onClick={() => { setRewardTitle(""); setRewardEmoji("🎁"); }} className="rounded-xl border border-dashed border-border p-3 text-left text-sm font-semibold hover:bg-muted/50"><span className="mr-2 text-xl">🎁</span>Custom reward</button>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-[90px_1fr]">
                      <Input aria-label="Reward emoji" value={rewardEmoji} onChange={(event) => setRewardEmoji(event.target.value)} maxLength={8} className="text-center text-xl" />
                      <Input aria-label="Reward title" value={rewardTitle} onChange={(event) => setRewardTitle(event.target.value)} maxLength={60} placeholder="What will they earn?" />
                    </div>
                    <Input className="mt-2" value={rewardDescription} onChange={(event) => setRewardDescription(event.target.value)} maxLength={160} placeholder="Optional note, such as Saturday after lunch" />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-bold">Choose the goal</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {(["lessons", "stars", "topic", "arcade-wins", "coins"] as RewardTargetType[]).map((target) => (
                        <button key={target} type="button" onClick={() => setRewardTarget(target)} className={cn("rounded-xl border px-2 py-3 text-sm font-bold capitalize", rewardTarget === target ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300" : "border-border")}>
                          {target === "topic" ? "Finish a topic" : target === "lessons" ? "Complete lessons" : target === "stars" ? "Earn stars" : target === "arcade-wins" ? "Finish arcade rounds" : "Earn arcade coins"}
                        </button>
                      ))}
                    </div>
                    {rewardTarget === "topic" ? (
                      <select value={selectedDomain} onChange={(event) => setRewardDomainId(event.target.value)} className="mt-3 h-11 w-full rounded-lg border border-border bg-card px-3 text-sm font-semibold">
                        {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.title}</option>)}
                      </select>
                    ) : (
                      <div className="mt-3 flex items-center gap-3">
                        <label htmlFor="reward-target-value" className="text-sm font-semibold">How many {rewardTarget}?</label>
                        <Input id="reward-target-value" type="number" min={1} max={100} value={rewardTargetValue} onChange={(event) => setRewardTargetValue(Number(event.target.value))} className="w-24" />
                      </div>
                    )}
                  </div>
                  <Button onClick={saveReward} disabled={rewardLoading || !rewardTitle.trim()} className="w-full gap-2">
                    {rewardLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />} Set reward mission for {selected?.name}
                  </Button>
                  <p className="text-xs text-muted-foreground">New goals begin from today. Past lessons, stars, arcade rounds, and coins do not count toward a new reward.</p>
                </div>
              )}
            </div>
          </Card>
        );
      })()}

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
                      {a.type === "daily" ? "Daily challenge" : a.type === "placement" ? "Placement test" : a.type === "arcade" ? "Math arcade" : "Lesson"} · {a.correct}/{a.total} correct{a.coins > 0 ? ` · +${a.coins} coins` : ""}
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

      {error && <p className="mt-4 text-center text-sm font-semibold text-rose-600">{error}</p>}

      <ParentFeedbackCard
        parentPin={pinInput}
        learnerLevel={profiles.find((profile) => profile.id === selectedProfileId)?.level ?? null}
        familyAccount={familyAccount}
      />

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
            if (response.ok) { await clearOfflineDeviceData(); window.location.reload(); } else setError("Family data was not deleted.");
          }}>Delete all family data</Button>
          {familyAccount && <Button variant="destructive" onClick={async () => {
            const confirmation = prompt('Type "DELETE MY FAMILY ACCOUNT" to remove the parent account, learner profiles, progress, tutor history, and device records.');
            if (confirmation !== "DELETE MY FAMILY ACCOUNT") return;
            const password = prompt("Enter your family account password to confirm:");
            if (!password) return;
            const response = await fetch("/api/account", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ confirmation, password }),
            });
            if (response.ok) { await clearOfflineDeviceData(); window.location.reload(); } else setError("The family account was not deleted. Check the password and try again.");
          }}>Delete family account</Button>}
          <a href="/privacy" className="inline-flex h-10 items-center px-3 text-sm font-semibold text-primary underline">Privacy details</a>
        </div>
      </Card>

      {/* Admin access (for the site owner) */}
      {siteOwner && <div className="mt-4 text-center">
        <button
          onClick={() => setView({ name: "admin" })}
          className="text-xs font-semibold text-muted-foreground/60 underline hover:text-muted-foreground"
        >
          🛡️ Admin Panel
        </button>
      </div>}
    </div>
  );
}
