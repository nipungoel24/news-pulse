import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { FEEDS } from "@backend/feeds.ts";
import { getCluster, getTimeline, listClusters } from "@/lib/news/store";
import { ensureIngested, jobStatus, triggerIngest } from "@/lib/news/jobs";

const sourcesSchema = z
  .object({
    sources: z.string().optional(),
  })
  .optional();

export const fetchTimeline = createServerFn({ method: "GET" })
  .validator((input: unknown) => sourcesSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const ingest = await ensureIngested();
    const timeline = await getTimeline(data?.sources ?? null);
    return {
      ...timeline,
      ingesting: ingest ? ingest.status === "queued" || ingest.status === "running" : false,
      job: ingest,
      sourceCatalog: FEEDS.map((feed) => ({ id: feed.id, name: feed.name })),
    };
  });

export const fetchClusters = createServerFn({ method: "GET" })
  .validator((input: unknown) => sourcesSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    return { clusters: await listClusters(data?.sources ?? null) };
  });

export const fetchCluster = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z.object({ id: z.string().min(1).max(40), sources: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    const cluster = await getCluster(data.id, data.sources ?? null);
    if (!cluster) throw new Error("Cluster not found");
    return cluster;
  });

export const startIngest = createServerFn({ method: "POST" }).handler(async () => {
  return triggerIngest();
});

export const fetchJob = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ jobId: z.string().min(1).max(40) }).parse(input))
  .handler(async ({ data }) => {
    const job = await jobStatus(data.jobId);
    if (!job) throw new Error("Job not found");
    return job;
  });
