import type { Archetype } from "@watchdog/shared";
import type { Check, Fix, Run, SessionResult, StepResult } from "./types";
import { PERSONAS, personaLabel, personaMeta } from "./personas";

export type Severity = "critical" | "high" | "medium";
export type Evidence = "verified" | "simulated";
export type IssueStatus = "open" | "resolved";

export type AffectedBuyer = { id: string; label: string; archetype: Archetype | null };

export type Reproduce = { command: string; expect: string };

export type Issue = {
  id: Fix["fixClass"];
  title: string;
  severity: Severity;
  category: Check;
  evidence: Evidence;
  affected: AffectedBuyer[];
  totalBuyers: number;
  firstEvidence: {
    persona: string;
    sessionId: string;
    step: StepResult;
    screenshot?: string;
    reason?: string;
    pageUrl?: string;
  } | null;
  fix: string;
  reproduce: Reproduce | null;
  status?: IssueStatus;
};

export const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium"];

export const CATEGORY_LABEL: Record<Check, string> = { seen: "Seen", listed: "Listed", buyable: "Buyable" };

/** Fix classes that are as likely to be our own flakiness as the store's fault. */
const UNRELIABLE = new Set<Fix["fixClass"]>(["timeout", "llm_error"]);

const BLOCKER_FOR: Partial<Record<Fix["fixClass"], string>> = {
  login: "login",
  captcha: "captcha",
  waf_block: "waf",
  popup: "overlay",
};

type RunLike = Pick<Run, "storeUrl" | "verdicts"> & Partial<Pick<Run, "sessions" | "results" | "profile">>;

function archetypeOf(id: string, run: RunLike): Archetype | null {
  return (
    run.sessions?.find((s) => s.persona === id)?.archetype ??
    run.results?.find((r) => r.persona === id)?.archetype ??
    personaMeta(id)?.archetype ??
    null
  );
}

export function buyersInRun(run: RunLike): AffectedBuyer[] {
  const ids = new Set<string>();
  for (const s of run.sessions ?? []) ids.add(s.persona);
  for (const r of run.results ?? []) ids.add(r.persona);
  // List rows carry verdicts only: fall back to every buyer named by a fix, which is what the run tested and failed.
  if (!ids.size) for (const f of run.verdicts?.fixes ?? []) for (const p of f.personas) ids.add(p);
  const list = ids.size ? [...ids] : PERSONAS.map((p) => p.id);
  return list.map((id) => ({ id, label: personaLabel(id), archetype: archetypeOf(id, run) }));
}

/**
 * Severity rule:
 * - critical: the fix is on the Buyable check and stops a browser agent (it cannot reach payment),
 *   or it hits every feed reader in the run (no AI assistant can read the store).
 * - high: any other Seen or Listed issue (visibility and listing in AI answers).
 * - medium: everything else, plus timeouts and model errors, which may be audit flakiness rather than the store.
 */
export function severityOf(fix: Fix, affected: AffectedBuyer[], allBuyers: AffectedBuyer[]): Severity {
  if (UNRELIABLE.has(fix.fixClass)) return "medium";
  const blocksAgent = affected.some((a) => a.archetype === "browser-agent");
  if (fix.check === "buyable" && blocksAgent) return "critical";
  const feedReaders = allBuyers.filter((b) => b.archetype === "feed-reader");
  const blockedReaders = affected.filter((a) => a.archetype === "feed-reader");
  if (feedReaders.length > 0 && feedReaders.every((f) => blockedReaders.some((b) => b.id === f.id))) return "critical";
  if (fix.check === "seen" || fix.check === "listed") return "high";
  return "medium";
}

function isFailure(s: StepResult) {
  return s.status === "failed" || s.status === "blocked";
}

function pickEvidence(fix: Fix, results: SessionResult[]): Issue["firstEvidence"] {
  const candidates: { r: SessionResult; s: StepResult; score: number }[] = [];
  const blocker = BLOCKER_FOR[fix.fixClass];
  for (const r of results) {
    if (!fix.personas.includes(r.persona)) continue;
    const s = r.steps.find(isFailure);
    if (!s) continue;
    let score = 0;
    if (blocker && s.blocker === blocker) score += 4;
    if (s.screenshot) score += 2;
    if (s.reason) score += 1;
    candidates.push({ r, s, score });
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score);
  const { r, s } = candidates[0];
  return { persona: r.persona, sessionId: r.sessionId, step: s, screenshot: s.screenshot, reason: s.reason, pageUrl: s.url };
}

