import type { StoreProfile } from "./types";

const PLATFORM: Record<string, string> = {
  shopify: "Shopify",
  woocommerce: "WooCommerce",
  bigcommerce: "BigCommerce",
  magento: "Magento",
  custom: "Custom stack",
  unknown: "Unknown platform",
};

function Chip({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "warn" | "fail" | "ok" }) {
  const cls =
    tone === "fail"
      ? "border-fail/30 bg-fail-soft text-fail"
      : tone === "warn"
        ? "border-warn/30 bg-warn-soft text-warn"
        : tone === "ok"
          ? "border-ok/30 bg-ok-soft text-ok"
          : "border-line bg-surface text-ink-2";
  return <span className={`inline-flex h-6 items-center rounded-md border px-2 text-xs font-medium ${cls}`}>{children}</span>;
}

export function profileChips(p: StoreProfile) {
  const chips: { key: string; text: string; tone?: "neutral" | "warn" | "fail" | "ok" }[] = [];
  const platform = PLATFORM[p.platform.name] ?? p.platform.name;
  chips.push({ key: "platform", text: p.rendering.framework && p.platform.name === "custom" ? `${platform} (${p.rendering.framework})` : platform });
  if (p.category && p.category !== "other") chips.push({ key: "category", text: p.category });
  chips.push(p.rendering.jsOnly ? { key: "js", text: "JS-only rendering", tone: "fail" } : { key: "js", text: "Server-rendered", tone: "ok" });
  if (p.structure.cart !== "unknown") chips.push({ key: "cart", text: p.structure.cart === "drawer" ? "Cart drawer" : "Cart page" });
  if (p.structure.guestCheckout === "no") chips.push({ key: "guest", text: "No guest checkout", tone: "fail" });
  if (p.products.variantsRequired) chips.push({ key: "variants", text: "Variants required" });
  chips.push(p.structuredData.productJsonLd ? { key: "jsonld", text: "Product JSON-LD", tone: "ok" } : { key: "jsonld", text: "No Product schema", tone: "warn" });
  if (p.structuredData.feed) chips.push({ key: "feed", text: `Feed: ${p.structuredData.feed}`, tone: "ok" });
  const h = p.hostility;
  if (h.captcha) chips.push({ key: "captcha", text: h.captcha, tone: "warn" });
  if (h.botProtection) chips.push({ key: "bot", text: h.botProtection, tone: "warn" });
  if (h.cookieBanner) chips.push({ key: "cookie", text: h.cookieBanner, tone: "warn" });
  if (h.newsletterPopup) chips.push({ key: "popup", text: "Newsletter popup", tone: "warn" });
  if (h.loginWall) chips.push({ key: "login", text: "Login wall", tone: "fail" });
  if (h.blockedStatus) chips.push({ key: "blocked", text: `HTTP ${h.blockedStatus} to bots`, tone: "fail" });
  const blocked = Object.entries(p.ai.robotsAllows).filter(([, ok]) => !ok).map(([b]) => b);
  if (blocked.length) chips.push({ key: "robots", text: `robots.txt blocks ${blocked.join(", ")}`, tone: "fail" });
  if (p.ai.llmsTxt) chips.push({ key: "llms", text: "llms.txt", tone: "ok" });
  if (p.ai.agentsMd) chips.push({ key: "agents", text: "agents.md", tone: "ok" });
  return chips;
}

export function ProfileSummary({ profile, pending }: { profile: StoreProfile | null; pending: boolean }) {
  if (!profile) {
    if (!pending) return null;
    return (
      <div className="flex flex-wrap gap-1.5" aria-label="Profiling store">
        {[88, 120, 72, 96, 110].map((w, i) => (
          <span key={i} className="skeleton h-6" style={{ width: w }} />
        ))}
      </div>
    );
  }
  const chips = profileChips(profile);
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <Chip key={c.key} tone={c.tone}>
          {c.text}
        </Chip>
      ))}
    </div>
  );
}
