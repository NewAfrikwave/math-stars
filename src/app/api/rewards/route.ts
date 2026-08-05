import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { familyScope, getStudentForRequest, requireActiveSession } from "@/lib/student";
import { domainsForLevel, topicGoalBaseline, type RewardTargetType } from "@/lib/rewards";
import { getCurrentRewardMission } from "@/lib/reward-server";
import { pinFrom, verifyPin } from "@/lib/pin";
import { clientKey, rateLimit } from "@/lib/rate-limit";

async function requireParentPin(req: Request) {
  const session = await requireActiveSession(req);
  const scope = familyScope(session);
  const protectedProfile = await db.student.findFirst({
    where: { ...scope, NOT: { parentPin: null } },
    select: { parentPin: true },
  });
  return !!protectedProfile?.parentPin && verifyPin(pinFrom(req), protectedProfile.parentPin);
}

// Learners may read only their own active reward mission.
export async function GET(req: Request) {
  const student = await getStudentForRequest(req);
  return NextResponse.json({ reward: await getCurrentRewardMission(student.id) });
}

// Reward changes are always protected by the family's parent PIN.
export async function POST(req: Request) {
  const attempt = rateLimit(clientKey(req, "reward-change"), 30, 15 * 60 * 1000);
  if (!attempt.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  if (!(await requireParentPin(req))) {
    return NextResponse.json({ error: "Parent PIN required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.action !== "string") {
    return NextResponse.json({ error: "Action required" }, { status: 400 });
  }
  const student = await getStudentForRequest(req);

  if (body.action === "create") {
    const targetType = body.targetType as RewardTargetType;
    if (!(["lessons", "stars", "topic", "arcade-wins", "coins"] as string[]).includes(targetType)) {
      return NextResponse.json({ error: "Choose a valid goal" }, { status: 400 });
    }
    const title = String(body.title ?? "").trim().slice(0, 60);
    if (!title) return NextResponse.json({ error: "Reward title required" }, { status: 400 });
    const emoji = Array.from(String(body.emoji ?? "🎁").trim()).slice(0, 4).join("") || "🎁";
    const description = String(body.description ?? "").trim().slice(0, 160) || null;
    const completed = await db.lessonProgress.count({ where: { studentId: student.id, status: "completed" } });
    let targetValue = Math.min(100, Math.max(1, Math.floor(Number(body.targetValue ?? 5))));
    const arcadeWins = targetType === "arcade-wins"
      ? await db.arcadeRun.count({ where: { studentId: student.id, status: "completed" } })
      : 0;
    let startValue = targetType === "stars"
      ? student.totalStars
      : targetType === "coins"
        ? student.arcadeCoins
        : targetType === "arcade-wins"
          ? arcadeWins
          : completed;
    let domainId: string | null = null;

    if (targetType === "topic") {
      const domain = domainsForLevel(student.level).find((item) => item.id === body.domainId);
      if (!domain) return NextResponse.json({ error: "Choose a topic for this grade" }, { status: 400 });
      const completedIds = (await db.lessonProgress.findMany({
        where: { studentId: student.id, status: "completed", lessonId: { in: domain.lessons.map((lesson) => lesson.id) } },
        select: { lessonId: true },
      })).map((row) => row.lessonId);
      const baseline = topicGoalBaseline(domain.lessons.map((lesson) => lesson.id), completedIds);
      if (!baseline) {
        return NextResponse.json({ error: "This topic is already complete. Choose another topic or a stars goal." }, { status: 409 });
      }
      domainId = domain.id;
      targetValue = baseline.targetValue;
      startValue = baseline.startValue;
    }

    await db.$transaction(async (tx) => {
      await tx.rewardGoal.updateMany({
        where: { studentId: student.id, currentKey: student.id },
        data: { status: "archived", currentKey: null },
      });
      await tx.rewardGoal.create({
        data: { studentId: student.id, title, emoji, description, targetType, targetValue, startValue, domainId, currentKey: student.id },
      });
    });
    return NextResponse.json({ ok: true, reward: await getCurrentRewardMission(student.id) });
  }

  if (body.action === "claim" || body.action === "archive") {
    const reward = await db.rewardGoal.findFirst({
      where: { id: String(body.rewardId ?? ""), studentId: student.id, currentKey: student.id },
    });
    if (!reward) return NextResponse.json({ error: "Reward not found" }, { status: 404 });
    if (body.action === "claim" && reward.status !== "earned") {
      return NextResponse.json({ error: "Reward has not been earned yet" }, { status: 409 });
    }
    await db.rewardGoal.update({
      where: { id: reward.id },
      data: body.action === "claim"
        ? { status: "claimed", claimedAt: new Date(), currentKey: null }
        : { status: "archived", currentKey: null },
    });
    return NextResponse.json({ ok: true, reward: null });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
