import { NextResponse } from "next/server";
import { z } from "zod";
import { db, runs, desc, eq } from "@watchdog/db";
import { StoreMode } from "@watchdog/shared";
import { enqueueAudit } from "@/lib/queue";
import { getSession } from "@/lib/session";

const Body = z.object({
  storeUrl: z.string().url(),
  mode: StoreMode.optional(),
  liveStore: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { storeUrl, mode, liveStore } = parsed.data;

  const [run] = await db.insert(runs).values({ storeUrl, mode, userId: session.user.id }).returning();
  await enqueueAudit({ runId: run.id, storeUrl, mode, liveStore: liveStore ?? !mode });
  return NextResponse.json({ id: run.id }, { status: 202 });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(runs)
    .where(eq(runs.userId, session.user.id))
    .orderBy(desc(runs.createdAt))
    .limit(20);
  return NextResponse.json(rows);
}
