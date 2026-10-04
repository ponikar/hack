"use client";

import { DEMO_STORE_BROKEN } from "@/lib/demo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Nav } from "@/components/marketing/nav";
import type { Run } from "@/components/run/types";
import { createRun, usePolled } from "@/components/run/use-run";
import { hostOf, relativeTime } from "@/components/run/format";
import { ModeBadge, StatusPill } from "@/components/run/badges";
import { canBuy, deriveIssues, severityCounts } from "@/components/run/issues";
import { SignedOut } from "@/components/run/signed-out";

const anyActive = (rows: Run[] | null) => !rows || rows.some((r) => r.status !== "done" && r.status !== "error");

export default function Dashboard() {
  const { data: rows, error, loading } = usePolled<Run[]>("/api/runs", 3000, anyActive);

  return (
    <>
      <Nav links="app" />
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-xl font-semibold tracking-tight">Audits</h1>
        <p className="mt-1 text-sm text-muted">Every store you have pointed the watchdog at.</p>

        <div className="mt-5">
          <NewAuditForm />
        </div>

        <div className="mt-8">
          {error === "unauthorized" ? (
            <SignedOut />
          ) : loading ? (
            <ul className="divide-y divide-line border-y border-line">
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex items-center gap-4 py-3.5">
                  <span className="skeleton h-4 w-56" />
                  <span className="skeleton ml-auto h-6 w-20" />
                </li>
              ))}
            </ul>
          ) : error === "network" && !rows ? (
            <p className="text-sm text-fail">Could not load audits. Retrying.</p>
          ) : rows && rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line-strong p-8 text-center text-sm text-muted">
              No audits yet. Enter a store URL above to run the first one.
            </div>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {rows?.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/dashboard/${r.id}`}
                    className="group grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 py-3.5 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:gap-x-4"
                  >
                    <span className="min-w-0 truncate font-mono text-[13px] sm:text-sm group-hover:text-accent">{hostOf(r.storeUrl)}</span>
                    <span className="text-xs text-muted sm:order-last sm:w-20 sm:text-right">{relativeTime(r.createdAt)}</span>
                    <span className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-3 sm:contents">
                      <ModeBadge mode={r.mode} />
                      <StatusPill status={r.status} />
                      {r.verdicts ? (
                        <RunOutcome run={r} />
                      ) : (
                        <span className="inline-flex h-6 w-[72px] items-center justify-center rounded-full border border-dashed border-line text-xs text-faint">
                          {r.status === "error" ? "—" : "pending"}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}

function RunOutcome({ run }: { run: Run }) {
  const critical = severityCounts(deriveIssues(run)).critical;
  const buyable = canBuy(run);
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold ${
          buyable ? "border-ok/30 bg-ok-soft text-ok" : "border-fail/30 bg-fail-soft text-fail"
        }`}
      >
        {buyable ? "AI can buy" : "AI can’t buy"}
      </span>
      <span className={`whitespace-nowrap text-xs ${critical ? "font-medium text-fail" : "text-muted"}`}>
        {critical} critical
      </span>
    </span>
  );
}

function NewAuditForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setBusy(true);
    setError(null);
    const r = await createRun(url);
    if (r.unauthorized) {
      router.push(`/sign-in?next=${encodeURIComponent(`/dashboard/new?url=${encodeURIComponent(url)}`)}`);
      return;
    }
    if (r.error || !r.id) {
      setError(r.error ?? "Something went wrong.");
      setBusy(false);
      return;
    }
    router.push(`/dashboard/${r.id}`);
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-line bg-surface p-3 sm:p-4">
      <label htmlFor="new-url" className="text-sm font-medium">
        New audit
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id="new-url"
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://yourstore.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="h-10 flex-1 rounded-md border border-line bg-bg px-3 font-mono text-sm placeholder:text-faint focus:border-accent"
        />
        <button
          type="submit"
          disabled={busy || !url.trim()}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-ink px-4 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "Starting…" : "Run audit"}
          {!busy && <ArrowRight className="size-4" aria-hidden />}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">
        Live stores stop at the payment step. Nothing is bought.{" "}
        <button type="button" className="text-accent hover:underline" onClick={() => setUrl(DEMO_STORE_BROKEN)}>
          Try the demo store
        </button>
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-fail">
          {error}
        </p>
      )}
    </form>
  );
}
