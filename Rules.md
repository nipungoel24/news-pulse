# Rules.md

## Design
- Newsprint / editorial masthead. Not a SaaS dashboard.
- No purple/multicolor gradients.
- No fake proof, fake live viewer counts, or fake awards.
- No emoji UI icons (Lucide only).
- No universal pill chrome. Source filters are rectangular masthead controls.
- Motion only for state (open/close, loading). Honor reduced motion.
- No em dashes in site copy.

## Content
- Every article comes from a fetched RSS item or a graceful extract of that item's page.
- Never invent headlines, quotes, or outlet names that were not ingested.
- If feeds fail, show an error/empty state. Do not seed fake news.

## Accessibility
- Semantic HTML, one H1 per page.
- Timeline clusters are real buttons with names.
- Skip link, visible focus, keyboard operable sheet.
- Touch targets at least 44px on controls.
- Contrast against paper/ink tokens.

## SEO
- Unique title and description per public page.
- robots, sitemap, llms.
- Truthful WebSite JSON-LD only.

## Performance
- Cap items per feed (12).
- Body-extract timeouts and bounded concurrency.
- One ingest at a time.
- Do not block first paint on ingest: return a job and poll.

## Code
- Auth stays off. Rows are unowned public news data.
- Recluster by writing a new generation and deactivating the previous one. Do not `DELETE FROM articles`.
- Config via env (`DATABASE_URL` injected by the host). Never commit secrets.
- Python scraper is stdlib-only so it runs without pip.

## Completion
Never claim the walkthrough video or an external GitHub submission is done.
