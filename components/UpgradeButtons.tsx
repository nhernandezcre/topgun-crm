"use client";

import { useState } from "react";

export function UpgradeButtons() {
  const [loading, setLoading] = useState<null | "monthly" | "annual">(null);

  async function go(interval: "monthly" | "annual") {
    setLoading(interval);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ interval }),
      headers: { "content-type": "application/json" }
    });
    const data = await res.json();
    if (data.url) location.href = data.url;
    else setLoading(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => go("annual")}
        disabled={loading !== null}
        className="relative rounded-2xl bg-verdict-buy px-6 py-5 font-display text-lg font-semibold text-ink-950 active:scale-[0.99]"
      >
        <span className="absolute right-3 top-3 rounded-full bg-ink-950/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-950/80">
          best value
        </span>
        {loading === "annual" ? "opening checkout…" : "Annual · $29/year"}
        <span className="block font-sans text-[11px] font-normal opacity-80">
          $2.42 / month billed yearly
        </span>
      </button>
      <button
        onClick={() => go("monthly")}
        disabled={loading !== null}
        className="rounded-2xl border border-ink-700 bg-ink-900 px-6 py-4 font-display text-base text-ink-100 active:scale-[0.99]"
      >
        {loading === "monthly" ? "opening checkout…" : "Monthly · $4.99/mo"}
      </button>
    </div>
  );
}
