"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CircleHelp,
  Cpu,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  Lock,
  Settings as SettingsIcon,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import {
  AdminFamilies,
  AdminFeatures,
  AdminLearners,
  AdminSettings,
  AdminSystem,
} from "@/components/admin/AdminManagement";
import type { AdminTab, SiteSettings } from "@/components/admin/admin-types";
import { useGameStore } from "@/store/useGameStore";
import { cn } from "@/lib/utils";

const navigation: Array<{ id: AdminTab; label: string; icon: typeof BarChart3 }> = [
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "families", label: "Families", icon: Users },
  { id: "learners", label: "Learners", icon: UserRound },
  { id: "features", label: "Features", icon: SlidersHorizontal },
  { id: "system", label: "System", icon: Cpu },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

const sectionCopy: Record<Exclude<AdminTab, "analytics">, { eyebrow: string; title: string; description: string }> = {
  families: {
    eyebrow: "Account operations",
    title: "Family directory",
    description: "Review family activity, devices, installations, and account status from one place.",
  },
  learners: {
    eyebrow: "Learner operations",
    title: "Learner management",
    description: "Understand progress and safely manage each Preschool through 4th Grade profile.",
  },
  features: {
    eyebrow: "Product controls",
    title: "Feature control center",
    description: "Turn learning tools on or off across Math Stars and see exactly what families receive.",
  },
  system: {
    eyebrow: "Platform health",
    title: "System observatory",
    description: "Monitor database activity, service health, and errors that may require attention.",
  },
  settings: {
    eyebrow: "Workspace configuration",
    title: "Admin settings",
    description: "Manage family announcements, support details, and protected administrator access.",
  },
};

