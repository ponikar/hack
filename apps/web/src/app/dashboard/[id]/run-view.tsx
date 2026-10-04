"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import type { Run } from "@/components/run/types";
import { usePolled } from "@/components/run/use-run";
import { apiFetch } from "@/components/run/api";
import { ProfileSummary } from "@/components/run/profile-summary";
import { VerdictTiles } from "@/components/run/verdict-tiles";
import { PersonaRow, PersonaRowSkeleton, type StepRef } from "@/components/run/persona-row";
import { StepPanel } from "@/components/run/step-panel";
import { PERSONAS } from "@/components/run/personas";
import { SignedOut } from "@/components/run/signed-out";
import { buyersInRun, deriveIssues, diffIssues, type Issue } from "@/components/run/issues";
import { IssueList } from "@/components/run/issue-list";
import { IssuePanel } from "@/components/run/issue-panel";
import { ReportHeader } from "@/components/run/report-header";
import { ProgressCard } from "@/components/run/progress-card";

const isActive = (r: Run | null) => !r || r.status === "queued" || r.status === "profiling" || r.status === "running";

type Back = { href: string; label: string };
type Mode = "owner" | "demo" | "public";
type Tab = "issues" | "journeys" | "profile";

const DASHBOARD_BACK: Back = { href: "/dashboard", label: "All audits" };

