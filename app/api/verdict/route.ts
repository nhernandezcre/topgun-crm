import { NextRequest } from "next/server";
import {
  extractProductFromImage,
  extractProductFromText,
  finalVerdict,
  recommendAlternatives,
  synthesizeReddit
} from "@/lib/claude";
import { priceCheck } from "@/lib/serpapi";
import { amazonHistory, asinFromUrl } from "@/lib/keepa";
import { redditDiscussion } from "@/lib/reddit";
import { scrapeProduct } from "@/lib/scrape";
import { affiliateWrap } from "@/lib/affiliate";
import { heuristicVerdict } from "@/lib/verdict";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";
import type {
  Alternative,
  InputKind,
  PriceIntel,
  ProductExtract,
  RedditIntel,
  StreamEvent,
  Verdict
} from "@/types";
import { FREE_VERDICTS_PER_MONTH } from "@/lib/stripe";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const kind = form.get("kind") as InputKind | null;
  if (!kind) return bad("kind required");

  const sb = await supabaseServer();
  const { data: auth } = await sb.auth.getUser();
  const user = auth.user;
  if (!user) return bad("not signed in", 401);

  // ------- quota check
  const admin = supabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile) {
    const anchor = new Date(profile.month_anchor);
    const now = new Date();
    const sameMonth =
      anchor.getUTCFullYear() === now.getUTCFullYear() &&
      anchor.getUTCMonth() === now.getUTCMonth();
    if (!sameMonth) {
      await admin
        .from("profiles")
        .update({ verdicts_this_month: 0, month_anchor: now.toISOString().slice(0, 10) })
        .eq("id", user.id);
      profile.verdicts_this_month = 0;
    }
    if (
      profile.subscription_status !== "pro" &&
      profile.verdicts_this_month >= FREE_VERDICTS_PER_MONTH
    ) {
      return new Response(JSON.stringify({ error: "paywall" }), {
        status: 402,
        headers: { "content-type": "application/json" }
      });
    }
  }

  // ------- start SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (ev: StreamEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(ev)}\n\n`));
      };

      let verdictId: string | null = null;
      try {
        const { data: row } = await admin
          .from("verdicts")
          .insert({ user_id: user.id, input_kind: kind })
          .select("id")
          .single();
        verdictId = row?.id ?? null;
        if (verdictId) send({ kind: "started", verdict_id: verdictId });

        // ---- 1. extract product ------------------------------------------
        let product: ProductExtract;
        let sourceUrl: string | undefined;

        if (kind === "link") {
          const url = String(form.get("url") ?? "").trim();
          if (!/^https?:\/\//.test(url)) throw new Error("Invalid URL.");
          sourceUrl = url;
          const scraped = await scrapeProduct(url);
          product = await extractProductFromText({ url, text: scraped.text });
          product.source_url = scraped.final_url;
        } else {
          const file = form.get("image") as File | null;
          if (!file) throw new Error("No image attached.");
          const buf = Buffer.from(await file.arrayBuffer());
          const b64 = buf.toString("base64");
          const mt = normalizeMedia(file.type);
          product = await extractProductFromImage({
            imageBase64: b64,
            mediaType: mt,
            hint:
              kind === "screenshot"
                ? "This is a screenshot of an e-commerce listing. Extract the listing price."
                : "This is a photo of a physical product."
          });

          // upload scan to private bucket for later
          if (verdictId) {
            const path = `${user.id}/${verdictId}.${ext(mt)}`;
            await admin.storage.from("scans").upload(path, buf, {
              contentType: mt,
              upsert: true
            });
            await admin.from("verdicts").update({ input_image_path: path }).eq("id", verdictId);
          }
        }

        send({ kind: "product", product });

        // ---- 2. fan-out: price | reddit | alts ---------------------------
        const asin = sourceUrl ? asinFromUrl(sourceUrl) : undefined;

        const priceTask = (async (): Promise<PriceIntel> => {
          const [market, history] = await Promise.all([
            priceCheck(product.raw_query || product.name),
            asin
              ? amazonHistory(asin)
              : Promise.resolve({ trend: "unknown" as const, history: [], fake_sale: false })
          ]);

          const listed = product.listed_price_cents ?? history.current_cents;
          const fair = market.fair_price_cents ?? history.lowest_cents;

          return {
            offers: market.offers,
            fair_price_cents: fair,
            listed_price_cents: listed,
            lowest_cents: market.lowest_cents ?? history.lowest_cents,
            highest_cents: market.highest_cents,
            trend: history.trend !== "unknown" ? history.trend : market.trend,
            history: history.history,
            fake_sale: history.fake_sale
          };
        })();

        const redditTask = (async (): Promise<RedditIntel> => {
          const comments = await redditDiscussion(
            `${product.brand ?? ""} ${product.name}`.trim()
          );
          return synthesizeReddit({ product, comments });
        })();

        const altsTask = (async (): Promise<Alternative[]> => {
          const alts = await recommendAlternatives(product);
          // verify + enrich: each alternative must have a real search result
          const verified = await Promise.all(
            alts.map(async (a) => {
              const intel = await priceCheck(a.name);
              const top = intel.offers[0];
              if (!top) return null;
              const url = top.url;
              return {
                ...a,
                url,
                affiliate_url: affiliateWrap(url),
                price_cents: top.price_cents || a.price_cents
              } satisfies Alternative;
            })
          );
          return verified.filter((x): x is Alternative => !!x).slice(0, 3);
        })();

        // stream as each resolves
        const [price, reddit, alternatives] = await settleStreaming({
          price: priceTask,
          reddit: redditTask,
          alts: altsTask,
          onEach: (k, v) => {
            if (k === "price") send({ kind: "price", price: v });
            if (k === "reddit") send({ kind: "reddit", reddit: v });
            if (k === "alts") send({ kind: "alts", alternatives: v });
          }
        });

        // ---- 3. final verdict -------------------------------------------
        let verdictOut: {
          verdict: Verdict;
          confidence: number;
          reason: string;
          move: string;
        };
        try {
          verdictOut = await finalVerdict({ product, price, reddit, alternatives });
        } catch {
          verdictOut = heuristicVerdict({ product, price, reddit, alternatives });
        }

        send({ kind: "verdict", ...verdictOut });

        // ---- 4. persist -------------------------------------------------
        if (verdictId) {
          await admin
            .from("verdicts")
            .update({
              input_url: sourceUrl ?? null,
              product_name: product.name,
              product_brand: product.brand,
              product_model: product.model,
              product_category: product.category,
              listed_price_cents: price.listed_price_cents ?? null,
              fair_price_cents: price.fair_price_cents ?? null,
              price_trend: price.trend,
              history: price.history ?? null,
              reddit_summary: reddit.summary,
              reddit_sources: reddit.sources,
              alternatives,
              verdict: verdictOut.verdict,
              confidence: verdictOut.confidence,
              reason: verdictOut.reason,
              move: verdictOut.move,
              raw: { product, price, reddit, alternatives }
            })
            .eq("id", verdictId);

          // counters
          if (profile) {
            const savingFromAlt =
              verdictOut.verdict === "SKIP" && price.listed_price_cents && alternatives[0]
                ? Math.max(price.listed_price_cents - alternatives[0].price_cents, 0)
                : 0;
            await admin
              .from("profiles")
              .update({
                verdicts_this_month: profile.verdicts_this_month + 1,
                saved_total_cents: profile.saved_total_cents + savingFromAlt,
                ...bumpStreak(profile.streak_days, profile.streak_last_day)
              })
              .eq("id", user.id);
          }
        }

        send({ kind: "done" });
      } catch (err: any) {
        send({
          kind: "error",
          message: humanize(err?.message ?? "Something went sideways on our end.")
        });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive"
    }
  });
}

