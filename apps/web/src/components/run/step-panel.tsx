"use client";

import { useEffect, useState } from "react";
import { X, ImageOff, ExternalLink } from "lucide-react";
import type { SessionResult, StepResult } from "./types";
import { personaLabel } from "./personas";
import { blockerLabel, ms, shortStep } from "./format";
import { StepChip } from "./step-chip";

function Screenshot({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed) {
    return (
      <div className="grid aspect-[4/3] w-full place-items-center rounded-md border border-dashed border-line-strong bg-surface text-muted">
        <div className="flex flex-col items-center gap-2 text-xs">
          <ImageOff className="size-5" aria-hidden />
          {src ? "Screenshot not available" : "No screenshot for this step"}
        </div>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="w-full rounded-md border border-line bg-surface"
      loading="lazy"
    />
  );
}

export function StepPanel({
  result,
  step,
  onClose,
}: {
  result: SessionResult;
  step: StepResult;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const title = shortStep(step.op, step.label, step.index);
  const detail = step.status === "blocked" ? blockerLabel(step.blocker) : undefined;

  return (
    <>
      <button
        type="button"
        aria-label="Close details"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px] lg:hidden"
      />
      <aside
        role="dialog"
        aria-label={`${personaLabel(result.persona)} – ${title}`}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-xl border border-line bg-bg shadow-2xl lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[400px] lg:max-h-none lg:rounded-none lg:border-y-0 lg:border-r-0 lg:shadow-none"
      >
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-line bg-bg px-4 py-3">
          <div className="min-w-0">
            <div className="text-xs text-muted">{personaLabel(result.persona)}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StepChip label={title} status={step.status} detail={detail} />
              <span className="text-xs text-muted">step {step.index + 1} of {result.steps.length}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-md text-muted hover:bg-surface hover:text-ink"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <Screenshot src={step.screenshot} alt={`Screenshot after "${step.label}"`} />

          <div>
            <div className="text-xs font-medium text-muted">Instruction</div>
            <p className="mt-1 text-sm leading-relaxed">{step.label}</p>
          </div>

          {step.reason && (
            <div className={`rounded-md border p-3 ${step.status === "ok" || step.status === "stopped" ? "border-line bg-surface" : "border-fail/30 bg-fail-soft"}`}>
              <div className={`text-xs font-medium ${step.status === "ok" || step.status === "stopped" ? "text-muted" : "text-fail"}`}>
                {step.status === "ok" ? "Note" : step.status === "stopped" ? "Stopped on purpose" : "Why it died here"}
              </div>
              <p className="mt-1 text-sm leading-relaxed">{step.reason}</p>
            </div>
          )}

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted">Took</dt>
            <dd>{ms(step.ms)}</dd>
            {step.url && (
              <>
                <dt className="text-muted">Page</dt>
                <dd className="min-w-0">
                  <a
                    href={step.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex max-w-full items-center gap-1 font-mono text-[13px] text-accent hover:underline"
                  >
                    <span className="truncate">{step.url}</span>
                    <ExternalLink className="size-3 shrink-0" aria-hidden />
                  </a>
                </dd>
              </>
            )}
            <dt className="text-muted">Session</dt>
            <dd className="font-mono text-[13px] text-ink-2">{result.sessionId}</dd>
          </dl>
        </div>
      </aside>
    </>
  );
}
