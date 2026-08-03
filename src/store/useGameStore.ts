"use client";

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type {
  GameView,
  LessonProgressState,
  LessonStatus,
  Level,
} from "@/lib/types";
import { ALL_LESSONS, CURRICULUM, findLesson, isLessonAvailable, TOTAL_LESSONS } from "@/lib/curriculum";
import {
  PRESCHOOL_CURRICULUM,
  PRESCHOOL_LESSON_IDS,
  PRESCHOOL_TOTAL_LESSONS,
  findPsLesson,
  psIsLessonAvailable,
} from "@/lib/preschool";
import * as G1 from "@/lib/grade1";
import * as G2 from "@/lib/grade2";
import * as G4 from "@/lib/grade4";
import { ACHIEVEMENTS } from "@/lib/achievements";

const DEFAULT_STUDENT_ID = "me";

export interface ProfileSummary {
  id: string;
  name: string;
  avatar: string;
  level: Level;
  totalStars: number;
  streak: number;
}

export interface SiteSettingsState {
  dailyChallengeEnabled: boolean;
  aiTutorEnabled: boolean;
  voiceAnswersEnabled: boolean;
  worksheetsEnabled: boolean;
  manipulativesEnabled: boolean;
  soundEffectsEnabled: boolean;
  cashappHandle: string;
  zelleInfo: string;
  broadcastMessage: string | null;
}

interface GameState {
  // identity
  studentId: string;
  studentName: string;
  level: Level | null; // null = show landing page
  totalStars: number;
  streak: number;
  soundOn: boolean;

  // site settings (feature flags, broadcast, donations)
  siteSettings: SiteSettingsState | null;

  // profiles
  profiles: ProfileSummary[];
  currentProfileId: string | null; // null = show profile picker

  // progress map: lessonId -> state
  progress: Record<string, LessonProgressState>;
  earnedAchievements: string[];

  // daily challenge: dateKey of today's attempt (null = not done today)
  dailyDoneDate: string | null;
  dailyScore: number | null;

  // navigation
  view: GameView;

  // achievements earned from the most recent practice run (for results screen)
  lastEarnedAchievements: string[];

  // domain just completed (for celebration), cleared after showing
  domainCompleted: { domainId: string; domainTitle: string } | null;

  // hydration flag
  hydrated: boolean;

  // actions
  setView: (view: GameView) => void;
  setSoundOn: (on: boolean) => void;
  setLevel: (level: Level) => void;
  setProfiles: (profiles: ProfileSummary[]) => void;
  setSiteSettings: (settings: SiteSettingsState | null) => void;
  setCurrentProfile: (id: string | null) => void;
  createProfile: (name: string, level: Level) => Promise<ProfileSummary | null>;
  deleteProfile: (id: string) => Promise<void>;
  hydrate: (data: {
    studentName: string;
    level: Level | null;
    totalStars: number;
    streak: number;
    soundOn: boolean;
    progress: Record<string, LessonProgressState>;
    earnedAchievements: string[];
    dailyDoneDate: string | null;
    dailyScore: number | null;
  }) => void;
  recordResult: (lessonId: string, correct: number, total: number) => {
    stars: number;
    score: number;
    newlyEarned: string[];
  };
  recordDailyResult: (correct: number, total: number) => { score: number };
  resetProgress: () => void;
  clearDomainCelebration: () => void;
}

// compute stars from score: 3 for >=90%, 2 for >=70%, 1 for >=50%
function starsForScore(score: number): number {
  if (score >= 90) return 3;
  if (score >= 70) return 2;
  if (score >= 50) return 1;
  return 0;
}

