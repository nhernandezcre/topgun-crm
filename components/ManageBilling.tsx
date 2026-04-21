"use client";

import { useState } from "react";

export function ManageBilling() {
  const [loading, setLoading] = useState(false);
  return (
    <button
      onClick={async () => {
        setLoading(true);
        const res = await fetch("/api/stripe/portal", { method: "POST" });
        const data = await res.json();
        if (data.url) location.href = data.url;
        else setLoading(false);
      }}
      className="rounded-2xl bg-ink-100 px-6 py-4 font-display text-lg font-semibold text-ink-950 active:scale-[0.99] disabled:opacity-50"
      disabled={loading}
    >
      {loading ? "opening portal…" : "Manage subscription"}
    </button>
  );
}
