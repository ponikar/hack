import type { AuditJob, Fix, RunResult } from "@watchdog/shared";
import { buyableCheck } from "./agent";
import { listedCheck } from "./listed";
import { seenCheck } from "./seen";

function fixes(r: RunResult): Fix[] {
  const out: Fix[] = [];
  if (r.seen?.verdict === "fail") out.push({ check: "seen", title: "Render product data server-side", detail: "AI fetchers do not run JavaScript. Use SSR or static HTML for product name, price and description." });
  if (r.listed?.verdict === "fail") out.push({ check: "listed", title: "Add schema.org Product JSON-LD", detail: `Include ${r.listed.missingFields.join(", ")} so shopping systems can list the product.` });
  if (r.buyable?.failingStep) {
    const s = r.buyable.steps.find((x) => x.step === r.buyable!.failingStep);
    out.push({ check: "buyable", title: `Unblock the ${r.buyable.failingStep} step`, detail: s?.reason ?? "Agent could not continue." });
  }
  return out;
}

export async function runAudit(job: AuditJob, onProgress?: (partial: RunResult) => Promise<void>): Promise<RunResult> {
  const result: RunResult = { storeUrl: job.storeUrl, mode: job.mode, startedAt: new Date().toISOString(), fixes: [] };

  result.seen = await seenCheck(job.storeUrl);
  await onProgress?.(result);

  result.listed = await listedCheck(job.storeUrl);
  await onProgress?.(result);

  result.buyable = await buyableCheck(job.storeUrl, { liveStore: job.liveStore });
  result.fixes = fixes(result);
  result.finishedAt = new Date().toISOString();
  return result;
}