// Build the default progress map. The first lesson of every domain is
// available; the rest are locked until their prerequisite is completed.
function initialProgress(): Record<string, LessonProgressState> {
  const map: Record<string, LessonProgressState> = {};
  // grade-3 lessons
  for (const fl of ALL_LESSONS) {
    const available = isLessonAvailable(fl.lessonId, () => false);
    map[fl.lessonId] = {
      lessonId: fl.lessonId,
      status: available ? "available" : "locked",
      stars: 0,
      bestScore: 0,
      attempts: 0,
      lastScore: 0,
      completedAt: null,
    };
  }
  // preschool lessons (first lesson of each domain available)
  for (const id of PRESCHOOL_LESSON_IDS) {
    const available = psIsLessonAvailable(id, () => false);
    map[id] = {
      lessonId: id,
      status: available ? "available" : "locked",
      stars: 0,
      bestScore: 0,
      attempts: 0,
      lastScore: 0,
      completedAt: null,
    };
  }
  // grade 1 lessons
  for (const id of G1.GRADE1_LESSON_IDS) {
    const available = G1.isLessonAvailable(id, () => false);
    map[id] = {
      lessonId: id,
      status: available ? "available" : "locked",
      stars: 0, bestScore: 0, attempts: 0, lastScore: 0, completedAt: null,
    };
  }
  // grade 2 lessons
  for (const id of G2.GRADE2_LESSON_IDS) {
    const available = G2.isLessonAvailable(id, () => false);
    map[id] = {
      lessonId: id,
      status: available ? "available" : "locked",
      stars: 0, bestScore: 0, attempts: 0, lastScore: 0, completedAt: null,
    };
  }
  // grade 4 lessons
  for (const id of G4.GRADE4_LESSON_IDS) {
    const available = G4.isLessonAvailable(id, () => false);
    map[id] = {
      lessonId: id,
      status: available ? "available" : "locked",
      stars: 0, bestScore: 0, attempts: 0, lastScore: 0, completedAt: null,
    };
  }
  return map;
}

// Recompute availability for both levels.
function recomputeStatuses(progress: Record<string, LessonProgressState>) {
  const isCompleted = (id: string) => progress[id]?.status === "completed";
  for (const fl of ALL_LESSONS) {
    const p = progress[fl.lessonId];
    if (!p) continue;
    if (p.status === "completed") continue;
    if (isLessonAvailable(fl.lessonId, isCompleted) && p.status === "locked") {
      p.status = "available";
    }
  }
  for (const id of PRESCHOOL_LESSON_IDS) {
    const p = progress[id];
    if (!p) continue;
    if (p.status === "completed") continue;
    if (psIsLessonAvailable(id, isCompleted) && p.status === "locked") {
      p.status = "available";
    }
  }
  for (const id of G1.GRADE1_LESSON_IDS) {
    const p = progress[id];
    if (!p) continue;
    if (p.status === "completed") continue;
    if (G1.isLessonAvailable(id, isCompleted) && p.status === "locked") {
      p.status = "available";
    }
  }
  for (const id of G2.GRADE2_LESSON_IDS) {
    const p = progress[id];
    if (!p) continue;
    if (p.status === "completed") continue;
    if (G2.isLessonAvailable(id, isCompleted) && p.status === "locked") {
      p.status = "available";
    }
  }
  for (const id of G4.GRADE4_LESSON_IDS) {
    const p = progress[id];
    if (!p) continue;
    if (p.status === "completed") continue;
    if (G4.isLessonAvailable(id, isCompleted) && p.status === "locked") {
      p.status = "available";
    }
  }
}

// Fetch helper that attaches the current profile id as a header so every
// API call operates on the active learner's data. Exported for components
// that make their own API calls (progress, daily, tutor).
export function profileFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  const pid = useGameStore.getState().currentProfileId;
  const headers = new Headers(opts.headers);
  if (pid) headers.set("x-profile-id", pid);
  return fetch(url, { ...opts, headers });
}

