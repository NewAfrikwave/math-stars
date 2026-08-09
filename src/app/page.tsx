"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore, profileFetch } from "@/store/useGameStore";
import { HomeView } from "@/components/game/HomeView";
import { DomainView } from "@/components/game/DomainView";
import { LessonView } from "@/components/game/LessonView";
import { PracticeSession } from "@/components/game/PracticeSession";
import { ResultsView } from "@/components/game/ResultsView";
import { AchievementsView } from "@/components/game/AchievementsView";
import { TutorView } from "@/components/game/TutorView";
import { ReviewView } from "@/components/game/ReviewView";
import { DailyChallengeView } from "@/components/game/DailyChallengeView";
import { WorksheetView } from "@/components/game/WorksheetView";
import { ManipulativeView } from "@/components/game/ManipulativeView";
import { ParentView } from "@/components/game/ParentView";
import { PlacementView } from "@/components/game/PlacementView";
import { AdminView } from "@/components/game/AdminView";
import { InstallGuide } from "@/components/game/InstallGuide";
import { LandingView } from "@/components/game/LandingView";
import { TimesTableView } from "@/components/game/TimesTableView";
import { ArcadeView } from "@/components/game/ArcadeView";
import { OfflineCenter } from "@/components/game/OfflineCenter";
import { OfflineCoordinator } from "@/components/OfflineCoordinator";
import { OfflineStatusButton } from "@/components/OfflineStatusButton";
import { DomainCelebration } from "@/components/game/DomainCelebration";
import { Mascot } from "@/components/game/Mascot";
import { Star, Trophy, Home, Bot, Loader2, Repeat, Download } from "lucide-react";
import { useState } from "react";
import type { RewardMission } from "@/lib/rewards";
import type { LessonCheckpointState } from "@/lib/types";
import { clearOfflineDeviceData, loadLatestOfflineCheckpoint, loadSnapshot, saveSnapshot } from "@/lib/offline/database";
import type { CachedLearnerState } from "@/lib/offline/types";

// Load a single profile's full state from the server (with the profile header).
async function loadProfileState(
  profileId: string,
  hydrate: (data: {
    studentName: string;
    level: "preschool" | "grade1" | "grade2" | "grade3" | "grade4" | null;
    totalStars: number;
    streak: number;
    soundOn: boolean;
    progress: Record<string, import("@/lib/types").LessonProgressState>;
    earnedAchievements: string[];
    dailyDoneDate: string | null;
    dailyScore: number | null;
    reward?: RewardMission | null;
    activeCheckpoint?: LessonCheckpointState | null;
  }) => void,
  signal?: AbortSignal,
) {
  try {
    const res = await fetch("/api/state", { headers: { "x-profile-id": profileId }, signal });
    if (!res.ok) throw new Error("Could not load learner progress");
    const data = await res.json();
    if (signal?.aborted || !data) return;
    await saveSnapshot(`state:${profileId}`, data).catch(() => {});
    const localCheckpoint = await loadLatestOfflineCheckpoint(profileId).catch(() => null);
    hydrate({
      studentName: data.studentName ?? "Star Learner",
      level: data.level ?? null,
      totalStars: data.totalStars ?? 0,
      streak: data.streak ?? 0,
      soundOn: data.soundOn ?? true,
      progress: data.progress ?? {},
      earnedAchievements: data.earnedAchievements ?? [],
      dailyDoneDate: data.dailyDoneDate ?? null,
      dailyScore: data.dailyScore ?? null,
      reward: data.reward ?? null,
      activeCheckpoint: localCheckpoint && (!data.activeCheckpoint || localCheckpoint.updatedAt > data.activeCheckpoint.updatedAt) ? localCheckpoint : data.activeCheckpoint ?? null,
    });
  } catch {
    if (signal?.aborted) return;
    const cached = await loadSnapshot<CachedLearnerState>(`state:${profileId}`).catch(() => null);
    if (!cached) return;
    const localCheckpoint = await loadLatestOfflineCheckpoint(profileId).catch(() => null);
    hydrate({ ...cached, reward: cached.reward as RewardMission | null | undefined, activeCheckpoint: localCheckpoint ?? cached.activeCheckpoint ?? null });
  }
}

