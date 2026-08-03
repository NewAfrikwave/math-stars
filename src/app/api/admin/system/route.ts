import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

// GET /api/admin/system?pin=XXXX — DB stats + recent error log.
export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "admin-session-required" }, { status: 401 });

  // Row counts per table
  const [
    families, devices, students, lessonProgress, dailyChallenges, achievements,
    tutorMessages, activityEvents, errorLogs,
  ] = await Promise.all([
    db.familyAccount.count(),
    db.accountDevice.count(),
    db.student.count(),
    db.lessonProgress.count(),
    db.dailyChallenge.count(),
    db.achievement.count(),
    db.tutorMessage.count(),
    db.activityEvent.count(),
    db.errorLog.count(),
  ]);

  // Recent errors (last 20)
  const recentErrors = await db.errorLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Errors by route (top 5)
  const errorsByRouteRaw = await db.errorLog.groupBy({
    by: ["route"],
    _count: { route: true },
    orderBy: { _count: { route: "desc" } },
    take: 5,
  });
  const errorsByRoute = errorsByRouteRaw.map((r) => ({ route: r.route, count: r._count.route }));

  return NextResponse.json({
    dbStats: {
      students,
      families,
      devices,
      lessonProgress,
      dailyChallenges,
      achievements,
      tutorMessages,
      activityEvents,
      errorLogs,
    },
    recentErrors: recentErrors.map((e) => ({
      id: e.id,
      route: e.route,
      method: e.method,
      message: e.message,
      detail: e.detail,
      createdAt: e.createdAt.toISOString(),
    })),
    errorsByRoute,
    serverTime: new Date().toISOString(),
  });
}
