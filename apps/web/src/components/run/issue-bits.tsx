"use client";

import { useState } from "react";
import { Check, Copy, MonitorPlay, ShieldCheck } from "lucide-react";
import type { AffectedBuyer, Evidence, Issue, Severity } from "./issues";
import { CATEGORY_LABEL } from "./issues";

export const SEVERITY_TEXT: Record<Severity, string> = { critical: "Critical", high: "High", medium: "Medium" };

export const SEVERITY_BAR: Record<Severity, string> = {
  critical: "bg-fail",
  high: "bg-warn",
  medium: "bg-skip",
};

export const SEVERITY_TEXT_CLS: Record<Severity, string> = {
  critical: "text-fail",
  high: "text-warn",
  medium: "text-skip",
};

export const EVIDENCE_HELP: Record<Evidence, string> = {
  verified:
    "Verified: we fetched your page over plain HTTP with the AI buyer's own user agent. Anyone can repeat the request and get the same answer.",
  simulated:
    "Simulated: an AI model drove a real browser through your store the way this agent shops. Real agents may take a slightly different path.",
};

export function EvidenceTag({ evidence, tooltip = false }: { evidence: Evidence; tooltip?: boolean }) {
  const Icon = evidence === "verified" ? ShieldCheck : MonitorPlay;
  const cls =
    evidence === "verified" ? "border-ok/30 text-ok" : "border-line-strong text-ink-2";
  const tag = (
    <span
      className={`inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[11.5px] font-medium ${cls}`}
      title={tooltip ? undefined : EVIDENCE_HELP[evidence]}
    >
      <Icon className="size-3" aria-hidden />
      {evidence === "verified" ? "Verified" : "Simulated"}
    </span>
  );
  if (!tooltip) return tag;
  return (
    <span className="group relative inline-flex" tabIndex={0} aria-describedby={`ev-${evidence}`}>
      {tag}
      <span
        id={`ev-${evidence}`}
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-10 mt-1.5 w-64 rounded-md border border-line bg-surface p-2.5 text-xs leading-relaxed text-ink-2 opacity-0 shadow-card transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {EVIDENCE_HELP[evidence]}
      </span>
    </span>
  );
}

export function CategoryChip({ issue }: { issue: Pick<Issue, "category"> }) {
  return (
    <span className="inline-flex h-5 items-center rounded bg-surface-2 px-1.5 text-[11.5px] font-medium text-ink-2">
      {CATEGORY_LABEL[issue.category]}
    </span>
  );
}

/** One square per AI buyer in the run: filled where this issue blocks it. */
export function BuyerStrip({
  all,
  blocked,
  size = "sm",
}: {
  all: AffectedBuyer[];
  blocked: Set<string>;
  size?: "sm" | "md";
}) {
  const sq = size === "sm" ? "size-2 rounded-[2px]" : "size-2.5 rounded-[3px]";
  return (
    <span className="inline-flex items-center gap-[3px]" aria-hidden>
      {all.map((b) => (
        <span
          key={b.id}
          title={b.label}
          className={`${sq} ${blocked.has(b.id) ? "bg-fail" : "border border-line-strong bg-transparent"}`}
        />
      ))}
    </span>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-line bg-bg px-2 text-xs font-medium text-ink-2 hover:text-ink"
    >
      {copied ? <Check className="size-3.5 text-ok" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}
