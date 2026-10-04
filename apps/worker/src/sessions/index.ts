import type { Persona, Session, StoreProfile, TemplateId } from "@watchdog/shared";
import { askJson } from "../llm";
import { PERSONAS } from "./personas";
import { isLiveStore, TEMPLATES, type TemplateParams } from "./templates";

const BROWSER_ORDER: TemplateId[] = ["search-first", "direct-link", "category-browse", "variant-required", "cart-drawer", "buy-now"];

function applicableBrowserTemplates(p: StoreProfile): TemplateId[] {
  const hasProduct = p.products.sampleUrls.length > 0;
  const gate: Record<TemplateId, boolean> = {
    "feed-reader": false,
    "direct-link": hasProduct,
    "search-first": !!p.structure.searchUrl,
    "category-browse": true,
    "variant-required": hasProduct && p.products.variantsRequired,
    "cart-drawer": hasProduct && p.structure.cart === "drawer",
    "buy-now": hasProduct && p.journeyHints.some((h) => /buy[\s-]?now/i.test(h)),
  };
  return BROWSER_ORDER.filter((t) => gate[t]);
}

async function pickVariant(p: StoreProfile, productName: string): Promise<string | undefined> {
  if (!p.products.variantsRequired || !p.products.optionNames.length) return undefined;
  if (!process.env.XAI_API_KEY && !process.env.OPENAI_API_KEY) return undefined;
  try {
    const res = await askJson<{ variant?: unknown }>(
      `Pick one plausible, commonly stocked variant for a product. Reply with JSON {"variant": "<Option Value, e.g. 'Size M' or 'Color Black'>"}. Use only the given option names.`,
      JSON.stringify({ productName, optionNames: p.products.optionNames }),
    );
    return typeof res.variant === "string" && res.variant.trim() ? res.variant.trim().slice(0, 60) : undefined;
  } catch (err) {
    console.warn("[sessions] variant pick failed:", (err as Error).message.split("\n")[0]);
    return undefined;
  }
}

export async function generateSessions(profile: StoreProfile, opts: { maxBrowserSessions?: number; productHint?: string } = {}): Promise<Session[]> {
  const maxBrowser = opts.maxBrowserSessions ?? 3;
  const liveStore = isLiveStore(profile);
  const productUrl = profile.products.sampleUrls[0] ?? "";
  const productName = profile.products.sampleNames[0] ?? opts.productHint ?? "";
  const query = profile.searchQueries[0] || productName || (profile.category !== "other" ? profile.category : "best sellers");
  const variant = await pickVariant(profile, productName);
  const params: TemplateParams = { productUrl, productName, query, variant };
  const variantText = variant ? ` in ${variant}` : profile.products.variantsRequired ? " in any available option" : "";
  const goal = `buy 1x ${productName || "a product"}${variantText}`;

  const sessions: Session[] = [];
  let n = 0;
  const push = (persona: Persona, template: TemplateId) => {
    n += 1;
    const feed = template === "feed-reader";
    sessions.push({
      id: `${persona.id}-${template}-${String(n).padStart(2, "0")}`,
      persona: persona.id,
      archetype: persona.archetype,
      template,
      goal: feed ? `read ${productName || "a product"} without JavaScript` : goal,
      steps: TEMPLATES[template](profile, params),
      maxSteps: feed ? 5 : 25,
      budgetMs: feed ? 30_000 : 120_000,
      liveStore,
    });
  };

  const feedPersonas = PERSONAS.filter((p) => p.archetype === "feed-reader");
  const browserPersonas = PERSONAS.filter((p) => p.archetype === "browser-agent");

  for (const persona of feedPersonas) {
    push(persona, "feed-reader");
  }

  applicableBrowserTemplates(profile)
    .slice(0, maxBrowser)
    .forEach((template, i) => push(browserPersonas[i % browserPersonas.length], template));

  return sessions;
}
