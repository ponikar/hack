import type { AgentHitKind, NewAgentHit } from "@watchdog/db";

const KEPT_HEADERS = [
  "user-agent",
  "accept",
  "accept-language",
  "signature",
  "signature-input",
  "signature-agent",
  "sec-ch-ua",
  "sec-ch-ua-platform",
  "sec-fetch-mode",
  "sec-fetch-site",
  "referer",
  "x-forwarded-for",
  "from",
];

export function pickHeaders(h: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of KEPT_HEADERS) {
    const v = h.get(k);
    if (v != null) out[k] = v;
  }
  return out;
}

export function clientIp(h: Headers): string | null {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

export function caseFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/bench\/([^/]+)/);
  return m ? m[1] : null;
}

export function hitFromRequest(
  req: { method: string; headers: Headers; nextUrl: URL },
  kind: AgentHitKind,
  extra: Partial<NewAgentHit> = {},
): NewAgentHit {
  const params = new URLSearchParams(req.nextUrl.search);
  if (params.has("token")) params.set("token", "redacted");
  const query = params.toString();
  return {
    method: req.method,
    path: req.nextUrl.pathname,
    query: query ? `?${query}` : null,
    ua: req.headers.get("user-agent"),
    ip: clientIp(req.headers),
    headers: pickHeaders(req.headers),
    kind,
    benchCase: caseFromPath(req.nextUrl.pathname) ?? req.nextUrl.searchParams.get("case"),
    ...extra,
  };
}

// The DB module throws at import when DATABASE_URL is unset, so it is loaded lazily inside the guard.
export function logHit(hit: NewAgentHit): Promise<void> {
  return (async () => {
    try {
      const { db, agentHits } = await import("@watchdog/db");
      await Promise.race([
        db.insert(agentHits).values(hit),
        new Promise((_, reject) => setTimeout(() => reject(new Error("log timeout")), 3000)),
      ]);
    } catch (err) {
      console.warn("[bench] hit log failed:", err instanceof Error ? err.message : err);
    }
  })();
}
