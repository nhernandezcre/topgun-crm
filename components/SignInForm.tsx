"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export function SignInForm({ nextParam }: { nextParam: Promise<{ next?: string }> }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [next, setNext] = useState("/");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    nextParam.then((p) => {
      if (p.next) setNext(p.next);
    });
  }, [nextParam]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const sb = supabaseBrowser();
    const origin = window.location.origin;
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` }
    });
    if (error) {
      setStatus("error");
      setError(error.message);
    } else setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="mt-10 rounded-2xl border border-verdict-buy/30 bg-verdict-buy/10 p-5 text-sm text-ink-100">
        Check your email. The link lands in seconds.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 flex flex-col gap-3">
      <input
        required
        type="email"
        value={email}
        inputMode="email"
        autoCapitalize="off"
        autoCorrect="off"
        placeholder="you@email.com"
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-2xl border border-ink-700 bg-ink-900 px-5 py-4 text-base text-ink-100 placeholder:text-ink-500 focus:border-verdict-buy focus:outline-none"
      />
      <button
        disabled={status === "sending"}
        className="rounded-2xl bg-verdict-buy px-6 py-4 font-display text-lg font-semibold text-ink-950 active:scale-[0.99] disabled:opacity-50"
      >
        {status === "sending" ? "sending…" : "Send the link"}
      </button>
      {error && <p className="text-sm text-verdict-skip">{error}</p>}
      <p className="mt-2 text-[11px] uppercase tracking-widest text-ink-500">
        no password, no spam. just you and a link.
      </p>
    </form>
  );
}
