export type Verdict = "BUY" | "SKIP" | "WAIT";

export type InputKind = "photo" | "link" | "screenshot";

export type ProductExtract = {
  name: string;
  brand?: string;
  model?: string;
  category?: string;
  listed_price_cents?: number;
  estimated_retail_range_cents?: [number, number];
  identifier?: string;                    // asin | upc | model code if visible
  source_url?: string;
  raw_query?: string;                     // best string for Google Shopping search
};

export type PriceOffer = {
  retailer: string;
  price_cents: number;
  url: string;
  shipping?: string;
  in_stock?: boolean;
};

export type PriceHistoryPoint = { date: string; price_cents: number };

export type PriceIntel = {
  offers: PriceOffer[];
  fair_price_cents?: number;
  listed_price_cents?: number;
  lowest_cents?: number;
  highest_cents?: number;
  trend: "rising" | "flat" | "falling" | "unknown";
  history?: PriceHistoryPoint[];
  fake_sale: boolean;
};

export type RedditIntel = {
  summary: string;
  sources: { title: string; url: string; subreddit: string }[];
};

export type Alternative = {
  name: string;
  price_cents: number;
  why: string;
  url: string;
  affiliate_url?: string;
};

export type StreamEvent =
  | { kind: "started"; verdict_id: string }
  | { kind: "product"; product: ProductExtract }
  | { kind: "price"; price: PriceIntel }
  | { kind: "reddit"; reddit: RedditIntel }
  | { kind: "alts"; alternatives: Alternative[] }
  | { kind: "verdict"; verdict: Verdict; confidence: number; reason: string; move: string }
  | { kind: "done" }
  | { kind: "error"; message: string };
