import { db, runs, eq } from "@watchdog/db";
import { notFound } from "next/navigation";
import { RunView } from "./run-view";

export const dynamic = "force-dynamic";

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [run] = await db.select().from(runs).where(eq(runs.id, id));
  if (!run) notFound();
  return <RunView initial={run} />;
}
