"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RunForm() {
  const router = useRouter();
  const [url, setUrl] = useState("http://localhost:3000/store?mode=broken");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const mode = url.includes("mode=fixed") ? "fixed" : url.includes("mode=broken") ? "broken" : undefined;
    const res = await fetch("/api/runs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ storeUrl: url, mode }),
    });
    const { id } = await res.json();
    router.push(`/dashboard/${id}`);
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input className="flex-1 border rounded px-3 py-2" value={url} onChange={(e) => setUrl(e.target.value)} />
      <button disabled={busy} className="rounded bg-black text-white px-4 py-2 disabled:opacity-50">Run audit</button>
    </form>
  );
}
