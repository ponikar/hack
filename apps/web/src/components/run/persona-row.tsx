"use client";

import { Fragment } from "react";
import type { Session, SessionResult, StepResult } from "./types";
import { ARCHETYPE_LABEL, personaLabel } from "./personas";
import { blockerLabel, shortStep } from "./format";
import { StepChip, StepConnector, type ChipStatus } from "./step-chip";

export type StepRef = { sessionId: string; index: number };

function plannedLabel(s: Session["steps"][number]): { op: string; label: string } {
  switch (s.op) {
    case "goto":
      return { op: "goto", label: s.url };
    case "fetch":
      return { op: "fetch", label: s.url };
    case "dismiss":
      return { op: "dismiss", label: s.what };
    case "act":
      return { op: "act", label: s.instr };
    case "stop":
      return { op: "stop", label: s.reason };
  }
}

function chipStatus(step: StepResult): ChipStatus {
  return step.status;
}

function passText(r: SessionResult): string {
  if (r.archetype === "feed-reader") return "Read the product without JavaScript.";
  const last = r.steps.at(-1);
  if (last?.op === "stop" || last?.status === "stopped") return "Reached the payment gate. Stopped on purpose; nothing was bought.";
  return "Completed the whole journey.";
}

export function PersonaRow({
  session,
  result,
  live,
  selected,
  onSelect,
}: {
  session: Session;
  result?: SessionResult;
  live: boolean;
  selected?: StepRef | null;
  onSelect: (ref: StepRef) => void;
}) {
  const label = personaLabel(session.persona);
  const done = Boolean(result);
  const firstFail = result?.steps.find((s) => s.status === "failed" || s.status === "blocked");
  const resultSteps = result?.steps ?? [];
  const planned = session.steps.map(plannedLabel);
  const total = Math.max(planned.length, resultSteps.length);

  const outcome = !result
    ? live
      ? "running"
      : "waiting"
    : result.status === "pass"
      ? "pass"
      : result.status === "blocked"
        ? "blocked"
        : "fail";

  return (
    <div className="grid gap-2 py-3 md:grid-cols-[220px_1fr] md:gap-4 md:py-3.5">
      <div className="flex min-w-0 items-center gap-2 md:block">
        <div className="truncate text-sm font-semibold">{label}</div>
        <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted md:mt-0.5">
          <span>{ARCHETYPE_LABEL[session.archetype]}</span>
          <span aria-hidden>·</span>
          <span className="font-mono">{session.template}</span>
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-0 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
          {Array.from({ length: total }).map((_, i) => {
            const r = resultSteps[i];
            const p = planned[i];
            const isFirstFail = Boolean(r && firstFail && r.index === firstFail.index);
            const prev = resultSteps[i - 1];
            const conn = i === 0 ? null : <StepConnector tone={prev && prev.status !== "ok" ? "fail" : "line"} />;
            if (r) {
              const st = chipStatus(r);
              const detail =
                st === "blocked" ? blockerLabel(r.blocker) : st === "stopped" ? (r.op === "stop" ? undefined : "stopped") : undefined;
              return (
                <Fragment key={i}>
                  {conn}
                  <StepChip
                    label={shortStep(r.op, r.label, i)}
                    status={st}
                    detail={detail}
                    highlight={isFirstFail}
                    selected={selected?.sessionId === session.id && selected.index === r.index}
                    onClick={() => onSelect({ sessionId: session.id, index: r.index })}
                  />
                </Fragment>
              );
            }
            const afterFail = Boolean(firstFail) || (done && !r);
            const status: ChipStatus = afterFail ? "skipped" : live && i === resultSteps.length ? "running" : "pending";
            return (
              <Fragment key={i}>
                {conn}
                <StepChip label={p ? shortStep(p.op, p.label, i) : `Step ${i + 1}`} status={status} />
              </Fragment>
            );
          })}
        </div>
        <p className="mt-1 text-[13px] leading-snug text-muted">
          {outcome === "running" && <span className="text-accent">Replaying…</span>}
          {outcome === "waiting" && <span className="text-faint">Not started</span>}
          {result && outcome === "pass" && <span className="text-ok">{passText(result)}</span>}
          {result && outcome !== "pass" && (firstFail?.reason ?? result.summary.replace(/^[^:]+:\s*/, ""))}
        </p>
      </div>
    </div>
  );
}

export function PersonaRowSkeleton({ label }: { label?: string }) {
  return (
    <div className="grid gap-2 py-3 md:grid-cols-[220px_1fr] md:gap-4 md:py-3.5">
      <div>
        {label ? <div className="text-sm font-semibold text-muted">{label}</div> : <span className="skeleton block h-4 w-32" />}
        <span className="skeleton mt-1.5 block h-3 w-24" />
      </div>
      <div className="flex items-center gap-3 overflow-hidden">
        {[80, 96, 88, 104].map((w, i) => (
          <span key={i} className="skeleton h-7" style={{ width: w }} />
        ))}
      </div>
    </div>
  );
}
