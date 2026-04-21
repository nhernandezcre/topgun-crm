import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type CookieTriple = { name: string; value: string; options?: CookieOptions };

export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (xs: CookieTriple[]) => {
          try {
            for (const { name, value, options } of xs) store.set(name, value, options);
          } catch {
            // called from a Server Component — next will refresh on the next action
          }
        }
      }
    }
  );
}

export function supabaseAdmin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
