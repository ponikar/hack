import * as cheerio from "cheerio";
import type { Page } from "playwright";
import type { Expect } from "@watchdog/shared";
import { parseJsonLd } from "../profile/probes";

const PRICE = /[$€£]\s?\d[\d,.]*|\d[\d,.]*\s?(USD|EUR|GBP)/;
const ADD = /add to (cart|bag|basket)/i;
export function textMatch(hay: string, needle: string) {
  const h = hay.toLowerCase();
  const n = needle.toLowerCase().trim();
  if (h.includes(n)) return true;
  const head = n.split(/\s+/).slice(0, 3).join(" ");
  return head.length >= 6 && h.includes(head);
}

const DRAWER = "cart-drawer, #CartDrawer, [data-cart-drawer], .cart-drawer, .mini-cart, #mini-cart, [id*=cart-drawer], [class*=cart-drawer], [class*=CartDrawer]";

async function bodyText(page: Page) {
  return page.locator("body").innerText({ timeout: 3000 }).then((t) => t.replace(/\s+/g, " ")).catch(() => "");
}

async function token(page: Page, t: string): Promise<boolean> {
  if (t.startsWith("urlContains:")) return page.url().toLowerCase().includes(t.slice(12).toLowerCase());
  if (t.startsWith("text:")) return textMatch(await bodyText(page), t.slice(5));
  switch (t) {
    case "drawerVisible":
      return page.locator(DRAWER).filter({ visible: true }).count().then((n) => n > 0);
    case "cartCountIncreased": {
      const badge = await page.locator("[class*=cart-count], [data-cart-count], .cart-count-bubble, [id*=cart-count], [class*=CartCount]").first().innerText({ timeout: 1000 }).catch(() => "");
      if (/[1-9]/.test(badge)) return true;
      return /\b[1-9]\d* items? in (your )?(cart|bag|basket)|added to (your )?(cart|bag|basket)|item added/i.test(await bodyText(page));
    }
    case "addToCartVisible":
      return page.getByRole("button", { name: ADD }).or(page.getByRole("link", { name: ADD })).filter({ visible: true }).count().then((n) => n > 0);
    case "addToCartEnabled":
      return page.getByRole("button", { name: ADD }).filter({ visible: true }).first().isEnabled({ timeout: 1000 }).catch(() => false);
    case "addToCartDisabled":
      return page.getByRole("button", { name: ADD }).first().isDisabled({ timeout: 1000 }).catch(() => false);
    case "optionSelected":
      return page.evaluate(() => {
        const sel = [...document.querySelectorAll("select")].some((s) => s.selectedIndex > 0 && !/^(select|choose)/i.test(s.value));
        const radio = [...document.querySelectorAll<HTMLInputElement>('input[type=radio]')].some((r) => r.checked);
        return sel || radio;
      });
    case "validationMessage":
      return /please (select|choose)|select (a|an|your) (size|colou?r|option)|required/i.test(await bodyText(page));
    default:
      return false;
  }
}

export async function checkPage(page: Page, e: Expect): Promise<{ ok: boolean; why: string }> {
  const checks: Promise<boolean>[] = [];
  const labels: string[] = [];
  if (e.urlContains) { checks.push(token(page, `urlContains:${e.urlContains}`)); labels.push(`url contains "${e.urlContains}"`); }
  if (e.urlHost) { checks.push(Promise.resolve(new URL(page.url()).host === e.urlHost)); labels.push(`on ${e.urlHost}`); }
  if (e.text) { checks.push(token(page, `text:${e.text}`)); labels.push(`page shows "${e.text}"`); }
  if (e.anyOf?.length) { checks.push(Promise.all(e.anyOf.map((t) => token(page, t))).then((r) => r.some(Boolean))); labels.push(`any of ${e.anyOf.join(" | ")}`); }
  if (!checks.length) return { ok: true, why: "" };
  const results = await Promise.all(checks);
  const failed = labels.filter((_, i) => !results[i]);
  return { ok: failed.length === 0, why: failed.join("; ") };
}

const TOKEN_TEXT: Record<string, string> = {
  jsonProducts: "no product feed",
  jsonldProduct: "no Product schema",
  priceVisible: "no visible price",
  variantsVisible: "no variant options",
};

function humanToken(t: string) {
  if (t.startsWith("text:")) return `no "${t.slice(5)}"`;
  if (t.startsWith("urlContains:")) return `no "${t.slice(12)}" in the URL`;
  return TOKEN_TEXT[t] ?? `no ${t}`;
}

function joinHuman(xs: string[]) {
  return xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

export function checkHtml(html: string, e: Expect, url: string): { ok: boolean; why: string } {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
  const text = $("body").text().replace(/\s+/g, " ");
  const tok = (t: string) => {
    if (t.startsWith("text:")) return textMatch(text, t.slice(5));
    if (t === "jsonProducts") { try { const j = JSON.parse(html); return Array.isArray(j?.products) ? j.products.length > 0 : Array.isArray(j) && j.length > 0; } catch { return false; } }
    if (t === "jsonldProduct") return parseJsonLd(html).some((o) => ([] as string[]).concat(o["@type"] as string).some((x) => x === "Product" || x === "ProductGroup"));
    if (t === "priceVisible") return PRICE.test(text);
    if (t === "variantsVisible") return /<select[^>]+name="id"|variant-selects|variant-radios|<option/i.test(html);
    if (t.startsWith("urlContains:")) return url.includes(t.slice(12));
    return false;
  };
  const fails: string[] = [];
  if (e.text && !textMatch(text, e.text)) fails.push(`the product name "${e.text}" is missing from the HTML`);
  if (e.anyOf?.length && !e.anyOf.some(tok)) fails.push(`the HTML has ${joinHuman(e.anyOf.map(humanToken))}`);
  return { ok: fails.length === 0, why: fails.join(" and ") };
}
