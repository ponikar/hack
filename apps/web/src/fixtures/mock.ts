import type { Run } from "@/components/run/types";
import demo from "./demo-run.json";

const SCREENSHOT_ORIGIN = "https://ai-buyer-watchdog.vercel.app";
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

function base(): Run {
  const run = structuredClone(demo) as unknown as Run;
  for (const r of run.results ?? []) {
    for (const s of r.steps) if (s.screenshot?.startsWith("/")) s.screenshot = SCREENSHOT_ORIGIN + s.screenshot;
  }
  return run;
}

let shared: string | null = null;

function runFor(id: string): Run | null {
  const done = base();
  switch (id) {
    case "fixture":
      return { ...done, id, createdAt: minutesAgo(95), rerunOf: "fixture-prev", shareUrl: shared };
    case "fixture-prev": {
      const v = done.verdicts!;
      return {
        ...done,
        id,
        createdAt: minutesAgo(60 * 26),
        verdicts: {
          ...v,
          fixes: [
            ...v.fixes,
            {
              fixClass: "robots_block",
              check: "seen",
              title: "Allow AI shopping bots in robots.txt",
              detail: "robots.txt disallowed OAI-SearchBot and PerplexityBot. Remove those Disallow lines.",
              personas: ["chatgpt-shopping", "perplexity-search"],
            },
          ],
        },
      };
    }
    case "running":
      return {
        ...done,
        id,
        status: "running",
        verdicts: null,
        createdAt: minutesAgo(1),
        results: (done.results ?? []).slice(0, 3),
      };
    case "profiling":
      return { ...done, id, status: "profiling", verdicts: null, sessions: null, results: null, createdAt: minutesAgo(0.3) };
    case "queued-stale":
      return { ...done, id, status: "queued", verdicts: null, profile: null, sessions: null, results: null, createdAt: minutesAgo(9) };
    default:
      return null;
  }
}

const json = (body: unknown, status = 200) =>
  new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export async function mockFetch(url: string, init?: RequestInit): Promise<Response | null> {
  const method = (init?.method ?? "GET").toUpperCase();
  const path = url.split("?")[0];
  await new Promise((r) => setTimeout(r, 250));

  if (path === "/api/runs" && method === "GET") {
    const ids = ["running", "queued-stale", "fixture", "fixture-prev"];
    return json(ids.map((id) => runFor(id)!).map(({ id, storeUrl, mode, status, verdicts, createdAt }) => ({ id, storeUrl, mode, status, verdicts, createdAt })));
  }
  if (path === "/api/runs" && method === "POST") return json({ error: "Daily limit reached: 3 audits a day on the free plan. Try again tomorrow." }, 429);
  if (path === "/api/public/demo-run") return json({ ...runFor("fixture")!, rerunOf: null, shareUrl: null });
  if (path === "/api/feedback" && method === "POST") return json({ ok: true }, 201);

  const pub = path.match(/^\/api\/public\/report\/([^/]+)$/);
  if (pub) return pub[1] === "missing" ? json({ error: "not found" }, 404) : json({ ...runFor("fixture")!, shareUrl: null, rerunOf: null });

  const m = path.match(/^\/api\/runs\/([^/]+)(?:\/(share|rerun))?$/);
  if (!m) return null;
  const [, id, action] = m;
  if (action === "share") {
    if (method === "DELETE") {
      shared = null;
      return json(null, 204);
    }
    shared = `${location.origin}/r/fixture-token`;
    return json({ token: "fixture-token", url: shared });
  }
  if (action === "rerun") {
    if (id === "fixture-prev") return json({ error: "This store was re-checked a minute ago. Try again in 10 minutes." }, 429);
    return json({ id: "running" }, 202);
  }
  const run = runFor(id);
  return run ? json(run) : json({ error: "not found" }, 404);
}
