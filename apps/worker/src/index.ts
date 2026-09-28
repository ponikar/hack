import PgBoss from "pg-boss";
import { db, runs, eq } from "@watchdog/db";
import { AuditJob, RUN_QUEUE, type SessionResult } from "@watchdog/shared";
import { profileStore } from "./profile";
import { generateSessions } from "./sessions";
import { replaySessions } from "./replay";
import { computeVerdicts } from "./verdicts";

const boss = new PgBoss(process.env.DATABASE_URL!);
boss.on("error", (e) => console.error("[pg-boss]", e));
await boss.start();
await boss.createQueue(RUN_QUEUE);

const patch = (id: string, values: Partial<typeof runs.$inferInsert>) =>
  db.update(runs).set({ ...values, updatedAt: new Date() }).where(eq(runs.id, id));

await boss.work<unknown>(RUN_QUEUE, { batchSize: 1 }, async ([job]) => {
  const { runId, storeUrl } = AuditJob.parse(job.data);
  console.log(`[run ${runId}] ${storeUrl}`);
  try {
    await patch(runId, { status: "profiling" });
    const profile = await profileStore(storeUrl);
    const sessions = await generateSessions(profile);
    await patch(runId, { status: "running", profile, sessions, results: [] });

    const results: SessionResult[] = [];
    await replaySessions(sessions, profile, runId, async (r) => {
      results.push(r);
      console.log(`[run ${runId}] ${r.status === "pass" ? "✅" : "❌"} ${r.summary}`);
      await patch(runId, { results: [...results] });
    });

    const verdicts = computeVerdicts(profile, results);
    await patch(runId, { status: "done", results, verdicts });
    console.log(`[run ${runId}] done: ${verdicts.overall} — ${verdicts.summary}`);
  } catch (err) {
    console.error(`[run ${runId}] error`, err);
    await patch(runId, { status: "error", error: String(err) });
  }
});

console.log(`worker listening on queue "${RUN_QUEUE}"`);
