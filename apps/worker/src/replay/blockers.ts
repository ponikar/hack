import type { Page } from "playwright";

export type Blocker = "captcha" | "login" | "overlay" | "challenge";

export const BLOCKER_TEXT: Record<Blocker, string> = {
  captcha: "A CAPTCHA blocked the agent.",
  login: "Checkout requires an account login. Guest checkout is not available.",
  overlay: "A full-screen popup covered the page and could not be dismissed.",
  challenge: "A bot-protection challenge page was served instead of the store.",
};

export async function detectBlocker(page: Page): Promise<Blocker | null> {
  try {
    return await page.evaluate(`(() => {
      const cap = document.querySelector('iframe[src*="recaptcha"], iframe[src*="hcaptcha.com"], iframe[src*="challenges.cloudflare.com"], .cf-turnstile, .h-captcha, .g-recaptcha');
      if (cap && cap.getBoundingClientRect().height > 30) return "captcha";
      if (/just a moment|checking your browser|verify you are human|access denied/i.test(document.title)) return "challenge";
      const pw = document.querySelector('input[type=password]');
      if (pw && pw.offsetParent !== null && /cart|checkout|login|account/i.test(location.href)) return "login";
      const vw = innerWidth, vh = innerHeight;
      const els = document.querySelectorAll("body *");
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        const cs = getComputedStyle(el);
        if (cs.position !== "fixed" || cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) continue;
        const r = el.getBoundingClientRect();
        if (r.width >= vw * 0.8 && r.height >= vh * 0.8) return "overlay";
      }
      return null;
    })()`) as Blocker | null;
  } catch (err) {
    console.warn("[blockers] detect failed:", (err as Error).message.split("\n")[0]);
    return null;
  }
}

export async function tryDismiss(page: Page): Promise<boolean> {
  const closers = page
    .getByRole("button", { name: /^(accept( all)?|agree|got it|ok|close|no,? thanks|dismiss|continue|×|x)$/i })
    .or(page.locator('[aria-label*="close" i], [aria-label*="dismiss" i], button[class*="close" i], .modal__close, .popup-close'))
    .filter({ visible: true });
  const n = await closers.count();
  for (let i = 0; i < Math.min(n, 3); i++) {
    await closers.nth(i).click({ timeout: 1500, force: true }).catch(() => {});
  }
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(400);
  return (await detectBlocker(page)) !== "overlay";
}
