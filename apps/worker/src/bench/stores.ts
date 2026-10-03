export type BenchStore = { id: string; kind: "fixture" | "real"; url: string; product?: string; notes?: string };

export const BENCH_BASE = process.env.BENCH_BASE ?? "https://ai-buyer-watchdog.vercel.app";

export const FIXTURE_IDS = [
  "control", "js-only", "no-schema", "popup-trap", "popup-closable", "login-wall", "captcha",
  "robots-block", "bot-403", "variant-required", "cart-drawer", "icon-buttons", "search-only",
] as const;

const fixtures: BenchStore[] = FIXTURE_IDS.map((id) => ({ id, kind: "fixture", url: `${BENCH_BASE}/bench/${id}`, product: "Trail Runner" }));

// Real stores are added separately, once ground truth for them has been recorded.
const real: BenchStore[] = [];

export const BENCH_STORES: BenchStore[] = [...fixtures, ...real];
