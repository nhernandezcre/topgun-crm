import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { priceCheck } from "@/lib/serpapi";
import webpush from "web-push";
import { money } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Vercel Cron hits this every 6h. For each active wishlist row, repull
 * the median market price. If it crosses the target, send a push to every
 * device that user has registered.
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return new Response("forbidden", { status: 403 });
  }

  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "mailto:admin@example.com",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }

  const admin = supabaseAdmin();
  const { data: rows } = await admin
    .from("wishlist")
    .select("id, user_id, verdict_id, target_price_cents, last_seen_price_cents, verdicts(product_name, raw)")
    .eq("active", true)
    .is("notified_at", null)
    .limit(200);

  let fired = 0;

  for (const w of rows ?? []) {
    const product = (w as any).verdicts?.product_name as string | undefined;
    if (!product) continue;
    const intel = await priceCheck(product);
    const low = intel.lowest_cents;
    if (!low) continue;
    await admin
      .from("wishlist")
      .update({ last_seen_price_cents: low, last_checked_at: new Date().toISOString() })
      .eq("id", w.id);

    if (low <= w.target_price_cents) {
      const { data: subs } = await admin
        .from("push_subs")
        .select("*")
        .eq("user_id", w.user_id);
      for (const s of subs ?? []) {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify({
              title: `${product} hit ${money(low)}`,
              body: "Your price alert just went green. Go buy it before the window closes.",
              url: `/verdict/${w.verdict_id}`
            })
          );
          fired++;
        } catch {
          // endpoint dead — prune
          await admin.from("push_subs").delete().eq("endpoint", s.endpoint);
        }
      }
      await admin
        .from("wishlist")
        .update({ notified_at: new Date().toISOString(), active: false })
        .eq("id", w.id);
    }
  }

  return new Response(JSON.stringify({ scanned: rows?.length ?? 0, fired }), {
    headers: { "content-type": "application/json" }
  });
}
