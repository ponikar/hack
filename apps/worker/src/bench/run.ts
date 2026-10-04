import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { RunVerdicts, Session, SessionResult, StoreProfile } from "@watchdog/shared";
import { BENCH_STORES, type BenchStore } from "./stores";
import { errorObservation, normalize, type Observation } from "./normalize";
import { PERSONAS } from "../sessions/personas";
import { BENCH_DIR } from "./ground-truth";

export type LlmUsage = { calls: number; refused: number; promptTokens: number; completionTokens: number; images: number; strongCalls: number };
export type RunRecord = {
  llm?: LlmUsage;
  storeId: string;
  rep: number;
  url: string;
  startedAt: string;
  durationMs: number;
  profile: StoreProfile | null;
  sessions: Session[];
  results: SessionResult[];
  verdicts: RunVerdicts | null;
  observations: Observation[];
  error?: string;
};

const TIMEOUT_MS = Number(process.env.BENCH_STORE_TIMEOUT_MS ?? 600_000);
const SELF = fileURLToPath(import.meta.url);

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function child() {
  const [url, runId, outFile, product] = [arg("url")!, arg("run-id")!, arg("child")!, arg("product")];
  const { profileStore } = await import("../profile");
  const { generateSessions } = await import("../sessions");
  const { replaySessions } = await import("../replay");
  const { computeVerdicts } = await import("../verdicts");
  const { usage, usageLine } = await import("../llm");
  const partial: Partial<RunRecord> = {};
  try {
    partial.profile = await profileStore(url);
    // A real shopper knows what they want; give the agent the store's product when the profiler could not find one.
    partial.sessions = await generateSessions(partial.profile, { productHint: product });
    partial.results = await replaySessions(partial.sessions, partial.profile, runId);
    partial.verdicts = computeVerdicts(partial.profile, partial.results);
  } catch (err) {
    partial.error = (err as Error).message.split("\n")[0];
  }
  partial.llm = { ...usage };
  console.error(usageLine());
  fs.writeFileSync(outFile, JSON.stringify(partial));
  process.exit(0);
}

function runChild(store: BenchStore, runId: string, tmpFile: string, screenshotDir: string): Promise<Partial<RunRecord>> {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [...process.execArgv, SELF, "--child", tmpFile, "--url", store.url, "--run-id", runId, ...(store.product ? ["--product", store.product] : [])], {
      stdio: ["ignore", "ignore", "inherit"],
      env: { ...process.env, SCREENSHOT_DIR: process.env.SCREENSHOT_DIR ?? screenshotDir },
    });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      p.kill("SIGTERM");
      setTimeout(() => p.kill("SIGKILL"), 5000).unref();
    }, TIMEOUT_MS);
    p.on("exit", (code) => {
      clearTimeout(timer);
      if (timedOut) return resolve({ error: `timeout after ${TIMEOUT_MS / 1000}s` });
      try {
        const data = JSON.parse(fs.readFileSync(tmpFile, "utf8")) as Partial<RunRecord>;
        fs.rmSync(tmpFile, { force: true });
        resolve(data);
      } catch {
        resolve({ error: `worker exited with code ${code} without a result` });
      }
    });
  });
}

function errorObservations(message: string): Observation[] {
  return PERSONAS.map((p) => errorObservation(p.id, p.archetype, message));
}

function summarize(r: RunRecord): string {
  const head = `${r.storeId} #${r.rep} ${(r.durationMs / 1000).toFixed(1)}s`;
  if (r.error && !r.results.length) return `${head} ERROR ${r.error}`;
  const obs = r.observations.map((o) => {
    const out = o.archetype === "feed-reader" ? (o.stoppedAt ? "fail" : "pass") : o.reachedCheckout ? "checkout" : `blocked@${o.stoppedAt}`;
    return `${o.agent}=${out}`;
  });
  return `${head} ${r.verdicts?.overall ?? "?"} | ${obs.join(" ")}${r.error ? ` | error: ${r.error}` : ""}`;
}

async function main() {
  const only = arg("only")?.split(",").map((s) => s.trim()).filter(Boolean);
  const repeat = Number(arg("repeat") ?? 3);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const out = path.resolve(arg("out") ?? path.join(BENCH_DIR, "results", stamp));
  const adhocUrl = arg("url");

  let stores: BenchStore[];
  if (adhocUrl) stores = [{ id: arg("id") ?? new URL(adhocUrl).hostname, kind: "real", url: adhocUrl }];
  else stores = only ? BENCH_STORES.filter((s) => only.includes(s.id)) : BENCH_STORES;
  if (only && !adhocUrl) {
    const unknown = only.filter((id) => !BENCH_STORES.some((s) => s.id === id));
    if (unknown.length) { console.error(`unknown store ids: ${unknown.join(", ")}`); process.exit(1); }
  }
  if (!stores.length || !Number.isInteger(repeat) || repeat < 1) { console.error("usage: bench:run [--only id,id] [--repeat N] [--out dir] [--url url --id id]"); process.exit(1); }

  fs.mkdirSync(out, { recursive: true });
  console.error(`bench: ${stores.length} store(s) x ${repeat} -> ${out}`);

  const total: LlmUsage = { calls: 0, refused: 0, promptTokens: 0, completionTokens: 0, images: 0, strongCalls: 0 };
  for (const store of stores) {
    for (let rep = 1; rep <= repeat; rep++) {
      const startedAt = new Date().toISOString();
      const t0 = Date.now();
      const runId = `bench-${store.id}-${rep}`;
      const data = await runChild(store, runId, path.join(out, `.${runId}.tmp.json`), path.join(out, "screenshots"));
      const results = data.results ?? [];
      const record: RunRecord = {
        storeId: store.id,
        rep,
        url: store.url,
        startedAt,
        durationMs: Date.now() - t0,
        profile: data.profile ?? null,
        sessions: data.sessions ?? [],
        results,
        verdicts: data.verdicts ?? null,
        observations: results.length ? results.map(normalize) : errorObservations(data.error ?? "no results"),
        ...(data.error ? { error: data.error } : {}),
        ...(data.llm ? { llm: data.llm } : {}),
      };
      if (data.llm) for (const k of Object.keys(total) as (keyof LlmUsage)[]) total[k] += data.llm[k] ?? 0;
      fs.writeFileSync(path.join(out, `${store.id}-${rep}.json`), JSON.stringify(record, null, 2));
      console.log(summarize(record));
    }
  }
  console.error(`LLM total: ${total.calls} calls (${total.strongCalls} escalated, ${total.images} with screenshots, ${total.refused} refused by cap), ${total.promptTokens} prompt + ${total.completionTokens} output tokens`);
  console.error(`done. score with: pnpm -C apps/worker bench:score ${out}`);
}

if (process.argv.includes("--child")) await child();
else await main();
