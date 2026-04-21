import { NextRequest, NextResponse } from "next/server";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sub = await req.json();
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "signin" }, { status: 401 });

  const admin = supabaseAdmin();
  await admin.from("push_subs").upsert(
    {
      user_id: data.user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys?.p256dh,
      auth: sub.keys?.auth
    },
    { onConflict: "endpoint" }
  );
  return NextResponse.json({ ok: true });
}
