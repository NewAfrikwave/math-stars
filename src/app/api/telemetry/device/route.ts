import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionFromRequest } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const DEVICE_TYPES = new Set(["phone", "tablet", "desktop", "tv", "unknown"]);
const LAUNCH_MODES = new Set(["browser", "standalone", "fullscreen"]);

function shortValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 40) : fallback;
}

export async function POST(req: Request) {
  const attempt = rateLimit(clientKey(req, "device-presence"), 180, 60 * 60 * 1000);
  if (!attempt.allowed) return NextResponse.json({ error: "Too many updates" }, { status: 429 });
  const session = sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const deviceKey = shortValue(body?.deviceKey, "").slice(0, 80);
  if (!deviceKey) return NextResponse.json({ error: "deviceKey required" }, { status: 400 });

  const deviceType = DEVICE_TYPES.has(body?.deviceType) ? body.deviceType : "unknown";
  const launchMode = LAUNCH_MODES.has(body?.launchMode) ? body.launchMode : "browser";
  const platform = shortValue(body?.platform, "Unknown");
  const browser = shortValue(body?.browser, "Unknown");
  const installed = body?.installed === true || launchMode === "standalone" || launchMode === "fullscreen";
  const event = body?.event === "launch" || body?.event === "install" ? body.event : "heartbeat";
  const now = new Date();
  const scopeKey = session.kind === "account" ? session.familyId : "legacy";

  if (session.kind === "account") {
    const active = await db.familyAccount.count({ where: { id: session.familyId, status: "active" } });
    if (!active) return NextResponse.json({ error: "Account unavailable" }, { status: 403 });
  }

  const existingDevice = await db.accountDevice.findUnique({
    where: { scopeKey_deviceKey: { scopeKey, deviceKey } },
    select: { installedAt: true },
  });

  await db.accountDevice.upsert({
    where: { scopeKey_deviceKey: { scopeKey, deviceKey } },
    create: {
      scopeKey,
      familyId: session.familyId,
      deviceKey,
      deviceType,
      platform,
      browser,
      launchMode,
      installed,
      installedAt: installed ? now : null,
      firstSeenAt: now,
      lastSeenAt: now,
      visitCount: 1,
    },
    update: {
      deviceType,
      platform,
      browser,
      launchMode,
      lastSeenAt: now,
      ...(installed
        ? { installed: true, ...(existingDevice?.installedAt ? {} : { installedAt: now }) }
        : {}),
      ...(event === "launch" ? { visitCount: { increment: 1 } } : {}),
    },
  });

  if (session.kind === "account") {
    await db.familyAccount.updateMany({
      where: { id: session.familyId, status: "active" },
      data: { lastActiveAt: now },
    });
  }
  return NextResponse.json({ ok: true });
}
