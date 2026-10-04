import { NextResponse } from "next/server";
import { db, runs, eq, and, gte, count, type Run } from "@watchdog/db";
import { getSession } from "./session";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s: unknown): s is string => typeof s === "string" && UUID_RE.test(s);

export function shareUrl(token: string | null) {
  if (!token) return null;
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  return `${base}/r/${token}`;
}

type Owned = { ok: true; run: Run; userId: string } | { ok: false; res: NextResponse };

export async function requireOwnedRun(id: string): Promise<Owned> {
  const session = await getSession();
  if (!session) return { ok: false, res: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  if (!isUuid(id)) return { ok: false, res: NextResponse.json({ error: "not found" }, { status: 404 }) };
  const [run] = await db.select().from(runs).where(eq(runs.id, id));
  if (!run) return { ok: false, res: NextResponse.json({ error: "not found" }, { status: 404 }) };
  if (run.userId !== session.user.id) return { ok: false, res: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  return { ok: true, run, userId: session.user.id };
}

export async function dailyCapResponse(userId: string) {
  const limit = Number(process.env.AUDITS_PER_USER_PER_DAY) || 5;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [{ n }] = await db
    .select({ n: count() })
    .from(runs)
    .where(and(eq(runs.userId, userId), gte(runs.createdAt, since)));
  if (n < limit) return null;
  return NextResponse.json(
    { error: `Daily audit limit reached (${limit}/day during beta). Try again tomorrow.` },
    { status: 429 },
  );
}
