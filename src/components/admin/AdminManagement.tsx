"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Database,
  Edit3,
  Gamepad2,
  Gauge,
  Laptop,
  Loader2,
  Lock,
  Megaphone,
  Mic,
  MonitorSmartphone,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserRound,
  Users,
  Volume2,
  Wifi,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { SiteSettings } from "@/components/admin/admin-types";
import { cn } from "@/lib/utils";

interface FamilyAccountData {
  id: string;
  displayName: string;
  email: string;
  status: string;
  learners: number;
  deviceCount: number;
  createdAt: string;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  devices: Array<{ id: string; deviceType: string; platform: string; browser: string; launchMode: string; installed: boolean; lastSeenAt: string; visitCount: number }>;
}

interface UserData {
  id: string;
  name: string;
  avatar: string;
  level: string;
  totalStars: number;
  streak: number;
  completedLessons: number;
  totalLessons: number;
  avgScore: number;
  lastPlayedAt: string | null;
  createdAt: string;
  eventCount: number;
  hasParentPin: boolean;
}

export function AdminFamilies() {
  const [accounts, setAccounts] = useState<FamilyAccountData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "suspended" | "inactive">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/admin/accounts", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setAccounts(data.accounts ?? []);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  const changeStatus = async (account: FamilyAccountData) => {
    const action = account.status === "active" ? "suspend" : "activate";
    if (!window.confirm(`${action === "suspend" ? "Suspend" : "Reactivate"} ${account.displayName}'s account?`)) return;
    setUpdating(account.id);
    try {
      const response = await fetch("/api/admin/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId: account.id, action }) });
      if (response.ok) await load();
    } finally { setUpdating(null); }
  };

  const filtered = useMemo(() => accounts.filter((account) => {
    const matchesQuery = `${account.displayName} ${account.email}`.toLowerCase().includes(query.toLowerCase());
    const inactive = !account.lastActiveAt || Date.now() - new Date(account.lastActiveAt).getTime() > 7 * 86400000;
    const matchesFilter = filter === "all" || (filter === "inactive" ? inactive : account.status === filter);
    return matchesQuery && matchesFilter;
  }), [accounts, filter, query]);

  if (loading) return <LoadingPanel label="Loading family accounts" />;
  if (error) return <RetryPanel title="Family accounts could not be loaded" onRetry={() => void load()} />;

  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-3"><SummaryCard icon={<Users />} label="Family accounts" value={accounts.length} /><SummaryCard icon={<Wifi />} label="Active this week" value={accounts.filter((account) => account.lastActiveAt && Date.now() - new Date(account.lastActiveAt).getTime() <= 7 * 86400000).length} /><SummaryCard icon={<AlertTriangle />} label="Need attention" value={accounts.filter((account) => account.status !== "active" || !account.lastActiveAt || Date.now() - new Date(account.lastActiveAt).getTime() > 7 * 86400000).length} /></div>
    <Panel>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div><h2 className="text-lg font-black">All families</h2><p className="mt-1 text-sm text-[#68738b]">Search, review activity, inspect devices, and manage access.</p></div>
        <div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b8498]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or email" className="h-10 rounded-lg border-[#dcd9d2] bg-[#fbfaf7] pl-9 sm:w-64" /></div><select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="h-10 rounded-lg border border-[#dcd9d2] bg-white px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#7048e8]"><option value="all">All accounts</option><option value="active">Active status</option><option value="suspended">Suspended</option><option value="inactive">Inactive 7+ days</option></select></div>
      </div>
      <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="border-b border-[#e6e3dd] text-xs font-semibold text-[#68738b]"><tr><th className="pb-3">Family</th><th className="pb-3">Last active</th><th className="pb-3 text-center">Learners</th><th className="pb-3 text-center">Devices</th><th className="pb-3">Status</th><th className="pb-3 text-right">Details</th></tr></thead><tbody className="divide-y divide-[#ece9e3]">{filtered.map((account) => <FamilyRow key={account.id} account={account} expanded={expanded === account.id} onExpand={() => setExpanded(expanded === account.id ? null : account.id)} onStatus={() => void changeStatus(account)} updating={updating === account.id} />)}</tbody></table>{filtered.length === 0 && <EmptyState text="No family accounts match this view." />}</div>
    </Panel>
  </div>;
}

