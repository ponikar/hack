import { NextResponse } from "next/server";
import { db, runs, eq } from "@watchdog/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [run] = await db.select().from(runs).where(eq(runs.id, id));
  if (!run) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(run);
}
