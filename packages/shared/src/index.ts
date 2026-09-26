import { z } from "zod";

export const StoreMode = z.enum(["broken", "fixed"]);
export type StoreMode = z.infer<typeof StoreMode>;

export const Verdict = z.enum(["pass", "fail", "skipped"]);
export type Verdict = z.infer<typeof Verdict>;

export const StepName = z.enum(["home", "search", "product", "add_to_cart", "checkout", "place_order"]);
export type StepName = z.infer<typeof StepName>;

export const AgentStep = z.object({
  step: StepName,
  status: z.enum(["ok", "failed", "stopped"]),
  reason: z.string().optional(),
  screenshot: z.string().optional(),
  url: z.string().optional(),
  durationMs: z.number().optional(),
});
export type AgentStep = z.infer<typeof AgentStep>;

export const SeenResult = z.object({
  verdict: Verdict,
  rawHtmlTextLength: z.number(),
  renderedTextLength: z.number(),
  visibleRatio: z.number(),
  missingInRawHtml: z.array(z.string()),
  notes: z.array(z.string()),
});
export type SeenResult = z.infer<typeof SeenResult>;

export const ListedResult = z.object({
  verdict: Verdict,
  hasProductSchema: z.boolean(),
  schemaFields: z.array(z.string()),
  missingFields: z.array(z.string()),
  notes: z.array(z.string()),
});
export type ListedResult = z.infer<typeof ListedResult>;

export const BuyableResult = z.object({
  verdict: Verdict,
  steps: z.array(AgentStep),
  failingStep: StepName.optional(),
  stoppedBeforePayment: z.boolean(),
});
export type BuyableResult = z.infer<typeof BuyableResult>;

export const Fix = z.object({
  title: z.string(),
  detail: z.string(),
  check: z.enum(["seen", "listed", "buyable"]),
});
export type Fix = z.infer<typeof Fix>;

export const RunResult = z.object({
  storeUrl: z.string().url(),
  mode: StoreMode.optional(),
  startedAt: z.string(),
  finishedAt: z.string().optional(),
  seen: SeenResult.optional(),
  listed: ListedResult.optional(),
  buyable: BuyableResult.optional(),
  fixes: z.array(Fix),
});
export type RunResult = z.infer<typeof RunResult>;

export const RunStatus = z.enum(["queued", "running", "done", "error"]);
export type RunStatus = z.infer<typeof RunStatus>;

export const RUN_QUEUE = "audit-run";

export const AuditJob = z.object({
  runId: z.string().uuid(),
  storeUrl: z.string().url(),
  mode: StoreMode.optional(),
  liveStore: z.boolean().default(true),
});
export type AuditJob = z.infer<typeof AuditJob>;
