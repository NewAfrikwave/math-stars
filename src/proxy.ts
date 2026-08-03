import { NextRequest, NextResponse } from "next/server";
import { activeSessionFromValue } from "@/lib/session-access";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/auth/")) return NextResponse.next();
  if (await activeSessionFromValue(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
  const response = NextResponse.json({ error: "Authentication required" }, { status: 401 });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
}

export const config = { matcher: ["/api/:path*"] };
