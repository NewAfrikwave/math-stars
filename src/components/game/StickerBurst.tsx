"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const STICKERS = ["⭐", "✨", "🎉", "🌟", "💫", "🎊", "🏆", "🎈"];

// A burst of stickers that fly outward from the center when `active` is true.
// Used to amplify the confetti on correct answers.
export function StickerBurst({ active }: { active: boolean }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  return (
    <AnimatePresence>
      {active && (
        <div className="pointer-events-none fixed inset-0 z-[75] flex items-center justify-center">
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const dist = 120 + (i % 3) * 40;
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            return (
              <motion.span
                key={i}
                className="absolute text-4xl"
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{ x, y, scale: 1.4, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1, ease: "easeOut" }}
              >
                {STICKERS[i % STICKERS.length]}
              </motion.span>
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}
