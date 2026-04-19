import { NextRequest, NextResponse } from "next/server";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "signin" }, { status: 401 });

  const admin = supabaseAdmin();
  await admin
    .from("verdicts")
    .update({ bought_anyway: true })
    .eq("id", id)
    .eq("user_id", data.user.id);
  return NextResponse.json({ ok: true });
}
