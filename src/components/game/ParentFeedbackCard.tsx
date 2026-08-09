"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bug, CheckCircle2, Lightbulb, Loader2, MessageCircle, Send, WifiOff } from "lucide-react";
import { ARCADE_GAMES } from "@/lib/arcade";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { FeedbackArea, FeedbackCategory } from "@/lib/parent-feedback";

interface FeedbackItem {
  id: string;
  category: FeedbackCategory;
  area: FeedbackArea;
  gameKey: string | null;
  message: string;
  status: "new" | "reviewing" | "resolved";
  createdAt: string;
}

const categories: Array<{ id: FeedbackCategory; label: string; description: string; icon: typeof Bug }> = [
  { id: "bug", label: "Report a bug", description: "Something is not working", icon: Bug },
  { id: "suggestion", label: "Share an idea", description: "A feature or improvement", icon: Lightbulb },
  { id: "general", label: "General feedback", description: "Tell us about your experience", icon: MessageCircle },
];

const areas: Array<{ id: FeedbackArea; label: string }> = [
  { id: "voice-audio", label: "Voice, reading, or sound" },
  { id: "arcade", label: "Arcade game" },
  { id: "lessons", label: "Lessons or questions" },
  { id: "offline", label: "Offline use or syncing" },
  { id: "parent-dashboard", label: "Parent dashboard" },
  { id: "account", label: "Account or sign-in" },
  { id: "other", label: "Something else" },
];

export function ParentFeedbackCard({ parentPin, learnerLevel, familyAccount }: { parentPin: string; learnerLevel: string | null; familyAccount: boolean }) {
  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [area, setArea] = useState<FeedbackArea>("voice-audio");
  const [gameKey, setGameKey] = useState(ARCADE_GAMES[0].key);
  const [message, setMessage] = useState("");
  const [contactAllowed, setContactAllowed] = useState(false);
  const [recent, setRecent] = useState<FeedbackItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);

  const loadRecent = useCallback(async () => {
    if (!navigator.onLine) return;
    const response = await fetch("/api/feedback", { headers: { "x-parent-pin": parentPin }, cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setRecent(data.feedback ?? []);
  }, [parentPin]);

  useEffect(() => {
    const update = () => {
      const isOnline = navigator.onLine;
      setOnline(isOnline);
      if (isOnline) void loadRecent();
    };
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const timer = window.setTimeout(() => void loadRecent(), 0);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, [loadRecent]);

  const selectedCategory = useMemo(() => categories.find((item) => item.id === category)!, [category]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!online) return setNotice("Reconnect to the internet before sending feedback.");
    if (message.trim().length < 10) return setNotice("Please add a little more detail so we can understand it.");
    setSubmitting(true);
    setNotice(null);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-parent-pin": parentPin },
        body: JSON.stringify({
          category,
          area,
          gameKey: area === "arcade" ? gameKey : null,
          learnerLevel,
          pagePath: window.location.pathname,
          message,
          contactAllowed: familyAccount && contactAllowed,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.feedback) throw new Error(data?.error ?? "Your feedback could not be sent.");
      setRecent((items) => [data.feedback, ...items].slice(0, 10));
      setMessage("");
      setContactAllowed(false);
      setNotice("Thank you. Your feedback is now in the Math Stars review inbox.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Your feedback could not be sent. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mt-6 overflow-hidden p-0">
      <div className="bg-gradient-to-r from-[#173f31] to-[#2e7652] p-5 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><MessageCircle className="h-7 w-7" /></span>
          <div>
            <h2 className="font-display text-xl font-bold">Help us improve Math Stars</h2>
            <p className="text-sm text-emerald-50/90">Report a problem, share an idea, or tell us what your family needs.</p>
          </div>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-5 p-5">
        {!online && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-950">
            <WifiOff className="mt-0.5 h-4 w-4 shrink-0" /> Feedback can be written now, but it needs an internet connection to send.
          </div>
        )}
        <fieldset>
          <legend className="text-sm font-bold">What would you like to share?</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {categories.map((item) => {
              const Icon = item.icon;
              const selected = category === item.id;
              return (
                <button key={item.id} type="button" onClick={() => setCategory(item.id)} aria-pressed={selected} className={cn("rounded-xl border p-3 text-left transition", selected ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200" : "border-border hover:bg-muted/40")}>
                  <span className="flex items-center gap-2 font-bold"><Icon className="h-4 w-4 text-emerald-700" />{item.label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{item.description}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold">Which part of Math Stars?
            <select value={area} onChange={(event) => setArea(event.target.value as FeedbackArea)} className="mt-2 h-11 w-full rounded-lg border border-border bg-card px-3 text-sm font-semibold">
              {areas.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          {area === "arcade" && (
            <label className="text-sm font-bold">Which game?
              <select value={gameKey} onChange={(event) => setGameKey(event.target.value as typeof gameKey)} className="mt-2 h-11 w-full rounded-lg border border-border bg-card px-3 text-sm font-semibold">
                {ARCADE_GAMES.map((game) => <option key={game.key} value={game.key}>{game.emoji} {game.title}</option>)}
              </select>
            </label>
          )}
        </div>
        <label className="block text-sm font-bold">{selectedCategory.label}
          <Textarea value={message} onChange={(event) => setMessage(event.target.value.slice(0, 2_000))} rows={5} maxLength={2_000} placeholder={category === "bug" ? "What happened? What did you expect to happen?" : category === "suggestion" ? "What would make Math Stars better for your family?" : "Tell us what is working well or what could improve."} className="mt-2 resize-y" />
          <span className="mt-1 block text-right text-xs font-normal text-muted-foreground">{message.length}/2,000</span>
        </label>
        {familyAccount && (
          <label className="flex items-start gap-3 rounded-xl bg-muted/40 p-3 text-sm">
            <input type="checkbox" checked={contactAllowed} onChange={(event) => setContactAllowed(event.target.checked)} className="mt-1 h-4 w-4 accent-emerald-700" />
            <span><strong>You may email me about this report.</strong><span className="mt-0.5 block text-xs text-muted-foreground">Your account email stays private and is shown to the Math Stars admin only if you check this box.</span></span>
          </label>
        )}
        {notice && <div role="status" className={cn("flex items-start gap-2 rounded-xl p-3 text-sm font-semibold", notice.startsWith("Thank you") ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-950")}>{notice.startsWith("Thank you") ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}{notice}</div>}
        <Button type="submit" disabled={submitting || !online || message.trim().length < 10} className="w-full gap-2 bg-emerald-800 hover:bg-emerald-900">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send to Math Stars
        </Button>
      </form>
      {recent.length > 0 && (
        <div className="border-t border-border bg-muted/20 p-5">
          <h3 className="text-sm font-bold">Your recent feedback</h3>
          <div className="mt-3 space-y-2">
            {recent.slice(0, 3).map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-card p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold capitalize">{item.category === "bug" ? "Bug report" : item.category}</span>
                  <span className={cn("rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide", item.status === "resolved" ? "bg-emerald-100 text-emerald-800" : item.status === "reviewing" ? "bg-amber-100 text-amber-800" : "bg-violet-100 text-violet-800")}>{item.status}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
