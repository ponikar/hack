import { NextResponse } from "next/server";
import { db, runs, eq, and, like, desc } from "@watchdog/db";
import { DEMO_STORE_BROKEN } from "@/lib/demo";

export const dynamic = "force-dynamic";

export async function GET() {
  const [run] = await db
    .select()
    .from(runs)
    .where(and(eq(runs.status, "done"), like(runs.storeUrl, `${DEMO_STORE_BROKEN}%`)))
    .orderBy(desc(runs.createdAt))
    .limit(1);
  if (!run) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ...run, userId: undefined });
}
