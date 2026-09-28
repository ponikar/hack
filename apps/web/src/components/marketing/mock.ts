export type StepState = "pending" | "running" | "ok" | "blocked" | "skipped" | "stopped";

export type MockStep = { label: string; end?: "blocked" | "stopped"; detail?: string };

export type MockBuyer = {
  id: string;
  name: string;
  vendor: string;
  archetype: "Feed reader" | "Browser agent";
  template: string;
  steps: MockStep[];
  note: string;
};

export type MockChip = { label: string; tone: "neutral" | "warn" | "ok" };

export type MockFix = { title: string; detail: string; who: string[] };

export const DEMO_URL = "northwind-supply.com";

export const PROFILE_CHIPS: MockChip[] = [
  { label: "Shopify", tone: "neutral" },
  { label: "Server-rendered", tone: "ok" },
  { label: "Product JSON-LD", tone: "ok" },
  { label: "products.json", tone: "ok" },
  { label: "Cart drawer", tone: "neutral" },
  { label: "Newsletter popup", tone: "warn" },
  { label: "Account required", tone: "warn" },
];

const ok = (label: string): MockStep => ({ label });

export const BROKEN_BUYERS: MockBuyer[] = [
  {
    id: "chatgpt-shopping",
    name: "ChatGPT Shopping",
    vendor: "OpenAI",
    archetype: "Feed reader",
    template: "feed-reader",
    steps: [ok("Fetch product"), ok("Price in HTML"), ok("Product schema")],
    note: "Read name, price and stock with JavaScript off.",
  },
  {
    id: "google-ai-mode",
    name: "Google AI Mode",
    vendor: "Google",
    archetype: "Feed reader",
    template: "direct-link",
    steps: [ok("Fetch product"), ok("Price in HTML"), ok("Product schema")],
    note: "Read name, price and stock with JavaScript off.",
  },
  {
    id: "chatgpt-atlas",
    name: "ChatGPT Atlas",
    vendor: "OpenAI",
    archetype: "Browser agent",
    template: "search-first",
    steps: [
      ok("Open store"),
      ok("Dismiss popup"),
      ok("Search"),
      ok("Open product"),
      ok("Add to cart"),
      { label: "Checkout", end: "blocked", detail: "login wall" },
      { label: "Payment gate" },
    ],
    note: "Checkout demanded an account. Agents shop as guests.",
  },
  {
    id: "perplexity-comet",
    name: "Perplexity Comet",
    vendor: "Perplexity",
    archetype: "Browser agent",
    template: "cart-drawer",
    steps: [ok("Open store"), ok("Open product"), ok("Pick variant"), ok("Add to cart"), ok("Checkout"), { label: "Payment gate", end: "stopped" }],
    note: "Reached payment. Stopped on purpose; nothing bought.",
  },
  {
    id: "amazon-buy-for-me",
    name: "Amazon Buy for Me",
    vendor: "Amazon",
    archetype: "Browser agent",
    template: "buy-now",
    steps: [ok("Open store"), ok("Browse category"), ok("Open product"), ok("Buy now"), { label: "Payment gate", end: "stopped" }],
    note: "Reached payment. Stopped on purpose; nothing bought.",
  },
];

export const BROKEN_FIXES: MockFix[] = [
  {
    title: "Turn on guest checkout",
    detail: "Checkout redirected to /account/login. Agents never create accounts; one step from payment, the sale ends.",
    who: ["ChatGPT Atlas"],
  },
];

export const BROKEN_VERDICT = {
  seen: "pass",
  listed: "pass",
  buyable: "fail",
  overall: "listed",
  buyableNote: "1 of 3 agents blocked at checkout",
} as const;

export const FIXED_BUYERS: MockBuyer[] = BROKEN_BUYERS.map((b) =>
  b.id === "chatgpt-atlas"
    ? {
        ...b,
        steps: [ok("Open store"), ok("Dismiss popup"), ok("Search"), ok("Open product"), ok("Add to cart"), ok("Checkout"), { label: "Payment gate", end: "stopped" }],
        note: "Reached payment as a guest. Stopped on purpose; nothing bought.",
      }
    : b,
);

export const FIXED_VERDICT = {
  seen: "pass",
  listed: "pass",
  buyable: "pass",
  overall: "buyable",
  buyableNote: "3 of 3 agents reached payment",
} as const;

