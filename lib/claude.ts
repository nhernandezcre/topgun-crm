import Anthropic from "@anthropic-ai/sdk";
import type {
  Alternative,
  PriceIntel,
  ProductExtract,
  RedditIntel,
  Verdict
} from "@/types";

export const MODEL = "claude-sonnet-4-5";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export { client as anthropic };

type ClaudeImageMedia = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

/** Extract structured product data from an image (photo or screenshot). */
export async function extractProductFromImage(input: {
  imageBase64: string;
  mediaType: ClaudeImageMedia;
  hint?: string;
}): Promise<ProductExtract> {
  const sys = `You are a product identification engine. Given a photo or a screenshot of a listing, return ONLY a JSON object with these exact keys:
{
  "name": string,
  "brand": string | null,
  "model": string | null,
  "category": string | null,
  "listed_price_cents": number | null,
  "estimated_retail_range_cents": [number, number] | null,
  "identifier": string | null,
  "raw_query": string
}
Rules:
- "name" is a clean product title, not a marketing blurb.
- If the image is a screenshot of a listing, extract the price shown as listed_price_cents (integer cents).
- If it is a physical product photo, leave listed_price_cents null and estimate retail range.
- "raw_query" is the best plain-language string to search on Google Shopping. Include brand + model but drop adjectives.
- No markdown, no commentary, JSON only.`;

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: sys,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: input.mediaType, data: input.imageBase64 }
          },
          { type: "text", text: input.hint ?? "Identify this product." }
        ]
      }
    ]
  });

  return parseJson<ProductExtract>(msg);
}

/** Extract structured product data from scraped HTML text. */
export async function extractProductFromText(input: {
  url: string;
  text: string;
}): Promise<ProductExtract> {
  const sys = `You read raw text scraped from a product page and return ONLY JSON with these keys:
{
  "name": string,
  "brand": string | null,
  "model": string | null,
  "category": string | null,
  "listed_price_cents": number | null,
  "estimated_retail_range_cents": [number, number] | null,
  "identifier": string | null,
  "raw_query": string
}
"listed_price_cents" must be the current sale price if shown, in integer cents.
No markdown, JSON only.`;

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: sys,
    messages: [
      {
        role: "user",
        content: `URL: ${input.url}\n\nPAGE TEXT (truncated):\n${input.text.slice(0, 12000)}`
      }
    ]
  });

  const out = parseJson<ProductExtract>(msg);
  out.source_url = input.url;
  return out;
}

/** Synthesize Reddit chatter into a 2-sentence verdict-ready summary. */
export async function synthesizeReddit(input: {
  product: ProductExtract;
  comments: { body: string; url: string; subreddit: string; title: string }[];
}): Promise<RedditIntel> {
  if (input.comments.length === 0) {
    return {
      summary: "Not enough Reddit chatter to pull a read. Treating this as unknown signal.",
      sources: []
    };
  }

  const sys = `You synthesize Reddit discussion into a brutally honest 2-sentence read for a buyer. No hedging, no "could", no "might". Cite the common complaint and the common praise in plain language. Return ONLY JSON: { "summary": string }.`;

  const joined = input.comments
    .slice(0, 10)
    .map(
      (c, i) =>
        `#${i + 1} r/${c.subreddit} — ${c.title}\n${c.body.slice(0, 600)}\nlink: ${c.url}`
    )
    .join("\n\n");

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: sys,
    messages: [
      {
        role: "user",
        content: `Product: ${input.product.name}\n\nReddit snippets:\n${joined}`
      }
    ]
  });

  const { summary } = parseJson<{ summary: string }>(msg);
  return {
    summary,
    sources: input.comments.slice(0, 5).map((c) => ({
      title: c.title,
      url: c.url,
      subreddit: c.subreddit
    }))
  };
}

/** Recommend 3 specific real alternatives. */
export async function recommendAlternatives(
  product: ProductExtract
): Promise<Alternative[]> {
  const sys = `You recommend three real, specific alternative products that are better value for the same job. Return ONLY JSON:
{ "alternatives": [ { "name": string, "price_cents": number, "why": string } ] }
Rules:
- Real product names only (brand + model). No generic categories.
- Price in integer cents, realistic current market price.
- "why" is one sentence, specific. Not "cheaper" alone — say what it's better at.
- Three items exactly.`;

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: sys,
    messages: [
      {
        role: "user",
        content: `Target: ${product.name} (${product.brand ?? ""} ${product.model ?? ""}) — category: ${product.category ?? "unknown"}. Listed price: ${product.listed_price_cents ?? "unknown"} cents.`
      }
    ]
  });

  const { alternatives } = parseJson<{ alternatives: Omit<Alternative, "url">[] }>(msg);
  return alternatives.slice(0, 3).map((a) => ({ ...a, url: "" }));
}

/** Final verdict synthesis. */
export async function finalVerdict(input: {
  product: ProductExtract;
  price: PriceIntel;
  reddit: RedditIntel;
  alternatives: Alternative[];
}): Promise<{ verdict: Verdict; confidence: number; reason: string; move: string }> {
  const sys = `You are the final arbiter. Return ONE verdict for this purchase.
Rules:
- verdict: exactly one of "BUY", "SKIP", "WAIT".
- confidence: integer 0 to 100.
- reason: ONE sentence, brutally honest, data-specific (cite the number).
- move: ONE sentence telling the user exactly what to do next. Be specific ("Wait 11 days, it drops to $89 every month around the 15th" is good).
- No dashes (em or en). No fluff. No disclaimers.
Return ONLY JSON: { "verdict": ..., "confidence": ..., "reason": ..., "move": ... }`;

  const payload = {
    product: {
      name: input.product.name,
      brand: input.product.brand,
      listed_price_cents: input.product.listed_price_cents,
      category: input.product.category
    },
    price: {
      fair_price_cents: input.price.fair_price_cents,
      lowest_cents: input.price.lowest_cents,
      highest_cents: input.price.highest_cents,
      trend: input.price.trend,
      fake_sale: input.price.fake_sale,
      offer_count: input.price.offers.length
    },
    reddit: input.reddit.summary,
    alternatives: input.alternatives.map((a) => ({ name: a.name, price_cents: a.price_cents }))
  };

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: sys,
    messages: [{ role: "user", content: JSON.stringify(payload) }]
  });

  return parseJson(msg);
}

// ---------------------------------------------------------------------------
function parseJson<T>(msg: Anthropic.Messages.Message): T {
  const text = msg.content
    .filter((c): c is Anthropic.Messages.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("\n")
    .trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  const json = start >= 0 && end > start ? text.slice(start, end + 1) : text;
  return JSON.parse(json) as T;
}
