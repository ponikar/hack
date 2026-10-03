import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as runSchema from "./schema";
import * as authSchema from "./auth-schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const globalForDb = globalThis as unknown as { client?: ReturnType<typeof postgres> };
const client = globalForDb.client ?? postgres(url, { max: 5 });
if (process.env.NODE_ENV !== "production") globalForDb.client = client;

export const schema = { ...runSchema, ...authSchema };
export const db = drizzle(client, { schema });
export * from "./schema";
export * from "./auth-schema";
export { eq, desc, and, like, gte } from "drizzle-orm";
