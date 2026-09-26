import { chromium, type Page } from "playwright";
import type { AgentStep, BuyableResult, StepName } from "@watchdog/shared";
import { askJson } from "./llm";
import path from "node:path";

const SCREENSHOT_DIR = path.resolve(process.cwd(), "screenshots");

type Action =
  | { type: "click"; selector: string; why: string }
  | { type: "fill"; selector: string; value: string; why: string }
  | { type: "done"; why: string }
  | { type: "stuck"; why: string };

const SYSTEM = `You are an AI shopping agent driving a real browser to buy one product.
You get a goal for the current step and a compact DOM summary. Reply with ONE JSON action:
{"type":"click","selector":"css","why":"..."} | {"type":"fill","selector":"css","value":"...","why":"..."} | {"type":"done","why":"..."} | {"type":"stuck","why":"..."}.
Reply "done" when the step goal is achieved. Reply "stuck" if a popup, login wall, CAPTCHA or broken form blocks you.`;

const GOALS: Record<StepName, string> = {
  home: "Load the store home page and confirm products are visible.",
  search: "Find the product search or product listing and reach a list of products.",
  product: "Open a product detail page.",
  add_to_cart: "Add the product to the cart.",
  checkout: "Go to checkout and fill shipping details as a guest: name Test Buyer, email buyer@example.com, address 1 Test St, London, E1 6AN.",
  place_order: "Enter test card 4242 4242 4242 4242, any future expiry, CVC 123, and place the order.",
};

async function domSummary(page: Page) {
  return page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("a, button, input, select, textarea, [role=button]"));
    return els
      .slice(0, 80)
      .map((el) => {
        const e = el as HTMLElement;
        const id = e.id ? `#${e.id}` : "";
        const name = e.getAttribute("name") ? `[name="${e.getAttribute("name")}"]` : "";
        const testId = e.getAttribute("data-testid") ? `[data-testid="${e.getAttribute("data-testid")}"]` : "";
        return `${e.tagName.toLowerCase()}${id}${name}${testId} "${(e.innerText || (e as HTMLInputElement).placeholder || "").trim().slice(0, 40)}"`;
      })
      .join("\n");
  });
}

async function runStep(page: Page, step: StepName, maxActions = 6): Promise<AgentStep> {
  const t0 = Date.now();
  for (let i = 0; i < maxActions; i++) {
    const summary = await domSummary(page);
    const action = await askJson<Action>(
      SYSTEM,
      `Step: ${step}\nGoal: ${GOALS[step]}\nURL: ${page.url()}\nPage title: ${await page.title()}\nInteractive elements:\n${summary}`,
    );
    try {
      if (action.type === "done") break;
      if (action.type === "stuck") return finish(page, step, "stopped", action.why, t0);
      if (action.type === "click") await page.click(action.selector, { timeout: 5000 });
      if (action.type === "fill") await page.fill(action.selector, action.value, { timeout: 5000 });
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
    } catch (err) {
      return finish(page, step, "failed", `Action failed: ${(err as Error).message.split("\n")[0]}`, t0);
    }
  }
  return finish(page, step, "ok", undefined, t0);
}

async function finish(page: Page, step: StepName, status: AgentStep["status"], reason: string | undefined, t0: number): Promise<AgentStep> {
  const file = path.join(SCREENSHOT_DIR, `${Date.now()}-${step}.png`);
  await page.screenshot({ path: file, fullPage: false }).catch(() => {});
  return { step, status, reason, screenshot: file, url: page.url(), durationMs: Date.now() - t0 };
}

export async function buyableCheck(storeUrl: string, opts: { liveStore: boolean }): Promise<BuyableResult> {
  const order: StepName[] = ["home", "search", "product", "add_to_cart", "checkout", "place_order"];
  const steps: AgentStep[] = [];
  const browser = await chromium.launch({ headless: process.env.HEADLESS !== "false" });
  const page = await browser.newPage();
  await page.goto(storeUrl, { waitUntil: "networkidle" });

  let failingStep: StepName | undefined;
  for (const step of order) {
    if (step === "place_order" && opts.liveStore) {
      steps.push({ step, status: "stopped", reason: "Live store: never place a real order." });
      break;
    }
    const res = await runStep(page, step);
    steps.push(res);
    if (res.status !== "ok") {
      failingStep = step;
      break;
    }
  }
  await browser.close();

  return {
    verdict: failingStep ? "fail" : "pass",
    steps,
    failingStep,
    stoppedBeforePayment: opts.liveStore,
  };
}
