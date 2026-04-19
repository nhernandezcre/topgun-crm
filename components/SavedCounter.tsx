"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { money } from "@/lib/utils";

export function SavedCounter({ cents, isPro }: { cents: number; isPro: boolean }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / 900, 1);
      setV(Math.round(cents * easeOut(p)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cents]);

  if (cents <= 0) {
    return (
      <p className="mt-10 text-center text-xs uppercase tracking-[0.25em] text-ink-500">
        Start saving. Your receipt builds here.
      </p>
    );
  }

  return (
    <div className="mt-10 flex flex-col items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-400">
        we've talked you out of spending
      </span>
      <span className="font-display tabular text-5xl font-semibold text-verdict-buy">
        {money(v)}
      </span>
      {!isPro && (
        <Link
          href="/paywall"
          className="mt-1 text-[11px] uppercase tracking-[0.25em] text-ink-300 underline-offset-4 hover:text-ink-100 hover:underline"
        >
          keep the receipt going · go pro
        </Link>
      )}
    </div>
  );
}

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}
