import { Flame } from "lucide-react";

export function StreakPill({ days }: { days: number }) {
  if (!days) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-ink-700 bg-ink-850 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-ink-200">
      <Flame className="h-3 w-3 text-verdict-wait" strokeWidth={2.5} />
      {days}d
    </span>
  );
}
