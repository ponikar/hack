import type { Page } from "playwright";
import { askJsonWithImage, llmAvailable } from "../llm";

export { llmAvailable };

type Action =
  | { type: "click"; ref: string; why?: string }
  | { type: "fill"; ref: string; value: string; why?: string }
  | { type: "select"; ref: string; value: string; why?: string }
  | { type: "press"; key: string; why?: string }
  | { type: "scroll"; why?: string }
  | { type: "done"; why?: string }
  | { type: "stuck"; why?: string };

const SYSTEM = `You are an AI shopping agent driving a real web browser, like ChatGPT agent or Claude in Chrome.
Each turn you get: the current step's goal, the URL, the page's accessibility snapshot (interactive elements carry [ref=eN]) and a screenshot.
Reply with exactly ONE JSON action:
{"type":"click","ref":"e12","why":"..."}
{"type":"fill","ref":"e3","value":"...","why":"..."}
{"type":"select","ref":"e7","value":"<option label>","why":"..."}
{"type":"press","key":"Enter|Escape","why":"..."}
{"type":"scroll","why":"..."}
{"type":"done","why":"the goal of this step is already achieved on screen"}
{"type":"stuck","why":"what blocks you"}
Behave like a careful human shopper:
- Close or decline cookie banners, newsletter popups, region selectors and chat widgets that get in the way (prefer "decline", "no thanks", "close", "continue shopping").
- Pick any in-stock size or variant when one is required. Use the screenshot to understand icon-only buttons.
- Prefer guest checkout. Never sign in, create an account, subscribe, or type personal data unless the goal says so.
- Never pay, place or complete an order unless the goal explicitly says to.
- Stay on this store's current site and region. If a country or region selector appears, close it or keep the current region; never switch to another country's site.
- Reply "stuck" only when a CAPTCHA, a mandatory login with no guest option, bot protection, or a control that does not work leaves no way forward.`;

async function observe(page: Page, withShot: boolean) {
  const snap = (await page.locator("body").ariaSnapshot({ mode: "ai" } as never).catch(() => "")).slice(0, 8000);
  // Screenshots cost far more tokens than text; only attach one when the text tree is missing or the last action did not help.
  const shot = withShot || !snap ? await page.screenshot({ type: "jpeg", quality: 45, scale: "css" }).then((b) => b.toString("base64")).catch(() => undefined) : undefined;
  return { snap, shot };
}

export type AgentStepResult = { ok: boolean; done: boolean; why: string; actions: string[] };

export async function agentStep(page: Page, goal: string, opts: { maxActions?: number; isDone?: () => Promise<boolean>; screenshot?: boolean } = {}): Promise<AgentStepResult> {
  const max = opts.maxActions ?? 4;
  let needShot = opts.screenshot ?? false;
  const actions: string[] = [];
  let lastWhy = "";
  for (let n = 0; n < max; n++) {
    if (opts.isDone && (await opts.isDone())) return { ok: true, done: true, why: lastWhy, actions };
    if (!llmAvailable()) return { ok: false, done: false, why: lastWhy || "LLM call cap reached.", actions };
    const { snap, shot } = await observe(page, needShot);
    if (!snap && !shot) return { ok: false, done: false, why: "Page could not be read.", actions };
    const prior = actions.length ? `\nActions already taken this step: ${actions.join(" → ")}` : "";
    let a: Action;
    try {
      a = await askJsonWithImage<Action>(SYSTEM, `Goal: ${goal}\nURL: ${page.url()}${prior}\n\nAccessibility snapshot:\n${snap || "(unavailable: the page markup broke the accessibility tree, rely on the screenshot)"}`, shot);
    } catch (err) {
      return { ok: false, done: false, why: `LLM error: ${(err as Error).message.split("\n")[0]}`, actions };
    }
    lastWhy = a.why ?? "";
    if (a.type === "done") return { ok: true, done: true, why: lastWhy, actions };
    if (a.type === "stuck") return { ok: false, done: false, why: lastWhy || "Agent could not continue.", actions };
    try {
      if (a.type === "click") {
        const loc = page.locator(`aria-ref=${a.ref}`);
        // Real agents click what they see; Playwright refuses elements it thinks are covered or animating, so retry with force.
        await loc.click({ timeout: 4000 }).catch(() => loc.click({ timeout: 4000, force: true }));
      }
      else if (a.type === "fill") await page.locator(`aria-ref=${a.ref}`).fill(a.value, { timeout: 5000 });
      else if (a.type === "select") await page.locator(`aria-ref=${a.ref}`).selectOption({ label: a.value }, { timeout: 5000 }).catch(() => page.locator(`aria-ref=${a.ref}`).selectOption(a.value, { timeout: 5000 }));
      else if (a.type === "press") await page.keyboard.press(a.key);
      else if (a.type === "scroll") await page.mouse.wheel(0, 700);
      actions.push(`${a.type}${"ref" in a ? ` ${a.ref}` : ""}${"value" in a ? ` "${a.value}"` : ""}${"key" in a ? ` ${a.key}` : ""}`);
      needShot = false;
    } catch (err) {
      needShot = true;
      const m = (err as Error).message.split("\n")[0];
      actions.push(`${a.type} failed: ${m.slice(0, 80)}`);
      lastWhy = m;
    }
    await page.waitForLoadState("domcontentloaded", { timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(900);
    if (opts.isDone && !(await opts.isDone())) needShot = needShot || n >= 1;
  }
  if (opts.isDone && (await opts.isDone())) return { ok: true, done: true, why: lastWhy, actions };
  return { ok: false, done: false, why: lastWhy || `Goal not reached after ${max} actions.`, actions };
}

export async function llmAct(page: Page, instr: string): Promise<{ ok: boolean; why: string }> {
  const r = await agentStep(page, instr, { maxActions: 1 });
  return { ok: r.ok || r.actions.length > 0, why: r.why };
}
