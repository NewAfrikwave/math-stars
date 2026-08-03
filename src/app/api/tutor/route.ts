import { NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { getStudent, getProfileId } from "@/lib/student";
import { logError } from "@/lib/settings";
import { findLesson } from "@/lib/curriculum";

// POST /api/tutor
// Body: { message: string, lessonId?: string }
// Returns: { reply: string }
// Uses the LLM skill to act as a warm, patient 3rd-grade math tutor.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }
  const message = body.message as string;
  const lessonId = typeof body.lessonId === "string" ? body.lessonId : undefined;

  const student = await getStudent(getProfileId(req));

  // Build a context-aware system prompt.
  let lessonContext = "";
  if (lessonId) {
    const found = findLesson(lessonId);
    if (found) {
      lessonContext = `\n\nThe learner is currently working on the lesson "${found.lesson.title}" (${found.lesson.subtitle}), part of the "${found.domain.title}" unit. Give hints and explanations that match this topic. Use small numbers and friendly examples.`;
    }
  }

  const systemPrompt = `You are "Pip", a cheerful, patient math tutor for an 8-year-old in US 3rd grade.
Rules:
- Always be warm, encouraging, and use simple words a child understands.
- Use short sentences. Use emojis occasionally (one or two per reply) to stay friendly.
- When the child is stuck on a problem, do NOT just blurt out the answer. Instead, give a hint or ask a guiding question, then let them try. Only confirm the answer after they attempt it.
- Use concrete, fun examples: cookies, balloons, puppies, stars, pizza.
- If they seem frustrated, reassure them that mistakes help our brains grow.
- Keep replies under 90 words unless they specifically ask for a longer explanation.
- If a question is not about math, gently steer back to math in a friendly way.${lessonContext}`;

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
    await logError("/api/tutor", "POST", msg, err instanceof Error ? err.stack : undefined);
    return NextResponse.json(
      { reply: `I'm having trouble thinking right now (${msg}). Try again in a moment! 🌟` },
      { status: 200 }
    );
  }
}

// GET /api/tutor — load the saved conversation history.
export async function GET() {
  const student = await getStudent(getProfileId(req));
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
