"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

export function UrlForm({ size = "lg" }: { size?: "lg" | "md" }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const h = size === "lg" ? "h-12" : "h-10";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = url.trim();
    if (!v) return;
    setBusy(true);
    router.push(`/dashboard/new?url=${encodeURIComponent(v)}`);
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-xl flex-col gap-2 sm:flex-row" aria-label="Start an audit">
      <label htmlFor="store-url" className="sr-only">
        Store URL
      </label>
      <input
        id="store-url"
        type="text"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        placeholder="yourstore.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className={`${h} flex-1 rounded-md border border-line-strong bg-bg px-3.5 font-mono text-[15px] placeholder:text-faint focus:border-accent`}
      />
      <button
        type="submit"
        disabled={busy || !url.trim()}
        className={`${h} inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-accent px-5 text-[15px] font-medium text-accent-ink hover:brightness-110 disabled:opacity-50`}
      >
        {busy ? "Starting…" : "Audit my store"}
        {!busy && <ArrowRight className="size-4" aria-hidden />}
      </button>
    </form>
  );
}
