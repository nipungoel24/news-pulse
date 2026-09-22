import { createFileRoute } from "@tanstack/react-router";
import { handleTimeline } from "@/lib/news/http";

export const Route = createFileRoute("/timeline")({
  server: {
    handlers: {
      GET: async ({ request }) => handleTimeline(request),
    },
  },
});