function FamilyRow({ account, expanded, onExpand, onStatus, updating }: { account: FamilyAccountData; expanded: boolean; onExpand: () => void; onStatus: () => void; updating: boolean }) {
  return <>
    <tr className="hover:bg-[#fbfaf7]"><td className="py-3"><div className="flex items-center gap-3"><span className={cn("h-2.5 w-2.5 rounded-full", account.lastActiveAt && Date.now() - new Date(account.lastActiveAt).getTime() < 5 * 60000 ? "bg-[#56a644] ring-4 ring-[#eaf6e6]" : "bg-[#c5c8cf]")} /><div><p className="font-black">{account.displayName}</p><p className="text-xs text-[#788196]">{account.email}</p></div></div></td><td>{relativeTime(account.lastActiveAt)}</td><td className="text-center font-bold">{account.learners}</td><td className="text-center font-bold">{account.deviceCount}</td><td><Status status={account.status} /></td><td className="text-right"><button onClick={onExpand} aria-expanded={expanded} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-black text-[#7048e8] hover:bg-[#f2eeff]">{expanded ? "Close" : "Review"}<ChevronDown className={cn("h-4 w-4 transition", expanded && "rotate-180")} /></button></td></tr>
    {expanded && <tr><td colSpan={6} className="bg-[#f7f5f1] p-4"><motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-[#68738b]">Joined {new Date(account.createdAt).toLocaleDateString()} · Last login {relativeTime(account.lastLoginAt)}</p><Button size="sm" variant={account.status === "active" ? "destructive" : "default"} onClick={onStatus} disabled={updating} className="h-9 rounded-lg">{updating && <Loader2 className="h-4 w-4 animate-spin" />}{account.status === "active" ? "Suspend account" : "Reactivate account"}</Button></div><div className="mt-4 grid gap-2 lg:grid-cols-2">{account.devices.length ? account.devices.map((device) => <div key={device.id} className="flex items-center gap-3 rounded-xl border border-[#e0ddd7] bg-white p-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efeaff] text-[#7048e8]"><MonitorSmartphone className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black capitalize">{device.deviceType} · {device.platform}</p><p className="truncate text-xs text-[#717b91]">{device.browser} · {device.launchMode} · {device.visitCount} visits · {relativeTime(device.lastSeenAt)}</p></div>{device.installed && <span className="rounded-full bg-[#e8f5e8] px-2 py-1 text-[10px] font-black text-[#39794b]">Installed</span>}</div>) : <EmptyState text="No device activity has been recorded." />}</div></motion.div></td></tr>}
  </>;
}

export function AdminLearners() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try { const response = await fetch("/api/admin/users", { cache: "no-store" }); if (!response.ok) throw new Error(); const data = await response.json(); setUsers(data.users ?? []); }
    catch { setError(true); } finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  const action = async (profileId: string, actionName: string, extra?: Record<string, unknown>) => {
    if (actionName === "delete" && !window.confirm("Delete this learner profile permanently? This cannot be undone.")) return;
    if (actionName === "reset" && !window.confirm("Reset all saved learning progress for this learner?")) return;
    setWorking(profileId);
    try {
      const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profileId, action: actionName, ...extra }) });
      if (response.ok) { setEditing(null); await load(); }
    } finally { setWorking(null); }
  };

  const filtered = useMemo(() => users.filter((user) => user.name.toLowerCase().includes(query.toLowerCase()) && (levelFilter === "all" || user.level === levelFilter)), [levelFilter, query, users]);
  if (loading) return <LoadingPanel label="Loading learners" />;
  if (error) return <RetryPanel title="Learner profiles could not be loaded" onRetry={() => void load()} />;

  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><SummaryCard icon={<UserRound />} label="Learners" value={users.length} /><SummaryCard icon={<Gauge />} label="Average mastery" value={`${users.length ? Math.round(users.reduce((sum, user) => sum + user.avgScore, 0) / users.length) : 0}%`} /><SummaryCard icon={<AlertTriangle />} label="Inactive 7+ days" value={users.filter((user) => !user.lastPlayedAt || Date.now() - new Date(user.lastPlayedAt).getTime() > 7 * 86400000).length} /></div><Panel><div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div><h2 className="text-lg font-black">Learner profiles</h2><p className="mt-1 text-sm text-[#68738b]">Review achievement, grade placement, mastery, and recent activity.</p></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b8498]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search learners" className="h-10 rounded-lg border-[#dcd9d2] bg-[#fbfaf7] pl-9 sm:w-56" /></div><select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)} className="h-10 rounded-lg border border-[#dcd9d2] bg-white px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#7048e8]"><option value="all">All grade levels</option><option value="preschool">Preschool</option><option value="grade1">Grade 1</option><option value="grade2">Grade 2</option><option value="grade3">Grade 3</option><option value="grade4">Grade 4</option></select></div></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-[#e6e3dd] text-xs font-semibold text-[#68738b]"><tr><th className="pb-3">Learner</th><th className="pb-3">Grade</th><th className="pb-3">Progress</th><th className="pb-3">Mastery</th><th className="pb-3">Last active</th><th className="pb-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-[#ece9e3]">{filtered.map((user) => <tr key={user.id} className="hover:bg-[#fbfaf7]"><td className="py-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efeaff] font-black text-[#7048e8]">{user.name.slice(0,1).toUpperCase()}</span><div>{editing === user.id ? <div className="flex gap-2"><Input value={editName} onChange={(event) => setEditName(event.target.value)} className="h-9 w-40" autoFocus /><button onClick={() => void action(user.id, "rename", { name: editName })} aria-label="Save learner name" className="rounded-lg bg-[#e9f5e9] p-2 text-[#39794b]"><Check className="h-4 w-4" /></button><button onClick={() => setEditing(null)} aria-label="Cancel rename" className="rounded-lg bg-[#f1efeb] p-2"><X className="h-4 w-4" /></button></div> : <><p className="font-black">{user.name}{user.hasParentPin && <Lock className="ml-1 inline h-3 w-3 text-[#778096]" />}</p><p className="text-xs text-[#788196]">{user.totalStars} stars · {user.streak} day streak</p></>}</div></div></td><td><select value={user.level} onChange={(event) => void action(user.id, "change-level", { level: event.target.value })} disabled={working === user.id} className="rounded-lg border border-[#ddd9d2] bg-white px-2 py-1.5 text-xs font-bold"><option value="preschool">Preschool</option><option value="grade1">Grade 1</option><option value="grade2">Grade 2</option><option value="grade3">Grade 3</option><option value="grade4">Grade 4</option></select></td><td><p className="font-bold">{user.completedLessons} lessons</p><p className="text-xs text-[#788196]">{user.eventCount} activity events</p></td><td><div className="flex items-center gap-2"><strong className="w-9">{user.avgScore}%</strong><span className="h-2 w-16 overflow-hidden rounded-full bg-[#e9e8e3]"><span className="block h-full rounded-full bg-[#4c963c]" style={{ width: `${user.avgScore}%` }} /></span></div></td><td>{relativeTime(user.lastPlayedAt)}</td><td><div className="flex justify-end gap-1"><IconButton label="Rename learner" onClick={() => { setEditing(user.id); setEditName(user.name); }}><Edit3 /></IconButton><IconButton label="Reset progress" tone="amber" onClick={() => void action(user.id, "reset")}><RotateCcw /></IconButton><IconButton label="Delete learner" tone="red" onClick={() => void action(user.id, "delete")}><Trash2 /></IconButton>{working === user.id && <Loader2 className="m-2 h-4 w-4 animate-spin" />}</div></td></tr>)}</tbody></table>{!filtered.length && <EmptyState text="No learners match this view." />}</div></Panel></div>;
}

