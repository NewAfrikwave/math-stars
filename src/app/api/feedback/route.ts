import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { familyScope, requireActiveSession } from "@/lib/student";
import { pinFrom, verifyPin } from "@/lib/pin";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { parseParentFeedback } from "@/lib/parent-feedback";

async function parentSession(req: Request) {
  try {
    const session = await requireActiveSession(req);
    const protectedProfile = await db.student.findFirst({
      where: { ...familyScope(session), NOT: { parentPin: null } },
      select: { parentPin: true },
    });
    if (!protectedProfile?.parentPin || !verifyPin(pinFrom(req), protectedProfile.parentPin)) return null;
    return session;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const session = await parentSession(req);
  if (!session) return NextResponse.json({ error: "parent-pin-required" }, { status: 401 });
  const scopeKey = session.kind === "account" ? session.familyId : "legacy";
  const feedback = await db.parentFeedback.findMany({
    where: { scopeKey },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, category: true, area: true, gameKey: true, message: true, status: true, createdAt: true },
  });
  return NextResponse.json({
    feedback: feedback.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
  });
}

export async function POST(req: Request) {
  const attempt = rateLimit(clientKey(req, "parent-feedback"), 10, 60 * 60 * 1000);
  if (!attempt.allowed) {
    return NextResponse.json({ error: "You have sent several reports recently. Please try again later." }, {
      status: 429,
      headers: { "Retry-After": String(attempt.retryAfter) },
    });
  }
  const session = await parentSession(req);
  if (!session) return NextResponse.json({ error: "parent-pin-required" }, { status: 401 });
  const parsed = parseParentFeedback(await req.json().catch(() => null));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const scopeKey = session.kind === "account" ? session.familyId : "legacy";
  const created = await db.parentFeedback.create({
    data: {
      scopeKey,
      familyId: session.kind === "account" ? session.familyId : null,
      ...parsed.data,
    },
    select: { id: true, category: true, area: true, gameKey: true, message: true, status: true, createdAt: true },
  });
  return NextResponse.json({ feedback: { ...created, createdAt: created.createdAt.toISOString() } }, { status: 201 });
}