export const TOGGLE_BROKEN_BUYERS: MockBuyer[] = [
  {
    id: "chatgpt-shopping",
    name: "ChatGPT Shopping",
    vendor: "OpenAI",
    archetype: "Feed reader",
    template: "feed-reader",
    steps: [ok("Fetch product"), { label: "Price in HTML", end: "blocked", detail: "JS-only" }, { label: "Product schema" }],
    note: "Price only exists after hydration. Feed readers never run JavaScript.",
  },
  {
    id: "perplexity-search",
    name: "Perplexity search",
    vendor: "Perplexity",
    archetype: "Feed reader",
    template: "feed-reader",
    steps: [{ label: "Fetch product", end: "blocked", detail: "robots.txt" }, { label: "Price in HTML" }, { label: "Product schema" }],
    note: "robots.txt disallows PerplexityBot. The store does not exist to it.",
  },
  {
    id: "chatgpt-atlas",
    name: "ChatGPT Atlas",
    vendor: "OpenAI",
    archetype: "Browser agent",
    template: "search-first",
    steps: [ok("Open store"), { label: "Dismiss popup", end: "blocked", detail: "no close button" }, { label: "Search" }, { label: "Open product" }, { label: "Add to cart" }, { label: "Checkout" }],
    note: "Newsletter modal covers the page and has no close control.",
  },
  {
    id: "perplexity-comet",
    name: "Perplexity Comet",
    vendor: "Perplexity",
    archetype: "Browser agent",
    template: "cart-drawer",
    steps: [ok("Open store"), ok("Open product"), ok("Pick variant"), ok("Add to cart"), { label: "Checkout", end: "blocked", detail: "CAPTCHA" }, { label: "Payment gate" }],
    note: "reCAPTCHA challenge on checkout. Agents cannot solve it.",
  },
];

export const TOGGLE_FIXED_BUYERS: MockBuyer[] = [
  {
    id: "chatgpt-shopping",
    name: "ChatGPT Shopping",
    vendor: "OpenAI",
    archetype: "Feed reader",
    template: "feed-reader",
    steps: [ok("Fetch product"), ok("Price in HTML"), ok("Product schema")],
    note: "Price, stock and schema present in the raw HTML.",
  },
  {
    id: "perplexity-search",
    name: "Perplexity search",
    vendor: "Perplexity",
    archetype: "Feed reader",
    template: "feed-reader",
    steps: [ok("Fetch product"), ok("Price in HTML"), ok("Product schema")],
    note: "PerplexityBot allowed. Product page readable in one fetch.",
  },
  {
    id: "chatgpt-atlas",
    name: "ChatGPT Atlas",
    vendor: "OpenAI",
    archetype: "Browser agent",
    template: "search-first",
    steps: [ok("Open store"), ok("Dismiss popup"), ok("Search"), ok("Open product"), ok("Add to cart"), { label: "Checkout", end: "stopped" }],
    note: "Reached payment as a guest. Stopped on purpose; nothing bought.",
  },
  {
    id: "perplexity-comet",
    name: "Perplexity Comet",
    vendor: "Perplexity",
    archetype: "Browser agent",
    template: "cart-drawer",
    steps: [ok("Open store"), ok("Open product"), ok("Pick variant"), ok("Add to cart"), ok("Checkout"), { label: "Payment gate", end: "stopped" }],
    note: "Reached payment. Stopped on purpose; nothing bought.",
  },
];

export const TOGGLE_BROKEN_FIXES: MockFix[] = [
  { title: "Render price and stock on the server", detail: "Feed readers fetch once, without JavaScript. Put price, availability and variants in the HTML.", who: ["ChatGPT Shopping", "Grok", "Google AI Mode"] },
  { title: "Allow AI crawlers in robots.txt", detail: "Unblock PerplexityBot, OAI-SearchBot and GPTBot for /products/ and /collections/.", who: ["Perplexity search", "ChatGPT Shopping"] },
  { title: "Give the newsletter modal a close button", detail: "Or delay it until after the first click. Agents cannot escape a modal with no control.", who: ["ChatGPT Atlas"] },
  { title: "Skip the checkout CAPTCHA for signed agents", detail: "Allowlist Web Bot Auth signatures or move the challenge behind risk scoring.", who: ["Perplexity Comet"] },
];

export const TOGGLE_BROKEN_VERDICT = { seen: "fail", listed: "fail", buyable: "fail", overall: "invisible" } as const;
export const TOGGLE_FIXED_VERDICT = { seen: "pass", listed: "pass", buyable: "pass", overall: "buyable" } as const;
