# Benchmark 2026-10-03: does the engine behave like real AI agents?

**Answer: not yet.** The engine is consistent with itself but only agrees with a real browser agent on 33% of stores, and its browser personas mostly cry wolf. Feed-reader verdicts agree 82% of the time, but on real stores they are usually right for the wrong reason.

## Setup

- **Stores (23):** 13 fixture stores on production (`/bench/<case>`, one deliberate defect each, every visit logged in `agent_hits`) + 10 real stores (Allbirds, Everlane, Gymshark, Rothy's, Glossier, Patagonia, John Lewis, Nike, Bombas, Warby Parker).
- **Engine:** `bench:run --repeat 3`, 69 runs, no LLM key (deterministic fast path). Results: `bench/results/baseline-20261003-2304/` (git-ignored).
- **Ground truth (real agents, run first-hand):**
  - *Claude browser agent:* Claude driving the Claude desktop built-in browser (Chrome 152, accessibility tree + screenshots). Home → product → variant → cart → checkout, stopping before any personal data. 21 stores. `bench/ground-truth/claude-browser.json`
  - *Claude fetcher:* Claude's WebFetch on product pages. 22 stores. `bench/ground-truth/claude-fetcher.json`
- **Not covered:** ChatGPT agent, Perplexity Comet, Google, Grok. They need user accounts; their visits to fixture stores will be logged automatically when run.

## Results (store-level outcome agreement)

| | Fixture stores | Real stores | Total |
|---|---|---|---|
| Browser agent (ours vs Claude browser) | 6/11 | 1/10 | **7/21 (33%)** |
| Feed reader (ours vs Claude fetcher) | 12/13 | 6/9 | **18/22 (82%)** |
| Feed reader, right outcome *and* right reason (real stores) | | 2/9 | |
| Engine consistency across 3 repeats | | | **99%** |

Errors are lopsided: 13 stores false alarm (we said blocked, the agent got through), 1 store miss (we said fine, the agent was blocked: `login-wall`).

## Why the engine disagrees

1. **Login wall is a miss.** Live-store sessions stop at the payment gate once the checkout URL loads, without checking what the checkout page shows. A sign-in-only checkout is reported Buyable.
2. **Fast path can't operate real UIs.** Without an LLM, browser personas died on size swatches (Allbirds, Rothy's), icon-only buttons, region/newsletter modals the real agent closed (Gymshark, Glossier, Everlane), search results with no product name, "Next step" instead of "Checkout" (Warby Parker). The real agent passed all of these.
3. **Our browser is detectably automated.** Logged `navigator.webdriver = true`, Chrome 131 headless. The real agent: `webdriver = false`, Chrome 152. John Lewis refused our engine at page load (`ERR_HTTP2_PROTOCOL_ERROR`) but served the real agent.
4. **Feed readers die on `/products.json`.** Every Shopify run fetched `/products.json` first, got HTTP 429, and failed before reading a product page. Claude's fetcher read those same product pages. Matches on Allbirds/Everlane were coincidences.
5. **One user agent for every feed reader.** All four personas send GPTBot. Nike 403s GPTBot but served `Claude-User`. Different bots really get different answers.
6. **Product picking ignores stock.** The profiler takes the first product in the feed; on 4 of 5 Shopify stores it was sold out, "coming soon" or a $0 sample.

## Things real agents hit that the engine does not model

- **Stock only correct after JavaScript.** Allbirds and Everlane server HTML says "Out of stock" for products the browser agent added to cart. Every no-JS AI fetcher reports them as sold out.
- **AI fetchers get blocked or lied to.** Patagonia served Claude's fetcher a fake "site down" page, Bombas 429, Warby Parker 403, while browsers got the real store.
- **Bot protection at the cart, not the page.** Nike browses fine and blocks Add to Bag ("disable browser extensions").
- **On-site AI chat widget hijacked a checkout click** (Allbirds).
- **Silent upsell:** Everlane auto-adds £7 PackageProtect at checkout.
- **Controls missing from the accessibility tree:** Gymshark "Add to bag", Rothy's "Secure Checkout", Patagonia hero links are plain text, not buttons or links.
- **Malformed markup crashed accessibility-tree reading** on Glossier's product page; completed only via screenshots.

