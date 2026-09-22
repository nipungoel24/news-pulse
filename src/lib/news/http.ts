import { getCluster, getTimeline, httpErrorStatus, listClusters } from "@/lib/news/store";
import { jobStatus, triggerIngest } from "@/lib/news/jobs";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function fail(error: unknown) {
  const status = httpErrorStatus(error);
  const message = error instanceof Error ? error.message : "Unexpected error";
  if (status >= 500) console.error("[news api]", error);
  return json({ error: message }, status);
}

export async function handleListClusters(request: Request) {
  try {
    const sources = new URL(request.url).searchParams.get("sources");
    const clusters = await listClusters(sources);
    return json({ clusters });
  } catch (error) {
    return fail(error);
  }
}

export async function handleGetCluster(request: Request, id: string) {
  try {
    const sources = new URL(request.url).searchParams.get("sources");
    const cluster = await getCluster(id, sources);
    if (!cluster) return json({ error: "Cluster not found" }, 404);
    return json(cluster);
  } catch (error) {
    return fail(error);
  }
}

export async function handleTimeline(request: Request) {
  try {
    const sources = new URL(request.url).searchParams.get("sources");
    const timeline = await getTimeline(sources);
    return json(timeline);
  } catch (error) {
    return fail(error);
  }
}

export async function handleTriggerIngest() {
  try {
    const job = await triggerIngest();
    return json(job, 202);
  } catch (error) {
    return fail(error);
  }
}

export async function handleJobStatus(jobId: string) {
  try {
    const job = await jobStatus(jobId);
    if (!job) return json({ error: "Job not found" }, 404);
    return json(job);
  } catch (error) {
    return fail(error);
  }
}
