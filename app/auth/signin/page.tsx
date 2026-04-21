import { SignInForm } from "@/components/SignInForm";
import Link from "next/link";
import { X } from "lucide-react";

export const metadata = { title: "Sign in" };

export default function SignIn({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <main className="relative z-10 flex min-h-screen flex-col px-5 pb-10 safe-top safe-bottom">
      <header className="flex items-center justify-between pt-4">
        <Link href="/" className="rounded-full bg-ink-850 p-2.5 text-ink-100">
          <X className="h-4 w-4" />
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-400">
          sign in
        </span>
        <span className="w-9" />
      </header>

      <section className="mt-10 flex flex-1 flex-col">
        <h1 className="font-display text-4xl italic leading-tight text-ink-100">
          One tap,
          <br />
          no password.
        </h1>
        <p className="mt-3 max-w-sm text-sm text-ink-300">
          Drop your email. We send a link. You're in.
        </p>
        <SignInForm nextParam={searchParams} />
      </section>
    </main>
  );
}
