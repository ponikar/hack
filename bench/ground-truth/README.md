# Ground truth

What real AI agents did on each bench store, recorded by a human or another agent. `bench:score` compares our engine against these rows.

## Format

Each `*.json` file holds an array of rows. Files starting with `_` (like `_example.json`) are ignored.

| field | type | meaning |
|---|---|---|
| `storeId` | string | id from `apps/worker/src/bench/stores.ts` (or the `--id` of an ad-hoc run) |
| `agent` | string | real agent name, e.g. `chatgpt-atlas`, `perplexity-comet`, `GPTBot` |
| `method` | `"browser-agent"` \| `"fetcher"` | browser agents are compared to our browser personas; fetchers to our feed-reader personas |
| `reachedCheckout` | boolean \| null | browser agents: did it reach checkout/payment? fetchers: `null` |
| `stoppedAt` | step \| null | where it stopped: `home search product variant add_to_cart cart checkout payment fetch`. `payment` when it reached the payment gate; `fetch` when a fetcher failed; `null` when a fetcher succeeded |
| `reason` | string | why it stopped, in plain words |
| `evidence` | string[] | screenshots, share links, transcripts |
| `observedAt` | ISO date | when observed |
| `observer` | string | who recorded it |

Use one file per observer or per session, e.g. `2026-10-03-darshan.json`. See `_example.json`.
