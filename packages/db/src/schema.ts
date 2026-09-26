import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { RunResult, RunStatus, StoreMode } from "@watchdog/shared";

export const runs = pgTable("runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeUrl: text("store_url").notNull(),
  mode: text("mode").$type<StoreMode>(),
  status: text("status").$type<RunStatus>().notNull().default("queued"),
  result: jsonb("result").$type<RunResult>(),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Run = typeof runs.$inferSelect;
export type NewRun = typeof runs.$inferInsert;
