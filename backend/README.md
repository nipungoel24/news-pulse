# Backend (TypeScript)

Hosted REST API for News Pulse. The live process is TanStack Start (this sandbox cannot run a separate Express server as the preview). Handlers are mounted at the assessment paths and under `/api`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/clusters` | Cluster list: label, count, time range, sources |
| GET | `/clusters/:id` | Articles, chronological |
| GET | `/timeline` | start/end, count, intensity, color |
| POST | `/ingest/trigger` | Start scrape + cluster, returns `jobId` (202) |
| GET | `/ingest/status/:jobId` | Poll job |

Query `?sources=bbc,npr` filters clusters to those sources. Unknown ids return 400. Missing cluster/job return 404.

Ingest is a TypeScript port of `scraper/pipeline.py` (`feeds.ts`, `rss.ts`, `extract.ts`, `cluster.ts`, `pipeline.ts`). It upserts articles by URL and writes a new cluster generation instead of deleting rows.
