import { NextResponse } from "next/server";
import { listGradePackMetadata } from "@/lib/offline/grade-packs";

export async function GET() {
  return NextResponse.json({ packs: listGradePackMetadata() }, {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
