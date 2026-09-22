# Memory.md

## Current phase
Phase 8 — Release review (QA verified)

## Current task
All tasks complete. Final verification passed.

## Completed
- [x] Repository audit
- [x] Agent Forge skills loaded (production-website)
- [x] PRD / Architecture / Rules / Phases / Design
- [x] Python scraper (TF-IDF clustering, 4 RSS sources)
- [x] TypeScript pipeline + REST API (5 endpoints + /api aliases)
- [x] Database schema (articles, clusters, cluster_articles, ingest_jobs)
- [x] Timeline UI with cluster detail, source filter, refresh
- [x] SEO files (robots.txt, sitemap.xml, llms.txt, meta tags)
- [x] Accessibility (skip link, semantic HTML, focus states, reduced motion)
- [x] Mobile responsive layout (overflow fixed)
- [x] Build passes (`npm run build`)
- [x] Typecheck passes (`tsc --noEmit`)
- [x] Lint passes (`eslint .`) — fixed 3 lint issues
- [x] Browser smoke test passes (dev + mobile)
- [x] Ingestion verified (46 articles, 42 clusters from live feeds)
- [x] API verification (all endpoints tested, source filtering works)
- [x] PROJECT_AUDIT.md created
- [x] FINAL_AUDIT.md created

## Files being worked on
scraper/, backend/, src/, migrations/0002_news_pulse.sql, public/

## Verified facts
- Build passes successfully with Vite + Nitro (Vercel preset)
- Typecheck passes with zero errors
- Lint passes after fixing 3 issues (cluster.ts, client.server.ts, use-current-user.ts)
- Browser smoke passes on desktop and mobile (no overflow, no console errors)
- Ingestion works: 46 articles from 4 sources, 42 clusters
- Node dependencies installed (433 packages)
- Database: Neon when DATABASE_URL set, else PGLite
- Auth off (public headlines only)
- 4 RSS sources: BBC, NPR, The Guardian, Al Jazeera
- Clustering: TF-IDF cosine (threshold 0.48) + rare keyword overlap (2+, DF ≤ 12%)
- TanStack Start on port 8080 (not Next.js due to host constraints)
- Old finance reference project (`agent_tools/`) is irrelevant and NOT used

## External dependencies
- Public RSS of BBC, NPR, The Guardian, Al Jazeera
- Article HTML pages (best-effort extract)

## Open issues
- Assessment PDF could not be read directly (file path not accessible to webfetch)
- Deployment not verified (requires Vercel credentials)
- Walkthrough video not produced (external to this environment)
- Python scraper not tested on Linux specifically (Windows environment tested data)

## Decisions
- Clustering: TF-IDF cosine + keyword-overlap assist (Option B)
- Similarity threshold: 0.48 cosine or 2+ shared rare title tokens
- Hosted ingest is TypeScript; Python is the Part 1 deliverable and an optional subprocess
- Auto-start ingest when the database is empty rather than shipping fake articles
- Four sources (three required)
- TanStack Start instead of Next.js (host constraints)
- Mobile timeline min-width reduced from 720px to 320px for responsive behavior

## Last verification
- commands: build PASS, typecheck PASS, lint PASS
- browser: PASS (desktop + mobile, no overflow, no console errors)
- API: PASS (all endpoints verified, source filtering works)
- ingest: PASS (46 articles, 42 clusters from live feeds)

## Next exact task
None — project is ready for submission.

## Update protocol
After each substantive task, update current phase/task, files, completed work, blockers, decisions, verification, and the next exact task. Keep this file compact.
