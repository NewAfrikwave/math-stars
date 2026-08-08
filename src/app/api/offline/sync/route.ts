import { NextResponse } from "next/server";
import { getStudentForRequest } from "@/lib/student";
import { OfflineSyncError, processOfflineEvent } from "@/lib/offline/server";
import type { OfflineEvent } from "@/lib/offline/types";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { events?: OfflineEvent[] } | null;
  if (!body || !Array.isArray(body.events) || body.events.length < 1 || body.events.length > 25) {
    return NextResponse.json({ error: "Send between 1 and 25 offline events" }, { status: 400 });
  }
  const student = await getStudentForRequest(request);
  const acknowledged: string[] = [];
  const rejected: Array<{ eventId: string; error: string; retryable: boolean }> = [];

  for (const event of body.events) {
    if (!event || typeof event.eventId !== "string" || typeof event.profileId !== "string" || typeof event.type !== "string" || typeof event.createdAt !== "string") {
      rejected.push({ eventId: event?.eventId ?? "unknown", error: "Invalid offline event", retryable: false });
      continue;
    }
    try {
      await processOfflineEvent(student, event);
      const occurredAt = new Date(event.createdAt);
      await db.offlineSyncReceipt.upsert({
        where: { eventId: event.eventId },
        create: {
          eventId: event.eventId,
          studentId: student.id,
          eventType: event.type,
          occurredAt,
          delayMinutes: Math.max(0, Math.round((Date.now() - occurredAt.getTime()) / 60_000)),
        },
        update: {},
      });
      acknowledged.push(event.eventId);
    } catch (error) {
      const status = error instanceof OfflineSyncError ? error.status : 500;
      rejected.push({ eventId: event.eventId, error: error instanceof Error ? error.message : "Sync failed", retryable: status >= 500 });
    }
  }

  return NextResponse.json({ ok: rejected.every((item) => !item.retryable), acknowledged, rejected, serverTime: new Date().toISOString() });
}
