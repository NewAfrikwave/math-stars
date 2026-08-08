"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Download,
  FileBarChart,
  Gamepad2,
  GraduationCap,
  Laptop,
  LayoutDashboard,
  Loader2,
  MessageSquare,
  MonitorSmartphone,
  RefreshCw,
  Smartphone,
  Target,
  TrendingUp,
  Users,
  Wifi,
} from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AdminTab, AnalyticsData, AnalyticsSection, GradeStat } from "@/components/admin/admin-types";
import { cn } from "@/lib/utils";
import { summarizeGradeStats } from "@/lib/admin-analytics";

const sectionItems: Array<{ id: AnalyticsSection; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "engagement", label: "Engagement", icon: TrendingUp },
  { id: "outcomes", label: "Learning outcomes", icon: Target },
  { id: "devices", label: "Devices", icon: Laptop },
  { id: "reports", label: "Reports", icon: FileBarChart },
];

const rangeLabels: Record<number, string> = { 7: "Last 7 days", 14: "Last 14 days", 30: "Last 30 days" };

export function AdminAnalytics({ onNavigate }: { onNavigate: (tab: AdminTab) => void }) {
  const [section, setSection] = useState<AnalyticsSection>("overview");
  const [range, setRange] = useState(14);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/analytics?days=${range}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Analytics request failed");
      const next = await response.json();
      if (next.error) throw new Error(next.error);
      setData(next);
      setUpdatedAt(new Date());
    } catch {
      setError("Learning data could not be loaded. Your admin session may have expired, or the service may be temporarily unavailable.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const exportReport = () => {
    if (!data) return;
    const rows = [
      ["Math Stars Learning Observatory", rangeLabels[range]],
      ["Metric", "Value"],
      ["Families", data.totalFamilies],
      ["Learners", data.totalLearners],
      ["Active learners", data.activeLearners],
      ["Average mastery", `${data.avgScore}%`],
      ["Lessons completed", data.totalLessonsCompleted],
      ["App installations", data.installedDevices],
      [],
      ["Grade", "Learners", "Active", "Lessons completed", "Average score", "Strongest domain", "Needs practice"],
      ...data.gradeStats.map((grade) => [grade.label, grade.learners, grade.activeLearners, grade.lessonsCompleted, `${grade.avgScore}%`, grade.strongestDomain, grade.needsPractice]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = `math-stars-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[188px_minmax(0,1fr)]">
      <aside className="border-b border-[#e1ded8] bg-[#fbfaf7] px-4 py-4 lg:border-b-0 lg:border-r lg:py-8">
        <div className="hidden items-center gap-2 px-2 text-base font-black lg:flex"><BarChart3 className="h-5 w-5 text-[#9a2450]" />Analytics</div>
        <nav aria-label="Analytics views" className="flex gap-2 overflow-x-auto lg:mt-7 lg:flex-col lg:overflow-visible">
          {sectionItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => setSection(item.id)} className={cn("flex shrink-0 items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#303a50] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d8cff9]", section === item.id ? "bg-[#f4e6ea] text-[#8d2349]" : "hover:bg-[#f1efe9]")}>
                <Icon className="h-4 w-4" />{item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="min-w-0 px-4 py-6 sm:px-7 lg:px-7 lg:py-7 xl:px-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-[-.045em] sm:text-[42px] sm:leading-none">Learning Observatory</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-medium text-[#535e75]">
              <label className="relative inline-flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-[#18213d]" />
                <select value={range} onChange={(event) => setRange(Number(event.target.value))} className="appearance-none bg-transparent py-1 pr-6 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#7a58ea]">
                  <option value={7}>{formatDateRange(7)}</option>
                  <option value={14}>{formatDateRange(14)}</option>
                  <option value={30}>{formatDateRange(30)}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-0 h-4 w-4" />
              </label>
              {updatedAt && <span className="sr-only" aria-live="polite">Updated {updatedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportReport} disabled={!data} className="h-11 rounded-lg border-[#aab1c0] bg-white px-5 font-bold text-[#17203c] hover:bg-[#f4f3ef]"><Download className="h-4 w-4" />Export report</Button>
            <Button onClick={() => void load(true)} disabled={refreshing} className="h-11 rounded-lg bg-[#111f46] px-5 font-bold text-white hover:bg-[#1b2e5e]"><RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />Refresh</Button>
          </div>
        </header>

        {loading ? <DashboardSkeleton /> : error || !data ? <ErrorState message={error ?? "Analytics are unavailable."} retry={() => void load()} /> : (
          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: .2 }} className="mt-7">
              {section === "overview" && <Overview data={data} onNavigate={onNavigate} onShowOutcomes={() => setSection("outcomes")} />}
              {section === "engagement" && <Engagement data={data} />}
              {section === "outcomes" && <LearningOutcomes data={data} />}
              {section === "devices" && <Devices data={data} />}
              {section === "reports" && <Reports data={data} range={range} onExport={exportReport} />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}

function Overview({ data, onNavigate, onShowOutcomes }: { data: AnalyticsData; onNavigate: (tab: AdminTab) => void; onShowOutcomes: () => void }) {
  const adoption = data.totalFamilies > 0 ? Math.round((data.installedFamilies / data.totalFamilies) * 100) : 0;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 xl:grid-cols-12">
        <MetricCard className="xl:col-span-5">
          <div className="grid min-h-[168px] gap-5 sm:grid-cols-[1fr_1px_1fr] sm:items-center">
            <div className="flex items-start gap-4">
              <IconBubble tone="violet"><Users className="h-8 w-8" /></IconBubble>
              <div><p className="text-4xl font-black tabular-nums">{data.activeLearners}</p><p className="mt-1 text-lg font-bold">active learners</p><p className="mt-3 text-sm font-bold text-[#3c9b58]">+{data.newFamilies7} new families</p><p className="text-xs text-[#737d92]">during this reporting period</p></div>
            </div>
            <div className="hidden h-28 bg-[#e7e4de] sm:block" />
            <div>
              <p className="mb-3 text-xs font-bold text-[#59647c]">Active learners by grade</p>
              <div className="space-y-2.5">{data.gradeStats.filter((grade) => grade.learners > 0).slice(0, 4).map((grade) => <GradeCount key={grade.level} grade={grade} />)}</div>
            </div>
          </div>
        </MetricCard>
        <MetricCard className="xl:col-span-3">
          <p className="text-sm font-bold">Average mastery</p>
          <MasteryRing value={data.avgScore} />
          <p className="text-center text-sm font-bold text-[#42a15b]">↑ across completed lessons</p>
        </MetricCard>
        <MetricCard className="xl:col-span-4">
          <div className="flex min-h-[168px] items-start gap-5">
            <IconBubble tone="berry"><GraduationCap className="h-7 w-7" /></IconBubble>
            <div><p className="text-4xl font-black tabular-nums">{data.totalFamilies}</p><p className="mt-1 text-lg font-bold">families</p><p className="mt-5 text-sm text-[#4f5a72]">{data.installedDevices} installed {data.installedDevices === 1 ? "app" : "apps"}</p><p className="mt-1 text-sm font-black text-[#9a2450]">{adoption}% adoption</p></div>
          </div>
        </MetricCard>
      </div>

      <div className="grid gap-3 xl:grid-cols-12">
        <MetricCard className="xl:col-span-9">
          <ChartTitle />
          <EngagementChart data={data.activityByDay} />
        </MetricCard>
        <MetricCard className="xl:col-span-3">
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Activity className="h-5 w-5 text-[#734deb]" /><h2 className="font-black">Live pulse</h2></div><span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#59647c]"><span className="h-2 w-2 rounded-full bg-[#69ad4d]" />Live</span></div>
          <div className="mt-4 divide-y divide-[#ece9e3]">
            <PulseRow icon={<Wifi />} tone="green" label="Active now" value={data.activeNow} />
            <PulseRow icon={<BookOpen />} tone="violet" label="Lessons today" value={data.lessonsToday} />
            <PulseRow icon={<Gamepad2 />} tone="gold" label="Arcade rounds today" value={data.arcadeToday} />
            <PulseRow icon={<MessageSquare />} tone="blue" label="Tutor messages" value={data.tutorMessagesToday} />
          </div>
          <button onClick={() => onNavigate("families")} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-black text-[#7048e8] hover:bg-[#f4f0ff]">View live activity <ChevronRight className="h-4 w-4" /></button>
        </MetricCard>
      </div>

      {data.inactiveLearners > 0 && <div className="flex flex-col gap-3 rounded-xl border border-[#edca78] bg-[#fff7de] px-5 py-3 sm:flex-row sm:items-center"><AlertTriangle className="h-6 w-6 shrink-0 text-[#bd8115]" /><p className="flex-1 text-sm font-semibold text-[#4e452e]"><strong>{data.inactiveLearners} {data.inactiveLearners === 1 ? "learner has" : "learners have"}</strong> been inactive for 7 days.</p><Button onClick={() => onNavigate("learners")} className="h-9 rounded-lg bg-[#c18a22] px-5 text-xs font-black text-white hover:bg-[#ab781c]">Review learners</Button></div>}

      <div className="grid gap-3 min-[1440px]:grid-cols-2">
        <MetricCard><h2 className="mb-4 font-black">Learning by grade</h2><GradeTable grades={data.gradeStats} /></MetricCard>
        <MetricCard><h2 className="mb-4 font-black">Top lessons</h2><TopLessons lessons={data.popularLessons.slice(0, 5)} /><button onClick={onShowOutcomes} className="mx-auto mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-black text-[#7048e8] hover:bg-[#f4f0ff]">View all lessons <ChevronRight className="h-4 w-4" /></button></MetricCard>
      </div>
    </div>
  );
}

function Engagement({ data }: { data: AnalyticsData }) {
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><SmallKpi label="Active now" value={data.activeNow} icon={<Wifi />} /><SmallKpi label="Active in 24 hours" value={data.active24h} icon={<Activity />} /><SmallKpi label="Lessons this period" value={data.activityByDay.reduce((sum, day) => sum + day.lessons, 0)} icon={<BookOpen />} /><SmallKpi label="Arcade rounds" value={data.activityByDay.reduce((sum, day) => sum + day.arcade, 0)} icon={<Gamepad2 />} /></div><MetricCard><ChartTitle /><EngagementChart data={data.activityByDay} tall /></MetricCard><MetricCard><h2 className="mb-4 font-black">Recent family engagement</h2><RecentFamilies families={data.recentFamilies} /></MetricCard></div>;
}

function LearningOutcomes({ data }: { data: AnalyticsData }) {
  return <div className="space-y-4"><div className="grid gap-3 lg:grid-cols-[280px_1fr]"><MetricCard><p className="font-black">Overall mastery</p><MasteryRing value={data.avgScore} large /><p className="text-center text-sm text-[#667189]">Across {data.totalLessonsCompleted} completed lessons</p></MetricCard><MetricCard><h2 className="mb-4 font-black">Learning by grade</h2><GradeTable grades={data.gradeStats} /></MetricCard></div><div className="grid gap-3 xl:grid-cols-2"><MetricCard><h2 className="mb-4 font-black">Curriculum progress</h2><DomainBars domains={data.domainStats} /></MetricCard><MetricCard><h2 className="mb-4 font-black">Most successful lessons</h2><TopLessons lessons={[...data.popularLessons].sort((a, b) => b.avgScore - a.avgScore).slice(0, 7)} /></MetricCard></div></div>;
}

function Devices({ data }: { data: AnalyticsData }) {
  const chartData = data.deviceMix.map((item) => ({ ...item, label: titleCase(item.name) }));
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><SmallKpi label="Known devices" value={data.totalDevices} icon={<MonitorSmartphone />} /><SmallKpi label="Installed apps" value={data.installedDevices} icon={<Download />} /><SmallKpi label="Family install adoption" value={`${data.totalFamilies ? Math.round((data.installedFamilies / data.totalFamilies) * 100) : 0}%`} icon={<Smartphone />} /></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><SmallKpi label="Offline events synced" value={data.offlineSyncEvents} icon={<RefreshCw />} /><SmallKpi label="Offline learners" value={data.offlineSyncLearners} icon={<Users />} /><SmallKpi label="Synced within 24h" value={`${data.offlineSyncWithin24h}%`} icon={<Wifi />} /><SmallKpi label="Average sync delay" value={formatDelay(data.offlineSyncAvgDelayMinutes)} icon={<Activity />} /></div><div className="grid gap-3 xl:grid-cols-2"><MetricCard><h2 className="font-black">Device mix</h2><div className="mt-4 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 15 }}><CartesianGrid stroke="#ece9e3" horizontal={false} /><XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#677188" }} /><YAxis type="category" dataKey="label" width={82} tick={{ fontSize: 11, fill: "#39435a" }} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="count" fill="#734deb" radius={[0, 7, 7, 0]} /></BarChart></ResponsiveContainer></div></MetricCard><MetricCard><h2 className="font-black">Platforms</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{data.platformMix.map((platform) => <div key={platform.name} className="rounded-xl border border-[#e5e2dc] bg-[#fbfaf7] p-4"><p className="text-sm font-semibold text-[#667188]">{platform.name}</p><p className="mt-1 text-3xl font-black">{platform.count}</p></div>)}</div></MetricCard></div><MetricCard><h2 className="mb-4 font-black">Recently active devices</h2><RecentDevices devices={data.recentDevices} /></MetricCard></div>;
}

function Reports({ data, range, onExport }: { data: AnalyticsData; range: number; onExport: () => void }) {
  const reports = [
    { title: "Executive learning summary", description: "Families, learners, engagement, mastery, and adoption in one file.", icon: BarChart3 },
    { title: "Grade performance report", description: "Learner counts, completion, average scores, strengths, and practice needs.", icon: GraduationCap },
    { title: "Technology adoption report", description: "Installed apps, devices, platforms, and recent device activity.", icon: MonitorSmartphone },
  ];
  return <div className="space-y-4"><MetricCard><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#9a2450]">Reporting center</p><h2 className="mt-1 text-2xl font-black">Download a clean operational snapshot</h2><p className="mt-2 text-sm text-[#667188]">Current range: {rangeLabels[range]}. Reports use the same live data shown in Learning Observatory.</p></div><Button onClick={onExport} className="h-11 shrink-0 rounded-lg bg-[#111f46] px-5 font-black text-white hover:bg-[#1b2e5e]"><Download className="h-4 w-4" />Export CSV</Button></div></MetricCard><div className="grid gap-3 lg:grid-cols-3">{reports.map((report) => <MetricCard key={report.title}><report.icon className="h-7 w-7 text-[#7048e8]" /><h3 className="mt-5 font-black">{report.title}</h3><p className="mt-2 text-sm leading-6 text-[#68738b]">{report.description}</p><button onClick={onExport} className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#7048e8]">Download report <ChevronRight className="h-4 w-4" /></button></MetricCard>)}</div><MetricCard><h2 className="font-black">Report totals</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><ReportTotal label="Families" value={data.totalFamilies} /><ReportTotal label="Learners" value={data.totalLearners} /><ReportTotal label="Completed lessons" value={data.totalLessonsCompleted} /><ReportTotal label="Average mastery" value={`${data.avgScore}%`} /></div></MetricCard></div>;
}

function MetricCard({ children, className }: { children: React.ReactNode; className?: string }) { return <Card className={cn("gap-0 rounded-xl border-[#dedbd5] bg-white p-4 shadow-[0_2px_7px_rgba(16,25,54,.035)] sm:p-5", className)}>{children}</Card>; }
function IconBubble({ children, tone }: { children: React.ReactNode; tone: "violet" | "berry" }) { return <span className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white", tone === "violet" ? "bg-[#7048e8]" : "bg-[#a22956]")}>{children}</span>; }
function GradeCount({ grade }: { grade: GradeStat }) { const style = gradeTone(grade.level); return <div className="grid grid-cols-[28px_1fr_auto] items-center gap-2 text-sm"><span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-black", style.badge)}>{gradeAbbreviation(grade.level)}</span><span>{grade.label}</span><strong>{grade.activeLearners}</strong></div>; }

function MasteryRing({ value, large = false }: { value: number; large?: boolean }) {
  const safe = Math.min(100, Math.max(0, value));
  const data = [{ value: safe }, { value: 100 - safe }];
  return <div className={cn("relative mx-auto", large ? "h-48 w-48" : "h-28 w-28")}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" startAngle={90} endAngle={-270} innerRadius="68%" outerRadius="88%" stroke="none" isAnimationActive={false}><Cell fill="#3d9254" /><Cell fill="#e9e8e3" /></Pie></PieChart></ResponsiveContainer><span className="absolute inset-0 flex items-center justify-center text-2xl font-black tabular-nums">{safe}%</span></div>;
}

function ChartTitle() { return <div><h2 className="font-black">Engagement and mastery</h2><div className="mt-3 flex flex-wrap gap-5 text-xs font-semibold text-[#59647c]"><span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#744dea]" />Activity (lessons completed)</span><span className="inline-flex items-center gap-2"><span className="h-[2px] w-5 bg-[#3d9254]" />Average score (%)</span></div></div>; }

function EngagementChart({ data, tall = false }: { data: AnalyticsData["activityByDay"]; tall?: boolean }) {
  const shown = data.map((item) => ({ ...item, label: new Date(`${item.date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }) }));
  return <div className={cn("mt-3 w-full", tall ? "h-[360px]" : "h-[235px]")}><ResponsiveContainer width="100%" height="100%"><ComposedChart data={shown} margin={{ top: 12, right: 5, left: -20, bottom: 0 }}><defs><linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#734deb" stopOpacity={.58} /><stop offset="100%" stopColor="#734deb" stopOpacity={.05} /></linearGradient></defs><CartesianGrid stroke="#ece9e3" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 10, fill: "#697389" }} tickLine={false} axisLine={false} minTickGap={20} /><YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 10, fill: "#734deb" }} tickLine={false} axisLine={false} /><YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: "#3d9254" }} tickLine={false} axisLine={false} /><Tooltip contentStyle={tooltipStyle} /><Area yAxisId="left" type="monotone" dataKey="lessons" name="Lessons" stroke="#7048e8" strokeWidth={2.5} fill="url(#activityFill)" isAnimationActive={false} /><Line yAxisId="right" type="monotone" dataKey="avgScore" name="Average score" stroke="#3d9254" strokeWidth={2.5} dot={{ r: 3, fill: "#3d9254" }} connectNulls isAnimationActive={false} /></ComposedChart></ResponsiveContainer></div>;
}

