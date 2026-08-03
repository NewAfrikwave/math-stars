"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Send, Loader2, Trash2, Volume2 } from "lucide-react";
import { useGameStore, profileFetch } from "@/store/useGameStore";
import { Mascot } from "@/components/game/Mascot";
import { useTTS } from "@/hooks/use-tts";
import { cn } from "@/lib/utils";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What does × mean?",
  "Help me with my 6 times table",
  "How do I find the area of a rectangle?",
  "What's a fraction?",
  "Explain how to round 47 to the nearest 10",
];

export function TutorView() {
  const setView = useGameStore((s) => s.setView);
  const view = useGameStore((s) => s.view);
  const lessonId = view.name === "tutor" ? view.lessonId : undefined;
  const soundOn = useGameStore((s) => s.soundOn);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { speak, speaking, stop } = useTTS();
  const [autoSpeak, setAutoSpeak] = useState(true);
  const lastSpokenRef = useRef<string | null>(null);

  // Load history on mount
  useEffect(() => {
    let cancelled = false;
    profileFetch("/api/tutor")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages.map((m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })));
        } else {
          setMessages([
            {
              role: "assistant",
              content:
                "Hi friend! I'm Pip 🦊, your math buddy. Ask me anything about your math — multiplication, fractions, time, shapes, anything! What are you curious about?",
            },
          ]);
        }
      })
      .catch(() => {
        setMessages([
          {
            role: "assistant",
            content: "Hi! I'm Pip 🦊. Ask me a math question and I'll help you out!",
          },
        ]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    const userMsg: ChatMsg = { role: "user", content: trimmed };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    try {
      const res = await profileFetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, lessonId }),
      });
      const data = await res.json();
      const reply = data.reply ?? "Hmm, I didn't catch that. Try again? 🌟";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      // Auto-speak Pip's reply if sound is on.
      if (soundOn && autoSpeak) {
        lastSpokenRef.current = reply;
        speak(reply);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Oops, I had trouble thinking just now. Try again in a moment! 🌟" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    // We don't have a delete endpoint, but we can clear local messages and
    // reset to a greeting. Server history remains but is fine.
    setMessages([
      {
        role: "assistant",
        content: "Fresh start! What would you like to learn about? 🦊",
      },
    ]);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] w-full max-w-2xl flex-col px-4 pb-4 pt-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => setView({ name: "home" })} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Home
        </Button>
        <div className="flex items-center gap-2">
          <Mascot size={32} />
          <span className="font-display font-bold">Pip the Tutor</span>
        </div>
        <div className="flex items-center gap-1">
          {speaking && (
            <Button variant="ghost" size="sm" onClick={stop} className="gap-1 text-violet-600">
              <Volume2 className="h-4 w-4 animate-pulse" /> Stop
            </Button>
          )}
          <button
            onClick={() => setAutoSpeak((v) => !v)}
            title={autoSpeak ? "Pip's voice is ON" : "Pip's voice is OFF"}
            className={cn(
              "rounded-full px-2 py-1 text-xs font-bold transition-colors",
              autoSpeak
                ? "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                : "bg-muted text-muted-foreground"
            )}
          >
            🔊 {autoSpeak ? "Voice on" : "Voice off"}
          </button>
          <Button variant="ghost" size="sm" onClick={clearChat} className="gap-1 text-muted-foreground">
            <Trash2 className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        {/* Messages */}
        <div ref={scrollRef} className="nice-scroll flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              {m.role === "assistant" && (
                <div className="mr-2 mt-1 shrink-0">
                  <Mascot size={32} />
                </div>
              )}
              <div
                className={cn(
                  "group max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md bg-muted text-foreground"
                )}
              >
                {m.content}
                {m.role === "assistant" && (
                  <button
                    onClick={() => speak(m.content)}
                    title="Read aloud"
                    className="ml-2 inline-flex items-center align-middle text-violet-500 opacity-60 transition-opacity hover:opacity-100 group-hover:opacity-100"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mascot size={32} />
              <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-2.5">
                Pip is thinking
                <Loader2 className="ml-2 inline h-3.5 w-3.5 animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="border-t border-border p-3">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-2 border-t border-border p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send(input);
            }}
            placeholder="Ask Pip a math question..."
            className="h-11 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <Button
            size="icon"
            className="h-11 w-11 rounded-full"
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