function q(s: string) {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function reproduceFor(fix: Fix, pageUrl: string, run: RunLike): Reproduce | null {
  const reader = fix.personas.map((id) => personaMeta(id)).find((p) => p?.archetype === "feed-reader" && p.userAgent);
  const ua = reader?.userAgent;
  const origin = originOf(pageUrl) ?? originOf(run.storeUrl);
  const name = reader?.label ?? "the AI buyer";
  switch (fix.fixClass) {
    case "js_only": {
      if (!ua) return null;
      const needle = run.profile?.products.sampleNames[0] ?? "price";
      return {
        command: `curl -sL -A ${q(ua)} ${q(pageUrl)} | grep -i ${q(needle)}`,
        expect: `No output means ${name} sees no "${needle}" in the HTML it is sent.`,
      };
    }
    case "no_schema":
      return {
        command: `curl -sL${ua ? ` -A ${q(ua)}` : ""} ${q(pageUrl)} | grep -c 'application/ld+json'`,
        expect: "0 means the page has no structured data for shopping systems to read.",
      };
    case "robots_block":
      if (!origin) return null;
      return {
        command: `curl -s ${q(`${origin}/robots.txt`)}`,
        expect: "Look for Disallow: / under the AI bot names (GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot).",
      };
    case "waf_block":
      return {
        command: `curl -s -o /dev/null -w '%{http_code}\\n'${ua ? ` -A ${q(ua)}` : ""} ${q(pageUrl)}`,
        expect: "403, 429 or 503 means your firewall turns the AI buyer away.",
      };
    default:
      return null;
  }
}

export function deriveIssues(run: RunLike): Issue[] {
  const fixes = run.verdicts?.fixes ?? [];
  const all = buyersInRun(run);
  const results = run.results ?? [];
  const issues = fixes.map((fix): Issue => {
    const affected = fix.personas.map((id) => ({ id, label: personaLabel(id), archetype: archetypeOf(id, run) }));
    const firstEvidence = pickEvidence(fix, results);
    const pageUrl = firstEvidence?.pageUrl ?? run.storeUrl;
    const evidence: Evidence = affected.length > 0 && affected.every((a) => a.archetype === "feed-reader") ? "verified" : "simulated";
    return {
      id: fix.fixClass,
      title: fix.title,
      severity: severityOf(fix, affected, all),
      category: fix.check,
      evidence,
      affected,
      totalBuyers: Math.max(all.length, affected.length),
      firstEvidence,
      fix: fix.detail,
      reproduce: reproduceFor(fix, pageUrl, run),
    };
  });
  return sortIssues(issues);
}

export function sortIssues(issues: Issue[]): Issue[] {
  return [...issues].sort(
    (a, b) =>
      Number(a.status === "resolved") - Number(b.status === "resolved") ||
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) ||
      b.affected.length - a.affected.length,
  );
}

/** Marks current issues Open and appends issues from the previous run that are gone as Resolved. */
export function diffIssues(current: Issue[], previous: Issue[]): Issue[] {
  const now = new Set(current.map((i) => i.id));
  const resolved = previous.filter((p) => !now.has(p.id)).map((p) => ({ ...p, status: "resolved" as const }));
  return sortIssues([...current.map((i) => ({ ...i, status: "open" as const })), ...resolved]);
}

export function severityCounts(issues: Issue[]): Record<Severity, number> {
  const c: Record<Severity, number> = { critical: 0, high: 0, medium: 0 };
  for (const i of issues) if (i.status !== "resolved") c[i.severity]++;
  return c;
}

/** Plain-English one-liner for the report header. */
export function plainSummary(run: RunLike, issues: Issue[]): string {
  const open = issues.filter((i) => i.status !== "resolved");
  if (!open.length) return "Every AI buyer we sent got as far as it can go without paying.";
  const all = buyersInRun(run);
  const blocked = new Set(open.flatMap((i) => i.affected.map((a) => a.id)));
  const top = open[0];
  return `${blocked.size} of ${all.length} AI buyers hit a problem. Start here: ${top.title.charAt(0).toLowerCase()}${top.title.slice(1)}.`;
}

export function canBuy(run: RunLike): boolean {
  return run.verdicts?.buyable === "pass";
}
