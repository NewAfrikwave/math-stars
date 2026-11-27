import { appRelease } from "@/lib/app-release";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ release: await appRelease() }, { headers: { "Cache-Control": "private, no-store" } });
}
