"use client";

import { useEffect } from "react";

// Registers the service worker for PWA/offline support (client-only).
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline not available — fine */
      });
    }
  }, []);
  return null;
}
