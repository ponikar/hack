import { Check, X, Minus } from "lucide-react";
import { CHECKS, CHECK_LABEL, type RunVerdicts, type Verdict } from "./types";

function Mark({ v }: { v: Verdict | undefined }) {
  const c = "size-5";
  if (v === "pass")
    return (
      <span className="grid size-8 place-items-center rounded-full bg-ok-soft text-ok">
        <Check className={c} strokeWidth={2.5} aria-hidden />
      </span>
    );
  if (v === "fail")
    return (
      <span className="grid size-8 place-items-center rounded-full bg-fail-soft text-fail">
        <X className={c} strokeWidth={2.5} aria-hidden />
      </span>
    );
  if (v === "skipped")
    return (
      <span className="grid size-8 place-items-center rounded-full bg-skip-soft text-skip">
        <Minus className={c} strokeWidth={2.5} aria-hidden />
      </span>
    );
  return <span className="skeleton size-8 rounded-full" />;
}

const WORD: Record<Verdict, string> = { pass: "Pass", fail: "Fail", skipped: "Skipped" };

export function VerdictTiles({ verdicts, pending }: { verdicts: RunVerdicts | null; pending: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
      {CHECKS.map((k) => {
        const v = verdicts?.[k];
        return (
          <div key={k} className="flex items-start gap-3 bg-bg p-4">
            <Mark v={v} />
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-base font-semibold">{CHECK_LABEL[k].title}</span>
                {v ? (
                  <span className={`text-sm ${v === "pass" ? "text-ok" : v === "fail" ? "text-fail" : "text-skip"}`}>{WORD[v]}</span>
                ) : pending ? (
                  <span className="text-sm text-faint">checking</span>
                ) : null}
              </div>
              <p className="mt-0.5 text-[13px] leading-snug text-muted">{CHECK_LABEL[k].question}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
