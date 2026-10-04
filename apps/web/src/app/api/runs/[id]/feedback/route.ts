import { NextResponse } from "next/server";
import { db, findingFeedback, eq, desc } from "@watchdog/db";
import { requireOwnedRun } from "@/lib/runs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const owned = await requireOwnedRun((await params).id);
  if (!owned.ok) return owned.res;

  const rows = await db
    .select()
    .from(findingFeedback)
    .where(eq(findingFeedback.runId, owned.run.id))
    .orderBy(desc(findingFeedback.createdAt));
  return NextResponse.json(rows);
}
