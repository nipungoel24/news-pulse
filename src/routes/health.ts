import { createFileRoute } from "@tanstack/react-router";
import { handleHealthCheck } from "@/lib/news/http";

export const Route = createFileRoute("/health")({
  server: {
    handlers: {
      GET: async () => handleHealthCheck(),
    },
  },
});
