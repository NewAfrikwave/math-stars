"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Browser-native speech recognition (Web Speech API) for voice answers.
// Works in Chrome/Edge/Safari. Lets kids speak a number instead of typing.
// Pass an onResult callback to receive the transcript directly (no effect needed).

function getSpeechRecognitionCtor() {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onerror: (e: { error?: string }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string) => void;
}

interface SpeechRecognitionResult {
  listening: boolean;
  error: string | null;
  start: () => void;
  stop: () => void;
  supported: boolean;
}

export function useSpeechRecognition(opts: UseSpeechRecognitionOptions = {}): SpeechRecognitionResult {
  const Ctor = getSpeechRecognitionCtor();
  const supported = Ctor !== null;
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const onResultRef = useRef(opts.onResult);
  useEffect(() => {
    onResultRef.current = opts.onResult;
  }, [opts.onResult]);

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort();
      } catch {
        /* noop */
      }
    };
  }, []);

  const start = useCallback(() => {
    if (!Ctor) {
      setError("voice not supported on this browser");
      return;
    }
    setError(null);
    setListening(true);
    try {
      const rec = new Ctor();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";
      rec.onresult = (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
        const t = e.results[0]?.[0]?.transcript ?? "";
        onResultRef.current?.(t);
        setListening(false);
      };
      rec.onerror = (e: { error?: string }) => {
        setError(e.error ?? "speech error");
        setListening(false);
      };
      rec.onend = () => setListening(false);
      recRef.current = rec;
      rec.start();
    } catch {
      setError("couldn't start microphone");
      setListening(false);
    }
  }, [Ctor]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, error, start, stop, supported };
}

// Extract the first integer found in a spoken phrase like "five" or "the answer is 7".
export function parseSpokenNumber(text: string): number | null {
  const words: Record<string, number> = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
    thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
    eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
    sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  };
  const lower = text.toLowerCase();
  // Try digit first.
  const m = lower.match(/\d+/);
  if (m) return Number(m[0]);
  // Try word numbers.
  const tokens = lower.split(/\s+/);
  for (const t of tokens) {
    if (words[t] !== undefined) return words[t];
  }
  return null;
}
