import { NextResponse } from "next/server";
import { db, runs } from "@watchdog/db";
import { enqueueAudit } from "@/lib/queue";
import { dailyCapResponse, requireOwnedRun } from "@/lib/runs";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const owned = await requireOwnedRun((await params).id);
  if (!owned.ok) return owned.res;

  const capped = await dailyCapResponse(owned.userId);
  if (capped) return capped;

  const { storeUrl, mode, id: rerunOf } = owned.run;
  const [run] = await db.insert(runs).values({ storeUrl, mode, userId: owned.userId, rerunOf }).returning();
  await enqueueAudit({ runId: run.id, storeUrl, mode: mode ?? undefined });
  return NextResponse.json({ id: run.id }, { status: 202 });
}
