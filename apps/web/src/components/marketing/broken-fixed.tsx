"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { BuyerRow, FixCard, OverallPill, VerdictTile } from "./audit-rows";
import { EASE } from "./motion";
import { TOGGLE_BROKEN_BUYERS, TOGGLE_BROKEN_FIXES, TOGGLE_BROKEN_VERDICT, TOGGLE_FIXED_BUYERS, TOGGLE_FIXED_VERDICT } from "./mock";

type Mode = "broken" | "fixed";
const STEP_MS = 200;
const MAX_STEPS = 7;

export function BrokenFixed() {
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<Mode>("broken");
  const [revealed, setRevealed] = useState(reduce ? MAX_STEPS + 1 : 0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (reduce) {
      setRevealed(MAX_STEPS + 1);
      return;
    }
    setRevealed(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setRevealed(i);
      if (i > MAX_STEPS) clearInterval(id);
    }, STEP_MS);
    return () => clearInterval(id);
  }, [mode, run, reduce]);

  const buyers = mode === "broken" ? TOGGLE_BROKEN_BUYERS : TOGGLE_FIXED_BUYERS;
  const verdict = mode === "broken" ? TOGGLE_BROKEN_VERDICT : TOGGLE_FIXED_VERDICT;
  const finished = revealed > MAX_STEPS;
  const fixes = mode === "broken" ? TOGGLE_BROKEN_FIXES : [];

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
        <Segmented value={mode} onChange={(m) => (m === mode ? setRun((r) => r + 1) : setMode(m))} />
        <span className="font-mono text-[12.5px] text-muted">/store?mode={mode}</span>
        <span className="ml-auto flex items-center gap-1.5 text-[12px] text-muted">
          Overall
          <OverallPill overall={finished ? verdict.overall : mode === "broken" ? "invisible" : "buyable"} />
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
          <VerdictTile name="Seen" verdict={verdict.seen} note="Readable without JavaScript" shown={finished} />
          <VerdictTile name="Listed" verdict={verdict.listed} note="Schema, feed, robots.txt" shown={finished} />
          <VerdictTile name="Buyable" verdict={verdict.buyable} note="Agents reach the payment step" shown={finished} />
        </div>

        <LayoutGroup>
          <div className="mt-4 divide-y divide-line border-y border-line">
            {buyers.map((b) => (
              <motion.div key={b.id} layout transition={{ duration: 0.35, ease: EASE }}>
                <BuyerRow buyer={b} revealed={revealed} compact />
              </motion.div>
            ))}
          </div>

          <motion.div layout className="mt-4">
            <div className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold">
              What to fix
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={fixes.length}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="font-normal text-muted"
                >
                  {fixes.length === 0 ? "" : `${fixes.length} fixes`}
                </motion.span>
              </AnimatePresence>
            </div>
            <motion.ul layout className="overflow-hidden rounded-lg border border-line">
              <AnimatePresence initial={false} mode="popLayout">
                {finished && fixes.map((f, i) => <FixCard key={f.title} fix={f} index={i} />)}
                {finished && fixes.length === 0 && (
                  <motion.li
                    key="nothing"
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: EASE, delay: 0.15 }}
                    className="flex items-center gap-2.5 px-3.5 py-4 text-[13px] text-ok"
                  >
                    <span className="grid size-6 place-items-center rounded-full bg-ok text-bg">
                      <Check className="size-3.5" strokeWidth={3} aria-hidden />
                    </span>
                    Nothing to fix. Every buyer reached the payment step.
                  </motion.li>
                )}
                {!finished && (
                  <motion.li key="wait" exit={{ opacity: 0 }} className="px-3.5 py-4 text-[13px] text-faint">
                    Replaying…
                  </motion.li>
                )}
              </AnimatePresence>
            </motion.ul>
          </motion.div>
        </LayoutGroup>
      </div>
    </div>
  );
}

function Segmented({ value, onChange }: { value: Mode; onChange: (m: Mode) => void }) {
  const opts: { v: Mode; label: string }[] = [
    { v: "broken", label: "Broken store" },
    { v: "fixed", label: "Fixed store" },
  ];
  return (
    <div role="tablist" aria-label="Store state" className="relative inline-flex rounded-lg border border-line bg-bg p-0.5">
      {opts.map((o) => (
        <button
          key={o.v}
          role="tab"
          aria-selected={value === o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={`relative z-10 h-8 rounded-md px-3.5 text-[13px] font-medium transition-colors ${value === o.v ? "text-bg" : "text-ink-2 hover:text-ink"}`}
        >
          {value === o.v && (
            <motion.span
              layoutId="segment"
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
              className={`absolute inset-0 -z-10 rounded-md ${o.v === "broken" ? "bg-fail" : "bg-ok"}`}
            />
          )}
          {o.label}
        </button>
      ))}
    </div>
  );
}
