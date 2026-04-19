import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";
import { money, timeAgo } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import { PushEnable } from "@/components/PushEnable";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const sb = await supabaseServer();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return notFound();
  const admin = supabaseAdmin();
  const { data: rows } = await admin
    .from("wishlist")
    .select("id, created_at, active, target_price_cents, last_seen_price_cents, last_checked_at, verdicts(id, product_name, verdict, listed_price_cents)")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  const list = rows ?? [];

  return (
    <main className="relative z-10 flex min-h-screen flex-col px-5 pb-10 safe-top safe-bottom">
      <header className="flex items-center justify-between pt-4">
        <Link href="/" className="flex items-center gap-1 text-sm text-ink-300">
          <ChevronLeft className="h-4 w-4" /> back
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-400">
          wishlist
        </span>
        <span className="w-12" />
      </header>

      <section className="mt-6">
        <h1 className="font-display text-4xl italic text-ink-100">Price alerts</h1>
        <p className="mt-2 max-w-md text-sm text-ink-300">
          We ping you when any of these drops to your target. Turn on notifications so we can.
        </p>
        <PushEnable />
      </section>

      <section className="mt-8">
        {list.length === 0 ? (
          <p className="text-sm text-ink-400">Nothing watched yet. Tap "watch price" on any verdict.</p>
        ) : (
          <ul className="divide-y divide-ink-700/60 overflow-hidden rounded-3xl border border-ink-700/60 bg-ink-900/60">
            {list.map((r: any) => (
              <li key={r.id} className="px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/verdict/${r.verdicts?.id}`}
                      className="truncate font-display text-lg text-ink-100 hover:underline"
                    >
                      {r.verdicts?.product_name ?? "Unknown"}
                    </Link>
                    <p className="mt-0.5 font-mono text-[11px] uppercase tracking-widest text-ink-400">
                      listed {money(r.verdicts?.listed_price_cents)} · last seen {money(r.last_seen_price_cents)} ·{" "}
                      {r.last_checked_at ? timeAgo(r.last_checked_at) : "checking soon"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-ink-400">target</p>
                    <p className="font-display tabular text-xl text-verdict-buy">
                      {money(r.target_price_cents)}
                    </p>
                    {!r.active && (
                      <span className="font-mono text-[10px] uppercase tracking-widest text-verdict-buy">
                        hit ✓
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
