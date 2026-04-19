"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, Link as LinkIcon, Image as ImageIcon, X, ArrowRight } from "lucide-react";
import { VerdictStream } from "./VerdictStream";
import type { StreamEvent } from "@/types";

type Mode = "photo" | "link" | "screenshot";

export function CaptureFlow() {
  const [mode, setMode] = useState<Mode>("photo");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);

  async function submit() {
    setError(null);
    setPaywall(false);
    setEvents([]);
    setRunning(true);
    try {
      const form = new FormData();
      form.set("kind", mode);
      if (mode === "link") {
        if (!url) throw new Error("Paste a link first.");
        form.set("url", url);
      } else {
        if (!file) throw new Error("Pick an image first.");
        form.set("image", file);
      }

      const ctl = new AbortController();
      abortRef.current = ctl;
      const res = await fetch("/api/verdict", {
        method: "POST",
        body: form,
        signal: ctl.signal
      });
      if (res.status === 402) {
        setPaywall(true);
        setRunning(false);
        return;
      }
      if (res.status === 401) {
        router.push(`/auth/signin?next=${encodeURIComponent("/capture")}`);
        return;
      }
      if (!res.body) throw new Error("No stream from server.");

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const p of parts) {
          const line = p.replace(/^data:\s*/, "").trim();
          if (!line) continue;
          try {
            const ev = JSON.parse(line) as StreamEvent;
            setEvents((xs) => [...xs, ev]);
            if (ev.kind === "started" && typeof window !== "undefined") {
              history.replaceState(null, "", `/verdict/${ev.verdict_id}`);
            }
            if (ev.kind === "verdict" && "vibrate" in navigator) {
              navigator.vibrate([14, 28, 14]);
            }
            if (ev.kind === "done") {
              setRunning(false);
            }
            if (ev.kind === "error") {
              setError(ev.message);
              setRunning(false);
            }
          } catch {
            // ignore partial
          }
        }
      }
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.");
      setRunning(false);
    }
  }

  if (events.length > 0 || running) {
    return (
      <VerdictStream
        events={events}
        loading={running}
        onReset={() => {
          abortRef.current?.abort();
          setEvents([]);
          setRunning(false);
          setError(null);
        }}
      />
    );
  }

  return (
    <main className="relative z-10 flex min-h-screen flex-col px-5 pb-10 safe-top safe-bottom">
      <header className="flex items-center justify-between pt-4">
        <Link href="/" className="rounded-full bg-ink-850 p-2.5 text-ink-100 active:scale-95">
          <X className="h-4 w-4" />
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-400">
          new verdict
        </span>
        <span className="w-9" />
      </header>

      <section className="mt-8">
        <h1 className="font-display text-4xl italic text-ink-100">Show us the thing.</h1>
        <p className="mt-2 max-w-xs text-sm text-ink-300">
          Whatever you've got. Scan the box, paste the link, drop the screenshot. One is enough.
        </p>
      </section>

      <div className="mt-8 rounded-full border border-ink-700/70 bg-ink-900 p-1">
        <div className="grid grid-cols-3 gap-1">
          {(["photo", "link", "screenshot"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex items-center justify-center gap-2 rounded-full py-2.5 text-xs font-medium uppercase tracking-widest transition
                ${mode === m ? "bg-ink-100 text-ink-950" : "text-ink-300 hover:text-ink-100"}`}
            >
              {m === "photo" && <Camera className="h-3.5 w-3.5" />}
              {m === "link" && <LinkIcon className="h-3.5 w-3.5" />}
              {m === "screenshot" && <ImageIcon className="h-3.5 w-3.5" />}
              {m}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-6">
        {mode === "photo" && (
          <FilePicker
            key="photo"
            accept="image/*"
            capture="environment"
            onFile={setFile}
            label="Open camera"
            hint="Point at the product. Logos and model numbers help."
          />
        )}
        {mode === "screenshot" && (
          <FilePicker
            key="ss"
            accept="image/*"
            onFile={setFile}
            label="Pick a screenshot"
            hint="From your photo library. We read price, title, reviews."
          />
        )}
        {mode === "link" && (
          <div className="mt-2">
            <input
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              inputMode="url"
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="https://"
              className="w-full rounded-2xl border border-ink-700 bg-ink-900 px-5 py-5 text-base text-ink-100 placeholder:text-ink-500 focus:border-verdict-buy focus:outline-none"
            />
            <p className="mt-2 px-1 text-xs text-ink-400">
              Amazon, Target, Best Buy, Walmart, Shopify stores, almost anywhere.
            </p>
          </div>
        )}
      </section>

      <div className="mt-auto pt-6">
        {error && (
          <p className="mb-3 text-center text-sm text-verdict-skip">{error}</p>
        )}
        {paywall && <PaywallInline />}
        <button
          onClick={submit}
          disabled={running || (mode === "link" ? !url : !file)}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-verdict-buy px-6 py-5 font-display text-lg font-semibold text-ink-950 transition disabled:cursor-not-allowed disabled:bg-ink-700 disabled:text-ink-400 active:scale-[0.99]"
        >
          Get the verdict <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </main>
  );
}

function FilePicker(props: {
  accept: string;
  capture?: "environment" | "user";
  onFile: (f: File) => void;
  label: string;
  hint: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <button
      type="button"
      onClick={() => ref.current?.click()}
      className="flex w-full flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-700 bg-ink-900 px-6 py-10 text-center"
    >
      {preview ? (
        <img
          src={preview}
          alt=""
          className="h-40 w-40 rounded-xl object-cover ring-1 ring-ink-700"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-ink-700 bg-ink-850 text-ink-200">
          <Camera className="h-6 w-6" />
        </div>
      )}
      <span className="font-display text-xl italic text-ink-100">{props.label}</span>
      <span className="max-w-xs text-xs text-ink-400">{props.hint}</span>
      {name && <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">{name}</span>}
      <input
        ref={ref}
        type="file"
        accept={props.accept}
        {...(props.capture ? { capture: props.capture } : {})}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setName(f.name);
          setPreview(URL.createObjectURL(f));
          props.onFile(f);
        }}
        className="hidden"
      />
    </button>
  );
}

function PaywallInline() {
  return (
    <div className="mb-4 rounded-2xl border border-verdict-wait/40 bg-verdict-wait/10 px-4 py-3 text-center text-sm text-ink-100">
      You've used your 3 free verdicts this month.{" "}
      <Link href="/paywall" className="font-semibold text-verdict-wait underline">
        Unlock unlimited →
      </Link>
    </div>
  );
}
