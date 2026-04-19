import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";
import { money, timeAgo } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const sb = await supabaseServer();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return notFound();

  const admin = supabaseAdmin();
  const [{ data: rows }, { data: profile }] = await Promise.all([
    admin
      .from("verdicts")
      .select("id, created_at, product_name, verdict, confidence, listed_price_cents, fair_price_cents, bought_anyway")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    admin.from("profiles").select("saved_total_cents, streak_days").eq("id", auth.user.id).single()
  ]);

  const list = rows ?? [];
  const savedTotal = profile?.saved_total_cents ?? 0;

  const counts = {
    BUY: list.filter((r) => r.verdict === "BUY").length,
    SKIP: list.filter((r) => r.verdict === "SKIP").length,
    WAIT: list.filter((r) => r.verdict === "WAIT").length
  };

  return (
    <main className="relative z-10 flex min-h-screen flex-col px-5 pb-16 safe-top safe-bottom">
      <header className="flex items-center justify-between pt-4">
        <Link href="/" className="flex items-center gap-1 text-sm text-ink-300 hover:text-ink-100">
          <ChevronLeft className="h-4 w-4" /> back
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-400">
          history
        </span>
        <span className="w-12" />
      </header>

      <section className="mt-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-400">
          your receipt
        </p>
        <h1 className="mt-1 font-display text-4xl italic text-ink-100">
          You've been talked out of{" "}
          <span className="text-verdict-buy">{money(savedTotal)}</span>
        </h1>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <TallyCard label="buy" value={counts.BUY} color="text-verdict-buy" />
          <TallyCard label="skip" value={counts.SKIP} color="text-verdict-skip" />
          <TallyCard label="wait" value={counts.WAIT} color="text-verdict-wait" />
        </div>
      </section>

      <section className="mt-8">
        {list.length === 0 ? (
          <p className="text-sm text-ink-400">
            No verdicts yet.{" "}
            <Link href="/capture" className="text-ink-100 underline">
              Try your first one.
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-ink-700/60 overflow-hidden rounded-3xl border border-ink-700/60 bg-ink-900/60">
            {list.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/verdict/${r.id}`}
                  className="flex items-center gap-4 px-4 py-4 hover:bg-ink-800/60"
                >
                  <span
                    className={`w-14 shrink-0 font-display text-lg font-bold tracking-tight ${
                      r.verdict === "BUY"
                        ? "text-verdict-buy"
                        : r.verdict === "SKIP"
                          ? "text-verdict-skip"
                          : "text-verdict-wait"
                    }`}
                  >
                    {r.verdict ?? "—"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink-100">
                      {r.product_name ?? "Untitled"}
                      {r.bought_anyway && (
                        <span className="ml-2 rounded-full bg-verdict-skip/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-verdict-skip">
                          bought
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-ink-400">
                      {money(r.listed_price_cents)} listed · {timeAgo(r.created_at)}
                    </p>
                  </div>
                  <span className="font-mono text-xs tabular text-ink-300">
                    {r.confidence ?? "—"}%
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function TallyCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border border-ink-700/60 bg-ink-900/60 px-3 py-4">
      <p className={`font-display text-3xl tabular ${color}`}>{value}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-400">{label}</p>
    </div>
  );
}
