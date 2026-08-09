import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";
import { FEEDBACK_CATEGORIES, feedbackStatus, type FeedbackCategory } from "@/lib/parent-feedback";

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "admin-session-required" }, { status: 401 });
  const params = new URL(req.url).searchParams;
  const requestedStatus = params.get("status");
  const requestedCategory = params.get("category");
  const where: Prisma.ParentFeedbackWhereInput = {};
  if (requestedStatus === "open") where.status = { in: ["new", "reviewing"] };
  else {
    const status = feedbackStatus(requestedStatus);
    if (status) where.status = status;
  }
  if (requestedCategory && FEEDBACK_CATEGORIES.includes(requestedCategory as FeedbackCategory)) {
    where.category = requestedCategory;
  }
  const [feedback, newCount, reviewingCount, resolvedCount] = await Promise.all([
    db.parentFeedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { family: { select: { displayName: true, email: true } } },
    }),
    db.parentFeedback.count({ where: { status: "new" } }),
    db.parentFeedback.count({ where: { status: "reviewing" } }),
    db.parentFeedback.count({ where: { status: "resolved" } }),
  ]);
  return NextResponse.json({
    counts: { new: newCount, reviewing: reviewingCount, resolved: resolvedCount },
    feedback: feedback.map((item) => ({
      id: item.id,
      category: item.category,
      area: item.area,
      gameKey: item.gameKey,
      learnerLevel: item.learnerLevel,
      pagePath: item.pagePath,
      message: item.message,
      contactAllowed: item.contactAllowed,
      status: item.status,
      familyName: item.family?.displayName ?? "Legacy family access",
      familyEmail: item.contactAllowed ? item.family?.email ?? null : null,
      createdAt: item.createdAt.toISOString(),
      resolvedAt: item.resolvedAt?.toISOString() ?? null,
    })),
  });
}

export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "admin-session-required" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const status = feedbackStatus(body?.status);
  if (!id || !status) return NextResponse.json({ error: "valid id and status required" }, { status: 400 });
  const updated = await db.parentFeedback.update({
    where: { id },
    data: { status, resolvedAt: status === "resolved" ? new Date() : null },
    select: { id: true, status: true, resolvedAt: true },
  }).catch(() => null);
  if (!updated) return NextResponse.json({ error: "feedback not found" }, { status: 404 });
  return NextResponse.json({
    feedback: { ...updated, resolvedAt: updated.resolvedAt?.toISOString() ?? null },
  });
}
