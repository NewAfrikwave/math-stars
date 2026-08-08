"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudOff } from "lucide-react";
import { listOfflineEvents } from "@/lib/offline/database";

export function OfflineStatusButton({ onClick }: { onClick: () => void }) {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  useEffect(() => {
    const update = () => {
      setOnline(navigator.onLine);
      listOfflineEvents().then((events) => setPending(events.length)).catch(() => {});
    };
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    window.addEventListener("mathstars-sync-complete", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener("mathstars-sync-complete", update);
    };
  }, []);
  return (
    <button onClick={onClick} title="Offline learning" className={`relative flex h-9 items-center gap-1 rounded-full px-3 text-xs font-bold ${online ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
      {online ? <Cloud className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
      <span className="hidden md:inline">{online ? "Ready" : "Offline"}</span>
      {pending > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] text-white">{pending}</span>}
    </button>
  );
}
