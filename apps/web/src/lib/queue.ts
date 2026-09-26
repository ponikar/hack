import PgBoss from "pg-boss";
import { RUN_QUEUE, type AuditJob } from "@watchdog/shared";

const g = globalThis as unknown as { boss?: Promise<PgBoss> };

async function getBoss() {
  if (!g.boss) {
    g.boss = (async () => {
      const boss = new PgBoss(process.env.DATABASE_URL!);
      await boss.start();
      await boss.createQueue(RUN_QUEUE);
      return boss;
    })();
  }
  return g.boss;
}

export async function enqueueAudit(job: AuditJob) {
  const boss = await getBoss();
  return boss.send(RUN_QUEUE, job, { retryLimit: 0, expireInSeconds: 600 });
}
