import type { Archetype } from "@watchdog/shared";

export type PersonaMeta = {
  id: string;
  label: string;
  vendor: string;
  archetype: Archetype;
};

export const PERSONAS: PersonaMeta[] = [
  { id: "chatgpt-shopping", label: "ChatGPT Shopping", vendor: "OpenAI", archetype: "feed-reader" },
  { id: "grok", label: "Grok", vendor: "xAI", archetype: "feed-reader" },
  { id: "perplexity-search", label: "Perplexity search", vendor: "Perplexity", archetype: "feed-reader" },
  { id: "google-ai-mode", label: "Google AI Mode", vendor: "Google", archetype: "feed-reader" },
  { id: "chatgpt-atlas", label: "ChatGPT Atlas", vendor: "OpenAI", archetype: "browser-agent" },
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
