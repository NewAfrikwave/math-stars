import { NextResponse } from "next/server";
import { createSessionValue, SESSION_COOKIE, sessionCookieOptions, verifyAccessCode } from "@/lib/auth";
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
  const code = typeof body?.code === "string" ? body.code : "";
  if (!verifyAccessCode(code)) {
    return NextResponse.json({ error: "Incorrect family access code" }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, createSessionValue(), sessionCookieOptions);
  return response;
}
