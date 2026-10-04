import { type AnyPgColumn, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { RunStatus, RunVerdicts, Session, SessionResult, StoreMode, StoreProfile } from "@watchdog/shared";
import { user } from "./auth-schema";

export const runs = pgTable("runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  storeUrl: text("store_url").notNull(),
  mode: text("mode").$type<StoreMode>(),
  status: text("status").$type<RunStatus>().notNull().default("queued"),
  profile: jsonb("profile").$type<StoreProfile>(),
  sessions: jsonb("sessions").$type<Session[]>(),
  results: jsonb("results").$type<SessionResult[]>(),
  verdicts: jsonb("verdicts").$type<RunVerdicts>(),
  error: text("error"),
  shareToken: text("share_token").unique(),
  rerunOf: uuid("rerun_of").references((): AnyPgColumn => runs.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Run = typeof runs.$inferSelect;
export type NewRun = typeof runs.$inferInsert;

export type FeedbackVerdict = "correct" | "wrong";

export const findingFeedback = pgTable(
  "finding_feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id")
      .notNull()
      .references(() => runs.id, { onDelete: "cascade" }),
    fixClass: text("fix_class").notNull(),
    persona: text("persona"),
    verdict: text("verdict").$type<FeedbackVerdict>().notNull(),
    comment: text("comment"),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("finding_feedback_run_idx").on(t.runId, t.createdAt)],
);

export type FindingFeedback = typeof findingFeedback.$inferSelect;

export type AgentHitKind = "page" | "robots" | "beacon" | "api";

export const agentHits = pgTable("agent_hits", {
  id: uuid("id").primaryKey().defaultRandom(),
  ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
  method: text("method"),
  path: text("path"),
  query: text("query"),
  ua: text("ua"),
  ip: text("ip"),
  headers: jsonb("headers").$type<Record<string, string>>(),
  kind: text("kind").$type<AgentHitKind>(),
  benchCase: text("bench_case"),
  note: text("note"),
});

export type AgentHit = typeof agentHits.$inferSelect;
export type NewAgentHit = typeof agentHits.$inferInsert;
