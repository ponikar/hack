import { z } from "zod";
import { askJson } from "../llm";

export const Enrichment = z.object({
  category: z.string(),
  searchQueries: z.array(z.string()).max(5),
  journeyHints: z.array(z.string()).max(6),
  guestCheckout: z.enum(["yes", "no", "unknown"]),
  confidence: z.number().min(0).max(1),
});
export type Enrichment = z.infer<typeof Enrichment>;

const SYSTEM = `You classify online stores for an AI shopping agent. Given evidence about a store, reply with JSON:
{"category": "<one of: clothing, footwear, jewelry, beauty, food, grocery, electronics, home, furniture, toys, books, sports, pets, health, digital, other>",
 "searchQueries": ["<2-4 short queries a shopper would type into this store's search, based on real product names>"],
 "journeyHints": ["<up to 6 short, concrete facts a browser agent should know before shopping here: e.g. 'size must be chosen before add to cart', 'cart opens as a side drawer', 'checkout is on shop.example.com', 'newsletter popup on first load'>"],
 "guestCheckout": "yes|no|unknown",
 "confidence": 0.0-1.0}
Only state what the evidence supports.`;

export async function enrich(evidence: Record<string, unknown>): Promise<Enrichment | null> {
  if (!process.env.XAI_API_KEY && !process.env.OPENAI_API_KEY) return null;
  try {
    const raw = await askJson<unknown>(SYSTEM, JSON.stringify(evidence).slice(0, 12000));
    return Enrichment.parse(raw);
  } catch (err) {
    console.warn("[profile] enrich failed:", (err as Error).message.split("\n")[0]);
    return null;
  }
}

const CATEGORY_WORDS: [string, RegExp][] = [
  ["clothing", /\b(hoodie|t-?shirt|tee|dress|jeans|jacket|sweater|shirt|pants|apparel|clothing)\b/i],
  ["footwear", /\b(shoe|sneaker|boot|sandal|footwear)\b/i],
  ["jewelry", /\b(ring|necklace|bracelet|earring|jewel)/i],
  ["beauty", /\b(skincare|serum|lipstick|makeup|cosmetic|fragrance|beauty)\b/i],
  ["grocery", /\b(grocery|milk|snack|coffee|tea|pantry|organic)\b/i],
  ["food", /\b(chocolate|sauce|meal|food|bakery|cookie)\b/i],
  ["electronics", /\b(headphone|laptop|phone|camera|charger|speaker|electronics)\b/i],
  ["home", /\b(candle|pillow|rug|decor|kitchen|homeware)\b/i],
  ["furniture", /\b(sofa|chair|table|desk|furniture)\b/i],
  ["sports", /\b(fitness|gym|yoga|running|bike|sport)\b/i],
  ["pets", /\b(dog|cat|pet)\b/i],
];

export function heuristicCategory(text: string) {
  return CATEGORY_WORDS.find(([, re]) => re.test(text))?.[0] ?? "other";
}
