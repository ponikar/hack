"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import type { Run } from "@/components/run/types";
import { usePolled } from "@/components/run/use-run";
import { hostOf, relativeTime } from "@/components/run/format";
import { ModeBadge, OverallPill, StatusPill } from "@/components/run/badges";
import { ProfileSummary } from "@/components/run/profile-summary";
import { VerdictTiles } from "@/components/run/verdict-tiles";
import { PersonaRow, PersonaRowSkeleton, type StepRef } from "@/components/run/persona-row";
import { StepPanel } from "@/components/run/step-panel";
import { FixList } from "@/components/run/fix-list";
import { PERSONAS } from "@/components/run/personas";
import { SignedOut } from "@/components/run/signed-out";

const isActive = (r: Run | null) => !r || r.status === "queued" || r.status === "profiling" || r.status === "running";

export function RunView({ id }: { id: string }) {
  const { data: run, error, loading } = usePolled<Run>(`/api/runs/${id}`, 2000, isActive);
  const [selected, setSelected] = useState<StepRef | null>(null);
  const close = useCallback(() => setSelected(null), []);

  const selectedStep = useMemo(() => {
    if (!selected || !run?.results) return null;
    const result = run.results.find((r) => r.sessionId === selected.sessionId);
    const step = result?.steps.find((s) => s.index === selected.index);
    return result && step ? { result, step } : null;
  }, [selected, run]);

  if (error === "unauthorized") {
    return (
      <Shell>
        <SignedOut what="this audit" />
      </Shell>
    );
  }
  if (error === "not-found") {
    return (
      <Shell>
        <div className="rounded-lg border border-line p-6 text-sm">
          No audit with this id.{" "}
          <Link href="/dashboard" className="text-accent hover:underline">
            Back to audits
          </Link>
        </div>
      </Shell>
    );
  }
  if (loading || !run) {
    return (
      <Shell>
        {error === "network" ? (
          <p className="text-sm text-fail">Could not load this audit. Retrying.</p>
        ) : (
          <div className="space-y-6">
            <span className="skeleton block h-7 w-72" />
            <span className="skeleton block h-24 w-full" />
            <PersonaRowSkeleton />
            <PersonaRowSkeleton />
          </div>
        )}
      </Shell>
    );
  }

  const active = isActive(run);
  const profiling = run.status === "queued" || run.status === "profiling";
  const sessions = run.sessions ?? [];
  const results = new Map((run.results ?? []).map((r) => [r.sessionId, r]));

  return (
    <Shell wide={Boolean(selectedStep)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate font-mono text-lg font-medium tracking-tight sm:text-xl">{hostOf(run.storeUrl)}</h1>
            <StatusPill status={run.status} />
            <ModeBadge mode={run.mode} />
          </div>
          <p className="mt-1 text-sm text-muted">
            Started {relativeTime(run.createdAt)}
            {run.verdicts && (
              <>
                {" "}
                <span aria-hidden>·</span> {run.verdicts.summary}
              </>
            )}
            {!run.verdicts && profiling && " · Profiling the store: platform, rendering, schema, bot protection."}
            {!run.verdicts && run.status === "running" && " · Replaying buyer sessions in a real browser."}
          </p>
        </div>
        {run.verdicts && (
          <div className="flex shrink-0 items-center gap-2 text-sm">
            <span className="text-muted">Overall</span>
            <OverallPill overall={run.verdicts.overall} />
          </div>
        )}
      </div>

      {run.error && (
        <div className="mt-4 flex gap-3 rounded-lg border border-fail/30 bg-fail-soft p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-fail" aria-hidden />
          <div>
            <div className="font-medium text-fail">The audit stopped with an error</div>
            <pre className="mt-1 whitespace-pre-wrap font-mono text-[13px] text-ink-2">{run.error}</pre>
          </div>
        </div>
      )}

      <div className="mt-5">
        <ProfileSummary profile={run.profile} pending={profiling} />
      </div>

      <div className="mt-6">
        <VerdictTiles verdicts={run.verdicts} pending={active} />
      </div>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Buyer sessions</h2>
          <span className="text-xs text-muted">Click a step to see the screenshot and reason</span>
        </div>
        <div className="mt-2 divide-y divide-line border-y border-line">
          {sessions.length === 0 && profiling
            ? PERSONAS.slice(0, 5).map((p) => <PersonaRowSkeleton key={p.id} label={p.label} />)
            : sessions.map((s) => (
                <PersonaRow
                  key={s.id}
                  session={s}
                  result={results.get(s.id)}
                  live={run.status === "running"}
                  selected={selected}
                  onSelect={setSelected}
                />
              ))}
          {sessions.length === 0 && !profiling && !active && (
            <p className="py-6 text-sm text-muted">No sessions were generated for this store.</p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-base font-semibold">What to fix</h2>
        <p className="mt-1 text-sm text-muted">Grouped by the check it unblocks. Each fix lists the buyers it lets through.</p>
        <div className="mt-4">
          <FixList verdicts={run.verdicts} pending={active} />
        </div>
      </section>

      {selectedStep && <StepPanel result={selectedStep.result} step={selectedStep.step} onClose={close} />}
    </Shell>
  );
}

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <main className={`mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 ${wide ? "lg:pr-[420px]" : ""}`}>
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-3.5" aria-hidden />
        All audits
      </Link>
      <div className="mt-4">{children}</div>
    </main>
  );
}
