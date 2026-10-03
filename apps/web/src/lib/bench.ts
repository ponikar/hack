export type BenchStep = "home" | "search" | "product" | "add_to_cart" | "cart" | "checkout";

export type BenchCaseId =
  | "control"
  | "js-only"
  | "no-schema"
  | "popup-trap"
  | "popup-closable"
  | "login-wall"
  | "captcha"
  | "robots-block"
  | "bot-403"
  | "variant-required"
  | "cart-drawer"
  | "icon-buttons"
  | "search-only";

export type BenchCase = {
  id: BenchCaseId;
  defect: string;
  expected: {
    feedReader: "pass" | "fail";
    browserAgent: "reach_checkout" | "blocked";
    blockedAt?: BenchStep;
  };
  uncertain?: boolean;
};

export const BENCH_CASES: BenchCase[] = [
  { id: "control", defect: "None (control)", expected: { feedReader: "pass", browserAgent: "reach_checkout" } },
  {
    id: "js-only",
    defect: "Product name, price and card render client-side only; no JSON-LD",
    expected: { feedReader: "fail", browserAgent: "reach_checkout" },
  },
  {
    id: "no-schema",
    defect: "No Product JSON-LD",
    expected: { feedReader: "fail", browserAgent: "reach_checkout" },
    uncertain: true,
  },
  {
    id: "popup-trap",
    defect: "Full-screen newsletter modal on product page with no way to close it",
    expected: { feedReader: "pass", browserAgent: "blocked", blockedAt: "add_to_cart" },
  },
  {
    id: "popup-closable",
    defect: "Newsletter modal on product page with a labelled Close button",
    expected: { feedReader: "pass", browserAgent: "reach_checkout" },
  },
  {
    id: "login-wall",
    defect: "Checkout requires sign-in; no guest option",
    expected: { feedReader: "pass", browserAgent: "blocked", blockedAt: "checkout" },
  },
  {
    id: "captcha",
    defect: "Turnstile challenge gates Continue to payment",
    expected: { feedReader: "pass", browserAgent: "reach_checkout" },
  },
  {
    id: "robots-block",
    defect: "robots.txt disallows the store for AI user agents",
    expected: { feedReader: "fail", browserAgent: "reach_checkout" },
  },
  {
    id: "bot-403",
    defect: "WAF returns 403 for AI bot, headless and script user agents",
    expected: { feedReader: "fail", browserAgent: "reach_checkout" },
  },
  {
    id: "variant-required",
    defect: "Size must be chosen before Add to cart is enabled",
    expected: { feedReader: "pass", browserAgent: "reach_checkout" },
  },
  {
    id: "cart-drawer",
    defect: "Cart is only a slide-in drawer; no Cart link in the header",
    expected: { feedReader: "pass", browserAgent: "reach_checkout" },
  },
  {
    id: "icon-buttons",
    defect: "Add to cart and Checkout are unlabelled icon-only buttons",
    expected: { feedReader: "pass", browserAgent: "blocked", blockedAt: "add_to_cart" },
    uncertain: true,
  },
  {
    id: "search-only",
    defect: "Home page has no product links; product reachable only via search",
    expected: { feedReader: "pass", browserAgent: "reach_checkout" },
  },
];

export const BENCH_CASE_IDS = BENCH_CASES.map((c) => c.id);

export function getBenchCase(id: string): BenchCase | undefined {
  return BENCH_CASES.find((c) => c.id === id);
}

export const BENCH_PRODUCT = {
  slug: "trail-runner",
  name: "Trail Runner",
  price: "89.00",
  priceLabel: "£89.00",
  currency: "GBP",
  sku: "BENCH-TR-001",
  description: "Lightweight trail running shoe with a grippy lug sole and breathable mesh upper.",
  image: "/bench-assets/trail-runner.svg",
};

export const BENCH_SIZES = ["UK 7", "UK 8", "UK 9", "UK 10", "UK 11"];

export const BLOCKED_ROBOTS_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Google-Agent",
];

export const WAF_UA_PATTERN = /GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|Claude-User|Claude-SearchBot|PerplexityBot|Perplexity-User|HeadlessChrome|python-requests|curl/;

export const cartCookie = (id: string) => `bench_cart_${id}`;

export function benchJsonLd(origin: string, id: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: BENCH_PRODUCT.name,
    sku: BENCH_PRODUCT.sku,
    description: BENCH_PRODUCT.description,
    image: `${origin}${BENCH_PRODUCT.image}`,
    offers: {
      "@type": "Offer",
      price: BENCH_PRODUCT.price,
      priceCurrency: BENCH_PRODUCT.currency,
      availability: "https://schema.org/InStock",
      url: `${origin}/bench/${id}/product/${BENCH_PRODUCT.slug}`,
    },
  };
}
