import OpenAI from "openai";

const xai = process.env.XAI_API_KEY;
const openai = process.env.OPENAI_API_KEY;

export const llm = new OpenAI(
  xai
    ? { apiKey: xai, baseURL: process.env.LLM_BASE_URL ?? "https://api.x.ai/v1" }
    : { apiKey: openai ?? "missing" },
);

export const LLM_MODEL = xai ? (process.env.LLM_MODEL ?? "grok-4-fast") : "gpt-4o-mini";

export async function askJson<T>(system: string, user: string): Promise<T> {
  const res = await llm.chat.completions.create({
    model: LLM_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return JSON.parse(res.choices[0]?.message.content ?? "{}") as T;
}
