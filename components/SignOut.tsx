"use client";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export function SignOut() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await supabaseBrowser().auth.signOut();
        router.push("/");
        router.refresh();
      }}
      className="w-full rounded-2xl border border-ink-700 bg-transparent px-6 py-4 text-sm uppercase tracking-widest text-ink-300 hover:text-ink-100"
    >
      sign out
    </button>
  );
}
