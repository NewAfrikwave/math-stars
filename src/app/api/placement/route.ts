import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStudentForRequest } from "@/lib/student";
import { CURRICULUM, isLessonAvailable } from "@/lib/curriculum";
import { PRESCHOOL_CURRICULUM, psIsLessonAvailable, findPsDomain } from "@/lib/preschool";
import { GRADE1_CURRICULUM, isLessonAvailable as isG1LessonAvailable, findG1Domain } from "@/lib/grade1";
import { GRADE2_CURRICULUM, isLessonAvailable as isG2LessonAvailable, findG2Domain } from "@/lib/grade2";
import { GRADE4_CURRICULUM, isLessonAvailable as isG4LessonAvailable, findG4Domain } from "@/lib/grade4";

// POST /api/placement
// Body: { domainId, correct, total }
// If the learner scores >= 67% (2/3), unlock ALL lessons in that domain so she
// can skip ahead. Logs a placement activity event either way.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.domainId !== "string") {
    return NextResponse.json({ error: "domainId required" }, { status: 400 });
  }
  const { domainId } = body as { domainId: string };
  const correct = Math.max(0, Math.floor(Number(body.correct ?? 0)));
  const total = Math.max(1, Math.floor(Number(body.total ?? 3)));
  const score = Math.round((correct / total) * 100);
  const passed = score >= 67;

  const student = await getStudentForRequest(req);
  const profileId = student.id;

  // Find the domain across all curricula.
  const domain =
    CURRICULUM.find((d) => d.id === domainId)
    ?? findPsDomain(domainId)
    ?? findG1Domain(domainId)
    ?? findG2Domain(domainId)
    ?? findG4Domain(domainId);
  if (!domain) {
    return NextResponse.json({ error: "domain not found" }, { status: 404 });
  }
  // Determine which availability helper to use based on the domain's curriculum.
  const avail =
    !!findPsDomain(domainId) ? psIsLessonAvailable :
    !!findG1Domain(domainId) ? isG1LessonAvailable :
    !!findG2Domain(domainId) ? isG2LessonAvailable :
    !!findG4Domain(domainId) ? isG4LessonAvailable :
    isLessonAvailable;

  // If passed, mark all lessons in the domain as available (skip the sequential
  // unlock). We don't auto-complete them — the learner still plays them to earn
  // stars — but they're all unlocked now.
  let unlockedCount = 0;
  if (passed) {
    for (const lesson of domain.lessons) {
      const existing = await db.lessonProgress.findUnique({
        where: { studentId_lessonId: { studentId: student.id, lessonId: lesson.id } },
      });
      if (existing?.status === "completed") continue;
      if (existing?.status === "available") continue;
      if (!existing) {
        await db.lessonProgress.create({
          data: {
            studentId: student.id,
            lessonId: lesson.id,
            status: "available",
            stars: 0,
            bestScore: 0,
            attempts: 0,
            lastScore: 0,
          },
        });
        unlockedCount++;
      } else {
        await db.lessonProgress.update({
          where: { id: existing.id },
          data: { status: "available" },
        });
        unlockedCount++;
      }
    }
    void avail; // referenced for clarity
  }

  // Log the placement activity event.
  await db.activityEvent.create({
    data: {
      studentId: student.id,
      type: "placement",
      title: `${domain.title} placement`,
      emoji: domain.emoji,
      score,
      correct,
      total,
    },
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    passed,
    score,
    unlockedCount,
    message: passed
      ? `Great job! You unlocked all ${unlockedCount} lessons in ${domain.title}.`
      : "Keep practicing — you'll get there! Try the lessons one at a time.",
  });
}
