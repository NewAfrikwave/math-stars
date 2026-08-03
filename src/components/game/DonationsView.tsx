"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Heart, Copy, Check, ExternalLink, Gift } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { Mascot } from "@/components/game/Mascot";
import { cn } from "@/lib/utils";

export function DonationsView() {
  const setView = useGameStore((s) => s.setView);
  const siteSettings = useGameStore((s) => s.siteSettings);
  const [copied, setCopied] = useState<"cashapp" | "zelle" | null>(null);

  // Read donation handles from site settings (editable via admin panel),
  // falling back to defaults.
  const CASHAPP_HANDLE = siteSettings?.cashappHandle ?? "$mathstars";
  const CASHAPP_URL = `https://cash.app/${CASHAPP_HANDLE}`;
  const ZELLE_INFO = siteSettings?.zelleInfo ?? "donate@mathstars.app";

  const copy = (text: string, which: "cashapp" | "zelle") => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-6">
      <Button variant="ghost" size="sm" onClick={() => setView({ name: "home" })} className="mb-4 gap-1">
        <ArrowLeft className="h-4 w-4" /> Home
      </Button>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 p-6 text-center text-white shadow-lg"
      >
        <div className="absolute -right-6 -top-6 text-[100px] opacity-15">💛</div>
        <Mascot size={64} className="mx-auto animate-bob" />
        <h1 className="mt-2 font-display text-3xl font-bold">Keep Math Stars Free</h1>
        <p className="mt-2 text-sm text-white/90">
          Math Stars will always be free for families. Your donation helps keep the lights on
          so every child can learn — thank you! 💛
        </p>
      </motion.div>

      {/* Why donate card */}
      <Card className="mt-5 p-5">
        <div className="flex items-start gap-3">
          <Gift className="mt-0.5 h-6 w-6 shrink-0 text-rose-500" />
          <div className="text-sm">
            <p className="font-display font-bold">Where does your donation go?</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>🖥️ Server costs to keep Math Stars online</li>
              <li>🎙️ AI tutor + voice features (per-use fees)</li>
              <li>📚 New lessons and grade levels as we grow</li>
              <li>💛 Staying ad-free and kid-safe, forever</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Payment options */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {/* Cash App */}
        <Card className="overflow-hidden border-2 border-emerald-200 p-0 dark:border-emerald-900">
          <div className="bg-emerald-500 px-4 py-3 text-center text-white">
            <p className="font-display text-lg font-bold">Cash App</p>
            <p className="text-xs text-white/80">Quick & easy</p>
          </div>
          <div className="p-4 text-center">
            {/* QR code via API */}
            <div className="mx-auto mb-3 w-fit rounded-xl bg-white p-2 shadow-sm">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(CASHAPP_URL)}`}
                alt="Cash App QR code"
                width={160}
                height={160}
                className="rounded-lg"
              />
            </div>
            <p className="font-display text-lg font-bold text-emerald-600">{CASHAPP_HANDLE}</p>
            <p className="mb-3 text-xs text-muted-foreground">Scan with your phone's camera</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copy(CASHAPP_HANDLE, "cashapp")}
                className="flex-1 gap-1.5"
              >
                {copied === "cashapp" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied === "cashapp" ? "Copied!" : "Copy"}
              </Button>
              <Button
                size="sm"
                asChild
                className="flex-1 gap-1.5 bg-emerald-500 hover:bg-emerald-600"
              >
                <a href={CASHAPP_URL} target="_blank" rel="noopener noreferrer">
                  Open <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </Card>

        {/* Zelle */}
        <Card className="overflow-hidden border-2 border-violet-200 p-0 dark:border-violet-900">
          <div className="bg-violet-600 px-4 py-3 text-center text-white">
            <p className="font-display text-lg font-bold">Zelle</p>
            <p className="text-xs text-white/80">Through your bank</p>
          </div>
          <div className="p-4 text-center">
            <div className="mx-auto mb-3 w-fit rounded-xl bg-white p-2 shadow-sm">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(ZELLE_INFO)}`}
                alt="Zelle QR code"
                width={160}
                height={160}
                className="rounded-lg"
              />
            </div>
            <p className="font-display text-lg font-bold text-violet-600">{ZELLE_INFO}</p>
            <p className="mb-3 text-xs text-muted-foreground">Send via your bank's Zelle feature</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copy(ZELLE_INFO, "zelle")}
              className="w-full gap-1.5"
            >
              {copied === "zelle" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied === "zelle" ? "Copied!" : "Copy email"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Thank you note */}
      <Card className="mt-5 flex items-center gap-3 bg-amber-50 p-4 dark:bg-amber-950/20">
        <Heart className="h-8 w-8 shrink-0 fill-rose-500 text-rose-500" />
        <div className="text-sm">
          <p className="font-display font-bold">Every dollar matters.</p>
          <p className="text-muted-foreground">
            Whether it's $5 or $50, your support keeps Math Stars alive for kids everywhere.
            Thank you for being part of this! 🌟
          </p>
        </div>
      </Card>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Math Stars is a free learning project. Donations are voluntary and not required to use any feature.
      </p>
    </div>
  );
}
