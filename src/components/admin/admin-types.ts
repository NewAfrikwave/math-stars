export type AdminTab = "analytics" | "families" | "learners" | "features" | "system" | "settings";
export type AnalyticsSection = "overview" | "engagement" | "outcomes" | "devices" | "reports";

export interface SiteSettings {
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

export interface GradeStat {
  level: string;
  label: string;
  learners: number;
  activeLearners: number;
  lessonsCompleted: number;
  avgScore: number;
  strongestDomain: string;
  needsPractice: string;
}

export interface AnalyticsData {
  totalFamilies: number;
  totalLearners: number;
  activeNow: number;
  active24h: number;
  activeFamilies7: number;
  newFamilies7: number;
  totalDevices: number;
  installedDevices: number;
  activeLearners: number;
  inactiveLearners: number;
  avgScore: number;
  totalLessonsCompleted: number;
  lessonsToday: number;
  arcadeToday: number;
  tutorMessagesToday: number;
  popularLessons: Array<{ lessonId: string; title: string; emoji: string; attempts: number; avgScore: number; completions: number }>;
  domainStats: Array<{ id: string; title: string; emoji: string; completed: number; total: number }>;
  activityByDay: Array<{ date: string; count: number; lessons: number; arcade: number; avgScore: number }>;
  signupByDay: Array<{ date: string; count: number }>;
  deviceMix: Array<{ name: string; count: number }>;
  platformMix: Array<{ name: string; count: number }>;
  gradeStats: GradeStat[];
  recentFamilies: Array<{ id: string; displayName: string; email: string; status: string; learners: number; devices: number; createdAt: string; lastLoginAt: string | null; lastActiveAt: string | null }>;
  recentDevices: Array<{ id: string; familyName: string; familyEmail: string | null; deviceType: string; platform: string; browser: string; launchMode: string; installed: boolean; firstSeenAt: string; lastSeenAt: string; visitCount: number }>;
}
