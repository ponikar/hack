import * as cheerio from "cheerio";
import type { ListedResult } from "@watchdog/shared";

const REQUIRED = ["name", "image", "description", "offers", "sku"];

export async function listedCheck(url: string): Promise<ListedResult> {
  const html = await fetch(url).then((r) => r.text());
  const $ = cheerio.load(html);
  const blocks = $('script[type="application/ld+json"]')
    .map((_, el) => $(el).text())
    .get();

  const products: Record<string, unknown>[] = [];
  for (const b of blocks) {
    try {
      const json = JSON.parse(b);
      const items = Array.isArray(json) ? json : json["@graph"] ?? [json];
      for (const it of items) if (it?.["@type"] === "Product") products.push(it);
    } catch {}
  }

  const product = products[0];
  const fields = product ? Object.keys(product) : [];
  const missing = REQUIRED.filter((f) => !fields.includes(f));
  const notes: string[] = [];
  if (!product) notes.push("No schema.org Product JSON-LD found. Shopping systems cannot list this product.");
  else if (missing.length) notes.push(`Product schema missing: ${missing.join(", ")}`);

  return {
    verdict: product && missing.length === 0 ? "pass" : "fail",
    hasProductSchema: Boolean(product),
    schemaFields: fields,
    missingFields: product ? missing : REQUIRED,
    notes,
  };
}