function PulseRow({ icon, tone, label, value }: { icon: React.ReactNode; tone: "green" | "violet" | "gold" | "blue"; label: string; value: number }) { const tones = { green: "bg-[#edf8ea] text-[#55a33c]", violet: "bg-[#f2edff] text-[#754dea]", gold: "bg-[#fff5d9] text-[#d49c26]", blue: "bg-[#edf2ff] text-[#536bea]" }; return <div className="flex items-center gap-3 py-2"><span className={cn("flex h-9 w-9 items-center justify-center rounded-full [&>svg]:h-5 [&>svg]:w-5", tones[tone])}>{icon}</span><span className="flex-1 text-sm font-semibold text-[#455068]">{label}</span><strong className="text-xl tabular-nums">{value}</strong></div>; }

function GradeTable({ grades }: { grades: GradeStat[] }) {
  const totals = summarizeGradeStats(grades);
  return <div className="overflow-x-auto"><table className="w-full min-w-[410px] text-left text-xs"><thead className="border-b border-[#e8e5df] text-[#68738a]"><tr><th className="pb-3 font-semibold">Grade</th><th className="pb-3 text-center font-semibold">Active learners</th><th className="pb-3 text-center font-semibold">Lessons completed</th><th className="pb-3 font-semibold">Average score</th><th className="hidden pb-3 font-semibold min-[1440px]:table-cell">Strongest domain</th><th className="hidden pb-3 font-semibold min-[1440px]:table-cell">Needs practice</th></tr></thead><tbody className="divide-y divide-[#ece9e3]">{grades.filter((grade) => grade.learners > 0).map((grade) => <tr key={grade.level}><td className="py-3"><div className="flex items-center gap-2"><span className={cn("flex h-7 w-7 items-center justify-center rounded-full font-black", gradeTone(grade.level).badge)}>{gradeAbbreviation(grade.level)}</span><span className="font-semibold">{grade.label}</span></div></td><td className="text-center font-semibold">{grade.activeLearners}</td><td className="text-center">{grade.lessonsCompleted}</td><td><div className="flex items-center gap-2"><strong>{grade.avgScore}%</strong><span className="h-2 w-14 overflow-hidden rounded-full bg-[#e9e8e3]"><span className="block h-full rounded-full bg-[#4c963c]" style={{ width: `${grade.avgScore}%` }} /></span></div></td><td className="hidden min-[1440px]:table-cell">{grade.strongestDomain}</td><td className="hidden min-[1440px]:table-cell">{grade.needsPractice}</td></tr>)}</tbody><tfoot><tr className="border-t border-[#dcd9d2] font-black"><td className="pt-3">All grades</td><td className="pt-3 text-center">{totals.activeLearners}</td><td className="pt-3 text-center">{totals.lessons}</td><td className="pt-3">{totals.lessons ? Math.round(totals.weightedScore / totals.lessons) : 0}%</td><td className="hidden pt-3 min-[1440px]:table-cell">—</td><td className="hidden pt-3 min-[1440px]:table-cell">—</td></tr></tfoot></table></div>;
}

