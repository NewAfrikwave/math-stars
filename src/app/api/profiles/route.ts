import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { familyScope, listStudents, requireActiveSession } from "@/lib/student";
import type { Level } from "@/lib/types";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { pinFrom, verifyPin } from "@/lib/pin";

// GET /api/profiles — list learner profiles owned by the signed-in family.
export async function GET(req: Request) {
  const profiles = await listStudents(req);
  return NextResponse.json({ profiles });
}

// POST /api/profiles — create a new profile.
// Body: { name: string, level: "preschool" | "grade3", avatar?: string }
export async function POST(req: Request) {
  const attempt = rateLimit(clientKey(req, "profile-create"), 10, 60 * 60 * 1000);
  if (!attempt.allowed) return NextResponse.json({ error: "Too many profile requests" }, { status: 429 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const name = String(body.name).trim().slice(0, 30);
  const session = await requireActiveSession(req);
  const scope = familyScope(session);
  const level: Level =
    body.level === "preschool" ? "preschool" :
    body.level === "grade1" ? "grade1" :
    body.level === "grade2" ? "grade2" :
    body.level === "grade4" ? "grade4" :
    "grade3";
  if (await db.student.count({ where: scope }) >= 12) return NextResponse.json({ error: "profile limit reached" }, { status: 409 });
  const allowedAvatars = ["fox", "owl"];
  const avatar = allowedAvatars.includes(body.avatar) ? body.avatar : "fox";
  const protectedProfile = await db.student.findFirst({
    where: { ...scope, NOT: { parentPin: null } },
    select: { parentPin: true },
  });
  const id = `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const student = await db.student.create({
    data: { id, familyId: session.familyId, name, level, avatar, parentPin: protectedProfile?.parentPin ?? null, totalStars: 0, streak: 0, soundOn: true },
  });
  return NextResponse.json({
    id: student.id,
    name: student.name,
    avatar: student.avatar,
    level: student.level,
  });
}

// DELETE /api/profiles?id=xxx — delete a profile (and all its data via cascade).
export async function DELETE(req: Request) {
  const attempt = rateLimit(clientKey(req, "profile-delete"), 10, 15 * 60 * 1000);
  if (!attempt.allowed) return NextResponse.json({ error: "Too many profile requests" }, { status: 429 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const scope = familyScope(await requireActiveSession(req));
  const protectedProfile = await db.student.findFirst({
    where: { ...scope, NOT: { parentPin: null } },
    select: { parentPin: true },
  });
  if (!protectedProfile?.parentPin) {
    return NextResponse.json({ error: "parent PIN required" }, { status: 403 });
  }
  if (!verifyPin(pinFrom(req), protectedProfile.parentPin)) {
    return NextResponse.json({ error: "wrong-pin" }, { status: 401 });
  }
  try {
    const target = await db.student.findFirst({ where: { id, ...scope }, select: { id: true } });
    if (!target) return NextResponse.json({ error: "not found" }, { status: 404 });
    await db.student.delete({ where: { id: target.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
