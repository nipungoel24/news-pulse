import { createFileRoute } from "@tanstack/react-router";
import { handleTriggerIngest } from "@/lib/news/http";

export const Route = createFileRoute("/api/ingest/trigger")({
  server: {
    handlers: {
      POST: async () => handleTriggerIngest(),
    },
  },
});
