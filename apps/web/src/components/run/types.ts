import type { Archetype, Fix, RunStatus, RunVerdicts, Session, SessionResult, StepResult, StoreProfile, StoreMode, Verdict } from "@watchdog/shared";

export type { Archetype, Session, SessionResult, StepResult, StoreProfile, StoreMode, Verdict };

export type { Fix, RunStatus, RunVerdicts } from "@watchdog/shared";
export type Check = Fix["check"];
export type Overall = RunVerdicts["overall"];

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
