import type { Page } from "playwright";

const PRODUCT_LINK = /\/(products?|p|item|dp)\/[^/?#]+/i;
const CLICK_TIMEOUT = 4000;

async function clickFirst(page: Page, ...candidates: ReturnType<Page["locator"]>[]) {
  for (const c of candidates) {
    const loc = c.filter({ visible: true }).first();
    if ((await loc.count()) === 0) continue;
    await loc.click({ timeout: CLICK_TIMEOUT });
    return true;
  }
  return false;
}

const settle = (page: Page) => page.waitForLoadState("domcontentloaded", { timeout: 4000 }).then(() => page.waitForTimeout(700)).catch(() => {});

export async function fastPath(page: Page, instr: string, ctx: { searchUrl?: string }): Promise<boolean> {
  const i = instr.toLowerCase();
  let m: RegExpMatchArray | null;

  if ((m = instr.match(/search for '(.+)'/))) {
    const q = m[1];
    const box = page.getByRole("searchbox").or(page.locator('input[type=search], input[name=q], input[name=query], input[name=s], input[placeholder*="search" i]')).filter({ visible: true }).first();
    if (await box.count()) {
      await box.click({ timeout: CLICK_TIMEOUT }).catch(() => {});
      await box.fill(q, { timeout: CLICK_TIMEOUT });
      await box.press("Enter");
    } else {
      const opener = page.getByRole("button", { name: /search/i }).or(page.locator('[aria-label*="search" i], a[href*="/search"]')).filter({ visible: true }).first();
      if (await opener.count()) {
        await opener.click({ timeout: CLICK_TIMEOUT });
        const box2 = page.locator('input[type=search], input[name=q], input[placeholder*="search" i]').filter({ visible: true }).first();
        await box2.fill(q, { timeout: CLICK_TIMEOUT });
        await box2.press("Enter");
      } else if (ctx.searchUrl) {
        const u = new URL(ctx.searchUrl);
        u.searchParams.set("q", q);
        await page.goto(u.toString(), { waitUntil: "domcontentloaded", timeout: 15000 });
      } else return false;
    }
    await settle(page);
    return true;
  }

  if ((m = instr.match(/open the product '(.+)'/))) {
    const name = m[1];
    const byName = page.getByRole("link", { name: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 40), "i") });
    const byHref = page.locator("a[href]").filter({ has: page.locator(":scope") }).filter({ hasNot: page.locator("nav *") });
    const hrefMatch = page.locator("main a[href], a[href]").filter({ visible: true });
    let ok = await clickFirst(page, byName);
    if (!ok) {
      const n = await hrefMatch.count();
      for (let k = 0; k < Math.min(n, 60) && !ok; k++) {
        const href = (await hrefMatch.nth(k).getAttribute("href")) ?? "";
        if (PRODUCT_LINK.test(href)) { await hrefMatch.nth(k).click({ timeout: CLICK_TIMEOUT }); ok = true; }
      }
    }
    void byHref;
    if (ok) await settle(page);
    return ok;
  }

  if (i.includes("first in-stock product") || i.includes("first product")) {
    const links = page.locator("a[href]").filter({ visible: true });
    const n = await links.count();
    for (let k = 0; k < Math.min(n, 80); k++) {
      const href = (await links.nth(k).getAttribute("href")) ?? "";
      if (PRODUCT_LINK.test(href)) { await links.nth(k).click({ timeout: CLICK_TIMEOUT }); await settle(page); return true; }
    }
    return false;
  }

  if (i.startsWith("choose any available option") || i.startsWith("select variant")) {
    let did = false;
    const selects = page.locator("select").filter({ visible: true });
    for (let k = 0; k < (await selects.count()); k++) {
      const opts = await selects.nth(k).locator("option:not([disabled])").all();
      if (opts.length > 1) { await selects.nth(k).selectOption({ index: 1 }); did = true; }
    }
    const radios = page.locator('input[type=radio]:not([disabled]):not([checked]), [role=radio]:not([aria-disabled=true]), .swatch:not(.disabled), [data-option-value]:not(.disabled)').filter({ visible: true });
    if (await radios.count()) { await radios.first().click({ timeout: CLICK_TIMEOUT, force: true }).catch(() => {}); did = true; }
    const labels = page.locator("label").filter({ hasText: /^(XS|S|M|L|XL|\d{1,2}(\.\d)?|UK ?\d+|US ?\d+|EU ?\d+)$/i }).filter({ visible: true });
    if (!did && (await labels.count())) { await labels.first().click({ timeout: CLICK_TIMEOUT }); did = true; }
    return did;
  }

  if (i.includes("add to cart")) {
    const ok = await clickFirst(page, page.getByRole("button", { name: /add to (cart|bag|basket)/i }), page.getByRole("link", { name: /add to (cart|bag|basket)/i }), page.locator('button[name="add"], form[action*="/cart/add"] button[type=submit], .single_add_to_cart_button'));
    if (ok) await page.waitForTimeout(1200);
    return ok;
  }

  if (i.includes("checkout")) {
    const ok = await clickFirst(page, page.getByRole("button", { name: /check ?out/i }), page.getByRole("link", { name: /check ?out/i }), page.locator('button[name="checkout"], a[href*="/checkout"]'));
    if (ok) await settle(page);
    return ok;
  }

  if (i.includes("buy now") || i.includes("buy it now")) {
    const ok = await clickFirst(page, page.getByRole("button", { name: /buy (it )?now/i }), page.locator(".shopify-payment-button__button"));
    if (ok) await settle(page);
    return ok;
  }

  if (i.startsWith("place the order")) {
    const fill = async (sel: string, v: string) => { const l = page.locator(sel).filter({ visible: true }).first(); if (await l.count()) await l.fill(v, { timeout: 2000 }).catch(() => {}); };
    await fill('input[name*="name" i], input[autocomplete="name"]', "Test Buyer");
    await fill('input[type=email], input[name*="email" i]', "buyer@example.com");
    await fill('input[name*="address" i], input[autocomplete="street-address"]', "1 Test St");
    await fill('input[name*="card" i], input[autocomplete="cc-number"]', "4242 4242 4242 4242");
    const ok = await clickFirst(page, page.getByRole("button", { name: /place order|pay now|complete order|buy now/i }));
    if (ok) await settle(page);
    return ok;
  }

  if (i.includes("close the cart drawer")) {
    await page.keyboard.press("Escape");
    return clickFirst(page, page.locator('[aria-label*="cart" i], a[href*="/cart"]'));
  }

  return false;
}
