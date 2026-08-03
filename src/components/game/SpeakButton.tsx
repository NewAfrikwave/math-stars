"use client";

import { Volume2, Loader2, Square } from "lucide-react";
import { useTTS } from "@/hooks/use-tts";
import { cn } from "@/lib/utils";

interface SpeakButtonProps {
  text: string;
  label?: string;
  speed?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "ghost";
}

// A self-contained read-aloud button. Each instance manages its own speaking
// state but uses the shared audio element, so starting one stops any other.
export function SpeakButton({
  text,
  label,
  speed,
  className,
  size = "md",
  variant = "ghost",
}: SpeakButtonProps) {
  const { speak, stop, speaking, loading } = useTTS();

  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  const pad = size === "sm" ? "px-2.5 py-1.5 text-xs" : size === "lg" ? "px-5 py-3 text-base" : "px-3 py-2 text-sm";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (speaking) stop();
        else speak(text, { speed });
      }}
      disabled={loading}
      aria-label={label ?? "Read aloud"}
      title={label ?? "Read aloud"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold transition-all",
        "disabled:opacity-50 disabled:cursor-wait",
        pad,
        variant === "solid"
          ? "bg-violet-500 text-white hover:bg-violet-600 shadow-sm"
          : "bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-900/60",
        speaking && "ring-2 ring-violet-400 ring-offset-1",
        className
      )}
    >
      {loading ? (
        <Loader2 className={cn(iconSize, "animate-spin")} />
      ) : speaking ? (
        <Square className={cn(iconSize, "fill-current")} />
      ) : (
        <Volume2 className={iconSize} />
      )}
      {label && <span>{speaking ? "Stop" : label}</span>}
    </button>
  );
}
