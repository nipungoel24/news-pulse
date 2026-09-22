# PRD.md

## Product
**Name:** News Pulse
**One-sentence description:** A topic-clustered live news timeline that pulls public RSS feeds, groups related stories, and plots each cluster as a time span.

## Problem
Headlines arrive as a flat firehose. Related coverage from different outlets is hard to see as one story unfolding over time.

## Target users
- Readers who want a compact view of what is being covered right now
- Reviewers of the Xponentium full-stack internship assessment

## Goals
- Ingest live articles from at least three public news RSS feeds
- Normalize inconsistent feed formats into one article schema
- Extract main article text when the page is reachable, and continue when it is not
- Group related articles into labeled topic clusters
- Serve clusters, articles, and timeline-shaped data over a REST API
- Plot clusters on a real time axis (span from earliest to latest article)
- Let the reader filter by source, inspect a cluster, and refresh data

## Primary conversion/action
Explore the live timeline, open a cluster, and read original coverage.

## Required pages
- [x] Home (timeline)
- [x] About / method (how grouping works)
- [x] Privacy
- [x] Terms
- [x] Custom 404
- [ ] Services / Work / Contact / Thank-you — not applicable (this is a news tool, not a marketing site)

## Features
- Multi-source RSS ingest (BBC, NPR, The Guardian, Al Jazeera)
- Deduped, re-runnable ingest
- TF-IDF cosine clustering with a keyword-overlap assist
- REST: `GET /clusters`, `GET /clusters/:id`, `GET /timeline`, `POST /ingest/trigger`, `GET /ingest/status/:jobId`
- Timeline visualization with cluster sizing by article count
- Cluster detail (headline, source, time, original link)
- Source filter
- Refresh-data control that polls job status
- Periodic timeline auto-refresh

## Content/assets available
- Public RSS feeds from the outlets listed above
- No supplied photography, testimonials, or third-party brand kits

## Integrations
- Public RSS over HTTPS
- Optional Python scraper subprocess; TypeScript pipeline is the hosted runtime
- Postgres (Neon in production, PGLite in preview)

## Non-goals
- User accounts or personalization
- Cross-outlet story merging as a solved NLP product (stretch only)
- Hosting a separate Next.js + Express process inside this sandbox
- Recording the required 2–3 minute walkthrough video (must be done by the submitter)

## Acceptance criteria
- At least three live RSS sources ingest without crashing the pipeline
- Repeated ingest does not insert the same URL twice
- Clusters have an id, a label, member articles, and published timestamps
- Timeline items expose start/end timestamps, article count, and an intensity metric
- Clicking a cluster shows its articles in chronological order
- Source filters hide clusters that no longer have a selected source
- Refresh triggers ingest and updates the view when the job completes
- Empty, loading, and error states are explicit
- Legal pages and a custom 404 exist
- No fabricated news, metrics, or testimonials
