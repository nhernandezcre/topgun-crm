"use client";
import Link from "next/link";
import { useState } from "react";

export function BigButton() {
  const [pressed, setPressed] = useState(false);

  return (
    <Link
      href="/capture"
      onTouchStart={() => {
        setPressed(true);
        if ("vibrate" in navigator) navigator.vibrate(8);
      }}
      onTouchEnd={() => setPressed(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      prefetch
      className={`group mt-10 block w-full max-w-md rounded-[28px] border border-ink-700/70 bg-ink-900 px-8 py-10 text-center transition-all active:scale-[0.985]
        ${pressed ? "shadow-[0_0_0_1px_rgba(0,200,83,.6),0_40px_80px_-40px_rgba(0,200,83,.4)]" : "shadow-[0_30px_60px_-30px_rgba(0,0,0,.8)]"}
      `}
    >
      <span className="block font-mono text-[10px] uppercase tracking-[0.3em] text-ink-400">
        tap to verdict
      </span>
      <span className="mt-2 block font-display text-4xl font-semibold italic leading-none text-ink-100 group-hover:text-verdict-buy transition-colors">
        Should I buy this?
      </span>
      <span className="mt-4 inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-ink-400">
        photo · link · screenshot
      </span>
    </Link>
  );
}
