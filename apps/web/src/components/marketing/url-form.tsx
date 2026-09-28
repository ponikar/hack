"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "./motion";

export function UrlForm({ size = "lg", secondary = false, centered = false, placeholder = "yourstore.com" }: { size?: "lg" | "md"; secondary?: boolean; centered?: boolean; placeholder?: string }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const h = size === "lg" ? "h-12" : "h-11";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = url.trim();
    if (!v) return;
    setBusy(true);
    router.push(`/dashboard/new?url=${encodeURIComponent(v)}`);
  }


  return (
    <div className="w-full max-w-xl">
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row" aria-label="Start an audit">
        <label htmlFor={`store-url-${size}`} className="sr-only">
          Store URL
        </label>
        <input
          id={`store-url-${size}`}
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className={`${h} min-w-0 flex-1 rounded-lg border border-line-strong bg-surface px-3.5 font-mono text-[15px] transition-[border-color,box-shadow] placeholder:text-faint focus:border-ink focus:shadow-[0_0_0_3px_var(--accent-soft)] focus:outline-none`}
        />
        <Button type="submit" disabled={busy} className={`${h} shrink-0`}>
          {busy ? "Starting…" : "Run free audit"}
          {!busy && <ArrowRight className="size-4" aria-hidden />}
        </Button>
      </form>
      {secondary && (
        <div className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted ${centered ? "justify-center" : ""}`}>
          <Link href="/report/demo" className="inline-flex items-center gap-1 font-medium text-ink transition-colors hover:text-fail">
            See a finished report
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
          <span aria-hidden className="hidden h-3 w-px bg-line-strong sm:inline-block" />
          <span>Free in beta · Public pages only · Nothing is bought</span>
        </div>
      )}
    </div>
  );
}
