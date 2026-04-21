import type { Alternative, PriceIntel, ProductExtract, RedditIntel, Verdict } from "@/types";
import { pct } from "./utils";

/**
 * Heuristic fallback verdict, used only if the LLM call fails. Keeps the
 * app resilient: price-over-fair → SKIP, big-discount + positive reddit → BUY,
 * rising trend + overpriced → WAIT.
 */
export function heuristicVerdict(input: {
  product: ProductExtract;
  price: PriceIntel;
  reddit: RedditIntel;
  alternatives: Alternative[];
}): { verdict: Verdict; confidence: number; reason: string; move: string } {
  const listed = input.product.listed_price_cents ?? input.price.listed_price_cents ?? 0;
  const fair = input.price.fair_price_cents ?? 0;
  const trend = input.price.trend;
  const overpay = fair ? pct(listed, fair) : 0;

  if (!listed || !fair) {
    return {
      verdict: "WAIT",
      confidence: 40,
      reason: "Limited price data. Want a wider signal before calling it.",
      move: "Check back in 24 hours. We will pull more offers and a history read."
    };
  }

  if (overpay >= 20) {
    return {
      verdict: "SKIP",
      confidence: 84,
      reason: `You are paying ${overpay}% over the typical ${usd(fair)} street price.`,
      move: input.alternatives[0]
        ? `Buy ${input.alternatives[0].name} at ${usd(input.alternatives[0].price_cents)} instead.`
        : "Hold. The listed price is well above median."
    };
  }

  if (overpay <= -8 && trend !== "falling") {
    return {
      verdict: "BUY",
      confidence: 88,
      reason: `Listed ${Math.abs(overpay)}% under the ${usd(fair)} median for this product.`,
      move: "Buy now. This is the lowest it has been against the current market."
    };
  }

  if (trend === "falling") {
    return {
      verdict: "WAIT",
      confidence: 70,
      reason: `Price is drifting down across the last 30 days while listed near ${usd(listed)}.`,
      move: "Add to the wishlist and let the alert ping you when it hits target."
    };
  }

  return {
    verdict: "WAIT",
    confidence: 58,
    reason: `Listed near the ${usd(fair)} median with flat trend. No urgent reason to buy today.`,
    move: "Wishlist it. Save it for the next sale window."
  };
}

function usd(cents: number) {
  return `$${Math.round(cents / 100)}`;
}
