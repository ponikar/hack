# Bench

Measures how the engine's simulated AI buyers compare with real agents.

## Run

```sh
pnpm -C apps/worker bench:run                              # all stores, 3 repeats
pnpm -C apps/worker bench:run --only control,js-only --repeat 1
pnpm -C apps/worker bench:run --url https://shop.example --id my-shop --repeat 2
pnpm -C apps/worker bench:score bench/results/<timestamp>   # path relative to apps/worker, or absolute
```

- Fixtures live at `${BENCH_BASE}/bench/<id>` (`BENCH_BASE` defaults to the Vercel deploy).
- Each store-run is profile → sessions → replay → verdicts in a child process, killed after 180s.
- Output: one `<storeId>-<rep>.json` per run in `bench/results/<timestamp>/` (git-ignored), plus screenshots.

## Add ground truth

Add a JSON array to `bench/ground-truth/` (format in its README). Then rerun `bench:score`.
Optional `bench/expected.json` holds designed outcomes per fixture: `{ "<caseId>": { "feedReader": "pass"|"fail", "browserAgent": "reach_checkout"|"blocked", "blockedAt"?: step, "uncertain"?: true } }`.

## Metrics

- **Outcome**: feed readers `pass`/`fail`; browser agents `reach_checkout` (passed or stopped at the payment gate) / `blocked`; `error` when the run crashed or timed out.
- **Step**: where the journey stopped, normalised to `home search product variant add_to_cart cart checkout payment fetch` (see `normalize.ts`).
- **Consistency**: per store × persona, share of repeats that agree with the most common (outcome, step).
- **Outcome match / step match**: our persona's modal result equals the ground-truth row. Browser-agent truth is compared with every browser persona; fetcher truth with every feed-reader persona. Best/worst persona is listed per row.
- **False alarm**: we blocked/failed, the real agent got through.
- **Miss**: we got through, the real agent was blocked.
- **Designed expectations**: per fixture, archetype outcome (any persona reaching = reach) vs `expected.json`; `uncertain` cases are shown but not counted.
