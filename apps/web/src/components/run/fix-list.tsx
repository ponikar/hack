import { CHECKS, CHECK_LABEL, type Fix, type RunVerdicts } from "./types";
import { personaLabel } from "./personas";

export function FixList({ verdicts, pending }: { verdicts: RunVerdicts | null; pending: boolean }) {
  if (!verdicts) {
    if (!pending) return null;
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <span className="skeleton block h-4 w-56" />
            <span className="skeleton block h-3 w-full max-w-md" />
          </div>
        ))}
      </div>
    );
  }
  if (verdicts.fixes.length === 0) {
    return (
      <div className="rounded-lg border border-ok/30 bg-ok-soft p-4 text-sm text-ok">
        Nothing to fix. Every AI buyer got as far as it can go.
      </div>
    );
  }
  const groups = CHECKS.map((c) => ({ check: c, fixes: verdicts.fixes.filter((f) => f.check === c) })).filter((g) => g.fixes.length);
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.check}>
          <h3 className="flex items-baseline gap-2 text-sm font-semibold">
            {CHECK_LABEL[g.check].title}
            <span className="font-normal text-muted">
              {g.fixes.length} {g.fixes.length === 1 ? "fix" : "fixes"}
            </span>
          </h3>
          <ol className="mt-2 divide-y divide-line rounded-lg border border-line">
            {g.fixes.map((f) => (
              <FixItem key={f.fixClass} fix={f} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function FixItem({ fix }: { fix: Fix }) {
  return (
    <li className="grid gap-2 p-4 md:grid-cols-[1fr_220px] md:gap-6">
      <div>
        <div className="text-[15px] font-medium">{fix.title}</div>
        <p className="mt-1 text-sm leading-relaxed text-ink-2">{fix.detail}</p>
      </div>
      <div className="md:text-right">
        <div className="text-xs text-muted">Unblocks</div>
        <div className="mt-1 flex flex-wrap gap-1 md:justify-end">
          {fix.personas.map((p) => (
            <span key={p} className="inline-flex h-6 items-center rounded-md bg-surface px-2 text-xs font-medium text-ink-2">
              {personaLabel(p)}
            </span>
          ))}
        </div>
      </div>
    </li>
  );
}
