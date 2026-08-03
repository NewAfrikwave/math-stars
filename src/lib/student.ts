import { db } from "@/lib/db";
import { sessionFromRequest, type AppSession } from "@/lib/auth";
import type { LessonProgressState, LessonStatus } from "@/lib/types";

// Read the active profile id from the x-profile-id header (or query param).
// Falls back to "default-student" when none is provided (back-compat).
export function getProfileId(req: Request): string {
  const fromHeader = req.headers.get("x-profile-id");
  if (fromHeader) return fromHeader;
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get("profileId");
  if (fromQuery) return fromQuery;
  return "default-student";
}

// Get-or-create a student (profile) by its id.
export function requireSession(req: Request): AppSession {
  const session = sessionFromRequest(req);
  if (!session) throw new Error("authentication required");
  return session;
}

export function familyScope(session: AppSession) {
  return session.kind === "account" ? { familyId: session.familyId } : { familyId: null };
}

export async function requireActiveSession(req: Request) {
  const session = requireSession(req);
  if (session.kind === "account") {
    const active = await db.familyAccount.count({ where: { id: session.familyId, status: "active" } });
    if (!active) throw new Error("account unavailable");
  }
  return session;
}

export async function getStudentForRequest(req: Request) {
  const profileId = getProfileId(req);
  const session = await requireActiveSession(req);
  let student = await db.student.findFirst({ where: { id: profileId, ...familyScope(session) } });
  if (!student && profileId === "default-student" && session.kind === "legacy") {
    student = await db.student.create({
      data: {
        id: profileId,
        name: "Star Learner",
        avatar: "fox",
        level: "grade3",
        totalStars: 0,
        streak: 0,
        soundOn: true,
      },
    });
  }
  if (!student) throw new Error("profile not found");
  return student;
}

// Back-compat alias.
export async function getOrCreateStudent(req?: Request) {
  if (!req) throw new Error("request required");
  return getStudentForRequest(req);
}

// List all learner profiles.
export async function listStudents(req: Request) {
  const session = await requireActiveSession(req);
  return db.student.findMany({
    where: familyScope(session),
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      avatar: true,
      level: true,
      totalStars: true,
      streak: true,
      createdAt: true,
      lastPlayedAt: true,
    },
  });
}

// Convert DB rows into the client progress map shape.
export function toProgressMap(
  rows: Array<{
    lessonId: string;
    status: string;
    stars: number;
    bestScore: number;
    attempts: number;
    lastScore: number;
    completedAt: Date | null;
  }>
): Record<string, LessonProgressState> {
  const map: Record<string, LessonProgressState> = {};
  for (const r of rows) {
    map[r.lessonId] = {
      lessonId: r.lessonId,
      status: r.status as LessonStatus,
      stars: r.stars,
      bestScore: r.bestScore,
      attempts: r.attempts,
      lastScore: r.lastScore,
      completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    };
  }
  return map;
}
