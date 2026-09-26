import type { Page } from "playwright";
import { askJson } from "../llm";

type Action = { type: "click"; ref: string; why: string } | { type: "fill"; ref: string; value: string; why: string } | { type: "stuck"; why: string };

const SYSTEM = `You drive a real browser for one shopping step. You get the instruction and the page's accessibility snapshot where interactive elements carry [ref=eN].
Reply with ONE JSON action: {"type":"click","ref":"e12","why":"..."} | {"type":"fill","ref":"e3","value":"...","why":"..."} | {"type":"stuck","why":"..."}.
Never click anything that would pay, place or complete an order unless the instruction says so.`;

export function llmAvailable() {
  return Boolean(process.env.XAI_API_KEY || process.env.OPENAI_API_KEY);
}

export async function llmAct(page: Page, instr: string): Promise<{ ok: boolean; why: string }> {
  const snap = (await page.locator("body").ariaSnapshot({ mode: "ai" } as never).catch(() => "")).slice(0, 8000);
  if (!snap) return { ok: false, why: "no accessibility snapshot" };
  const a = await askJson<Action>(SYSTEM, `Instruction: ${instr}\nURL: ${page.url()}\n\n${snap}`);
  if (a.type === "stuck") return { ok: false, why: a.why };
  const loc = page.locator(`aria-ref=${a.ref}`);
  if (a.type === "click") await loc.click({ timeout: 4000 });
  else await loc.fill(a.value, { timeout: 4000 });
  await page.waitForLoadState("domcontentloaded", { timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(700);
  return { ok: true, why: a.why };
}
