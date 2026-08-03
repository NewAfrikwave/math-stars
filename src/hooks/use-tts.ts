"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { speakableText } from "@/lib/speech";

// A simple in-memory cache so the same text isn't re-synthesized on replay.
const cache = new Map<string, string>();
// A single shared <audio> element reused across the app.
let sharedAudio: HTMLAudioElement | null = null;
let speechRequest = 0;

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
    speechRequest += 1;
    const audio = getAudio();
    audio.pause();
    audio.currentTime = 0;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (mounted.current) setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, opts?: { speed?: number }) => {
      const clean = speakableText(text);
      if (!clean) return;
      const request = ++speechRequest;
      const audio = getAudio();
      // cancel anything currently playing
      audio.pause();
      audio.currentTime = 0;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();

      const speakInBrowser = (reason?: unknown) => {
        if (request !== speechRequest || !("speechSynthesis" in window)) {
          if (mounted.current) {
            setError(reason instanceof Error ? reason.message : "Read aloud is unavailable on this device.");
            setLoading(false);
            setSpeaking(false);
          }
          return;
        }

        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.lang = "en-US";
        utterance.rate = Math.min(1.25, Math.max(0.65, opts?.speed ?? 0.92));
        utterance.pitch = 1.04;
        const voices = window.speechSynthesis.getVoices();
        utterance.voice =
          voices.find((voice) => voice.lang === "en-US" && /natural|samantha|google|aria/i.test(voice.name)) ??
          voices.find((voice) => voice.lang.startsWith("en")) ??
          null;
        utterance.onstart = () => {
          if (mounted.current && request === speechRequest) {
            setLoading(false);
            setSpeaking(true);
            setError(null);
          }
        };
        utterance.onend = () => {
          if (mounted.current && request === speechRequest) setSpeaking(false);
        };
        utterance.onerror = (event) => {
          if (mounted.current && request === speechRequest && event.error !== "canceled") {
            setError("Your device could not play the question. Please try again.");
            setLoading(false);
            setSpeaking(false);
          }
        };
        setLoading(false);
        window.speechSynthesis.speak(utterance);
      };

      const key = `${opts?.speed ?? 1}::${clean}`;
      const playUrl = (url: string) => {
        if (request !== speechRequest) return;
        audio.src = url;
        audio
          .play()
          .then(() => {
            if (mounted.current) {
              setSpeaking(true);
              setError(null);
            }
          })
          .catch(speakInBrowser);
      };

      audio.onended = () => {
        if (mounted.current) setSpeaking(false);
      };
      audio.onerror = () => speakInBrowser(new Error("Audio playback failed."));

      const cached = cache.get(key);
      if (cached) {
        playUrl(cached);
        return;
      }

      setLoading(true);
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 4500);
      fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean, speed: opts?.speed ?? 1 }),
        signal: controller.signal,
      })
        .then((r) => {
          if (!r.ok) throw new Error("tts request failed");
          return r.blob();
        })
        .then((blob) => {
          window.clearTimeout(timeout);
          if (request !== speechRequest) return;
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
          window.clearTimeout(timeout);
          speakInBrowser(e);
        });
    },
    []
  );

  return { speaking, loading, error, speak, stop };
}
