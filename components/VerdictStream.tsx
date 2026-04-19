"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { StreamEvent, Alternative, PriceIntel, ProductExtract, RedditIntel, Verdict } from "@/types";
import { VerdictCard } from "./VerdictCard";
import { X } from "lucide-react";

export function VerdictStream({
  events,
  loading,
  onReset
}: {
  events: StreamEvent[];
  loading: boolean;
  onReset: () => void;
}) {
  const state = useMemo(() => reduce(events), [events]);

  const phases = [
    { key: "product", label: state.product ? "product identified" : "reading the thing", done: !!state.product },
    { key: "price", label: state.price ? "prices pulled" : "checking prices", done: !!state.price },
    { key: "reddit", label: state.reddit ? "reddit read" : "reading reddit", done: !!state.reddit },
    { key: "alts", label: state.alts ? "alternatives ready" : "finding better options", done: !!state.alts }
  ];

  const hasVerdict = !!state.verdict;

  return (
    <main className="relative z-10 flex min-h-screen flex-col px-5 pb-10 safe-top safe-bottom">
      <header className="flex items-center justify-between pt-4">
        <button
          onClick={onReset}
          className="rounded-full bg-ink-850 p-2.5 text-ink-100 active:scale-95"
          aria-label="close"
        >
          <X className="h-4 w-4" />
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-400">
          {hasVerdict ? "verdict" : "thinking"}
        </span>
        <span className="w-9" />
      </header>

      {!hasVerdict && (
        <section className="mt-10 flex flex-col gap-3">
          <h1 className="font-display text-3xl italic text-ink-200">
            {state.product ? state.product.name : "Reading…"}
          </h1>
          <p className="text-sm text-ink-400">
            Four streams running at once. We don't guess.
          </p>
          <ul className="mt-4 space-y-2 font-mono text-[13px] text-ink-200">
            {phases.map((p) => (
              <li
                key={p.key}
                className={`flex items-center gap-2 ${p.done ? "text-ink-100" : "animate-pulse2 text-ink-400"}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${p.done ? "bg-verdict-buy" : "bg-ink-500"}`} />
                <span>{p.label}</span>
                {p.done && <span className="text-verdict-buy">✓</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasVerdict && state.product && (
        <div className="mt-6">
          <VerdictCard
            verdict={state.verdict!}
            confidence={state.confidence ?? 0}
            reason={state.reason ?? ""}
            move={state.move ?? ""}
            product={state.product}
            price={state.price}
            reddit={state.reddit}
            alternatives={state.alts ?? []}
            verdictId={state.verdictId}
          />
        </div>
      )}

      {loading && (
        <div className="mt-6 flex items-center gap-2 text-[11px] uppercase tracking-widest text-ink-400">
          <span className="h-1 w-1 animate-pulse2 rounded-full bg-verdict-buy" />
          streaming
        </div>
      )}

      {hasVerdict && (
        <div className="mt-auto grid grid-cols-2 gap-2 pt-8">
          <Link
            href="/capture"
            className="rounded-full border border-ink-700 bg-ink-900 py-3.5 text-center text-sm uppercase tracking-widest text-ink-200 hover:bg-ink-800"
          >
            scan another
          </Link>
          <Link
            href="/history"
            className="rounded-full bg-ink-100 py-3.5 text-center text-sm uppercase tracking-widest text-ink-950"
          >
            history
          </Link>
        </div>
      )}
    </main>
  );
}

function reduce(evs: StreamEvent[]) {
  const out: {
    verdictId?: string;
    product?: ProductExtract;
    price?: PriceIntel;
    reddit?: RedditIntel;
    alts?: Alternative[];
    verdict?: Verdict;
    confidence?: number;
    reason?: string;
    move?: string;
  } = {};
  for (const e of evs) {
    if (e.kind === "started") out.verdictId = e.verdict_id;
    if (e.kind === "product") out.product = e.product;
    if (e.kind === "price") out.price = e.price;
    if (e.kind === "reddit") out.reddit = e.reddit;
    if (e.kind === "alts") out.alts = e.alternatives;
    if (e.kind === "verdict") {
      out.verdict = e.verdict;
      out.confidence = e.confidence;
      out.reason = e.reason;
      out.move = e.move;
    }
  }
  return out;
}
