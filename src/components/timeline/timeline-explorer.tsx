import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ClusterDetail, type ClusterDetailData } from "@/components/timeline/cluster-detail";
import { NewsTimeline, type TimelineItem } from "@/components/timeline/news-timeline";
import { RefreshControl } from "@/components/timeline/refresh-control";
import { SourceFilter } from "@/components/timeline/source-filter";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCluster, fetchJob, fetchTimeline, startIngest } from "@/lib/news/queries";
import type { IngestJob } from "@backend/types.ts";

type TimelineResponse = {
  rangeStart: string | null;
  rangeEnd: string | null;
  generatedAt: string | null;
  sources: { id: string; name: string }[];
  items: TimelineItem[];
  ingesting: boolean;
  job: IngestJob | null;
  sourceCatalog: { id: string; name: string }[];
};

export function TimelineExplorer({ initial }: { initial: TimelineResponse }) {
  const queryClient = useQueryClient();
  const catalog = initial.sourceCatalog?.length ? initial.sourceCatalog : initial.sources;
  const [enabled, setEnabled] = useState(() => new Set(catalog.map((source) => source.id)));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(initial.job?.jobId ?? null);

  const timelineQuery = useQuery({
    queryKey: ["timeline"],
    queryFn: () => fetchTimeline({ data: {} }),
    initialData: initial,
    refetchInterval: 90_000,
  });

  const jobQuery = useQuery({
    queryKey: ["ingest-job", activeJobId],
    queryFn: async () => {
      const job = await fetchJob({ data: { jobId: activeJobId! } });
      if (job.status === "complete") {
        await queryClient.invalidateQueries({ queryKey: ["timeline"] });
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
  const items = useMemo(() => {
    const all = timelineQuery.data?.items ?? [];
    return all.filter((item) => item.sources.some((id) => enabled.has(id)));
  }, [timelineQuery.data?.items, enabled]);

  const running =
    refresh.isPending ||
    job?.status === "queued" ||
    job?.status === "running" ||
    Boolean(timelineQuery.data?.ingesting && items.length === 0);

  const detailQuery = useQuery({
    queryKey: ["cluster", selectedId, [...enabled].sort().join(",")],
    queryFn: () =>
      fetchCluster({
        data: { id: selectedId!, sources: [...enabled].join(",") },
      }),
    enabled: Boolean(selectedId),
  });

  function toggleSource(id: string) {
    setEnabled((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        if (next.size === 1) return current;
        next.delete(id);
      } else next.add(id);
      return next;
    });
  }

  const empty = !running && items.length === 0 && !timelineQuery.isLoading;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 border-b border-rule pb-4 sm:flex-row sm:items-end sm:justify-between">
          <SourceFilter sources={catalog} enabled={enabled} onToggle={toggleSource} />
          <RefreshControl job={job} busy={running} onRefresh={() => refresh.mutate()} />
        </div>
        {running && items.length === 0 ? (
          <div className="space-y-3" aria-busy="true">
            <p className="text-sm text-ink-muted">
              Fetching live RSS feeds and grouping related headlines.
            </p>
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-8 w-2/3" />
          </div>
        ) : null}
        {timelineQuery.isError ? (
          <p className="border border-oxblood px-4 py-3 text-sm text-oxblood">
            Could not load the timeline. Refresh and try again.
          </p>
        ) : null}
        {empty ? (
          <p className="border border-dashed border-rule px-4 py-10 text-center text-sm text-ink-muted">
            No stories yet. Use Refresh data to pull the latest feeds.
          </p>
        ) : null}
        {items.length > 0 ? (
          <NewsTimeline items={items} selectedId={selectedId} onSelect={setSelectedId} />
        ) : null}
      </div>
      <ClusterDetail
        cluster={(detailQuery.data as ClusterDetailData | undefined) ?? null}
        loading={detailQuery.isFetching}
        error={detailQuery.isError ? "Could not load this cluster." : null}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
