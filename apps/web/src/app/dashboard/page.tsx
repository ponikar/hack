import { db, runs, desc } from "@watchdog/db";
import Link from "next/link";
import { RunForm } from "./run-form";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const rows = await db.select().from(runs).orderBy(desc(runs.createdAt)).limit(20);
  return (
    <main className="mx-auto max-w-3xl p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <RunForm />
      <ul className="divide-y">
        {rows.map((r) => (
          <li key={r.id} className="py-2 flex justify-between">
            <Link className="underline" href={`/dashboard/${r.id}`}>{r.storeUrl}</Link>
            <span className="text-sm">{r.mode ?? "live"} · {r.status}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
