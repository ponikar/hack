import { profileStore } from "./profile";
import { generateSessions } from "./sessions";
import { replaySessions } from "./replay";
import { computeVerdicts } from "./verdicts";

const url = process.argv[2];
if (!url) { console.error("usage: pnpm --filter worker replay:store <store-url>"); process.exit(1); }

const profile = await profileStore(url);
const sessions = await generateSessions(profile);
console.error(`profile: ${profile.platform.name}, ${sessions.length} sessions`);
const runId = `cli-${Date.now()}`;
const results = await replaySessions(sessions, profile, runId, (r) => {
  const mark = r.status === "pass" ? "✅" : r.status === "blocked" ? "⛔" : "❌";
  console.error(`${mark} ${r.summary} (${(r.durationMs / 1000).toFixed(1)}s)`);
});
const verdicts = computeVerdicts(profile, results);
console.error(`${verdicts.overall.toUpperCase()}: ${verdicts.summary}`);
for (const f of verdicts.fixes) console.error(`  fix: ${f.title}`);
if (process.argv.includes("--json")) console.log(JSON.stringify({ profile, sessions, results, verdicts }, null, 2));
