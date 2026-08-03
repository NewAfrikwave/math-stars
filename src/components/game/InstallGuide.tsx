"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  X,
  Apple,
  Smartphone,
  Share,
  PlusSquare,
  Check,
  Download,
  Heart,
} from "lucide-react";
import { Mascot } from "@/components/game/Mascot";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// A friendly, parent-facing guide for installing Math Stars as a PWA on
// iPads, iPhones, and Android tablets. Also hooks into the browser's
// native "add to home screen" prompt when available.
// Detect platform once (lazy init, not in an effect).
function detectPlatform(): "ios" | "android" {
  if (typeof navigator === "undefined") return "ios";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "ios";
}

export function InstallGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [platform, setPlatform] = useState<"ios" | "android">(detectPlatform);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  // Listen for the native install prompt (only when open).
  useEffect(() => {
    if (!open) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [open]);

  const handleNativeInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-background p-6 shadow-2xl nice-scroll"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 rounded-full bg-muted p-2 text-muted-foreground hover:bg-muted/70"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="mb-5 flex flex-col items-center text-center">
              <Mascot size={64} className="animate-bob" />
              <h2 className="mt-2 font-display text-2xl font-bold">Put Math Stars on your tablet</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                It works just like an app — no App Store needed! Free for every family.
              </p>
            </div>

            {/* Native install button (Chrome/Edge on Android/desktop) */}
            {installPrompt && !installed && (
              <Button size="lg" onClick={handleNativeInstall} className="mb-4 w-full gap-2">
                <Download className="h-5 w-5" /> Install Math Stars now
              </Button>
            )}
            {installed && (
              <div className="mb-4 flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 p-3 font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                <Check className="h-5 w-5" /> Math Stars is installed!
              </div>
            )}

            {/* Platform tabs */}
            <div className="mb-4 flex gap-2">
              <PlatformTab active={platform === "ios"} onClick={() => setPlatform("ios")} icon={<Apple className="h-4 w-4" />} label="iPad / iPhone" />
              <PlatformTab active={platform === "android"} onClick={() => setPlatform("android")} icon={<Smartphone className="h-4 w-4" />} label="Android" />
            </div>

            {/* Steps */}
            {platform === "ios" ? (
              <div className="space-y-3">
                <Step n={1} icon={<Smartphone className="h-5 w-5" />}>
                  Open <b>Safari</b> and go to the Math Stars website.
                </Step>
                <Step n={2} icon={<Share className="h-5 w-5" />}>
                  Tap the <b>Share</b> button <Share className="inline h-4 w-4" /> at the top of the screen.
                </Step>
                <Step n={3} icon={<PlusSquare className="h-5 w-5" />}>
                  Scroll down and tap <b>"Add to Home Screen"</b>.
                </Step>
                <Step n={4} icon={<Check className="h-5 w-5" />}>
                  Tap <b>"Add"</b> — Math Stars appears on the home screen like an app!
                </Step>
              </div>
            ) : (
              <div className="space-y-3">
                <Step n={1} icon={<Smartphone className="h-5 w-5" />}>
                  Open <b>Chrome</b> and go to the Math Stars website.
                </Step>
                <Step n={2} icon={<Share className="h-5 w-5" />}>
                  Tap the <b>three dots</b> menu (⋮) in the top right.
                </Step>
                <Step n={3} icon={<PlusSquare className="h-5 w-5" />}>
                  Tap <b>"Add to Home screen"</b> or <b>"Install app"</b>.
                </Step>
                <Step n={4} icon={<Check className="h-5 w-5" />}>
                  Tap <b>"Install"</b> — Math Stars is now on the home screen!
                </Step>
              </div>
            )}

            {/* Tip card */}
            <Card className="mt-5 flex items-start gap-3 bg-amber-50 p-4 dark:bg-amber-950/20">
              <Heart className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
              <div className="text-sm">
                <p className="font-semibold">Math Stars is 100% free for families.</p>
                <p className="text-muted-foreground">
                  If you'd like to help keep it running, tap the heart on the home screen to send a donation. 💛
                </p>
              </div>
            </Card>

            <Button variant="outline" onClick={onClose} className="mt-4 w-full">
              Got it!
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PlatformTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition-all",
        active ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Step({ n, icon, children }: { n: number; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
        {n}
      </div>
      <div className="flex flex-1 items-start gap-2 pt-0.5">
        <span className="mt-0.5 text-primary">{icon}</span>
        <p className="text-sm leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
