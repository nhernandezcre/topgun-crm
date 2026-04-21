import { NextRequest, NextResponse } from "next/server";
import { PRICE_IDS, stripe } from "@/lib/stripe";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { interval } = (await req.json()) as { interval: "monthly" | "annual" };
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  const user = data.user;
  if (!user) return NextResponse.json({ error: "signin" }, { status: 401 });

  const admin = supabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id, email")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? profile?.email ?? undefined,
      metadata: { user_id: user.id }
    });
    customerId = customer.id;
    await admin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const priceId = interval === "monthly" ? PRICE_IDS.monthly : PRICE_IDS.annual;
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? req.headers.get("origin") ?? "";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${origin}/?upgraded=1`,
    cancel_url: `${origin}/paywall?canceled=1`,
    subscription_data: { metadata: { user_id: user.id, interval } }
  });

  return NextResponse.json({ url: session.url });
}
