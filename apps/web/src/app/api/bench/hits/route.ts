import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

export const dynamic = "force-dynamic";

function tokenOk(given: string | null) {
  const expected = process.env.BENCH_TOKEN;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  if (!tokenOk(sp.get("token"))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const since = sp.get("since");
  const sinceDate = since ? new Date(since) : null;
  if (sinceDate && Number.isNaN(sinceDate.getTime())) {
    return NextResponse.json({ error: "invalid since" }, { status: 400 });
  }
  const benchCase = sp.get("case");

  try {
    const { db, agentHits, and, eq, gte, desc } = await import("@watchdog/db");
    const conds = [sinceDate ? gte(agentHits.ts, sinceDate) : undefined, benchCase ? eq(agentHits.benchCase, benchCase) : undefined];
    const hits = await db
      .select()
      .from(agentHits)
      .where(and(...conds))
      .orderBy(desc(agentHits.ts))
      .limit(500);
    return NextResponse.json({ hits });
  } catch (err) {
    return NextResponse.json({ error: "db unavailable", detail: err instanceof Error ? err.message : String(err) }, { status: 503 });
  }
}
