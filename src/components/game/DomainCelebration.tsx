"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/useGameStore";
import { Confetti } from "@/components/game/Confetti";
import { Mascot } from "@/components/game/Mascot";
import { Trophy, X } from "lucide-react";

// Shows a special celebration overlay when a learner finishes ALL lessons in
// a topic (domain). The store sets `domainCompleted` in recordResult; this
// component renders the overlay and clears it on dismiss.
export function DomainCelebration() {
  const domainCompleted = useGameStore((s) => s.domainCompleted);
  const clear = useGameStore((s) => s.clearDomainCelebration);

  return (
    <AnimatePresence>
      {domainCompleted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
          onClick={clear}
        >
          <Confetti active />
          <motion.div
            initial={{ scale: 0.5, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="relative w-full max-w-md rounded-3xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 p-8 text-center text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={clear}
              className="absolute right-3 top-3 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: 2 }}
              className="mx-auto mb-3"
            >
              <Trophy className="h-20 w-20 drop-shadow-lg" />
            </motion.div>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mx-auto mb-3 w-fit"
            >
              <Mascot size={56} />
            </motion.div>
            <h2 className="font-display text-3xl font-bold">Topic Complete!</h2>
            <p className="mt-2 text-lg font-semibold">
              You finished all of {domainCompleted.domainTitle}! 🎉
            </p>
            <p className="mt-1 text-sm text-white/90">
              You're a math superstar. Keep going to learn even more!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clear}
              className="mt-5 rounded-full bg-white px-8 py-3 font-display text-lg font-bold text-rose-600 shadow-lg"
            >
              Yay! 🌟
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
