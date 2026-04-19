# DECISIONS.md

Honest notes on every architectural call, every trade, every place I stubbed.

## Stack

**Next.js 15 App Router + React 19.** Server components for authed shells, client components for the live stream UI and captures. Route handlers for every API. Streaming via `ReadableStream` + SSE rather than Vercel AI SDK's helpers because the fan-out needed custom event shapes, not token streaming.

**Supabase** for auth, Postgres, storage. Magic-link only — passwords are a churn tax for a one-tap product. RLS is on every table, keyed to `auth.uid()`. Service role is only used server-side (webhook, cron, seed).

**Stripe** checkout + billing portal. Two prices (monthly $4.99, annual $29). Annual is the default button because "$29/year · less than one impulse purchase" outsells monthly. Webhook writes `subscription_status` back to `profiles`.

**Claude sonnet-4-5** for four prompts: product extraction (vision on photos/screenshots, text for scraped pages), Reddit synthesis, alternative recommendation, final verdict. Each prompt is pinned to return JSON only and parsed defensively. A deterministic heuristic in `lib/verdict.ts` is the fallback if the LLM call fails mid-stream.

**SerpAPI (Google Shopping)** for current market prices. Fair price = median of the lowest 5 legitimate results (AliExpress/Wish/Temu are excluded because they skew the median wrong).

**Keepa** for Amazon price history. ASIN is extracted from the URL; we pull 180 days of history, compute trend from the last 30 days, and flag a fake sale when the current price is above the 90-day minimum by >2%.

**Reddit API** with OAuth (client credentials). Falls back to the public JSON endpoint when credentials are absent, and degrades to an empty list if rate-limited. Top 10 comments from top 4 threads feed Claude's synthesis.

## The stream

`POST /api/verdict` returns `text/event-stream`. Events in order:

1. `started` — DB row created, so we can redirect the URL immediately
2. `product` — extraction done
3. `price | reddit | alts` — all three run in parallel, stream as each resolves
4. `verdict` — final synthesis
5. `done`

The client reducer in `components/VerdictStream.tsx` handles partial state so the page paints the product title and the progress checklist within a second of submission, then the verdict card animates in on the `verdict` event.

## UI

Editorial, not SaaS. Fraunces (serif display) for verdicts and hero copy; Inter for UI; JetBrains Mono for tiny labels and numbers. Three colors that matter: `#00C853` buy, `#FF3B30` skip, `#FFB300` wait. Everything else is charcoal on near-black with a barely-there SVG grain.

- **Verdict reveal**: scale/blur-in via framer-motion spring, haptic pulse (`navigator.vibrate([14,28,14])`) when the `verdict` event arrives on iOS Safari that has it granted.
- **Confidence ring**: animated SVG stroke-dashoffset + counting number.
- **Sparkline**: inline SVG, no chart lib.
- **Share card**: `next/og` `ImageResponse` with hand-rolled JSX that matches the in-app card. No wkhtml, no external renderer.

## Monetization

- **Freemium**: 3 verdicts/month free. Counter resets on the first day of the UTC month. The limit is enforced in `/api/verdict` before any work starts (so failed scans do not count).
- **Pro tier**: monthly + annual, annual pushed everywhere because LTV is higher.
- **Affiliate**: every alternative Claude recommends is searched again via SerpAPI to grab a real product URL, then wrapped via `affiliateWrap()` — Amazon gets `?tag=…`, everything else gets Skimlinks. FTC disclosure is baked into the card footer. Where to plug in your tags is documented in README.md.

## Addictive hooks

- **Wishlist + price alerts**: Vercel cron hits `/api/cron/price-check` every 6 hours, pulls the median price for each active wishlist row, fires a web push when the target is hit. One-row-per-device subscription table in `push_subs`.
- **Receipt counter**: every SKIP where a cheaper alternative exists adds `listed - alt[0]` cents to `saved_total_cents`. It's animated on every home screen load. This is the retention monster.
- **Streak**: consecutive-day check via `streak_last_day`. If you hit today you're either already counted or you bump to `yesterday + 1`.
- **"I bought it anyway"**: one-click signal on every SKIP verdict. Persisted so we can down-weight SKIP confidence on that category for that user in the next model iteration. Logged today, not yet wired into the prompt. (TODO: feed the last 10 "bought anyway" categories into `finalVerdict` as a personalization block.)

## Stubs + TODOs

Everything listed here compiles, runs, and returns correct-shaped data. These are the intentional rough edges:

- **Icon PNGs**: `public/icon.svg` and `public/apple-touch-icon.svg` are crisp and scale well. The manifest references `/icon-192.png` and `/icon-512.png` for Android/Chromium install banners — generate those from the SVG once (e.g. `npx pwa-asset-generator public/icon.svg public/`) before shipping. Everything else (iOS home screen, favicon, OG) uses the SVG.
- **Headless scraping**: `lib/scrape.ts` tries fetch first, then falls back to `@sparticuz/chromium` + `puppeteer-core`. The fallback path is wired but untested against cloudflare-protected retailers. If Amazon fights the scrape, we still have the `/dp/XXX` ASIN extraction path → Keepa gives us price + title without scraping.
- **"Bought anyway" feedback loop**: persisted, not yet fed back into confidence scores. TODO marker is in `DECISIONS.md` and the column is in the `verdicts` table.
- **OG font loading**: the share image uses system-font fallbacks inside `next/og`. If you want the exact Fraunces italic in the share card, register the font via `ImageResponse` options. I kept it minimal so the route never blocks on font fetches.
- **Web push on iOS**: works only when the PWA is installed to home screen (Apple's rule, not ours). The in-app empty state tells the user that.
- **Amazon affiliate rules**: anything more than ~3 sourced product links on a page requires an `rel="sponsored"` disclosure — we already do that on every alternative link.

## What's fully real

- Claude API integration, including vision and JSON parsing.
- SerpAPI query + median computation + stop-retailer list.
- Keepa integration + fake-sale detection + trend.
- Reddit OAuth + public fallback.
- Stripe checkout + portal + webhook + RLS-safe updates.
- Supabase schema + RLS + storage buckets + trigger.
- PWA manifest + service worker + push subscribe + cron consumer.
- Share image via `next/og`.
- Seed script that provisions the demo account with real-looking verdicts.

## What I would do next

- **TikTok loop**: a `/tiktok/[id]` public page with no chrome, just the verdict card and a watermark. Screenshot-optimized by definition, loadable by any creator.
- **Price regret model**: when a wishlist alert fires and the user buys within 24h, log that as a "we saved you waiting". Feed it into the confidence prior.
- **Category priors**: "electronics bought at holiday drop X% in January" baked into the prompt.
- **Group-buy**: friends add the same item to their wishlists → when it hits target, everyone pings at once.