export function AdminView({ standalone = false }: { standalone?: boolean }) {
  const router = useRouter();
  const setView = useGameStore((state) => state.setView);
  const [stage, setStage] = useState<"loading" | "pin" | "panel" | "setup">("loading");
  const [pinInput, setPinInput] = useState("");
  const [tab, setTab] = useState<AdminTab>("analytics");
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const exitAdmin = () => {
    if (standalone) router.push("/");
    else setView({ name: "home" });
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/settings")
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        setSettings(data);
        if (data.authenticated) setStage("panel");
        else if (data.hasAdminPin) setStage("pin");
        else setStage("setup");
      })
      .catch(() => {
        if (!cancelled) {
          setError("Admin access could not be checked. Please try again.");
          setStage("pin");
        }
      });
    return () => { cancelled = true; };
  }, []);

  const verifyPin = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-pin": pinInput },
        body: JSON.stringify({ action: "verify-pin" }),
      });
      if (!response.ok) {
        setError(response.status === 429 ? "Too many attempts. Wait a moment and try again." : "That admin PIN is not correct.");
        return;
      }
      const settingsResponse = await fetch("/api/admin/settings");
      if (settingsResponse.ok) setSettings(await settingsResponse.json());
      setStage("panel");
    } catch {
      setError("Math Stars could not verify the PIN. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const setPin = async () => {
    if (!/^\d{4}$/.test(pinInput)) {
      setError("Choose a four-digit PIN.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set-pin", pin: pinInput }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error ?? "The admin PIN could not be saved.");
        return;
      }
      const settingsResponse = await fetch("/api/admin/settings");
      if (settingsResponse.ok) setSettings(await settingsResponse.json());
      setStage("panel");
    } catch {
      setError("The admin PIN could not be saved. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (stage === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f7f3] text-[#101936]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#6f46e8]" aria-label="Opening admin workspace" />
          <p className="mt-3 text-sm font-semibold text-[#65708b]">Opening the observatory…</p>
        </div>
      </div>
    );
  }

  if (stage === "pin" || stage === "setup") {
    const isSetup = stage === "setup";
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f3ee] px-5 py-12 text-[#101936]">
        <div className="w-full max-w-md">
          <button onClick={exitAdmin} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#526078] transition hover:text-[#101936] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d9cffb]">
            <ArrowLeft className="h-4 w-4" /> Return to Math Stars
          </button>
          <Card className="rounded-[28px] border-[#ddd9d1] bg-white p-8 text-center shadow-[0_24px_70px_rgba(16,25,54,.12)]">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#111f46] text-white shadow-lg shadow-[#111f46]/20">
              {isSetup ? <ShieldCheck className="h-8 w-8" /> : <Lock className="h-8 w-8" />}
            </div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#9a2450]">Private workspace</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-.03em]">{isSetup ? "Secure your admin panel" : "Welcome back, Admin"}</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#65708b]">
              {isSetup ? "Create a separate four-digit PIN for site-wide controls and family data." : "Enter your four-digit administrator PIN to open Learning Observatory."}
            </p>
            <div className="mt-7 flex flex-col items-center gap-3">
              <Input
                aria-label="Four-digit admin PIN"
                type="password"
                inputMode="numeric"
                autoComplete={isSetup ? "new-password" : "current-password"}
                maxLength={4}
                placeholder="• • • •"
                value={pinInput}
                onChange={(event) => setPinInput(event.target.value.replace(/\D/g, "").slice(0, 4))}
                onKeyDown={(event) => { if (event.key === "Enter") void (isSetup ? setPin() : verifyPin()); }}
                className="h-16 w-48 rounded-2xl border-[#d8d5ce] bg-[#fbfaf7] text-center text-2xl font-black tracking-[.55em] focus-visible:ring-[#7a58ea]"
              />
              {error && <p role="alert" className="text-sm font-bold text-[#b4234d]">{error}</p>}
              <Button onClick={isSetup ? setPin : verifyPin} disabled={loading || pinInput.length !== 4} className="mt-1 h-12 rounded-xl bg-[#111f46] px-8 font-bold text-white hover:bg-[#1b2e5e]">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" />}
                {isSetup ? "Create admin PIN" : "Open observatory"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="admin-dashboard" className="min-h-screen bg-[#f8f7f3] text-[#101936]">
      <GlobalNavigation active={tab} onChange={setTab} onExit={exitAdmin} />
      <div className="min-h-screen pb-20 lg:pb-0 lg:pl-[142px]">
        {tab === "analytics" ? (
          <AdminAnalytics onNavigate={setTab} />
        ) : (
          <div className="min-h-screen lg:grid lg:grid-cols-[188px_minmax(0,1fr)]">
            <ContextRail tab={tab} />
            <main className="min-w-0 px-5 py-7 sm:px-8 lg:px-7 lg:py-8 xl:px-9">
              <AdminSectionHeader tab={tab} />
              <div className="mt-7">
                {tab === "families" && <AdminFamilies />}
                {tab === "learners" && <AdminLearners />}
                {tab === "features" && <AdminFeatures settings={settings} setSettings={setSettings} />}
                {tab === "system" && <AdminSystem />}
                {tab === "settings" && <AdminSettings settings={settings} setSettings={setSettings} />}
              </div>
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

function GlobalNavigation({ active, onChange, onExit }: { active: AdminTab; onChange: (tab: AdminTab) => void; onExit: () => void }) {
  return (
    <aside className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#111f46] text-white shadow-[0_-8px_30px_rgba(8,18,43,.2)] lg:inset-y-0 lg:left-0 lg:right-auto lg:w-[142px] lg:border-r lg:border-t-0 lg:shadow-none">
      <div className="hidden h-[88px] items-center justify-center border-b border-white/10 px-3 lg:flex">
        <button onClick={() => onChange("analytics")} className="flex items-center gap-2 rounded-xl p-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
          <Image src="/brand/math-stars-icon-192.png" alt="" width={48} height={48} className="h-11 w-11 rounded-full" />
          <span className="text-lg font-black leading-[.9] tracking-[-.03em]">Math<br />Stars</span>
        </button>
      </div>
      <nav aria-label="Admin sections" className="flex h-[70px] items-center justify-around overflow-x-auto px-2 lg:h-auto lg:flex-col lg:items-stretch lg:justify-start lg:gap-1 lg:px-3 lg:py-5">
        {navigation.map((item) => {
          const Icon = item.icon;
          const selected = active === item.id;
          return (
            <button
              key={item.id}
              aria-current={selected ? "page" : undefined}
              onClick={() => onChange(item.id)}
              className={cn(
                "group relative flex min-w-[62px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold text-white/72 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white lg:min-h-[70px] lg:w-full lg:text-xs",
                item.id === "analytics" && "lg:hidden",
                selected ? "text-white" : "hover:bg-white/8 hover:text-white",
              )}
            >
              {selected && <span aria-hidden="true" className="absolute left-0 hidden h-8 w-1 rounded-r-full bg-[#bd3b68] lg:block" />}
              <Icon className={cn("h-5 w-5 transition-transform group-hover:scale-105 lg:h-6 lg:w-6", selected && "stroke-[2.5]")} />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={onExit}
          className="group relative flex min-w-[62px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold text-white/72 transition hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white lg:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Exit</span>
        </button>
      </nav>
      <div className="absolute bottom-5 left-0 hidden w-full space-y-2 px-3 lg:block">
        <AdminHelpDialog onNavigate={onChange} />
        <button onClick={onExit} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/8 px-2 py-3 text-xs font-bold hover:bg-white/14"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black text-[#111f46]">A</span><span>Exit admin</span></button>
      </div>
    </aside>
  );
}

function AdminHelpDialog({ onNavigate }: { onNavigate: (tab: AdminTab) => void }) {
  const destinations: Array<{ tab: AdminTab; title: string; description: string }> = [
    { tab: "analytics", title: "Understand activity", description: "Review engagement, learning outcomes, devices, and downloadable reports." },
    { tab: "system", title: "Check platform health", description: "Inspect service health and recent errors when something does not look right." },
    { tab: "settings", title: "Change site controls", description: "Manage announcements, support details, and protected administrator access." },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex w-full flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-white/75 transition hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
          <CircleHelp className="h-5 w-5" />Help
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-2xl border-[#dedbd5] bg-[#fbfaf7] p-0 text-[#101936] shadow-[0_30px_90px_rgba(8,18,43,.28)]">
        <DialogHeader className="border-b border-[#e5e1da] px-6 pb-5 pt-6 text-left">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#9a2450]">Admin guide</p>
          <DialogTitle className="text-2xl font-black tracking-[-.03em]">How can we help?</DialogTitle>
          <DialogDescription className="leading-6 text-[#68738b]">
            Choose an area to open it directly. Your current admin session will stay active.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 px-6 py-5">
          {destinations.map((destination) => (
            <DialogClose asChild key={destination.tab}>
              <button
                onClick={() => onNavigate(destination.tab)}
                className="rounded-xl border border-[#e1ded8] bg-white p-4 text-left transition hover:border-[#b9a8ef] hover:bg-[#f7f3ff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d9cffb]"
              >
                <span className="font-black">{destination.title}</span>
                <span className="mt-1 block text-sm leading-5 text-[#68738b]">{destination.description}</span>
              </button>
            </DialogClose>
          ))}
        </div>
        <DialogFooter className="border-t border-[#e5e1da] px-6 py-4">
          <DialogClose asChild>
            <Button variant="outline" className="rounded-lg border-[#aab1c0] bg-white font-bold text-[#17203c]">Close guide</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContextRail({ tab }: { tab: Exclude<AdminTab, "analytics"> }) {
  const copy = sectionCopy[tab];
  const Icon = navigation.find((item) => item.id === tab)?.icon ?? LayoutDashboard;
  return (
    <aside className="hidden border-r border-[#e1ded8] bg-[#fbfaf7] px-4 py-8 lg:block">
      <div className="flex items-center gap-2 px-2 text-base font-black"><Icon className="h-5 w-5 text-[#9a2450]" />{navigation.find((item) => item.id === tab)?.label}</div>
      <div className="mt-7 rounded-xl bg-[#f4e6ea] px-3 py-3 text-sm font-bold text-[#8d2349]">Overview</div>
      <p className="mt-5 px-3 text-xs leading-5 text-[#778096]">{copy.description}</p>
    </aside>
  );
}

function AdminSectionHeader({ tab }: { tab: Exclude<AdminTab, "analytics"> }) {
  const copy = sectionCopy[tab];
  return (
    <header className="flex flex-col justify-between gap-4 border-b border-[#e3e0da] pb-6 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-black uppercase tracking-[.16em] text-[#9a2450]">{copy.eyebrow}</p>
        <h1 className="mt-1 text-3xl font-black tracking-[-.035em] sm:text-4xl">{copy.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68738b]">{copy.description}</p>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-[#dedbd5] bg-white px-3 py-2 text-xs font-bold text-[#4e5972]"><Activity className="h-4 w-4 text-[#43a35f]" />Live admin data</div>
    </header>
  );
}
