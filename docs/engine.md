# Engine: understand the store, generate sessions

Scope: steps 1 and 2 only. Replay and judging are out of scope here.

```
STORE URL
   │
   ▼
┌─ 1. STORE PROFILE (no browser, ~8s) ─────────────────────────────────┐
│  8 parallel HTTP probes ──► evidence JSON ──► 1 Grok call ──► profile │
└───────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌─ 2. SESSION GENERATION (deterministic) ──────────────────────────────┐
│  personas × templates, gated by profile flags                        │
│  Grok fills only: search query, variant choice                       │
└───────────────────────────────────────────────────────────────────────┘
   │
   ▼
 sessions[] ──► replay engine
```

## 1. Store profile

### Libraries

| Need | Pick | Why |
|---|---|---|
| HTTP | Node `fetch`, 4s timeout each | nothing to install |
| HTML | `cheerio` | already installed |
| robots.txt | `robots-parser` | spec-compliant, gives sitemap URLs too |
| sitemap | hand-rolled, 2 fetches max | `sitemapper` walks every child of a sitemap index (Zara took 104s) |
| bot protection | `is-antibot` | 30+ providers from headers+HTML, released Sep 2026, zero deps |
| platform | hand-rolled signatures | wappalyzer is dead, APIs cost money, we need 5 platforms |
| structured data | cheerio + `JSON.parse` | every npm extractor is 6+ years stale |
| LLM | Grok via existing `llm.ts` | turns evidence into profile + journey hints |

Rejected: Firecrawl and Jina Reader (keys, credits, only useful as JS-only fallback), Crawl4AI (Python service), Stagehand for profiling (belongs in replay).

### Probes (all `Promise.allSettled`, 4s each)

| # | Probe | Yields |
|---|---|---|
| 1 | `GET /` browser UA | headers, cookies, HTML → platform, JSON-LD, popups, consent, captcha scripts, JS-only heuristic, links to search / collections / cart, cart-drawer element |
| 2 | `GET /robots.txt` | allowed for GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, `*`; sitemap URLs |
| 3 | `GET /agents.md`, `/llms.txt` | Shopify serves both since May 2026; lists MCP/UCP endpoints |
| 4 | `GET /products.json?limit=10`, `/wp-json/wc/store/v1/products?per_page=10` | product handles, variants, options, availability |
| 5 | sitemap → filter `/products/|/product/|/p/` | product URLs when 4 fails |
| 6 | `GET` one product URL | Product JSON-LD, variant selects, add-to-cart form |
| 7 | Shopify: `GET /cart`, `HEAD /checkout` | cart page vs drawer, checkout host |
| 8 | Grok: evidence → `StoreProfile` | fills `journeyHints`, `confidence`, notes |

Platform signatures:
- Shopify: `X-ShopId` / `X-Shopify-Stage` headers, `cdn.shopify.com`, `Shopify.theme`, `/products.json` 200
- WooCommerce: `wp-json/wc/store`, `wc-ajax`, `woocommerce` body class
- Magento: `X-Magento-Vary` cookie, `/static/version`
- BigCommerce: `cdn11.bigcommerce.com`, `stencil`

JS-only heuristic: empty `#root`/`#__next`, `__NEXT_DATA__` / `__NUXT__` present, visible text < 500 chars, `<noscript>` says enable JavaScript.

Hostility signatures: `challenges.cloudflare.com/turnstile`, `google.com/recaptcha`, `js.hcaptcha.com`, `tags.datadome.co`, `client.px-cloud.net`, `_abck` cookie; consent `#onetrust-banner-sdk`, `#CybotCookiebotDialog`, `#didomi-notice`; `static.klaviyo.com` → newsletter popup likely.

### Type

```ts
type Platform = "shopify" | "woocommerce" | "bigcommerce" | "magento" | "custom" | "unknown";

interface StoreProfile {
  url: string; finalUrl: string;
  platform: { name: Platform; confidence: number; signals: string[] };
  rendering: { jsOnly: boolean; framework?: string };
  products: {
    source: "shopify_json" | "woo_store_api" | "sitemap" | "jsonld" | "links" | "none";
    sampleUrls: string[]; variantsRequired: boolean; optionNames: string[];
  };
  structure: {
    searchUrl?: string; categoryUrls: string[];
    cart: "page" | "drawer" | "unknown"; checkoutHost?: string;
    guestCheckout: "yes" | "no" | "unknown";
  };
  hostility: {
    botProtection?: string; captcha?: "recaptcha" | "hcaptcha" | "turnstile";
    cookieBanner?: string; newsletterPopup: boolean; loginWall: boolean; blockedStatus?: number;
  };
  ai: { robotsAllows: Record<string, boolean>; llmsTxt: boolean; agentsMd: boolean };
  structuredData: { productJsonLd: boolean; feed?: string };
  journeyHints: string[]; confidence: number;
}
```

