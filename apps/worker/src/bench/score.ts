import fs from "node:fs";
import path from "node:path";
import type { Archetype } from "@watchdog/shared";
import { BENCH_DIR, loadGroundTruth, type GroundTruth } from "./ground-truth";
import type { Observation, StepLabel } from "./normalize";
import type { RunRecord } from "./run";

type Outcome = "pass" | "fail" | "reach_checkout" | "blocked" | "error";

type PersonaSummary = {
  storeId: string;
  agent: string;
  archetype: Archetype;
  runs: number;
  outcome: Outcome;
  stoppedAt: StepLabel | null;
  reason: string | null;
  consistency: number;
  distribution: Record<string, number>;
};

type Comparison = {
  storeId: string;
  truthAgent: string;
  method: GroundTruth["method"];
  persona: string;
  ours: { outcome: Outcome; stoppedAt: StepLabel | null; reason: string | null };
  truth: { outcome: Outcome; stoppedAt: StepLabel | null; reason: string };
  outcomeMatch: boolean;
  stepMatch: boolean;
  falseAlarm: boolean;
  miss: boolean;
};

type Expected = { feedReader: "pass" | "fail"; browserAgent: "reach_checkout" | "blocked"; blockedAt?: StepLabel; uncertain?: boolean };
type ExpectationCheck = {
  storeId: string;
  expected: Expected;
  ours: { feedReader: Outcome; browserAgent: Outcome; blockedAt: (StepLabel | null)[] };
  feedMatch: boolean;
  browserMatch: boolean;
  blockedAtMatch: boolean | null;
  uncertain: boolean;
};

const outcomeOf = (o: Pick<Observation, "archetype" | "reachedCheckout" | "stoppedAt" | "blocker">): Outcome => {
  if (o.blocker === "error") return "error";
  if (o.archetype === "feed-reader") return o.stoppedAt ? "fail" : "pass";
  return o.reachedCheckout === true ? "reach_checkout" : o.reachedCheckout === false ? "blocked" : "error";
};
const truthOutcome = (g: GroundTruth): Outcome =>
  g.method === "fetcher" ? (g.stoppedAt ? "fail" : "pass") : g.reachedCheckout === true ? "reach_checkout" : g.reachedCheckout === false ? "blocked" : "error";
