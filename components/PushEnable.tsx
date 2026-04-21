"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, BellOff } from "lucide-react";

export function PushEnable() {
  const [state, setState] = useState<"unknown" | "granted" | "denied" | "default">("unknown");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setState(Notification.permission as any);
  }, []);

  async function enable() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Your browser does not support push. iPhone: install to home screen first.");
      return;
    }
    const perm = await Notification.requestPermission();
    setState(perm as any);
    if (perm !== "granted") return;
    const reg = await navigator.serviceWorker.ready;
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!key) return alert("VAPID key missing. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY in env.");
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key)
    });
    await fetch("/api/push/subscribe", {
      method: "POST",
      body: JSON.stringify(sub),
      headers: { "content-type": "application/json" }
    });
  }

  const icon = state === "granted" ? BellRing : state === "denied" ? BellOff : Bell;
  const Icon = icon;

  return (
    <button
      onClick={enable}
      className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-850 px-4 py-2 text-xs uppercase tracking-widest text-ink-100 active:scale-95"
    >
      <Icon className="h-3.5 w-3.5" />
      {state === "granted" ? "notifications on" : state === "denied" ? "notifications blocked" : "turn on alerts"}
    </button>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
