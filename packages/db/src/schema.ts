import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Run = typeof runs.$inferSelect;
export type NewRun = typeof runs.$inferInsert;
