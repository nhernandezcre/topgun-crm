import Link from "next/link";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";
import { money, timeAgo } from "@/lib/utils";
import { StreakPill } from "@/components/StreakPill";
import { BigButton } from "@/components/BigButton";
import { SavedCounter } from "@/components/SavedCounter";
import { FREE_VERDICTS_PER_MONTH } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function Home() {
  const sb = await supabaseServer();
  const { data: auth } = await sb.auth.getUser();
  const user = auth.user;

  let profile: any = null;
  let recent: any[] = [];
  if (user) {
    const admin = supabaseAdmin();
    const { data: p } = await admin.from("profiles").select("*").eq("id", user.id).single();
    profile = p;
    const { data: rs } = await admin
      .from("verdicts")
      .select("id, created_at, product_name, verdict, confidence, listed_price_cents")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);
    recent = rs ?? [];
  }

  const isPro = profile?.subscription_status === "pro";
  const remaining = Math.max(FREE_VERDICTS_PER_MONTH - (profile?.verdicts_this_month ?? 0), 0);
  const saved = profile?.saved_total_cents ?? 0;

  return (
    <main className="relative z-10 flex min-h-screen flex-col safe-top safe-bottom">
      <header className="flex items-center justify-between px-5 pt-5">
        <Link href="/" className="font-display text-lg tracking-tight">
          should i buy this<span className="text-verdict-buy">?</span>
        </Link>
        <div className="flex items-center gap-3">
          <StreakPill days={profile?.streak_days ?? 0} />
          <Link
            href={user ? "/settings" : "/auth/signin"}
            className="text-xs uppercase tracking-widest text-ink-300 hover:text-ink-100"
          >
            {user ? "account" : "sign in"}
          </Link>
        </div>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-5 pb-12 pt-8">
        <div className="w-full max-w-xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-400">
            {user ? `${remaining} free verdict${remaining === 1 ? "" : "s"} left this month` : "free first verdict"}
          </p>
          <h1 className="mt-4 font-display text-display-lg font-medium leading-[0.95] tracking-tight text-ink-100">
            Before you tap buy,
            <br />
            <span className="italic text-verdict-buy">tap this.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-ink-300">
            Point your phone at anything. We tell you if it's worth it, if you're getting ripped
            off, and what to buy instead. Takes 8 seconds.
          </p>
        </div>

        <BigButton />

        {user ? (
          <SavedCounter cents={saved} isPro={isPro} />
        ) : (
          <p className="mt-10 text-center text-xs uppercase tracking-[0.25em] text-ink-400">
            Your first verdict is free. Make it count.
          </p>
        )}
      </section>

      {recent.length > 0 && (
        <section className="mx-auto w-full max-w-xl px-5 pb-10">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-xl text-ink-100">Recent</h2>
            <Link href="/history" className="text-[11px] uppercase tracking-widest text-ink-400">
              all verdicts →
            </Link>
          </div>
          <ul className="divide-y divide-ink-700/60 overflow-hidden rounded-2xl border border-ink-700/60 bg-ink-900/60">
            {recent.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/verdict/${r.id}`}
                  className="flex items-center gap-4 px-4 py-4 hover:bg-ink-800/60"
                >
                  <VerdictTag v={r.verdict as any} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink-100">{r.product_name ?? "Untitled"}</p>
                    <p className="truncate text-xs text-ink-400">
                      {money(r.listed_price_cents)} · {timeAgo(r.created_at)}
                    </p>
                  </div>
                  <span className="font-mono text-xs tabular text-ink-300">
                    {r.confidence ?? "—"}%
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="px-5 pb-6 pt-2 text-center text-[11px] uppercase tracking-[0.25em] text-ink-500">
        we read the reviews you won't
      </footer>
    </main>
  );
}

function VerdictTag({ v }: { v: "BUY" | "SKIP" | "WAIT" }) {
  const c =
    v === "BUY" ? "text-verdict-buy" : v === "SKIP" ? "text-verdict-skip" : "text-verdict-wait";
  return (
    <span className={`w-14 shrink-0 font-display text-lg font-bold tracking-tight ${c}`}>
      {v}
    </span>
  );
}
