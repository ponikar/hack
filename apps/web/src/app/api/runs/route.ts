import { NextResponse } from "next/server";
import { z } from "zod";
import { db, runs, desc } from "@watchdog/db";
import { StoreMode } from "@watchdog/shared";
import { enqueueAudit } from "@/lib/queue";

const Body = z.object({
  storeUrl: z.string().url(),
  mode: StoreMode.optional(),
  liveStore: z.boolean().optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { storeUrl, mode, liveStore } = parsed.data;

  const [run] = await db.insert(runs).values({ storeUrl, mode }).returning();
  await enqueueAudit({ runId: run.id, storeUrl, mode, liveStore: liveStore ?? !mode });
  return NextResponse.json({ id: run.id }, { status: 202 });
}

export async function GET() {
  const rows = await db.select().from(runs).orderBy(desc(runs.createdAt)).limit(20);
  return NextResponse.json(rows);
}
