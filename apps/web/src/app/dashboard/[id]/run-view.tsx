"use client";

import type { Run } from "@watchdog/db";
import { useEffect, useState } from "react";

const badge: Record<string, string> = { pass: "bg-green-600", fail: "bg-red-600", skipped: "bg-gray-400" };

export function RunView({ initial }: { initial: Run }) {
  const [run, setRun] = useState(initial);

  useEffect(() => {
    if (run.status === "done" || run.status === "error") return;
    const t = setInterval(async () => {
      const r = await fetch(`/api/runs/${run.id}`).then((x) => x.json());
      setRun(r);
    }, 2000);
    return () => clearInterval(t);
  }, [run.id, run.status]);

  const r = run.result;
  return (
    <main className="mx-auto max-w-3xl p-8 space-y-6">
      <h1 className="text-xl font-semibold break-all">{run.storeUrl}</h1>
      <p className="text-sm">status: {run.status}</p>

      <div className="grid grid-cols-3 gap-3">
        {(["seen", "listed", "buyable"] as const).map((k) => {
          const v = r?.[k]?.verdict;
          return (
            <div key={k} className="border rounded p-4">
              <div className="uppercase text-xs">{k}</div>
              <span className={`inline-block mt-2 text-white text-sm px-2 py-0.5 rounded ${v ? badge[v] : "bg-gray-300"}`}>{v ?? "pending"}</span>
            </div>
          );
        })}
      </div>

      {r?.buyable && (
        <ol className="space-y-2">
          {r.buyable.steps.map((s) => (
            <li key={s.step} className={`border rounded p-3 ${s.step === r.buyable?.failingStep ? "border-red-600 bg-red-50" : ""}`}>
              <div className="font-medium">{s.step} · {s.status}</div>
              {s.reason && <div className="text-sm">{s.reason}</div>}
            </li>
          ))}
        </ol>
      )}

      {r?.fixes?.length ? (
        <section>
          <h2 className="font-semibold">Fix list</h2>
          <ul className="list-disc pl-6">
            {r.fixes.map((f) => (
              <li key={f.title}><b>{f.title}</b> — {f.detail}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {run.error && <pre className="text-red-600 text-xs whitespace-pre-wrap">{run.error}</pre>}
    </main>
  );
}