export default function Page() {
  const view = useGameStore((s) => s.view);
  const setView = useGameStore((s) => s.setView);
  const level = useGameStore((s) => s.level);
  const setLevel = useGameStore((s) => s.setLevel);
  const hydrated = useGameStore((s) => s.hydrated);
  const hydrate = useGameStore((s) => s.hydrate);
  const totalStars = useGameStore((s) => s.totalStars);
  const earnedAchievements = useGameStore((s) => s.earnedAchievements);
  const soundOn = useGameStore((s) => s.soundOn);
  const setSoundOn = useGameStore((s) => s.setSoundOn);
  const studentName = useGameStore((s) => s.studentName);
  const currentProfileId = useGameStore((s) => s.currentProfileId);
  const profiles = useGameStore((s) => s.profiles);
  const setProfiles = useGameStore((s) => s.setProfiles);
  const setCurrentProfile = useGameStore((s) => s.setCurrentProfile);
  const setSiteSettings = useGameStore((s) => s.setSiteSettings);
  const siteSettings = useGameStore((s) => s.siteSettings);
  const [installOpen, setInstallOpen] = useState(false);
  const immersiveView = view.name === "home" || view.name === "times-tables" || view.name === "arcade" || view.name === "admin";

  useEffect(() => {
    const openInstall = () => setInstallOpen(true);
    window.addEventListener("mathstars-open-install", openInstall);
    return () => window.removeEventListener("mathstars-open-install", openInstall);
  }, []);

  useEffect(() => {
    if (localStorage.getItem("mathstars-open-admin") === "1") {
      localStorage.removeItem("mathstars-open-admin");
      setView({ name: "admin" });
    }
  }, [setView]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("view") === "offline") setView({ name: "offline" });
  }, [setView]);

  // Load site settings (feature flags, broadcast, donations) on first load.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/site");
        const data = await response.json();
        if (!response.ok || !data) throw new Error("settings unavailable");
        await saveSnapshot("site-settings", data).catch(() => {});
        if (!cancelled) setSiteSettings(data);
      } catch {
        const cached = await loadSnapshot<ReturnType<typeof useGameStore.getState>["siteSettings"]>("site-settings").catch(() => null);
        if (!cancelled && cached) setSiteSettings(cached);
      }
    })();
    return () => { cancelled = true; };
  }, [setSiteSettings]);

  // On first load: fetch the profiles list, then restore the last-used
  // profile from localStorage and load its state.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/profiles");
        const data = await response.json();
        if (!response.ok || !data) throw new Error("profiles unavailable");
        await saveSnapshot("family-profiles", data).catch(() => {});
        if (cancelled || !data) return;
        const list = (data.profiles ?? []) as Array<{
          id: string; name: string; avatar: string; level: string;
          totalStars: number; streak: number; lastPlayedAt?: string | null;
        }>;
        setProfiles(
          list.map((p) => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar,
            level: (["preschool", "grade1", "grade2", "grade3", "grade4"].includes(p.level) ? p.level : "grade3") as "preschool" | "grade1" | "grade2" | "grade3" | "grade4",
            totalStars: p.totalStars,
            streak: p.streak,
            lastPlayedAt: p.lastPlayedAt ?? null,
          }))
        );
        // restore last profile
        const saved = typeof window !== "undefined" ? localStorage.getItem("mathstars-profile") : null;
        const useId = saved && list.some((p) => p.id === saved) ? saved : null;
        if (useId) {
          setCurrentProfile(useId);
        } else {
          // no profile selected → show landing/picker
          hydrate({
            studentName: "Star Learner",
            level: null,
            totalStars: 0,
            streak: 0,
            soundOn: true,
            progress: {},
            earnedAchievements: [],
            dailyDoneDate: null,
            dailyScore: null,
            reward: null,
            activeCheckpoint: null,
          });
        }
      } catch {
        const data = await loadSnapshot<{ profiles?: Array<{ id: string; name: string; avatar: string; level: string; totalStars: number; streak: number; lastPlayedAt?: string | null }> }>("family-profiles").catch(() => null);
        if (cancelled || !data?.profiles?.length) {
        hydrate({
          studentName: "Star Learner",
          level: null,
          totalStars: 0,
          streak: 0,
          soundOn: true,
          progress: {},
          earnedAchievements: [],
          dailyDoneDate: null,
          dailyScore: null,
          reward: null,
          activeCheckpoint: null,
        });
          return;
        }
        const list = data.profiles;
        setProfiles(list.map((p) => ({ ...p, level: (["preschool", "grade1", "grade2", "grade3", "grade4"].includes(p.level) ? p.level : "grade3") as "preschool" | "grade1" | "grade2" | "grade3" | "grade4" })));
        const saved = localStorage.getItem("mathstars-profile");
        const useId = saved && list.some((profile) => profile.id === saved) ? saved : list[0]?.id ?? null;
        if (useId) setCurrentProfile(useId);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // When the current profile changes, load its state and remember it.
  useEffect(() => {
    if (!currentProfileId) return;
    const controller = new AbortController();
    if (typeof window !== "undefined") {
      localStorage.setItem("mathstars-profile", currentProfileId);
    }
    loadProfileState(currentProfileId, hydrate, controller.signal);
    return () => controller.abort();
  }, [currentProfileId, hydrate]);

  // Show the landing/profile-picker page when no profile is selected, or when
  // the user taps the switch-profile button.
  if (hydrated && view.name !== "admin" && (!currentProfileId || view.name === "landing")) {
    return <LandingView />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <OfflineCoordinator />
      {/* Header */}
      {!immersiveView && <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-2 px-4">
          <button
            onClick={() => setView({ name: "home" })}
            className="flex items-center gap-2 transition-transform hover:scale-[1.02]"
          >
            <Mascot size={36} />
            <div className="text-left">
              <p className="font-display text-lg font-bold leading-none">{studentName}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {level === "preschool" ? "Preschool"
                : level === "grade1" ? "1st Grade"
                : level === "grade2" ? "2nd Grade"
                : level === "grade4" ? "4th Grade"
                : "3rd Grade"}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <HeaderChip
              icon={<Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
              value={totalStars}
              label="stars"
            />
            <HeaderChip
              icon={<Trophy className="h-4 w-4 text-rose-500" />}
              value={earnedAchievements.length}
              label="badges"
            />
            <button
              onClick={() => setInstallOpen(true)}
              title="Install on your tablet"
              className="flex h-9 items-center gap-1 rounded-full bg-muted px-3 text-xs font-bold transition-colors hover:bg-muted/70"
              aria-label="Install app"
            >
              <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Install</span>
            </button>
            <OfflineStatusButton onClick={() => setView({ name: "offline" })} />
            <button
              onClick={() => {
                setCurrentProfile(null);
                setView({ name: "landing" });
              }}
              title="Switch learner"
              className="flex h-9 items-center gap-1 rounded-full bg-muted px-3 text-xs font-bold transition-colors hover:bg-muted/70"
              aria-label="Switch learner"
            >
              <Repeat className="h-3.5 w-3.5" /> Switch
            </button>
            <button
              onClick={() => setSoundOn(!soundOn)}
              title={soundOn ? "Sound on" : "Sound off"}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm transition-colors hover:bg-muted/70"
              aria-label={soundOn ? "Turn sound off" : "Turn sound on"}
            >
              {soundOn ? "🔊" : "🔇"}
            </button>
          </div>
        </div>
      </header>}

      {/* Broadcast banner (if admin has set one) */}
      {view.name !== "admin" && siteSettings?.broadcastMessage && (
        <div className="bg-gradient-to-r from-amber-400 to-rose-400 px-4 py-2 text-center text-sm font-bold text-white">
          {siteSettings.broadcastMessage}
        </div>
      )}

      {/* Main content */}
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {!hydrated ? (
          <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="font-medium">Loading your math adventure…</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={view.name + ("lessonId" in view ? view.lessonId : "") + ("domainId" in view ? view.domainId : "")}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              {renderView(view, setView)}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Footer */}
      {!immersiveView && <footer className="mt-auto border-t border-border bg-card">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mascot size={28} />
            <span>
              <span className="font-semibold text-foreground">Math Stars</span> — {level === "preschool" ? "playful early math"
              : level === "grade1" ? "1st grade math"
              : level === "grade2" ? "2nd grade math"
              : level === "grade4" ? "4th grade math"
              : "3rd grade math"},
              one star at a time.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FooterButton
              active={false}
              onClick={() => setView({ name: "home" })}
              icon={<Home className="h-4 w-4" />}
              label="Home"
            />
            <FooterButton
              active={view.name === "achievements"}
              onClick={() => setView({ name: "achievements" })}
              icon={<Trophy className="h-4 w-4" />}
              label="Badges"
            />
            <FooterButton
              active={view.name === "tutor"}
              onClick={() => setView({ name: "tutor" })}
              icon={<Bot className="h-4 w-4" />}
              label="Ask Pip"
            />
            <a href="/privacy" className="rounded-full px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted">Privacy</a>
            <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }).catch(() => {}); await clearOfflineDeviceData(); window.location.reload(); }} className="rounded-full px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted">Sign out</button>
          </div>
          <p className="text-xs text-muted-foreground sm:basis-full sm:text-center">Developed by <a href="https://www.norzolabs.com/" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2 hover:text-foreground">norzolabs.com</a></p>
        </div>
      </footer>}

      {/* Domain-completion celebration overlay (shows when a topic is finished) */}
      <DomainCelebration />
      {/* PWA install guide modal */}
      <InstallGuide open={installOpen} onClose={() => setInstallOpen(false)} />
    </div>
  );
}

