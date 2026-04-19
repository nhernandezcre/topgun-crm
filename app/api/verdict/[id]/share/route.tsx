import { ImageResponse } from "next/og";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

const COLORS = { BUY: "#00C853", SKIP: "#FF3B30", WAIT: "#FFB300" };

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = supabaseAdmin();
  const { data: v } = await admin
    .from("verdicts")
    .select("*")
    .eq("id", id)
    .single();

  if (!v) return new Response("not found", { status: 404 });

  const color = COLORS[(v.verdict as keyof typeof COLORS) ?? "WAIT"] ?? "#FFB300";
  const listed = cents(v.listed_price_cents);
  const fair = cents(v.fair_price_cents);
  const headline = (v.product_name ?? "this product").slice(0, 80);
  const reason = (v.reason ?? "").slice(0, 160);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0D0F12",
          color: "#DDE0E7",
          display: "flex",
          flexDirection: "column",
          padding: "72px",
          fontFamily: "Inter, system-ui, sans-serif"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 22, letterSpacing: 2, textTransform: "uppercase", color: "#8A92A3" }}>
          <span>Should I Buy This?</span>
          <span>verdict</span>
        </div>

        <div
          style={{
            marginTop: 60,
            fontSize: 260,
            lineHeight: 1,
            color,
            fontWeight: 900,
            letterSpacing: "-0.04em"
          }}
        >
          {v.verdict ?? "WAIT"}
        </div>

        <div style={{ marginTop: 34, fontSize: 36, color: "#F7F5F0", lineHeight: 1.15, maxWidth: 1000 }}>
          {headline}
        </div>

        <div style={{ marginTop: 22, fontSize: 26, color: "#B8BDC8", lineHeight: 1.3, maxWidth: 1000 }}>
          {reason}
        </div>

        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 28 }}>
          <div style={{ display: "flex", gap: 48 }}>
            <Stat label="listed" value={listed} />
            <Stat label="fair price" value={fair} />
            <Stat label="confidence" value={`${v.confidence ?? "—"}%`} />
          </div>
          <div style={{ color: "#5A6170", fontSize: 20 }}>shouldibuy.this</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 16, color: "#5A6170", letterSpacing: 2, textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{ fontSize: 40, color: "#F7F5F0", fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function cents(c?: number | null) {
  if (c == null) return "—";
  const v = c / 100;
  return v >= 100 ? `$${Math.round(v)}` : `$${v.toFixed(2)}`;
}
