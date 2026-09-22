import { createFileRoute } from "@tanstack/react-router";
import { handleGetCluster } from "@/lib/news/http";

export const Route = createFileRoute("/clusters/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => handleGetCluster(request, params.id),
    },
  },
});
