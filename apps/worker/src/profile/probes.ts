import * as cheerio from "cheerio";
import isAntibot from "is-antibot";
import robotsParser from "robots-parser";
import { AI_BOTS } from "@watchdog/shared";
import {
  BOT_PROTECTION_SIGS, BROWSER_UA, CAPTCHA_SIGS, CATEGORY_PATH, COOKIE_BANNER_SIGS,
  FRAMEWORK_SIGS, POPUP_SIGS, PRODUCT_PATH, SEARCH_PATH, detectPlatform,
} from "./signatures";

const TIMEOUT = 5000;

export async function get(url: string, init: RequestInit = {}) {
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT),
    ...init,
    headers: { "user-agent": BROWSER_UA, accept: "text/html,application/json;q=0.9,*/*;q=0.8", ...(init.headers ?? {}) },
  });
  const text = res.ok || res.status < 500 ? (await res.text()).slice(0, 3_000_000) : "";
  return { res, text };
}

export type JsonLd = Record<string, unknown>;

export function parseJsonLd(html: string): JsonLd[] {
  const $ = cheerio.load(html);
  const out: JsonLd[] = [];
  const walk = (v: unknown) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (v && typeof v === "object") {
      const o = v as JsonLd;
      if (o["@graph"]) walk(o["@graph"]);
      if (o["@type"]) out.push(o);
    }
  };
  $('script[type="application/ld+json"]').each((_, el) => {
    try { walk(JSON.parse($(el).text())); } catch {}
  });
  return out;
}

const typeOf = (o: JsonLd) => ([] as string[]).concat(o["@type"] as string | string[]);

export async function probeHome(url: string) {
  const { res, text: html } = await get(url);
  const $ = cheerio.load(html);
  $("script, style, noscript, svg").remove();
  const visibleText = $("body").text().replace(/\s+/g, " ").trim();
  const origin = new URL(res.url).origin;
  const abs = (href: string) => { try { return new URL(href, res.url).toString(); } catch { return null; } };
  const links = $("a[href]").map((_, a) => abs($(a).attr("href")!)).get().filter((u): u is string => !!u && u.startsWith(origin));
  const uniq = (xs: string[]) => [...new Set(xs)];
  const rawHtml = html;

  const antibot = isAntibot({ headers: res.headers, html: rawHtml, url: res.url, statusCode: res.status });
  const first = (sigs: [string, RegExp][]) => sigs.find(([, re]) => re.test(rawHtml))?.[0];
  const jsonLd = parseJsonLd(rawHtml);
  const framework = first(FRAMEWORK_SIGS);
  const emptyShell = /<div id="(root|app|__next|__nuxt)"[^>]*>\s*<\/div>/.test(rawHtml);
  const noscript = /<noscript>[^<]*(enable|requires?) javascript/i.test(html);
  const productLinks = uniq(links.filter((u) => PRODUCT_PATH.test(new URL(u).pathname))).slice(0, 10);

  return {
    status: res.status,
    finalUrl: res.url,
    origin,
    html: rawHtml,
    headers: res.headers,
    platform: detectPlatform(res.headers, rawHtml),
    title: $("title").first().text().trim(),
    metaDescription: $('meta[name="description"]').attr("content")?.trim() ?? "",
    navText: uniq($("nav a, header a").map((_, a) => $(a).text().trim()).get().filter((t) => t && t.length < 40)).slice(0, 40),
    visibleTextLength: visibleText.length,
    framework,
    productLinks,
    jsOnly: emptyShell || noscript || (visibleText.length < 100 && productLinks.length === 0),
    categoryLinks: uniq(links.filter((u) => CATEGORY_PATH.test(new URL(u).pathname))).slice(0, 10),
    searchLink: links.find((u) => SEARCH_PATH.test(u)) ?? ($('form[action*="search"], input[type="search"], input[name="q"]').length ? `${origin}/search?q=` : undefined),
    cartLink: links.find((u) => /\/cart\b/i.test(new URL(u).pathname)),
    cartDrawer: $("cart-drawer, #CartDrawer, [data-cart-drawer], .cart-drawer, .mini-cart, #mini-cart").length > 0,
    botProtection: antibot.detected && antibot.provider ? String(antibot.provider) : first(BOT_PROTECTION_SIGS),
    captcha: first(CAPTCHA_SIGS),
    cookieBanner: first(COOKIE_BANNER_SIGS),
    newsletterPopup: POPUP_SIGS.some((re) => re.test(rawHtml)),
    loginWall: res.url.includes("/login") || res.url.includes("/account") || /<input[^>]+type="password"/i.test(rawHtml) && visibleText.length < 800,
    jsonLd,
    hasItemList: jsonLd.some((o) => typeOf(o).includes("ItemList")),
    hasProductJsonLd: jsonLd.some((o) => typeOf(o).some((t) => t === "Product" || t === "ProductGroup")),
  };
}

export async function probeRobots(origin: string) {
  const url = `${origin}/robots.txt`;
  const { res, text } = await get(url).catch(() => ({ res: undefined, text: "" }));
  const rp = robotsParser(url, res?.ok ? text : "");
  const allows: Record<string, boolean> = {};
  for (const bot of AI_BOTS) allows[bot] = rp.isAllowed(`${origin}/`, bot) !== false;
  return { allows, sitemaps: rp.getSitemaps(), present: !!res?.ok };
}

export async function probeAiFiles(origin: string) {
  const ok = async (p: string) => get(`${origin}${p}`).then(({ res, text }) => res.ok && !/<html/i.test(text.slice(0, 500))).catch(() => false);
  const [llmsTxt, agentsMd] = await Promise.all([ok("/llms.txt"), ok("/agents.md")]);
  return { llmsTxt, agentsMd };
}

