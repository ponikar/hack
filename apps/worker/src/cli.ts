import { runAudit } from "./audit";

const url = process.argv[2];
if (!url) {
  console.error("usage: pnpm run:once <store-url> [broken|fixed] [--test-checkout]");
  process.exit(1);
}
const mode = process.argv[3] === "broken" || process.argv[3] === "fixed" ? process.argv[3] : undefined;
const liveStore = !process.argv.includes("--test-checkout");

const result = await runAudit({ runId: crypto.randomUUID(), storeUrl: url, mode, liveStore });
console.log(JSON.stringify(result, null, 2));