export function RunView({
  id,
  endpoint,
  back = DASHBOARD_BACK,
  mode = "owner",
  shareToken,
}: {
  id: string;
  endpoint?: string;
  back?: Back | null;
  mode?: Mode;
  shareToken?: string;
}) {
  const { data: run, error, loading } = usePolled<Run>(endpoint ?? `/api/runs/${id}`, 2000, isActive);
  const [tab, setTab] = useState<Tab>("issues");
  const [step, setStep] = useState<StepRef | null>(null);
  // Safe to read on first render: the issue panel only mounts after the client-side fetch, never during SSR.
  const [issueId, setIssueId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : decodeURIComponent(window.location.hash.slice(1)) || null,
  );
  const previous = usePreviousRun(mode === "owner" && run?.status === "done" ? run.rerunOf ?? null : null);

  const issues = useMemo<Issue[]>(() => {
    if (!run?.verdicts) return [];
    const now = deriveIssues(run);
    return previous?.verdicts ? diffIssues(now, deriveIssues(previous)) : now;
  }, [run, previous]);
  const buyers = useMemo(() => (run ? buyersInRun(run) : []), [run]);

  const selectIssue = useCallback((next: string | null) => {
    setIssueId(next);
    setStep(null);
    const url = new URL(window.location.href);
    url.hash = next ?? "";
    window.history.replaceState(null, "", next ? url : url.pathname + url.search);
  }, []);
  const closeIssue = useCallback(() => selectIssue(null), [selectIssue]);
  const closeStep = useCallback(() => setStep(null), []);

  const selectedIssue = tab === "issues" ? issues.find((i) => i.id === issueId) ?? null : null;
  const selectedStep = useMemo(() => {
    if (tab !== "journeys" || !step || !run?.results) return null;
    const result = run.results.find((r) => r.sessionId === step.sessionId);
    const s = result?.steps.find((x) => x.index === step.index);
    return result && s ? { result, step: s } : null;
  }, [tab, step, run]);

  if (error === "unauthorized") {
    return (
      <Shell back={back}>
        <SignedOut what="this audit" />
      </Shell>
    );
  }
  if (error === "not-found") {
    return (
      <Shell back={back}>
        <div className="rounded-lg border border-line p-6 text-sm">
          {mode === "public" ? "This shared report is no longer available. The owner may have stopped sharing it." : "No audit with this id."}{" "}
          <Link href={back?.href ?? "/"} className="font-medium underline underline-offset-2">
            {back?.label ?? "Run your own audit"}
          </Link>
        </div>
      </Shell>
    );
  }
  if (loading || !run) {
    return (
      <Shell back={back}>
        {error === "network" ? (
          <p className="text-sm text-fail">Could not load this audit. Retrying.</p>
        ) : (
          <div className="space-y-6">
            <span className="skeleton block h-4 w-48" />
            <span className="skeleton block h-8 w-96 max-w-full" />
            <span className="skeleton block h-12 w-full" />
            <span className="skeleton block h-40 w-full" />
          </div>
        )}
      </Shell>
    );
  }

  const active = isActive(run);
  const profiling = run.status === "queued" || run.status === "profiling";
  const sessions = run.sessions ?? [];
  const results = new Map((run.results ?? []).map((r) => [r.sessionId, r]));
  const openCount = issues.filter((i) => i.status !== "resolved").length;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "issues", label: "Issues", count: run.verdicts ? openCount : undefined },
    { id: "journeys", label: "Buyer journeys", count: sessions.length || undefined },
    { id: "profile", label: "Store profile" },
  ];

  return (
    <Shell wide={Boolean(selectedIssue || selectedStep)} back={back}>
      <ReportHeader run={run} issues={issues} buyers={buyers} owner={mode === "owner"} />

      {run.error && (
        <div className="mt-5 flex gap-3 rounded-lg border border-fail/30 bg-fail-soft p-4 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-fail" aria-hidden />
          <div className="min-w-0">
            <div className="font-medium text-fail">The audit stopped with an error</div>
            <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-[13px] text-ink-2">{run.error}</pre>
          </div>
        </div>
      )}

      {active && (
        <div className="mt-5">
          <ProgressCard run={run} />
        </div>
      )}

      <div role="tablist" aria-label="Report sections" className="mt-6 flex gap-5 overflow-x-auto border-b border-line [scrollbar-width:none]">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px inline-flex h-10 shrink-0 items-center gap-1.5 border-b-2 text-sm font-medium transition-colors ${
              tab === t.id ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`rounded px-1.5 text-xs tabular-nums ${tab === t.id ? "bg-ink text-bg" : "bg-surface-2 text-ink-2"}`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-5" role="tabpanel">
        {tab === "issues" &&
          (run.verdicts ? (
            <>
              <IssueList issues={issues} buyers={buyers} selected={issueId} onSelect={selectIssue} />
              {issues.length > 0 && (
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  Sorted by severity. Critical stops checkout or hides the store from every AI assistant. Click an issue for the evidence, a
                  command to check it yourself, and the fix.
                </p>
              )}
            </>
          ) : active ? (
            <div className="space-y-2" aria-label="Issues appear when the audit finishes">
              {[0, 1, 2].map((i) => (
                <span key={i} className="skeleton block h-16 w-full" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">This audit produced no findings.</p>
          ))}

        {tab === "journeys" && (
          <section>
            <p className="text-sm text-muted">Every AI buyer’s path through your store. Click a step for its screenshot and reason.</p>
            <div className="mt-3 divide-y divide-line border-y border-line">
              {sessions.length === 0 && profiling
                ? PERSONAS.slice(0, 5).map((p) => <PersonaRowSkeleton key={p.id} label={p.label} />)
                : sessions.map((s) => (
                    <PersonaRow
                      key={s.id}
                      session={s}
                      result={results.get(s.id)}
                      live={run.status === "running"}
                      selected={step}
                      onSelect={(ref) => {
                        setIssueId(null);
                        setStep(ref);
                      }}
                    />
                  ))}
              {sessions.length === 0 && !profiling && !active && (
                <p className="py-6 text-sm text-muted">No sessions were generated for this store.</p>
              )}
            </div>
          </section>
        )}

        {tab === "profile" && (
          <section className="space-y-6">
            <VerdictTiles verdicts={run.verdicts} pending={active} />
            <div>
              <h2 className="text-sm font-semibold">What we detected</h2>
              <div className="mt-2">
                <ProfileSummary profile={run.profile} pending={profiling} />
              </div>
              {run.profile && run.profile.notes.length > 0 && (
                <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-ink-2">
                  {run.profile.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </div>

      {selectedIssue && <IssuePanel issue={selectedIssue} runId={run.id} shareToken={shareToken} onClose={closeIssue} />}
      {selectedStep && <StepPanel result={selectedStep.result} step={selectedStep.step} onClose={closeStep} />}
    </Shell>
  );
}

function usePreviousRun(id: string | null): Run | null {
  const [prev, setPrev] = useState<Run | null>(null);
  useEffect(() => {
    if (!id) return;
    let live = true;
    apiFetch(`/api/runs/${id}`, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<Run>) : null))
      .then((r) => live && setPrev(r))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [id]);
  return id ? prev : null;
}

function Shell({ children, wide, back }: { children: React.ReactNode; wide?: boolean; back: Back | null }) {
  return (
    <main className={`mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 ${wide ? "lg:pr-[480px]" : ""}`}>
      {back && (
        <Link href={back.href} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-3.5" aria-hidden />
          {back.label}
        </Link>
      )}
      <div>{children}</div>
    </main>
  );
}