export type ProductSample = { url: string; name: string; type?: string; options: string[]; variants: number; price?: string };

export async function probeShopifyProducts(origin: string): Promise<ProductSample[] | null> {
  const { res, text } = await get(`${origin}/products.json?limit=30`).catch(() => ({ res: undefined, text: "" }));
  if (!res?.ok || !text.trim().startsWith("{")) return null;
  try {
    const data = JSON.parse(text) as { products?: Array<{ handle: string; title: string; product_type?: string; options?: Array<{ name: string }>; variants?: Array<{ price: string; available?: boolean }> }> };
    if (!data.products?.length) return null;
    const sellable = (p: { variants?: Array<{ price: string; available?: boolean }> }) =>
      (p.variants ?? []).some((v) => v.available !== false && Number(v.price) > 0);
    const ranked = [...data.products].sort((a, b) => Number(sellable(b)) - Number(sellable(a)));
    return ranked.map((p) => ({
      url: `${origin}/products/${p.handle}`,
      name: p.title,
      type: p.product_type,
      options: (p.options ?? []).map((o) => o.name).filter((n) => n !== "Title"),
      variants: p.variants?.length ?? 1,
      price: p.variants?.[0]?.price,
    }));
  } catch { return null; }
}

export async function probeWooProducts(origin: string): Promise<ProductSample[] | null> {
  const { res, text } = await get(`${origin}/wp-json/wc/store/v1/products?per_page=10`).catch(() => ({ res: undefined, text: "" }));
  if (!res?.ok || !text.trim().startsWith("[")) return null;
  try {
    const data = JSON.parse(text) as Array<{ permalink: string; name: string; type: string; categories?: Array<{ name: string }>; attributes?: Array<{ name: string; has_variations: boolean }>; prices?: { price: string } }>;
    if (!data.length) return null;
    return data.map((p) => ({
      url: p.permalink,
      name: p.name,
      type: p.categories?.[0]?.name,
      options: (p.attributes ?? []).filter((a) => a.has_variations).map((a) => a.name),
      variants: p.type === "variable" ? 2 : 1,
      price: p.prices?.price,
    }));
  } catch { return null; }
}

export function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((r) => setTimeout(() => r(fallback), ms))]);
}

function locs(xml: string) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

export async function probeSitemap(origin: string, sitemaps: string[]) {
  const first = sitemaps[0] ?? `${origin}/sitemap.xml`;
  const { res, text } = await get(first, { headers: { accept: "application/xml,text/xml" } }).catch(() => ({ res: undefined, text: "" }));
  if (!res?.ok) return [];
  const isProduct = (u: string) => { try { return PRODUCT_PATH.test(new URL(u).pathname) && !/sitemap|\.xml(\.gz)?$/i.test(u); } catch { return false; } };
  let xml = text;
  for (let depth = 0; depth < 2 && /<sitemapindex/i.test(xml); depth++) {
    const all = locs(xml);
    const child = all.find((u) => /product/i.test(u)) ?? all[0];
    if (!child) return [];
    xml = await get(child, { headers: { accept: "application/xml,text/xml" } }).then((r) => r.text).catch(() => "");
  }
  return locs(xml).filter(isProduct).slice(0, 10);
}

export async function probeProductPage(url: string) {
  const { res, text: html } = await get(url);
  const $ = cheerio.load(html);
  const jsonLd = parseJsonLd(html);
  const product = jsonLd.find((o) => typeOf(o).some((t) => t === "Product" || t === "ProductGroup"));
  const optionNames = [
    ...$('select[name="id"], select[name*="option"], variant-selects select, variant-radios fieldset, .product-form__input, [data-option-name], .swatch, .variations select')
      .map((_, el) => $(el).attr("name") ?? $(el).attr("data-option-name") ?? $(el).find("legend, label").first().text().trim())
      .get()
      .filter((s) => s && s !== "id" && s.length < 30),
  ];
  const $noScripts = $.root().clone();
  $noScripts.find("script, style, noscript").remove();
  const text = $noScripts.find("body").text().replace(/\s+/g, " ").trim();
  return {
    status: res.status,
    productJsonLd: !!product,
    name: (product?.name as string | undefined) ?? $("h1").first().text().trim(),
    category: (product?.category as string | undefined),
    optionNames: [...new Set(optionNames)],
    hasAddToCart: /add to (cart|bag|basket)/i.test(text) || $('button[name="add"], form[action*="/cart/add"], .single_add_to_cart_button').length > 0,
    hasBuyNow: /buy (it )?now/i.test(text) || $("shopify-payment-button, .shopify-payment-button").length > 0,
    hasPriceInHtml: /[$€£]\s?\d|\d\s?(USD|EUR|GBP)/.test(text),
    jsOnly: !/[$€£]\s?\d|\d\s?(USD|EUR|GBP)/.test(text) && !$("h1").first().text().trim(),
  };
}

export async function probeCartCheckout(origin: string) {
  const [cart, checkout] = await Promise.all([
    get(`${origin}/cart`).then(({ res }) => ({ ok: res.ok, url: res.url })).catch(() => ({ ok: false, url: undefined })),
    fetch(`${origin}/checkout`, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(TIMEOUT), headers: { "user-agent": BROWSER_UA } })
      .then((r) => ({ status: r.status, host: new URL(r.url).host }))
      .catch(() => ({ status: 0, host: undefined })),
  ]);
  return { cartPage: cart.ok, cartUrl: cart.ok ? cart.url : undefined, checkoutHost: checkout.status && checkout.status < 400 ? checkout.host : undefined, checkoutStatus: checkout.status };
}