// -------------- helpers ----------------------------------------------------
function bad(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "content-type": "application/json" }
  });
}

function normalizeMedia(t: string): "image/jpeg" | "image/png" | "image/webp" | "image/heic" {
  if (/png/i.test(t)) return "image/png";
  if (/webp/i.test(t)) return "image/webp";
  if (/heic|heif/i.test(t)) return "image/heic";
  return "image/jpeg";
}

function ext(t: string) {
  return t.split("/")[1] || "jpg";
}

function humanize(msg: string) {
  if (/quota|rate/i.test(msg)) return "Our brain is rate-limited. Try again in a minute.";
  if (/scrape|url|fetch/i.test(msg)) return "That link is fighting us. Try a screenshot instead.";
  return msg.length < 160 ? msg : "Something went sideways. Try again.";
}

function bumpStreak(days: number, last: string | null) {
  const today = new Date().toISOString().slice(0, 10);
  if (last === today) return {};
  const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
  const next = last === yesterday ? days + 1 : 1;
  return { streak_days: next, streak_last_day: today };
}

async function settleStreaming<T extends Record<string, Promise<unknown>>>(opts: {
  price: Promise<PriceIntel>;
  reddit: Promise<RedditIntel>;
  alts: Promise<Alternative[]>;
  onEach: (k: "price" | "reddit" | "alts", v: any) => void;
}) {
  const price = opts.price.then((v) => {
    opts.onEach("price", v);
    return v;
  });
  const reddit = opts.reddit.then((v) => {
    opts.onEach("reddit", v);
    return v;
  });
  const alts = opts.alts.then((v) => {
    opts.onEach("alts", v);
    return v;
  });
  return Promise.all([price, reddit, alts]);
}
