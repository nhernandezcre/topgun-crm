import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { SignOut } from "@/components/SignOut";
import { ManageBilling } from "@/components/ManageBilling";

export const dynamic = "force-dynamic";

export default async function Settings() {
  const sb = await supabaseServer();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return notFound();
  const admin = supabaseAdmin();
  const { data: p } = await admin
    .from("profiles")
    .select("*")
    .eq("id", auth.user.id)
    .single();

  const isPro = p?.subscription_status === "pro";

  return (
    <main className="relative z-10 flex min-h-screen flex-col px-5 pb-10 safe-top safe-bottom">
      <header className="flex items-center justify-between pt-4">
        <Link href="/" className="flex items-center gap-1 text-sm text-ink-300">
          <ChevronLeft className="h-4 w-4" /> back
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-400">
          account
        </span>
        <span className="w-12" />
      </header>

      <section className="mt-6">
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink-400">signed in as</p>
        <p className="mt-1 font-display text-2xl italic text-ink-100">{auth.user.email}</p>
      </section>

      <section className="mt-8 space-y-3">
        <Row label="Plan">
          <span
            className={
              isPro
                ? "rounded-full bg-verdict-buy/15 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-verdict-buy"
                : "rounded-full bg-ink-700/40 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-ink-300"
            }
          >
            {isPro ? "pro" : "free"}
          </span>
        </Row>
        <Row label="Verdicts this month">
          <span className="font-mono tabular text-ink-100">{p?.verdicts_this_month ?? 0}</span>
        </Row>
        <Row label="Saved">
          <span className="font-mono tabular text-verdict-buy">
            ${(p?.saved_total_cents ?? 0) / 100}
          </span>
        </Row>
        <Row label="Streak">
          <span className="font-mono tabular text-ink-100">{p?.streak_days ?? 0}d</span>
        </Row>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-2">
        {isPro ? (
          <ManageBilling />
        ) : (
          <Link
            href="/paywall"
            className="rounded-2xl bg-verdict-buy px-6 py-4 text-center font-display text-lg font-semibold text-ink-950"
          >
            Upgrade to pro
          </Link>
        )}
        <Link
          href="/wishlist"
          className="rounded-2xl border border-ink-700 bg-ink-900 px-6 py-4 text-center text-sm uppercase tracking-widest text-ink-100"
        >
          wishlist
        </Link>
        <Link
          href="/history"
          className="rounded-2xl border border-ink-700 bg-ink-900 px-6 py-4 text-center text-sm uppercase tracking-widest text-ink-100"
        >
          verdict history
        </Link>
      </section>

      <div className="mt-auto pt-10">
        <SignOut />
        <p className="mt-6 text-center text-[10px] uppercase tracking-widest text-ink-500">
          we never sell your data. receipts stay yours.
        </p>
      </div>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-ink-900/70 px-4 py-3">
      <span className="text-sm text-ink-300">{label}</span>
      {children}
    </div>
  );
}
