import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ClusterDetail, type ClusterDetailData } from "@/components/timeline/cluster-detail";
import { CoverageMap } from "@/components/timeline/coverage-map";
import { RefreshControl } from "@/components/timeline/refresh-control";
import { SourceFilter } from "@/components/timeline/source-filter";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchArticleEvents,
  fetchCluster,
  fetchJob,
  fetchTimeline,
  startIngest,
} from "@/lib/news/queries";
import type { IngestJob } from "@backend/types.ts";

type TimelineResponse = {
  rangeStart: string | null;
  rangeEnd: string | null;
  generatedAt: string | null;
  sources: { id: string; name: string }[];
  ingesting: boolean;
  job: IngestJob | null;
  sourceCatalog: { id: string; name: string }[];
};

export function TimelineExplorer({ initial }: { initial: TimelineResponse }) {
  const queryClient = useQueryClient();
  const catalog = initial.sourceCatalog?.length ? initial.sourceCatalog : initial.sources;
  const [enabled, setEnabled] = useState(() => new Set(catalog.map((s) => s.id)));
  // selectedClusterId: which cluster is selected (for detail panel)
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(initial.job?.jobId ?? null);

  // Timeline query (for job/ingest state)
  const timelineQuery = useQuery({
    queryKey: ["timeline"],
    queryFn: () => fetchTimeline({ data: {} }),
    initialData: initial,
    refetchInterval: 90_000,
  });

  // Article events query — the primary data for CoverageMap
  const eventsQuery = useQuery({
    queryKey: ["article-events"],
    queryFn: () => fetchArticleEvents({ data: {} }),
    initialData: [],
    refetchInterval: 90_000,
  });

  // Job polling
  const jobQuery = useQuery({
    queryKey: ["ingest-job", activeJobId],
    queryFn: async () => {
      const job = await fetchJob({ data: { jobId: activeJobId! } });
      if (job.status === "complete") {
        await queryClient.invalidateQueries({ queryKey: ["timeline"] });
        await queryClient.invalidateQueries({ queryKey: ["article-events"] });
      }
      return job;
    },
    enabled: Boolean(activeJobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "queued" || status === "running" ? 1500 : false;
    },
  });

  const refresh = useMutation({
    mutationFn: () => startIngest(),
    onSuccess: (job) => {
      setActiveJobId(job.jobId);
      queryClient.setQueryData(["ingest-job", job.jobId], job);
    },
  });

  const job = jobQuery.data ?? refresh.data ?? timelineQuery.data?.job ?? null;

  const running =
    refresh.isPending ||
    job?.status === "queued" ||
    job?.status === "running" ||
    Boolean(timelineQuery.data?.ingesting && eventsQuery.data?.length === 0);

  // Filter article events to enabled sources
  const filteredEvents = useMemo(() => {
    const all = eventsQuery.data ?? [];
    return all.filter((e) => enabled.has(e.sourceId));
  }, [eventsQuery.data, enabled]);

  // Cluster detail query — fires when user selects a cluster
  const detailQuery = useQuery({
    queryKey: ["cluster", selectedClusterId, [...enabled].sort().join(",")],
    queryFn: () =>
      fetchCluster({
        data: { id: selectedClusterId!, sources: [...enabled].join(",") },
      }),
    enabled: Boolean(selectedClusterId),
  });

  function toggleSource(id: string) {
    setEnabled((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        if (next.size === 1) return current; // always keep at least one source
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSelectCluster(clusterId: string | null) {
    setSelectedClusterId(clusterId);
  }

  const empty = !running && filteredEvents.length === 0 && !eventsQuery.isLoading;

  // Compute stats for empty state panel
  const totalArticles = filteredEvents.length;
  const totalClusters = new Set(filteredEvents.map((e) => e.clusterId)).size;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.7fr)]">
      {/* Left — timeline */}
      <div className="space-y-5">
        {/* Controls row */}
        <div className="flex flex-col gap-4 border-b border-rule pb-4 sm:flex-row sm:items-end sm:justify-between">
          <SourceFilter sources={catalog} enabled={enabled} onToggle={toggleSource} />
          <RefreshControl job={job} busy={running} onRefresh={() => refresh.mutate()} />
        </div>

        {/* Loading skeleton */}
        {running && filteredEvents.length === 0 && (
          <div className="space-y-0" aria-busy="true">
            <p className="mb-3 text-sm text-ink-muted">
              Fetching live RSS feeds and grouping related headlines…
            </p>
            <div className="border border-ink bg-paper-raised">
              <div className="flex items-center justify-between border-b border-rule px-4 py-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-32" />
              </div>
              {/* Lane skeletons */}
              {["BBC", "NPR", "GRDN", "AJ"].map((src) => (
                <div key={src} className="flex items-center gap-4 border-b border-rule/50 px-4" style={{ height: 60 }}>
                  <Skeleton className="h-3 w-10 shrink-0" />
                  <div className="flex flex-1 gap-6">
                    {[30, 55, 75, 88].map((pos) => (
                      <Skeleton key={pos} className="h-3 w-3 rounded-full" />
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-8 border-t border-rule/40 px-4 py-2">
                {[15, 35, 55, 75, 92].map((pos) => (
                  <Skeleton key={pos} className="h-2 w-10" />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {timelineQuery.isError && (
          <p className="border border-oxblood px-4 py-3 text-sm text-oxblood">
            Could not load the timeline. Refresh and try again.
          </p>
        )}

        {/* True empty (no data, not loading) */}
        {empty && (
          <p className="border border-dashed border-rule px-4 py-10 text-center text-sm text-ink-muted">
            No stories yet. Use{" "}
            <button
              type="button"
              className="underline underline-offset-2 hover:text-ink"
              onClick={() => refresh.mutate()}
            >
              Refresh data
            </button>{" "}
            to pull the latest feeds.
          </p>
        )}

        {/* Coverage Map — the primary visualization */}
        {filteredEvents.length > 0 && (
          <CoverageMap
            events={filteredEvents}
            sources={catalog.filter((s) => enabled.has(s.id))}
            selectedClusterId={selectedClusterId}
            onSelectCluster={handleSelectCluster}
          />
        )}
      </div>

      {/* Right — cluster detail panel */}
      <ClusterDetail
        cluster={(detailQuery.data as ClusterDetailData | undefined) ?? null}
        loading={detailQuery.isFetching}
        error={detailQuery.isError ? "Could not load this cluster." : null}
        onClose={() => setSelectedClusterId(null)}
        clusterCount={totalClusters || undefined}
        articleCount={totalArticles || undefined}
      />
    </div>
  );
}
