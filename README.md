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
  - Windows: `C:\Users\Nipun\AppData\Local\Programs\Python\Python314\python.exe`
  - Linux/macOS: `python3` or `python`
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
| `npm run build` | Build for production |
| `npm run preview:restart` | Preview the production build on `127.0.0.1:8081` |
| `npx tsc --noEmit` | Type-check the project |
| `npx eslint .` | Lint the project |
| `node --test 'scripts/**/*.test.mjs'` | Run all automated tests |
| `node scripts/browser-smoke.mjs` | Run browser smoke tests |

## Build Command

```bash
npm run build
```

This produces a Vercel-compatible deployment output in `.vercel/output/`.

## Test Commands

```bash
npm run typecheck   # TypeScript type checking
npx eslint .        # ESLint
node --test 'scripts/**/*.test.mjs'   # All automated tests
node scripts/browser-smoke.mjs        # Browser smoke tests
```

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/clusters` | List topic clusters (label, article count, time range) |
| `GET` | `/clusters/:id` | Full cluster detail with all articles, sorted chronologically |
| `GET` | `/timeline` | Clusters formatted for plotting (label, start/end time, article count, size metric) |
| `POST` | `/ingest/trigger` | Triggers the Python ingestion pipeline as a subprocess; returns a job ID |
| `GET` | `/ingest/status/:jobId` | Polls job status (queued, running, complete, failed) |

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

## Deployment

| Component | Platform | Notes |
| --- | --- | --- |
| Frontend | Vercel | TanStack Start app |
| Backend API | Vercel | Nitro server functions |
| Database | Neon Postgres | `DATABASE_URL` env var |
| Python pipeline | Local / GitHub Actions | Run via `POST /ingest/trigger` subprocess |

### Deploy to Vercel

```bash
npm run build
# Deploy the .vercel/output/ directory via Vercel CLI or dashboard
```

Configure `DATABASE_URL` as an environment variable on the hosting platform. Do not commit secrets.

### What runs where

| Piece | Preview | Deploy |
| --- | --- | --- |
| UI + REST | TanStack Start | Vercel |
| Ingest | Python subprocess via Node.js | Python subprocess via Node.js |
| Database | PGLite | Neon Postgres |

## Limitations

1. **Python subprocess**: `POST /ingest/trigger` launches the Python pipeline as a subprocess. This requires Python to be available on the system PATH. If Python is unavailable, the endpoint returns a `500` error.
2. **Framework**: The assessment specifies "Next.js / React Frontend". This implementation uses TanStack Start (React 19) due to host platform constraints that require a single-process binding on `0.0.0.0:8080`. All functional requirements (timeline visualization, cluster exploration, filtering, refresh workflow) are satisfied. See `FRAMEWORK_COMPLIANCE.md` for details.
3. **Body text for grouping**: Full article HTML is stored but not used for clustering because shared page chrome causes over-merging.
4. **Cross-source merging**: Articles from different outlets about the same story are not merged into a single cluster (stretch goal from the assessment).
5. **Walkthrough video**: The required 2-3 minute walkthrough video must be recorded externally and is not part of this codebase.

## Assumptions

- NPR requires a browser-like User-Agent (returns 403 otherwise)
- Twelve items per feed keeps ingest interactive
- Auth is off: stored rows are public headlines only
- The workspace preview host binds `0.0.0.0:8080` with a single process
- Python is available on the system for the ingestion subprocess
