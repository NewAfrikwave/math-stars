import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { familyScope, getStudentForRequest, requireActiveSession } from "@/lib/student";
import { domainsForLevel, type RewardTargetType } from "@/lib/rewards";
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
    if (!(["lessons", "stars", "topic"] as string[]).includes(targetType)) {
      return NextResponse.json({ error: "Choose a valid goal" }, { status: 400 });
    }
    const title = String(body.title ?? "").trim().slice(0, 60);
    if (!title) return NextResponse.json({ error: "Reward title required" }, { status: 400 });
    const emoji = Array.from(String(body.emoji ?? "🎁").trim()).slice(0, 4).join("") || "🎁";
    const description = String(body.description ?? "").trim().slice(0, 160) || null;
    const completed = await db.lessonProgress.count({ where: { studentId: student.id, status: "completed" } });
    let targetValue = Math.min(100, Math.max(1, Math.floor(Number(body.targetValue ?? 5))));
    let startValue = targetType === "stars" ? student.totalStars : completed;
    let domainId: string | null = null;

    if (targetType === "topic") {
      const domain = domainsForLevel(student.level).find((item) => item.id === body.domainId);
      if (!domain) return NextResponse.json({ error: "Choose a topic for this grade" }, { status: 400 });
      domainId = domain.id;
      targetValue = domain.lessons.length;
      startValue = 0;
    }

    await db.rewardGoal.updateMany({
      where: { studentId: student.id, status: { in: ["active", "earned"] } },
      data: { status: "archived" },
    });
    await db.rewardGoal.create({
      data: { studentId: student.id, title, emoji, description, targetType, targetValue, startValue, domainId },
    });
    return NextResponse.json({ ok: true, reward: await getCurrentRewardMission(student.id) });
  }

  if (body.action === "claim" || body.action === "archive") {
    const reward = await db.rewardGoal.findFirst({
      where: { id: String(body.rewardId ?? ""), studentId: student.id },
    });
    if (!reward) return NextResponse.json({ error: "Reward not found" }, { status: 404 });
    if (body.action === "claim" && reward.status !== "earned") {
      return NextResponse.json({ error: "Reward has not been earned yet" }, { status: 409 });
    }
    await db.rewardGoal.update({
      where: { id: reward.id },
      data: body.action === "claim"
        ? { status: "claimed", claimedAt: new Date() }
        : { status: "archived" },
    });
    return NextResponse.json({ ok: true, reward: null });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
