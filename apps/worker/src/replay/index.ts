import path from "node:path";
import fs from "node:fs";
import { chromium, type Browser, type Page } from "playwright";
import type { Session, SessionResult, SessionStep, StepResult, StoreProfile } from "@watchdog/shared";
import robotsParser from "robots-parser";
import { BROWSER_UA } from "../profile/signatures";
import { checkHtml, checkPage } from "./expect";
import { BLOCKER_TEXT, detectBlocker, dismissCookieBanner, tryDismiss } from "./blockers";
import { fastPath } from "./fastpath";
import { agentStep, llmAvailable } from "./llmact";
import { PERSONAS } from "../sessions/personas";

const personaLabel = (id: string) => PERSONAS.find((p) => p.id === id)?.label ?? id;

const DEFAULT_FETCH_UA = "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.4; +https://openai.com/searchbot";
const personaOf = (id: string) => PERSONAS.find((p) => p.id === id);

const robotsCache = new Map<string, Promise<ReturnType<typeof robotsParser>>>();
function robotsFor(url: string) {
  const origin = new URL(url).origin;
  if (!robotsCache.has(origin)) {
    const robotsUrl = `${origin}/robots.txt`;
    robotsCache.set(origin, fetch(robotsUrl, { signal: AbortSignal.timeout(8000) }).then((r) => (r.ok ? r.text() : "")).catch(() => "").then((txt) => robotsParser(robotsUrl, txt)));
  }
  return robotsCache.get(origin)!;
}
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
  const who = personaLabel(session.persona);
  const summary = failed
    ? `${who} died at "${failed.label}". ${failed.reason ?? ""}`.trim()
    : session.liveStore && session.archetype === "browser-agent"
      ? `${who} reached the payment gate.`
      : `${who} completed the journey.`;
  return { sessionId: session.id, persona: session.persona, archetype: session.archetype, template: session.template, goal: session.goal, status, failedStep: failed?.index, summary, steps, durationMs: Date.now() - t0 };
}

