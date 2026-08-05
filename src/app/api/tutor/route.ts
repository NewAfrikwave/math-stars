import { NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { getStudentForRequest } from "@/lib/student";
import { logError } from "@/lib/settings";
import { findLesson } from "@/lib/curriculum";
import { findPsLesson } from "@/lib/preschool";
import { findG1Lesson } from "@/lib/grade1";
import { findG2Lesson } from "@/lib/grade2";
import { findG4Lesson } from "@/lib/grade4";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { tutorFallback } from "@/lib/tutor-fallback";
import { tutorSystemPrompt } from "@/lib/tutor-context";

// POST /api/tutor
// Body: { message: string, lessonId?: string }
// Returns: { reply: string }
// Uses the LLM skill to act as a warm, patient, grade-aware math tutor.
export async function POST(req: Request) {
  const attempt = rateLimit(clientKey(req, "tutor"), 20, 10 * 60 * 1000);
  if (!attempt.allowed) return NextResponse.json({ error: "Please take a short break before asking again." }, { status: 429, headers: { "Retry-After": String(attempt.retryAfter) } });
  const body = await req.json().catch(() => null);
  if (!body || typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }
  const message = body.message.trim().slice(0, 500) as string;
  const personalInfo = /(?:\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b|\b\S+@\S+\.\S+\b|\b(?:my address|i live at|my phone|my school)\b)/i;
  if (personalInfo.test(message)) {
    return NextResponse.json({ reply: "Let's keep personal information private. Ask a math question without names, addresses, phone numbers, schools, or email addresses. 🌟" });
  }
  const lessonId = typeof body.lessonId === "string" ? body.lessonId : undefined;

  const student = await getStudentForRequest(req);

  // Build a context-aware system prompt.
  let lessonContext = "";
  let lessonForFallback: { title: string; subtitle?: string } | undefined;
  if (lessonId) {
    const found = findLesson(lessonId) ?? findPsLesson(lessonId) ?? findG1Lesson(lessonId) ?? findG2Lesson(lessonId) ?? findG4Lesson(lessonId);
    if (found) {
      lessonForFallback = { title: found.lesson.title, subtitle: found.lesson.subtitle };
      lessonContext = `\n\nThe learner is currently working on the lesson "${found.lesson.title}" (${found.lesson.subtitle}), part of the "${found.domain.title}" unit. Give hints and explanations that match this topic. Use small numbers and friendly examples.`;
    }
  }

  const systemPrompt = tutorSystemPrompt(student.level, lessonContext);

  // Load recent conversation for memory (last 6 turns).
  const recent = await db.tutorMessage.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
  const history = recent.reverse().map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const messages = [
    { role: "assistant" as const, content: systemPrompt },
    ...history,
    { role: "user" as const, content: message },
  ];

  // Save the user's message.
  await db.tutorMessage.create({
    data: {
      studentId: student.id,
      role: "user",
      content: message,
      context: lessonId ?? null,
    },
  });

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: "disabled" },
    });
    const reply =
      completion.choices[0]?.message?.content?.trim() ||
      "Hmm, my brain hiccuped! Can you ask that again? 😊";

    // Save the assistant reply.
    await db.tutorMessage.create({
      data: {
        studentId: student.id,
        role: "assistant",
        content: reply,
        context: lessonId ?? null,
      },
    });

    return NextResponse.json({ reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    await logError("/api/tutor", "POST", msg);
    const reply = tutorFallback(message, lessonForFallback);
    await db.tutorMessage.create({
      data: { studentId: student.id, role: "assistant", content: reply, context: lessonId ?? null },
    }).catch(() => {});
    return NextResponse.json({ reply, fallback: true });
  }
}

// GET /api/tutor — load the saved conversation history.
export async function GET(req: Request) {
  const student = await getStudentForRequest(req);
  const rows = await db.tutorMessage.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return NextResponse.json({
    messages: rows.map((r) => ({
      role: r.role,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function DELETE(req: Request) {
  const student = await getStudentForRequest(req);
  await db.tutorMessage.deleteMany({ where: { studentId: student.id } });
  return NextResponse.json({ ok: true });
}
