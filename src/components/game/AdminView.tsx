"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Lock, ShieldCheck, Loader2, Users, BarChart3, ToggleLeft,
  Activity, Settings as SettingsIcon, Trash2, RotateCcw, Edit3, Check, X,
  AlertTriangle, TrendingUp, Star, Zap, MessageSquare, Database,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line,
} from "recharts";
import { useGameStore } from "@/store/useGameStore";
import { cn } from "@/lib/utils";

type Tab = "users" | "analytics" | "features" | "system" | "settings";

interface SiteSettings {
  hasAdminPin: boolean;
  dailyChallengeEnabled: boolean;
  aiTutorEnabled: boolean;
  voiceAnswersEnabled: boolean;
  worksheetsEnabled: boolean;
  manipulativesEnabled: boolean;
  soundEffectsEnabled: boolean;
  cashappHandle: string;
  zelleInfo: string;
  broadcastMessage: string | null;
  broadcastActive: boolean;
}

export function AdminView() {
  const setView = useGameStore((s) => s.setView);
  const [stage, setStage] = useState<"loading" | "pin" | "panel" | "setup">("loading");
  const [pinInput, setPinInput] = useState("");
  const [tab, setTab] = useState<Tab>("analytics");
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if admin PIN is set.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setSettings(d);
        if (d.hasAdminPin) setStage("pin");
        else setStage("setup");
      })
      .catch(() => setStage("setup"));
    return () => { cancelled = true; };
  }, []);

  const verifyPin = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/settings?pin=${encodeURIComponent(pinInput)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify-pin" }),
    });
    if (res.status === 401) {
      setError("Wrong admin PIN.");
      setLoading(false);
      return;
    }
    sessionStorage.setItem("admin-pin", pinInput);
    setStage("panel");
    setLoading(false);
  };

  const setPin = async () => {
    if (!/^\d{4}$/.test(pinInput)) {
      setError("Pick a 4-digit PIN.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set-pin", pin: pinInput }),
    });
    const d = await res.json();
    if (d.ok) {
      sessionStorage.setItem("admin-pin", pinInput);
      setSettings({ ...settings, hasAdminPin: true } as SiteSettings);
      setStage("panel");
    } else {
      setError(d.error ?? "Failed");
    }
    setLoading(false);
  };

  // ---- PIN/setup screens ----
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
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-700 text-white">
            {isSetup ? <ShieldCheck className="h-8 w-8" /> : <Lock className="h-8 w-8" />}
          </div>
          <h1 className="font-display text-2xl font-bold">Admin Panel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSetup
              ? "Set a 4-digit admin PIN. This is separate from the parent PIN and controls the whole site."
              : "Enter your admin PIN to manage Math Stars."}
          </p>
          <div className="mt-5 flex flex-col items-center gap-3">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="• • • •"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
              onKeyDown={(e) => { if (e.key === "Enter") (isSetup ? setPin : verifyPin)(); }}
              className="h-14 w-40 text-center font-display text-2xl font-bold tracking-[0.5em]"
            />
            {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
            <Button size="lg" onClick={isSetup ? setPin : verifyPin} disabled={loading || pinInput.length !== 4} className="gap-2 px-8">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
              {isSetup ? "Set admin PIN" : "Unlock"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ---- Admin panel ----
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setView({ name: "home" })} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Home
        </Button>
        <Badge className="bg-slate-700 text-white hover:bg-slate-700">🛡️ Admin</Badge>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 text-white shadow-lg">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Admin Panel</h1>
        <p className="text-sm text-white/80">Manage learners, monitor usage, and control features.</p>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "analytics"} onClick={() => setTab("analytics")} icon={<BarChart3 className="h-4 w-4" />} label="Analytics" />
        <TabButton active={tab === "users"} onClick={() => setTab("users")} icon={<Users className="h-4 w-4" />} label="Users" />
        <TabButton active={tab === "features"} onClick={() => setTab("features")} icon={<ToggleLeft className="h-4 w-4" />} label="Features" />
        <TabButton active={tab === "system"} onClick={() => setTab("system")} icon={<Activity className="h-4 w-4" />} label="System" />
        <TabButton active={tab === "settings"} onClick={() => setTab("settings")} icon={<SettingsIcon className="h-4 w-4" />} label="Settings" />
      </div>

      <div className="mt-5">
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "users" && <UsersTab />}
        {tab === "features" && <FeaturesTab settings={settings} setSettings={setSettings} />}
        {tab === "system" && <SystemTab />}
        {tab === "settings" && <SettingsTab settings={settings} setSettings={setSettings} />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// ---- Analytics tab ----
interface AnalyticsData {
  totalLearners: number;
  activeLearners: number;
  totalEvents: number;
  events7: number;
  events30: number;
  avgScore: number;
  totalStars: number;
  totalLessonsCompleted: number;
  popularLessons: Array<{ lessonId: string; title: string; emoji: string; attempts: number; avgScore: number; completions: number }>;
  dailyTotal: number;
  daily7: number;
  tutorMessages: number;
  domainStats: Array<{ id: string; title: string; emoji: string; completed: number; total: number }>;
  activityByDay: Array<{ date: string; count: number }>;
}

function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use the parent PIN from localStorage if available (shared flow)
    const pin = ""; // admin pin is passed via query; we need it
    // Actually, the admin panel already verified the PIN. Let me read it from a shared state.
    // For simplicity, we'll prompt for the pin via a stored value.
    const storedPin = typeof window !== "undefined" ? sessionStorage.getItem("admin-pin") ?? "" : "";
    fetch(`/api/admin/analytics?pin=${encodeURIComponent(storedPin)}`)
      .then((r) => r.json())
      .then((d) => { if (!d.error) setData(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!data) return <p className="text-center text-sm text-muted-foreground">Unable to load analytics.</p>;

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Users className="h-5 w-5 text-violet-500" />} label="Learners" value={data.totalLearners} sub={`${data.activeLearners} active (7d)`} />
        <Stat icon={<Activity className="h-5 w-5 text-emerald-500" />} label="Sessions" value={data.totalEvents} sub={`${data.events7} this week`} />
        <Stat icon={<Star className="h-5 w-5 text-amber-500" />} label="Stars earned" value={data.totalStars} sub={`${data.totalLessonsCompleted} lessons done`} />
        <Stat icon={<TrendingUp className="h-5 w-5 text-rose-500" />} label="Avg score" value={`${data.avgScore}%`} sub={`${data.tutorMessages} tutor msgs`} />
      </div>

      {/* Activity trend */}
      <Card className="p-4">
        <h3 className="mb-3 font-display font-bold">Activity (last 14 days)</h3>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.activityByDay.map((d) => ({ date: d.date.slice(5), count: d.count }))}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Domain completion */}
      <Card className="p-4">
        <h3 className="mb-3 font-display font-bold">Domain completion (all learners)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.domainStats.map((d) => ({ name: `${d.emoji} ${d.title.split(" ")[0]}`, completed: d.completed, total: d.total }))}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground" angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="completed" radius={[4, 4, 0, 0]} className="fill-violet-500" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Popular lessons */}
      <Card className="p-4">
        <h3 className="mb-3 font-display font-bold">Most-played lessons</h3>
        <div className="nice-scroll max-h-72 space-y-1.5 overflow-y-auto">
          {data.popularLessons.length === 0 ? (
            <p className="text-sm text-muted-foreground">No lessons played yet.</p>
          ) : (
            data.popularLessons.map((l, i) => (
              <div key={l.lessonId} className="flex items-center gap-2 rounded-lg bg-muted/40 p-2">
                <span className="w-5 text-center font-bold text-muted-foreground">{i + 1}</span>
                <span className="text-lg">{l.emoji}</span>
                <span className="flex-1 truncate text-sm font-medium">{l.title}</span>
                <span className="text-xs text-muted-foreground">{l.attempts} tries</span>
                <span className="font-display text-sm font-bold text-emerald-600">{l.avgScore}%</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number | string; sub?: string }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2">{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}

// ---- Users tab ----
interface UserData {
  id: string; name: string; avatar: string; level: string;
  totalStars: number; streak: number; completedLessons: number; totalLessons: number;
  avgScore: number; lastPlayedAt: string | null; createdAt: string;
  eventCount: number; hasParentPin: boolean;
}

function UsersTab() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const load = () => {
    const pin = typeof window !== "undefined" ? sessionStorage.getItem("admin-pin") ?? "" : "";
    fetch(`/api/admin/users?pin=${encodeURIComponent(pin)}`)
      .then((r) => r.json())
      .then((d) => { if (d.users) setUsers(d.users); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const action = async (profileId: string, act: string, extra?: Record<string, unknown>) => {
    const pin = sessionStorage.getItem("admin-pin") ?? "";
    if (act === "delete" && !confirm(`Delete this profile permanently? This cannot be undone.`)) return;
    if (act === "reset" && !confirm(`Reset all progress for this profile?`)) return;
    const res = await fetch(`/api/admin/users?pin=${encodeURIComponent(pin)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, action: act, ...extra }),
    });
    const d = await res.json();
    if (d.ok) { load(); setEditing(null); }
  };

  if (loading) return <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <Card className="p-4">
      <h3 className="mb-3 font-display font-bold">All learners ({users.length})</h3>
      <div className="nice-scroll max-h-[500px] space-y-2 overflow-y-auto">
        {users.map((u) => (
          <div key={u.id} className="rounded-xl border border-border p-3">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl text-xl", u.level === "preschool" ? "bg-rose-100 dark:bg-rose-950/30" : "bg-violet-100 dark:bg-violet-950/30")}>
                {u.level === "preschool" ? "🧸" : "🎓"}
              </div>
              <div className="flex-1">
                {editing === u.id ? (
                  <div className="flex items-center gap-2">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 w-40" />
                    <Button size="sm" onClick={() => action(u.id, "rename", { name: editName })} className="h-8 gap-1"><Check className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(null)} className="h-8"><X className="h-3 w-3" /></Button>
                  </div>
                ) : (
                  <>
                    <p className="font-display font-bold">{u.name} {u.hasParentPin && <Lock className="ml-1 inline h-3 w-3 text-muted-foreground" />}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.level === "preschool" ? "Preschool" : "3rd Grade"} · {u.completedLessons}/{u.totalLessons} lessons · ⭐{u.totalStars} · {u.avgScore}% avg
                    </p>
                  </>
                )}
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditing(u.id); setEditName(u.name); }} title="Rename" className="rounded-lg bg-muted p-2 text-muted-foreground hover:bg-muted/70">
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => action(u.id, "change-level", { level: u.level === "preschool" ? "grade3" : "preschool" })} title="Switch level" className="rounded-lg bg-muted p-2 text-muted-foreground hover:bg-muted/70">
                  <Zap className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => action(u.id, "reset")} title="Reset progress" className="rounded-lg bg-amber-100 p-2 text-amber-600 hover:bg-amber-200 dark:bg-amber-950/40">
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => action(u.id, "delete")} title="Delete" className="rounded-lg bg-rose-100 p-2 text-rose-600 hover:bg-rose-200 dark:bg-rose-950/40">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---- Features tab ----
function FeaturesTab({ settings, setSettings }: { settings: SiteSettings | null; setSettings: (s: SiteSettings) => void }) {
  const [saving, setSaving] = useState<string | null>(null);

  const toggle = async (key: keyof SiteSettings) => {
    if (!settings) return;
    const newVal = !settings[key];
    setSettings({ ...settings, [key]: newVal });
    setSaving(key as string);
    const pin = sessionStorage.getItem("admin-pin") ?? "";
    await fetch(`/api/admin/settings?pin=${encodeURIComponent(pin)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: newVal }),
    });
    setSaving(null);
  };

  if (!settings) return null;

  const flags: Array<{ key: keyof SiteSettings; label: string; desc: string; emoji: string }> = [
    { key: "dailyChallengeEnabled", label: "Daily Challenge", desc: "5-question mixed quiz per day", emoji: "⚡" },
    { key: "aiTutorEnabled", label: "AI Tutor (Pip)", desc: "Chat with the AI math buddy", emoji: "🦊" },
    { key: "voiceAnswersEnabled", label: "Voice Answers", desc: "Mic button on number questions", emoji: "🎤" },
    { key: "worksheetsEnabled", label: "Printable Worksheets", desc: "Generate offline practice sheets", emoji: "🖨️" },
    { key: "manipulativesEnabled", label: "Drag Manipulatives", desc: "Build-the-groups drag activity", emoji: "🧮" },
    { key: "soundEffectsEnabled", label: "Sound Effects", desc: "Ding on correct, buzz on wrong", emoji: "🔊" },
  ];

  return (
    <Card className="p-4">
      <h3 className="mb-3 font-display font-bold">Feature flags</h3>
      <p className="mb-4 text-sm text-muted-foreground">Toggle features on/off for the whole site. Changes take effect immediately.</p>
      <div className="space-y-2">
        {flags.map((f) => (
          <div key={f.key as string} className="flex items-center gap-3 rounded-xl border border-border p-3">
            <span className="text-2xl">{f.emoji}</span>
            <div className="flex-1">
              <p className="font-display font-bold">{f.label}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
            <button
              onClick={() => toggle(f.key)}
              disabled={saving === (f.key as string)}
              className={cn(
                "relative h-7 w-12 rounded-full transition-colors",
                settings[f.key] ? "bg-emerald-500" : "bg-muted"
              )}
            >
              <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white transition-transform", settings[f.key] ? "translate-x-6" : "translate-x-1")} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---- System tab ----
function SystemTab() {
  const [data, setData] = useState<{ dbStats: Record<string, number>; recentErrors: Array<{ id: string; route: string; method: string; message: string; detail: string | null; createdAt: string }>; errorsByRoute: Array<{ route: string; count: number }>; serverTime: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pin = sessionStorage.getItem("admin-pin") ?? "";
    fetch(`/api/admin/system?pin=${encodeURIComponent(pin)}`)
      .then((r) => r.json())
      .then((d) => { if (d.dbStats) setData(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!data) return <p className="text-center text-sm text-muted-foreground">Unable to load system info.</p>;

  const tables = [
    { name: "Students", count: data.dbStats.students, icon: "👤" },
    { name: "Lesson Progress", count: data.dbStats.lessonProgress, icon: "📊" },
    { name: "Daily Challenges", count: data.dbStats.dailyChallenges, icon: "⚡" },
    { name: "Achievements", count: data.dbStats.achievements, icon: "🏆" },
    { name: "Tutor Messages", count: data.dbStats.tutorMessages, icon: "🦊" },
    { name: "Activity Events", count: data.dbStats.activityEvents, icon: "📅" },
    { name: "Error Logs", count: data.dbStats.errorLogs, icon: "⚠️" },
  ];

  return (
    <div className="space-y-4">
      {/* DB stats */}
      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Database className="h-5 w-5 text-violet-500" />
          <h3 className="font-display font-bold">Database</h3>
          <span className="ml-auto text-xs text-muted-foreground">{data.serverTime}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {tables.map((t) => (
            <div key={t.name} className="rounded-xl bg-muted/40 p-3 text-center">
              <div className="text-xl">{t.icon}</div>
              <p className="font-display text-lg font-bold tabular-nums">{t.count}</p>
              <p className="text-[10px] text-muted-foreground">{t.name}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Error log */}
      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h3 className="font-display font-bold">Error log</h3>
          {data.errorsByRoute.length > 0 && (
            <div className="ml-auto flex gap-2">
              {data.errorsByRoute.map((e) => (
                <span key={e.route} className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
                  {e.route}: {e.count}
                </span>
              ))}
            </div>
          )}
        </div>
        {data.recentErrors.length === 0 ? (
          <p className="py-4 text-center text-sm text-emerald-600">✅ No errors logged. All clear!</p>
        ) : (
          <div className="nice-scroll max-h-64 space-y-1.5 overflow-y-auto">
            {data.recentErrors.map((e) => (
              <div key={e.id} className="rounded-lg bg-rose-50 p-2 dark:bg-rose-950/20">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-rose-600">{e.method} {e.route}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-rose-800 dark:text-rose-200">{e.message}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ---- Settings tab ----
function SettingsTab({ settings, setSettings }: { settings: SiteSettings | null; setSettings: (s: SiteSettings) => void }) {
  // Lazy-init from settings (no effect needed — the key prop on the parent
  // forces a remount if settings change).
  const [cashapp, setCashapp] = useState(() => settings?.cashappHandle ?? "");
  const [zelle, setZelle] = useState(() => settings?.zelleInfo ?? "");
  const [broadcast, setBroadcast] = useState(() => settings?.broadcastMessage ?? "");
  const [broadcastActive, setBroadcastActive] = useState(() => settings?.broadcastActive ?? false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    const pin = sessionStorage.getItem("admin-pin") ?? "";
    await fetch(`/api/admin/settings?pin=${encodeURIComponent(pin)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cashappHandle: cashapp,
        zelleInfo: zelle,
        broadcastMessage: broadcast || null,
        broadcastActive,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!settings) return null;

  return (
    <div className="space-y-4">
      {/* Donation handles */}
      <Card className="p-4">
        <h3 className="mb-3 font-display font-bold">Donation handles</h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-semibold">Cash App handle</label>
            <Input value={cashapp} onChange={(e) => setCashapp(e.target.value)} placeholder="$yourhandle" className="h-11" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Zelle email/phone</label>
            <Input value={zelle} onChange={(e) => setZelle(e.target.value)} placeholder="you@example.com" className="h-11" />
          </div>
        </div>
      </Card>

      {/* Broadcast message */}
      <Card className="p-4">
        <h3 className="mb-3 font-display font-bold">Broadcast banner</h3>
        <p className="mb-3 text-sm text-muted-foreground">Show a message to all families at the top of the home screen.</p>
        <Input value={broadcast} onChange={(e) => setBroadcast(e.target.value)} placeholder="e.g. New lessons coming soon!" className="mb-3 h-11" />
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={broadcastActive} onChange={(e) => setBroadcastActive(e.target.checked)} className="h-4 w-4" />
          Show banner to families
        </label>
      </Card>

      <Button onClick={save} className="w-full gap-2">
        {saved ? <><Check className="h-5 w-5" /> Saved!</> : "Save settings"}
      </Button>

      {/* Admin PIN management */}
      <Card className="p-4">
        <h3 className="mb-3 font-display font-bold">Admin PIN</h3>
        <p className="mb-3 text-sm text-muted-foreground">Change or clear the admin PIN. The parent dashboard PIN is separate.</p>
        <Button variant="outline" onClick={() => {
          const pin = sessionStorage.getItem("admin-pin") ?? "";
          const newPin = prompt("Enter a new 4-digit admin PIN:");
          if (newPin && /^\d{4}$/.test(newPin)) {
            fetch("/api/admin/settings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "set-pin", pin: newPin }),
            }).then(() => { sessionStorage.setItem("admin-pin", newPin); alert("Admin PIN updated!"); });
          }
        }} className="gap-2">
          <Lock className="h-4 w-4" /> Change admin PIN
        </Button>
      </Card>
    </div>
  );
}
