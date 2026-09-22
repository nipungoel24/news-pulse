# Architecture.md

## Stack
**Framework:** TanStack Start (React 19) — sandbox host contract; the assessment named Next.js, which this environment cannot run as the preview app.
**Language:** TypeScript on the hosted API/UI; Python 3 (stdlib only) for the Part 1 scraper.
**Build tool:** Vite 8
**Rendering:** SSR HTML shell plus client interactivity for the timeline
**Styling:** Tailwind v4 design tokens, Radix/shadcn primitives
**UI primitives:** Button, sheet, badge, tooltip, skeleton, separator
**Data/API:** TanStack Start server routes + `createServerFn`, Postgres via `@/lib/db`
**Deployment:** Vercel (platform). Preview binds `0.0.0.0:8080`.

## Route map
- `/` — timeline explorer
- `/about` — product + clustering method
- `/privacy` — privacy policy
- `/terms` — terms
- `/clusters` — JSON list (assessment endpoint)
- `/clusters/:id` — JSON cluster detail
- `/timeline` — JSON timeline payload
- `/ingest/trigger` — POST job start
- `/ingest/status/:jobId` — GET job poll
- `/api/*` — aliases of the same endpoints
- splat — custom 404

## Folder structure
```
scraper/                 Python RSS ingest + TF-IDF clustering
backend/                 Node ingest/API modules (imported by the host)
src/routes/              TanStack pages + REST handlers
src/components/          UI + timeline
src/lib/news/            store, jobs, server functions
migrations/0002_news_pulse.sql
```

## Rendering strategy
- public pages: SSR document shell, unique titles/descriptions
- interactive surfaces: timeline, filters, refresh, cluster sheet
- data fetching: server functions + TanStack Query; first empty DB kicks ingest

## Component architecture
- `SiteHeader` / `SiteFooter` — masthead chrome
- `NewsTimeline` — packed time-span bars
- `ClusterDetail` — article list for the selected cluster
- `SourceFilter` — source toggles
- `RefreshControl` — trigger + poll

## State management
- Server: Postgres articles/clusters/jobs
- Client: TanStack Query cache, local source-filter set, selected cluster id
- Ingest jobs: in-process map + `ingest_jobs` rows (preview process is single-instance)

## SEO architecture
- metadata source: per-route `head()`
- canonical strategy: path-relative canonicals
- sitemap: `/sitemap.xml`
- robots: `/robots.txt`
- llms: `/llms.txt`
- structured data: WebSite + FAQPage on About (truthful)

## External systems
- analytics: none
- forms/email: none
- maps: none
- monitoring: none
- news: BBC, NPR, Guardian, Al Jazeera public RSS

## Boundaries
- Do not: add auth, invent stories, store personal data, hardcode secrets, call Python on Vercel as the only path (TypeScript pipeline is the hosted ingest).
