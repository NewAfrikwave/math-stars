import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStudent, getProfileId } from "@/lib/student";

// POST /api/settings — update learner settings (currently: level).
// Body: { level?: "preschool" | "grade3", soundOn?: boolean }
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  const student = await getStudent(getProfileId(req));
  const data: { level?: string; soundOn?: boolean } = {};
  if (body.level === "preschool" || body.level === "grade3") data.level = body.level;
  if (typeof body.soundOn === "boolean") data.soundOn = body.soundOn;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true, unchanged: true });
  }
  await db.student.update({ where: { id: student.id }, data });
  return NextResponse.json({ ok: true });
}
