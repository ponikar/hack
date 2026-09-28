"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Ban, Check, Hand, Minus, X } from "lucide-react";
import { Fragment } from "react";
import { EASE } from "./motion";
import type { MockBuyer, MockChip, MockFix, StepState } from "./mock";

const CHIP: Record<StepState, string> = {
  pending: "border-dashed border-line-strong text-faint",
  running: "border-ink/30 bg-accent-soft text-ink",
  ok: "border-ok/30 bg-ok-soft text-ok",
  blocked: "border-fail/40 bg-fail-soft text-fail",
  skipped: "border-line bg-skip-soft text-skip",
  stopped: "border-warn/40 bg-warn-soft text-warn",
};

function ChipIcon({ s }: { s: StepState }) {
  const c = "size-3.5 shrink-0";
  if (s === "ok") return <Check className={c} strokeWidth={2.75} aria-hidden />;
  if (s === "blocked") return <Ban className={c} strokeWidth={2.25} aria-hidden />;
  if (s === "stopped") return <Hand className={c} strokeWidth={2.25} aria-hidden />;
  if (s === "skipped") return <Minus className={c} strokeWidth={2.5} aria-hidden />;
  if (s === "running") return <span className={`${c} rounded-full bg-ink animate-[pulse-soft_0.9s_ease-in-out_infinite]`} aria-hidden />;
  return <span className={`${c} rounded-full border border-current opacity-50`} aria-hidden />;
}

