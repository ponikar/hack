# Deploy the audit worker

The web app runs on Vercel. The worker runs real Chrome and must live on a container host. Railway is the shortest path.

## Railway (about $5/month)

1. Sign in at https://railway.com with GitHub, then **New Project → Deploy from GitHub repo → ponikar/hack**.
2. Railway reads `railway.toml` and builds `apps/worker/Dockerfile` from the repo root.
3. In the service **Variables**, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon production URL (Vercel → Storage → Neon, or `vercel env pull`) |
| `GEMINI_API_KEY` | your key (or `XAI_API_KEY`) |
| `GEMINI_MODEL` | `gemini-flash-lite-latest` |
| `GEMINI_MODEL_STRONG` | `gemini-2.5-flash` |
| `LLM_MAX_CALLS` | `30` |
| `BLOB_READ_WRITE_TOKEN` | from Vercel project env (Blob store `watchdog-screenshots`) |
| `DEMO_STORE_URL` | `https://ai-buyer-watchdog.vercel.app/store` |
| `SESSION_CONCURRENCY` | `1` on a free LLM tier, `2` on paid |

4. Deploy. Logs should show `worker listening on queue "audit-run"`.
5. Run an audit on https://ai-buyer-watchdog.vercel.app; it should leave "queued" within seconds.

Only run **one** worker against production at a time unless the LLM key is on a paid tier.
