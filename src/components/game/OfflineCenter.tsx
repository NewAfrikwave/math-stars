"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Cloud, CloudOff, Database, Download, HardDrive, RefreshCw, ShieldCheck, Trash2, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useGameStore } from "@/store/useGameStore";
import { downloadGradePack, type PackDownloadProgress } from "@/lib/offline/download";
import { deleteGradePack, getOfflinePreferences, listGradePacks, listOfflineEvents, offlineStorageEstimate, saveOfflinePreferences } from "@/lib/offline/database";
import { syncOfflineEvents } from "@/lib/offline/sync-client";
import { listGradePackMetadata } from "@/lib/offline/grade-packs";
import { buildMasteryMap, recommendedMission } from "@/lib/adaptive-learning";
import type { Level } from "@/lib/types";
import type { OfflineGradePack, OfflinePreferences } from "@/lib/offline/types";

const metadata = listGradePackMetadata();

export function OfflineCenter() {
  const setView = useGameStore((state) => state.setView);
  const level = useGameStore((state) => state.level);
  const progress = useGameStore((state) => state.progress);
  const [online, setOnline] = useState(true);
  const [packs, setPacks] = useState<OfflineGradePack[]>([]);
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(0);
  const [storage, setStorage] = useState({ usage: 0, quota: 0 });
  const [preferences, setPreferences] = useState<OfflinePreferences>({ lowDataMode: false, autoSync: true, lastSyncAt: null });
  const [downloading, setDownloading] = useState<Level | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<PackDownloadProgress | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const mastery = useMemo(() => buildMasteryMap(level, progress), [level, progress]);
  const mission = useMemo(() => recommendedMission(level, progress), [level, progress]);

  const refresh = async () => {
    const [savedPacks, events, estimate, savedPreferences] = await Promise.all([
      listGradePacks(), listOfflineEvents(), offlineStorageEstimate(), getOfflinePreferences(),
    ]);
    setPacks(savedPacks);
    setPending(events.filter((event) => event.status === "pending").length);
    setFailed(events.filter((event) => event.status === "failed").length);
    setStorage(estimate);
    setPreferences(savedPreferences);
    setOnline(navigator.onLine);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    const connection = () => void refresh();
    window.addEventListener("online", connection);
    window.addEventListener("offline", connection);
    window.addEventListener("mathstars-sync-complete", connection);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("online", connection);
      window.removeEventListener("offline", connection);
      window.removeEventListener("mathstars-sync-complete", connection);
    };
  }, []);

  const download = async (packLevel: Level) => {
    setDownloading(packLevel);
    setMessage(null);
    try {
      await downloadGradePack(packLevel, setDownloadProgress);
      setMessage(`${gradeLabel(packLevel)} is ready without internet.`);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? `${error.message} Open this page when your connection returns to resume.` : "The download was interrupted.");
    } finally {
      setDownloading(null);
      setDownloadProgress(null);
    }
  };

  const sync = async () => {
    setSyncing(true);
    setMessage(null);
    const result = await syncOfflineEvents(true);
    setMessage(result.pending || result.failed ? "Some work is still waiting. Math Stars will try again safely." : "All saved work is safely synchronized.");
    setSyncing(false);
    await refresh();
  };

  const updatePreferences = async (next: Partial<OfflinePreferences>) => {
    setPreferences(await saveOfflinePreferences(next));
  };

  const usagePercent = storage.quota ? Math.min(100, Math.round((storage.usage / storage.quota) * 100)) : 0;
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[linear-gradient(180deg,#e8f4ec_0%,#fff9e9_48%,#f3ecff_100%)] px-4 pb-20 pt-5 text-[#20372b]">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => setView({ name: "home" })} className="gap-2 rounded-full"><ArrowLeft className="h-4 w-4" />Home</Button>
          <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${online ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
            {online ? <Cloud className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}{online ? "Connected" : "Learning offline"}
          </span>
        </div>

        <section className="mt-4 overflow-hidden rounded-[32px] bg-[#214e3a] p-6 text-white shadow-xl sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:items-center">
            <div><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-200">Math Stars Anywhere</p><h1 className="mt-2 font-display text-4xl font-black sm:text-5xl">Learning should not stop when the internet does.</h1><p className="mt-3 max-w-2xl leading-7 text-emerald-50/85">Download a grade once. Lessons, practice, daily challenges, read-aloud support, and the Arcade keep working. Every child&apos;s work stays separate on this device and syncs when a connection returns.</p></div>
            <div className="rounded-3xl bg-white/10 p-5"><ShieldCheck className="h-9 w-9 text-amber-300" /><p className="mt-3 font-display text-xl font-black">Safe local saves</p><p className="mt-1 text-sm text-emerald-50/80">{pending + failed} item{pending + failed === 1 ? "" : "s"} waiting across this device.</p><Button onClick={sync} disabled={!online || syncing} className="mt-4 w-full rounded-full bg-amber-300 font-black text-emerald-950 hover:bg-amber-200"><RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />Sync now</Button></div>
          </div>
        </section>

        {message && <p role="status" className="mt-4 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold">{message}</p>}

        <section className="mt-6">
          <div><h2 className="font-display text-2xl font-black">Download grade packs</h2><p className="text-sm text-stone-600">Downloads resume from the last saved file after a weak or interrupted connection.</p></div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {metadata.map((item) => {
              const installed = packs.find((pack) => pack.level === item.level && pack.version === item.version);
              const active = downloading === item.level;
              const percent = active && downloadProgress?.total ? Math.round((downloadProgress.completed / downloadProgress.total) * 100) : 0;
              return <Card key={item.level} className={`rounded-3xl border-2 p-5 ${item.level === level ? "border-emerald-500 bg-emerald-50" : "border-stone-200 bg-white"}`}>
                <div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-[.14em] text-emerald-700">{item.level === level ? "Current learner" : "Grade pack"}</p><h3 className="mt-1 font-display text-2xl font-black">{item.label}</h3><p className="mt-1 text-sm text-stone-600">{item.lessonCount} lessons · {formatBytes(item.estimatedBytes)} curriculum data</p></div>{installed ? <CheckCircle2 className="h-7 w-7 text-emerald-600" /> : <Download className="h-7 w-7 text-violet-600" />}</div>
                {active && <div className="mt-4"><div className="h-2 overflow-hidden rounded-full bg-stone-200"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${percent}%` }} /></div><p className="mt-2 truncate text-xs font-bold text-stone-600">{percent}% · {downloadProgress?.current ?? "Preparing"}</p></div>}
                <div className="mt-5 flex gap-2"><Button onClick={() => void download(item.level)} disabled={Boolean(downloading)} className="flex-1 rounded-full bg-[#214e3a] font-black text-white hover:bg-[#173b2b]">{installed ? "Update pack" : "Download"}</Button>{installed && <Button variant="outline" size="icon" onClick={async () => { await deleteGradePack(item.level); await refresh(); }} aria-label={`Remove ${item.label}`} className="rounded-full"><Trash2 className="h-4 w-4" /></Button>}</div>
              </Card>;
            })}
          </div>
        </section>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card className="rounded-3xl border-stone-200 bg-white p-5"><div className="flex items-center gap-3"><Database className="h-7 w-7 text-violet-600" /><div><h2 className="font-display text-xl font-black">Smart practice guide</h2><p className="text-sm text-stone-600">The first adaptive layer works on this device too.</p></div></div>{mission ? <div className="mt-4 rounded-2xl bg-violet-50 p-4"><p className="font-black">{mission.emoji} {mission.title} · {mission.band}</p><p className="mt-1 text-sm text-stone-700">{mission.recommendation}</p>{mission.nextLessonId && <Button onClick={() => setView({ name: "lesson", lessonId: mission.nextLessonId! })} className="mt-3 rounded-full bg-violet-700 text-white">Practice next</Button>}</div> : <p className="mt-4 text-sm text-stone-600">Complete a lesson to begin personalized recommendations.</p>}<div className="mt-4 grid grid-cols-2 gap-2">{mastery.slice(0, 6).map((domain) => <div key={domain.domainId} className="rounded-xl border border-stone-200 p-3"><p className="truncate text-xs font-bold">{domain.emoji} {domain.title}</p><p className="mt-1 text-2xl font-black">{domain.score}%</p><p className="text-[11px] text-stone-500">{domain.band}</p></div>)}</div></Card>
          <Card className="rounded-3xl border-stone-200 bg-white p-5"><div className="flex items-center gap-3"><HardDrive className="h-7 w-7 text-emerald-700" /><div><h2 className="font-display text-xl font-black">Data and storage</h2><p className="text-sm text-stone-600">Designed for shared and lower-cost devices.</p></div></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-stone-200"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${usagePercent}%` }} /></div><p className="mt-2 text-xs font-bold text-stone-600">{formatBytes(storage.usage)} used{storage.quota ? ` of ${formatBytes(storage.quota)}` : ""}</p><label className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-stone-50 p-4"><span><strong className="block">Low-data mode</strong><span className="text-xs text-stone-600">Use saved artwork and avoid background refreshes.</span></span><Switch checked={preferences.lowDataMode} onCheckedChange={(checked) => void updatePreferences({ lowDataMode: checked })} /></label><label className="mt-3 flex items-center justify-between gap-4 rounded-2xl bg-stone-50 p-4"><span><strong className="block">Sync automatically</strong><span className="text-xs text-stone-600">Send saved work when the connection returns.</span></span><Switch checked={preferences.autoSync} onCheckedChange={(checked) => void updatePreferences({ autoSync: checked })} /></label><div className="mt-4 flex items-center gap-2 text-xs text-stone-600"><Wifi className="h-4 w-4" />Last sync: {preferences.lastSyncAt ? new Date(preferences.lastSyncAt).toLocaleString() : "Not yet"}</div></Card>
        </div>
      </div>
    </div>
  );
}

function gradeLabel(level: Level) { return metadata.find((item) => item.level === level)?.label ?? level; }
function formatBytes(bytes: number) { if (!bytes) return "0 KB"; if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`; return `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
