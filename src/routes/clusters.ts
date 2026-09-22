import { createFileRoute } from "@tanstack/react-router";
import { handleListClusters } from "@/lib/news/http";

export const Route = createFileRoute("/clusters")({
  server: {
    handlers: {
      GET: async ({ request }) => handleListClusters(request),
    },
  },
});
