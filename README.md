# AI Buyer Watchdog

Uptime monitoring, but for AI buyers. Enter a store URL. The engine profiles the store, replays the shopping journeys real AI buyers attempt, and shows the exact step where each one dies plus a plain-English fix list.

## Layout

- `apps/web` Next.js: landing page, auth, dashboard, demo store (`/store?mode=broken|fixed`), API
- `apps/worker` Node: queue consumer running the engine
  - `profile/` step 1, store profile from 8 parallel HTTP probes
  - `sessions/` step 2, personas × journey templates
  - `replay/` step 3, feed fetch checks and Chromium fast-path actions with blocker detection
  - `verdicts.ts` step 4, Seen / Listed / Buyable and the fix list
- `packages/shared` zod schemas shared by web and worker
- `packages/db` Drizzle + Postgres

Design: `docs/harness.md`, `docs/engine.md`.

## Run locally

```sh
cp .env.example .env        # optional: XAI_API_KEY for the Grok fallback
pnpm setup                  # install, chromium, docker postgres, schema
pnpm dev                    # web on :3000 + worker
```

Postgres runs in Docker on port **5436**.

## CLI

```sh
pnpm --filter worker profile:store  https://www.allbirds.com
pnpm --filter worker sessions:store https://www.allbirds.com
pnpm --filter worker replay:store   "http://localhost:3000/store?mode=broken"
```

## Flow

1. `POST /api/runs {storeUrl}` inserts a `runs` row for the signed-in user and enqueues it
2. Worker: profile → sessions → replay (writing each session result as it lands) → verdicts
3. Dashboard polls `/api/runs/[id]` and renders the persona timeline, screenshots, and fixes

## Safety

- Browser sessions never press Place Order on a live store. Only the demo store (`localhost` or `DEMO_STORE_URL`) completes checkout, with test card 4242.
- Grok is optional. Without a key the replay uses deterministic actions only.

## Hosting

- Web: any Next.js host. Set `DATABASE_URL`, `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`.
- Worker: `docker build -f apps/worker/Dockerfile .` (Playwright base image). Needs the same `DATABASE_URL` and a shared or object-storage path for `SCREENSHOT_DIR`.
- Postgres: any managed instance. The worker uses pg-boss on the same database, so no queue service is needed.
