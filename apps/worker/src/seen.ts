import * as cheerio from "cheerio";
import { chromium } from "playwright";
import type { SeenResult } from "@watchdog/shared";

const FETCHER_UA = "Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)";

function visibleText(html: string) {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg").remove();
  return $("body").text().replace(/\s+/g, " ").trim();
}

export async function seenCheck(url: string): Promise<SeenResult> {
  const raw = await fetch(url, { headers: { "user-agent": FETCHER_UA } }).then((r) => r.text());
  const rawText = visibleText(raw);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  const renderedText = (await page.innerText("body")).replace(/\s+/g, " ").trim();
  await browser.close();

  const ratio = renderedText.length ? rawText.length / renderedText.length : 0;
  const renderedWords = new Set(renderedText.toLowerCase().split(" "));
  const rawWords = new Set(rawText.toLowerCase().split(" "));
  const missing = [...renderedWords].filter((w) => w.length > 4 && !rawWords.has(w)).slice(0, 30);

  const notes: string[] = [];
  if (ratio < 0.3) notes.push("Raw HTML contains under 30% of rendered text. AI fetchers see a near-blank page.");
  if (/id="__next"|id="root"/.test(raw) && rawText.length < 200) notes.push("Client-rendered SPA shell detected.");

  return {
    verdict: ratio >= 0.6 ? "pass" : "fail",
    rawHtmlTextLength: rawText.length,
    renderedTextLength: renderedText.length,
    visibleRatio: Number(ratio.toFixed(2)),
    missingInRawHtml: missing,
    notes,
  };
}
