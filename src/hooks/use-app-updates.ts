"use client";

import { useEffect } from "react";
import { useGameStore } from "@/store/useGameStore";

const retryDelay = 120_000;
const attemptKey = "mathstars-last-update-attempt";

export function useAppUpdates(atRest: boolean) {
  useEffect(() => {
    const current = document.documentElement.dataset.mathstarsRelease;
    if (!atRest || !current) return;
    let closed = false;
    let busy = false;
    function safe() {
      const { hydrated, view } = useGameStore.getState();
      return !closed && hydrated && (view.name === "home" || view.name === "landing")
        && document.visibilityState === "visible" && navigator.onLine
        && !document.querySelector("dialog[open], [role=dialog][aria-modal=true]")
        && !Array.from(document.querySelectorAll("input:not([type=hidden]), textarea, [contenteditable=true]"))
          .some(el => el.getClientRects().length > 0);
    }
    async function check() {
      if (busy || !safe()) return;
      busy = true;
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch("/api/app-release", { cache: "no-store", signal: controller.signal });
        if (!response.ok) return;
        const { release } = await response.json();
        if (typeof release !== "string" || !release || release === current || !safe()) return;
        // A slow connection may restore the offline shell after a reload.
        // Allow a later retry without bouncing between documents.
        const last = Number(sessionStorage.getItem(attemptKey));
        if (Date.now() - last < retryDelay) return;
        sessionStorage.setItem(attemptKey, String(Date.now()));
        window.location.reload();
      } catch { /* An offline or interrupted check retries on return. */ }
      finally { window.clearTimeout(timeout); busy = false; }
    }
    void check();
    document.addEventListener("visibilitychange", check);
    window.addEventListener("pageshow", check);
    window.addEventListener("online", check);
    const timer = window.setInterval(check, 120_000);
    return () => {
      closed = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("pageshow", check);
      window.removeEventListener("online", check);
    };
  }, [atRest]);
}
