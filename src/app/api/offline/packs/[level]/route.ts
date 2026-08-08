import { NextResponse } from "next/server";
import { buildGradePack, isOfflineLevel } from "@/lib/offline/grade-packs";

export async function GET(_request: Request, context: { params: Promise<{ level: string }> }) {
  const { level } = await context.params;
  if (!isOfflineLevel(level)) return NextResponse.json({ error: "Unknown grade pack" }, { status: 404 });
  return NextResponse.json(buildGradePack(level), {
    headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
  });
}
