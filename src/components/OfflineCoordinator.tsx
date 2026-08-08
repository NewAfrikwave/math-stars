"use client";

import { useEffect } from "react";
import { useGameStore } from "@/store/useGameStore";
import { getOfflinePreferences, listOfflineEvents, saveSnapshot } from "@/lib/offline/database";
import { syncOfflineEvents } from "@/lib/offline/sync-client";
import { mergeProgressMaps } from "@/lib/offline/event-queue";

export function OfflineCoordinator() {
  useEffect(() => {
    getOfflinePreferences().then((preferences) => {
      document.documentElement.dataset.lowData = preferences.lowDataMode ? "true" : "false";
      navigator.serviceWorker?.ready.then((registration) => {
        registration.active?.postMessage({ type: "SET_LOW_DATA", enabled: preferences.lowDataMode });
      }).catch(() => {});
    }).catch(() => {});
    const saveState = () => {
      const state = useGameStore.getState();
      if (!state.currentProfileId || !state.hydrated) return;
      saveSnapshot(`state:${state.currentProfileId}`, {
        studentName: state.studentName,
        level: state.level,
        totalStars: state.totalStars,
        streak: state.streak,
        soundOn: state.soundOn,
        progress: state.progress,
        earnedAchievements: state.earnedAchievements,
        dailyDoneDate: state.dailyDoneDate,
        dailyScore: state.dailyScore,
        reward: state.reward,
        activeCheckpoint: state.activeCheckpoint,
      }).catch(() => {});
    };
    const unsubscribe = useGameStore.subscribe(saveState);
    const syncAndRefresh = async () => {
      const result = await syncOfflineEvents();
      const state = useGameStore.getState();
      if (!state.currentProfileId || result.acknowledged < 1) return;
      try {
        const response = await fetch("/api/state", { headers: { "x-profile-id": state.currentProfileId } });
        const remote = await response.json();
        if (!response.ok || !remote) return;
        const pending = (await listOfflineEvents()).some((event) => event.profileId === state.currentProfileId);
        useGameStore.getState().hydrate({
          ...remote,
          progress: pending ? mergeProgressMaps(state.progress, remote.progress ?? {}) : remote.progress ?? {},
        });
      } catch { /* local state remains authoritative until the next sync */ }
    };
    const online = () => { void syncAndRefresh(); };
    const serviceWorkerMessage = (event: MessageEvent) => { if (event.data?.type === "SYNC_REQUESTED") void syncAndRefresh(); };
    window.addEventListener("online", online);
    navigator.serviceWorker?.addEventListener("message", serviceWorkerMessage);
    const timer = window.setInterval(() => { if (navigator.onLine) void syncAndRefresh(); }, 90_000);
    if (navigator.onLine) void syncAndRefresh();
    return () => {
      unsubscribe();
      window.removeEventListener("online", online);
      navigator.serviceWorker?.removeEventListener("message", serviceWorkerMessage);
      window.clearInterval(timer);
    };
  }, []);
  return null;
}
