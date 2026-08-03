import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/settings";

// GET /api/site — public site settings (feature flags, broadcast, donations).
// No PIN required — this is what the client app reads to know which features
// are enabled and what donation handles to show.
export async function GET() {
  const s = await getSiteSettings();
  return NextResponse.json({
    dailyChallengeEnabled: s.dailyChallengeEnabled,
    aiTutorEnabled: s.aiTutorEnabled,
    voiceAnswersEnabled: s.voiceAnswersEnabled,
    worksheetsEnabled: s.worksheetsEnabled,
    manipulativesEnabled: s.manipulativesEnabled,
    soundEffectsEnabled: s.soundEffectsEnabled,
    cashappHandle: s.cashappHandle,
    zelleInfo: s.zelleInfo,
    broadcastMessage: s.broadcastActive ? s.broadcastMessage : null,
  });
}
