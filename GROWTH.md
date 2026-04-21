# GROWTH.md

30 days. Zero to 10,000 users. What to post, where, in order.

The thesis: Should I Buy This is a screenshotable product. Every verdict is a piece of organic media. We don't grow via ads, we grow via share-native content and one influencer per week.

---

## Week 0: 72 hours before launch

**Target: 500 warm signups before public day.**

- [ ] Turn the landing page on at `shouldibuy.this`. Email capture only (not the full app). Tagline variant A from MARKETING.md.
- [ ] Seed a private group of 50 friends, tech Twitter, r/buyitforlife regulars. Give each a beta link. Ask for one screenshot if the app surprises them.
- [ ] Build the Product Hunt page. Upload the OG share card. Schedule for **Tuesday 12:01am PT week 1**.
- [ ] Pre-write 14 days of TikTok scripts (see MARKETING.md for the format). Film in bursts of 4.
- [ ] Install the PWA on 3 of your own test phones. Take a 30-second screen recording of the verdict reveal with haptics. This clip is day-1 hero content.

---

## Week 1: Launch week

**Target: 2,000 signups, 400 Pro conversions.**

### Monday
- Sync with one friendly creator (50k-500k range) — give them a 10-month Pro code. Ask for one organic scan-haul video before Friday.
- Schedule PH launch for Tuesday.
- Send the "private beta is ending" email to the 500-person waitlist.

### Tuesday (Product Hunt)
- Launch at 12:01 PT. First comment from you: honest builder post about the stack + the one stat (e.g. "the app flagged 31% of listings as fake sales in my beta of 62 users").
- Every 90 minutes: reply in the PH thread with a new screenshot of a real verdict one of your beta users sent. Rotate products.
- Tweet the PH launch at 6:30am PT, 10am PT, 1pm PT, 5pm PT. Different angle each time.
- Post the 30-second verdict-reveal clip on TikTok, Instagram Reels, X video, LinkedIn.

### Wednesday
- Reddit: post in r/shutupandtakemymoney, r/buyitforlife, r/frugal, r/labrats (the Stanley crowd). Different post per sub, all pull a specific verdict as the hero image.
- Email the waitlist with a one-line hook: "three free verdicts. go."

### Thursday
- Influencer #1's video drops. Boost it with a $200 TikTok spark ad budget. Comment from the app account on every duet.

### Friday
- "Talked you out of" roundup. Pull the anonymized top 10 saves from your users this week. Post as a single carousel: "our users saved $4,812 in their first week."

### Weekend
- Lurk. Answer every DM. Record 6 new TikToks filmed around the house.

---

## Week 2: The 3-a-day content engine

**Target: 3,500 cumulative signups.**

### Every day, three posts:
1. **8am: one TikTok / Reel** using the format "scan this, AI says don't buy it."
2. **12pm: one X post** with a concrete verdict screenshot + one-line caption.
3. **8pm: one Reddit comment** answering a buying question in a relevant sub, with the app as the third-line PS ("ran it through the app I built, SKIP with 84% confidence").

### Thursday of week 2
- Influencer #2 goes live. Different vertical (e.g. beauty, tools). Same spark ad playbook.
- Release the **"I bought it anyway"** feature publicly. Tweet the launch with a screenshot: "the app remembers what you bought against its advice. it adapts."

### Sunday of week 2
- **Data tweet**: one honest chart. e.g. "Of 2,841 verdicts this week, 44% were SKIP, 31% WAIT, 25% BUY. The AirPods Pro 2 has been SKIPPED 94 times this week."

---

## Week 3: Creator partnerships

**Target: 6,000 cumulative signups.**

- Line up 5 micro-creators (20k-80k) for a single sponsored "scan my cart" video each. $150-300 per. Total budget: $1,500.
- Each video ends with the creator's code (e.g. `ANNA` for 50% off annual Pro).
- On the app side: build a `/promo/[code]` handler that redirects to `/paywall?code=…` and pre-fills the Stripe checkout with a coupon.
- Launch the **Browser Extension teaser** — one tweet, no product, just a 15s screen capture of the extension auto-running on an Amazon page. Gather signups.

