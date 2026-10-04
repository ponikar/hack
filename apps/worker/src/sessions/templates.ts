import type { Expect, SessionStep, StoreProfile, TemplateId } from "@watchdog/shared";

export interface TemplateParams {
  productUrl: string;
  productName: string;
  query: string;
  variant?: string;
}

export type Template = (profile: StoreProfile, params: TemplateParams) => SessionStep[];

export function isLiveStore(profile: StoreProfile): boolean {
  const demo = process.env.DEMO_STORE_URL;
  const urls = [profile.finalUrl, profile.url];
  if (demo && urls.some((u) => u.startsWith(demo))) return false;
  return !urls.some((u) => u.startsWith("http://localhost"));
}

const origin = (p: StoreProfile) => new URL(p.finalUrl).origin;
const hintMatches = (p: StoreProfile, re: RegExp) => p.journeyHints.some((h) => re.test(h));
const pathOf = (url: string, base: string, fallback: string) => {
  try {
    return new URL(url, base).pathname || fallback;
  } catch {
    return fallback;
  }
};

function dismissSteps(p: StoreProfile): SessionStep[] {
  const steps: SessionStep[] = [];
  if (p.hostility.cookieBanner) steps.push({ op: "dismiss", what: "cookie banner", optional: true });
  if (p.hostility.newsletterPopup || hintMatches(p, /popup|modal|newsletter/i)) steps.push({ op: "dismiss", what: "newsletter popup", optional: true });
  return steps;
}

function openProduct(params: TemplateParams): SessionStep {
  const name = params.productName || "the first product in the results";
  return {
    op: "act",
    instr: `open the product '${name}'`,
    expect: params.productName ? { text: params.productName } : { anyOf: ["addToCartVisible", "urlContains:/product"] },
  };
}

function variantStep(p: StoreProfile, params: TemplateParams): SessionStep[] {
  if (!p.products.variantsRequired) return [];
  const options = p.products.optionNames.length ? p.products.optionNames.join(", ") : "each required option";
  return params.variant
    ? [{ op: "act", instr: `select variant ${params.variant}`, expect: { text: params.variant }, requiredIf: "variants" }]
    : [{ op: "act", instr: `choose any available option for ${options}`, expect: { anyOf: ["addToCartEnabled", "optionSelected"] }, requiredIf: "variants" }];
}

function addToCart(p: StoreProfile): SessionStep {
  const cartPath = p.structure.cartUrl ? pathOf(p.structure.cartUrl, p.finalUrl, "/cart") : "/cart";
  const expect: Expect =
    p.structure.cart === "drawer"
      ? { anyOf: ["drawerVisible", `urlContains:${cartPath}`, "checkoutVisible"] }
      : p.structure.cart === "page"
        ? { anyOf: [`urlContains:${cartPath}`, "cartCountIncreased", "checkoutVisible"] }
        : { anyOf: ["drawerVisible", `urlContains:${cartPath}`, "cartCountIncreased", "checkoutVisible"] };
  return { op: "act", instr: "add to cart", expect };
}

function checkoutExpect(p: StoreProfile): Expect {
  // Checkout often moves host (Shopify subdomains, auth domains, regional sites); any checkout URL or a visible checkout form counts.
  return { anyOf: ["urlContains:checkout", "checkoutForm"] };
}

function checkout(p: StoreProfile): SessionStep {
  const via = p.structure.cart === "drawer" ? "from the cart drawer, " : "";
  return { op: "act", instr: `${via}proceed to checkout`, expect: checkoutExpect(p) };
}

function finish(p: StoreProfile): SessionStep[] {
  if (isLiveStore(p)) return [{ op: "stop", reason: "payment gate" }];
  return [{ op: "act", instr: "place the order with test card 4242 4242 4242 4242", expect: { text: "Order confirmed" } }];
}

function cartToEnd(p: StoreProfile, params: TemplateParams): SessionStep[] {
  return [...variantStep(p, params), addToCart(p), checkout(p), ...finish(p)];
}

export const feedReader: Template = (p, params) => {
  const url = params.productUrl || p.finalUrl;
  const steps: SessionStep[] = [];
  steps.push({ op: "fetch", url, expect: params.productName ? { text: params.productName } : { anyOf: ["jsonldProduct", "text:price"] } });
  steps.push({ op: "fetch", url, expect: { anyOf: ["jsonldProduct", "priceVisible", "variantsVisible"] } });
  if (params.productUrl) steps.push({ op: "fetch", url, expect: { anyOf: ["notSoldOut"] } });
  return steps;
};

export const directLink: Template = (p, params) => [
  { op: "goto", url: params.productUrl },
  ...dismissSteps(p),
  ...cartToEnd(p, params),
];

export const searchFirst: Template = (p, params) => [
  { op: "goto", url: p.url },
  ...dismissSteps(p),
  {
    op: "act",
    instr: `open site search and search for '${params.query}'`,
    expect: { urlContains: p.structure.searchUrl ? pathOf(p.structure.searchUrl, p.finalUrl, "search") : "search" },
  },
  openProduct(params),
  ...cartToEnd(p, params),
];

export const categoryBrowse: Template = (p, params) => [
  { op: "goto", url: p.structure.categoryUrls[0] ?? p.finalUrl },
  ...dismissSteps(p),
  { op: "act", instr: "open the first in-stock product in this category", expect: { anyOf: ["addToCartVisible", "urlContains:/product"] } },
  ...cartToEnd(p, { ...params, productName: "" }),
];

export const variantRequired: Template = (p, params) => [
  { op: "goto", url: params.productUrl },
  ...dismissSteps(p),
  { op: "act", instr: "try to add to cart without choosing any option", expect: { anyOf: ["validationMessage", "addToCartDisabled"] }, requiredIf: "variants" },
  ...cartToEnd(p, params),
];

export const cartDrawer: Template = (p, params) => [
  { op: "goto", url: params.productUrl },
  ...dismissSteps(p),
  ...variantStep(p, params),
  addToCart(p),
  { op: "act", instr: "close the cart drawer, then reopen it from the header cart icon", expect: { anyOf: ["drawerVisible", "cartCountIncreased"] } },
  checkout(p),
  ...finish(p),
];

export const buyNow: Template = (p, params) => [
  { op: "goto", url: params.productUrl },
  ...dismissSteps(p),
  ...variantStep(p, params),
  { op: "act", instr: "click buy now", expect: checkoutExpect(p) },
  ...finish(p),
];

export const TEMPLATES: Record<TemplateId, Template> = {
  "feed-reader": feedReader,
  "direct-link": directLink,
  "search-first": searchFirst,
  "category-browse": categoryBrowse,
  "variant-required": variantRequired,
  "cart-drawer": cartDrawer,
  "buy-now": buyNow,
};
