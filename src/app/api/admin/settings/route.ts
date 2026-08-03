import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";
import { hashPin, pinFrom, verifyPin } from "@/lib/pin";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json({ hasAdminPin: !!settings.adminPin });
}

// POST /api/admin/settings — update site-wide settings.
// Body: { adminPin?: string, action?: "verify-pin"|"set-pin"|"clear-pin", pin?: string, ...settings }
// Requires the admin PIN (if set) to be passed as ?pin=XXXX.
export async function POST(req: Request) {
  const attempt = rateLimit(clientKey(req, "admin-pin"), 20, 15 * 60 * 1000);
  if (!attempt.allowed) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  const pin = pinFrom(req);
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const settings = await getSiteSettings();

  // PIN management actions
  if (body.action === "set-pin") {
    const newPin = String(body.pin ?? "").trim();
    if (!/^\d{4}$/.test(newPin)) {
      return NextResponse.json({ error: "PIN must be 4 digits" }, { status: 400 });
    }
    if (settings.adminPin && !verifyPin(pin, settings.adminPin)) {
      return NextResponse.json({ error: "wrong-pin", hasAdminPin: true }, { status: 401 });
    }
    await db.siteSettings.update({ where: { id: "site" }, data: { adminPin: hashPin(newPin) } });
    return NextResponse.json({ ok: true, hasAdminPin: true });
  }
  if (body.action === "verify-pin") {
    if (!settings.adminPin) return NextResponse.json({ ok: true, hasAdminPin: false });
    if (!verifyPin(pin, settings.adminPin)) {
      return NextResponse.json({ error: "wrong-pin", hasAdminPin: true }, { status: 401 });
    }
    return NextResponse.json({ ok: true, hasAdminPin: true });
  }
  if (body.action === "clear-pin") {
    if (settings.adminPin && !verifyPin(pin, settings.adminPin)) {
      return NextResponse.json({ error: "wrong-pin", hasAdminPin: true }, { status: 401 });
    }
    await db.siteSettings.update({ where: { id: "site" }, data: { adminPin: null } });
    return NextResponse.json({ ok: true, hasAdminPin: false });
  }

  // For all other updates, require admin PIN.
  if (settings.adminPin && !verifyPin(pin, settings.adminPin)) {
    return NextResponse.json({ error: "wrong-pin", hasAdminPin: true }, { status: 401 });
  }

  // Update feature flags + donation handles + broadcast
  const data: Record<string, unknown> = {};
  const boolFields = [
    "dailyChallengeEnabled", "aiTutorEnabled", "voiceAnswersEnabled",
    "worksheetsEnabled", "manipulativesEnabled", "soundEffectsEnabled",
    "broadcastActive",
  ];
  const strFields = ["cashappHandle", "zelleInfo", "broadcastMessage"];
  for (const f of boolFields) {
    if (typeof body[f] === "boolean") data[f] = body[f];
  }
  for (const f of strFields) {
    if (typeof body[f] === "string") data[f] = body[f];
    if (body[f] === null && f === "broadcastMessage") data[f] = null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  await db.siteSettings.update({ where: { id: "site" }, data });
  return NextResponse.json({ ok: true });
}
