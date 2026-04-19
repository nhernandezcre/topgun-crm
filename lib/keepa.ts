import type { PriceHistoryPoint } from "@/types";

const KEEPA = "https://api.keepa.com";

/**
 * Pull Amazon price history for an ASIN and decide trend + fake-sale status.
 * Keepa returns "csv" arrays where index 0 is Amazon's own price, 1 is new 3rd party,
 * with pairs of [keepaMinutes, price (cents * 0.01 minor unit adjusted)].
 * Our cents convention: price field from Keepa is in units of cents with value -1 meaning "no data".
 */
export async function amazonHistory(asin: string): Promise<{
  trend: "rising" | "flat" | "falling" | "unknown";
  history: PriceHistoryPoint[];
  lowest_cents?: number;
  fake_sale: boolean;
  current_cents?: number;
}> {
  if (!process.env.KEEPA_API_KEY || !asin) {
    return { trend: "unknown", history: [], fake_sale: false };
  }

  const url = new URL(`${KEEPA}/product`);
  url.searchParams.set("key", process.env.KEEPA_API_KEY);
  url.searchParams.set("domain", "1");
  url.searchParams.set("asin", asin);
  url.searchParams.set("stats", "180");
  url.searchParams.set("history", "1");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return { trend: "unknown", history: [], fake_sale: false };
  const data = (await res.json()) as KeepaResp;
  const product = data.products?.[0];
  if (!product) return { trend: "unknown", history: [], fake_sale: false };

  const raw = product.csv?.[0] ?? product.csv?.[1] ?? [];
  const history: PriceHistoryPoint[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    const km = raw[i];
    const price = raw[i + 1];
    if (price == null || price < 0) continue;
    const ts = keepaMinutesToDate(km);
    history.push({ date: ts.toISOString(), price_cents: price });
  }

  if (history.length < 2) {
    return {
      trend: "unknown",
      history,
      current_cents: history.at(-1)?.price_cents,
      fake_sale: false
    };
  }

  const recent = history.slice(-30);
  const first = recent[0].price_cents;
  const last = recent.at(-1)!.price_cents;
  const delta = (last - first) / first;
  const trend: "rising" | "flat" | "falling" =
    delta > 0.03 ? "rising" : delta < -0.03 ? "falling" : "flat";

  const min90 = Math.min(...history.slice(-90).map((p) => p.price_cents));
  const fake_sale = last > min90 * 1.02;

  return {
    trend,
    history,
    lowest_cents: Math.min(...history.map((h) => h.price_cents)),
    current_cents: last,
    fake_sale
  };
}

/** Extract an ASIN from an Amazon URL. */
export function asinFromUrl(u: string): string | undefined {
  const m = u.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
  return m?.[1]?.toUpperCase();
}

function keepaMinutesToDate(km: number): Date {
  // Keepa epoch: minutes since 2011-01-01 UTC plus 21564000.
  const KEEPA_EPOCH = 21564000;
  const unix = (km + KEEPA_EPOCH) * 60 * 1000;
  return new Date(unix);
}

type KeepaResp = {
  products?: Array<{ csv?: (number[] | null)[] }>;
};
