# Auditing harness design

Store URL in → recon + Seen + Listed (deterministic, parallel) → Buyable (Playwright + Grok) → rule-based verdicts and fix list. One `RunResult` JSON is the contract between worker and dashboard.

## Decisions

| Question | Decision | Why |
|---|---|---|
| Plan-then-execute or fixed ladder? | **Fixed ladder** home → search → product → add_to_cart → checkout → place_order. LLM only picks the next action inside a step. | A planning hop adds an LLM call and a failure mode with nothing visible on stage. |
| "Analyze the website" | **Thin recon, no LLM**: robots.txt for AI bots, platform (Shopify / Woo / custom), one product URL (path match → `/products.json` → homepage links → sitemap). | Product URL lets `search` skip the flakiest UI on real stores. |
| How the LLM sees the page | Playwright **aria snapshot with refs**: `page.locator("body").ariaSnapshot({ mode: "ai" })` → `button "Add to cart" [ref=e2]` → `page.locator("aria-ref=e2").click()`. Verified on installed Playwright 1.63. | No hallucinated CSS selectors, no DOM injection, ~15 lines. |
| Model | `grok-4.3`, `reasoning_effort: "low"`, `response_format: json_object`. Text only, no screenshots to the LLM. | `grok-4-fast` was retired May 2026 and redirects. Screenshots go to the dashboard, not the model. |
| Who decides pass/fail | **Deterministic verify rule per step**. LLM `done` is not trusted. | Same result every run on stage. |
| Who writes the fix list | **Rule table**, keyed by failure class. LLM `why` becomes `evidence` only. | "Is the fix real?" gets the same answer every time. |
| Blockers | Heuristics before every LLM call: full-screen `position:fixed` overlay, `input[type=password]` on cart/checkout, CAPTCHA iframes, Playwright "intercepts pointer events". | Plain-English reason without trusting the LLM. |

## Layers

### 1. Crawler (no LLM, 15s each, run in parallel)

**Recon**
- `robots.txt` via `robots-parser`, check GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, GrokBot → `blockedBots`.
- Platform sniff: `cdn.shopify.com` / `/products/` → shopify, `woocommerce` → woocommerce, else custom.
- Product URL discovery, first hit wins: URL already matches `/products?/|/p/|/item/|/dp/` → `{origin}/products.json?limit=1` → first same-origin homepage link matching the pattern → sitemap `<loc>` containing `/product` → fall back to homepage and note it.

**Seen**
- Fetch product URL as GPTBot UA, `Accept: text/html`, 15s timeout, follow redirects, 2MB cap. On 403/429/503 retry once as ChatGPT-User. Still blocked → fail, "bot protection blocks AI fetchers".
- Rendered truth: Playwright, `domcontentloaded` + 2s settle, block images/fonts. Extract body text, first `h1`, first price token.
- Pass = `rawText/renderedText ≥ 0.6` AND h1 in raw AND price in raw.
- Reuse the raw HTML for Listed (one fetch).

**Listed**
- Parse all JSON-LD, handle `@graph`, arrays, `@type` arrays, `ProductGroup.hasVariant[0]`, `AggregateOffer`.
- Required: `name`, `image`, `offers.price`, `offers.priceCurrency`. Recommended (notes only): `description`, `brand`, `offers.availability`, `offers.url`, `sku|gtin`.
- Bonus note: `/products.json` 200 → "Shopify feed available".

### 2. Agent (Buyable)

Per step: `verify(page)` → if true, step ok. Else `blockers(page)` → captcha/login ends the step failed. Else snapshot → one LLM call → one action → repeat. Max 4 actions for search/product, 3 for the rest. Run cap 20 actions / 90s. Progress written to DB after every step.

| Step | Goal | Verify |
|---|---|---|
| home | Land, products visible | snapshot has ≥1 link/button |
| search | Reach a product list, or go to recon `productUrl` | ≥1 link with price or `/product` in href |
| product | Open product page | URL changed and a button matching `/add to (cart|bag|basket)/i` |
| add_to_cart | Add it | snapshot or URL contains `cart|bag|basket` |
| checkout | Guest details: Test Buyer, buyer@example.com, 1 Test St, London, E1 6AN | URL contains `checkout`, has name/email/address textboxes, no password box |
| place_order | Live store: **stop, never run**. Demo store: card 4242 | `[data-testid=order-confirmed]` visible |

