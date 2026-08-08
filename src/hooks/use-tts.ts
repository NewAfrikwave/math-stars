"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { speakableText } from "@/lib/speech";

// A simple in-memory cache so the same text isn't re-synthesized on replay.
const cache = new Map<string, string>();
// A single shared <audio> element reused across the app.
let sharedAudio: HTMLAudioElement | null = null;
let speechRequest = 0;
let nextOwnerId = 0;

interface SharedSpeechState {
  ownerId: number | null;
  speaking: boolean;
  loading: boolean;
  error: string | null;
}

let sharedSpeechState: SharedSpeechState = {
  ownerId: null,
  speaking: false,
  loading: false,
  error: null,
};
const speechListeners = new Set<() => void>();

function subscribeToSpeech(listener: () => void) {
  speechListeners.add(listener);
  return () => speechListeners.delete(listener);
}

function getSpeechSnapshot() {
  return sharedSpeechState;
}

function updateSpeechState(next: SharedSpeechState) {
  sharedSpeechState = next;
  speechListeners.forEach((listener) => listener());
}

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
  /** Speak immediately with the device voice. Use inside a user gesture. */
  speakImmediately: (text: string, opts?: { speed?: number }) => void;
  /** Stop any current playback. */
  stop: () => void;
}

// Read-aloud hook backed by /api/tts (z-ai-web-dev-sdk TTS).
// Shared across all callers so only one piece of text plays at a time.
export function useTTS(): UseTTSResult {
  const [id] = useState(() => ++nextOwnerId);
  const snapshot = useSyncExternalStore(subscribeToSpeech, getSpeechSnapshot, getSpeechSnapshot);
  const ownsSpeech = snapshot.ownerId === id;
  const speaking = ownsSpeech && snapshot.speaking;
  const loading = ownsSpeech && snapshot.loading;
  const error = ownsSpeech ? snapshot.error : null;

  const stop = useCallback(() => {
    speechRequest += 1;
    const audio = getAudio();
    audio.pause();
    audio.currentTime = 0;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    updateSpeechState({ ownerId: null, speaking: false, loading: false, error: null });
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
      updateSpeechState({ ownerId: id, speaking: false, loading: true, error: null });

      const speakInBrowser = (reason?: unknown) => {
        if (request !== speechRequest) return;
        if (!("speechSynthesis" in window)) {
          updateSpeechState({
            ownerId: id,
            speaking: false,
            loading: false,
            error: reason instanceof Error ? reason.message : "Read aloud is unavailable on this device.",
          });
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
          if (request === speechRequest) {
            updateSpeechState({ ownerId: id, speaking: true, loading: false, error: null });
          }
        };
        utterance.onend = () => {
          if (request === speechRequest) {
            updateSpeechState({ ownerId: null, speaking: false, loading: false, error: null });
          }
        };
        utterance.onerror = (event) => {
          if (request === speechRequest && event.error !== "canceled") {
            updateSpeechState({
              ownerId: id,
              speaking: false,
              loading: false,
              error: "Your device could not play the question. Please try again.",
            });
          }
        };
        updateSpeechState({ ownerId: id, speaking: false, loading: false, error: null });
        window.speechSynthesis.speak(utterance);
      };

      const key = `${opts?.speed ?? 1}::${clean}`;
      const playUrl = (url: string) => {
        if (request !== speechRequest) return;
        audio.src = url;
        audio
          .play()
          .then(() => {
            if (request === speechRequest) {
              updateSpeechState({ ownerId: id, speaking: true, loading: false, error: null });
            }
          })
          .catch(speakInBrowser);
      };

      audio.onended = () => {
        if (request === speechRequest) {
          updateSpeechState({ ownerId: null, speaking: false, loading: false, error: null });
        }
      };
      audio.onerror = () => speakInBrowser(new Error("Audio playback failed."));

      const cached = cache.get(key);
      if (cached) {
        playUrl(cached);
        return;
      }

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
          playUrl(url);
        })
        .catch((e) => {
          window.clearTimeout(timeout);
          speakInBrowser(e);
        });
    },
    [id]
  );

  const speakImmediately = useCallback(
    (text: string, opts?: { speed?: number }) => {
      const clean = speakableText(text);
      if (!clean || typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const request = ++speechRequest;
      const audio = getAudio();
      audio.pause();
      audio.currentTime = 0;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = "en-US";
      utterance.rate = Math.min(1.25, Math.max(0.65, opts?.speed ?? 0.92));
      utterance.pitch = 1.08;
      const voices = window.speechSynthesis.getVoices();
      utterance.voice =
        voices.find((voice) => voice.lang === "en-US" && /natural|samantha|google|aria/i.test(voice.name)) ??
        voices.find((voice) => voice.lang.startsWith("en")) ??
        null;
      utterance.onstart = () => {
        if (request === speechRequest) updateSpeechState({ ownerId: id, speaking: true, loading: false, error: null });
      };
      utterance.onend = () => {
        if (request === speechRequest) updateSpeechState({ ownerId: null, speaking: false, loading: false, error: null });
      };
      utterance.onerror = (event) => {
        if (request === speechRequest && event.error !== "canceled") {
          updateSpeechState({ ownerId: id, speaking: false, loading: false, error: "Your device could not play the celebration." });
        }
      };
      updateSpeechState({ ownerId: id, speaking: false, loading: false, error: null });
      window.speechSynthesis.speak(utterance);
    },
    [id]
  );

  return { speaking, loading, error, speak, speakImmediately, stop };
}