### Mid-week 3: the TikTok hero drop
- Pick your highest-performing TikTok from weeks 1-2. Buy a $500 TopView (or closest equivalent on your budget). Every dollar of TopView ad drives a measurable app-install spike; track in Supabase by `utm_source=tiktok_ads`.

---

## Week 4: Retention + referrals

**Target: 10,000 cumulative signups, 1,000 Pro subscribers.**

### Monday
- Turn on the referral loop: every user gets a `/r/[handle]` link. Both sides get one extra free verdict per month. Post the launch on X + send a one-liner email.

### Tuesday
- **App Store submission** (TWA wrapping the PWA, or a small native shell). Get through review. Submit with the App Store description from MARKETING.md.

### Wednesday
- Ship the **weekly digest email**. Pull the user's last 10 verdicts + their saved total. Subject line: "You talked yourself out of $X this week."

### Thursday
- A final "30 days in" post from you: the real numbers. Honest numbers perform.

### Friday
- End the month with a giveaway. 5 lifetime Pro accounts. Entry = post a screenshot of a verdict.

---

## Channel-by-channel rules

### TikTok (the engine)
- Every video starts on the phone screen, no face needed.
- Never show the full verdict card before the hook is landed.
- One clear number in every video. ("31% over street", "$180 over fair", "84% confidence").
- Post at 8am and 8pm local. The app's audience is checkouts, they hit at night.

### X / Twitter
- One builder post per week, one user stat per week, one verdict screenshot per day.
- Never retweet yourself the same day.
- Reply under every "is X worth it" thread you can find with a one-line verdict and a link.

### Reddit
- Never shill. Answer the actual question. Drop the product as a PS.
- Subs worth targeting: r/frugal, r/personalfinance, r/buyitforlife, r/shutupandtakemymoney, r/simpleliving, r/deals, r/povertyfinance, r/woodworking (bifl crowd), r/audiophile.

### Instagram Reels
- Same TikToks, no edits. IG's remix engine picks up on them.
- One carousel per week: the "top SKIPs of the week."

### Newsletter (drip)
Trigger: user signs up. 5-email sequence, one per day.
1. "Your first verdict is on us." Straight into /capture.
2. "Here's what we actually do." 4-bullet explainer + one user screenshot.
3. "The 3 cheapest items we saved people from this week."
4. "Wishlist: how we ping you when prices crack."
5. "Go pro. $29 for a year. Here's the receipt you already have."

### Paid (only after organic hits flywheel)
- TikTok Spark Ads on your best organic: $50/day, 5 days.
- Reddit Ads in 3 frugal subs: $25/day, 7 days. Link directly to /capture.
- Hold Google until you have your first 5,000 users — it's 3x more expensive per install.

---

## Leading metrics

Obsess over these daily. Track in a single Supabase view (`mv_daily`):

| metric | day-1 goal | week-4 goal |
| --- | --- | --- |
| new signups | 150 | 500 |
| verdicts / new user | 1.4 | 2.2 |
| share-image taps | 8% | 18% |
| free → pro conv | 6% | 10% |
| day-7 retention | 22% | 40% |
| wishlist adds / user | 0.3 | 1.1 |
| push grants / user | 18% | 35% |

---

## What we do not do

- No SEO content farm. Every blog post is about one real scan.
- No influencer agencies. Direct DMs or nothing.
- No email blasts wider than 1,000 / day for the first 30 days — we optimize the template first.
- No cross-posting the same copy to more than two platforms. Native beats efficient.

---

## Day 31

Three things land:

1. **A hero retention feature**: verdict comparisons. "Scan 3, see side-by-side." Rolled to Pro first.
2. **A credibility feature**: the public "top SKIPs" leaderboard at `/top`, updated daily. It's organic traffic and a backlink magnet.
3. **A revenue feature**: annual → lifetime upsell at 80% off for month-4 Pro users. Locks in LTV.
