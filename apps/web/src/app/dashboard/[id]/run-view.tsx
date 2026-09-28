"use client";

import type { Run } from "@watchdog/db";
import { useEffect, useState } from "react";

export function RunView({ initial }: { initial: Run }) {
  const [run, setRun] = useState(initial);
  useEffect(() => {
    if (run.status === "done" || run.status === "error") return;
    const t = setInterval(async () => setRun(await fetch(`/api/runs/${run.id}`).then((x) => x.json())), 2000);
    return () => clearInterval(t);
  }, [run.id, run.status]);

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-4">
      <h1 className="text-xl font-semibold break-all">{run.storeUrl}</h1>
      <p className="text-sm">status: {run.status}</p>
      {run.verdicts && <p className="font-medium">{run.verdicts.overall}: {run.verdicts.summary}</p>}
      <ul className="space-y-1">
        {(run.results ?? []).map((r) => (
          <li key={r.sessionId} className="text-sm">{r.status === "pass" ? "✅" : "❌"} {r.summary}</li>
        ))}
      </ul>
      {run.error && <pre className="text-red-600 text-xs whitespace-pre-wrap">{run.error}</pre>}
    </main>
  );
}