function TopLessons({ lessons }: { lessons: AnalyticsData["popularLessons"] }) { if (!lessons.length) return <EmptyMessage text="Lesson results will appear after learners begin practicing." />; const colors = ["bg-[#efe8ff] text-[#754dea]", "bg-[#e9efff] text-[#5570dc]", "bg-[#f1eeea] text-[#6c7080]", "bg-[#fff0e8] text-[#ba6c3b]", "bg-[#fcecf3] text-[#a22956]"]; return <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b border-[#e8e5df] text-[10px] font-semibold text-[#68738a]"><th className="pb-2 text-left"></th><th className="pb-2 text-left"></th><th className="w-20 pb-2 text-right">Completions</th><th className="w-16 pb-2 text-right">Avg score</th></tr></thead><tbody className="divide-y divide-[#ece9e3]">{lessons.map((lesson, index) => <tr key={lesson.lessonId}><td className="w-8 py-2 text-center font-black">{index + 1}</td><td className="py-2"><div className="flex min-w-0 items-center gap-2"><span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md", colors[index % colors.length])}><BookOpen className="h-3.5 w-3.5" /></span><span className="truncate font-semibold">{lesson.title}</span></div></td><td className="py-2 text-right">{lesson.completions}</td><td className="py-2 text-right font-black text-[#3d9254]">{lesson.avgScore}%</td></tr>)}</tbody></table></div>; }

function DomainBars({ domains }: { domains: AnalyticsData["domainStats"] }) { const shown = [...domains].sort((a, b) => b.completed - a.completed).slice(0, 8); return <div className="space-y-4">{shown.map((domain) => { const percent = domain.total ? Math.round((domain.completed / domain.total) * 100) : 0; return <div key={domain.id}><div className="mb-1.5 flex items-center justify-between text-xs"><span className="font-bold">{domain.title}</span><span className="text-[#68738b]">{domain.completed}/{domain.total}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-[#eceae5]"><motion.span initial={{ width: 0 }} animate={{ width: `${percent}%` }} className="block h-full rounded-full bg-[#7048e8]" /></div></div>; })}</div>; }
function RecentFamilies({ families }: { families: AnalyticsData["recentFamilies"] }) { return <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead className="text-left text-xs text-[#68738b]"><tr><th className="pb-3">Family</th><th className="pb-3">Joined</th><th className="pb-3">Last active</th><th className="pb-3">Learners</th><th className="pb-3">Devices</th><th className="pb-3">Status</th></tr></thead><tbody className="divide-y divide-[#ece9e3]">{families.slice(0, 10).map((family) => <tr key={family.id}><td className="py-3"><p className="font-bold">{family.displayName}</p><p className="text-xs text-[#7a8498]">{family.email}</p></td><td>{new Date(family.createdAt).toLocaleDateString()}</td><td>{relativeTime(family.lastActiveAt)}</td><td>{family.learners}</td><td>{family.devices}</td><td><StatusPill status={family.status} /></td></tr>)}</tbody></table></div>; }
function RecentDevices({ devices }: { devices: AnalyticsData["recentDevices"] }) { if (!devices.length) return <EmptyMessage text="Device activity will appear as families use Math Stars." />; return <div className="grid gap-2 lg:grid-cols-2">{devices.slice(0, 12).map((device) => <div key={device.id} className="flex items-center gap-3 rounded-xl border border-[#e6e3dd] bg-[#fbfaf7] p-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efeaff] text-[#7048e8]"><MonitorSmartphone className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{device.familyName}</p><p className="truncate text-xs capitalize text-[#727c91]">{device.deviceType} · {device.platform} · {device.browser}</p></div><div className="text-right"><p className="text-xs font-semibold">{relativeTime(device.lastSeenAt)}</p>{device.installed && <span className="text-[10px] font-black text-[#3d9254]">Installed</span>}</div></div>)}</div>; }

function SmallKpi({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) { return <MetricCard><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#efeaff] text-[#7048e8] [&>svg]:h-5 [&>svg]:w-5">{icon}</span><div><p className="text-3xl font-black tabular-nums">{value}</p><p className="text-xs font-semibold text-[#68738b]">{label}</p></div></div></MetricCard>; }
function formatDelay(minutes: number) { if (minutes < 60) return `${minutes}m`; if (minutes < 24 * 60) return `${Math.round(minutes / 60)}h`; return `${Math.round(minutes / (24 * 60))}d`; }
function ReportTotal({ label, value }: { label: string; value: number | string }) { return <div className="rounded-xl bg-[#f7f5f1] p-4"><p className="text-xs font-semibold text-[#68738b]">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>; }
function StatusPill({ status }: { status: string }) { const active = status === "active"; return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide", active ? "bg-[#e9f6e9] text-[#39794b]" : "bg-[#fce8ec] text-[#a12448]")}>{status}</span>; }
function EmptyMessage({ text }: { text: string }) { return <p className="rounded-xl bg-[#f7f5f1] px-4 py-10 text-center text-sm text-[#707a90]">{text}</p>; }
function DashboardSkeleton() { return <div className="mt-7 space-y-4" aria-label="Loading analytics"><div className="grid gap-3 xl:grid-cols-3">{[1,2,3].map((item) => <div key={item} className="h-44 animate-pulse rounded-xl bg-[#ece9e3]" />)}</div><div className="h-[330px] animate-pulse rounded-xl bg-[#ece9e3]" /></div>; }
function ErrorState({ message, retry }: { message: string; retry: () => void }) { return <Card className="mt-7 rounded-xl border-[#ecc6cf] bg-white p-8 text-center"><AlertTriangle className="mx-auto h-8 w-8 text-[#aa2850]" /><h2 className="mt-3 text-xl font-black">Analytics need another try</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#68738b]">{message}</p><Button onClick={retry} className="mt-5 bg-[#111f46] text-white hover:bg-[#1b2e5e]"><RefreshCw className="h-4 w-4" />Try again</Button></Card>; }

function gradeTone(level: string) { if (level === "preschool") return { badge: "bg-[#eee6ff] text-[#7048e8]" }; if (level === "grade1") return { badge: "bg-[#e4f2e6] text-[#316f43]" }; if (level === "grade2") return { badge: "bg-[#e7efff] text-[#4564bd]" }; if (level === "grade3") return { badge: "bg-[#fff0cc] text-[#8a6514]" }; return { badge: "bg-[#f9e6ed] text-[#9a2450]" }; }
function gradeAbbreviation(level: string) { if (level === "preschool") return "P"; return level.replace("grade", ""); }
function titleCase(value: string) { return value.replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function relativeTime(value: string | null) { if (!value) return "Never"; const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000)); if (seconds < 90) return "Now"; if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`; if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`; return `${Math.floor(seconds / 86400)}d ago`; }
function formatDateRange(days: number) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));
  const startLabel = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return `${startLabel} – ${endLabel}`;
}
const tooltipStyle = { borderRadius: 10, borderColor: "#dedbd5", boxShadow: "0 8px 24px rgba(16,25,54,.1)", fontSize: 12 };
