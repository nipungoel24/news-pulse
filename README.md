# News Pulse

Topic-clustered news timeline. Live RSS from **BBC News**, **NPR**, **The Guardian**, and **Al Jazeera** is normalized, de-duplicated, grouped, and plotted as time spans.

## Architecture

```
RSS feeds  →  Python scraper (Part 1) / TypeScript pipeline (hosted)
           →  Postgres (Neon in production, PGLite in preview)
           →  REST API  →  timeline UI
```

This workspace is a single TanStack Start app because the preview host must bind one process. Folders still match the assessment:

- [`scraper/`](scraper/) Python ingest + TF-IDF clustering
- [`backend/`](backend/) TypeScript pipeline + REST contract
- [`frontend/`](frontend/) UI notes; implementation in `src/components` and `src/routes`

## Topic grouping

**TF-IDF cosine similarity** (assessment Option B), with a rare-title overlap assist.

- Vector: headline tokens weighted 3x, plus summary
- Merge if cosine >= **0.48** or **2** shared title tokens with document frequency ≤ 12% of the ingest
- Label: top mean-TF-IDF terms (or the longest headline for pairs)
- Thresholds were tuned on a 46-article live snapshot so known duplicates (OpenAI/BC, UN drug-boat reports, typhoon Dujuan) grouped without collapsing every headline into one component

**Limitation:** extracted article HTML is full of shared chrome and verbs such as "said". Using full body as the vector single-link clustered all 46 items together. Body text is stored for reading and ignored for grouping. Repeated proper nouns can still over-merge.

**Why TF-IDF over keyword-overlap (assessment Option A):** TF-IDF with cosine similarity provides a principled, tunable similarity threshold and auto-generates cluster labels from top terms. The rare-title overlap assist ensures topic-specific articles are grouped even when headline wording differs significantly.

**How thresholds were picked:** Cosine threshold of 0.48 was chosen so that articles about the same story clearly group together, while unrelated articles are separated. The 2-shared-title-token minimum and 12% DF cap prevent common words from creating false clusters. These values were validated against a 46-article live snapshot.

## Prerequisites

- **Node.js 22** (required for the build tooling and runtime)
- **Python 3.10+** (required for the standalone scraper; `POST /ingest/trigger` launches it as a subprocess)
  - `python3` or `python` available on `PATH`
  - Optional: set `PYTHON_BIN` environment variable to specify an explicit Python binary path
- **npm** (comes with Node.js)

## Installation

### Clone the repository

```bash
git clone <repository-url>
cd news-pulse
```

### Install Node.js dependencies

```bash
npm install
```

### Python dependencies

The scraper uses only Python standard library (no pip packages required). Ensure Python is available on your PATH.

## Environment Variables

| Variable | Description | Required |
| --- | --- | --- |
| `DATABASE_URL` | Connection string for the database (Postgres/Neon in production, PGLite in preview) | Yes |
| `PYTHON_BIN` | Explicit path or command for the Python binary (e.g. `/usr/bin/python3` or custom path) | No (defaults to `python3` / `python` on PATH) |

`DATABASE_URL` is injected by the hosting platform on deploy. For local development, it is configured by the workspace. Never commit `.env` files or database credentials.

## Database Setup

The database schema is managed via migrations in `migrations/0002_news_pulse.sql`:

- `articles` table: stores normalized article data
- `clusters` table: stores topic clusters
- `cluster_articles` table: many-to-many mapping
- `ingest_jobs` table: tracks ingestion job status
- `ingest_meta` table: stores generation metadata

Migrations run automatically on first load. No manual setup is required when using the workspace preview.

## Scraper Setup

The Python scraper is at `scraper/pipeline.py`. It requires no additional Python packages (stdlib only).

To run the standalone scraper:

```bash
python scraper/pipeline.py --out scraper/data/latest.json
```

Or print JSON to stdout:

```bash
python scraper/pipeline.py --stdout
```

## Backend / Frontend Startup

The web app starts with the workspace preview. The dev server runs on `0.0.0.0:8080`.

```bash
npm run dev
```

First load ingests feeds if the database is empty. Use the **Refresh data** button in the UI to re-run the pipeline.

`POST /ingest/trigger` launches the Python pipeline as a subprocess and returns a job ID. Poll `GET /ingest/status/:jobId` until complete.

## Development Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server on `0.0.0.0:8080` |
| `npm run build` | Build standalone production server (`.output/server/index.mjs`) |
| `npm run preview:restart` | Preview the production build on `127.0.0.1:8081` |
| `npm test` | Run application and auth unit tests (`node --test`) |
| `npm run test:platform` | Run platform script tests |
| `npm run test:all` | Run all test suites |
| `npx tsc --noEmit` | Type-check the project |
| `npx eslint .` | Lint the project |
| `node scripts/browser-smoke.mjs` | Run browser smoke tests |

## Build Command

```bash
npm run build
```

This compiles the client assets into `.output/public/` and generates the standalone Nitro Node server at `.output/server/index.mjs`. The server binds to `0.0.0.0` and honors the `PORT` environment variable (default `8080` or `3000`).

## Test Commands

