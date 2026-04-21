// Scheduled function — Netlify calls this every 6h per netlify.toml.
// It simply pings our existing Next.js route handler with the CRON_SECRET,
// so all cron logic lives in one place.

import type { Handler } from "@netlify/functions";

export const handler: Handler = async () => {
  const base = process.env.URL ?? process.env.DEPLOY_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!base) return { statusCode: 500, body: "missing site URL env" };

  const res = await fetch(`${base}/api/cron/price-check`, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET ?? ""}` }
  });

  return { statusCode: res.status, body: await res.text() };
};
