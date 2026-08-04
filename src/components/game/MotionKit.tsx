"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

export const springy = { type: "spring", stiffness: 260, damping: 22 } as const;
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: springy },
};

export function AnimatedNumber({ value, suffix = "", className }: { value: number; suffix?: string; className?: string }) {
  const raw = useMotionValue(0);
  const spring = useSpring(raw, { stiffness: 120, damping: 24, mass: 0.7 });
  const display = useTransform(spring, (latest) => `${Math.round(latest)}${suffix}`);
  useEffect(() => raw.set(value), [raw, value]);
  return <motion.span className={className}>{display}</motion.span>;
}

const sparkles = [
  ["7%", "16%", 18, 0], ["18%", "72%", 13, 1.1], ["34%", "9%", 10, 2.2],
  ["52%", "78%", 16, 0.7], ["68%", "18%", 12, 1.7], ["82%", "66%", 18, 2.8],
  ["92%", "28%", 11, 0.4], ["73%", "88%", 9, 2.1],
] as const;

export function FloatingSparkles({ className, tone = "gold" }: { className?: string; tone?: "gold" | "cream" | "rainbow" }) {
  const reduceMotion = useReducedMotion();
  const colors = tone === "cream" ? ["#fff4c7", "#f6d780", "#ffffff"] : tone === "rainbow" ? ["#f6bd3b", "#e56a74", "#6eb9a8", "#9b83cf"] : ["#f8c53d", "#ffe69a", "#d89123"];
  return <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
    {sparkles.map(([left, top, size, delay], index) => <motion.span key={`${left}-${top}`} className="absolute block" style={{ left, top, width: size, height: size, color: colors[index % colors.length] }} initial={{ opacity: 0, scale: 0.4 }} animate={reduceMotion ? { opacity: 0.55, scale: 1 } : { opacity: [0.15, 0.95, 0.15], scale: [0.7, 1.25, 0.7], rotate: [0, 90, 180], y: [0, -9, 0] }} transition={reduceMotion ? { duration: 0 } : { duration: 3.8, repeat: Infinity, delay, ease: "easeInOut" }}><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.8 7.6 4.4 11.2 12 12-7.6.8-11.2 4.4-12 12C11.2 16.4 7.6 12.8 0 12 7.6 11.2 11.2 7.6 12 0Z" /></svg></motion.span>)}
  </div>;
}

export function MascotMotion({ children, mood = "idle", className }: { children: React.ReactNode; mood?: "idle" | "celebrate" | "encourage"; className?: string }) {
  const reduceMotion = useReducedMotion();
  const animation = reduceMotion ? { opacity: 1 } : mood === "celebrate" ? { y: [0, -18, 0, -9, 0], rotate: [0, -5, 5, -3, 0], scale: [1, 1.08, 1] } : mood === "encourage" ? { x: [0, -4, 4, -2, 0], rotate: [0, -2, 2, 0] } : { y: [0, -7, 0], rotate: [0, 1.5, 0] };
  return <motion.div className={className} animate={animation} transition={reduceMotion ? { duration: 0 } : mood === "idle" ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.85, ease: "easeOut" }}>{children}</motion.div>;
}

export function ProgressTrail({ value, className }: { value: number; className?: string }) {
  const reduceMotion = useReducedMotion();
  return <motion.div className={className} initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, value))}%` }} transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 80, damping: 18, delay: 0.25 }} />;
}
