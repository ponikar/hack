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

export const Platform = z.enum(["shopify", "woocommerce", "bigcommerce", "magento", "custom", "unknown"]);
export type Platform = z.infer<typeof Platform>;

export const AI_BOTS = ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "GrokBot"] as const;

export const StoreProfile = z.object({
  url: z.string().url(),
  finalUrl: z.string().url(),
  profiledAt: z.string(),
  durationMs: z.number(),
  platform: z.object({ name: Platform, confidence: z.number(), signals: z.array(z.string()) }),
  rendering: z.object({ jsOnly: z.boolean(), framework: z.string().optional(), visibleTextLength: z.number() }),
  products: z.object({
    source: z.enum(["shopify_json", "woo_store_api", "sitemap", "jsonld", "links", "none"]),
    sampleUrls: z.array(z.string()),
    sampleNames: z.array(z.string()),
    variantsRequired: z.boolean(),
    optionNames: z.array(z.string()),
  }),
  structure: z.object({
    searchUrl: z.string().optional(),
    categoryUrls: z.array(z.string()),
    cart: z.enum(["page", "drawer", "unknown"]),
    cartUrl: z.string().optional(),
    checkoutHost: z.string().optional(),
    guestCheckout: z.enum(["yes", "no", "unknown"]),
  }),
  hostility: z.object({
    botProtection: z.string().optional(),
    captcha: z.string().optional(),
    cookieBanner: z.string().optional(),
    newsletterPopup: z.boolean(),
    loginWall: z.boolean(),
    blockedStatus: z.number().optional(),
  }),
  ai: z.object({
    robotsAllows: z.record(z.boolean()),
    llmsTxt: z.boolean(),
    agentsMd: z.boolean(),
  }),
  structuredData: z.object({
    productJsonLd: z.boolean(),
    itemList: z.boolean(),
    feed: z.string().optional(),
  }),
  category: z.string(),
  searchQueries: z.array(z.string()),
  journeyHints: z.array(z.string()),
  confidence: z.number(),
  notes: z.array(z.string()),
});
export type StoreProfile = z.infer<typeof StoreProfile>;

export const Archetype = z.enum(["feed-reader", "browser-agent"]);
export type Archetype = z.infer<typeof Archetype>;

export const Persona = z.object({ id: z.string(), label: z.string(), archetype: Archetype });
export type Persona = z.infer<typeof Persona>;

export const TemplateId = z.enum(["feed-reader", "direct-link", "search-first", "category-browse", "variant-required", "cart-drawer", "buy-now"]);
export type TemplateId = z.infer<typeof TemplateId>;

export const Expect = z.object({
  urlContains: z.string().optional(),
  urlHost: z.string().optional(),
  text: z.string().optional(),
  anyOf: z.array(z.string()).optional(),
});
export type Expect = z.infer<typeof Expect>;

export const SessionStep = z.discriminatedUnion("op", [
  z.object({ op: z.literal("goto"), url: z.string() }),
  z.object({ op: z.literal("fetch"), url: z.string(), expect: Expect }),
  z.object({ op: z.literal("dismiss"), what: z.string(), optional: z.boolean() }),
  z.object({ op: z.literal("act"), instr: z.string(), expect: Expect, requiredIf: z.string().optional() }),
  z.object({ op: z.literal("stop"), reason: z.string() }),
]);
export type SessionStep = z.infer<typeof SessionStep>;

export const Session = z.object({
  id: z.string(),
  persona: z.string(),
  archetype: Archetype,
  template: TemplateId,
  goal: z.string(),
  steps: z.array(SessionStep),
  maxSteps: z.number(),
  budgetMs: z.number(),
  liveStore: z.boolean(),
});
export type Session = z.infer<typeof Session>;

export const StepStatus = z.enum(["ok", "failed", "blocked", "skipped", "stopped"]);
export type StepStatus = z.infer<typeof StepStatus>;

export const StepResult = z.object({
  index: z.number(),
  op: z.string(),
  label: z.string(),
  status: StepStatus,
  reason: z.string().optional(),
  blocker: z.string().optional(),
  screenshot: z.string().optional(),
  url: z.string().optional(),
  ms: z.number(),
});
export type StepResult = z.infer<typeof StepResult>;

export const SessionResult = z.object({
  sessionId: z.string(),
  persona: z.string(),
  archetype: Archetype,
  template: TemplateId,
  goal: z.string(),
  status: z.enum(["pass", "fail", "blocked"]),
  failedStep: z.number().optional(),
  summary: z.string(),
  steps: z.array(StepResult),
  durationMs: z.number(),
});
export type SessionResult = z.infer<typeof SessionResult>;
