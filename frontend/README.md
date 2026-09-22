# Frontend

React timeline explorer in `src/`. The assessment named Next.js; this host serves TanStack Start on the preview port.

- Timeline bars span earliest to latest article in a cluster
- Thickness follows article count
- Click a bar for headlines, source, time, original link
- Source toggles
- Refresh data calls `POST /ingest/trigger` and polls status
- Auto-refresh of `/timeline` every 90 seconds