```bash
npm test            # Application and auth unit tests (55 passing tests)
npm run typecheck   # TypeScript type checking (zero errors)
npx eslint .        # ESLint check (zero errors)
npm run test:all    # All test suites including platform scripts
```

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` or `/health` | Lightweight service health check (`{ "status": "ok", "service": "news-pulse" }`) |
| `GET` | `/clusters` or `/api/clusters` | List topic clusters (label, article count, time range) |
| `GET` | `/clusters/:id` or `/api/clusters/:id` | Full cluster detail with all articles, sorted chronologically |
| `GET` | `/timeline` or `/api/timeline` | Clusters formatted for plotting (label, start/end time, article count, size metric) |
| `POST` | `/ingest/trigger` or `/api/ingest/trigger` | Triggers the Python ingestion pipeline as a subprocess; returns a job ID |
| `GET` | `/ingest/status/:jobId` or `/api/ingest/status/:jobId` | Polls job status (queued, running, complete, failed) |

All endpoints support a `?sources=` query parameter for filtering by news source.

Error handling returns appropriate status codes: `400` for bad requests, `404` for missing resources, `500` for server errors.

## RSS Sources

| Source | Feed URL |
| --- | --- |
| BBC News | `http://feeds.bbci.co.uk/news/rss.xml` |
| NPR | `https://feeds.npr.org/1001/rss.xml` |
| The Guardian | `https://www.theguardian.com/world/rss` |
| Al Jazeera | `https://www.aljazeera.com/rss/feed/` |

## Clustering Approach

**TF-IDF cosine similarity** with a rare-title overlap assist (assessment Option B).

- Computes TF-IDF vectors over headline + summary text
- Uses cosine similarity with threshold 0.48
- Rare-title overlap (≥ 2 shared tokens, DF ≤ 12%) assists clustering
- Auto-generates cluster labels from top TF-IDF terms
- Articles are stored with full body text for reading but only headline+summary is used for grouping (full body caused over-merging due to shared HTML chrome)

## Deployment Architecture & Considerations

| Component | Target Platform | Runtime Architecture | Notes |
| --- | --- | --- | --- |
| Container App | Docker / Any OCI Host (Cloud Run, ECS, Fly.io, VPS) | Multi-stage Node 22 + Python 3.11 container | Recommended deployment target |
| Frontend UI | Node.js | TanStack Start (React 19) SSR / static | Served via Nitro node-server |
| Backend API | Node.js | Nitro server routes | REST endpoints (`/api/clusters`, `/api/timeline`, `/api/health`) |
| Database | Neon Postgres or Embedded PGLite | Managed Postgres or in-memory fallback | Connected via `DATABASE_URL` |
| Scraper Ingestion | Container Subprocess | Python 3 subprocess (`child_process.spawn`) | Invoked via `POST /api/ingest/trigger` |

### Container Deployment (Docker — Recommended)

Container deployment is the **recommended production target** because it completely solves the dual runtime requirement: both Node.js 22 (for TanStack Start / Nitro) and Python 3.10+ (for the standalone RSS ingestion & TF-IDF clustering pipeline) are bundled together with CA certificates into a single lightweight runtime image.

#### 1. Build the Docker image

```bash
docker build -t news-pulse .
```

#### 2. Run the container

**Standalone / Preview Mode (uses embedded PGLite database fallback):**
```bash
docker run -d --name news-pulse -p 8080:8080 news-pulse
```

**Production Mode (connected to external Postgres/Neon database):**
```bash
docker run -d --name news-pulse -p 8080:8080 \
  -e DATABASE_URL="postgresql://user:pass@host/db?sslmode=require" \
  news-pulse
```

- **Port & Binding**: The container server listens on `0.0.0.0` and defaults to port `8080`. You can override the port by passing `-e PORT=<port>` and binding accordingly.
- **Health Check**: A built-in Docker `HEALTHCHECK` queries `http://127.0.0.1:${PORT:-8080}/api/health` every 30s.

### Deployment Blocker: Vercel Serverless Python Execution

> [!WARNING]
> **Vercel Deployment Blocker**: Standard Vercel Serverless Functions run in a Node.js-only container where Python 3 is **not** available on PATH. In addition, Vercel Serverless execution limits and read-only filesystem environments prevent arbitrary `child_process.spawn()` of Python scripts without a custom container runtime or external worker service.
> 
> While the application bundles successfully with Nitro, live deployment to standard Vercel will not execute the Python scraper subprocess unless Python is provided via a container or separate worker. For full live operation, container deployment (Docker) as documented above is the verified and supported path.

## Limitations

1. **Python Subprocess Requirement**: `POST /ingest/trigger` launches `scraper/pipeline.py` as an OS subprocess (`child_process.spawn`). This requires Python 3.10+ on `PATH` (or via `PYTHON_BIN`). As documented above, containerized deployment completely satisfies this requirement.
2. **Framework Choice**: The assessment specifies "Next.js / React Frontend". This implementation uses TanStack Start (React 19) due to host platform constraints requiring a single-process binding on `0.0.0.0:8080`. All functional requirements (timeline visualization, cluster exploration, filtering, refresh workflow) are satisfied. See `FRAMEWORK_COMPLIANCE.md` for details.
3. **Body Text for Grouping**: Full article HTML is stored but not used for clustering because shared page chrome causes over-merging.
4. **Cross-Source Merging**: Articles from different outlets about the same story are not merged into a single cluster (stretch goal from the assessment).
5. **Walkthrough Video**: The required 2-3 minute walkthrough video must be recorded externally and is not part of this codebase.

## Assumptions

- NPR requires a browser-like User-Agent (returns 403 otherwise)
- Twelve items per feed keeps ingest interactive
- Auth is off: stored rows are public headlines only
- The workspace preview host binds `0.0.0.0:8080` with a single process
- Python is available on the system for the ingestion subprocess
