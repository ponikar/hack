import PgBoss from "pg-boss";
import { db, runs, eq } from "@watchdog/db";
import { AuditJob, RUN_QUEUE } from "@watchdog/shared";
import { runAudit } from "./audit";

const boss = new PgBoss(process.env.DATABASE_URL!);
boss.on("error", (e) => console.error("[pg-boss]", e));
await boss.start();
await boss.createQueue(RUN_QUEUE);

await boss.work<unknown>(RUN_QUEUE, { batchSize: 1 }, async ([job]) => {
  const data = AuditJob.parse(job.data);
  console.log(`[run ${data.runId}] start ${data.storeUrl} mode=${data.mode ?? "-"}`);
  await db.update(runs).set({ status: "running", updatedAt: new Date() }).where(eq(runs.id, data.runId));
  try {
    const result = await runAudit(data, async (partial) => {
      await db.update(runs).set({ result: partial, updatedAt: new Date() }).where(eq(runs.id, data.runId));
    });
    await db.update(runs).set({ status: "done", result, updatedAt: new Date() }).where(eq(runs.id, data.runId));
    console.log(`[run ${data.runId}] done seen=${result.seen?.verdict} listed=${result.listed?.verdict} buyable=${result.buyable?.verdict}`);
  } catch (err) {
    console.error(`[run ${data.runId}] error`, err);
    await db.update(runs).set({ status: "error", error: String(err), updatedAt: new Date() }).where(eq(runs.id, data.runId));
  }
});

console.log(`worker listening on queue "${RUN_QUEUE}"`);
