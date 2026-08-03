import { NextResponse } from "next/server";
import { createSessionValue, hasPrivilegedSessionSecret, SESSION_COOKIE, sessionCookieOptions, verifyAccessCode } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeEmail, verifyPassword } from "@/lib/password";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const attempt = rateLimit(clientKey(req, "login"), 8, 15 * 60 * 1000);
  if (!attempt.allowed) {
    return NextResponse.json({ error: "Too many attempts" }, {
      status: 429,
      headers: { "Retry-After": String(attempt.retryAfter) },
    });
  }
  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (code) {
    if (!verifyAccessCode(code)) {
      return NextResponse.json({ error: "Incorrect family access code" }, { status: 401 });
    }
    const response = NextResponse.json({ ok: true, accountType: "legacy" });
    response.cookies.set(SESSION_COOKIE, createSessionValue(null), sessionCookieOptions);
    return response;
  }

  if (!hasPrivilegedSessionSecret()) {
    return NextResponse.json({ error: "Account sign-in is temporarily unavailable." }, { status: 503 });
  }
  const email = normalizeEmail(body?.email);
  const password = typeof body?.password === "string" ? body.password : "";
  const account = email ? await db.familyAccount.findUnique({ where: { email } }) : null;
  if (!account || account.status !== "active" || !verifyPassword(password, account.passwordHash)) {
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }
  const now = new Date();
  await db.familyAccount.update({
    where: { id: account.id },
    data: { lastLoginAt: now, lastActiveAt: now },
  });
  const response = NextResponse.json({ ok: true, accountType: "family" });
  response.cookies.set(SESSION_COOKIE, createSessionValue(account.id), sessionCookieOptions);
  return response;
}
