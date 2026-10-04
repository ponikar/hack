"use client";

import { useEffect, useState } from "react";
import { ExternalLink, ThumbsDown, ThumbsUp, X } from "lucide-react";
import type { Issue } from "./issues";
import { CATEGORY_LABEL } from "./issues";
import { ARCHETYPE_LABEL, personaLabel } from "./personas";
import { Screenshot } from "./step-panel";
import { CategoryChip, CopyButton, EvidenceTag, SEVERITY_TEXT, SEVERITY_TEXT_CLS } from "./issue-bits";
import { sendFeedback } from "./api";

export function IssuePanel({
  issue,
  runId,
  shareToken,
  onClose,
}: {
  issue: Issue;
  runId: string;
  shareToken?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ev = issue.firstEvidence;
  const resolved = issue.status === "resolved";

  return (
    <>
      <button
        type="button"
        aria-label="Close issue"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px] lg:hidden"
      />
      <aside
        role="dialog"
        aria-label={issue.title}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] overflow-y-auto overflow-x-hidden rounded-t-xl border border-line bg-bg shadow-2xl lg:inset-y-0 lg:left-auto lg:right-0 lg:top-14 lg:w-[460px] lg:max-h-none lg:rounded-none lg:border-y-0 lg:border-r-0 lg:shadow-none"
      >
        <div className="sticky top-0 z-10 border-b border-line bg-bg px-5 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-semibold ${resolved ? "text-ok" : SEVERITY_TEXT_CLS[issue.severity]}`}>
                {resolved ? "Resolved" : SEVERITY_TEXT[issue.severity]}
              </span>
              <CategoryChip issue={issue} />
              <EvidenceTag evidence={issue.evidence} tooltip />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-1.5 -mt-1 grid size-8 shrink-0 place-items-center rounded-md text-muted hover:bg-surface hover:text-ink"
              aria-label="Close"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <h2 className="mt-2 text-lg font-semibold leading-snug tracking-tight">{issue.title}</h2>
          <p className="mt-0.5 text-[13px] text-muted">
            Blocks {issue.affected.length} of {issue.totalBuyers} AI buyers at the {CATEGORY_LABEL[issue.category]} check
          </p>
        </div>

        <div className="space-y-6 px-5 py-5">
          {resolved && (
            <p className="rounded-md border border-ok/30 bg-ok-soft p-3 text-sm text-ok">
              The previous audit found this. This audit did not.
            </p>
          )}

          <Section title="What the AI buyer hit">
            {ev ? (
              <div className="space-y-3">
                {(ev.screenshot || issue.evidence === "simulated") && (
                  <Screenshot src={ev.screenshot} alt={`What ${personaLabel(ev.persona)} saw at "${ev.step.label}"`} />
                )}
                {ev.reason && <p className="rounded-md border border-fail/30 bg-fail-soft p-3 text-sm leading-relaxed">{ev.reason}</p>}
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-muted">Buyer</dt>
                  <dd>{personaLabel(ev.persona)}</dd>
                  <dt className="text-muted">Step</dt>
                  <dd className="min-w-0 break-words">{ev.step.label}</dd>
                  {ev.pageUrl && (
                    <>
                      <dt className="text-muted">Page</dt>
                      <dd className="min-w-0">
                        <a
                          href={ev.pageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex max-w-full items-center gap-1 font-mono text-[13px] text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink"
                        >
                          <span className="truncate">{ev.pageUrl}</span>
                          <ExternalLink className="size-3 shrink-0" aria-hidden />
                        </a>
                      </dd>
                    </>
                  )}
                </dl>
              </div>
            ) : (
              <p className="text-sm text-muted">No failing step was recorded for this issue. It comes from the store profile.</p>
            )}
          </Section>

          {issue.reproduce && (
            <Section
              title="Reproduce it yourself"
              aside={<CopyButton text={issue.reproduce.command} />}
            >
              <pre className="whitespace-pre-wrap break-all rounded-md border border-line bg-surface-2 p-3 font-mono text-[12.5px] leading-relaxed text-ink">
                <code>{issue.reproduce.command}</code>
              </pre>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{issue.reproduce.expect}</p>
            </Section>
          )}

          <Section title="How to fix">
            <p className="text-sm leading-relaxed">{issue.fix}</p>
          </Section>

          <Section title={`AI buyers affected (${issue.affected.length})`}>
            <ul className="divide-y divide-line rounded-md border border-line">
              {issue.affected.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-2 shrink-0 rounded-[2px] bg-fail" aria-hidden />
                    <span className="truncate font-medium">{a.label}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">{a.archetype ? ARCHETYPE_LABEL[a.archetype] : ""}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Feedback key={issue.id} runId={runId} fixClass={issue.id} shareToken={shareToken} />
        </div>
      </aside>
    </>
  );
}

function Section({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-[13px] font-semibold text-ink-2">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Feedback({ runId, fixClass, shareToken }: { runId: string; fixClass: string; shareToken?: string }) {
  const [verdict, setVerdict] = useState<"correct" | "wrong" | null>(null);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "saved" | "detailSent">("idle");
  const [error, setError] = useState<string | null>(null);

  // The click itself is the feedback; most people never press a second button, so save immediately.
  async function choose(v: "correct" | "wrong") {
    setVerdict(v);
    setState("sending");
    setError(null);
    const r = await sendFeedback({ runId, fixClass, verdict: v, shareToken });
    if (r.ok) setState("saved");
    else {
      setState("idle");
      setError(r.message);
    }
  }

  async function sendDetail() {
    if (!verdict || !comment.trim()) return;
    setState("sending");
    const r = await sendFeedback({ runId, fixClass, verdict, comment: comment.trim(), shareToken });
    if (r.ok) setState("detailSent");
    else {
      setState("saved");
      setError(r.message);
    }
  }

  if (state === "detailSent") {
    return (
      <div className="rounded-md border border-line bg-surface p-3 text-sm text-ink-2">
        Thanks. Your answer goes straight to the team tuning these checks.
      </div>
    );
  }

  const opt = (v: "correct" | "wrong", Icon: typeof ThumbsUp, text: string) => (
    <button
      type="button"
      onClick={() => choose(v)}
      disabled={state === "sending" || state === "saved"}
      aria-pressed={verdict === v}
      className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors disabled:cursor-default ${
        verdict === v
          ? v === "correct"
            ? "border-ok/40 bg-ok-soft text-ok"
            : "border-fail/40 bg-fail-soft text-fail"
          : "border-line bg-bg text-ink-2 hover:text-ink"
      }`}
    >
      <Icon className="size-3.5" aria-hidden />
      {text}
    </button>
  );

  return (
    <section className="rounded-md border border-line bg-surface p-3.5">
      <h3 className="text-[13px] font-semibold">Is this right?</h3>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {opt("correct", ThumbsUp, "Correct")}
        {opt("wrong", ThumbsDown, "Wrong")}
        {state === "saved" && <span className="text-xs text-muted">Saved. Thank you.</span>}
      </div>
      {verdict && state !== "idle" && (
        <div className="mt-3 space-y-2">
          <label htmlFor={`fb-${fixClass}`} className="text-xs text-muted">
            {verdict === "wrong" ? "What did we get wrong? (optional)" : "Anything to add? (optional)"}
          </label>
          <textarea
            id={`fb-${fixClass}`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            maxLength={1000}
            className="block w-full resize-y rounded-md border border-line bg-bg px-3 py-2 text-sm placeholder:text-faint focus:border-ink"
            placeholder={verdict === "wrong" ? "e.g. guest checkout is enabled on this store" : ""}
          />
          <button
            type="button"
            onClick={sendDetail}
            disabled={state === "sending" || !comment.trim()}
            className="inline-flex h-8 items-center rounded-md bg-ink px-3 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50"
          >
            {state === "sending" ? "Sending…" : "Add detail"}
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-fail">{error}</p>}
    </section>
  );
}
