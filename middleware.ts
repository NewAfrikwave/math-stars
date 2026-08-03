import { NextRequest, NextResponse } from "next/server";

const COOKIE = "math_stars_session";

async function valid(value: string | undefined) {
  const secret = process.env.SESSION_SECRET || process.env.FAMILY_ACCESS_CODE || "";
  if (!value || !secret) return false;
  const parts = value.split(".");
  const scope = parts[0];
  const isAccount = scope === "account";
  const familyId = isAccount ? parts[1] : null;
  const expiresRaw = isAccount ? parts[2] : parts[1];
  const supplied = isAccount ? parts[3] : parts[2];
  if (!expiresRaw || !supplied || (scope !== "account" && scope !== "legacy" && scope !== "family")) return false;
  if (Number(expiresRaw) <= Math.floor(Date.now() / 1000)) return false;
  const payload = isAccount ? `${scope}.${familyId}.${expiresRaw}` : `${scope}.${expiresRaw}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const expected = btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  return expected === supplied;
}

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/auth/")) return NextResponse.next();
  if (await valid(req.cookies.get(COOKIE)?.value)) return NextResponse.next();
  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
}

export const config = { matcher: ["/api/:path*"] };
