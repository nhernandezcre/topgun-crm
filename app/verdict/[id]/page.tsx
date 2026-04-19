import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";
import { VerdictCard } from "@/components/VerdictCard";
import { X } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VerdictPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await supabaseServer();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) {
    return notFound();
  }

  const admin = supabaseAdmin();
  const { data: v } = await admin
    .from("verdicts")
    .select("*")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .single();

  if (!v) return notFound();

  const raw = (v.raw ?? {}) as any;

  return (
    <main className="relative z-10 flex min-h-screen flex-col px-5 pb-10 safe-top safe-bottom">
      <header className="flex items-center justify-between pt-4">
        <Link href="/" className="rounded-full bg-ink-850 p-2.5 text-ink-100 active:scale-95">
          <X className="h-4 w-4" />
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-400">
          saved verdict
        </span>
        <span className="w-9" />
      </header>

      <div className="mt-6">
        <VerdictCard
          verdict={v.verdict as any}
          confidence={v.confidence ?? 0}
          reason={v.reason ?? ""}
          move={v.move ?? ""}
          product={raw.product ?? { name: v.product_name ?? "Untitled", raw_query: v.product_name ?? "" }}
          price={raw.price}
          reddit={raw.reddit ?? { summary: v.reddit_summary ?? "", sources: v.reddit_sources ?? [] }}
          alternatives={(raw.alternatives ?? v.alternatives ?? []) as any}
          verdictId={v.id}
          boughtAnyway={v.bought_anyway}
        />
      </div>
    </main>
  );
}