## 2. Session generation

### How real AI buyers shop (Sept 2026)

Two archetypes cover everyone:

| Archetype | Who | Reads pages | Buys | Dies on |
|---|---|---|---|---|
| **feed-reader** | ChatGPT Shopping, Grok, Perplexity search, Google AI Mode | no JS, feed + direct product URL | hands off to merchant / UCP / Firmly | JS-only price or variants, missing feed/schema, robots or WAF block, 404 product URL |
| **browser-agent** | ChatGPT Atlas agent mode, Perplexity Comet, Amazon Buy for Me | full Chromium, JS on | drives cart + guest checkout, stops at payment or login | captcha (~40% of agent checkouts), login wall, popups, Cloudflare agent block, rate limits |

### Templates

Deterministic. Grok never writes a journey. It fills two parameters: search query and variant choice.

| Template | Archetype | Gated by |
|---|---|---|
| `feed-reader` | feed-reader | always. No-JS fetch of product URL, assert price / variants / JSON-LD present |
| `direct-link` | both | `products.sampleUrls` non-empty |
| `search-first` | browser-agent | `structure.searchUrl` |
| `category-browse` | browser-agent | `structure.categoryUrls` non-empty |
| `variant-required` | browser-agent | `products.variantsRequired` |
| `cart-drawer` | browser-agent | `structure.cart === "drawer"` |
| `buy-now` | browser-agent | buy-now button seen on product page |

Selection: feed-reader personas get `feed-reader` + `direct-link`. Browser-agent personas get every gated template that applies, capped at 3 per run for the demo.

### Session shape

```json
{
  "id": "comet-search-first-01",
  "persona": "perplexity-comet",
  "archetype": "browser-agent",
  "template": "search-first",
  "goal": "buy 1x <product> in <variant>",
  "steps": [
    { "op": "goto", "url": "https://store.com" },
    { "op": "dismiss", "what": "popup|cookie", "optional": true },
    { "op": "act", "instr": "open site search and search for '<query>'", "expect": { "urlContains": "search" } },
    { "op": "act", "instr": "open the product '<name>'", "expect": { "text": "<name>" } },
    { "op": "act", "instr": "select variant <variant>", "expect": { "text": "<variant>" }, "requiredIf": "variants" },
    { "op": "act", "instr": "add to cart", "expect": { "anyOf": ["drawerVisible", "urlContains:/cart"] } },
    { "op": "act", "instr": "proceed to checkout", "expect": { "urlHost": "<checkoutHost>" } },
    { "op": "stop", "reason": "payment gate" }
  ],
  "maxSteps": 25,
  "budgetMs": 120000
}
```

Each `act` step is an instruction plus a deterministic `expect`. The replay engine never trusts the LLM's "done".

## Executor choice (for the replay step, decided here because it shapes the session format)

**Stagehand v3** (`@browserbasehq/stagehand`) is the one library that fits the session shape above. `act("add to cart")` per step, self-healing locators, observe→cache→replay, runs on local Chromium with `env: "LOCAL"`, and xAI is first-class (`model: "xai/grok-..."`, or any OpenAI-compatible `baseURL`).

Fallback: raw Playwright 1.63 `ariaSnapshot({ mode: "ai" })` + `aria-ref=` click loop. Verified locally, zero deps, more code.

Decision rule: 10-minute spike of Stagehand `act` against the demo store with the xAI key. Works → Stagehand. Doesn't → raw loop.

Rejected: browser-use (Python, TS port not production ready), Magnitude (stalled), Skyvern (Python, AGPL), OpenAI/Anthropic computer use (need their models), hosted browsers (not needed locally), Octomind/Momentic/QA Wolf (not usable in 90 min).

## Reliability rules for the replay loop

1. Re-snapshot after every action. Never reuse a ref.
2. Verify `expect` before advancing. On miss, retry once with the failure text fed back.
3. Blocker classifier before every step: captcha, login wall, cookie or newsletter modal, `dialog` events, new tab, checkout-domain hop. Auto-dismiss modals. Captcha and login are terminal.
4. Deterministic fast-path first (`getByRole("button", { name: /add to cart/i })`, `/search?q=`). LLM only on miss.
5. Hard budgets: `maxSteps`, 15s per step, 2 min per session, `networkidle` capped at 5s. Truncate snapshot to ~8k tokens, strip nav and footer.

## Unverified

- `is-antibot` Turnstile coverage.
- Stagehand v3 model name for the current Grok model. Generic `baseURL` config is the safety net.
- `aria-ref=` is used by Playwright MCP but not in public Playwright docs.
- Shopify guest checkout has no public flag. Stays `unknown` unless `/agents.md` says otherwise.
