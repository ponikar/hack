"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Nav } from "@/components/marketing/nav";
import { createRun } from "@/components/run/use-run";
import { SignedOut } from "@/components/run/signed-out";

export default function NewRunPage() {
  return (
    <>
      <Nav links="app" />
      <main className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
        <Suspense fallback={<Starting />}>
          <Starter />
        </Suspense>
      </main>
    </>
  );
}

function Starter() {
  const router = useRouter();
  const params = useSearchParams();
  const url = params.get("url") ?? "";
  const [state, setState] = useState<{ error?: string; unauthorized?: boolean }>({});

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    createRun(url).then((r) => {
      if (cancelled) return;
      if (r.id) router.replace(`/dashboard/${r.id}`);
      else setState(r);
    });
    return () => {
      cancelled = true;
    };
  }, [url, router]);

  if (!url) {
    return (
      <p className="text-sm text-muted">
        No store URL given.{" "}
        <Link href="/dashboard" className="text-accent hover:underline">
          Start an audit from the dashboard
        </Link>
        .
      </p>
    );
  }
  if (state.unauthorized) return <SignedOut what="the audit you started" />;
  if (state.error) {
    return (
      <div className="text-sm">
        <p className="text-fail">{state.error}</p>
        <Link href="/dashboard" className="mt-2 inline-block text-accent hover:underline">
          Back to audits
        </Link>
      </div>
    );
  }
  return <Starting url={url} />;
}

function Starting({ url }: { url?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted">
      <span className="size-2 rounded-full bg-accent animate-[pulse-soft_1.2s_ease-in-out_infinite]" aria-hidden />
      Starting the audit{url ? ` for ${url}` : ""}…
    </div>
  );
}
