let tokenCache: { token: string; exp: number } | null = null;

async function authToken(): Promise<string | null> {
  if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) return null;
  if (tokenCache && tokenCache.exp > Date.now() + 60_000) return tokenCache.token;

  const auth = Buffer.from(
    `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": process.env.REDDIT_USER_AGENT ?? "web:should-i-buy-this:v1.0"
    },
    body: "grant_type=client_credentials"
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    token: data.access_token,
    exp: Date.now() + data.expires_in * 1000
  };
  return data.access_token;
}

/**
 * Search Reddit for discussion of a product, return up to 10 short comments from
 * top threads. Falls back to the unauthed public JSON API when credentials are
 * missing — the public endpoint is aggressive about rate limits so we degrade
 * gracefully with an empty list.
 */
export async function redditDiscussion(query: string): Promise<
  { body: string; url: string; subreddit: string; title: string }[]
> {
  const q = `${query} (worth it OR review OR vs OR regret)`;
  const token = await authToken();

  const base = token ? "https://oauth.reddit.com" : "https://www.reddit.com";
  const headers: Record<string, string> = {
    "User-Agent": process.env.REDDIT_USER_AGENT ?? "web:should-i-buy-this:v1.0"
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const searchUrl = `${base}/search.json?q=${encodeURIComponent(q)}&sort=top&t=year&limit=6&type=link`;
  const searchRes = await fetch(searchUrl, { headers, cache: "no-store" });
  if (!searchRes.ok) return [];
  const search = (await searchRes.json()) as Listing<RedditPost>;

  const threads = (search.data?.children ?? [])
    .map((c) => c.data)
    .filter((d) => d.num_comments > 3)
    .slice(0, 4);

  const results: { body: string; url: string; subreddit: string; title: string }[] = [];

  for (const t of threads) {
    const commentsUrl = `${base}/comments/${t.id}.json?sort=top&limit=5`;
    const cr = await fetch(commentsUrl, { headers, cache: "no-store" });
    if (!cr.ok) continue;
    const parts = (await cr.json()) as [Listing<RedditPost>, Listing<RedditComment>];
    const comments = parts[1]?.data?.children ?? [];
    for (const c of comments.slice(0, 3)) {
      const body = c.data.body;
      if (!body || body.length < 40) continue;
      results.push({
        body,
        url: `https://reddit.com${t.permalink}`,
        subreddit: t.subreddit,
        title: t.title
      });
      if (results.length >= 10) return results;
    }
  }
  return results;
}

type Listing<T> = { data?: { children?: { data: T }[] } };
type RedditPost = {
  id: string;
  title: string;
  permalink: string;
  subreddit: string;
  num_comments: number;
};
type RedditComment = { body: string };
