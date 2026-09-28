import type { Archetype, Session, SessionResult, StepResult, StoreProfile, StoreMode, Verdict } from "@watchdog/shared";

export type { Archetype, Session, SessionResult, StepResult, StoreProfile, StoreMode, Verdict };

export type RunStatus = "queued" | "profiling" | "running" | "done" | "error";

export type Check = "seen" | "listed" | "buyable";

export type Overall = "invisible" | "seen" | "listed" | "buyable";

export type Fix = {
  fixClass: string;
  check: Check;
  title: string;
  detail: string;
  personas: string[];
};

export type RunVerdicts = {
  seen: Verdict;
  listed: Verdict;
  buyable: Verdict;
  overall: Overall;
  summary: string;
  fixes: Fix[];
};

export type Run = {
  id: string;
  storeUrl: string;
  mode: StoreMode | null;
  status: RunStatus;
  profile: StoreProfile | null;
  sessions: Session[] | null;
  results: SessionResult[] | null;
  verdicts: RunVerdicts | null;
  error: string | null;
  createdAt: string;
  updatedAt?: string;
};

export const CHECKS: Check[] = ["seen", "listed", "buyable"];

export const CHECK_LABEL: Record<Check, { title: string; question: string }> = {
  seen: { title: "Seen", question: "Can AI fetchers read a product without JavaScript?" },
  listed: { title: "Listed", question: "Is there Product schema or a feed to list from?" },
  buyable: { title: "Buyable", question: "Can a browser agent reach the payment step?" },
};
