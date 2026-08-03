"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { speakableText } from "@/lib/speech";

// A simple in-memory cache so the same text isn't re-synthesized on replay.
const cache = new Map<string, string>();
// A single shared <audio> element reused across the app.
let sharedAudio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (typeof window === "undefined") {
    // SSR guard — should never be called server-side
    return {} as HTMLAudioElement;
  }
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.preload = "auto";
  }
  return sharedAudio;
}

interface UseTTSResult {
  speaking: boolean;
  loading: boolean;
  error: string | null;
  /** Speak the given text. Cancels any currently playing speech. */
  speak: (text: string, opts?: { speed?: number }) => void;
  /** Stop any current playback. */
  stop: () => void;
}

// Read-aloud hook backed by /api/tts (z-ai-web-dev-sdk TTS).
// Shared across all callers so only one piece of text plays at a time.
export function useTTS(): UseTTSResult {
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const stop = useCallback(() => {
    const audio = getAudio();
    audio.pause();
    audio.currentTime = 0;
    if (mounted.current) setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, opts?: { speed?: number }) => {
      const clean = speakableText(text);
      if (!clean) return;
      const audio = getAudio();
      // cancel anything currently playing
      audio.pause();
      audio.currentTime = 0;

      const key = `${opts?.speed ?? 1}::${clean}`;
      const playUrl = (url: string) => {
        audio.src = url;
        audio
          .play()
          .then(() => {
            if (mounted.current) {
              setSpeaking(true);
              setError(null);
            }
          })
          .catch((e) => {
            if (mounted.current) {
              setError(e instanceof Error ? e.message : "playback failed");
              setSpeaking(false);
              setLoading(false);
            }
          });
      };

      audio.onended = () => {
        if (mounted.current) setSpeaking(false);
      };
      audio.onerror = () => {
        if (mounted.current) {
          setError("audio playback error");
          setSpeaking(false);
          setLoading(false);
        }
      };

      const cached = cache.get(key);
      if (cached) {
        playUrl(cached);
        return;
      }

      setLoading(true);
      fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean, speed: opts?.speed ?? 1 }),
      })
        .then((r) => {
          if (!r.ok) throw new Error("tts request failed");
          return r.blob();
        })
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          cache.set(key, url);
          // cap cache size
          if (cache.size > 40) {
            const firstKey = cache.keys().next().value;
            if (firstKey) {
              const oldUrl = cache.get(firstKey);
              if (oldUrl) URL.revokeObjectURL(oldUrl);
              cache.delete(firstKey);
            }
          }
          if (mounted.current) setLoading(false);
          playUrl(url);
        })
        .catch((e) => {
          if (mounted.current) {
            setError(e instanceof Error ? e.message : "tts failed");
            setLoading(false);
            setSpeaking(false);
          }
        });
    },
    []
  );

  return { speaking, loading, error, speak, stop };
}
