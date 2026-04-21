import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Protect authed routes + keep the Supabase session cookie fresh.
const PROTECTED = ["/capture", "/history", "/wishlist", "/settings", "/verdict", "/paywall"];

type CookieTriple = { name: string; value: string; options?: CookieOptions };

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return res;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (xs: CookieTriple[]) => {
          for (const { name, value, options } of xs) {
            res.cookies.set(name, value, options);
          }
        }
      }
    }
  );

  const { data } = await supabase.auth.getUser();

  if (!data.user && PROTECTED.some((p) => req.nextUrl.pathname.startsWith(p))) {
    const url = new URL("/auth/signin", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/|api/|favicon|icon|apple-touch|manifest|sw\\.js|og-).*)"]
};
