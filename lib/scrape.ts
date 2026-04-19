import * as cheerio from "cheerio";

/**
 * Fetch a product URL and return a compact text payload suitable for Claude.
 * Strategy: plain fetch first with a desktop UA. If the page looks JS-gated
 * (empty <body> text or an anti-bot block), fall back to a headless browser.
 */
export async function scrapeProduct(url: string): Promise<{ text: string; html: string; final_url: string }> {
  const first = await tryFetch(url);
  if (first && looksReal(first.text)) return first;

  const rendered = await tryHeadless(url);
  if (rendered) return rendered;

  return first ?? { text: "", html: "", final_url: url };
}

async function tryFetch(url: string) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });
    if (!res.ok) return null;
    const html = await res.text();
    return { html, text: htmlToText(html), final_url: res.url || url };
  } catch {
    return null;
  }
}

async function tryHeadless(url: string): Promise<{ text: string; html: string; final_url: string } | null> {
  try {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = await import("puppeteer-core");
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });
    try {
      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
      );
      await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });
      const html = await page.content();
      const final_url = page.url();
      return { html, text: htmlToText(html), final_url };
    } finally {
      await browser.close();
    }
  } catch {
    return null;
  }
}

function looksReal(text: string) {
  return text.length > 400 && !/enable javascript/i.test(text) && !/robot check/i.test(text);
}

function htmlToText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, noscript, nav, footer, header, svg, iframe").remove();

  const title = $("title").first().text().trim();
  const h1 = $("h1").first().text().trim();

  // OpenGraph + JSON-LD: these carry the cleanest structured product data
  const og: Record<string, string> = {};
  $("meta[property^='og:'], meta[name^='twitter:']").each((_, el) => {
    const k = $(el).attr("property") || $(el).attr("name");
    const v = $(el).attr("content");
    if (k && v) og[k] = v;
  });

  const ldjson: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).html();
    if (raw) ldjson.push(raw.slice(0, 2000));
  });

  // visible text, squeezed
  const body = $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);

  return [
    title && `TITLE: ${title}`,
    h1 && `H1: ${h1}`,
    Object.keys(og).length && `OG: ${JSON.stringify(og)}`,
    ldjson.length && `LDJSON: ${ldjson.join("\n")}`,
    body && `BODY: ${body}`
  ]
    .filter(Boolean)
    .join("\n\n");
}
