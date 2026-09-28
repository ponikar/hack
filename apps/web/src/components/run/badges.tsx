import type { Overall, RunStatus, StoreMode, Verdict } from "./types";

const OVERALL: Record<Overall, { text: string; cls: string }> = {
  invisible: { text: "Invisible", cls: "bg-fail-soft text-fail border-fail/30" },
  seen: { text: "Seen", cls: "bg-warn-soft text-warn border-warn/30" },
  listed: { text: "Listed", cls: "bg-warn-soft text-warn border-warn/30" },
  buyable: { text: "Buyable", cls: "bg-ok-soft text-ok border-ok/30" },
};

export function OverallPill({ overall }: { overall: Overall }) {
  const o = OVERALL[overall];
  return (
    <span className={`inline-flex h-6 items-center rounded-full border px-2.5 text-xs font-semibold ${o.cls}`}>{o.text}</span>
  );
}

const STATUS: Record<RunStatus, { text: string; cls: string; live?: boolean }> = {
  queued: { text: "Queued", cls: "text-muted border-line" },
  profiling: { text: "Profiling", cls: "text-accent border-accent/40", live: true },
  running: { text: "Replaying", cls: "text-accent border-accent/40", live: true },
  done: { text: "Done", cls: "text-ink-2 border-line" },
  error: { text: "Error", cls: "text-fail border-fail/40" },
};

export function StatusPill({ status }: { status: RunStatus }) {
  const s = STATUS[status] ?? STATUS.queued;
  return (
    <span className={`inline-flex h-6 items-center gap-1.5 rounded-full border bg-bg px-2.5 text-xs font-medium ${s.cls}`}>
      {s.live && <span className="size-1.5 rounded-full bg-accent animate-[pulse-soft_1.2s_ease-in-out_infinite]" aria-hidden />}
      {s.text}
    </span>
  );
}

export function ModeBadge({ mode }: { mode: StoreMode | null | undefined }) {
  const text = mode === "broken" ? "Demo · broken" : mode === "fixed" ? "Demo · fixed" : "Live store";
  return (
    <span className="inline-flex h-6 items-center rounded-md border border-line bg-surface px-2 text-xs font-medium text-ink-2">
      {text}
    </span>
  );
}

const VERDICT: Record<Verdict, { text: string; cls: string }> = {
  pass: { text: "Pass", cls: "text-ok" },
  fail: { text: "Fail", cls: "text-fail" },
  skipped: { text: "Skipped", cls: "text-skip" },
};

export function VerdictWord({ verdict }: { verdict: Verdict }) {
  const v = VERDICT[verdict];
  return <span className={`font-semibold ${v.cls}`}>{v.text}</span>;
}
