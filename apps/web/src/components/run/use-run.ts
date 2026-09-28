"use client";

import { useEffect, useRef, useState } from "react";

export type FetchState<T> = { data: T | null; error: "unauthorized" | "not-found" | "network" | null; loading: boolean };

export function usePolled<T>(url: string, intervalMs: number, shouldPoll: (data: T | null) => boolean): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({ data: null, error: null, loading: true });
  const stop = useRef(false);

  useEffect(() => {
    stop.current = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (stop.current) return;
        if (res.status === 401 || res.status === 403) {
          setState({ data: null, error: "unauthorized", loading: false });
          return;
        }
        if (res.status === 404) {
          setState({ data: null, error: "not-found", loading: false });
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as T;
        setState({ data, error: null, loading: false });
        if (shouldPoll(data)) timer = setTimeout(tick, intervalMs);
      } catch {
        if (stop.current) return;
        setState((s) => ({ ...s, error: s.data ? null : "network", loading: false }));
        timer = setTimeout(tick, intervalMs * 2);
      }
    }

    tick();
    return () => {
      stop.current = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, intervalMs]);

  return state;
}

export async function createRun(storeUrl: string): Promise<{ id?: string; error?: string; unauthorized?: boolean }> {
  const trimmed = storeUrl.trim();
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const mode = withScheme.includes("mode=fixed") ? "fixed" : withScheme.includes("mode=broken") ? "broken" : undefined;
  let res: Response;
  try {
    res = await fetch("/api/runs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ storeUrl: withScheme, mode }),
    });
  } catch {
    return { error: "Could not reach the server. Try again." };
  }
  if (res.status === 401 || res.status === 403) return { unauthorized: true };
  if (!res.ok) {
    if (res.status === 400) return { error: "That does not look like a store URL." };
    return { error: `Could not start the audit (HTTP ${res.status}).` };
  }
  const body = (await res.json()) as { id: string };
  return { id: body.id };
}
