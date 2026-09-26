# AI Buyer Watchdog

Uptime monitoring, but for AI buyers. See the PRD PDF in this folder.

## Layout

- `apps/web` Next.js: dashboard (`/dashboard`), demo store (`/store?mode=broken|fixed`), API (`/api/runs`)
- `apps/worker` Node process: Playwright + Grok agent, Seen check, Listed check. Pulls jobs from pg-boss.
- `packages/shared` zod schemas: the shared JSON result format (`RunResult`) and the queue job
- `packages/db` Drizzle + Postgres (`runs` table)

## Run

```sh
cp .env.example .env        # add XAI_API_KEY
pnpm setup                  # install, chromium, docker postgres, schema
pnpm dev                    # web on :3000 + worker
```

Postgres runs on **5433** (5432 is taken by local Homebrew Postgres).

One-off audit without the queue:

```sh
pnpm --filter worker run:once http://localhost:3000/store?mode=broken broken
pnpm --filter worker run:once http://localhost:3000/store?mode=fixed fixed --test-checkout
```

`--test-checkout` lets the agent press Place Order. Only use it on the demo store.

## Flow

1. `POST /api/runs {storeUrl, mode?}` inserts a `runs` row and enqueues `audit-run`
2. Worker runs Seen → Listed → Buyable, writing partial results to `runs.result`
3. `/dashboard/[id]` polls `/api/runs/[id]` every 2s and renders verdicts, steps, fix list

## Demo store modes

| mode | rendering | Product JSON-LD | checkout |
|---|---|---|---|
| broken | client fetch only | none | newsletter popup + forced sign-in |
| fixed | SSR | present | guest form, test card |
