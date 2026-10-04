"use client";

import { CircleCheck } from "lucide-react";
import type { AffectedBuyer, Issue } from "./issues";
import { BuyerStrip, CategoryChip, EvidenceTag, SEVERITY_BAR, SEVERITY_TEXT, SEVERITY_TEXT_CLS } from "./issue-bits";

export function IssueList({
  issues,
  buyers,
  selected,
  onSelect,
}: {
  issues: Issue[];
  buyers: AffectedBuyer[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  if (issues.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-ok/30 bg-ok-soft p-4 text-sm">
        <CircleCheck className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />
        <div>
          <div className="font-medium text-ok">No issues found</div>
          <p className="mt-0.5 text-ink-2">Every AI buyer we sent got as far as it can go without paying.</p>
        </div>
      </div>
    );
  }
  const showStatus = issues.some((i) => i.status);
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div
        className={`hidden border-b border-line bg-bg px-4 py-2 text-xs font-medium text-muted sm:grid ${
          showStatus ? "sm:grid-cols-[1fr_150px_80px]" : "sm:grid-cols-[1fr_150px]"
        } sm:gap-4 sm:pl-5`}
      >
        <span>Issue</span>
        <span>AI buyers blocked</span>
        {showStatus && <span className="text-right">Status</span>}
      </div>
      <ul className="divide-y divide-line">
        {issues.map((issue) => (
          <li key={issue.id}>
            <IssueRow issue={issue} buyers={buyers} showStatus={showStatus} selected={selected === issue.id} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function IssueRow({
  issue,
  buyers,
  showStatus,
  selected,
  onSelect,
}: {
  issue: Issue;
  buyers: AffectedBuyer[];
  showStatus: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const resolved = issue.status === "resolved";
  const blocked = new Set(issue.affected.map((a) => a.id));
  const reason = issue.firstEvidence?.reason;
  return (
    <button
      type="button"
      onClick={() => onSelect(issue.id)}
      aria-pressed={selected}
      className={`relative grid w-full gap-x-4 gap-y-2 py-3.5 pl-5 pr-4 text-left transition-colors hover:bg-bg sm:items-center ${
        showStatus ? "sm:grid-cols-[1fr_150px_80px]" : "sm:grid-cols-[1fr_150px]"
      } ${selected ? "bg-bg" : ""} ${resolved ? "opacity-60" : ""}`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${resolved ? "bg-ok" : SEVERITY_BAR[issue.severity]}`} aria-hidden />
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={`text-xs font-semibold ${resolved ? "text-ok" : SEVERITY_TEXT_CLS[issue.severity]}`}>
            {SEVERITY_TEXT[issue.severity]}
          </span>
          <CategoryChip issue={issue} />
          <EvidenceTag evidence={issue.evidence} />
        </span>
        <span className={`mt-1.5 block text-[15px] font-medium leading-snug ${resolved ? "line-through decoration-1" : ""}`}>
          {issue.title}
        </span>
        {reason && <span className="mt-0.5 block truncate text-[13px] text-muted">{reason}</span>}
      </span>
      <span className="flex items-center gap-2 sm:flex-col sm:items-start sm:gap-1">
        <BuyerStrip all={buyers} blocked={blocked} />
        <span className="text-xs text-ink-2">
          <span className="font-semibold text-ink">{issue.affected.length}</span> of {issue.totalBuyers}
          <span className="sr-only"> AI buyers blocked</span>
        </span>
      </span>
      {showStatus && (
        <span className={`sm:block sm:text-right ${issue.status === "open" ? "hidden" : ""}`}>
          <StatusPill status={issue.status} />
        </span>
      )}
      <span className="sr-only">Show details</span>
    </button>
  );
}

function StatusPill({ status }: { status?: Issue["status"] }) {
  if (!status) return null;
  return status === "resolved" ? (
    <span className="inline-flex h-5 items-center rounded-full border border-ok/30 bg-ok-soft px-2 text-[11.5px] font-medium text-ok">Resolved</span>
  ) : (
    <span className="inline-flex h-5 items-center rounded-full border border-line-strong px-2 text-[11.5px] font-medium text-ink-2">Open</span>
  );
}
