import type { StoreProfile } from "@watchdog/shared";
import { enrich, heuristicCategory } from "./enrich";
import {
  probeAiFiles, probeCartCheckout, probeHome, probeProductPage, probeRobots,
  probeShopifyProducts, probeSitemap, probeWooProducts, withTimeout, type ProductSample,
} from "./probes";

const PROBE_MS = 6000;

export async function profileStore(inputUrl: string): Promise<StoreProfile> {
  const t0 = Date.now();
  const notes: string[] = [];
  const url = /^https?:\/\//.test(inputUrl) ? inputUrl : `https://${inputUrl}`;

  const home = await probeHome(url);
  const { origin } = home;
  const isDemo = origin.startsWith("http://localhost");

  const [robots, aiFiles, shopify, woo, cartCheckout] = await Promise.all([
    withTimeout(probeRobots(origin), PROBE_MS, { allows: {}, sitemaps: [], present: false }),
    withTimeout(probeAiFiles(origin), PROBE_MS, { llmsTxt: false, agentsMd: false }),
    withTimeout(probeShopifyProducts(origin), PROBE_MS, null),
    withTimeout(probeWooProducts(origin), PROBE_MS, null),
    withTimeout(probeCartCheckout(origin), PROBE_MS, { cartPage: false, cartUrl: undefined, checkoutHost: undefined, checkoutStatus: 0 }),
  ]);

  let source: StoreProfile["products"]["source"] = "none";
  let samples: ProductSample[] = [];
  if (shopify?.length) { source = "shopify_json"; samples = shopify; }
  else if (woo?.length) { source = "woo_store_api"; samples = woo; }
  else if (home.productLinks.length) { source = "links"; samples = home.productLinks.map((u) => ({ url: u, name: "", options: [], variants: 1 })); }
  else {
    const fromSitemap = await withTimeout(probeSitemap(origin, robots.sitemaps), PROBE_MS, []);
    if (fromSitemap.length) { source = "sitemap"; samples = fromSitemap.map((u) => ({ url: u, name: "", options: [], variants: 1 })); }
  }
  if (source === "none") notes.push("No product URLs found. Journeys must start from search or category pages.");

  const productPage = samples[0] ? await withTimeout(probeProductPage(samples[0].url).catch(() => null), PROBE_MS, null) : null;
  if (productPage && !samples[0].name) samples[0].name = productPage.name;

  const optionNames = [...new Set([...samples.flatMap((s) => s.options), ...(productPage?.optionNames ?? [])])];
  const variantsRequired = optionNames.length > 0 || samples.some((s) => s.variants > 1);

  let platform = home.platform;
  if (shopify && platform.name !== "shopify") platform = { name: "shopify", confidence: 0.9, signals: [...platform.signals, "/products.json"] };
  if (woo && platform.name !== "woocommerce") platform = { name: "woocommerce", confidence: 0.9, signals: [...platform.signals, "wc/store/v1"] };

  const jsOnly = home.jsOnly || (productPage?.jsOnly ?? false);
  if (jsOnly) notes.push("Store renders client-side. AI fetchers without JavaScript see little or nothing.");
  if (home.botProtection) notes.push(`Bot protection detected: ${home.botProtection}.`);
  if (home.captcha) notes.push(`CAPTCHA present: ${home.captcha}.`);
  const blockedBots = Object.entries(robots.allows).filter(([, ok]) => !ok).map(([b]) => b);
  if (blockedBots.length) notes.push(`robots.txt blocks: ${blockedBots.join(", ")}.`);

  const cart: StoreProfile["structure"]["cart"] = home.cartDrawer ? "drawer" : cartCheckout.cartPage || home.cartLink ? "page" : "unknown";

  const evidence = {
    url: home.finalUrl,
    title: home.title,
    metaDescription: home.metaDescription,
    nav: home.navText,
    platform: platform.name,
    products: samples.slice(0, 8).map((s) => ({ name: s.name, type: s.type, options: s.options, price: s.price })),
    productPage: productPage && { name: productPage.name, category: productPage.category, optionNames: productPage.optionNames, hasAddToCart: productPage.hasAddToCart, hasBuyNow: productPage.hasBuyNow },
    cart, checkoutHost: cartCheckout.checkoutHost, hasSearch: !!home.searchLink,
    hostility: { botProtection: home.botProtection, captcha: home.captcha, cookieBanner: home.cookieBanner, newsletterPopup: home.newsletterPopup, loginWall: home.loginWall },
    jsOnly, framework: home.framework,
  };

  const ai = await withTimeout(enrich(evidence), 15000, null);
  if (!ai) notes.push("LLM enrichment skipped. Category and queries are heuristic.");
  const fallbackText = [home.title, home.metaDescription, ...home.navText, ...samples.map((s) => `${s.name} ${s.type ?? ""}`)].join(" ");

  return {
    url,
    finalUrl: home.finalUrl,
    profiledAt: new Date().toISOString(),
    durationMs: Date.now() - t0,
    platform,
    rendering: { jsOnly, framework: home.framework, visibleTextLength: home.visibleTextLength },
    products: {
      source,
      sampleUrls: samples.map((s) => s.url).slice(0, 5),
      sampleNames: samples.map((s) => s.name).filter(Boolean).slice(0, 5),
      variantsRequired,
      optionNames,
    },
    structure: {
      searchUrl: home.searchLink,
      categoryUrls: home.categoryLinks.slice(0, 5),
      cart,
      cartUrl: cartCheckout.cartUrl ?? home.cartLink,
      checkoutHost: cartCheckout.checkoutHost,
      guestCheckout: ai?.guestCheckout ?? (isDemo ? "unknown" : "unknown"),
    },
    hostility: {
      botProtection: home.botProtection,
      captcha: home.captcha,
      cookieBanner: home.cookieBanner,
      newsletterPopup: home.newsletterPopup,
      loginWall: home.loginWall,
      blockedStatus: home.status >= 400 ? home.status : undefined,
    },
    ai: { robotsAllows: robots.allows, llmsTxt: aiFiles.llmsTxt, agentsMd: aiFiles.agentsMd },
    structuredData: {
      productJsonLd: home.hasProductJsonLd || (productPage?.productJsonLd ?? false),
      itemList: home.hasItemList,
      feed: source === "shopify_json" ? `${origin}/products.json` : source === "woo_store_api" ? `${origin}/wp-json/wc/store/v1/products` : undefined,
    },
    category: ai?.category ?? heuristicCategory(fallbackText),
    searchQueries: ai?.searchQueries ?? samples.map((s) => s.name).filter(Boolean).slice(0, 3),
    journeyHints: ai?.journeyHints ?? [
      ...(variantsRequired ? [`Choose ${optionNames.join(", ") || "a variant"} before add to cart.`] : []),
      ...(cart === "drawer" ? ["Cart opens as a side drawer."] : []),
      ...(cartCheckout.checkoutHost && cartCheckout.checkoutHost !== new URL(origin).host ? [`Checkout is on ${cartCheckout.checkoutHost}.`] : []),
      ...(home.newsletterPopup ? ["Expect a newsletter popup on first load."] : []),
    ],
    confidence: ai?.confidence ?? (source === "none" ? 0.3 : 0.6),
    notes,
  };
}
