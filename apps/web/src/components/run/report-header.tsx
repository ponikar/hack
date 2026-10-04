"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, RotateCw, Share2 } from "lucide-react";
import type { Run } from "./types";
import type { AffectedBuyer, Issue, Severity } from "./issues";
import { canBuy, plainSummary, severityCounts } from "./issues";
import { hostOf, relativeTime } from "./format";
import { CopyButton, SEVERITY_BAR, SEVERITY_TEXT } from "./issue-bits";
import { rerun, shareRun, unshareRun } from "./api";

export function ReportHeader({
  run,
  issues,
  buyers,
  owner,
}: {
  run: Run;
  issues: Issue[];
  buyers: AffectedBuyer[];
  owner: boolean;
}) {
  const done = run.status === "done" && run.verdicts;
  const buyable = canBuy(run);
  const counts = severityCounts(issues);
  const steps = (run.results ?? []).reduce((n, r) => n + r.steps.length, 0);
  const blocked = new Set(issues.filter((i) => i.status !== "resolved").flatMap((i) => i.affected.map((a) => a.id)));

  return (
    <header>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <a
            href={run.storeUrl}
            target="_blank"
            rel="noreferrer"
            className="block truncate font-mono text-[13px] text-muted hover:text-ink"
          >
            {hostOf(run.storeUrl)}
          </a>
          {done ? (
            <>
              <h1 className="mt-1.5 flex items-start gap-2.5 text-2xl font-semibold leading-tight tracking-tight sm:text-[28px]">
                <span className={`mt-[0.32em] size-3 shrink-0 rounded-[3px] ${buyable ? "bg-ok" : "bg-fail"}`} aria-hidden />
                {buyable ? "AI buyers can buy from this store" : "AI buyers can’t buy from this store"}
              </h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-2">{plainSummary(run, issues)}</p>
            </>
          ) : (
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-[28px]">
              {run.status === "error" ? "The audit stopped before it finished" : "Audit in progress"}
            </h1>
          )}
        </div>
        {owner && (
          <div className="flex shrink-0 flex-wrap items-start gap-2">
            {done && <ShareButton run={run} />}
            <RecheckButton id={run.id} disabled={!done && run.status !== "error"} />
          </div>
        )}
      </div>

      {done && (
        <div className="mt-5 flex flex-col gap-3 border-y border-line py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {(["critical", "high", "medium"] as Severity[]).map((s) => (
              <span key={s} className={`inline-flex items-center gap-2 text-sm ${counts[s] ? "" : "text-faint"}`}>
                <span className={`h-3.5 w-1 rounded-full ${counts[s] ? SEVERITY_BAR[s] : "bg-line-strong"}`} aria-hidden />
                <span className="font-semibold tabular-nums">{counts[s]}</span>
                <span className={counts[s] ? "text-ink-2" : ""}>{SEVERITY_TEXT[s].toLowerCase()}</span>
              </span>
            ))}
            <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
            <span className="inline-flex items-center gap-2 text-sm text-ink-2">
              <span className="inline-flex items-center gap-[3px]" aria-hidden>
                {buyers.map((b) => (
                  <span
                    key={b.id}
                    title={b.label}
                    className={`size-2.5 rounded-[3px] ${blocked.has(b.id) ? "bg-fail" : "bg-ok"}`}
                  />
                ))}
              </span>
              <span>
                <span className="font-semibold text-ink">{blocked.size}</span> of {buyers.length} AI buyers blocked
              </span>
            </span>
          </div>
          <p className="text-xs text-muted">
            Checked {relativeTime(run.updatedAt ?? run.createdAt)} · {buyers.length} AI buyers · {steps} steps
          </p>
        </div>
      )}
    </header>
  );
}

function ShareButton({ run }: { run: Run }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(run.shareUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !url && !busy) {
      setBusy(true);
      setError(null);
      const r = await shareRun(run.id);
      setBusy(false);
      if (r.ok) setUrl(r.data.url);
      else setError(r.message);
    }
  }

  async function stop() {
    setBusy(true);
    setError(null);
    const r = await unshareRun(run.id);
    setBusy(false);
    if (r.ok) setUrl(null);
    else setError(r.message);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line-strong bg-bg px-3 text-sm font-medium hover:bg-surface"
      >
        <Share2 className="size-3.5" aria-hidden />
        {url ? "Shared" : "Share"}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Share this report"
          className="absolute left-0 top-full z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-line bg-surface p-4 shadow-card md:left-auto md:right-0"
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Link2 className="size-4" aria-hidden />
            Public link
          </div>
          {busy && !url && <span className="skeleton mt-3 block h-8 w-full" />}
          {url && (
            <>
              <div className="mt-3 flex items-center gap-2">
                <input
                  readOnly
                  value={url}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label="Share link"
                  className="h-8 min-w-0 flex-1 rounded-md border border-line bg-bg px-2 font-mono text-xs text-ink-2"
                />
                <CopyButton text={url} label="Copy link" />
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-muted">
                Anyone with the link can see this report and leave feedback. They can’t re-check the store or see your other audits.
              </p>
              <button
                type="button"
                onClick={stop}
                disabled={busy}
                className="mt-3 text-xs font-medium text-fail hover:underline disabled:opacity-50"
              >
                Stop sharing
              </button>
            </>
          )}
          {!url && !busy && !error && <p className="mt-3 text-xs text-muted">This report is private.</p>}
          {error && <p className="mt-3 text-sm text-fail">{error}</p>}
        </div>
      )}
    </div>
  );
}

function RecheckButton({ id, disabled }: { id: string; disabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    const r = await rerun(id);
    if (r.ok) {
      router.push(`/dashboard/${r.data.id}`);
      return;
    }
    setBusy(false);
    setError(r.message);
  }

  return (
    <div className="flex flex-col items-start gap-1.5 md:items-end">
      <button
        type="button"
        onClick={go}
        disabled={busy || disabled}
        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-ink px-3 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-40"
      >
        <RotateCw className={`size-3.5 ${busy ? "animate-spin" : ""}`} aria-hidden />
        {busy ? "Starting…" : "Re-check"}
      </button>
      {error && (
        <p role="alert" className="max-w-64 text-[13px] leading-snug text-fail md:text-right">
          {error}
        </p>
      )}
    </div>
  );
}