const featureDefinitions: Array<{ key: keyof SiteSettings; label: string; description: string; icon: typeof Zap; category: string }> = [
  { key: "dailyChallengeEnabled", label: "Daily Challenge", description: "A short five-question warm-up that refreshes each day.", icon: Zap, category: "Practice" },
  { key: "aiTutorEnabled", label: "Ask Pip AI tutor", description: "Age-aware math explanations and learner support.", icon: Bot, category: "Guidance" },
  { key: "voiceAnswersEnabled", label: "Voice answers", description: "Microphone input for supported number questions.", icon: Mic, category: "Accessibility" },
  { key: "worksheetsEnabled", label: "Printable worksheets", description: "Offline practice sheets connected to Math Stars lessons.", icon: Printer, category: "Practice" },
  { key: "manipulativesEnabled", label: "Interactive manipulatives", description: "Hands-on group building and visual math tools.", icon: Wrench, category: "Learning tools" },
  { key: "soundEffectsEnabled", label: "Sound effects", description: "Positive audio feedback throughout learner activities.", icon: Volume2, category: "Experience" },
];

export function AdminFeatures({ settings, setSettings }: { settings: SiteSettings | null; setSettings: (settings: SiteSettings) => void }) {
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!settings) return <LoadingPanel label="Loading feature controls" />;
  const toggle = async (key: keyof SiteSettings) => {
    const previous = settings;
    const nextValue = !settings[key];
    setSettings({ ...settings, [key]: nextValue }); setSaving(key); setError(null);
    try { const response = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [key]: nextValue }) }); if (!response.ok) throw new Error(); }
    catch { setSettings(previous); setError("That feature could not be updated. Its previous setting has been restored."); }
    finally { setSaving(null); }
  };
  const enabled = featureDefinitions.filter((feature) => Boolean(settings[feature.key])).length;
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><SummaryCard icon={<Gamepad2 />} label="Available features" value={featureDefinitions.length} /><SummaryCard icon={<Check />} label="Enabled now" value={enabled} /><SummaryCard icon={<ShieldCheck />} label="Disabled" value={featureDefinitions.length - enabled} /></div>{error && <div role="alert" className="rounded-xl border border-[#edc4ce] bg-[#fff5f7] p-4 text-sm font-bold text-[#a12448]">{error}</div>}<Panel><div><h2 className="text-lg font-black">Site-wide feature flags</h2><p className="mt-1 text-sm text-[#68738b]">Changes take effect for every family immediately.</p></div><div className="mt-5 grid gap-3 lg:grid-cols-2">{featureDefinitions.map((feature) => { const Icon = feature.icon; const active = Boolean(settings[feature.key]); return <div key={feature.key} className="flex items-center gap-4 rounded-xl border border-[#e4e1db] bg-[#fbfaf7] p-4"><span className={cn("flex h-11 w-11 items-center justify-center rounded-full", active ? "bg-[#ede8ff] text-[#7048e8]" : "bg-[#eceae5] text-[#7c8494]")}><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="font-black">{feature.label}</p><span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#788196]">{feature.category}</span></div><p className="mt-1 text-xs leading-5 text-[#6d778d]">{feature.description}</p></div><button role="switch" aria-checked={active} aria-label={`${feature.label}: ${active ? "enabled" : "disabled"}`} disabled={saving === feature.key} onClick={() => void toggle(feature.key)} className={cn("relative h-7 w-12 shrink-0 rounded-full transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d7cdfb]", active ? "bg-[#42a15b]" : "bg-[#c8c9ca]")}><span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform", active ? "translate-x-6" : "translate-x-1")} />{saving === feature.key && <Loader2 className="absolute left-4 top-1.5 h-4 w-4 animate-spin text-white" />}</button></div>; })}</div></Panel></div>;
}

interface SystemData { dbStats: Record<string, number>; recentErrors: Array<{ id: string; route: string; method: string; message: string; detail: string | null; createdAt: string }>; errorsByRoute: Array<{ route: string; count: number }>; serverTime: string }
export function AdminSystem() {
  const [data, setData] = useState<SystemData | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(false);
  const load = useCallback(async () => { setLoading(true); setError(false); try { const response = await fetch("/api/admin/system", { cache: "no-store" }); if (!response.ok) throw new Error(); const next = await response.json(); setData(next.dbStats ? next : null); } catch { setError(true); } finally { setLoading(false); } }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  if (loading) return <LoadingPanel label="Checking system health" />;
  if (error || !data) return <RetryPanel title="System health could not be loaded" onRetry={() => void load()} />;
  const tables = [{ key: "families", label: "Families", icon: Users }, { key: "devices", label: "Devices", icon: Smartphone }, { key: "students", label: "Learners", icon: UserRound }, { key: "lessonProgress", label: "Lesson progress", icon: Gauge }, { key: "dailyChallenges", label: "Daily challenges", icon: Zap }, { key: "achievements", label: "Achievements", icon: ShieldCheck }, { key: "tutorMessages", label: "Tutor messages", icon: Bot }, { key: "activityEvents", label: "Activity events", icon: Wifi }, { key: "errorLogs", label: "Error logs", icon: AlertTriangle }];
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><SummaryCard icon={<Database />} label="Database records" value={Object.values(data.dbStats).reduce((sum, value) => sum + value, 0)} /><SummaryCard icon={<AlertTriangle />} label="Recent errors" value={data.recentErrors.length} /><SummaryCard icon={<ShieldCheck />} label="Service status" value={data.recentErrors.length ? "Attention" : "Healthy"} /></div><Panel><div className="flex items-center justify-between"><div><h2 className="text-lg font-black">Database activity</h2><p className="mt-1 text-xs text-[#68738b]">Server time: {new Date(data.serverTime).toLocaleString()}</p></div><Button variant="outline" size="sm" onClick={() => void load()} className="rounded-lg"><RefreshCw className="h-4 w-4" />Refresh</Button></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{tables.map((table) => { const Icon = table.icon; return <div key={table.key} className="flex items-center gap-3 rounded-xl border border-[#e4e1db] bg-[#fbfaf7] p-4"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efeaff] text-[#7048e8]"><Icon className="h-5 w-5" /></span><div><p className="text-2xl font-black tabular-nums">{data.dbStats[table.key] ?? 0}</p><p className="text-xs font-semibold text-[#68738b]">{table.label}</p></div></div>; })}</div></Panel><Panel><div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-[#c28a22]" /><h2 className="text-lg font-black">Error log</h2></div>{data.recentErrors.length ? <div className="mt-4 space-y-2">{data.recentErrors.map((item) => <div key={item.id} className="rounded-xl border border-[#edc7ce] bg-[#fff7f8] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-md bg-[#f8dfe5] px-2 py-1 font-mono text-[10px] font-black text-[#a12448]">{item.method} {item.route}</span><span className="text-[10px] text-[#7a8498]">{new Date(item.createdAt).toLocaleString()}</span></div><p className="mt-2 text-sm font-semibold text-[#7f2442]">{item.message}</p></div>)}</div> : <div className="mt-5 rounded-xl bg-[#edf8ed] px-5 py-8 text-center"><ShieldCheck className="mx-auto h-7 w-7 text-[#3d9254]" /><p className="mt-2 font-black text-[#39794b]">No errors logged. All clear.</p></div>}</Panel></div>;
}

export function AdminSettings({ settings, setSettings }: { settings: SiteSettings | null; setSettings: (settings: SiteSettings) => void }) {
  const [cashapp, setCashapp] = useState(settings?.cashappHandle ?? ""); const [zelle, setZelle] = useState(settings?.zelleInfo ?? ""); const [broadcast, setBroadcast] = useState(settings?.broadcastMessage ?? ""); const [broadcastActive, setBroadcastActive] = useState(settings?.broadcastActive ?? false); const [newPin, setNewPin] = useState(""); const [saving, setSaving] = useState(false); const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!settings) return;
    const timer = window.setTimeout(() => {
      setCashapp(settings.cashappHandle);
      setZelle(settings.zelleInfo);
      setBroadcast(settings.broadcastMessage ?? "");
      setBroadcastActive(settings.broadcastActive);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [settings]);
  if (!settings) return <LoadingPanel label="Loading settings" />;
  const save = async () => { setSaving(true); setNotice(null); try { const response = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cashappHandle: cashapp, zelleInfo: zelle, broadcastMessage: broadcast || null, broadcastActive }) }); if (!response.ok) throw new Error(); setSettings({ ...settings, cashappHandle: cashapp, zelleInfo: zelle, broadcastMessage: broadcast || null, broadcastActive }); setNotice("Settings saved successfully."); } catch { setNotice("Settings could not be saved. Please try again."); } finally { setSaving(false); } };
  const updatePin = async () => { if (!/^\d{4}$/.test(newPin)) { setNotice("The admin PIN must contain exactly four digits."); return; } setSaving(true); try { const response = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "set-pin", pin: newPin }) }); if (!response.ok) throw new Error(); setNewPin(""); setNotice("Admin PIN updated."); } catch { setNotice("The admin PIN could not be updated."); } finally { setSaving(false); } };
  return <div className="space-y-4">{notice && <div role="status" className="rounded-xl border border-[#d9d5ce] bg-white px-4 py-3 text-sm font-bold text-[#4e5972]">{notice}</div>}<div className="grid gap-4 xl:grid-cols-2"><Panel><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f9e6ed] text-[#9a2450]"><Megaphone className="h-5 w-5" /></span><div><h2 className="font-black">Family broadcast</h2><p className="text-xs text-[#68738b]">Post a message across family home screens.</p></div></div><label className="mt-5 block text-sm font-bold">Message<Input value={broadcast} onChange={(event) => setBroadcast(event.target.value)} placeholder="New lessons are available!" className="mt-2 h-11 rounded-lg border-[#dcd9d2] bg-[#fbfaf7]" /></label><label className="mt-4 flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={broadcastActive} onChange={(event) => setBroadcastActive(event.target.checked)} className="h-4 w-4 accent-[#7048e8]" />Show this message to families</label></Panel><Panel><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e9f5e9] text-[#3d9254]"><CircleDollarSign className="h-5 w-5" /></span><div><h2 className="font-black">Support details</h2><p className="text-xs text-[#68738b]">Optional donation information shown to families.</p></div></div><div className="mt-5 grid gap-4"><label className="text-sm font-bold">Cash App handle<Input value={cashapp} onChange={(event) => setCashapp(event.target.value)} placeholder="$yourhandle" className="mt-2 h-11 rounded-lg border-[#dcd9d2] bg-[#fbfaf7]" /></label><label className="text-sm font-bold">Zelle email or phone<Input value={zelle} onChange={(event) => setZelle(event.target.value)} placeholder="you@example.com" className="mt-2 h-11 rounded-lg border-[#dcd9d2] bg-[#fbfaf7]" /></label></div></Panel></div><Button onClick={() => void save()} disabled={saving} className="h-11 rounded-lg bg-[#111f46] px-6 font-black text-white hover:bg-[#1b2e5e]">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Save workspace settings</Button><Panel><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-xl"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#efeaff] text-[#7048e8]"><Lock className="h-5 w-5" /></span><div><h2 className="font-black">Administrator PIN</h2><p className="text-xs text-[#68738b]">This is separate from every family’s parent PIN.</p></div></div><p className="mt-4 text-sm leading-6 text-[#667188]">Use a private four-digit code that is not shared with learners or family accounts.</p></div><div className="flex gap-2"><Input type="password" inputMode="numeric" maxLength={4} value={newPin} onChange={(event) => setNewPin(event.target.value.replace(/\D/g, "").slice(0,4))} placeholder="New PIN" aria-label="New four-digit admin PIN" className="h-11 w-32 rounded-lg border-[#dcd9d2] text-center font-black tracking-[.3em]" /><Button onClick={() => void updatePin()} disabled={saving || newPin.length !== 4} variant="outline" className="h-11 rounded-lg border-[#aab1c0] font-black">Update PIN</Button></div></div></Panel></div>;
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) { return <Card className={cn("gap-0 rounded-xl border-[#dedbd5] bg-white p-5 shadow-[0_2px_7px_rgba(16,25,54,.035)]", className)}>{children}</Card>; }
function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) { return <Panel><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#efeaff] text-[#7048e8] [&>svg]:h-5 [&>svg]:w-5">{icon}</span><div><p className="text-2xl font-black tabular-nums">{value}</p><p className="text-xs font-semibold text-[#68738b]">{label}</p></div></div></Panel>; }
function IconButton({ children, label, tone = "default", onClick }: { children: React.ReactNode; label: string; tone?: "default" | "amber" | "red"; onClick: () => void }) { return <button onClick={onClick} title={label} aria-label={label} className={cn("rounded-lg p-2 [&>svg]:h-4 [&>svg]:w-4", tone === "amber" ? "bg-[#fff2d8] text-[#a96f10] hover:bg-[#ffe9bc]" : tone === "red" ? "bg-[#fce8ed] text-[#ad2850] hover:bg-[#f8dbe3]" : "bg-[#f0eee9] text-[#5f6980] hover:bg-[#e7e4dd]")}>{children}</button>; }
function Status({ status }: { status: string }) { return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide", status === "active" ? "bg-[#e9f6e9] text-[#39794b]" : "bg-[#fce8ec] text-[#a12448]")}>{status}</span>; }
function LoadingPanel({ label }: { label: string }) { return <div className="flex h-64 items-center justify-center rounded-xl border border-[#dedbd5] bg-white"><Loader2 className="h-6 w-6 animate-spin text-[#7048e8]" aria-label={label} /></div>; }
function RetryPanel({ title, onRetry }: { title: string; onRetry: () => void }) { return <Panel className="py-14 text-center"><AlertTriangle className="mx-auto h-7 w-7 text-[#a12448]" /><h2 className="mt-3 font-black">{title}</h2><Button onClick={onRetry} className="mt-4 bg-[#111f46] text-white hover:bg-[#1b2e5e]"><RefreshCw className="h-4 w-4" />Try again</Button></Panel>; }
function EmptyState({ text }: { text: string }) { return <p className="my-5 rounded-xl bg-[#f7f5f1] px-4 py-8 text-center text-sm text-[#6f798e]">{text}</p>; }
function relativeTime(value: string | null) { if (!value) return "Never"; const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000)); if (seconds < 90) return "Now"; if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`; if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`; return `${Math.floor(seconds / 86400)}d ago`; }
