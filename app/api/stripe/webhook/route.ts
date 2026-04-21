import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature") ?? "";
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return new Response(`bad sig: ${(err as Error).message}`, { status: 400 });
  }

  const admin = supabaseAdmin();

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const userId = (s.metadata?.user_id as string) || null;
      const subId = s.subscription as string | null;
      if (userId && subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        await markPro(admin, userId, sub);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = (sub.metadata?.user_id as string) || null;
      if (userId) await markPro(admin, userId, sub);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = (sub.metadata?.user_id as string) || null;
      if (userId) {
        await admin
          .from("profiles")
          .update({ subscription_status: "canceled" })
          .eq("id", userId);
      }
      break;
    }
    case "invoice.payment_failed": {
      const inv = event.data.object as Stripe.Invoice;
      if (inv.customer) {
        await admin
          .from("profiles")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", inv.customer as string);
      }
      break;
    }
  }

  return new Response("ok");
}

async function markPro(
  admin: ReturnType<typeof supabaseAdmin>,
  userId: string,
  sub: Stripe.Subscription
) {
  const price = sub.items.data[0]?.price;
  const interval = price?.recurring?.interval === "year" ? "annual" : "monthly";
  await admin
    .from("profiles")
    .update({
      subscription_status: sub.status === "active" || sub.status === "trialing" ? "pro" : sub.status,
      subscription_interval: interval,
      subscription_period_end: new Date(sub.current_period_end * 1000).toISOString()
    })
    .eq("id", userId);
}
