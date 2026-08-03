import { NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// POST /api/tts
// Body: { text: string, speed?: number, voice?: string }
// Returns: audio/wav binary
// Used for read-aloud on questions/choices and Pip the tutor's voice.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.text !== "string" || !body.text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  const text = body.text.slice(0, 1000); // API limit is 1024
  const speed = typeof body.speed === "number" ? Math.min(2, Math.max(0.5, body.speed)) : 1.0;
  const voice = typeof body.voice === "string" ? body.voice : "tongtong";

  try {
    const zai = await ZAI.create();
    const response = await zai.audio.tts.create({
      input: text,
      voice,
      speed,
      response_format: "wav",
      stream: false,
    });
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "tts failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
