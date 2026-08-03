import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  SESSION_COOKIE,
  sessionCookieOptions,
  sessionFromRequest,
} from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function DELETE(req: Request) {
  const attempt = rateLimit(clientKey(req, "account-delete"), 5, 60 * 60 * 1000);
  if (!attempt.allowed) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  const session = sessionFromRequest(req);
  if (!session || session.kind !== "account") return NextResponse.json({ error: "Family account required" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  const confirmation = body?.confirmation;
  const account = await db.familyAccount.findUnique({ where: { id: session.familyId } });
  if (!account || confirmation !== "DELETE MY FAMILY ACCOUNT" || !verifyPassword(password, account.passwordHash)) {
    return NextResponse.json({ error: "Password or confirmation is incorrect" }, { status: 401 });
  }
  await db.familyAccount.delete({ where: { id: account.id } });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", { ...adminSessionCookieOptions, maxAge: 0 });
  return response;
}
