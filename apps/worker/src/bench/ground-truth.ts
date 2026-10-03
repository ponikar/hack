import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { STEP_LABELS, type StepLabel } from "./normalize";

export type GroundTruth = {
  storeId: string;
  agent: string;
  method: "browser-agent" | "fetcher";
  reachedCheckout: boolean | null;
  stoppedAt: StepLabel | null;
  reason: string;
  evidence: string[];
  observedAt: string;
  observer: string;
};

export const BENCH_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../bench");
export const GROUND_TRUTH_DIR = path.join(BENCH_DIR, "ground-truth");

function validate(row: unknown, where: string): GroundTruth {
  const r = row as GroundTruth;
  const fail = (msg: string) => { throw new Error(`${where}: ${msg}`); };
  if (!r || typeof r !== "object") fail("row is not an object");
  if (typeof r.storeId !== "string" || !r.storeId) fail("storeId missing");
  if (typeof r.agent !== "string" || !r.agent) fail("agent missing");
  if (r.method !== "browser-agent" && r.method !== "fetcher") fail(`bad method ${r.method}`);
  if (r.reachedCheckout !== null && typeof r.reachedCheckout !== "boolean") fail("reachedCheckout must be boolean or null");
  if (r.stoppedAt !== null && !STEP_LABELS.includes(r.stoppedAt)) fail(`bad stoppedAt ${r.stoppedAt}`);
  if (!Array.isArray(r.evidence)) fail("evidence must be an array");
  return r;
}

export function loadGroundTruth(dir = GROUND_TRUTH_DIR): GroundTruth[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .flatMap((f) => {
      const rows = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      if (!Array.isArray(rows)) throw new Error(`${f}: expected an array`);
      return rows.map((r, i) => validate(r, `${f}[${i}]`));
    });
}
