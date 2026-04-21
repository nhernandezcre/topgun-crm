import { NextRequest, NextResponse } from "next/server";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { verdict_id, target_price_cents } = (await req.json()) as {
    verdict_id: string;
    target_price_cents: number;
  };
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "signin" }, { status: 401 });

  const admin = supabaseAdmin();
  const { data: row, error } = await admin
    .from("wishlist")
    .insert({
      user_id: data.user.id,
      verdict_id,
      target_price_cents,
      last_seen_price_cents: target_price_cents
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: row.id });
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id" }, { status: 400 });

  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "signin" }, { status: 401 });

  const admin = supabaseAdmin();
  await admin.from("wishlist").delete().eq("id", id).eq("user_id", data.user.id);
  return NextResponse.json({ ok: true });
}
