import type { Difficulty, LessonProgressState, Level, Problem } from "@/lib/types";
import type { ArcadeAnswerRecord, ArcadeGameKey, ArcadeQuestion } from "@/lib/arcade";

export const OFFLINE_DB_NAME = "math-stars-anywhere";
export const OFFLINE_DB_VERSION = 1;
export const OFFLINE_PACK_VERSION = "2026.08.2";

export type OfflineEvent =
  | {
      eventId: string;
      profileId: string;
      type: "lesson-complete";
      createdAt: string;
      payload: { attemptId: string; lessonId: string; correct: number; total: number; difficulty?: Difficulty; timezoneOffsetMinutes: number };
    }
  | {
      eventId: string;
      profileId: string;
      type: "daily-complete";
      createdAt: string;
      payload: { dateKey: string; correct: number; total: number; timezoneOffsetMinutes: number };
    }
  | {
      eventId: string;
      profileId: string;
      type: "arcade-complete";
      createdAt: string;
      payload: {
        attemptId: string;
        gameKey: ArcadeGameKey;
        level: Level;
        questions: ArcadeQuestion[];
        answers: ArcadeAnswerRecord[];
        timezoneOffsetMinutes: number;
      };
    }
  | {
      eventId: string;
      profileId: string;
      type: "profile-settings";
      createdAt: string;
      payload: { soundOn?: boolean; level?: Level; companionId?: string };
    };

export type StoredOfflineEvent = OfflineEvent & {
  status: "pending" | "failed";
  attempts: number;
  nextAttemptAt: number;
  lastError?: string;
};

export interface OfflineSnapshot<T = unknown> {
  key: string;
  value: T;
  savedAt: string;
}

export interface OfflineGradePack {
  level: Level;
  label: string;
  version: string;
  downloadedAt: string;
  estimatedBytes: number;
  lessonCount: number;
  assets: string[];
  lessons: unknown[];
}

export interface OfflinePreferences {
  lowDataMode: boolean;
  autoSync: boolean;
  lastSyncAt: string | null;
}

export interface OfflineCheckpoint {
  key: string;
  profileId: string;
  lessonId: string;
  attemptId: string;
  difficulty?: Difficulty;
  problems: Problem[];
  nextIndex: number;
  correctCount: number;
  total: number;
  updatedAt: string;
}

export interface CachedLearnerState {
  studentName: string;
  level: Level | null;
  totalStars: number;
  streak: number;
  soundOn: boolean;
  progress: Record<string, LessonProgressState>;
  earnedAchievements: string[];
  dailyDoneDate: string | null;
  dailyScore: number | null;
  reward?: unknown;
  activeCheckpoint?: OfflineCheckpoint | null;
}

export interface OfflineArcadeRun {
  key: string;
  profileId: string;
  attemptId: string;
  gameKey: ArcadeGameKey;
  level: Level;
  questions: ArcadeQuestion[];
  answers: ArcadeAnswerRecord[];
  nextIndex: number;
  correctCount: number;
  status: "active" | "completed";
  coinsEarned: number;
  dailyBonus: number;
  updatedAt: string;
}
