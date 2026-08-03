"use client";

import { useEffect } from "react";

function deviceDetails() {
  const ua = navigator.userAgent;
  const isTv = /Android TV|GoogleTV|SMART-TV|Tizen|Web0S|NetCast|AFT|CrKey|TV Safari/i.test(ua);
  const isTablet = /iPad|Tablet|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
  const isPhone = /iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua);
  const deviceType = isTv ? "tv" : isTablet ? "tablet" : isPhone ? "phone" : "desktop";
  const platform = /iPhone|iPad|iPod/i.test(ua) ? "iOS/iPadOS"
    : /Android/i.test(ua) ? "Android"
    : /Windows/i.test(ua) ? "Windows"
    : /Macintosh|Mac OS X/i.test(ua) ? "macOS"
    : /CrOS/i.test(ua) ? "ChromeOS"
    : /Linux/i.test(ua) ? "Linux" : "Unknown";
  const browser = /Edg\//i.test(ua) ? "Edge"
    : /OPR\//i.test(ua) ? "Opera"
    : /Firefox\//i.test(ua) ? "Firefox"
    : /CriOS|Chrome\//i.test(ua) ? "Chrome"
    : /Safari\//i.test(ua) ? "Safari" : "Other";
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const fullscreen = window.matchMedia("(display-mode: fullscreen)").matches;
  const launchMode = standalone ? "standalone" : fullscreen ? "fullscreen" : "browser";
  return { deviceType, platform, browser, launchMode, installed: standalone || fullscreen };
}

function deviceKey() {
  const storageKey = "mathstars-device-id";
  const existing = localStorage.getItem(storageKey);
  if (existing) return existing;
  const created = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(storageKey, created);
  return created;
}

// Registers the service worker for PWA/offline support (client-only).
export function ServiceWorkerRegister({ authenticated }: { authenticated: boolean }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline not available — fine */
      });
    }
    if (!authenticated) return;
    const sendPresence = (event: "launch" | "heartbeat" | "install") => {
      if (document.visibilityState === "hidden" && event === "heartbeat") return;
      const details = deviceDetails();
      fetch("/api/telemetry/device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...details, deviceKey: deviceKey(), event, installed: event === "install" || details.installed }),
        keepalive: true,
      }).then((response) => {
        if (response.status === 401 || response.status === 403) window.location.reload();
      }).catch(() => {});
    };
    sendPresence("launch");
    const timer = window.setInterval(() => sendPresence("heartbeat"), 60_000);
    const installed = () => sendPresence("install");
    const visible = () => { if (document.visibilityState === "visible") sendPresence("heartbeat"); };
    window.addEventListener("appinstalled", installed);
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("appinstalled", installed);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [authenticated]);
  return null;
}
