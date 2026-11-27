"use client";

import type { CSSProperties, ReactNode } from "react";
import { useGameStore } from "@/store/useGameStore";
import styles from "./AnswerCheer.module.css";

const cheers = {
  early: ["You did it!", "Way to go!", "Hooray!"],
  growing: ["Nice work!", "You got it!", "Well done!"],
  older: ["Nicely done.", "Good thinking!", "Well spotted!"],
};

// Mount on a confirmed answer. Keeping the pop inside the feedback lets the
// learner read the explanation and advance while the stars are still moving.
export function AnswerCheer({ turn = 0, children }: { turn?: number; children?: ReactNode }) {
  const level = useGameStore(state => state.level);
  const band = level === "preschool" || level === "grade1" ? "early" : level === "grade2" ? "growing" : "older";
  const phrases = cheers[band];
  return <span className={styles.cheer} data-band={band}>
    <span className={styles.medal} aria-hidden="true">
      ★
      {Array.from({length: 8}, (_, i) => (
        <i key={i} className={styles.spark} style={{ "--angle": (i * 45) + "deg" } as CSSProperties}>✦</i>
      ))}
    </span>
    <span>{phrases[Math.abs(turn) % phrases.length]}{children && <> {children}</>}</span>
  </span>;
}