const reached = (o: Outcome) => o === "pass" || o === "reach_checkout";
const blockedOut = (o: Outcome) => o === "fail" || o === "blocked";
const pct = (x: number) => `${Math.round(x * 100)}%`;
const mark = (b: boolean | null) => (b === null ? "–" : b ? "✓" : "✗");
const esc = (s: string | null | undefined) => (s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");

function loadRuns(dir: string): RunRecord[] {
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.startsWith(".") && !f.startsWith("report"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as RunRecord)
    .filter((r) => r && typeof r.storeId === "string" && Array.isArray(r.observations));
}

function summarizePersonas(runs: RunRecord[]): PersonaSummary[] {
  const groups = new Map<string, Observation[]>();
  for (const r of runs) {
    const seen = new Set<string>();
    for (const o of r.observations) {
      if (seen.has(o.agent)) continue;
      seen.add(o.agent);
      const k = `${r.storeId}\u0000${o.agent}`;
      groups.set(k, [...(groups.get(k) ?? []), o]);
    }
  }
  return [...groups.entries()].map(([k, obs]) => {
    const [storeId, agent] = k.split("\u0000");
    const keyOf = (o: Observation) => `${outcomeOf(o)}@${o.stoppedAt ?? "-"}`;
    const distribution: Record<string, number> = {};
    for (const o of obs) distribution[keyOf(o)] = (distribution[keyOf(o)] ?? 0) + 1;
    const [modeKey, modeCount] = Object.entries(distribution).sort((a, b) => b[1] - a[1])[0];
    const modal = obs.find((o) => keyOf(o) === modeKey)!;
    return { storeId, agent, archetype: modal.archetype, runs: obs.length, outcome: outcomeOf(modal), stoppedAt: modal.stoppedAt, reason: modal.reason, consistency: modeCount / obs.length, distribution };
  });
}

function compare(truth: GroundTruth[], personas: PersonaSummary[]): Comparison[] {
  return truth.flatMap((g) => {
    const arch: Archetype = g.method === "fetcher" ? "feed-reader" : "browser-agent";
    const t = truthOutcome(g);
    const candidates = personas.filter((p) => p.storeId === g.storeId && p.archetype === arch);
    // When ground truth comes from a specific product and we simulate that same product, compare like with like.
    const twin = g.agent === "claude-user-fetcher" ? candidates.filter((p) => p.agent === "claude-user") : [];
    return (twin.length ? twin : candidates).map((p) => ({
      storeId: g.storeId,
      truthAgent: g.agent,
      method: g.method,
      persona: p.agent,
      ours: { outcome: p.outcome, stoppedAt: p.stoppedAt, reason: p.reason },
      truth: { outcome: t, stoppedAt: g.stoppedAt, reason: g.reason },
      outcomeMatch: p.outcome === t,
      // Both sides succeeding is a step match even though the engine records the payment gate as its stop.
      stepMatch: p.stoppedAt === g.stoppedAt || (reached(p.outcome) && reached(t)) || (p.outcome === t && p.outcome === "pass"),
      falseAlarm: blockedOut(p.outcome) && reached(t),
      miss: reached(p.outcome) && blockedOut(t),
    }));
  });
}

function archOutcome(ps: PersonaSummary[], arch: Archetype): Outcome {
  const xs = ps.filter((p) => p.archetype === arch);
  if (!xs.length || xs.every((p) => p.outcome === "error")) return "error";
  if (xs.some((p) => reached(p.outcome))) return arch === "feed-reader" ? "pass" : "reach_checkout";
  return arch === "feed-reader" ? "fail" : "blocked";
}

function checkExpectations(personas: PersonaSummary[], storeIds: string[]): ExpectationCheck[] {
  const file = path.join(BENCH_DIR, "expected.json");
  if (!fs.existsSync(file)) return [];
  const expected = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, Expected>;
  return storeIds.filter((id) => expected[id]).map((id) => {
    const e = expected[id];
    const ps = personas.filter((p) => p.storeId === id);
    const feed = archOutcome(ps, "feed-reader");
    const browser = archOutcome(ps, "browser-agent");
    const blockedAt = ps.filter((p) => p.archetype === "browser-agent" && p.outcome === "blocked").map((p) => p.stoppedAt);
    return {
      storeId: id,
      expected: e,
      ours: { feedReader: feed, browserAgent: browser, blockedAt },
      feedMatch: feed === e.feedReader,
      browserMatch: browser === e.browserAgent,
      blockedAtMatch: e.browserAgent === "blocked" && e.blockedAt ? blockedAt.includes(e.blockedAt) : null,
      uncertain: !!e.uncertain,
    };
  });
}

function rate(xs: Comparison[], f: (c: Comparison) => boolean) {
  return xs.length ? xs.filter(f).length / xs.length : null;
}

function render(dir: string, runs: RunRecord[], personas: PersonaSummary[], comps: Comparison[], expects: ExpectationCheck[], truthCount: number) {
  const storeIds = [...new Set(runs.map((r) => r.storeId))];
  const lines: string[] = [`# Bench report`, ``, `Results: \`${dir}\``, ``, `Runs: ${runs.length} · stores: ${storeIds.length} · run errors: ${runs.filter((r) => r.error).length} · ground-truth rows: ${truthCount}`, ``];

  lines.push(`## Summary per store`, ``, `| store | feed-reader (ours) | browser-agent (ours) | min consistency | ground truth | match |`, `|---|---|---|---|---|---|`);
  for (const id of storeIds) {
    const ps = personas.filter((p) => p.storeId === id);
    const fmt = (arch: Archetype) => ps.filter((p) => p.archetype === arch).map((p) => `${p.agent}: ${p.outcome}${p.stoppedAt && p.outcome !== "pass" ? `@${p.stoppedAt}` : ""}`).join("<br>") || "–";
    const cons = ps.length ? Math.min(...ps.map((p) => p.consistency)) : 0;
    const cs = comps.filter((c) => c.storeId === id);
    const truthAgents = [...new Set(cs.map((c) => `${c.truthAgent}|${c.method}`))];
    const gt = truthAgents.map((k) => { const c = cs.find((x) => `${x.truthAgent}|${x.method}` === k)!; return `${c.truthAgent}: ${c.truth.outcome}${c.truth.stoppedAt ? `@${c.truth.stoppedAt}` : ""}`; }).join("<br>") || "–";
    const match = truthAgents.map((k) => { const xs = cs.filter((x) => `${x.truthAgent}|${x.method}` === k); return `${xs.filter((x) => x.outcomeMatch).length}/${xs.length} ${mark(xs.some((x) => x.outcomeMatch))}`; }).join("<br>") || "–";
    lines.push(`| ${id} | ${fmt("feed-reader")} | ${fmt("browser-agent")} | ${pct(cons)} | ${gt} | ${match} |`);
  }

  lines.push(``, `## Consistency per store × persona`, ``, `| store | persona | runs | modal | consistency | distribution |`, `|---|---|---|---|---|---|`);
  for (const p of personas) lines.push(`| ${p.storeId} | ${p.agent} | ${p.runs} | ${p.outcome}${p.stoppedAt ? `@${p.stoppedAt}` : ""} | ${pct(p.consistency)} | ${Object.entries(p.distribution).map(([k, v]) => `${k}×${v}`).join(", ")} |`);

  lines.push(``, `## Agreement vs ground truth`, ``);
  if (!comps.length) lines.push(`No ground truth matched these stores.`);
  else {
    const r = (f: (c: Comparison) => boolean) => { const x = rate(comps, f); return x === null ? "–" : pct(x); };
    lines.push(`| metric | value |`, `|---|---|`, `| comparisons | ${comps.length} |`, `| outcome match | ${r((c) => c.outcomeMatch)} |`, `| step match | ${r((c) => c.stepMatch)} |`, `| false alarm (we blocked, truth reached) | ${r((c) => c.falseAlarm)} |`, `| miss (we reached, truth blocked) | ${r((c) => c.miss)} |`, ``);
    lines.push(`| store | truth agent | method | persona | ours | truth | outcome | step |`, `|---|---|---|---|---|---|---|---|`);
    for (const c of comps) lines.push(`| ${c.storeId} | ${c.truthAgent} | ${c.method} | ${c.persona} | ${c.ours.outcome}@${c.ours.stoppedAt ?? "-"} | ${c.truth.outcome}@${c.truth.stoppedAt ?? "-"} | ${mark(c.outcomeMatch)} | ${mark(c.stepMatch)} |`);
    const byTruth = new Map<string, Comparison[]>();
    for (const c of comps) { const k = `${c.storeId} / ${c.truthAgent}`; byTruth.set(k, [...(byTruth.get(k) ?? []), c]); }
    lines.push(``, `Best / worst persona per ground-truth row:`, ``);
    for (const [k, xs] of byTruth) {
      const score = (c: Comparison) => Number(c.outcomeMatch) * 2 + Number(c.stepMatch);
      const sorted = [...xs].sort((a, b) => score(b) - score(a));
      lines.push(`- ${k}: best ${sorted[0].persona} (${mark(sorted[0].outcomeMatch)}/${mark(sorted[0].stepMatch)}), worst ${sorted.at(-1)!.persona} (${mark(sorted.at(-1)!.outcomeMatch)}/${mark(sorted.at(-1)!.stepMatch)})`);
    }
  }

  if (expects.length) {
    const counted = expects.filter((e) => !e.uncertain);
    const ok = counted.filter((e) => e.feedMatch && e.browserMatch && e.blockedAtMatch !== false).length;
    lines.push(``, `## Designed expectations (fixtures)`, ``, `All-match: ${ok}/${counted.length} (uncertain excluded: ${expects.length - counted.length})`, ``, `| case | feed exp/ours | browser exp/ours | blockedAt exp/ours | match |`, `|---|---|---|---|---|`);
    for (const e of expects) lines.push(`| ${e.storeId}${e.uncertain ? " (uncertain)" : ""} | ${e.expected.feedReader}/${e.ours.feedReader} ${mark(e.feedMatch)} | ${e.expected.browserAgent}/${e.ours.browserAgent} ${mark(e.browserMatch)} | ${e.expected.blockedAt ?? "-"}/${e.ours.blockedAt.join(",") || "-"} ${mark(e.blockedAtMatch)} | ${mark(e.feedMatch && e.browserMatch && e.blockedAtMatch !== false)} |`);
  }

  lines.push(``, `## Mismatches`, ``);
  const mism = comps.filter((c) => !c.outcomeMatch || !c.stepMatch);
  const expMism = expects.filter((e) => !e.feedMatch || !e.browserMatch || e.blockedAtMatch === false);
  if (!mism.length && !expMism.length) lines.push(`None.`);
  for (const c of mism) {
    lines.push(`- **${c.storeId}** · ${c.persona} vs ${c.truthAgent} (${c.method})${c.falseAlarm ? " · FALSE ALARM" : c.miss ? " · MISS" : ""}`);
    lines.push(`  - ours: ${c.ours.outcome}@${c.ours.stoppedAt ?? "-"} — ${esc(c.ours.reason) || "no reason"}`);
    lines.push(`  - truth: ${c.truth.outcome}@${c.truth.stoppedAt ?? "-"} — ${esc(c.truth.reason)}`);
  }
  for (const e of expMism) {
    const ps = personas.filter((p) => p.storeId === e.storeId && p.outcome !== "pass" && p.outcome !== "reach_checkout");
    lines.push(`- **${e.storeId}** (designed${e.uncertain ? ", uncertain" : ""}) · expected feed=${e.expected.feedReader} browser=${e.expected.browserAgent}${e.expected.blockedAt ? `@${e.expected.blockedAt}` : ""}; ours feed=${e.ours.feedReader} browser=${e.ours.browserAgent}`);
    for (const p of ps) lines.push(`  - ${p.agent}: ${esc(p.reason) || "no reason"}`);
  }

  const errs = runs.filter((r) => r.error);
  if (errs.length) {
    lines.push(``, `## Run errors`, ``);
    for (const r of errs) lines.push(`- ${r.storeId} #${r.rep}: ${esc(r.error)}`);
  }
  return lines.join("\n") + "\n";
}

const dir = process.argv[2];
if (!dir || !fs.existsSync(dir)) { console.error("usage: bench:score <resultsDir>"); process.exit(1); }
const resultsDir = path.resolve(dir);
const runs = loadRuns(resultsDir);
if (!runs.length) { console.error(`no run JSONs in ${resultsDir}`); process.exit(1); }
const storeIds = [...new Set(runs.map((r) => r.storeId))];
const truth = loadGroundTruth().filter((g) => storeIds.includes(g.storeId));
const personas = summarizePersonas(runs);
const comps = compare(truth, personas);
const expects = checkExpectations(personas, storeIds);

// Store level: an archetype "agrees" with a ground-truth row when most of our personas of that archetype got the same outcome.
function storeLevel(method: "fetcher" | "browser-agent") {
  const rows = truth.filter((g) => g.method === method);
  let match = 0;
  const kind = (o: string) => (reached(o as Outcome) ? "ok" : "blocked");
  for (const g of rows) {
    const cs = comps.filter((c) => c.storeId === g.storeId && c.truthAgent === g.agent);
    const agree = cs.filter((c) => kind(c.ours.outcome) === kind(c.truth.outcome)).length;
    if (cs.length && agree * 2 > cs.length) match++;
  }
  return { match, total: rows.length };
}

const totals = {
  storeLevel: { browser: storeLevel("browser-agent"), feed: storeLevel("fetcher") },
  runs: runs.length,
  runErrors: runs.filter((r) => r.error).length,
  meanConsistency: personas.length ? personas.reduce((a, p) => a + p.consistency, 0) / personas.length : null,
  comparisons: comps.length,
  outcomeMatch: rate(comps, (c) => c.outcomeMatch),
  stepMatch: rate(comps, (c) => c.stepMatch),
  falseAlarm: rate(comps, (c) => c.falseAlarm),
  miss: rate(comps, (c) => c.miss),
  expectations: expects.length ? { checked: expects.filter((e) => !e.uncertain).length, allMatch: expects.filter((e) => !e.uncertain && e.feedMatch && e.browserMatch && e.blockedAtMatch !== false).length } : null,
};

fs.writeFileSync(path.join(resultsDir, "report.md"), render(resultsDir, runs, personas, comps, expects, truth.length));
fs.writeFileSync(path.join(resultsDir, "report.json"), JSON.stringify({ totals, personas, comparisons: comps, expectations: expects }, null, 2));
console.log(JSON.stringify(totals));
console.error(`wrote ${path.join(resultsDir, "report.md")}`);
