/**
 * Affiliate link wrapper.
 *
 * Amazon: append ?tag=AMAZON_ASSOCIATE_TAG to any amazon.com URL.
 * Other domains: pass through Skimlinks if SKIMLINKS_PUBLISHER_ID is set.
 *
 * To activate Amazon Associates:
 *   1. Apply at https://affiliate-program.amazon.com/
 *   2. After approval, set AMAZON_ASSOCIATE_TAG in env (e.g. "yourtag-20").
 *   3. Include FTC disclosure text — already shipped in the verdict card footer.
 *
 * To activate Skimlinks:
 *   1. Get publisher id at https://skimlinks.com/
 *   2. Set SKIMLINKS_PUBLISHER_ID in env.
 *   3. Any non-Amazon outbound URL is wrapped automatically.
 */
export function affiliateWrap(raw: string): string {
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");
    if (host.endsWith("amazon.com") || host.endsWith("amzn.to")) {
      const tag = process.env.AMAZON_ASSOCIATE_TAG;
      if (tag) u.searchParams.set("tag", tag);
      return u.toString();
    }
    const pub = process.env.SKIMLINKS_PUBLISHER_ID;
    if (pub) {
      return `https://go.skimresources.com/?id=${encodeURIComponent(pub)}&url=${encodeURIComponent(u.toString())}`;
    }
    return u.toString();
  } catch {
    return raw;
  }
}
