import { createFileRoute } from "@tanstack/react-router";
import { handleJobStatus } from "@/lib/news/http";

export const Route = createFileRoute("/ingest/status/$jobId")({
  server: {
    handlers: {
      GET: async ({ params }) => handleJobStatus(params.jobId),
    },
  },
});
