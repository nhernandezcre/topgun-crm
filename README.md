# Should I Buy This?

A mobile-first PWA that tells people whether a purchase is worth it. Point your phone at anything, paste a link, or drop a screenshot, and get one verdict: **BUY**, **SKIP**, or **WAIT**.

Built with Next.js 15 App Router, Supabase, Anthropic Claude (sonnet 4.5), SerpAPI, Keepa, Reddit, Stripe, and a service worker with web push.

## 10-minute setup

### 1. API keys (6 min)

Open these tabs and copy keys into `.env.local` (start with `cp .env.example .env.local`):

- **Anthropic** — https://console.anthropic.com/settings/keys → `ANTHROPIC_API_KEY`
- **Supabase** — https://supabase.com/dashboard/new → project URL + anon + service role
- **Stripe** — https://dashboard.stripe.com/apikeys → secret key, create two products (Monthly $4.99, Annual $29), copy the price IDs into `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_ANNUAL`
- **SerpAPI** — https://serpapi.com/manage-api-key → `SERPAPI_KEY`
- **Keepa** — https://keepa.com/#!api → `KEEPA_API_KEY`
- **Reddit** — https://www.reddit.com/prefs/apps (create a "script" app) → `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`
- **Web push** — run `npx web-push generate-vapid-keys` → fill `VAPID_*`
- **Affiliate** (optional but this is your second revenue stream):
  - Amazon Associates: https://affiliate-program.amazon.com → set `AMAZON_ASSOCIATE_TAG`
  - Skimlinks fallback: https://skimlinks.com → set `SKIMLINKS_PUBLISHER_ID`

### 2. Database (1 min)

In the Supabase dashboard → **SQL editor** → paste the entire contents of `supabase/migrations/0001_init.sql` and run. That creates:

- `profiles`, `verdicts`, `wishlist`, `push_subs`
- RLS policies keyed to `auth.uid()`
- storage buckets `scans` (private) and `shares` (public)
- trigger that auto-creates a profile on signup

### 3. Deploy to Vercel (2 min)

```bash
# one-shot deploy
npx vercel --prod
```

Vercel will:

- build the Next.js 15 app
- wire the cron at `/api/cron/price-check` (already in `vercel.json`, runs every 6h)
- pick up your env vars if you paste them into the Vercel dashboard

Back in your Stripe dashboard, add a webhook at `https://YOUR_APP_URL/api/stripe/webhook` and subscribe to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

Paste the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

### 4. Test the first verdict (1 min)

```bash
pnpm dev
```

Open http://localhost:3000, sign in with your email (magic link hits your inbox), tap the big button, paste any Amazon URL. Four streams fire in parallel; the verdict card paints as each one finishes.

### 5. Load the demo account (optional)

```bash
pnpm seed
```

That creates `demo@shouldibuy.this` with 3 preloaded verdicts (a BUY, a SKIP, a WAIT) and prints a magic link. Open it, sign in, and the receipt counter already reads `$184.00`.

## Commands

```bash
pnpm dev           # local dev on :3000
pnpm build         # production build
pnpm start         # production server
pnpm typecheck     # strict TS check
pnpm seed          # seed the demo account
```

## Architecture at a glance

```
app/
├── api/
│   ├── verdict/route.ts              ← the main SSE-streaming endpoint (photo | link | screenshot)
│   ├── verdict/[id]/share/route.tsx  ← dynamic OG image for shares
│   ├── verdict/[id]/bought/route.ts  ← "i bought it anyway" signal
│   ├── stripe/{checkout,portal,webhook}
│   ├── wishlist/route.ts
│   ├── push/subscribe/route.ts
│   └── cron/price-check/route.ts     ← scans wishlist, fires web push
├── capture/                          ← segmented photo | link | screenshot flow
├── verdict/[id]/                     ← saved verdict card
├── history/                          ← receipt, tallies, all scans
├── wishlist/                         ← active price alerts
├── paywall/                          ← upgrade to pro
├── settings/                         ← plan, streak, manage billing
└── auth/{signin,callback}
lib/
├── claude.ts       ← extract product · synthesize reddit · pick alternatives · final verdict
├── serpapi.ts      ← google shopping via serpapi, compute fair price from median of top 5
├── keepa.ts        ← amazon price history + fake-sale detection
├── reddit.ts       ← auth'd reddit search + top comments
├── scrape.ts       ← fetch → cheerio → headless chromium fallback
├── affiliate.ts    ← amazon tag / skimlinks wrap
├── supabase/       ← browser + server + admin
├── stripe.ts
└── verdict.ts      ← heuristic fallback if llm call fails
```

## PWA install

iPhone: Safari → share → **Add to Home Screen**. The status bar goes black-translucent, the splash matches, haptics fire on the verdict reveal.

Android: Chrome shows an install prompt automatically after two visits.

## Adding your affiliate tags

1. Set `AMAZON_ASSOCIATE_TAG` in env. Every `amazon.com` URL Claude recommends gets `?tag=yourtag-20` appended.
2. Set `SKIMLINKS_PUBLISHER_ID` in env. All non-Amazon outbound links get wrapped through Skimlinks.
3. The FTC disclosure line is already in the verdict card footer.

## Files worth reading

- `app/api/verdict/route.ts` — the streaming fan-out lives here.
- `components/VerdictCard.tsx` — the hero UI. Every element is tap-to-expand.
- `app/api/verdict/[id]/share/route.tsx` — the branded share image.
- `DECISIONS.md` — every architectural choice, every stub, why.
- `MARKETING.md` — 10 TikTok hooks, 5 Twitter templates, landing variants, App Store description.
- `GROWTH.md` — 30-day launch plan to 10k users.
