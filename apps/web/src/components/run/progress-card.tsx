"use client";

import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import type { Run } from "./types";
import { personaLabel } from "./personas";

const STALE_QUEUE_MS = 3 * 60_000;

export function ProgressCard({ run }: { run: Run }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  const sessions = run.sessions ?? [];
  const results = new Map((run.results ?? []).map((r) => [r.sessionId, r]));
  const doneCount = sessions.filter((s) => results.has(s.id)).length;
  const stale = run.status === "queued" && now - new Date(run.createdAt).getTime() > STALE_QUEUE_MS;

  const stage =
    run.status === "queued" ? "Waiting for the audit worker…" : run.status === "profiling" ? "Profiling store…" : `Replaying ${sessions.length} AI buyers… ${doneCount}/${sessions.length} done`;
  const detail =
    run.status === "queued"
      ? "The audit starts as soon as a worker picks it up."
      : run.status === "profiling"
        ? "Reading platform, rendering, product schema, robots.txt and bot protection."
        : "Each buyer shops your store the way it does in real life. Payment is never submitted.";

  return (
    <div className="rounded-lg border border-line bg-surface p-4 sm:p-5" aria-live="polite">
      <div className="flex items-center gap-2.5">
        <span className="size-2 shrink-0 rounded-full bg-fail animate-[pulse-soft_1.2s_ease-in-out_infinite]" aria-hidden />
        <span className="text-[15px] font-semibold">{stage}</span>
      </div>
      <p className="mt-1 pl-[18px] text-sm text-muted">{detail}</p>

      <ol className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-4" aria-label="Audit stages">
        {(["queued", "profiling", "running", "done"] as const).map((s, i) => {
          const order = ["queued", "profiling", "running", "done"].indexOf(run.status);
          const state = i < order ? "done" : i === order ? "now" : "later";
          return (
            <li key={s} className="min-w-0">
              <span
                className={`block h-1 rounded-full ${state === "done" ? "bg-ink" : state === "now" ? "bg-fail animate-[pulse-soft_1.6s_ease-in-out_infinite]" : "bg-line"}`}
              />
              <span className={`mt-1.5 block truncate text-xs ${state === "later" ? "text-faint" : "text-ink-2"}`}>
                {["Queued", "Profile store", "Replay buyers", "Report"][i]}
              </span>
            </li>
          );
        })}
      </ol>

      {run.status === "running" && sessions.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {sessions.map((s) => {
            const r = results.get(s.id);
            const cls = !r ? "border-dashed border-line-strong text-faint" : r.status === "pass" ? "border-ok/30 bg-ok-soft text-ok" : "border-fail/30 bg-fail-soft text-fail";
            return (
              <li key={s.id} className={`inline-flex h-6 items-center rounded border px-2 text-xs font-medium ${cls}`}>
                {personaLabel(s.persona)}
                <span className="sr-only">{!r ? ": waiting" : r.status === "pass" ? ": got through" : ": blocked"}</span>
              </li>
            );
          })}
        </ul>
      )}

      {stale && (
        <div className="mt-4 flex gap-2.5 rounded-md border border-warn/30 bg-warn-soft p-3 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
          <p>
            <span className="font-medium text-warn">Taking longer than usual.</span>{" "}
            <span className="text-ink-2">The audit worker may be offline. This page updates by itself when it starts.</span>
          </p>
        </div>
      )}
    </div>
  );
}
