import { NextResponse } from "next/server";
import { z } from "zod";
import { db, runs, findingFeedback, eq, and, gte, count } from "@watchdog/db";
import { getSession } from "@/lib/session";

const ANON_PER_RUN_PER_HOUR = 20;

const Body = z.object({
  runId: z.string().uuid(),
  fixClass: z.string().min(1).max(200),
  persona: z.string().max(200).nullish(),
  verdict: z.enum(["correct", "wrong"]),
  comment: z.string().max(1000).nullish(),
  shareToken: z.string().min(1).max(200).optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid body", issues: parsed.error.issues }, { status: 400 });
  const { runId, fixClass, persona, verdict, comment, shareToken } = parsed.data;

  const session = await getSession();
  const [run] = await db.select({ userId: runs.userId, shareToken: runs.shareToken }).from(runs).where(eq(runs.id, runId));
  if (!run) return NextResponse.json({ error: "not found" }, { status: 404 });

  const isOwner = !!session && run.userId === session.user.id;
  if (!isOwner) {
    if (!shareToken || !run.shareToken || shareToken !== run.shareToken) {
      return session
        ? NextResponse.json({ error: "forbidden" }, { status: 403 })
        : NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const [{ n }] = await db
      .select({ n: count() })
      .from(findingFeedback)
      .where(and(eq(findingFeedback.runId, runId), gte(findingFeedback.createdAt, since)));
    if (n >= ANON_PER_RUN_PER_HOUR) {
      return NextResponse.json({ error: "Too much feedback on this report. Try again later." }, { status: 429 });
    }
  }

  const [row] = await db
    .insert(findingFeedback)
    .values({ runId, fixClass, persona: persona ?? null, verdict, comment: comment ?? null, userId: session?.user.id ?? null })
    .returning({ id: findingFeedback.id });
  return NextResponse.json({ id: row.id }, { status: 201 });
}
