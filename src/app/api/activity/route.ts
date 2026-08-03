import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStudentForRequest } from "@/lib/student";

// GET /api/activity?limit=20
// Returns recent activity events for the active profile (newest first).
// Used by the parent "Today" timeline.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));
  const student = await getStudentForRequest(req);

  const events = await db.activityEvent.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      type: e.type,
      lessonId: e.lessonId,
      title: e.title,
      emoji: e.emoji,
      score: e.score,
      correct: e.correct,
      total: e.total,
      stars: e.stars,
      createdAt: e.createdAt.toISOString(),
    })),
  });
}
