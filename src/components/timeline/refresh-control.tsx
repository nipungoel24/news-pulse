import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IngestJob } from "@backend/types.ts";

export function RefreshControl({
  job,
  busy,
  onRefresh,
}: {
  job: IngestJob | null;
  busy: boolean;
  onRefresh: () => void;
}) {
  const running = busy || job?.status === "queued" || job?.status === "running";
  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Button type="button" onClick={onRefresh} disabled={running} aria-busy={running}>
        <RefreshCw className={running ? "size-4 animate-spin" : "size-4"} />
        {running ? "Refreshing" : "Refresh data"}
      </Button>
      <p className="max-w-xs text-xs text-ink-muted" aria-live="polite">
        {running
          ? job?.message || "Fetching live feeds and regrouping stories."
          : job?.status === "failed"
            ? job.error || "Refresh failed. Try again."
            : job?.status === "complete"
              ? job.message
              : "Pulls the latest RSS items, then rebuilds clusters."}
      </p>
    </div>
  );
}
