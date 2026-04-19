import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";
import { money } from "@/lib/utils";
import { UpgradeButtons } from "@/components/UpgradeButtons";
import { X } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Go Pro" };

export default async function Paywall() {
  const sb = await supabaseServer();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return notFound();
  const admin = supabaseAdmin();
  const { data: p } = await admin
    .from("profiles")
    .select("saved_total_cents, verdicts_this_month, subscription_status")
    .eq("id", auth.user.id)
    .single();

  const saved = p?.saved_total_cents ?? 0;

  return (
    <main className="relative z-10 flex min-h-screen flex-col px-5 pb-10 safe-top safe-bottom">
      <header className="flex items-center justify-between pt-4">
        <Link href="/" className="rounded-full bg-ink-850 p-2.5 text-ink-100 active:scale-95">
          <X className="h-4 w-4" />
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-400">
          pro
        </span>
        <span className="w-9" />
      </header>

      <section className="mt-10 flex flex-1 flex-col">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-400">
          your receipt so far
        </p>
        <h1 className="mt-2 font-display text-display-lg italic leading-[0.95] text-ink-100">
          You've saved{" "}
          <span className="text-verdict-buy">{money(saved)}</span>.
        </h1>
        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-ink-300">
          Don't stop now. Unlimited verdicts, price drop alerts, and a receipt of every time we
          talked you out of a bad decision.
        </p>

        <ul className="mt-6 space-y-2 text-sm text-ink-200">
          <Check>Unlimited verdicts, forever</Check>
          <Check>Price drop alerts via push (wishlist monitors everything)</Check>
          <Check>Full scan history, searchable</Check>
          <Check>Streaks, saved totals, the whole receipt</Check>
          <Check>Priority scanning during sale events</Check>
        </ul>

        <div className="mt-auto">
          <UpgradeButtons />
          <p className="mt-3 text-center text-[11px] uppercase tracking-widest text-ink-500">
            $29/year. less than one impulse purchase.
          </p>
        </div>
      </section>
    </main>
  );
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-verdict-buy" />
      <span>{children}</span>
    </li>
  );
}
