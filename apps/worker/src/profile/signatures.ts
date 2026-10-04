import type { Platform } from "@watchdog/shared";

export const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";

type Sig = { platform: Platform; signal: string; test: (h: Headers, html: string) => boolean };

const has = (re: RegExp) => (_: Headers, html: string) => re.test(html);
const header = (name: string) => (h: Headers) => h.has(name);

export const PLATFORM_SIGS: Sig[] = [
  { platform: "shopify", signal: "x-shopid header", test: header("x-shopid") },
  { platform: "shopify", signal: "x-shopify-stage header", test: header("x-shopify-stage") },
  { platform: "shopify", signal: "cdn.shopify.com", test: has(/cdn\.shopify\.com/) },
  { platform: "shopify", signal: "Shopify.theme", test: has(/Shopify\.theme/) },
  { platform: "woocommerce", signal: "woocommerce body class", test: has(/class="[^"]*woocommerce/) },
  { platform: "woocommerce", signal: "wc-ajax", test: has(/wc-ajax=/) },
  { platform: "woocommerce", signal: "wp-json/wc", test: has(/wp-json\/wc/) },
  { platform: "bigcommerce", signal: "cdn11.bigcommerce.com", test: has(/cdn11\.bigcommerce\.com/) },
  { platform: "bigcommerce", signal: "stencil", test: has(/stencil-utils|bigcommerce\.com\/stencil/) },
  { platform: "magento", signal: "x-magento-vary cookie", test: (h) => /X-Magento-Vary/i.test(h.get("set-cookie") ?? "") },
  { platform: "magento", signal: "/static/version", test: has(/\/static\/version\d+/) },
  { platform: "magento", signal: "Magento_", test: has(/Magento_[A-Z]/) },
];

export function detectPlatform(h: Headers, html: string) {
  const hits = PLATFORM_SIGS.filter((s) => s.test(h, html));
  const counts = new Map<Platform, string[]>();
  for (const s of hits) counts.set(s.platform, [...(counts.get(s.platform) ?? []), s.signal]);
  const best = [...counts.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  if (!best) return { name: "custom" as Platform, confidence: 0.4, signals: [] as string[] };
  return { name: best[0], confidence: Math.min(1, 0.5 + best[1].length * 0.2), signals: best[1] };
}

export const FRAMEWORK_SIGS: [string, RegExp][] = [
  ["next", /__NEXT_DATA__|\/_next\//],
  ["nuxt", /__NUXT__|\/_nuxt\//],
  ["remix", /__remixContext/],
  ["gatsby", /___gatsby/],
  ["vite-spa", /type="module"[^>]*\/assets\/index-[a-z0-9]+\.js/],
  ["hydrogen", /hydrogen|shopify-hydrogen/i],
];

export const CAPTCHA_SIGS: [string, RegExp][] = [
  ["turnstile", /challenges\.cloudflare\.com\/turnstile|cf-turnstile/],
  ["recaptcha", /google\.com\/recaptcha|g-recaptcha|grecaptcha/],
  ["hcaptcha", /js\.hcaptcha\.com|h-captcha/],
];

export const BOT_PROTECTION_SIGS: [string, RegExp][] = [
  ["datadome", /tags\.datadome\.co|datadome/i],
  ["perimeterx", /client\.px-cloud\.net|_pxhd|perimeterx/i],
  ["akamai", /_abck|akamai/i],
  ["kasada", /kasada|kpsdk/i],
];

export const COOKIE_BANNER_SIGS: [string, RegExp][] = [
  ["onetrust", /onetrust-banner-sdk|optanon/i],
  ["cookiebot", /CybotCookiebotDialog|cookiebot/i],
  ["didomi", /didomi-notice|didomi/i],
  ["osano", /osano-cm-window|osano/i],
  ["cookieyes", /cky-consent-container|cookieyes/i],
  ["quantcast", /qc-cmp2-container/i],
  ["shopify-consent", /shopify-pc__banner|consent-tracking-api/i],
];

export const POPUP_SIGS: RegExp[] = [/static\.klaviyo\.com|klaviyo\.com\/onsite/i, /privy\.com/i, /justuno/i, /optinmonster/i, /wisepops/i, /omnisend/i, /popup/i];

export const PRODUCT_PATH = /\/(products?|p|item|dp|shop\/[^/]+)\/[^/?#]+/i;
export const CATEGORY_PATH = /\/(collections|product-category|category|categories|shop|c)\/[^/?#]+/i;
export const SEARCH_PATH = /\/(search|s)(\?|$)|[?&](q|query|s)=/i;