export function StepChip({ label, state, detail }: { label: string; state: StepState; detail?: string }) {
  const reduce = useReducedMotion();
  const shake = state === "blocked" && !reduce ? { x: [0, -5, 5, -4, 4, -2, 0] } : {};
  const pop = state === "ok" && !reduce ? { scale: [0.92, 1.04, 1] } : {};
  return (
    <motion.span
      key={state}
      animate={{ ...shake, ...pop }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2 text-[12.5px] font-medium leading-none whitespace-nowrap transition-colors duration-200 ${CHIP[state]} ${
        state === "blocked" ? "ring-2 ring-fail/30 ring-offset-1 ring-offset-surface" : ""
      }`}
    >
      <ChipIcon s={state} />
      {label}
      {detail && <span className={`font-normal opacity-80 ${state === "blocked" ? "" : "invisible"}`}>{detail}</span>}
    </motion.span>
  );
}

export function Connector({ tone }: { tone: "line" | "fail" | "faint" }) {
  return <span className={`h-px w-2.5 shrink-0 ${tone === "fail" ? "bg-fail/50" : tone === "faint" ? "bg-line" : "bg-line-strong"}`} aria-hidden />;
}

export function Monogram({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const s = size === "sm" ? "size-6 text-[10px]" : "size-9 text-xs";
  return (
    <span className={`grid ${s} shrink-0 place-items-center rounded-md bg-ink font-semibold tracking-tight text-bg`} aria-hidden>
      {initials}
    </span>
  );
}

export function stateAt(step: MockBuyer["steps"][number], revealed: number, index: number, failedIndex: number): StepState {
  if (failedIndex >= 0 && index > failedIndex && revealed > failedIndex) return "skipped";
  if (revealed > index) return step.end ?? "ok";
  if (revealed === index) return "running";
  return "pending";
}

export function BuyerRow({ buyer, revealed, compact, shown = true }: { buyer: MockBuyer; revealed: number; compact?: boolean; shown?: boolean }) {
  const failedIndex = buyer.steps.findIndex((s) => s.end === "blocked");
  const done = revealed >= buyer.steps.length || (failedIndex >= 0 && revealed > failedIndex);
  const failed = failedIndex >= 0 && revealed > failedIndex;
  return (
    <motion.div
      animate={{ opacity: shown ? 1 : 0, y: shown ? 0 : 6 }}
      transition={{ duration: 0.35, ease: EASE }}
      className={`grid gap-1.5 ${compact ? "py-2.5" : "py-3"} md:gap-4 ${compact ? "md:grid-cols-[150px_1fr]" : "md:grid-cols-[168px_1fr]"}`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Monogram name={buyer.name} />
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold leading-tight">{buyer.name}</div>
          <div className="truncate text-[11px] text-muted">
            {buyer.archetype} <span className="font-mono">{buyer.template}</span>
          </div>
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-y-1.5">
          {buyer.steps.map((s, i) => {
            const st = stateAt(s, revealed, i, failedIndex);
            return (
              <Fragment key={i}>
                {i > 0 && <Connector tone={failed && i > failedIndex ? "fail" : st === "pending" ? "faint" : "line"} />}
                <StepChip label={s.label} state={st} detail={s.detail} />
              </Fragment>
            );
          })}
        </div>
        <motion.p
          animate={{ opacity: done ? 1 : 0, y: done ? 0 : 4 }}
          transition={{ duration: 0.3, ease: EASE }}
          className={`mt-1 h-[17px] truncate text-[12px] leading-snug ${failed ? "text-fail" : "text-muted"}`}
          aria-hidden={!done}
        >
          {buyer.note}
        </motion.p>
      </div>
    </motion.div>
  );
}

const CHIP_TONE: Record<MockChip["tone"], string> = {
  neutral: "border-line bg-surface-2/60 text-ink-2",
  ok: "border-ok/25 bg-ok-soft text-ok",
  warn: "border-warn/30 bg-warn-soft text-warn",
};

export function ProfileChip({ chip, shown = true }: { chip: MockChip; shown?: boolean }) {
  return (
    <motion.span
      initial={false}
      animate={shown ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.85, y: 4 }}
      transition={{ duration: 0.3, ease: EASE }}
      aria-hidden={!shown}
      className={`inline-flex h-6 items-center rounded-md border px-2 text-[11.5px] font-medium ${CHIP_TONE[chip.tone]}`}
    >
      {chip.label}
    </motion.span>
  );
}

export type Overall = "invisible" | "seen" | "listed" | "buyable";

const OVERALL: Record<Overall, string> = {
  invisible: "bg-fail-soft text-fail border-fail/30",
  seen: "bg-warn-soft text-warn border-warn/30",
  listed: "bg-warn-soft text-warn border-warn/30",
  buyable: "bg-ok-soft text-ok border-ok/30",
};

export function OverallPill({ overall }: { overall: Overall }) {
  return (
    <span className="relative inline-grid h-6 overflow-hidden rounded-full">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={overall}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11.5px] font-semibold capitalize ${OVERALL[overall]}`}
        >
          {overall}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function VerdictTile({ name, verdict, note, shown }: { name: string; verdict: "pass" | "fail" | null; note: string; shown: boolean }) {
  return (
    <div className="flex items-center gap-2.5 bg-surface px-3 py-2.5">
      <span className="relative grid size-6 shrink-0 place-items-center">
        <AnimatePresence initial={false} mode="wait">
          {shown && verdict ? (
            <motion.span
              key={verdict}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 26 }}
              className={`grid size-6 place-items-center rounded-full ${verdict === "pass" ? "bg-ok text-bg" : "bg-fail text-bg"}`}
            >
              {verdict === "pass" ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : <X className="size-3.5" strokeWidth={3} aria-hidden />}
            </motion.span>
          ) : (
            <motion.span key="empty" exit={{ opacity: 0 }} className="size-6 rounded-full border border-dashed border-line-strong" />
          )}
        </AnimatePresence>
      </span>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold leading-tight">
          {name}{" "}
          <span className={`font-normal ${!shown || !verdict ? "text-faint" : verdict === "pass" ? "text-ok" : "text-fail"}`}>
            {!shown || !verdict ? "…" : verdict === "pass" ? "Pass" : "Fail"}
          </span>
        </div>
        <div className="truncate text-[11px] text-muted">{note}</div>
      </div>
    </div>
  );
}

export function FixCard({ fix, index = 0, shown = true }: { fix: MockFix; index?: number; shown?: boolean }) {
  return (
    <motion.li
      initial={false}
      animate={shown ? { opacity: 1, x: 0 } : { opacity: 0, x: 24 }}
      exit={{ opacity: 0, x: -12, height: 0, paddingTop: 0, paddingBottom: 0, overflow: "hidden" }}
      transition={{ duration: 0.4, ease: EASE, delay: shown ? index * 0.06 : 0 }}
      aria-hidden={!shown}
      className="grid gap-1.5 border-l-2 border-fail bg-fail-soft/40 px-3.5 py-3 md:grid-cols-[1fr_auto] md:gap-6"
    >
      <div className="min-w-0">
        <div className="text-[13px] font-semibold">{fix.title}</div>
        <p className="mt-0.5 text-[12px] leading-snug text-ink-2">{fix.detail}</p>
      </div>
      <div className="flex flex-wrap gap-1 md:justify-end">
        {fix.who.map((w) => (
          <span key={w} className="inline-flex h-5 items-center rounded bg-surface px-1.5 text-[10.5px] font-medium text-ink-2">
            {w}
          </span>
        ))}
      </div>
    </motion.li>
  );
}
