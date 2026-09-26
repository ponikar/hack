import type { Persona } from "@watchdog/shared";

export const PERSONAS: Persona[] = [
  { id: "chatgpt-shopping", label: "ChatGPT Shopping", archetype: "feed-reader" },
  { id: "grok", label: "Grok", archetype: "feed-reader" },
  { id: "perplexity-search", label: "Perplexity search", archetype: "feed-reader" },
  { id: "google-ai-mode", label: "Google AI Mode", archetype: "feed-reader" },
  { id: "chatgpt-atlas", label: "ChatGPT Atlas agent mode", archetype: "browser-agent" },
  { id: "perplexity-comet", label: "Perplexity Comet", archetype: "browser-agent" },
  { id: "amazon-buy-for-me", label: "Amazon Buy for Me", archetype: "browser-agent" },
];
