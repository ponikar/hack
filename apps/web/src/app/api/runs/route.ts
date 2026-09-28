import { NextResponse } from "next/server";
import { z } from "zod";
import { db, runs, desc, eq } from "@watchdog/db";
import { enqueueAudit } from "@/lib/queue";
import { getSession } from "@/lib/session";

const Body = z.object({ storeUrl: z.string().url() });

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid store URL." }, { status: 400 });
  const { storeUrl } = parsed.data;
  const mode = /[?&]mode=fixed/.test(storeUrl) ? "fixed" : /[?&]mode=broken/.test(storeUrl) ? "broken" : undefined;

  const [run] = await db.insert(runs).values({ storeUrl, mode, userId: session.user.id }).returning();
  await enqueueAudit({ runId: run.id, storeUrl, mode });
  return NextResponse.json({ id: run.id }, { status: 202 });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rows = await db
    .select({ id: runs.id, storeUrl: runs.storeUrl, mode: runs.mode, status: runs.status, verdicts: runs.verdicts, createdAt: runs.createdAt })
    .from(runs)
    .where(eq(runs.userId, session.user.id))
    .orderBy(desc(runs.createdAt))
    .limit(50);
  return NextResponse.json(rows);
}
