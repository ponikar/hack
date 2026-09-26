import path from "node:path";
import fs from "node:fs";
import { chromium, type Browser, type Page } from "playwright";
import type { Session, SessionResult, SessionStep, StepResult, StoreProfile } from "@watchdog/shared";
import { BROWSER_UA } from "../profile/signatures";
import { checkHtml, checkPage } from "./expect";
import { BLOCKER_TEXT, detectBlocker, tryDismiss } from "./blockers";
import { fastPath } from "./fastpath";
import { llmAct, llmAvailable } from "./llmact";

const GPTBOT_UA = "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.4; +https://openai.com/gptbot";
const SCREENSHOT_ROOT = process.env.SCREENSHOT_DIR ?? path.resolve(process.cwd(), "../web/public/screenshots");
const PAY_RE = /place order|pay now|complete order|complete purchase/i;

const label = (s: SessionStep) =>
  s.op === "goto" ? `open ${s.url}` : s.op === "fetch" ? `fetch ${s.url}` : s.op === "dismiss" ? `dismiss ${s.what}` : s.op === "act" ? s.instr : s.reason;

async function shot(page: Page, runId: string, sessionId: string, i: number) {
  const dir = path.join(SCREENSHOT_ROOT, runId);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${sessionId}-${i}.png`);
  await page.screenshot({ path: file }).catch(() => {});
  return `/screenshots/${runId}/${sessionId}-${i}.png`;
}

function finish(session: Session, steps: StepResult[], t0: number): SessionResult {
  const failed = steps.find((s) => s.status === "failed" || s.status === "blocked");
  const status = failed ? (failed.status === "blocked" ? "blocked" : "fail") : "pass";
  const summary = failed
    ? `${session.persona}: died at "${failed.label}". ${failed.reason ?? ""}`.trim()
    : session.liveStore && session.archetype === "browser-agent"
      ? `${session.persona}: reached the payment gate.`
      : `${session.persona}: completed.`;
  return { sessionId: session.id, persona: session.persona, archetype: session.archetype, template: session.template, goal: session.goal, status, failedStep: failed?.index, summary, steps, durationMs: Date.now() - t0 };
}

async function replayFeed(session: Session, t0: number): Promise<SessionResult> {
  const steps: StepResult[] = [];
  for (const [i, s] of session.steps.entries()) {
    const st = Date.now();
    if (s.op !== "fetch") { steps.push({ index: i, op: s.op, label: label(s), status: "skipped", ms: 0 }); continue; }
    try {
      const res = await fetch(s.url, { headers: { "user-agent": GPTBOT_UA, accept: "text/html,application/json" }, redirect: "follow", signal: AbortSignal.timeout(10000) });
      const html = await res.text();
      if (res.status >= 400) { steps.push({ index: i, op: s.op, label: label(s), status: "blocked", blocker: "waf", reason: `HTTP ${res.status} served to an AI fetcher.`, url: s.url, ms: Date.now() - st }); break; }
      const r = checkHtml(html, s.expect, res.url);
      steps.push({ index: i, op: s.op, label: label(s), status: r.ok ? "ok" : "failed", reason: r.ok ? undefined : `Without JavaScript, ${r.why}.`, url: res.url, ms: Date.now() - st });
      if (!r.ok) break;
    } catch (err) {
      steps.push({ index: i, op: s.op, label: label(s), status: "failed", reason: (err as Error).message.split("\n")[0], url: s.url, ms: Date.now() - st });
      break;
    }
  }
  return finish(session, steps, t0);
}

async function replayBrowser(session: Session, profile: StoreProfile, browser: Browser, runId: string, t0: number): Promise<SessionResult> {
  const ctx = await browser.newContext({ userAgent: BROWSER_UA, viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(5000);
  const steps: StepResult[] = [];
  const deadline = t0 + session.budgetMs;

  const push = async (i: number, s: SessionStep, status: StepResult["status"], extra: Partial<StepResult> = {}, st = Date.now()) => {
    steps.push({ index: i, op: s.op, label: label(s), status, url: page.url(), screenshot: await shot(page, runId, session.id, i), ms: Date.now() - st, ...extra });
  };

  try {
    for (const [i, s] of session.steps.entries()) {
      const st = Date.now();
      if (Date.now() > deadline) { await push(i, s, "failed", { reason: "Session budget exceeded." }, st); break; }

      if (s.op === "stop") { await push(i, s, "stopped", { reason: s.reason }, st); break; }

      if (s.op === "goto") {
        try {
          const res = await page.goto(s.url, { waitUntil: "domcontentloaded", timeout: 15000 });
          await page.waitForTimeout(1200);
          if (res && res.status() >= 400) { await push(i, s, "blocked", { blocker: "waf", reason: `HTTP ${res.status()} served to the agent's browser.` }, st); break; }
          const b = await detectBlocker(page);
          if (b === "challenge" || b === "captcha") { await push(i, s, "blocked", { blocker: b, reason: BLOCKER_TEXT[b] }, st); break; }
          await push(i, s, "ok", {}, st);
        } catch (err) { await push(i, s, "failed", { reason: (err as Error).message.split("\n")[0] }, st); break; }
        continue;
      }

      if (s.op === "dismiss") {
        const before = await detectBlocker(page);
        if (before !== "overlay") { await push(i, s, "skipped", { reason: "nothing to dismiss" }, st); continue; }
        const gone = await tryDismiss(page);
        await push(i, s, gone ? "ok" : s.optional ? "skipped" : "blocked", gone ? {} : { blocker: "overlay", reason: BLOCKER_TEXT.overlay }, st);
        continue;
      }

      if (s.op === "act") {
        if (session.liveStore && PAY_RE.test(s.instr)) { await push(i, s, "stopped", { reason: "Live store: never place a real order." }, st); break; }
        let reason = "";
        let blocker: string | undefined;
        let ok = false;
        for (let attempt = 0; attempt < 3 && !ok; attempt++) {
          const b = await detectBlocker(page);
          if (b === "captcha" || b === "login" || b === "challenge") { blocker = b; reason = BLOCKER_TEXT[b]; break; }
          if (b === "overlay" && !(await tryDismiss(page))) { blocker = b; reason = BLOCKER_TEXT.overlay; break; }
          try {
            let did = await fastPath(page, s.instr, { searchUrl: profile.structure.searchUrl });
            if (!did && llmAvailable()) { const r = await llmAct(page, s.instr); did = r.ok; if (!r.ok) reason = r.why; }
            if (!did && !reason) reason = "No matching control found on the page.";
          } catch (err) {
            const m = (err as Error).message.split("\n")[0];
            if (/intercepts pointer events/.test(m)) { blocker = "overlay"; reason = "Another element covered the control the agent tried to click."; break; }
            reason = m;
          }
          const r = await checkPage(page, s.expect);
          ok = r.ok;
          if (!ok && !reason) reason = `Expected ${r.why}.`;
        }
        if (ok) await push(i, s, "ok", {}, st);
        else { await push(i, s, blocker ? "blocked" : "failed", { blocker, reason }, st); break; }
      }
    }
  } finally {
    await ctx.close().catch(() => {});
  }
  return finish(session, steps, t0);
}

export async function replaySessions(sessions: Session[], profile: StoreProfile, runId: string, onResult?: (r: SessionResult) => Promise<void> | void): Promise<SessionResult[]> {
  const results: SessionResult[] = [];
  const needsBrowser = sessions.some((s) => s.archetype === "browser-agent");
  const browser = needsBrowser ? await chromium.launch({ headless: process.env.HEADLESS !== "false" }) : null;
  try {
    for (const session of sessions) {
      const t0 = Date.now();
      const r = session.archetype === "feed-reader" || !browser ? await replayFeed(session, t0) : await replayBrowser(session, profile, browser, runId, t0);
      results.push(r);
      await onResult?.(r);
    }
  } finally {
    await browser?.close();
  }
  return results;
}