Action schema: `click {ref}`, `fill {ref, value}`, `done`, `stuck {class, why}` where class ∈ popup, login, captcha, broken_form, not_found.

Failure → reason text (heuristic beats LLM):
- overlay → "A popup covered the page at {step} and could not be dismissed."
- password → "Checkout requires an account login; guest checkout is not available."
- captcha → "A CAPTCHA blocked the agent at {step}."
- intercepts pointer events → "Could not click '{target}' because '{blocker}' was on top of it."
- empty snapshot → "Page shows nothing to an automated browser (JS-only or blocked)."
- exhausted → "Could not {goal} after N attempts. {LLM why}"

### 3. Reasoning (rule-based)

| Class | Evidence | Fix |
|---|---|---|
| js_only | seen ratio < 0.6 or h1 missing in raw | Render product data server-side |
| price_client_only | price missing in raw | Server-render price and availability |
| waf_block | 403 to bot UA | Allow AI fetcher user-agents through bot protection |
| robots_block | blockedBots non-empty | Allow GPTBot, ClaudeBot, PerplexityBot in robots.txt |
| no_schema | no Product JSON-LD | Add schema.org Product JSON-LD |
| schema_incomplete | required field missing | Add {fields} to Product schema |
| popup | overlay at any step | Don't gate content behind modals; defer popup until after first interaction |
| login | password field at checkout | Enable guest checkout |
| captcha | CAPTCHA iframe | Exempt verified agents from CAPTCHA |
| broken_form | fill/submit failed | Fix checkout form: labelled inputs, name attributes |
| not_found | step exhausted | Make {step} reachable with a semantic button/link |

Overall = highest rung passed: invisible → seen → listed → buyable. Summary line: "Buyable stopped at checkout: forced sign-in."

LLM failure: 1 retry → fallback provider → step `failed` "LLM unavailable", buyable `skipped`. `runAudit` never throws; a check exception becomes `skipped` with the message in notes.

## Schema additions (packages/shared)

```ts
export const FailureClass = z.enum(["js_only","price_client_only","waf_block","robots_block","no_schema","schema_incomplete","popup","login","captcha","broken_form","not_found","timeout","llm_error"]);

AgentStep + { status: "running" | ..., failureClass?, evidence?, startedAt }
// screenshot becomes a web path: /screenshots/<runId>/<step>.png (worker writes to apps/web/public/screenshots)
SeenResult + { blockedBots: string[], httpStatus: number }
Fix + { failureClass, step? }
RunResult + { recon?: { platform, productUrl?, blockedBots, notes }, overall?, summary? }
```

## Safety

- `liveStore` derived server-side: `!storeUrl.startsWith(DEMO_STORE_URL)`. Client can't flip it.
- Live: `place_order` never runs; checkout goal forbids card entry; executor refuses any target matching `/place order|pay now|complete order/i`.
- Demo store: test card 4242 only.
- Backup: `DEMO_REPLAY=1` serves two recorded `RunResult` fixtures (broken, fixed) with 1s delays. Record them once the real path works.

## Demo store tweak

Popup close button is `opacity-0` with `aria-label="close"`; the snapshot exposes it and Grok may dismiss it. Make it `hidden` so the popup genuinely blocks.

## Build order

1. `llm.ts`: grok-4.3, reasoning_effort low, retry + fallback.
2. `agent.ts`: aria snapshot refs, verify rules, blocker heuristics, screenshots to web public dir, per-step progress.
3. Shared schema additions + `fixes()` rule table in `audit.ts`.
4. `recon.ts` + seen/listed upgrades (one fetch, h1/price rule, robots).
5. Dashboard: screenshots in timeline, summary line.
6. Record replay fixtures.

## Unverified

- Grok image input part shape via OpenAI SDK (skipped by design).
- Exact xAI crawler UA token (`GrokBot` from third parties only).
- The 0.6 ratio threshold is a heuristic.