async function replayFeed(session: Session, t0: number): Promise<SessionResult> {
  const steps: StepResult[] = [];
  const persona = personaOf(session.persona);
  const ua = persona?.userAgent ?? DEFAULT_FETCH_UA;
  for (const [i, s] of session.steps.entries()) {
    const st = Date.now();
    if (s.op !== "fetch") { steps.push({ index: i, op: s.op, label: label(s), status: "skipped", ms: 0 }); continue; }
    try {
      if (persona?.obeysRobots && persona.robotsToken) {
        const rp = await robotsFor(s.url);
        if (rp.isDisallowed(s.url, persona.robotsToken)) {
          steps.push({ index: i, op: s.op, label: label(s), status: "blocked", blocker: "robots", reason: `robots.txt disallows ${persona.robotsToken} from this page.`, url: s.url, ms: Date.now() - st });
          break;
        }
      }
      const res = await fetch(s.url, { headers: { "user-agent": ua, accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8" }, redirect: "follow", signal: AbortSignal.timeout(15000) });
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
  const ctx = await browser.newContext({ userAgent: BROWSER_UA, viewport: { width: 1280, height: 900 }, locale: "en-GB" });
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });
  const page = await ctx.newPage();
  const useLlm = llmAvailable();
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

      if (s.op === "stop") {
        let b = await detectBlocker(page);
        if (b === "login" && useLlm) {
          await agentStep(page, "This is the checkout step. If a guest checkout option exists, choose it so you can continue without an account. Do not sign in, do not create an account, do not type personal data.", {
            maxActions: 2,
            isDone: async () => (await detectBlocker(page)) !== "login",
          });
          b = await detectBlocker(page);
        }
        if (b === "login") { await push(i, s, "blocked", { blocker: "login", reason: BLOCKER_TEXT.login }, st); break; }
        if (b === "challenge") { await push(i, s, "blocked", { blocker: b, reason: BLOCKER_TEXT.challenge }, st); break; }
        if (b === "captcha") { await push(i, s, "stopped", { blocker: "captcha", reason: "Reached checkout; a CAPTCHA guards the payment step." }, st); break; }
        await push(i, s, "stopped", { reason: s.reason }, st);
        break;
      }

      if (s.op === "goto") {
        try {
          const res = await page.goto(s.url, { waitUntil: "domcontentloaded", timeout: 15000 });
          await page.waitForTimeout(1200);
          await dismissCookieBanner(page);
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
        let gone = await tryDismiss(page);
        if (!gone && useLlm) {
          await agentStep(page, `Close or decline the ${s.what} that covers the page, the way a shopper would. Do not subscribe or type anything.`, { maxActions: 3, screenshot: true, isDone: async () => (await detectBlocker(page)) !== "overlay" });
          gone = (await detectBlocker(page)) !== "overlay";
        }
        await push(i, s, gone ? "ok" : s.optional ? "skipped" : "blocked", gone ? {} : { blocker: "overlay", reason: BLOCKER_TEXT.overlay }, st);
        continue;
      }

      if (s.op === "act") {
        if (session.liveStore && PAY_RE.test(s.instr)) { await push(i, s, "stopped", { reason: "Live store: never place a real order." }, st); break; }
        let reason = "";
        let blocker: string | undefined;
        let ok = false;
        let agentWhy = "";
        if (useLlm) {
          const pre = await detectBlocker(page);
          if (pre === "captcha" || pre === "challenge") { blocker = pre; reason = BLOCKER_TEXT[pre]; }
          else {
            // Free deterministic attempt first; the LLM only runs when it does not satisfy the step.
            await fastPath(page, s.instr, { searchUrl: profile.structure.searchUrl }).catch(() => false);
            ok = (await checkPage(page, s.expect)).ok;
            if (!ok && llmAvailable()) {
              const findsProduct = /open the product|first in-stock product/i.test(s.instr);
              const startUrl = page.url();
              const goal = findsProduct
                ? "Open the product page of any in-stock product in this store. If the search found nothing, go back and browse the home page or a category instead."
                : s.instr.replace(/^add to cart$/i, "add the product to the cart (choose any in-stock size or option first if required)");
              const r = await agentStep(page, goal, { maxActions: findsProduct ? 6 : 4, isDone: async () => (await checkPage(page, s.expect)).ok });
              agentWhy = r.why;
              // A product page is the agent's call to make (URLs vary: /products/, /p/, /eyeglasses/...); trust its "done" once it has left the listing.
              ok = (r.ok && (await checkPage(page, s.expect)).ok) || (findsProduct && r.done && page.url() !== startUrl);
              if (!ok) reason = r.why;
            }
            if (!ok) {
              const after = await detectBlocker(page);
              // A fixed full-screen layer is often just a cart drawer backdrop; only blame a popup when the agent itself says one stopped it.
              const popupBlamed = after === "overlay" && /popup|pop-up|modal|overlay|newsletter|banner|dialog/i.test(agentWhy);
              if (after === "captcha" || after === "login" || after === "challenge" || popupBlamed) { blocker = after!; reason = BLOCKER_TEXT[after!]; }
              else reason = reason || "Goal not reached.";
            }
          }
        }
        for (let attempt = 0; attempt < 3 && !ok && !useLlm; attempt++) {
          const b = await detectBlocker(page);
          if (b === "captcha" || b === "login" || b === "challenge") { blocker = b; reason = BLOCKER_TEXT[b]; break; }
          if (b === "overlay" && !(await tryDismiss(page))) { blocker = b; reason = BLOCKER_TEXT.overlay; break; }
          try {
            const did = await fastPath(page, s.instr, { searchUrl: profile.structure.searchUrl });
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

// Real Chrome passes bot checks (Akamai, John Lewis) that bundled headless Chromium fails; fall back if it is not installed.
async function launchBrowser(): Promise<Browser> {
  const base = { headless: process.env.HEADLESS !== "false", args: ["--disable-blink-features=AutomationControlled"] };
  try {
    return await chromium.launch({ ...base, channel: process.env.BROWSER_CHANNEL ?? "chrome" });
  } catch {
    return chromium.launch(base);
  }
}

export async function replaySessions(sessions: Session[], profile: StoreProfile, runId: string, onResult?: (r: SessionResult) => Promise<void> | void): Promise<SessionResult[]> {
  const results: SessionResult[] = [];
  const needsBrowser = sessions.some((s) => s.archetype === "browser-agent");
  const browser = needsBrowser ? await launchBrowser() : null;
  try {
    const run = async (session: Session) => {
      const t0 = Date.now();
      const r = session.archetype === "feed-reader" || !browser ? await replayFeed(session, t0) : await replayBrowser(session, profile, browser, runId, t0);
      results.push(r);
      await onResult?.(r);
    };
    for (const s of sessions.filter((x) => x.archetype === "feed-reader" || !browser)) await run(s);
    // Browser sessions are independent contexts; running them together roughly halves wall time.
    await Promise.all(sessions.filter((x) => x.archetype === "browser-agent" && browser).map(run));
  } finally {
    await browser?.close();
  }
  return results;
}
