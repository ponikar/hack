export type BenchStore = { id: string; kind: "fixture" | "real"; url: string; product?: string; notes?: string };

export const BENCH_BASE = process.env.BENCH_BASE ?? "https://ai-buyer-watchdog.vercel.app";

export const FIXTURE_IDS = [
  "control", "js-only", "no-schema", "popup-trap", "popup-closable", "login-wall", "captcha",
  "robots-block", "bot-403", "variant-required", "cart-drawer", "icon-buttons", "search-only",
] as const;

const fixtures: BenchStore[] = FIXTURE_IDS.map((id) => ({ id, kind: "fixture", url: `${BENCH_BASE}/bench/${id}`, product: "Trail Runner" }));

const real: BenchStore[] = [
  { id: "allbirds", kind: "real", url: "https://www.allbirds.com", notes: "Shopify; cookie banner, cart drawer, AI chat widget" },
  { id: "everlane", kind: "real", url: "https://www.everlane.com", notes: "Shopify; auto-added PackageProtect" },
  { id: "gymshark", kind: "real", url: "https://www.gymshark.com", notes: "Shopify; region modal, checkout on us.checkout subdomain" },
  { id: "rothys", kind: "real", url: "https://rothys.com", notes: "Shopify; cart drawer" },
  { id: "glossier", kind: "real", url: "https://www.glossier.com", notes: "Shopify" },
  { id: "patagonia", kind: "real", url: "https://www.patagonia.com", notes: "Salesforce; AI fetcher gets maintenance page" },
  { id: "johnlewis", kind: "real", url: "https://www.johnlewis.com", notes: "Custom; auth subdomain with guest option" },
  { id: "nike", kind: "real", url: "https://www.nike.com", notes: "Custom; Akamai; add-to-bag blocked for automated browser" },
  { id: "bombas", kind: "real", url: "https://www.bombas.com", notes: "Vercel bot protection 429 to plain fetch" },
  { id: "warbyparker", kind: "real", url: "https://www.warbyparker.com", notes: "403 to plain fetch" },
  // Hold-out stores: ground truth recorded after the engine was tuned; never used to choose fixes.
  { id: "kotn", kind: "real", url: "https://kotn.com", notes: "holdout; Shopify; price JS-rendered; package-protection upsell" },
  { id: "lush", kind: "real", url: "https://www.lush.com/uk/en", notes: "holdout; custom; 403 to AI fetcher" },
];

export const BENCH_STORES: BenchStore[] = [...fixtures, ...real];
