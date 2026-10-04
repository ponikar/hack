import type { Archetype } from "@watchdog/shared";

export type PersonaMeta = {
  id: string;
  label: string;
  vendor: string;
  archetype: Archetype;
  userAgent?: string;
};

// Mirrors apps/worker/src/sessions/personas.ts so reproduce commands send the same UA the audit did.
const CHROME = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";

export const PERSONAS: PersonaMeta[] = [
  {
    id: "chatgpt-shopping",
    label: "ChatGPT Shopping",
    vendor: "OpenAI",
    archetype: "feed-reader",
    userAgent: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.4; +https://openai.com/searchbot",
  },
  { id: "grok", label: "Grok", vendor: "xAI", archetype: "feed-reader", userAgent: CHROME },
  {
    id: "perplexity-search",
    label: "Perplexity",
    vendor: "Perplexity",
    archetype: "feed-reader",
    userAgent: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)",
  },
  {
    id: "google-ai-mode",
    label: "Google AI Mode",
    vendor: "Google",
    archetype: "feed-reader",
    userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  },
  {
    id: "claude-user",
    label: "Claude",
    vendor: "Anthropic",
    archetype: "feed-reader",
    userAgent: "Claude-User (claude-code/2.1.286; +https://support.anthropic.com/)",
  },
  { id: "chatgpt-atlas", label: "ChatGPT agent", vendor: "OpenAI", archetype: "browser-agent" },
  { id: "perplexity-comet", label: "Perplexity Comet", vendor: "Perplexity", archetype: "browser-agent" },
  { id: "amazon-buy-for-me", label: "Amazon Buy for Me", vendor: "Amazon", archetype: "browser-agent" },
];

const BY_ID = new Map(PERSONAS.map((p) => [p.id, p]));

export function personaLabel(id: string): string {
  return BY_ID.get(id)?.label ?? id.replace(/-/g, " ");
}

export function personaMeta(id: string): PersonaMeta | undefined {
  return BY_ID.get(id);
}

export const ARCHETYPE_LABEL: Record<Archetype, string> = {
  "feed-reader": "Feed reader",
  "browser-agent": "Browser agent",
};
