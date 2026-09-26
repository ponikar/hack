import { profileStore } from "./profile";
import { generateSessions } from "./sessions";

const url = process.argv[2];
if (!url) {
  console.error("usage: pnpm --filter worker sessions:store <store-url>");
  process.exit(1);
}
const profile = await profileStore(url);
console.log(JSON.stringify(await generateSessions(profile), null, 2));