function renderView(
  view: ReturnType<typeof useGameStore.getState>["view"],
  setView: ReturnType<typeof useGameStore.getState>["setView"]
) {
  switch (view.name) {
    case "landing":
      return <LandingView />;
    case "home":
      return <HomeView />;
    case "times-tables":
      return <TimesTableView />;
    case "arcade":
      return <ArcadeView />;
    case "offline":
      return <OfflineCenter />;
    case "domain":
      return <DomainView domainId={view.domainId} />;
    case "lesson":
      return <LessonView lessonId={view.lessonId} />;
    case "practice":
      return <PracticeSession lessonId={view.lessonId} difficulty={view.difficulty} />;
    case "results":
      return (
        <ResultsView
          lessonId={view.lessonId}
          score={view.score}
          stars={view.stars}
          correct={view.correct}
          total={view.total}
        />
      );
    case "achievements":
      return <AchievementsView />;
    case "tutor":
      return <TutorView />;
    case "review":
      return <ReviewView />;
    case "daily":
      return <DailyChallengeView />;
    case "worksheet":
      return <WorksheetView lessonId={view.lessonId} />;
    case "manipulative":
      return <ManipulativeView lessonId={view.lessonId} />;
    case "parent":
      return <ParentView />;
    case "placement":
      return <PlacementView domainId={view.domainId} />;
    case "admin":
      return <AdminView />;
    default:
      return <HomeView />;
  }
}

function HeaderChip({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
      {icon}
      <span className="font-display text-sm font-bold tabular-nums">{value}</span>
      <span className="sr-only">{label}</span>
    </div>
  );
}

function FooterButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
