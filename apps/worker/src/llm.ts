import OpenAI from "openai";

type Provider = { name: string; apiKey: string; baseURL?: string; model: string };

function pickProvider(): Provider | null {
  const env = process.env;
  if (env.XAI_API_KEY) return { name: "xai", apiKey: env.XAI_API_KEY, baseURL: env.LLM_BASE_URL ?? "https://api.x.ai/v1", model: env.XAI_MODEL ?? "grok-4.3" };
  if (env.GEMINI_API_KEY) return { name: "gemini", apiKey: env.GEMINI_API_KEY, baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/", model: env.GEMINI_MODEL ?? "gemini-flash-lite-latest" };
  if (env.OPENAI_API_KEY) return { name: "openai", apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL ?? "gpt-4o-mini" };
  return null;
}

const provider = pickProvider();
export const LLM_PROVIDER = provider?.name ?? "none";
export const LLM_MODEL = provider?.model ?? "none";
// Stronger model used only to retry steps the default model failed.
export const LLM_MODEL_STRONG = provider?.name === "gemini" ? (process.env.GEMINI_MODEL_STRONG ?? "gemini-2.5-flash") : LLM_MODEL;
const client = provider ? new OpenAI({ apiKey: provider.apiKey, baseURL: provider.baseURL }) : null;

// Hard spend guard: every process gets a fixed number of LLM calls (LLM_MAX_CALLS, default 40).
const MAX_CALLS = Number(process.env.LLM_MAX_CALLS ?? 40);
// Adaptive pacing: free-tier limits are per project and unpublished, so slow down on every 429 and speed back up on success.
const BASE_GAP_MS = Number(process.env.LLM_MIN_GAP_MS ?? 2000);
let gapMs = BASE_GAP_MS;
let lastCallAt = 0;
export const usage = { calls: 0, refused: 0, promptTokens: 0, completionTokens: 0, images: 0, strongCalls: 0 };

let quotaExhausted = false;

export function llmAvailable() {
  return client !== null && usage.calls < MAX_CALLS && !quotaExhausted;
}

export function usageLine() {
  return `LLM ${LLM_PROVIDER}/${LLM_MODEL}: ${usage.calls} calls (${usage.strongCalls} escalated to ${LLM_MODEL_STRONG}, ${usage.images} with screenshots, ${usage.refused} refused by cap ${MAX_CALLS}), ${usage.promptTokens} prompt + ${usage.completionTokens} output tokens`;
}

type Content = string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;

async function complete(system: string, content: Content, model = LLM_MODEL): Promise<string> {
  if (!client) throw new Error("LLM unavailable: no API key set");
  if (usage.calls >= MAX_CALLS) {
    usage.refused++;
    throw new Error(`LLM call cap reached (${MAX_CALLS})`);
  }
  usage.calls++;
  if (model !== LLM_MODEL) usage.strongCalls++;
  if (Array.isArray(content)) usage.images += content.filter((c) => c.type === "image_url").length;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 7; attempt++) {
    const wait = lastCallAt + gapMs - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCallAt = Date.now();
    try {
      const res = await client.chat.completions.create({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: content as never },
        ],
      });
      gapMs = Math.max(BASE_GAP_MS, Math.round(gapMs * 0.8));
      usage.promptTokens += res.usage?.prompt_tokens ?? 0;
      usage.completionTokens += res.usage?.completion_tokens ?? 0;
      return res.choices[0]?.message.content ?? "{}";
    } catch (err) {
      lastErr = err;
      const msg = String((err as Error).message);
      if (/\b(400|401|403|404)\b/.test(msg)) break;
      // Only a daily limit is final. Per-minute limits use the same "exceeded your current quota" wording and clear within a minute.
      if (/per.?day|PerDay|daily/i.test(msg)) { quotaExhausted = true; break; }
      // 429/503 are rejected before any tokens are processed, so retrying costs nothing but time.
      // 429/503 are rejected before any tokens are processed, so waiting them out costs time, not money.
      if (/\b(429|503)\b/.test(msg)) gapMs = Math.min(15000, gapMs * 2);
      await new Promise((r) => setTimeout(r, /\b(429|503)\b/.test(msg) ? 15000 : 1500));
    }
  }
  throw lastErr;
}

function parseJson<T>(raw: string): T {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
  return JSON.parse(trimmed) as T;
}

export async function askJson<T>(system: string, user: string): Promise<T> {
  return parseJson<T>(await complete(system, user));
}

export async function askJsonWithImage<T>(system: string, text: string, imageBase64Jpeg?: string, model?: string): Promise<T> {
  const content: Content = imageBase64Jpeg
    ? [{ type: "text", text }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64Jpeg}` } }]
    : text;
  return parseJson<T>(await complete(system, content, model));
}
