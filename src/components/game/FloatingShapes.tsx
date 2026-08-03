"use client";

import { motion } from "framer-motion";

// Decorative floating math symbols / shapes that drift across a background.
// Used on the landing page (and available anywhere) for playful atmosphere.
const SYMBOLS = ["⭐", "🔢", "➕", "✖️", "🔷", "🔺", "🍕", "🎈", "🍪", "🌈", "🦊", "⭕", "1", "2", "3", "5", "7", "½"];

interface FloatingShape {
  id: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  symbol: string;
  drift: number;
}

export function FloatingShapes({ count = 14 }: { count?: number }) {
  // deterministic-ish set so it doesn't reshuffle wildly on re-render
  const shapes: FloatingShape[] = Array.from({ length: count }).map((_, i) => {
    const seed = (i * 9301 + 49297) % 233280;
    const r = seed / 233280;
    const r2 = ((i * 4099 + 7919) % 233280) / 233280;
    return {
      id: i,
      left: Math.round(r * 100),
      size: 24 + Math.round(r2 * 40),
      delay: r * 8,
      duration: 12 + r2 * 10,
      symbol: SYMBOLS[i % SYMBOLS.length],
      drift: (r - 0.5) * 60,
    };
  });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {shapes.map((s) => (
        <motion.div
          key={s.id}
          className="absolute select-none opacity-20 dark:opacity-25"
          style={{ left: `${s.left}%`, fontSize: s.size, top: "-5%" }}
          animate={{
            y: ["0vh", "110vh"],
            x: [0, s.drift, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {s.symbol}
        </motion.div>
      ))}
    </div>
  );
}
