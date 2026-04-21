import type { PriceIntel, PriceOffer } from "@/types";
import { median } from "./utils";

const ENDPOINT = "https://serpapi.com/search.json";
const STOP_RETAILERS = new Set([
  "aliexpress.com",
  "ebay.com",    // used/graymarket — keep but weight lower
  "wish.com",
  "temu.com"
]);

/** Query Google Shopping via SerpAPI and compute fair price. */
export async function priceCheck(query: string): Promise<PriceIntel> {
  if (!process.env.SERPAPI_KEY) {
    return emptyIntel();
  }

  const url = new URL(ENDPOINT);
  url.searchParams.set("engine", "google_shopping");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", process.env.SERPAPI_KEY);
  url.searchParams.set("gl", "us");
  url.searchParams.set("hl", "en");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return emptyIntel();
  const data = (await res.json()) as SerpResult;

  const offers: PriceOffer[] = [];
  for (const r of data.shopping_results ?? []) {
    const cents = parsePrice(r.price ?? r.extracted_price);
    if (!cents) continue;
    const host = safeHost(r.link ?? r.product_link ?? "");
    if (STOP_RETAILERS.has(host)) continue;
    offers.push({
      retailer: r.source ?? host,
      price_cents: cents,
      url: r.link ?? r.product_link ?? "",
      shipping: r.shipping,
      in_stock: true
    });
  }

  offers.sort((a, b) => a.price_cents - b.price_cents);
  const lowest = offers[0]?.price_cents;
  const highest = offers[offers.length - 1]?.price_cents;
  const fair = offers.length
    ? Math.round(median(offers.slice(0, 5).map((o) => o.price_cents)))
    : undefined;

  return {
    offers: offers.slice(0, 8),
    fair_price_cents: fair,
    lowest_cents: lowest,
    highest_cents: highest,
    trend: "unknown",
    fake_sale: false
  };
}

function emptyIntel(): PriceIntel {
  return { offers: [], trend: "unknown", fake_sale: false };
}

function parsePrice(raw: unknown): number | undefined {
  if (typeof raw === "number") return Math.round(raw * 100);
  if (typeof raw !== "string") return undefined;
  const m = raw.match(/([\d,]+\.?\d*)/);
  if (!m) return undefined;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : undefined;
}

function safeHost(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

type SerpResult = {
  shopping_results?: Array<{
    title?: string;
    link?: string;
    product_link?: string;
    price?: string;
    extracted_price?: number;
    source?: string;
    shipping?: string;
  }>;
};