export const useGameStore = create<GameState>((set, get) => ({
  studentId: DEFAULT_STUDENT_ID,
  studentName: "Star Learner",
  level: null,
  totalStars: 0,
  streak: 0,
  soundOn: true,
  siteSettings: null,
  profiles: [],
  currentProfileId: null,
  progress: initialProgress(),
  earnedAchievements: [],
  dailyDoneDate: null,
  dailyScore: null,
  view: { name: "landing" },
  lastEarnedAchievements: [],
  domainCompleted: null,
  hydrated: false,

  setView: (view) => set({ view }),

  setSoundOn: (on) => {
    set({ soundOn: on });
    profileFetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ soundOn: on }),
    }).catch(() => {});
  },

  setLevel: (level) => {
    set({ level, view: { name: "home" } });
    profileFetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level }),
    }).catch(() => {});
  },

  setProfiles: (profiles) => set({ profiles }),

  setSiteSettings: (s) => set({ siteSettings: s }),

  setCurrentProfile: (id) => set({ currentProfileId: id, view: { name: "home" } }),

  createProfile: async (name, level) => {
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, level }),
      });
      const p = await res.json();
      if (!p.id) return null;
      const summary: ProfileSummary = {
        id: p.id,
        name: p.name,
        avatar: p.avatar ?? "fox",
        level: p.level,
        totalStars: 0,
        streak: 0,
      };
      set({ profiles: [...get().profiles, summary] });
      return summary;
    } catch {
      return null;
    }
  },

  deleteProfile: async (id) => {
    await fetch(`/api/profiles?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
    set({ profiles: get().profiles.filter((p) => p.id !== id) });
  },

  hydrate: (data) =>
    set({
      studentName: data.studentName,
      level: data.level,
      totalStars: data.totalStars,
      streak: data.streak,
      soundOn: data.soundOn,
      progress: data.progress,
      earnedAchievements: data.earnedAchievements,
      dailyDoneDate: data.dailyDoneDate,
      dailyScore: data.dailyScore,
      hydrated: true,
    }),

  recordResult: (lessonId, correct, total) => {
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const stars = starsForScore(score);
    const state = get();
    const prev = state.progress[lessonId] ?? {
      lessonId,
      status: "available" as LessonStatus,
      stars: 0,
      bestScore: 0,
      attempts: 0,
      lastScore: 0,
      completedAt: null,
    };
    const wasCompleted = prev.status === "completed";
    const newBest = Math.max(prev.bestScore, score);
    const newStars = Math.max(prev.stars, stars);
    const newProgress: LessonProgressState = {
      ...prev,
      status: "completed",
      stars: newStars,
      bestScore: newBest,
      attempts: prev.attempts + 1,
      lastScore: score,
      completedAt: new Date().toISOString(),
    };
    const progress = { ...state.progress, [lessonId]: newProgress };
    recomputeStatuses(progress);

    const totalStars = Object.values(progress).reduce(
      (sum, p) => sum + (p.status === "completed" ? p.stars : 0),
      0
    );

    const completedCount = Object.values(progress).filter(
      (p) => p.status === "completed"
    ).length;
    const perfectLessons = Object.values(progress).filter(
      (p) => p.status === "completed" && p.stars >= 3
    ).length;
    const domainCompletion: Record<string, number> = {};
    for (const domain of CURRICULUM) {
      domainCompletion[domain.id] = domain.lessons.filter(
        (l) => progress[l.id]?.status === "completed"
      ).length;
    }
    for (const domain of PRESCHOOL_CURRICULUM) {
      domainCompletion[domain.id] = domain.lessons.filter(
        (l) => progress[l.id]?.status === "completed"
      ).length;
    }
    for (const domain of G1.GRADE1_CURRICULUM) {
      domainCompletion[domain.id] = domain.lessons.filter(
        (l) => progress[l.id]?.status === "completed"
      ).length;
    }
    for (const domain of G2.GRADE2_CURRICULUM) {
      domainCompletion[domain.id] = domain.lessons.filter(
        (l) => progress[l.id]?.status === "completed"
      ).length;
    }
    for (const domain of G4.GRADE4_CURRICULUM) {
      domainCompletion[domain.id] = domain.lessons.filter(
        (l) => progress[l.id]?.status === "completed"
      ).length;
    }

    const ctx = {
      totalStars,
      completedCount,
      domainCompletion,
      perfectLessons,
      streak: state.streak,
    };
    const newlyEarned: string[] = [];
    for (const a of ACHIEVEMENTS) {
      if (!state.earnedAchievements.includes(a.id) && a.check(ctx)) {
        newlyEarned.push(a.id);
      }
    }
    const earnedAchievements = [...state.earnedAchievements, ...newlyEarned];

    // Detect domain completion: did finishing this lesson just complete a
    // whole domain? Compare before/after counts for the lesson's domain.
    let domainCompleted: { domainId: string; domainTitle: string } | null = null;
    const allDomains = [...CURRICULUM, ...PRESCHOOL_CURRICULUM, ...G1.GRADE1_CURRICULUM, ...G2.GRADE2_CURRICULUM, ...G4.GRADE4_CURRICULUM];
    for (const d of allDomains) {
      if (!d.lessons.some((l) => l.id === lessonId)) continue;
      const beforeCount = d.lessons.filter(
        (l) => state.progress[l.id]?.status === "completed"
      ).length;
      const afterCount = d.lessons.filter(
        (l) => progress[l.id]?.status === "completed"
      ).length;
      if (beforeCount < d.lessons.length && afterCount >= d.lessons.length) {
        domainCompleted = { domainId: d.id, domainTitle: d.title };
        break;
      }
    }

    set({
      progress,
      totalStars,
      earnedAchievements,
      lastEarnedAchievements: newlyEarned,
      domainCompleted,
      streak: wasCompleted ? state.streak : Math.max(state.streak, 1),
    });

    return { stars, score, newlyEarned };
  },

  clearDomainCelebration: () => set({ domainCompleted: null }),

  recordDailyResult: (correct, total) => {
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const today = new Date().toISOString().slice(0, 10);
    set({ dailyDoneDate: today, dailyScore: score, streak: Math.max(get().streak, 1) });
    return { score };
  },

  resetProgress: () => {
    const fresh = initialProgress();
    set({
      progress: fresh,
      totalStars: 0,
      streak: 0,
      earnedAchievements: [],
      dailyDoneDate: null,
      dailyScore: null,
      view: { name: "home" },
    });
  },
}));

// selectors
export function useDomainProgress(domainId: string) {
  return useGameStore(
    useShallow((s) => {
      const domain = CURRICULUM.find((d) => d.id === domainId);
      if (!domain) return { completed: 0, total: 0, stars: 0 };
      let completed = 0;
      let stars = 0;
      for (const lesson of domain.lessons) {
        const p = s.progress[lesson.id];
        if (p?.status === "completed") {
          completed++;
          stars += p.stars;
        }
      }
      return { completed, total: domain.lessons.length, stars };
    })
  );
}

export function useOverallProgress() {
  return useGameStore(
    useShallow((s) => {
      let ids: string[];
      let total: number;
      switch (s.level) {
        case "preschool": ids = PRESCHOOL_LESSON_IDS; total = PRESCHOOL_TOTAL_LESSONS; break;
        case "grade1": ids = G1.GRADE1_LESSON_IDS; total = G1.GRADE1_LESSON_IDS.length; break;
        case "grade2": ids = G2.GRADE2_LESSON_IDS; total = G2.GRADE2_LESSON_IDS.length; break;
        case "grade4": ids = G4.GRADE4_LESSON_IDS; total = G4.GRADE4_LESSON_IDS.length; break;
        default: ids = ALL_LESSONS.map((fl) => fl.lessonId); total = TOTAL_LESSONS;
      }
      let completed = 0;
      let stars = 0;
      for (const id of ids) {
        const p = s.progress[id];
        if (p?.status === "completed") {
          completed++;
          stars += p.stars;
        }
      }
      return {
        completed,
        total,
        stars,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    })
  );
}

// A stable primitive snapshot of the progress map for the current level.
export function useProgressSignature() {
  return useGameStore((s) => {
    let ids: string[];
    switch (s.level) {
      case "preschool": ids = PRESCHOOL_LESSON_IDS; break;
      case "grade1": ids = G1.GRADE1_LESSON_IDS; break;
      case "grade2": ids = G2.GRADE2_LESSON_IDS; break;
      case "grade4": ids = G4.GRADE4_LESSON_IDS; break;
      default: ids = ALL_LESSONS.map((fl) => fl.lessonId);
    }
    let sig = "";
    for (const id of ids) {
      const p = s.progress[id];
      sig += `${id}:${p?.status ?? "x"}:${p?.bestScore ?? 0}:${p?.stars ?? 0};`;
    }
    return sig;
  });
}

// Look up a lesson across all curricula.
export function findLessonAny(lessonId: string) {
  return findLesson(lessonId)
    ?? findPsLesson(lessonId)
    ?? G1.findG1Lesson(lessonId)
    ?? G2.findG2Lesson(lessonId)
    ?? G4.findG4Lesson(lessonId);
}

export { findLesson };
