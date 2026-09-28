"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BROKEN_BUYERS, BROKEN_FIXES, BROKEN_VERDICT, DEMO_URL, PROFILE_CHIPS } from "./mock";
import { BuyerRow, FixCard, OverallPill, ProfileChip, VerdictTile } from "./audit-rows";
import { EASE } from "./motion";

const T = {
  typeStart: 400,
  typeMs: 55,
  submit: 1750,
  chips: 2150,
  chipGap: 190,
  replay: 3700,
  rowGap: 130,
  stepLead: 380,
  stepMs: 210,
  verdict: 6300,
  fix: 6900,
  hold: 12000,
  loop: 12600,
} as const;

const ROW_START = BROKEN_BUYERS.map((_, i) => T.replay + 250 + i * T.rowGap);

function revealedAt(t: number, i: number) {
  const start = ROW_START[i] + T.stepLead;
  if (t < start) return 0;
  return Math.floor((t - start) / T.stepMs) + 1;
}

type Phase = "idle" | "profiling" | "replaying" | "done";

function phaseAt(t: number): Phase {
  if (t < T.submit) return "idle";
  if (t < T.replay) return "profiling";
  if (t < T.verdict) return "replaying";
  return "done";
}

export const LIVE_AUDIT_RESTART = "watchdog:restart-demo";

export function LiveAudit() {
  const reduce = useReducedMotion();
  const [t, setT] = useState(reduce ? T.hold - 1 : 0);
  const [cycle, setCycle] = useState(0);
  const start = useRef<number | null>(null);
  const raf = useRef(0);

  useEffect(() => {
    if (reduce) return;
    const step = (now: number) => {
      if (start.current === null) start.current = now;
      const e = now - start.current;
      if (e >= T.loop) {
        start.current = now;
        setCycle((c) => c + 1);
        setT(0);
      } else {
        setT(e);
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    const restart = () => {
      start.current = null;
      setCycle((c) => c + 1);
      setT(0);
    };
    window.addEventListener(LIVE_AUDIT_RESTART, restart);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener(LIVE_AUDIT_RESTART, restart);
    };
  }, [reduce]);

  const phase = phaseAt(t);
  const typed = Math.max(0, Math.min(DEMO_URL.length, Math.floor((t - T.typeStart) / T.typeMs)));
  const chips = phase === "idle" ? 0 : Math.min(PROFILE_CHIPS.length, Math.floor((t - T.chips) / T.chipGap) + 1);
  const rowsVisible = t >= T.replay ? BROKEN_BUYERS.filter((_, i) => t >= ROW_START[i]).length : 0;
  const verdictShown = t >= T.verdict;
  const fixShown = t >= T.fix;
  const fading = t >= T.hold;

  return (
    <div
      id="live-audit"
      className="relative overflow-hidden rounded-2xl border border-line bg-surface shadow-card"
      aria-label="Animated example of an audit"
      aria-live="off"
    >
      <div className="flex items-center gap-2 border-b border-line bg-surface-2/50 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
        </span>
        <span className="ml-2 truncate font-mono text-[11.5px] text-muted">watchdog.app/dashboard/new</span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] font-medium text-muted">
          <span className={`size-1.5 rounded-full ${phase === "idle" || phase === "done" ? "bg-line-strong" : "bg-fail animate-[pulse-soft_1s_ease-in-out_infinite]"}`} aria-hidden />
          {phase === "idle" ? "Ready" : phase === "profiling" ? "Profiling" : phase === "replaying" ? "Replaying" : "Done"}
        </span>
      </div>

      <motion.div animate={{ opacity: fading ? 0 : 1 }} transition={{ duration: 0.5 }} className="p-4 sm:p-5">
        <div className="flex gap-2">
          <div className="flex h-10 min-w-0 flex-1 items-center overflow-hidden whitespace-nowrap rounded-lg border border-line-strong bg-bg px-3 font-mono text-[14px]">
            <span className="hidden text-faint sm:inline">https://</span>
            <span className="truncate">{DEMO_URL.slice(0, typed)}</span>
            {phase === "idle" && <span className="caret ml-px inline-block h-4 w-[1.5px] bg-ink" aria-hidden />}
          </div>
          <motion.span
            animate={phase === "idle" && t >= T.submit - 150 ? { scale: 0.96 } : { scale: 1 }}
            className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-medium transition-colors ${
              phase === "idle" ? "bg-accent text-accent-ink" : "bg-surface-2 text-muted"
            }`}
          >
            {phase === "idle" ? "Audit" : "Running"}
            {phase === "idle" && <ArrowRight className="size-3.5" aria-hidden />}
          </motion.span>
        </div>

        <div className="mt-3 flex h-6 items-center justify-between">
          <span className={`font-mono text-[13px] font-medium transition-opacity duration-300 ${phase === "idle" ? "opacity-0" : "opacity-100"}`}>{DEMO_URL}</span>
          <span className={`flex items-center gap-1.5 text-[11.5px] text-muted transition-opacity duration-300 ${phase === "idle" ? "opacity-0" : "opacity-100"}`}>
            Overall
            {verdictShown ? <OverallPill overall={BROKEN_VERDICT.overall} /> : <span className="inline-flex h-6 w-14 rounded-full border border-dashed border-line-strong" />}
          </span>
        </div>

        <div className="mt-2 flex min-h-[26px] flex-wrap items-center gap-1.5">
          <AnimatePresence>
            {PROFILE_CHIPS.slice(0, chips).map((c) => (
              <ProfileChip key={`${cycle}-${c.label}`} chip={c} />
            ))}
            {phase === "profiling" && chips < PROFILE_CHIPS.length && (
              <motion.span key="probe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[11.5px] text-muted">
                8 probes running
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
          <VerdictTile name="Seen" verdict={BROKEN_VERDICT.seen} note="Readable without JavaScript" shown={t >= T.verdict} />
          <VerdictTile name="Listed" verdict={BROKEN_VERDICT.listed} note="Schema and feed present" shown={t >= T.verdict + 150} />
          <VerdictTile name="Buyable" verdict={BROKEN_VERDICT.buyable} note={BROKEN_VERDICT.buyableNote} shown={t >= T.verdict + 300} />
        </div>

        <div className="mt-3 min-h-[268px] divide-y divide-line border-y border-line">
          <AnimatePresence>
            {BROKEN_BUYERS.slice(0, rowsVisible).map((b, i) => (
              <motion.div key={`${cycle}-${b.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }}>
                <BuyerRow buyer={b} revealed={revealedAt(t, i)} compact />
              </motion.div>
            ))}
          </AnimatePresence>
          {rowsVisible === 0 && (
            <div className="grid h-[268px] place-items-center text-[12.5px] text-faint">
              {phase === "idle" ? "Seven AI buyers waiting" : "Generating journeys per buyer"}
            </div>
          )}
        </div>

        <div className="mt-3 min-h-[76px]">
          <AnimatePresence>
            {fixShown && (
              <motion.div key={`fix-${cycle}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="mb-1.5 text-[12.5px] font-semibold">
                  What to fix <span className="font-normal text-muted">1 fix</span>
                </div>
                <ul className="overflow-hidden rounded-lg border border-line">
                  {BROKEN_FIXES.map((f) => (
                    <FixCard key={f.title} fix={f} />
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
