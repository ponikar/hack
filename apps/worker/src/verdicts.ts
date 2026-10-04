import type { Fix, FixClass, RunVerdicts, SessionResult, StoreProfile, Verdict } from "@watchdog/shared";

const FIXES: Record<FixClass, { check: Fix["check"]; title: string; detail: string }> = {
  js_only: { check: "seen", title: "Render product data server-side", detail: "AI fetchers do not run JavaScript. Put product name, price and description in the HTML the server sends." },
  no_schema: { check: "listed", title: "Add schema.org Product JSON-LD", detail: "Include name, image, offers.price and offers.priceCurrency so shopping systems can list the product." },
  no_feed: { check: "listed", title: "Publish a product feed", detail: "ChatGPT Shopping, Perplexity and Google pick products from merchant feeds. Shopify and WooCommerce expose one automatically." },
  robots_block: { check: "seen", title: "Allow AI crawlers in robots.txt", detail: "GPTBot, ClaudeBot and PerplexityBot are disallowed. They will never learn your catalogue." },
  waf_block: { check: "buyable", title: "Let AI agents through bot protection", detail: "Your WAF serves a challenge or error page to agent browsers. Allowlist known agent user-agents or use Web Bot Auth." },
  captcha: { check: "buyable", title: "Exempt verified agents from CAPTCHA", detail: "A CAPTCHA ends every agent purchase. Use an invisible challenge or allowlist signed agents." },
  popup: { check: "buyable", title: "Don't gate the page behind a popup", detail: "A full-screen modal blocked the agent. Defer newsletter and consent popups until after the first interaction, and give them a real close button." },
  login: { check: "buyable", title: "Enable guest checkout", detail: "Checkout demanded an account. Agents shop as guests; a login wall loses the sale." },
  broken_form: { check: "buyable", title: "Fix the checkout form", detail: "Inputs need labels and name attributes so an agent can fill them." },
  not_found: { check: "buyable", title: "Use semantic buttons for cart and checkout", detail: "The agent could not find the control. Use a <button> or <a> with visible text like Add to cart, Checkout." },
  timeout: { check: "buyable", title: "Speed up the storefront", detail: "The page did not settle in time. Agents give up on slow stores." },
  llm_error: { check: "buyable", title: "Rerun the audit", detail: "The agent's model was unavailable during this run." },
};

function fix(cls: FixClass, personas: string[]): Fix {
  return { fixClass: cls, ...FIXES[cls], personas };
}

function blockerClass(r: SessionResult): FixClass | null {
  const s = r.steps.find((x) => x.status === "blocked" || x.status === "failed");
  if (!s) return null;
  if (s.blocker === "login") return "login";
  if (s.blocker === "overlay") return "popup";
  if (s.blocker === "captcha") return "captcha";
  if (s.blocker === "waf" || s.blocker === "challenge") return "waf_block";
  if (/budget exceeded|timeout/i.test(s.reason ?? "")) return "timeout";
  if (/llm|model/i.test(s.reason ?? "")) return "llm_error";
  if (r.archetype === "feed-reader") return "js_only";
  if (/no matching control/i.test(s.reason ?? "")) return "not_found";
  return "broken_form";
}

export function computeVerdicts(profile: StoreProfile, results: SessionResult[]): RunVerdicts {
  const feed = results.filter((r) => r.archetype === "feed-reader");
  const browser = results.filter((r) => r.archetype === "browser-agent");
  const v = (xs: SessionResult[]): Verdict => (xs.length === 0 ? "skipped" : xs.some((r) => r.status === "pass") ? "pass" : "fail");

  const seen = v(feed);
  const listed: Verdict = profile.structuredData.productJsonLd || profile.structuredData.feed ? "pass" : "fail";
  const buyable = v(browser);

  const byClass = new Map<FixClass, Set<string>>();
  const add = (cls: FixClass, persona: string) => byClass.set(cls, new Set([...(byClass.get(cls) ?? []), persona]));

  for (const r of feed) {
    if (r.status === "pass") continue;
    const s = r.steps.find((x) => x.status === "blocked" || x.status === "failed");
    add(s?.blocker === "robots" ? "robots_block" : s?.blocker === "waf" ? "waf_block" : "js_only", r.persona);
  }
  if (!profile.structuredData.productJsonLd) ["chatgpt-shopping", "google-ai-mode"].forEach((p) => add("no_schema", p));
  if (!profile.structuredData.feed && listed === "fail") ["chatgpt-shopping", "perplexity-search"].forEach((p) => add("no_feed", p));
  Object.entries(profile.ai.robotsAllows).filter(([, ok]) => !ok).forEach(([bot]) => add("robots_block", bot));
  if (profile.hostility.captcha && buyable !== "pass") browser.forEach((r) => add("captcha", r.persona));
  for (const r of browser) {
    if (r.status === "pass") continue;
    const cls = blockerClass(r);
    if (cls) add(cls, r.persona);
  }
  const fixes = [...byClass.entries()].map(([cls, personas]) => fix(cls, [...personas]));

  const overall = buyable === "pass" ? "buyable" : listed === "pass" && seen === "pass" ? "listed" : seen === "pass" ? "seen" : "invisible";
  const firstBrowserFail = browser.find((r) => r.status !== "pass");
  const summary =
    overall === "buyable"
      ? "AI buyers can see, find and buy from this store."
      : firstBrowserFail
        ? firstBrowserFail.summary
        : seen === "fail"
          ? "AI fetchers see an empty page. Nothing to list, nothing to buy."
          : "Store is visible but not listable.";

  return { seen, listed, buyable, overall, summary, fixes };
}
