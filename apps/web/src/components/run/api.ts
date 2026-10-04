"use client";

export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  // Dev-only: serve canned runs so the report can be built without the worker or DB. Inlined to false in prod builds.
  if (process.env.NEXT_PUBLIC_RUN_FIXTURES === "1") {
    const { mockFetch } = await import("@/fixtures/mock");
    const res = await mockFetch(url, init);
    if (res) return res;
  }
  return fetch(url, init);
}

type Fail = { ok: false; message: string; status: number };
type Ok<T> = { ok: true; data: T };

async function call<T>(url: string, init: RequestInit, missing: string): Promise<Ok<T> | Fail> {
  let res: Response;
  try {
    res = await apiFetch(url, init);
  } catch {
    return { ok: false, status: 0, message: "Could not reach the server. Try again." };
  }
  if (res.status === 404 || res.status === 405) return { ok: false, status: res.status, message: missing };
  if (res.status === 401 || res.status === 403) return { ok: false, status: res.status, message: "Sign in to do this." };
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) return { ok: false, status: res.status, message: body.error ?? `Request failed (HTTP ${res.status}).` };
  return { ok: true, data: body };
}

const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

export function shareRun(id: string) {
  return call<{ token: string; url: string }>(`/api/runs/${id}/share`, { method: "POST" }, "Sharing is not available yet.");
}

export function unshareRun(id: string) {
  return call<unknown>(`/api/runs/${id}/share`, { method: "DELETE" }, "Sharing is not available yet.");
}

export function rerun(id: string) {
  return call<{ id: string }>(`/api/runs/${id}/rerun`, { method: "POST" }, "Re-check is not available yet.");
}

export type FeedbackBody = {
  runId: string;
  fixClass: string;
  persona?: string;
  verdict: "correct" | "wrong";
  comment?: string;
  shareToken?: string;
};

export function sendFeedback(body: FeedbackBody) {
  return call<unknown>("/api/feedback", json(body), "Feedback is not available yet.");
}
