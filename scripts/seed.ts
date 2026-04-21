/**
 * Seed a demo account you can sign into instantly and the 3 preloaded verdicts.
 * Usage:
 *   tsx scripts/seed.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY. Writes a BUY, a SKIP, and a WAIT
 * verdict — so the history and receipt counter show signal from the first login.
 */

import { createClient } from "@supabase/supabase-js";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DEMO_EMAIL = process.env.SEED_DEMO_EMAIL ?? "demo@shouldibuy.this";

if (!SUPA_URL || !SUPA_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } });

async function main() {
  // create or fetch the demo user
  let userId: string | null = null;
  const list = await admin.auth.admin.listUsers();
  const found = list.data.users.find((u) => u.email === DEMO_EMAIL);
  if (found) userId = found.id;
  else {
    const created = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      email_confirm: true,
      user_metadata: { seeded: true }
    });
    if (created.error) throw created.error;
    userId = created.data.user!.id;
  }

  if (!userId) throw new Error("could not resolve demo user id");

  await admin
    .from("profiles")
    .update({
      saved_total_cents: 18400,
      streak_days: 4,
      verdicts_this_month: 0,
      subscription_status: "free"
    })
    .eq("id", userId);

  const samples = [
    {
      input_kind: "link",
      input_url: "https://www.amazon.com/dp/B0BDHWDR12",
      product_name: "Apple AirPods Pro (2nd Generation)",
      product_brand: "Apple",
      product_category: "Wireless Earbuds",
      listed_price_cents: 24900,
      fair_price_cents: 18900,
      price_trend: "falling",
      verdict: "WAIT",
      confidence: 78,
      reason: "Listed 31% above the $189 median, and history shows a sub-$190 dip every 3–4 weeks.",
      reddit_summary:
        "Owners rave about the ANC but complain about crackling after 10 months. Warranty swap is easy but annoying.",
      reddit_sources: [
        { title: "AirPods Pro 2 worth it?", url: "https://reddit.com/r/apple/comments/x1", subreddit: "apple" }
      ],
      alternatives: [
        { name: "Sony WF-1000XM5", price_cents: 19900, why: "Better noise cancel, fuller bass, same ecosystem on Android.", url: "" },
        { name: "Apple AirPods Pro 2 (refurbished)", price_cents: 17900, why: "Same hardware, Apple warranty, saves $70.", url: "" },
        { name: "Nothing Ear (2)", price_cents: 14900, why: "Matches the Pros on ANC for 40% less, design is better.", url: "" }
      ],
      move: "Wait 11 days. AirPods drop under $189 on Amazon around the 15th every month."
    },
    {
      input_kind: "photo",
      product_name: "Stanley Quencher H2.0 40oz",
      product_brand: "Stanley",
      product_category: "Water Bottle",
      listed_price_cents: 4500,
      fair_price_cents: 4500,
      price_trend: "flat",
      verdict: "BUY",
      confidence: 86,
      reason: "Listed at the median $45 and Reddit heavy users swear by it for 4+ years of daily use.",
      reddit_summary:
        "Actual owners say the seal lasts, the handle doesn't snap, and it keeps ice overnight. A couple note the paint chips at year 2.",
      reddit_sources: [
        { title: "Is the Stanley worth the hype?", url: "https://reddit.com/r/HydroHomies/comments/x2", subreddit: "HydroHomies" }
      ],
      alternatives: [],
      move: "Buy it. The hype is real. Standard color saves $8 vs the seasonal drop."
    },
    {
      input_kind: "screenshot",
      product_name: "Dyson V11 Animal Cordless Vacuum",
      product_brand: "Dyson",
      product_category: "Vacuum",
      listed_price_cents: 54900,
      fair_price_cents: 37900,
      price_trend: "flat",
      verdict: "SKIP",
      confidence: 91,
      reason: "You're paying 45% over the typical $379 street price for a model Dyson discontinued.",
      reddit_summary:
        "Reddit is done with Dyson at full price. Battery packs die at year 3, replacements cost $120, and the V11 is phased out.",
      reddit_sources: [],
      alternatives: [
        { name: "Shark Stratos Cordless IZ862H", price_cents: 34900, why: "Matches Dyson suction, 2x the battery life, $200 cheaper today.", url: "" },
        { name: "Tineco Pure One S15 Pet", price_cents: 39900, why: "Smart auto-suction, user-replaceable battery, wins pet-hair tests.", url: "" },
        { name: "Dyson V11 (refurbished)", price_cents: 32900, why: "Same unit, full Dyson warranty, 40% off retail.", url: "" }
      ],
      move: "Skip. Buy the Shark Stratos today and bank the $200."
    }
  ];

  for (const s of samples) {
    await admin.from("verdicts").insert({
      user_id: userId,
      ...s,
      raw: {
        product: { name: s.product_name, brand: s.product_brand, category: s.product_category, listed_price_cents: s.listed_price_cents, raw_query: s.product_name },
        price: { listed_price_cents: s.listed_price_cents, fair_price_cents: s.fair_price_cents, trend: s.price_trend, offers: [], fake_sale: false },
        reddit: { summary: s.reddit_summary, sources: s.reddit_sources },
        alternatives: s.alternatives
      }
    });
  }

  // send the demo user a magic link so you can sign in
  const link = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: DEMO_EMAIL,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback?next=/` }
  });

  console.log("Seeded demo account:");
  console.log("  email:", DEMO_EMAIL);
  console.log("  magic link:", link.data?.properties?.action_link ?? "(resend via Supabase auth)");
  console.log("  sample verdicts: 3 (BUY, SKIP, WAIT)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
