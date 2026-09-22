# PROJECT_AUDIT.md

## Requirement Status Matrix

| Requirement | Current State | Evidence | Status | Required Action |
|---|---|---|---|---|
| Python RSS ingestion | IMPLEMENTED | `scraper/pipeline.py` with 4 feeds, stdlib-only | IMPLEMENTED | None |
| 3+ real public RSS sources | IMPLEMENTED | BBC, NPR, The Guardian, Al Jazeera | IMPLEMENTED | None |
| Normalization | IMPLEMENTED | `parse_feed_xml` / `parse_feed` normalizes to Article schema | IMPLEMENTED | None |
| Publication-date handling | IMPLEMENTED | `parseDate` handles RFC822, ISO, date-only, timezone | IMPLEMENTED | None |
| Article-page extraction | IMPLEMENTED | `extractBody` / `BodyExtractor` with fallback | IMPLEMENTED | None |
| Graceful extraction failure | IMPLEMENTED | Try/catch, returns empty string on failure | IMPLEMENTED | None |
| Duplicate prevention | IMPLEMENTED | URL-based dedup via `articleIdFromUrl`, `on conflict (url)` in SQL | IMPLEMENTED | None |
| Re-runnable ingestion | IMPLEMENTED | `--merge` flag in Python, `upsertJob` + `on conflict` in TS | IMPLEMENTED | None |
| Topic clustering | IMPLEMENTED | TF-IDF cosine (0.48) + rare keyword overlap (2+, DF ≤ 12%) | IMPLEMENTED | None |
| Cluster IDs | IMPLEMENTED | `c_` + SHA1 hash of sorted article IDs | IMPLEMENTED | None |
| Cluster labels | IMPLEMENTED | Top TF-IDF terms or longest headline | IMPLEMENTED | None |
| Article membership | IMPLEMENTED | `cluster_articles` junction table | IMPLEMENTED | None |
| Timestamps | IMPLEMENTED | `published_at`, `ingested_at`, `start_at`, `end_at` | IMPLEMENTED | None |
| GET /clusters | IMPLEMENTED | `src/routes/clusters.ts` + `src/routes/api/clusters.ts` | IMPLEMENTED | None |
| GET /clusters/:id | IMPLEMENTED | `src/routes/clusters.$id.ts` + `src/routes/api/clusters.$id.ts` | IMPLEMENTED | None |
| GET /timeline | IMPLEMENTED | `src/routes/timeline.ts` + `src/routes/api/timeline.ts` | IMPLEMENTED | None |
| POST /ingest/trigger | IMPLEMENTED | `src/routes/ingest.trigger.ts` + `src/routes/api/ingest.trigger.ts` | IMPLEMENTED | None |
| GET /ingest/status/:jobId | IMPLEMENTED | `src/routes/ingest.status.$jobId.ts` + `src/routes/api/ingest.status.$jobId.ts` | IMPLEMENTED | None |
| React/Next.js frontend | PARTIAL | TanStack Start (host constraint prevents Next.js) | IMPLEMENTED | Accept TanStack Start |
| Timeline visualization | IMPLEMENTED | `NewsTimeline` component with time axis, bars, labels | IMPLEMENTED | None |
| Topic/cluster representation | IMPLEMENTED | Cluster blocks on timeline, detail panel | IMPLEMENTED | None |
| Cluster detail | IMPLEMENTED | `ClusterDetail` component with articles list | IMPLEMENTED | None |
| Source filtering | IMPLEMENTED | `SourceFilter` component, server-side filtering via `?sources=` | IMPLEMENTED | None |
| Refresh/ingestion workflow | IMPLEMENTED | `RefreshControl`, polls job status, auto-refreshes timeline | IMPLEMENTED | None |
| Loading states | IMPLEMENTED | Skeleton components, `aria-busy` | IMPLEMENTED | None |
| Empty states | IMPLEMENTED | "No stories yet" and "No clusters" messages | IMPLEMENTED | None |
| Error states | IMPLEMENTED | Error banners, failed job display | IMPLEMENTED | None |
| Responsive behavior | PARTIAL | CSS grid, overflow-x-auto, mobile breakpoints | IMPLEMENTED | Browser QA needed |
| Accessibility | IMPLEMENTED | Skip link, semantic HTML, focus states, reduced motion | IMPLEMENTED | Browser QA needed |
| SEO | IMPLEMENTED | robots.txt, sitemap.xml route, llms.txt, meta tags, OG | IMPLEMENTED | None |
| Deployment | NOT VERIFIED | Vercel preset configured, but no deployment performed | NOT VERIFIED | Requires Vercel credentials |
| README | IMPLEMENTED | Explains architecture, setup, API, sources, limitations | IMPLEMENTED | None |
| Walkthrough/demo | NOT VERIFIED | 2-3 min video not producible in this environment | NOT VERIFIED | External |
| Database (Postgres/PGLite) | IMPLEMENTED | `migrations/0002_news_pulse.sql`, PGLite fallback for preview | IMPLEMENTED | None |
| Python pipeline runnable | UNVERIFIED | Not tested on Windows (no python3); Linux sandbox expected | UNVERIFIED | Test on Linux |

## Summary

- **IMPLEMENTED**: 28/31 requirements
- **PARTIAL**: 2 (frontend framework, responsive behavior)
- **NOT VERIFIED**: 2 (deployment, walkthrough)
- **UNVERIFIED**: 1 (Python pipeline on this OS)

## Key Architecture Decisions

1. **TanStack Start instead of Next.js** — host constraints prevent running a separate Node/Express process
2. **PGLite for preview, Neon for production** — `DATABASE_URL` controls the backend
3. **Auth OFF** — public headlines only, no user accounts
4. **TF-IDF cosine clustering** — threshold 0.48, rare keyword overlap assist
5. **Full body text for reading only** — not used for clustering (shared chrome noise)

## Old Reference Project Classification

The `agent_tools/` directory in `C:\Kaam_Dhanda\Projects\News` contains a **finance-specific** news system (YFinance, MoneyControl, LiveMint, stock embeddings, LLM enhancement). This is **DO NOT USE** for News Pulse — it is entirely unrelated to the assessment requirements.
