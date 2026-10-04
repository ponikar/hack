import type { Archetype, SessionResult, StepResult } from "@watchdog/shared";

export type StepLabel = "home" | "search" | "product" | "variant" | "add_to_cart" | "cart" | "checkout" | "payment" | "fetch";
export const STEP_LABELS: StepLabel[] = ["home", "search", "product", "variant", "add_to_cart", "cart", "checkout", "payment", "fetch"];

export type Observation = {
  agent: string;
  archetype: Archetype;
  reachedCheckout: boolean | null;
  stoppedAt: StepLabel | null;
  reason: string | null;
  blocker: string | null;
  template?: string;
};

const PRODUCT_URL_RE = /\/(products?|p|item|shop)\/[^/?#]+/i;

export function gotoLabel(url: string): StepLabel {
  let path = url;
  try { path = new URL(url).pathname; } catch { /* relative or invalid: match raw */ }
  if (/checkout/i.test(path)) return "checkout";
  if (/\/cart\b/i.test(path)) return "cart";
  if (/search/i.test(path)) return "search";
  if (PRODUCT_URL_RE.test(path)) return "product";
  return "home";
}

export function actLabel(instr: string): StepLabel | null {
  const s = instr.toLowerCase().replace(/'[^']*'/g, "''");
  if (/place the order|pay now|complete (order|purchase)|payment/.test(s)) return "payment";
  if (/proceed to checkout|buy now/.test(s)) return "checkout";
  if (/without choosing|choose|select variant|any available option/.test(s)) return "variant";
  if (/cart drawer|cart icon|view cart|open (the )?cart/.test(s)) return "cart";
  if (/add to cart/.test(s)) return "add_to_cart";
  if (/search/.test(s)) return "search";
  if (/open the product|first in-stock product|open .*product/.test(s)) return "product";
  return null;
}

export function stepLabel(step: Pick<StepResult, "op" | "label" | "url">, context: StepLabel = "home"): StepLabel {
  if (step.op === "fetch") return "fetch";
  if (step.op === "stop") return /payment/i.test(step.label) ? "payment" : context;
  if (step.op === "goto") return gotoLabel(step.label.replace(/^open\s+/, ""));
  if (step.op === "dismiss") return context;
  return actLabel(step.label) ?? context;
}

export function normalize(r: SessionResult): Observation {
  const base = { agent: r.persona, archetype: r.archetype, template: r.template };
  let context: StepLabel = "home";
  let bad: StepResult | undefined;
  let badLabel: StepLabel | null = null;
  let stoppedAtPayment = false;
  for (const s of r.steps) {
    const l = stepLabel(s, context);
    if (s.status === "failed" || s.status === "blocked") { bad = s; badLabel = l; break; }
    if (s.status === "stopped") { if (l === "payment") stoppedAtPayment = true; badLabel = l; break; }
    if (s.status === "ok") context = l;
  }

  if (r.archetype === "feed-reader") {
    const failed = r.status !== "pass";
    return { ...base, reachedCheckout: null, stoppedAt: failed ? "fetch" : null, reason: failed ? bad?.reason ?? r.summary : null, blocker: bad?.blocker ?? null };
  }

  if (bad?.blocker === "llm") return { ...base, reachedCheckout: null, stoppedAt: null, reason: `error: ${bad.reason}`, blocker: "error" };

  if (r.status === "pass") {
    return { ...base, reachedCheckout: true, stoppedAt: stoppedAtPayment ? "payment" : badLabel, reason: stoppedAtPayment ? "payment gate" : null, blocker: null };
  }
  return { ...base, reachedCheckout: false, stoppedAt: badLabel, reason: bad?.reason ?? r.summary, blocker: bad?.blocker ?? null };
}

export function errorObservation(agent: string, archetype: Archetype, message: string): Observation {
  return { agent, archetype, reachedCheckout: null, stoppedAt: null, reason: `error: ${message}`, blocker: "error" };
}
