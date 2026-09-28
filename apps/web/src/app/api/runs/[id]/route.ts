import { NextResponse } from "next/server";
import { db, runs, eq, and } from "@watchdog/db";
import { getSession } from "@/lib/session";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const [run] = await db
    .select()
    .from(runs)
    .where(and(eq(runs.id, id), eq(runs.userId, session.user.id)));
  if (!run) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(run);
}
