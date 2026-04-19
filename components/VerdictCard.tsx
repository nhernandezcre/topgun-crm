"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Share, ExternalLink, TrendingDown, TrendingUp, Minus, Heart, ShoppingCart } from "lucide-react";
import { money, pct } from "@/lib/utils";
import type { Alternative, PriceIntel, ProductExtract, RedditIntel, Verdict } from "@/types";

const COLOR: Record<Verdict, string> = {
  BUY: "text-verdict-buy",
  SKIP: "text-verdict-skip",
  WAIT: "text-verdict-wait"
};

const GLOW: Record<Verdict, string> = {
  BUY: "verdict-glow-buy",
  SKIP: "verdict-glow-skip",
  WAIT: "verdict-glow-wait"
};

const SUB: Record<Verdict, string> = {
  BUY: "Buy it. Don't overthink it.",
  SKIP: "Pass. We found better.",
  WAIT: "Don't buy it today."
};

export function VerdictCard(props: {
  verdict: Verdict;
  confidence: number;
  reason: string;
  move: string;
  product: ProductExtract;
  price?: PriceIntel;
  reddit?: RedditIntel;
  alternatives: Alternative[];
  verdictId?: string;
  boughtAnyway?: boolean;
}) {
  const { verdict, confidence, reason, move, product, price, reddit, alternatives, verdictId } = props;

  return (
    <article className="flex flex-col gap-5">
      {/* hero */}
      <section className={`relative overflow-hidden rounded-3xl bg-ink-900 p-6 pt-8 ${GLOW[verdict]}`}>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-400">
            verdict
          </span>
          <ConfidenceRing value={confidence} verdict={verdict} />
        </div>

        <motion.h2
          key={verdict}
          initial={{ scale: 0.6, opacity: 0, filter: "blur(10px)" }}
          animate={{ scale: 1, opacity: 1, filter: "blur(0)" }}
          transition={{ type: "spring", stiffness: 320, damping: 22, mass: 0.6 }}
          className={`mt-3 font-display font-black leading-[0.86] tracking-[-0.04em] ${COLOR[verdict]} text-verdict-xl`}
        >
          {verdict}
        </motion.h2>

        <p className="mt-3 font-display text-xl italic text-ink-100">{SUB[verdict]}</p>
        <p className="mt-2 text-[15px] leading-snug text-ink-200">{reason}</p>

        <p className="mt-5 text-[11px] uppercase tracking-[0.25em] text-ink-400">the move</p>
        <p className="mt-1 font-display text-xl text-ink-100">{move}</p>

        <div className="mt-6 flex gap-2">
          {verdictId && (
            <ShareButton id={verdictId} verdict={verdict} product={product.name} />
          )}
          <WishlistButton verdictId={verdictId} targetCents={price?.fair_price_cents} />
        </div>

        {verdict === "SKIP" && verdictId && <BoughtAnyway id={verdictId} />}
      </section>

      {/* product */}
      <Expandable title="Product" summary={product.name}>
        <div className="space-y-1 text-sm text-ink-200">
          {product.brand && <p><span className="text-ink-400">Brand:</span> {product.brand}</p>}
          {product.model && <p><span className="text-ink-400">Model:</span> {product.model}</p>}
          {product.category && <p><span className="text-ink-400">Category:</span> {product.category}</p>}
          {product.source_url && (
            <a
              href={product.source_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-verdict-buy hover:underline"
            >
              source <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </Expandable>

      {/* price */}
      {price && <PriceBlock price={price} />}

      {/* reddit */}
      {reddit && (
        <Expandable title="Reddit's verdict" summary={reddit.summary}>
          <ul className="mt-2 space-y-2 text-sm">
            {reddit.sources.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-start gap-2 text-ink-200 hover:text-ink-100"
                >
                  <span className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-400">
                    r/{s.subreddit}
                  </span>
                  <span className="underline-offset-2 hover:underline">{s.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </Expandable>
      )}

      {/* alternatives */}
      {alternatives.length > 0 && (
        <section className="rounded-3xl bg-ink-900 p-6">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="font-display text-xl text-ink-100">Cheaper & better</h3>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
              3 options
            </span>
          </div>
          <ul className="divide-y divide-ink-700/70">
            {alternatives.map((a) => (
              <li key={a.name} className="py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-display text-[17px] text-ink-100">{a.name}</span>
                  <span className="font-mono tabular text-sm text-verdict-buy">
                    {money(a.price_cents)}
                  </span>
                </div>
                <p className="mt-0.5 text-sm leading-snug text-ink-300">{a.why}</p>
                {(a.affiliate_url || a.url) && (
                  <a
                    href={a.affiliate_url ?? a.url}
                    target="_blank"
                    rel="nofollow sponsored noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs uppercase tracking-widest text-ink-400 hover:text-ink-200"
                  >
                    open listing <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[10px] uppercase tracking-widest text-ink-500">
            links may be affiliate. the verdict is not for sale.
          </p>
        </section>
      )}
    </article>
  );
}

function ConfidenceRing({ value, verdict }: { value: number; verdict: Verdict }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / 900, 1);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const stroke = verdict === "BUY" ? "#00C853" : verdict === "SKIP" ? "#FF3B30" : "#FFB300";
  const C = 2 * Math.PI * 18;
  const dash = (shown / 100) * C;

  return (
    <div className="relative h-12 w-12">
      <svg viewBox="0 0 44 44" className="h-full w-full -rotate-90">
        <circle cx="22" cy="22" r="18" fill="none" stroke="#1C2027" strokeWidth="3" />
        <circle
          cx="22"
          cy="22"
          r="18"
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          strokeDasharray={`${dash} ${C - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono tabular text-[11px] text-ink-100">
        {shown}
      </span>
    </div>
  );
}

function PriceBlock({ price }: { price: PriceIntel }) {
  const over =
    price.listed_price_cents && price.fair_price_cents
      ? pct(price.listed_price_cents, price.fair_price_cents)
      : 0;

  const TrendIcon =
    price.trend === "falling" ? TrendingDown : price.trend === "rising" ? TrendingUp : Minus;

  return (
    <section className="rounded-3xl bg-ink-900 p-6">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-xl text-ink-100">Price check</h3>
        <span
          className={`font-mono text-xs uppercase tracking-widest ${price.fake_sale ? "text-verdict-skip" : "text-ink-400"}`}
        >
          {price.fake_sale ? "fake sale" : "real price"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <Stat label="listed" value={money(price.listed_price_cents)} />
        <Stat
          label="fair"
          value={money(price.fair_price_cents)}
          accent={over > 10 ? "text-verdict-skip" : over < -5 ? "text-verdict-buy" : undefined}
        />
        <Stat label="lowest" value={money(price.lowest_cents)} />
      </div>

      <div className="mt-5 flex items-center gap-2 text-sm text-ink-300">
        <TrendIcon className="h-4 w-4" />
        <span className="capitalize">{price.trend}</span>
        {over !== 0 && (
          <span className="ml-auto font-mono text-sm">
            {over > 0 ? `+${over}% over` : `${over}% under`}
          </span>
        )}
      </div>

      {price.history && price.history.length > 6 && (
        <Sparkline points={price.history.map((h) => h.price_cents)} />
      )}

      {price.offers.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer list-none text-[11px] uppercase tracking-widest text-ink-400">
            {price.offers.length} retailers
          </summary>
          <ul className="mt-2 divide-y divide-ink-700/70">
            {price.offers.slice(0, 6).map((o, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <a
                  href={o.url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-ink-200 hover:text-ink-100"
                >
                  {o.retailer}
                </a>
                <span className="font-mono tabular text-ink-100">{money(o.price_cents)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const W = 280, H = 56;
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const step = W / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${H - ((p - min) / range) * H}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-5 h-14 w-full text-verdict-buy">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-400">{label}</p>
      <p className={`font-display text-2xl tabular ${accent ?? "text-ink-100"}`}>{value}</p>
    </div>
  );
}

function Expandable({
  title,
  summary,
  children
}: {
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-3xl bg-ink-900 p-6 open:bg-ink-850">
      <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4">
        <h3 className="font-display text-xl text-ink-100">{title}</h3>
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400 group-open:hidden">
          tap ↓
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400 hidden group-open:inline">
          close
        </span>
      </summary>
      <p className="mt-3 text-[15px] leading-snug text-ink-200">{summary}</p>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function ShareButton({
  id,
  verdict,
  product
}: {
  id: string;
  verdict: Verdict;
  product: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${location.origin}/verdict/${id}`;
    const image = `${location.origin}/api/verdict/${id}/share`;
    const text = `${verdict}: ${product} — verdict via should i buy this?`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as any).share({ title: text, text, url });
        return;
      } catch {
        // fall through to copy
      }
    }
    await navigator.clipboard.writeText(`${text}\n${url}\n${image}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button
      onClick={share}
      className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-850 px-4 py-2 text-xs uppercase tracking-widest text-ink-100 active:scale-95"
    >
      <Share className="h-3.5 w-3.5" />
      {copied ? "copied" : "share"}
    </button>
  );
}

function WishlistButton({
  verdictId,
  targetCents
}: {
  verdictId?: string;
  targetCents?: number;
}) {
  const [saved, setSaved] = useState(false);
  if (!verdictId || !targetCents) return null;
  return (
    <button
      disabled={saved}
      onClick={async () => {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          body: JSON.stringify({ verdict_id: verdictId, target_price_cents: targetCents })
        });
        if (res.ok) setSaved(true);
      }}
      className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-850 px-4 py-2 text-xs uppercase tracking-widest text-ink-100 active:scale-95"
    >
      <Heart className={`h-3.5 w-3.5 ${saved ? "fill-verdict-skip text-verdict-skip" : ""}`} />
      {saved ? "watching" : "watch price"}
    </button>
  );
}

function BoughtAnyway({ id }: { id: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      disabled={done}
      onClick={async () => {
        await fetch(`/api/verdict/${id}/bought`, { method: "POST" });
        setDone(true);
      }}
      className="mt-4 inline-flex items-center gap-2 rounded-full border border-dashed border-ink-600 bg-transparent px-3 py-1.5 text-[10px] uppercase tracking-widest text-ink-400 hover:text-ink-200"
    >
      <ShoppingCart className="h-3 w-3" />
      {done ? "noted. we'll remember." : "i bought it anyway"}
    </button>
  );
}
