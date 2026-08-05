"use client";

import { useEffect, useState } from "react";
import { Calculator, Loader2, Send, ShieldQuestion, X } from "lucide-react";
import { profileFetch, useGameStore } from "@/store/useGameStore";

export type PracticeTool = "pip" | "tables";

export function PracticeToolsDialog({
  open,
  initialTool,
  lessonId,
  onClose,
}: {
  open: boolean;
  initialTool: PracticeTool;
  lessonId: string;
  onClose: () => void;
}) {
  const studentName = useGameStore((state) => state.studentName);
  const [tool, setTool] = useState<PracticeTool>(initialTool);
  const [table, setTable] = useState(2);
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  if (!open) return null;

  const askPip = async (suggested?: string) => {
    const message = (suggested ?? question).trim();
    if (!message || loading) return;
    setLoading(true);
    setReply("");
    try {
      const response = await profileFetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, lessonId }),
      });
      const data = await response.json().catch(() => null) as { reply?: string; error?: string } | null;
      if (!response.ok) throw new Error(data?.error ?? "Pip could not answer just now.");
      setReply(data?.reply ?? "Let’s look at the question one small step at a time.");
      setQuestion("");
    } catch (error) {
      setReply(error instanceof Error ? error.message : "Pip could not answer just now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#160b04]/70 p-3" role="dialog" aria-modal="true" aria-label="Practice learning tools">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border-4 border-[#6d4824] bg-[#fff4d2] p-4 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-2xl font-black text-[#24482d]">Learning tools</p>
            <p className="text-sm font-semibold text-[#725d40]">Get help without losing your place in the lesson.</p>
          </div>
          <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ead6a8] hover:bg-[#ddc48f]" aria-label="Close learning tools"><X /></button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-[#ead6a8] p-2">
          <button onClick={() => setTool("pip")} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl font-display font-black ${tool === "pip" ? "bg-[#315f3a] text-white" : "text-[#5f482d] hover:bg-white/50"}`}><ShieldQuestion className="h-5 w-5" />Ask Pip</button>
          <button onClick={() => setTool("tables")} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl font-display font-black ${tool === "tables" ? "bg-[#69518c] text-white" : "text-[#5f482d] hover:bg-white/50"}`}><Calculator className="h-5 w-5" />Times Tables</button>
        </div>

        {tool === "pip" ? (
          <div className="mt-5">
            <div className="rounded-2xl border-2 border-[#8d7aae] bg-[#f1e9fa] p-4">
              <p className="font-display text-lg font-black text-[#4c386c]">Hi {studentName}, what part should we solve together?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Give me a hint", "Explain equal groups", "Help me use a times table"].map((suggestion) => (
                  <button key={suggestion} onClick={() => askPip(suggestion)} className="rounded-full border border-[#9d88ba] bg-white px-3 py-2 text-sm font-bold text-[#5b4778] hover:bg-[#e7dcf3]">{suggestion}</button>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") askPip(); }} placeholder="Ask Pip a math question" className="min-h-12 flex-1 rounded-2xl border-2 border-[#aa96c2] bg-white px-4 outline-none focus:border-[#5b4778]" />
                <button onClick={() => askPip()} disabled={!question.trim() || loading} className="flex h-12 w-12 items-center justify-center rounded-full bg-[#69518c] text-white disabled:opacity-50" aria-label="Send question to Pip">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}</button>
              </div>
            </div>
            {reply && <div className="mt-4 rounded-2xl border-2 border-[#78a37e] bg-[#e3f0df] p-4" role="status"><p className="font-display font-black text-[#285f3b]">Pip says:</p><p className="mt-1 font-semibold leading-relaxed text-[#38513d]">{reply}</p></div>}
          </div>
        ) : (
          <div className="mt-5">
            <div className="flex gap-2 overflow-x-auto pb-2" aria-label="Choose a times table">
              {Array.from({ length: 11 }, (_, index) => index + 2).map((value) => <button key={value} onClick={() => setTable(value)} aria-pressed={table === value} className={`flex h-12 min-w-12 items-center justify-center rounded-xl border-2 font-display font-black ${table === value ? "border-[#315f3a] bg-[#315f3a] text-white" : "border-[#c49d5d] bg-[#fff9e8] text-[#654a2b]"}`}>{value}×</button>)}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {Array.from({ length: 12 }, (_, index) => index + 1).map((factor) => <div key={factor} className="rounded-xl border border-[#d2b274] bg-white p-3 text-center font-display text-lg font-black text-[#31573a]">{table} × {factor} = <span className="text-[#9a302c]">{table * factor}</span></div>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
