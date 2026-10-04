import { NextResponse } from "next/server";
import { db, runs, eq } from "@watchdog/db";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [run] = await db.select().from(runs).where(eq(runs.shareToken, token));
  if (!run) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { userId: _u, shareToken: _s, ...rest } = run;
  return NextResponse.json(rest);
}
