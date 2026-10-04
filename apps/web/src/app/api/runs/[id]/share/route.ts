import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { db, runs, eq } from "@watchdog/db";
import { requireOwnedRun, shareUrl } from "@/lib/runs";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const owned = await requireOwnedRun((await params).id);
  if (!owned.ok) return owned.res;

  let token = owned.run.shareToken;
  if (!token) {
    token = randomBytes(16).toString("base64url");
    await db.update(runs).set({ shareToken: token }).where(eq(runs.id, owned.run.id));
  }
  return NextResponse.json({ token, url: shareUrl(token) });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const owned = await requireOwnedRun((await params).id);
  if (!owned.ok) return owned.res;

  await db.update(runs).set({ shareToken: null }).where(eq(runs.id, owned.run.id));
  return NextResponse.json({ ok: true });
}
