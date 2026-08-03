"use client";

import { useCallback, useEffect, useRef } from "react";

// Lightweight sound effects via the Web Audio API — no audio files needed.
// Generates a happy two-note "ding" for correct answers and a gentle
// descending "aw" for incorrect ones.

let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

function tone(freq: number, start: number, duration: number, gain = 0.15, type: OscillatorType = "sine") {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + duration);
}

export interface SoundEffects {
  playCorrect: () => void;
  playWrong: () => void;
  playTap: () => void;
}

export function useSoundEffects(enabled: boolean): SoundEffects {
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const playCorrect = useCallback(() => {
    if (!enabledRef.current) return;
    // Happy ascending C-E-G arpeggio
    tone(523.25, 0, 0.15); // C5
    tone(659.25, 0.1, 0.15); // E5
    tone(783.99, 0.2, 0.25); // G5
  }, []);

  const playWrong = useCallback(() => {
    if (!enabledRef.current) return;
    // Gentle descending "try again" (not harsh)
    tone(440, 0, 0.2, 0.1, "triangle"); // A4
    tone(349.23, 0.15, 0.3, 0.1, "triangle"); // F4
  }, []);

  const playTap = useCallback(() => {
    if (!enabledRef.current) return;
    tone(660, 0, 0.06, 0.08);
  }, []);

  return { playCorrect, playWrong, playTap };
}
