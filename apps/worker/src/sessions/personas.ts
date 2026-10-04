import type { Persona } from "@watchdog/shared";

const CHROME = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";

// userAgent/robots behaviour per docs (2026) unless `verified` says it was observed first-hand in agent_hits.
export const PERSONAS: Persona[] = [
  {
    id: "chatgpt-shopping", label: "ChatGPT Shopping", archetype: "feed-reader",
    userAgent: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.4; +https://openai.com/searchbot",
    robotsToken: "OAI-SearchBot", obeysRobots: true,
  },
  {
    id: "claude-user", label: "Claude", archetype: "feed-reader",
    userAgent: "Claude-User (claude-code/2.1.286; +https://support.anthropic.com/)",
    robotsToken: "Claude-User", obeysRobots: false,
    verified: "UA, no robots.txt request, no JS: observed in agent_hits 2026-10-03",
  },
  {
    id: "perplexity-search", label: "Perplexity", archetype: "feed-reader",
    userAgent: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)",
    robotsToken: "Perplexity-User", obeysRobots: false,
  },
  {
    id: "google-ai-mode", label: "Google AI Mode", archetype: "feed-reader",
    userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    robotsToken: "Google-Extended", obeysRobots: true,
  },
  {
    id: "grok", label: "Grok", archetype: "feed-reader",
    userAgent: CHROME,
    robotsToken: "GrokBot", obeysRobots: false,
    verified: "unverified: xAI publishes no UA; third-party tests saw generic browser UAs",
  },
  { id: "chatgpt-atlas", label: "ChatGPT agent", archetype: "browser-agent" },
  { id: "perplexity-comet", label: "Perplexity Comet", archetype: "browser-agent" },
  { id: "amazon-buy-for-me", label: "Amazon Buy for Me", archetype: "browser-agent" },
];