## First-hand facts about Claude's fetcher (from `agent_hits`)

- User agent `Claude-User (claude-code/2.1.286; +https://support.anthropic.com/)`, `Accept: text/markdown, text/html`.
- Never requested `robots.txt`; read the robots-disallowed store. (Claude Code's fetcher; claude.ai may differ.)
- Executed no JavaScript, sent no signature.

## Fix order (by accuracy impact)

1. Check the checkout page for login walls and blockers before declaring a live-store session complete.
2. Feed readers: fetch the product page first, treat `/products.json` as optional, one UA per persona.
3. Run browser personas through an LLM (aria snapshot + screenshot) instead of the fast path; keep the fast path only as a hint.
4. Real Chrome fingerprint: current Chrome, `webdriver` false, headed or stealth.
5. Pick an in-stock product (`available` in the feed).
6. New checks: stock correct without JS, fake/maintenance pages to bots, controls missing from the accessibility tree, auto-added extras.

Re-run with `pnpm --filter worker bench:run --repeat 3` then `bench:score <dir>`.

---

# Update 2026-10-04: engine fixes, measured

Same 23 stores, same ground truth, one run each. Agent brain: Gemini `gemini-flash-lite-latest`, capped at 40 calls per store.

| | Browser agent agreement | Feed reader agreement | Per-persona outcome match | False alarms | Misses | Gemini cost |
|---|---|---|---|---|---|---|
| Baseline (no LLM) | 7/21 (33%) | 18/22 | 66% | 32% | 2.1% | $0 |
| Round 1: Gemini drives steps, per-bot UAs and robots, checkout login check, in-stock picking | 11/21 | 17/22 | 66% | 28% | 2.6% | $0.10 |
| Round 2: real Chrome, flexible product goals, popup attribution, cart-drawer detection, parallel sessions | 12/21 | 17/22 | 68% | 29% | 2.6% | $0.13 |
| Round 3: checkout-form success, stay-in-region rule, force-click retry, cookie dismissal, product hint, buy-button stock check | **14/21 (67%)** | **18/22** | **78%** | **21%** | **1.3%** | $0.12 |

Total Gemini spend across all runs: about $0.47.

## Verified along the way

- Real Chrome (headed or headless) loads John Lewis and Patagonia; bundled headless Chromium gets `ERR_HTTP2_PROTOCOL_ERROR` and an Akamai "Sit tight" page from the same IP. The engine now launches Chrome and falls back to Chromium.
- Allbirds Flip Flop: 1 of 7 sizes in stock, but the HTML shows the default size as "Add to Cart – $25 Out of stock". AI fetchers report it as sold out. The feed check now reads the buy-button text.
- The agent once followed a region selector from allbirds.com to allbirds.at; it is now told to keep the current region.

## Still disagreeing (round 3)

- **Agent runs out of actions on busy real stores** (Glossier, Gymshark, Rothy's, Warby Parker): popups plus size pickers exceed 4 actions per step with Flash-Lite.
- **Run-to-run variation** on John Lewis, Patagonia, search-only: some personas pass, others don't, in the same run.
- **Feed readers can't discover product URLs** on some custom stores (Nike), so they fetch the homepage.
- **Everlane fetcher** ground truth was for a different product than the engine picked; needs a product-matched ground-truth row.

## Next levers

1. Use Gemini Flash (not Lite) only for steps that Lite failed. Estimated about 2–3x the cost on those steps.
2. Raise the per-step action cap from 4 to 6 on real stores.
3. Repeat runs (3x) to measure consistency now that an LLM is in the loop.
4. Record ChatGPT agent and Perplexity Comet ground truth on the fixture stores (needs their accounts).
