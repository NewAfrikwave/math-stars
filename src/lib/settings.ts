import { db } from "@/lib/db";

// Default site settings (used when the SiteSettings row doesn't exist yet).
export interface SiteSettingsData {
  adminPin: string | null;
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

const DEFAULTS: SiteSettingsData = {
  adminPin: null,
  dailyChallengeEnabled: true,
  aiTutorEnabled: true,
  voiceAnswersEnabled: true,
  worksheetsEnabled: true,
  manipulativesEnabled: true,
  soundEffectsEnabled: true,
  cashappHandle: "",
  zelleInfo: "",
  broadcastMessage: null,
  broadcastActive: false,
};

// Get-or-create the singleton site settings row.
export async function getSiteSettings(): Promise<SiteSettingsData> {
  let row = await db.siteSettings.findUnique({ where: { id: "site" } });
  if (!row) {
    row = await db.siteSettings.create({ data: { id: "site" } });
  }
  return {
    adminPin: row.adminPin,
    dailyChallengeEnabled: row.dailyChallengeEnabled,
    aiTutorEnabled: row.aiTutorEnabled,
    voiceAnswersEnabled: row.voiceAnswersEnabled,
    worksheetsEnabled: row.worksheetsEnabled,
    manipulativesEnabled: row.manipulativesEnabled,
    soundEffectsEnabled: row.soundEffectsEnabled,
    cashappHandle: row.cashappHandle === "$mathstars" ? "" : row.cashappHandle,
    zelleInfo: row.zelleInfo === "donate@mathstars.app" ? "" : row.zelleInfo,
    broadcastMessage: row.broadcastMessage,
    broadcastActive: row.broadcastActive,
  };
}

export { DEFAULTS };

// Log an error to the ErrorLog table (best-effort, never throws).
export async function logError(route: string, method: string, message: string, detail?: string) {
  try {
    const safeMessage = message.replace(/[\w.+-]+@[\w.-]+/g, "[redacted-email]").slice(0, 500);
    const safeDetail = detail?.replace(/[\w.+-]+@[\w.-]+/g, "[redacted-email]").slice(0, 2000);
    await db.errorLog.create({
      data: { route, method, message: safeMessage, detail: safeDetail ?? null },
    });
  } catch {
    /* never let error logging itself fail the request */
  }
}
