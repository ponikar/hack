import { profileStore } from "./profile";

const url = process.argv[2];
if (!url) {
  console.error("usage: pnpm --filter worker profile:store <store-url>");
  process.exit(1);
}
console.log(JSON.stringify(await profileStore(url), null, 2));
