import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";
import { hashPin, pinFrom, verifyPin } from "@/lib/pin";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionValue,
  isAdminRequest,
  sessionFromRequest,
} from "@/lib/auth";

export async function GET(req: Request) {
  const settings = await getSiteSettings();
  if (!isAdminRequest(req)) return NextResponse.json({ hasAdminPin: !!settings.adminPin, authenticated: false });
  return NextResponse.json({
    hasAdminPin: !!settings.adminPin,
    authenticated: true,
    dailyChallengeEnabled: settings.dailyChallengeEnabled,
    aiTutorEnabled: settings.aiTutorEnabled,
    voiceAnswersEnabled: settings.voiceAnswersEnabled,
    worksheetsEnabled: settings.worksheetsEnabled,
    manipulativesEnabled: settings.manipulativesEnabled,
    soundEffectsEnabled: settings.soundEffectsEnabled,
    cashappHandle: settings.cashappHandle,
    zelleInfo: settings.zelleInfo,
    broadcastMessage: settings.broadcastMessage,
    broadcastActive: settings.broadcastActive,
  });
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
    if (settings.adminPin && !isAdminRequest(req)) {
      return NextResponse.json({ error: "admin-session-required", hasAdminPin: true }, { status: 401 });
    }
    if (!settings.adminPin && sessionFromRequest(req)?.kind !== "legacy") {
      return NextResponse.json({ error: "Only the site owner can initialize admin access." }, { status: 403 });
    }
    await db.siteSettings.update({ where: { id: "site" }, data: { adminPin: hashPin(newPin) } });
    const response = NextResponse.json({ ok: true, hasAdminPin: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionValue(), adminSessionCookieOptions);
    return response;
  }
  if (body.action === "verify-pin") {
    if (!settings.adminPin) return NextResponse.json({ ok: true, hasAdminPin: false });
    if (!verifyPin(pin, settings.adminPin)) {
      return NextResponse.json({ error: "wrong-pin", hasAdminPin: true }, { status: 401 });
    }
    const response = NextResponse.json({ ok: true, hasAdminPin: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionValue(), adminSessionCookieOptions);
    return response;
  }
  if (body.action === "clear-pin") {
    if (settings.adminPin && !isAdminRequest(req)) return NextResponse.json({ error: "admin-session-required" }, { status: 401 });
    await db.siteSettings.update({ where: { id: "site" }, data: { adminPin: null } });
    const response = NextResponse.json({ ok: true, hasAdminPin: false });
    response.cookies.set(ADMIN_SESSION_COOKIE, "", { ...adminSessionCookieOptions, maxAge: 0 });
    return response;
  }

  // For all other updates, require admin PIN.
  if (!isAdminRequest(req)) return NextResponse.json({ error: "admin-session-required", hasAdminPin: !!settings.adminPin }, { status: 401 });

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
