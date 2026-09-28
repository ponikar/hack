export function hostOf(url: string): string {
  try {
    const u = new URL(url);
    return u.host + (u.pathname !== "/" ? u.pathname : "") + (u.search || "");
  } catch {
    return url;
  }
}

export function relativeTime(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const s = Math.round(diff / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ms(n: number): string {
  if (n < 1000) return `${Math.round(n)} ms`;
  return `${(n / 1000).toFixed(n < 10000 ? 1 : 0)} s`;
}

const SHORT: [RegExp, string][] = [
  [/place the order|pay now|complete order/i, "Place order"],
  [/checkout/i, "Checkout"],
  [/add to (cart|bag|basket)/i, "Add to cart"],
  [/variant|select .* (size|colour|color)/i, "Pick variant"],
  [/search/i, "Search"],
  [/category|collection/i, "Browse category"],
  [/open .*product|product/i, "Open product"],
  [/cart|bag|basket/i, "Open cart"],
];

export function shortStep(op: string, label: string, index = 0): string {
  if (op === "goto") return "Open store";
  if (op === "fetch") return index === 0 ? "Fetch product" : "Price & variants";
  if (op === "dismiss") return "Dismiss popup";
  if (op === "stop") return "Payment gate";
  for (const [re, name] of SHORT) if (re.test(label)) return name;
  const words = label.replace(/^(open|go to|the)\s+/i, "").split(/\s+/).slice(0, 3).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export const BLOCKER_LABEL: Record<string, string> = {
  login: "login wall",
  overlay: "popup",
  captcha: "CAPTCHA",
  waf: "bot block",
  challenge: "challenge",
};

export function blockerLabel(b?: string): string | undefined {
  if (!b) return undefined;
  return BLOCKER_LABEL[b] ?? b.replace(/_/g, " ");
}
