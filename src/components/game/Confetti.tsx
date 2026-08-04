"use client";

import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";

const COLORS = [
  "#f43f5e",
  "#f59e0b",
  "#10b981",
  "#0ea5e9",
  "#a855f7",
  "#ec4899",
  "#eab308",
];

// Confetti burst — purely presentational. The parent toggles `active`
// (e.g. true for ~1.5–3s). Pieces are generated once per activation via
// useMemo and animate falling via CSS; they unmount when active goes false.
export function Confetti({ active }: { active: boolean }) {
  const reduceMotion = useReducedMotion();
  const pieces = useMemo(() => {
    if (!active || reduceMotion) return [];
    return Array.from({ length: 70 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1.6 + Math.random() * 1.2,
      color: COLORS[i % COLORS.length],
      rotate: Math.random() * 360,
    }));
  }, [active, reduceMotion]);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[80]">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
