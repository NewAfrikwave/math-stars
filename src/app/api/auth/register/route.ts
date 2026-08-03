import { NextResponse } from "next/server";
import { createSessionValue, hasPrivilegedSessionSecret, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword, isValidEmail, normalizeEmail, passwordError } from "@/lib/password";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!hasPrivilegedSessionSecret()) {
    return NextResponse.json({ error: "Account sign-up is temporarily unavailable." }, { status: 503 });
  }
  const attempt = rateLimit(clientKey(req, "register"), 5, 60 * 60 * 1000);
  if (!attempt.allowed) {
    return NextResponse.json({ error: "Too many signup attempts" }, {
      status: 429,
      headers: { "Retry-After": String(attempt.retryAfter) },
    });
  }

  const body = await req.json().catch(() => null);
  const displayName = typeof body?.displayName === "string" ? body.displayName.trim().slice(0, 60) : "";
  const email = normalizeEmail(body?.email);
  const password = typeof body?.password === "string" ? body.password : "";
  if (body?.acceptPrivacy !== true) return NextResponse.json({ error: "Please accept the family privacy notice." }, { status: 400 });
  if (displayName.length < 2) return NextResponse.json({ error: "Enter the parent or guardian name." }, { status: 400 });
  if (!isValidEmail(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const invalidPassword = passwordError(password);
  if (invalidPassword) return NextResponse.json({ error: invalidPassword }, { status: 400 });

  const existing = await db.familyAccount.findUnique({ where: { email }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "An account already exists for this email." }, { status: 409 });

  const now = new Date();
  const account = await db.familyAccount.create({
    data: {
      displayName,
      email,
      passwordHash: hashPassword(password),
      privacyAcceptedAt: now,
      lastLoginAt: now,
      lastActiveAt: now,
    },
  });
  const response = NextResponse.json({ ok: true, accountType: "family" }, { status: 201 });
  response.cookies.set(SESSION_COOKIE, createSessionValue(account.id), sessionCookieOptions);
  return response;
}
